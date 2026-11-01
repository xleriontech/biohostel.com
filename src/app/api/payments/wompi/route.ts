import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { StoredReservation } from "@/lib/store";
import { getEnvVar, updateTable } from "@/lib/storage";
import { checkAvailability } from "@/lib/booking-engine";
import { paymentOutcome, verifyWompiEvent, wompiConfig } from "@/lib/payments";
import { notifyReservation } from "@/lib/notifications";

type WompiTransaction = {
  id?: string;
  status?: string;
  reference?: string;
  amount_in_cents?: number;
  currency?: string;
  payment_method_type?: string;
};

type WompiEvent = {
  event?: string;
  data?: { transaction?: WompiTransaction };
  signature?: { checksum?: string; properties?: unknown };
  timestamp?: number | string;
};

// Webhook de Wompi: verifica firma, monto y moneda antes de confirmar la reserva.
export async function POST(req: Request) {
  const config = wompiConfig({
    WOMPI_PUBLIC_KEY: getEnvVar("WOMPI_PUBLIC_KEY"),
    WOMPI_INTEGRITY_SECRET: getEnvVar("WOMPI_INTEGRITY_SECRET"),
    WOMPI_EVENTS_SECRET: getEnvVar("WOMPI_EVENTS_SECRET"),
    WOMPI_CHECKOUT_URL: getEnvVar("WOMPI_CHECKOUT_URL"),
  });
  if (!config) {
    return NextResponse.json({ error: "Los pagos en línea no están configurados." }, { status: 503 });
  }

  const raw = await req.text();
  let payload: WompiEvent;
  try {
    payload = JSON.parse(raw) as WompiEvent;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!(await verifyWompiEvent(config, payload))) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }
  if (payload.event !== "transaction.updated") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const tx = payload.data?.transaction;
  const reference = String(tx?.reference ?? "").trim();
  if (!reference) return NextResponse.json({ ok: true, ignored: true });

  const [reservations, listings, channels] = await Promise.all([
    store.reservations(),
    store.listings(),
    store.listingChannels(),
  ]);
  const reservation = reservations.find((r) => r.code === reference);
  if (!reservation) {
    // Se responde 200 para que Wompi no reintente un evento de otro entorno.
    return NextResponse.json({ ok: false, message: "Reserva no encontrada." });
  }
  const listing = listings.find((l) => l.id === reservation.listingId);

  if (String(tx?.currency ?? "COP") !== "COP" || Number(tx?.amount_in_cents) !== Math.round(reservation.total) * 100) {
    return NextResponse.json({ ok: false, message: "El monto o la moneda no coinciden con la reserva." });
  }

  const outcome = paymentOutcome(String(tx?.status ?? ""));
  if (outcome === "pendiente") {
    return NextResponse.json({ ok: true, status: "pendiente" });
  }

  const nextStatus = outcome === "aprobado" ? "confirmada" : "cancelada";
  let changed = false;
  let latePayment = false;
  let updated: StoredReservation | null = null;
  try {
    updated = await updateTable<StoredReservation, StoredReservation | null>("reservations", () => [], (rows) => {
      const index = rows.findIndex((r) => r.id === reservation.id);
      if (index < 0) return null;
      const current = rows[index];
      const sameTransaction = current.payment?.transactionId === tx?.id;

      if (sameTransaction && current.status === nextStatus) {
        return { rows, result: current };
      }
      // Un evento tardío de un pago ya marcado como aprobado no debe reconfirmar.
      if (sameTransaction && outcome === "aprobado" && current.payment?.status === "aprobado" && current.status === "cancelada") {
        return { rows, result: current };
      }

      // Si el pago llega cuando la retención venció o las fechas ya se
      // re-vendieron, no se puede confirmar: se libera la reserva y se
      // conserva el pago para gestionar el reembolso manualmente.
      if (outcome === "aprobado" && current.status !== "confirmada") {
        const others = rows.filter((r) => r.id !== current.id);
        const canConfirm = current.status === "pendiente_pago" && !!listing &&
          checkAvailability(listing, channels, others, current.checkIn, current.checkOut).available;
        if (!canConfirm) {
          latePayment = true;
          current.status = "cancelada";
          current.holdUntil = undefined;
          current.payment = {
            provider: "wompi",
            status: "aprobado",
            reference,
            transactionId: typeof tx?.id === "string" ? tx.id : undefined,
            method: typeof tx?.payment_method_type === "string" ? tx.payment_method_type : undefined,
            amountInCents: Number(tx?.amount_in_cents) || undefined,
            checkoutUrl: current.payment?.checkoutUrl,
            updatedAt: new Date().toISOString(),
          };
          rows[index] = current;
          changed = true;
          return { rows, result: current };
        }
      }

      current.status = nextStatus;
      current.holdUntil = undefined;
      current.payment = {
        provider: "wompi",
        status: outcome,
        reference,
        transactionId: typeof tx?.id === "string" ? tx.id : undefined,
        method: typeof tx?.payment_method_type === "string" ? tx.payment_method_type : undefined,
        amountInCents: Number(tx?.amount_in_cents) || undefined,
        checkoutUrl: current.payment?.checkoutUrl,
        updatedAt: new Date().toISOString(),
      };
      rows[index] = current;
      changed = true;
      return { rows, result: current };
    });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la reserva." }, { status: 503 });
  }

  if (!updated) return NextResponse.json({ ok: false, message: "Reserva no encontrada." });
  if (changed) {
    await notifyReservation(updated, latePayment ? "pago_tardio" : outcome === "aprobado" ? "pagada" : "pago_rechazado").catch(() => "fallido");
  }
  return NextResponse.json({ ok: true, status: updated.status, payment: updated.payment?.status, latePayment });
}
