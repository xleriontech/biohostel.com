import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";
import { fetchIcalDates } from "@/lib/ical";

async function canEdit(me: { id: string; role: string }, listingId: string) {
  if (me.role === "admin") return true;
  const listings = await store.listings();
  return listings.some((l) => l.id === listingId && l.ownerId === me.id);
}

// GET ?listingId= → canales de ese alojamiento (con fechas ocupadas)
export async function GET(req: Request) {
  const listingId = new URL(req.url).searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "Falta listingId." }, { status: 400 });
  const all = await store.listingChannels();
  return NextResponse.json({ channels: all.filter((c) => c.listingId === listingId) });
}

// POST {listingId, platform, url, icalUrl} → agrega canal (dueño o admin)
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { listingId, platform, url, icalUrl } = await req.json().catch(() => ({}));
  if (!listingId || !platform?.trim()) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  if (!(await canEdit(me, listingId))) return NextResponse.json({ error: "No es tu publicación." }, { status: 403 });
  const all = await store.listingChannels();
  const ch = {
    id: uid("lch"),
    listingId,
    platform: String(platform).slice(0, 40),
    url: String(url ?? "").slice(0, 500),
    icalUrl: String(icalUrl ?? "").slice(0, 500),
    occupied: [] as string[],
    lastSync: "nunca",
  };
  all.unshift(ch);
  await store.saveListingChannels(all);
  return NextResponse.json({ channel: ch });
}

// PATCH {id, action:"sync"} → la IA descarga el iCal y actualiza fechas ocupadas
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const all = await store.listingChannels();
  const ch = all.find((x) => x.id === id);
  if (!ch) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (!(await canEdit(me, ch.listingId))) return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  if (!ch.icalUrl) return NextResponse.json({ error: "Este canal no tiene calendario iCal. Agrégalo desde Airbnb/Booking (Exportar calendario)." }, { status: 400 });
  try {
    ch.occupied = await fetchIcalDates(ch.icalUrl);
    ch.lastSync = new Date().toISOString();
    await store.saveListingChannels(all);
    return NextResponse.json({ channel: ch, nights: ch.occupied.length });
  } catch (e) {
    return NextResponse.json({ error: `No pude leer el calendario: ${e instanceof Error ? e.message : "?"}` }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.listingChannels();
  const ch = all.find((x) => x.id === id);
  if (!ch) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (!(await canEdit(me, ch.listingId))) return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  await store.saveListingChannels(all.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true });
}
