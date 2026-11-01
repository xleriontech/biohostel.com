import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { reservationHoldExpired } from "@/lib/booking-engine";
import { StatusRefresher } from "./status-refresher";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Estado de tu reserva · Biohostels.com",
  robots: { index: false, follow: false },
};

const money = (value: number) => `$${Math.round(value).toLocaleString("es-CO")} COP`;

function longDate(iso: string) {
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(d)} ${months[Number(m) - 1] ?? m} ${y}`;
}

function holdLabel(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const tone: Record<string, { bg: string; border: string; text: string }> = {
  ok: { bg: "#eef7ea", border: "#cfe6c8", text: "#14532d" },
  warn: { bg: "#fff7e6", border: "#f3d9a4", text: "#7c4a03" },
  bad: { bg: "#fdeae9", border: "#f5bcbc", text: "#7f1d1d" },
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ReservationStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const wanted = safeDecode(code).trim().toLowerCase();
  const [reservations, listings] = await Promise.all([store.reservations(), store.listings()]);
  const reservation = reservations.find((r) => r.code.toLowerCase() === wanted);
  if (!reservation) notFound();

  const expired = reservationHoldExpired(reservation) || (reservation.status === "pendiente_pago" && reservation.payment?.status === "expirado");
  const pending = reservation.status === "pendiente_pago" && !expired;
  const listing = listings.find((l) => l.id === reservation.listingId);
  const listingHref = listing ? `/p/${listing.slug || listing.id}` : "/";

  const label = reservation.status === "confirmada"
    ? "Reserva confirmada"
    : pending
      ? "Pago pendiente"
      : expired
        ? "Retención vencida"
        : reservation.payment?.status === "rechazado"
          ? "Pago rechazado"
          : "Reserva cancelada";
  const palette = reservation.status === "confirmada" ? tone.ok : pending ? tone.warn : tone.bad;
  const checkoutUrl = pending ? reservation.payment?.checkoutUrl : undefined;
  const statusLine = reservation.status === "confirmada"
    ? "Las fechas quedaron bloqueadas en Biohostels.com. Si el alojamiento tiene canales iCal conectados, el bloqueo se exporta en el feed del anfitrión."
    : pending
      ? `Estamos esperando la confirmación del pago.${reservation.holdUntil ? ` Las fechas están retenidas hasta las ${holdLabel(reservation.holdUntil)}.` : ""}`
      : expired
        ? "No completaste el pago dentro del tiempo de retención, así que las fechas se liberaron. Puedes volver a reservar."
        : "La reserva fue cancelada y las fechas se liberaron.";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "28px 18px", fontFamily: "var(--sans, -apple-system, Segoe UI, Roboto, sans-serif)" }}>
      <StatusRefresher active={pending} />
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-block", marginBottom: 18, color: "var(--green)", fontWeight: 800, textDecoration: "none" }}>
          ← Biohostels.com
        </Link>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, padding: 26, boxShadow: "0 10px 30px rgba(26,46,34,0.07)" }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>Estado de la reserva</p>
          <h1 style={{ margin: "6px 0 4px", fontSize: "1.9rem", color: "var(--green-deep)", letterSpacing: "-0.5px" }}>{reservation.code}</h1>
          <div style={{ display: "inline-block", padding: "7px 11px", borderRadius: 99, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.text, fontWeight: 800, fontSize: 13, marginTop: 6 }}>
            {label}
          </div>
          <p style={{ margin: "14px 0 18px", color: "var(--ink)", fontSize: 14.5, lineHeight: 1.6 }}>{statusLine}</p>

          <div style={{ borderTop: "1px solid var(--line)", display: "grid", gap: 10, paddingTop: 14, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "var(--muted)" }}>Alojamiento</span>
              <strong style={{ textAlign: "right", color: "var(--ink)" }}>{reservation.listingTitle}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "var(--muted)" }}>Fechas</span>
              <strong style={{ color: "var(--ink)" }}>{longDate(reservation.checkIn)} → {longDate(reservation.checkOut)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "var(--muted)" }}>Huéspedes</span>
              <strong style={{ color: "var(--ink)" }}>{reservation.guests}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "var(--muted)" }}>Total</span>
              <strong style={{ color: "var(--ink)" }}>{money(reservation.total)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "var(--muted)" }}>Pago</span>
              <strong style={{ color: "var(--ink)" }}>
                {reservation.payment?.status === "aprobado"
                  ? `Aprobado${reservation.payment.method ? ` · ${reservation.payment.method}` : ""}`
                  : reservation.payment?.status === "no_aplica"
                    ? "Coordinado con el anfitrión"
                    : pending
                      ? "Pendiente"
                      : reservation.payment?.status === "rechazado"
                        ? "Rechazado"
                        : "No completado"}
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            {checkoutUrl && (
              <a href={checkoutUrl} className="btn-green" style={{ textDecoration: "none", fontWeight: 800, padding: "12px 18px", borderRadius: 9 }}>
                Pagar ahora
              </a>
            )}
            <Link href={listingHref} style={{ border: "1px solid var(--line)", color: "var(--green)", textDecoration: "none", fontWeight: 700, padding: "12px 18px", borderRadius: 9 }}>
              {expired || reservation.status === "cancelada" ? "Reservar de nuevo" : "Ver alojamiento"}
            </Link>
          </div>
          {pending && (
            <p style={{ margin: "16px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
              Esta página se actualiza sola cuando Wompi confirma el pago. Guarda el código {reservation.code}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
