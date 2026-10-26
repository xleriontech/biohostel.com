import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { platform, listingId, event, dates } = body;
    if (!platform || !listingId) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    const all = await store.listingChannels();
    const ch = all.find((c) => c.listingId === listingId && c.platform === platform);
    if (!ch) return NextResponse.json({ ok: false, message: "Canal no encontrado." }, { status: 404 });
    if (event === "reservation_created" && Array.isArray(dates)) {
      const fechas = dates.map((d: string) => String(d).slice(0, 10));
      ch.occupied = Array.from(new Set([...ch.occupied, ...fechas]));
    } else if (event === "reservation_cancelled" && Array.isArray(dates)) {
      const fechas = dates.map((d: string) => String(d).slice(0, 10));
      ch.occupied = ch.occupied.filter((d) => !fechas.includes(d));
    }
    ch.lastSync = new Date().toISOString();
    await store.saveListingChannels(all);
    return NextResponse.json({ ok: true, sync: ch.lastSync, nights: ch.occupied.length });
  } catch {
    return NextResponse.json({ error: "Fallo interno." }, { status: 500 });
  }
}
