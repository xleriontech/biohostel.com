import { getEnvVar } from "./storage";
import { buildReservationEmail, type ReservationEmailKind } from "./email-templates";
import { sendEmail } from "./mailer";
import type { StoredReservation } from "./store";

export type NotificationStatus = "enviado" | "no_configurado" | "fallido";

// Envía el correo de la reserva si RESEND_API_KEY está configurada.
// Nunca lanza: el resultado se devuelve al llamador.
export async function notifyReservation(reservation: StoredReservation, kind: ReservationEmailKind): Promise<NotificationStatus> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  if (!apiKey || !reservation.guestEmail) return "no_configurado";

  const base = (getEnvVar("SITE_URL") || "https://biohostels.com").replace(/\/+$/, "");
  const mail = buildReservationEmail(
    {
      code: reservation.code,
      listingTitle: reservation.listingTitle,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      guests: reservation.guests,
      total: reservation.total,
      holdUntil: reservation.holdUntil,
      payUrl: reservation.payment?.status === "pendiente" ? reservation.payment.checkoutUrl : undefined,
      statusUrl: `${base}/reserva/${encodeURIComponent(reservation.code)}`,
    },
    kind,
  );

  return sendEmail({
    apiKey,
    from: getEnvVar("MAIL_FROM", "Biohostels <reservas@biohostels.com>"),
    to: reservation.guestEmail,
    ...mail,
  });
}
