import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getEnvVar } from "@/lib/storage";
import { isISODate } from "@/lib/booking-engine";

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cleanDates(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.map((d) => String(d).slice(0, 10)).filter(isISODate))].slice(0, 400);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = getEnvVar("WEBHOOK_SECRET");
  if (secret) {
    const provided = (req.headers.get("x-biohostel-signature") ?? "").replace(/^sha256=/i, "").trim().toLowerCase();
    if (!provided || !constantTimeEqual(provided, await hmacHex(secret, raw))) {
      return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Configura WEBHOOK_SECRET antes de recibir webhooks." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const data = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const platform = typeof data.platform === "string" ? data.platform.trim().slice(0, 40) : "";
  const listingId = typeof data.listingId === "string" ? data.listingId.trim().slice(0, 120) : "";
  const event = typeof data.event === "string" ? data.event : "";
  const dates = cleanDates(data.dates);

  if (!platform || !listingId) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  if (!["reservation_created", "reservation_cancelled"].includes(event)) {
    return NextResponse.json({ error: "Evento no soportado." }, { status: 400 });
  }
  if (!dates?.length) return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });

  try {
    const all = await store.listingChannels();
    const channel = all.find((c) => c.listingId === listingId && c.platform === platform);
    if (!channel) return NextResponse.json({ ok: false, message: "Canal no encontrado." }, { status: 404 });

    if (event === "reservation_created") {
      channel.occupied = [...new Set([...channel.occupied, ...dates])].sort();
    } else {
      channel.occupied = channel.occupied.filter((d) => !dates.includes(d));
    }
    channel.lastSync = new Date().toISOString();
    await store.saveListingChannels(all);
    return NextResponse.json({ ok: true, sync: channel.lastSync, nights: channel.occupied.length });
  } catch {
    return NextResponse.json({ error: "Fallo interno." }, { status: 500 });
  }
}
