import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";

async function rates(): Promise<Record<string, number>> {
  try {
    return (await store.config()).rates;
  } catch {
    return { gratuito: 0.1, corporativo: 0.05, premium: 0 };
  }
}

function noches(checkIn: string, checkOut: string) {
  const out: string[] = [];
  for (let d = new Date(checkIn + "T12:00:00"); d < new Date(checkOut + "T12:00:00"); d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function overlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 < b2 && b1 < a2;
}

// GET: mis reservas como huésped + las recibidas como anfitrión
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const all = await store.reservations();
  const mine = all.filter((r) => r.guestId === me.id);
  const received = all.filter((r) => r.hostId === me.id);
  return NextResponse.json({ mine, received });
}

// POST: crea reserva con verificación IA en servidor
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión para reservar." }, { status: 401 });
  const { listingId, checkIn, checkOut, guests } = await req.json().catch(() => ({}));
  if (!listingId || !checkIn || !checkOut || checkOut <= checkIn) {
    return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });
  }
  const listings = await store.listings();
  const l = listings.find((x) => x.id === listingId && x.active !== false);
  if (!l) return NextResponse.json({ error: "Alojamiento no disponible." }, { status: 404 });

  // IA: choques con Booking/Airbnb + canales conectados (iCal real) + reservas ya confirmadas
  const dias = noches(checkIn, checkOut);
  const choqueB = dias.filter((d) => l.fechasOcupadasBooking.includes(d));
  const choqueA = dias.filter((d) => l.fechasOcupadasAirbnb.includes(d));
  const lchs = (await store.listingChannels()).filter((c) => c.listingId === l.id);
  const choqueCh: string[] = [];
  const chNames: string[] = [];
  lchs.forEach((c) => {
    const hit = dias.filter((d) => c.occupied.includes(d));
    if (hit.length) {
      choqueCh.push(...hit);
      chNames.push(`${c.platform} [${hit.join(", ")}]`);
    }
  });
  const all = await store.reservations();
  const choqueR = all.filter(
    (r) => r.listingId === l.id && r.status !== "cancelada" && overlap(r.checkIn, r.checkOut, checkIn, checkOut),
  );
  if (choqueB.length || choqueA.length || choqueR.length || choqueCh.length) {
    const todas = [...l.fechasOcupadasBooking, ...l.fechasOcupadasAirbnb, ...choqueCh];
    const sug = new Date(checkOut + "T12:00:00");
    for (let i = 0; i < 14; i++) {
      if (!todas.includes(sug.toISOString().slice(0, 10))) break;
      sug.setDate(sug.getDate() + 1);
    }
    return NextResponse.json(
      {
        error: "Fechas ocupadas",
        aiReport: `Ocupación detectada — Booking [${choqueB.join(", ") || "—"}] · Airbnb [${choqueA.join(", ") || "—"}]${chNames.length ? ` · ${chNames.join(" · ")}` : ""}${choqueR.length ? ` · ${choqueR.length} reserva(s) BioHostel` : ""}.`,
        sugerencia: `Prueba desde el ${sug.toISOString().slice(0, 10)} u otro alojamiento en ${l.ciudad}.`,
      },
      { status: 409 },
    );
  }

  const n = Math.max(1, dias.length);
  const base = l.tipo === "subarriendo" && l.precioMes ? Number(l.precioMes) : Number(l.precioNoche) * n;
  const hostPlan = l.ownerId === "demo" ? l.anfitrion.plan : (await store.users()).find((u) => u.id === l.ownerId)?.plan ?? "gratuito";
  const rate = (await rates())[hostPlan] ?? 0.1;
  const commission = Math.round(base * rate);
  const code = "BIO-" + Date.now().toString(36).toUpperCase().slice(-6);
  const r = {
    id: uid("res"),
    code,
    listingId: l.id,
    listingTitle: l.titulo,
    guestId: me.id,
    guestName: me.name,
    hostId: l.ownerId,
    checkIn,
    checkOut,
    guests: Number(guests) || 1,
    base,
    commission,
    rate,
    total: base + commission,
    status: "confirmada",
    aiReport: `Verificación IA: ${n} noche(s) libres en ${lchs.length ? lchs.map((c) => c.platform).join(", ") + ", " : ""}Booking y Airbnb. Marcada como reservada en todos los canales.`,
    createdAt: new Date().toISOString(),
  };
  all.unshift(r);
  await store.saveReservations(all);
  return NextResponse.json({ reservation: r, feedUrl: `/api/calendar/${l.id}` });
}

// PATCH: confirmar/cancelar (huésped cancela la suya, anfitrión gestiona las recibidas)
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!["confirmada", "cancelada"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const all = await store.reservations();
  const r = all.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (r.guestId !== me.id && r.hostId !== me.id) return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  r.status = status;
  await store.saveReservations(all);
  return NextResponse.json({ reservation: r });
}
