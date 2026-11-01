import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { StoredReservation } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";
import { updateTable } from "@/lib/storage";
import { checkAvailability } from "@/lib/booking-engine";
import { notifyReservation } from "@/lib/notifications";

type AdminOutcome = { reservation: StoredReservation } | { conflict: string };

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ reservations: await store.reservations() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, status } = await req.json().catch(() => ({}));
  if (!["confirmada", "cancelada"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const [listings, channels] = await Promise.all([store.listings(), store.listingChannels()]);
  let updated: AdminOutcome | null = null;
  try {
    updated = await updateTable<StoredReservation, AdminOutcome | null>("reservations", () => [], (rows) => {
      const index = rows.findIndex((r) => r.id === id);
      if (index < 0) return null;
      const reservation = rows[index];
      if (status === "confirmada" && reservation.status !== "confirmada") {
        const listing = listings.find((l) => l.id === reservation.listingId);
        if (!listing) return { rows, result: { conflict: "El alojamiento ya no existe." } };
        const others = rows.filter((r) => r.id !== reservation.id);
        if (!checkAvailability(listing, channels, others, reservation.checkIn, reservation.checkOut).available) {
          return { rows, result: { conflict: "Las fechas ya están ocupadas. No se puede reactivar sin liberar el conflicto." } };
        }
      }
      reservation.status = status;
      reservation.holdUntil = undefined;
      if (status === "confirmada" && (reservation.payment?.status === "pendiente" || reservation.payment?.status === "rechazado")) {
        reservation.payment = {
          provider: "manual",
          status: "aprobado",
          reference: reservation.payment.reference,
          method: "manual",
          amountInCents: reservation.payment.amountInCents,
          updatedAt: new Date().toISOString(),
        };
      }
      if (status === "cancelada" && reservation.payment?.status === "pendiente") {
        reservation.payment = { ...reservation.payment, status: "expirado", updatedAt: new Date().toISOString() };
      }
      rows[index] = reservation;
      return { rows, result: { reservation } };
    });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la reserva." }, { status: 503 });
  }
  if (!updated) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if ("conflict" in updated) return NextResponse.json({ error: updated.conflict }, { status: 409 });

  const email = await notifyReservation(updated.reservation, status === "cancelada" ? "cancelada" : "pagada").catch(() => "fallido");
  return NextResponse.json({ ok: true, reservation: updated.reservation, email });
}
