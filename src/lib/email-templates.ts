// Plantillas de correo transaccional. Funciones puras y sin dependencias.

export type ReservationEmailData = {
  code: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  holdUntil?: string;
  payUrl?: string;
  statusUrl: string;
};

export type ReservationEmailKind = "pendiente" | "pagada" | "confirmada" | "cancelada" | "pago_rechazado" | "pago_tardio";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number): string {
  try {
    return `$${new Intl.NumberFormat("es-CO").format(Math.round(value))} COP`;
  } catch {
    return `$${Math.round(value)} COP`;
  }
}

function longDate(iso: string): string {
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(d)} ${months[Number(m) - 1] ?? m} ${y}`;
}

function holdTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const TITLES: Record<ReservationEmailKind, string> = {
  pendiente: "Completa el pago de tu reserva",
  pagada: "Pago aprobado: reserva confirmada",
  confirmada: "Reserva confirmada",
  cancelada: "Reserva cancelada",
  pago_rechazado: "El pago de tu reserva no se completó",
  pago_tardio: "Pago recibido: necesitamos contactarte",
};

export function buildReservationEmail(data: ReservationEmailData, kind: ReservationEmailKind): { subject: string; text: string; html: string } {
  const subject = `${data.code} · ${TITLES[kind]} · Biohostels`;
  const dates = `${longDate(data.checkIn)} → ${longDate(data.checkOut)}`;
  const intro: Record<ReservationEmailKind, string> = {
    pendiente: `Recibimos tu solicitud. Las fechas quedan bloqueadas temporalmente${data.holdUntil ? ` hasta las ${holdTime(data.holdUntil)}` : ""}; si el pago no se completa, se liberan.`,
    pagada: "Wompi confirmó el pago. Tu reserva quedó confirmada y las fechas bloqueadas en Biohostels.",
    confirmada: "Tu reserva quedó confirmada. El anfitrión coordinará contigo el pago y los detalles de llegada.",
    cancelada: "La reserva fue cancelada y las fechas se liberaron en Biohostels.",
    pago_rechazado: "El pago no se completó y la reserva fue cancelada. Puedes intentarlo de nuevo desde el alojamiento.",
    pago_tardio: "Recibimos tu pago, pero la retención ya había vencido o las fechas dejaron de estar disponibles. No vamos a duplicar la reserva: te contactaremos para gestionar el reembolso.",
  };
  const cta = kind === "pendiente" && data.payUrl ? { label: "Pagar ahora", url: data.payUrl } : { label: "Ver mi reserva", url: data.statusUrl };

  const lines = [
    intro[kind],
    "",
    `Código: ${data.code}`,
    `Alojamiento: ${data.listingTitle}`,
    `Fechas: ${dates}`,
    `Huéspedes: ${data.guests}`,
    `Total: ${money(data.total)}`,
    "",
    `${cta.label}: ${cta.url}`,
    "",
    "Biohostels · Reservas con calendarios conectados",
  ];

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e1d5;border-radius:16px;overflow:hidden">
<tr><td style="padding:20px 24px;background:#1b4d3e;color:#ffffff;font-weight:800;font-size:18px">Biohostels<span style="color:#00c9a7">.com</span></td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#4a4a4a">${escapeHtml(TITLES[kind])}</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#1b4d3e">${escapeHtml(data.code)}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#1a1a1a">${escapeHtml(intro[kind])}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1a1a1a;border-top:1px solid #e6e1d5">
<tr><td style="padding:10px 0;color:#4a4a4a">Alojamiento</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapeHtml(data.listingTitle)}</td></tr>
<tr><td style="padding:10px 0;color:#4a4a4a">Fechas</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapeHtml(dates)}</td></tr>
<tr><td style="padding:10px 0;color:#4a4a4a">Huéspedes</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapeHtml(data.guests)}</td></tr>
<tr><td style="padding:10px 0;color:#4a4a4a">Total</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapeHtml(money(data.total))}</td></tr>
</table>
<p style="margin:22px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#1b4d3e;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 20px;border-radius:9px">${escapeHtml(cta.label)}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f4f2ec;color:#4a4a4a;font-size:12px;line-height:1.5">Recibes este correo porque reservaste en Biohostels.com. Si no reconoces la reserva, responde a este mensaje.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, text: lines.join("\n"), html };
}
