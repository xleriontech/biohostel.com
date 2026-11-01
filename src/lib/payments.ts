// Integración Wompi (Web Checkout + eventos). Módulo puro: recibe la configuración
// desde variables de entorno para poder probarse sin el runtime de Cloudflare.

export type WompiConfig = {
  publicKey: string;
  integritySecret: string;
  eventsSecret: string;
  checkoutUrl: string;
};

export type WompiEnv = {
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_INTEGRITY_SECRET?: string;
  WOMPI_EVENTS_SECRET?: string;
  WOMPI_CHECKOUT_URL?: string;
};

export type CheckoutInput = {
  reference: string;
  amountInCents: number;
  redirectUrl: string;
  customerEmail?: string;
  customerName?: string;
};

export type PaymentOutcome = "aprobado" | "rechazado" | "expirado" | "pendiente";

const DEFAULT_CHECKOUT = "https://checkout.wompi.co/p/";

export function wompiConfig(env: WompiEnv): WompiConfig | null {
  const publicKey = String(env.WOMPI_PUBLIC_KEY ?? "").trim();
  const integritySecret = String(env.WOMPI_INTEGRITY_SECRET ?? "").trim();
  const eventsSecret = String(env.WOMPI_EVENTS_SECRET ?? "").trim();
  if (!publicKey || !integritySecret || !eventsSecret) return null;
  return {
    publicKey,
    integritySecret,
    eventsSecret,
    checkoutUrl: String(env.WOMPI_CHECKOUT_URL ?? DEFAULT_CHECKOUT).trim() || DEFAULT_CHECKOUT,
  };
}

export function amountInCents(totalCop: number): number {
  return Math.max(0, Math.round(Number(totalCop) || 0) * 100);
}

export function siteBaseUrl(configured: string | undefined, requestOrigin: string): string {
  const candidate = String(configured ?? "").trim() || requestOrigin;
  return candidate.replace(/\/+$/, "");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Firma de integridad de Web Checkout: referencia + monto + moneda + secreto.
export async function integritySignature(config: WompiConfig, input: Pick<CheckoutInput, "reference" | "amountInCents">, currency = "COP"): Promise<string> {
  return sha256Hex(`${input.reference}${input.amountInCents}${currency}${config.integritySecret}`);
}

export async function buildCheckoutUrl(config: WompiConfig, input: CheckoutInput): Promise<string> {
  const signature = await integritySignature(config, input);
  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: "COP",
    "amount-in-cents": String(input.amountInCents),
    reference: input.reference,
    "signature:integrity": signature,
    "redirect-url": input.redirectUrl,
  });
  if (input.customerEmail) params.set("customer-data:email", input.customerEmail);
  if (input.customerName) params.set("customer-data:full-name", input.customerName);
  const base = config.checkoutUrl.endsWith("?") ? config.checkoutUrl : `${config.checkoutUrl.replace(/\/+$/, "")}/`;
  return `${base}?${params.toString()}`;
}

export function paymentOutcome(status: string): PaymentOutcome {
  switch (String(status).toUpperCase()) {
    case "APPROVED":
      return "aprobado";
    case "DECLINED":
    case "ERROR":
      return "rechazado";
    case "VOIDED":
      return "expirado";
    default:
      return "pendiente";
  }
}

type EventPayload = {
  event?: string;
  data?: Record<string, unknown>;
  signature?: { checksum?: string; properties?: unknown };
  timestamp?: number | string;
};

function pick(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

// Verifica signature.checksum sobre data[propiedades] + timestamp + secreto de eventos.
export async function verifyWompiEvent(config: WompiConfig, payload: EventPayload): Promise<boolean> {
  const checksum = String(payload.signature?.checksum ?? "").toLowerCase();
  const properties = Array.isArray(payload.signature?.properties) ? payload.signature!.properties : [];
  if (!checksum || properties.length === 0) return false;
  const timestamp = payload.timestamp == null ? "" : String(payload.timestamp);
  const values = properties.map((prop) => {
    const value = pick(payload.data, String(prop));
    return value == null ? "" : String(value);
  });
  const expected = await sha256Hex(values.join("") + timestamp + config.eventsSecret);
  return constantTimeEqual(expected, checksum);
}
