import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";

export async function GET() {
  const listings = (await store.listings()).filter((l) => l.active !== false);
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión para publicar." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const titulo = String(b.titulo ?? "").trim().slice(0, 140);
  const imagenes: string[] = Array.isArray(b.imagenes) ? b.imagenes.filter((s: unknown) => typeof s === "string") : [];
  if (!titulo) return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  if (imagenes.length === 0) return NextResponse.json({ error: "Elige al menos 1 imagen." }, { status: 400 });

  const mine = (await store.listings()).filter((l) => l.ownerId === me.id);
  const maxAlojamientos = me.plan === "gratuito" ? 1 : me.plan === "corporativo" ? 20 : 9999;
  if (mine.length >= maxAlojamientos) {
    return NextResponse.json({ error: `Tu plan ${me.plan} permite ${maxAlojamientos} alojamiento(s). Sube de plan.` }, { status: 403 });
  }
  const maxFotos = me.plan === "gratuito" ? 5 : 30;
  if (imagenes.length > maxFotos) {
    return NextResponse.json({ error: `Tu plan ${me.plan} permite ${maxFotos} fotos.` }, { status: 403 });
  }

  const descripcion = me.plan === "gratuito" ? String(b.descripcion ?? "").slice(0, 300) : String(b.descripcion ?? "");
  const nuevo = {
    id: uid("lst"),
    titulo,
    tipo: (b.tipo === "subarriendo" ? "subarriendo" : "reserva") as "reserva" | "subarriendo",
    categoria: b.tipo === "subarriendo" ? "Subarriendo" : String(b.categoria ?? "Hostel"),
    ciudad: String(b.ciudad ?? "Por definir").slice(0, 100),
    precioNoche: Number(b.precioNoche) || 0,
    precioMes: b.precioMes ? Number(b.precioMes) : undefined,
    rating: 5.0,
    resenas: 0,
    huespedes: Number(b.huespedes) || 2,
    imagen: imagenes[0],
    galeria: imagenes.slice(0, maxFotos),
    descripcion: descripcion || "Sin descripción.",
    amenidades: Array.isArray(b.amenidades) ? b.amenidades : [],
    politicas: String(b.politicas ?? "Check-in 15:00 · Check-out 12:00 · Cancelación gratis 48h."),
    anfitrion: {
      nombre: me.name,
      plan: me.plan,
      verificado: me.plan !== "gratuito",
      avatar: me.name.trim().slice(0, 1).toUpperCase(),
      seguidores: 0,
    },
    fechasOcupadasBooking: [] as string[],
    fechasOcupadasAirbnb: [] as string[],
    ownerId: me.id,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  };
  const all = await store.listings();
  all.unshift(nuevo);
  await store.saveListings(all);
  // RAG: indexa el contenido para que la IA aprenda de esta propiedad
  const { indexListing } = await import("@/lib/rag");
  await indexListing(nuevo).catch(() => null);
  // Si viene de importación web, registra la web como canal de la IA
  const fuente = String(b.fuente ?? "").trim();
  if (/^https?:\/\//.test(fuente)) {
    const chs = await store.listingChannels();
    chs.unshift({ id: `lch-${nuevo.id}`, listingId: nuevo.id, platform: "Web", url: fuente.slice(0, 500), icalUrl: "", occupied: [], lastSync: "nunca" });
    await store.saveListingChannels(chs);
  }
  return NextResponse.json({ listing: nuevo });
}

export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.listings();
  const l = all.find((x) => x.id === id);
  if (!l) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (l.ownerId !== me.id) return NextResponse.json({ error: "No es tu publicación." }, { status: 403 });
  await store.saveListings(all.filter((x) => x.id !== id));
  const { removeFromIndex } = await import("@/lib/rag");
  await removeFromIndex(id!).catch(() => null);
  return NextResponse.json({ ok: true });
}
