import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import type { StoredReservation } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";
import { rateLimit } from "@/lib/security";
import { getEnvVar, updateTable } from "@/lib/storage";
import {
  checkAvailability,
  findAlternatives,
  quoteFor,
  validateStay,
  type Alternative,
  type ConflictSource,
} from "@/lib/booking-engine";
import { commissionRateFor } from "@/lib/booking-service";
import { appendConsent, newConsentRecord, requestMeta } from "@/lib/consent";
import { amountInCents, buildCheckoutUrl, siteBaseUrl, wompiConfig } from "@/lib/payments";
import { syncListingChannels } from "@/lib/channel-sync";
import { notifyReservation } from "@/lib/notifications";

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

type Outcome = {
  reservation?: StoredReservation;
  idempotent?: boolean;
  conflict?: ConflictSource[];
  alternatives?: Alternative[];
};

type PatchOutcome = { reservation: StoredReservation } | { conflict: string } | { forbidden: string };

// GET: mis reservas como huésped + las recibidas como anfitrión
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const all = await store.reservations();
  const mine = all.filter((r) => r.guestId === me.id);
  const received = all.filter((r) => r.hostId === me.id);
  return NextResponse.json({ mine, received });
}

// POST: crea reserva con verificación y bloqueo atómico
export async function POST(req: Request) {
  const me = await currentUser();
  const clientKey = req.headers.get("x-forwarded-for") || (me?.id ?? "anon");
  if (!rateLimit(`res-${clientKey}`, 3, 60000)) {
    return NextResponse.json({ error: "Demasiadas reservas. Intenta en 1 min." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const listingId = clean(body.listingId, 120);
  const checkIn = clean(body.checkIn, 10);
  const checkOut = clean(body.checkOut, 10);
  const guests = Math.trunc(Number(body.guests) || 1);
  const nombre = clean(body.nombre, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const requestId = clean(body.requestId, 100);
  const sourceRaw = clean(body.source, 20);
  const source = ["micrositio", "panel", "api"].includes(sourceRaw) ? sourceRaw : "api";
  const registrado = !!me;

  if (!listingId) return NextResponse.json({ error: "Falta el alojamiento." }, { status: 400 });
  if (!registrado) {
    if (!nombre) return NextResponse.json({ error: "Debes indicar tu nombre." }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ error: "Debes indicar un correo válido." }, { status: 400 });
    if (!telefono) return NextResponse.json({ error: "Debes colocar tu teléfono para confirmar la reserva sin cuenta." }, { status: 400 });
    if (body.consent !== true) {
      return NextResponse.json(
        { error: "Debes autorizar el tratamiento de tus datos para reservar sin cuenta (Ley 1581 de 2012)." },
        { status: 400 },
      );
    }
  }

  const listings = await store.listings();
  const listing = listings.find((x) => x.id === listingId && x.active !== false);
  if (!listing) return NextResponse.json({ error: "Alojamiento no disponible." }, { status: 404 });

  const issues = validateStay(listing, checkIn, checkOut, guests);
  if (issues.length) {
    return NextResponse.json({ error: issues[0].message, issues }, { status: 400 });
  }

  // Refresca calendarios externos vencidos antes de calcular disponibilidad.
  await syncListingChannels(listing.id, { timeoutMs: 2500, limit: 2 }).catch(() => 0);

  const channels = await store.listingChannels();
  const rateFor = await commissionRateFor();
  const quote = quoteFor(listing, checkIn, checkOut, guests, registrado, rateFor(listing));
  const extrasSel = { seguro: !!body.extras?.seguro, desayuno: !!body.extras?.desayuno };
  const extrasTotal = (extrasSel.seguro ? Math.round(quote.base * 0.05) : 0) + (extrasSel.desayuno ? 20000 : 0);
  const total = quote.base + quote.commission + extrasTotal;
  const guestId = me ? me.id : "guest-temp";
  const guestName = me ? me.name : nombre;
  const guestEmail = me ? me.email : email;
  const consentRecord = body.consent === true
    ? newConsentRecord({ kind: "reserva", userId: me?.id, email: guestEmail, ...requestMeta(req) })
    : null;
  const code = "BIO-" + Date.now().toString(36).toUpperCase().slice(-6);
  const createdAt = new Date().toISOString();
  const channelCount = channels.filter((c) => c.listingId === listing.id).length;

  // Pago en línea: si Wompi está configurado, la reserva nace retenida y se
  // confirma con el webhook. Sin llaves, el pago se coordina con el anfitrión.
  const wompi = wompiConfig({
    WOMPI_PUBLIC_KEY: getEnvVar("WOMPI_PUBLIC_KEY"),
    WOMPI_INTEGRITY_SECRET: getEnvVar("WOMPI_INTEGRITY_SECRET"),
    WOMPI_EVENTS_SECRET: getEnvVar("WOMPI_EVENTS_SECRET"),
    WOMPI_CHECKOUT_URL: getEnvVar("WOMPI_CHECKOUT_URL"),
  });
  const paymentRequired = !!wompi;
  const amount = amountInCents(total);
  const baseUrl = siteBaseUrl(getEnvVar("SITE_URL"), new URL(req.url).origin);
  let checkoutUrl: string | null = null;
  if (wompi) {
    try {
      checkoutUrl = await buildCheckoutUrl(wompi, {
        reference: code,
        amountInCents: amount,
        redirectUrl: `${baseUrl}/reserva/${code}`,
        customerEmail: guestEmail,
        customerName: guestName,
      });
    } catch {
      return NextResponse.json({ error: "No se pudo iniciar el pago en línea. Intenta de nuevo." }, { status: 503 });
    }
  }
  const holdUntil = paymentRequired ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : undefined;

  let outcome: Outcome | null = null;
  try {
    outcome = await updateTable<StoredReservation, Outcome>("reservations", () => [], (rows) => {
      if (requestId) {
        const existing = rows.find(
          (r) =>
            r.requestId === requestId &&
            r.guestId === guestId &&
            (registrado || r.guestEmail === guestEmail),
        );
        if (existing) return { rows, result: { reservation: existing, idempotent: true } };
      }

      const check = checkAvailability(listing, channels, rows, checkIn, checkOut);
      if (!check.available) {
        return {
          rows,
          result: {
            conflict: check.conflicts,
            alternatives: findAlternatives({
              listing,
              listings,
              channels,
              reservations: rows,
              checkIn,
              checkOut,
              guests,
              registrado,
              rateFor,
            }),
          },
        };
      }

      const reservation: StoredReservation = {
        id: uid("res"),
        code,
        listingId: listing.id,
        listingTitle: listing.titulo,
        guestId,
        guestName,
        hostId: listing.ownerId,
        checkIn,
        checkOut,
        guests,
        base: quote.base,
        commission: quote.commission,
        rate: quote.rate,
        extras: extrasSel,
        extrasTotal,
        total,
        status: paymentRequired ? "pendiente_pago" : "confirmada",
        aiReport: paymentRequired
          ? `Retención de ${quote.nights} noche(s) durante 30 minutos mientras se completa el pago en Wompi${channelCount ? `; ${channelCount} canal(es) iCal cruzados` : ""}. Si el pago no se aprueba, las fechas se liberan.`
          : `Verificación: ${quote.nights} noche(s) libres en Biohostels${channelCount ? ` y ${channelCount} canal(es) iCal` : ""}. Bloqueo interno confirmado; el feed iCal te permite exportar el bloqueo a Booking o Airbnb.`,
        guestEmail,
        guestPhone: telefono || undefined,
        source,
        requestId: requestId || undefined,
        consentVersion: consentRecord?.policyVersion,
        consentAt: consentRecord?.acceptedAt,
        consentIp: consentRecord?.ip,
        consentUserAgent: consentRecord?.userAgent,
        createdAt,
        holdUntil,
        payment: paymentRequired
          ? {
              provider: "wompi",
              status: "pendiente",
              reference: code,
              checkoutUrl: checkoutUrl ?? undefined,
              amountInCents: amount,
              updatedAt: createdAt,
            }
          : { provider: "manual", status: "no_aplica", updatedAt: createdAt },
      };
      return { rows: [reservation, ...rows], result: { reservation } };
    });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar la reserva. Intenta de nuevo." }, { status: 503 });
  }

  if (!outcome) return NextResponse.json({ error: "No se pudo registrar la reserva." }, { status: 500 });
  if (consentRecord && outcome.reservation && !outcome.idempotent) {
    await appendConsent(consentRecord);
  }
  if (outcome.conflict) {
    const detail = outcome.conflict.map((c) => `${c.platform} [${c.dates.join(", ")}]`).join(" · ");
    const first = outcome.alternatives?.[0];
    return NextResponse.json(
      {
        error: "Fechas ocupadas",
        aiReport: `Ocupación detectada: ${detail}.`,
        conflicts: outcome.conflict,
        alternatives: outcome.alternatives ?? [],
        sugerencia: first
          ? first.kind === "fechas"
            ? `Prueba del ${first.checkIn} al ${first.checkOut} en el mismo alojamiento.`
            : `Prueba "${first.titulo}" en ${first.ciudad}, con disponibilidad para tus fechas.`
          : "Prueba otras fechas o consulta otro alojamiento en la misma ciudad.",
      },
      { status: 409 },
    );
  }

  const reservation = outcome.reservation!;
  let payUrl = reservation.payment?.checkoutUrl ?? null;
  if (wompi && reservation.status === "pendiente_pago" && !payUrl) {
    payUrl = await buildCheckoutUrl(wompi, {
      reference: reservation.code,
      amountInCents: amountInCents(reservation.total),
      redirectUrl: `${baseUrl}/reserva/${reservation.code}`,
      customerEmail: reservation.guestEmail,
      customerName: reservation.guestName,
    }).catch(() => null);
  }
  let emailStatus: string = "no_configurado";
  if (!outcome.idempotent) {
    emailStatus = await notifyReservation(reservation, paymentRequired ? "pendiente" : "confirmada").catch(() => "fallido");
  }

  return NextResponse.json({
    reservation,
    idempotent: outcome.idempotent ?? false,
    feedUrl: `/api/calendar/${listing.id}`,
    payment: {
      required: paymentRequired,
      status: reservation.payment?.status ?? "no_aplica",
      url: payUrl,
      holdUntil: reservation.holdUntil ?? null,
    },
    email: emailStatus,
  });
}

// PATCH: confirmar/cancelar (huésped cancela la suya, anfitrión gestiona las recibidas)
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { id, status, markPaid } = await req.json().catch(() => ({}));
  if (!["confirmada", "cancelada"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const [listings, channels] = await Promise.all([store.listings(), store.listingChannels()]);
  let updated: PatchOutcome | null = null;
  try {
    updated = await updateTable<StoredReservation, PatchOutcome | null>("reservations", () => [], (rows) => {
      const index = rows.findIndex((r) => r.id === id);
      if (index < 0) return null;
      const reservation = rows[index];
      const isHost = reservation.hostId === me.id;
      const isGuest = reservation.guestId === me.id;
      if (!isHost && !isGuest) return null;
      const isAdmin = me.role === "admin";
      if (status === "confirmada" && !isHost && !isAdmin) {
        return { rows, result: { forbidden: "Solo el anfitrión puede confirmar la reserva." } };
      }
      if (markPaid === true && !isHost && !isAdmin) {
        return { rows, result: { forbidden: "Solo el anfitrión puede registrar el pago." } };
      }

      if (status === "confirmada" && reservation.status !== "confirmada") {
        const listing = listings.find((l) => l.id === reservation.listingId);
        if (!listing) return { rows, result: { conflict: "El alojamiento ya no existe." } };
        const others = rows.filter((r) => r.id !== reservation.id);
        if (!checkAvailability(listing, channels, others, reservation.checkIn, reservation.checkOut).available) {
          return { rows, result: { conflict: "Las fechas ya están ocupadas. No se puede reactivar sin liberar el conflicto." } };
        }
      }

      reservation.status = status;
      if (status === "cancelada") {
        reservation.holdUntil = undefined;
        if (reservation.payment?.status === "pendiente") {
          reservation.payment = { ...reservation.payment, status: "expirado", updatedAt: new Date().toISOString() };
        }
      } else {
        reservation.holdUntil = undefined;
        if (reservation.payment?.status === "pendiente" || reservation.payment?.status === "rechazado") {
          reservation.payment = {
            provider: markPaid === true ? "manual" : reservation.payment.provider,
            status: markPaid === true ? "aprobado" : reservation.payment.status,
            reference: reservation.payment.reference,
            method: markPaid === true ? "manual" : reservation.payment.method,
            amountInCents: reservation.payment.amountInCents,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      rows[index] = reservation;
      return { rows, result: { reservation } };
    });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la reserva." }, { status: 503 });
  }

  if (!updated) {
    const all = await store.reservations();
    const exists = all.some((r) => r.id === id);
    return NextResponse.json({ error: exists ? "Sin permiso." : "No existe." }, { status: exists ? 403 : 404 });
  }
  if ("conflict" in updated) return NextResponse.json({ error: updated.conflict }, { status: 409 });
  if ("forbidden" in updated) return NextResponse.json({ error: updated.forbidden }, { status: 403 });
  const email = await notifyReservation(
    updated.reservation,
    status === "cancelada" ? "cancelada" : markPaid === true ? "pagada" : "confirmada",
  ).catch(() => "fallido");
  return NextResponse.json({ reservation: updated.reservation, email });
}
