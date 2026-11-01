// Envío de correo con Resend. Sin API key el sistema no envía y lo reporta
// como "no_configurado" en lugar de fingir éxito.

export type MailPayload = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(payload: MailPayload): Promise<"enviado" | "fallido"> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${payload.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? "enviado" : "fallido";
  } catch {
    return "fallido";
  }
}
