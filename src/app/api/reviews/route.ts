import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  const all = await store.reviews();
  let list = all;
  if (listingId) list = list.filter((r) => r.listingId === listingId);
  list = list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return NextResponse.json({ reviews: list, count: list.length });
}

export async function POST(req: Request) {
  const me = await (await import("@/lib/server-auth")).currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión para dejar una reseña." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const text = String(b.text ?? "").trim().slice(0, 1000);
  if (!text) return NextResponse.json({ error: "Escribe un comentario." }, { status: 400 });
  const rating = Number(b.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Califica de 1 a 5." }, { status: 400 });
  const listing = await store.listings();
  const listingItems = listing.find((x) => x.id === b.listingId || x.slug === b.listingId);
  if (!listingItems) return NextResponse.json({ error: "Alojamiento no encontrado." }, { status: 404 });
  if (listingItems.ownerId === me.id) return NextResponse.json({ error: "No puedes reseñar tu propia propiedad." }, { status: 400 });
  if (me.role !== "user") return NextResponse.json({ error: "Solo huéspedes pueden responder." }, { status: 403 });
  const review = {
    id: uid("rev"),
    listingId: b.listingId,
    userId: me.id,
    userName: me.name,
    role: me.role,
    rating,
    text,
    hostResponse: b.hostResponse ? { text: String(b.hostResponse).slice(0, 500), at: new Date().toISOString() } : undefined,
    createdAt: new Date().toISOString(),
  };
  const all = await store.reviews();
  all.push(review);
  await store.saveReviews(all);

  // actualiza el rating promedio de la propiedad
  const list2 = await store.listings();
  const listingItem = list2.find((x) => x.id === b.listingId);
  if (listingItem) {
    const rs = await store.reviews();
    const vals = rs.filter((r) => r.listingId === b.listingId).map((r) => r.rating);
    const avg = vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 5.0;
    listingItem.rating = Number(avg);
    listingItem.resenas = vals.length;
    await store.saveListings(list2);
  }

  return NextResponse.json({ review, ok: true });
}