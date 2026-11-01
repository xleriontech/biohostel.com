import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";
import { applyListingEdit } from "@/lib/listing-edit";
import { LEGAL_VERSION, isValidRnt, legalPublishIssue, normalizeRnt } from "@/lib/legal";
import { deletePrivateFile } from "@/lib/storage";

export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope");
  if (scope === "mine") {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    return NextResponse.json({ listings: (await store.listings()).filter((l) => l.ownerId === me.id) });
  }
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

  const tipo: "reserva" | "subarriendo" = b.tipo === "subarriendo" ? "subarriendo" : "reserva";
  const rnt = normalizeRnt(b.rnt);
  if (!isValidRnt(rnt)) {
    return NextResponse.json(
      { error: "El RNT es obligatorio para publicar (Decreto 1836 de 2021). Escribe el número de tu Registro Nacional de Turismo." },
      { status: 400 },
    );
  }
  if (tipo === "subarriendo" && b.subleaseDeclared !== true) {
    return NextResponse.json(
      { error: "Debes declarar que cuentas con autorización escrita del propietario para subarrendar (Ley 820 de 2003, art. 17)." },
      { status: 400 },
    );
  }

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
  const { slugify } = await import("@/lib/store");
  const all = await store.listings();
  let slug = slugify(String(b.slug ?? titulo));
  if (all.some((x) => x.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const theme = b.theme && typeof b.theme.primary === "string" ? {
    primary: String(b.theme.primary).slice(0, 20),
    accent: String(b.theme.accent ?? "#e4e4e7").slice(0, 20),
    preset: ["selva", "mar", "colonial", "urbano", "minimal"].includes(b.theme.preset) ? b.theme.preset : "minimal",
    font: "sans" as const,
    rationale: String(b.theme.rationale ?? "").slice(0, 500),
  } : undefined;
  const nuevo = {
    id: uid("lst"),
    titulo,
    tipo,
    categoria: tipo === "subarriendo" ? "Subarriendo" : String(b.categoria ?? "Hostel"),
    ciudad: String(b.ciudad ?? "Por definir").slice(0, 100),
    direccion: String(b.direccion ?? "").slice(0, 200),
    lat: b.lat ? Number(b.lat) : undefined,
    lng: b.lng ? Number(b.lng) : undefined,
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
    // Phase 1: Campos críticos
    checkIn: String(b.checkIn ?? "15:00").slice(0, 10),
    checkOut: String(b.checkOut ?? "12:00").slice(0, 10),
    cancellationPolicy: String(b.cancellationPolicy ?? "Cancelación gratuita hasta 48h antes del check-in.").slice(0, 500),
    houseRules: Array.isArray(b.houseRules) ? b.houseRules.filter((r: unknown) => typeof r === "string").slice(0, 10) : [],
    minStay: Number(b.minStay) || 1,
    maxStay: Number(b.maxStay) || 30,
    breakfastIncluded: b.breakfastIncluded === true,
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
    // Un subarriendo nace pausado: se activa al adjuntar la autorización del propietario.
    active: tipo !== "subarriendo",
    featured: false,
    slug,
    theme,
    rnt,
    legalVersion: LEGAL_VERSION,
    subleaseAuth: tipo === "subarriendo" ? { confirmed: true } : undefined,
    createdAt: new Date().toISOString(),
  };
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
  return NextResponse.json({ listing: nuevo, requiresSubleaseDoc: tipo === "subarriendo" });
}

export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const all = await store.listings();
  const listing = all.find((l) => l.id === body.id);
  if (!listing) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (listing.ownerId !== me.id) return NextResponse.json({ error: "No es tu publicación." }, { status: 403 });

  const limits = me.plan === "gratuito" ? { maxFotos: 5, maxDesc: 300 } : { maxFotos: 30, maxDesc: 5000 };
  const previousDoc = listing.subleaseAuth?.docName;
  const error = applyListingEdit(listing, body, limits);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (typeof body.active === "boolean") {
    if (body.active) {
      const issue = legalPublishIssue(listing);
      if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    }
    listing.active = body.active;
  }

  await store.saveListings(all);
  if (previousDoc && listing.subleaseAuth?.docName !== previousDoc) await deletePrivateFile(previousDoc);
  const { indexListing, removeFromIndex } = await import("@/lib/rag");
  if (listing.active === false) await removeFromIndex(listing.id).catch(() => null);
  else await indexListing(listing).catch(() => null);
  return NextResponse.json({ listing });
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
