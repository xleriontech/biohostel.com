import { store } from "./store";
import { searchDocs } from "./rag";

// Agente conversacional Bio: entiende ciudad, presupuesto, huéspedes, tipo y fechas,
// busca en el RAG + catálogo, verifica disponibilidad real y guía hasta la reserva.
// Funciona offline con motor de reglas; si hay LLM configurado, redacta la respuesta.

export type Suggestion = {
  listingId: string;
  titulo: string;
  ciudad: string;
  precioNoche: number;
  rating: number;
  resenas: number;
  imagen: string;
  available: boolean | null;
  note: string;
};

export type AgentMsg = { role: "user" | "assistant"; text: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function parseBudget(text: string): number | null {
  const t = norm(text);
  if (/(barato|barata|economico|economica|lo mas barato)/.test(t)) return -1; // flag: ordenar por precio
  const m = t.match(/(?:hasta|menos de|maximo|presupuesto(?: de)?|de)\s*\$?\s*([\d.,]+)\s*(mil|k|millones|millon|m\b)?/);
  const m2 = !m && /\$\s*[\d.,]+/.test(t) ? t.match(/\$\s*([\d.,]+)\s*(mil|k|millones|millon|m\b)?/) : null;
  const hit = m ?? m2;
  if (!hit) return null;
  let n = parseFloat(hit[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const unit = hit[2] ?? "";
  if (unit.startsWith("millon")) n *= 1e6;
  else if (unit === "mil" || unit === "k" || unit === "m") n *= 1000;
  else if (n < 5000) n *= 1000; // "200" → 200.000 COP
  return Math.round(n);
}

function parseGuests(text: string): number | null {
  const m = norm(text).match(/(\d+)\s*(personas|huespedes|ninos|adultos)/) ?? norm(text).match(/para\s+(\d+)\b/);
  return m ? Number(m[1]) : null;
}

function parseType(text: string): string | null {
  const t = norm(text);
  if (/\bsubarriendo\b|\bmensual\b|\bpor mes\b|\bmeses\b|\blarga estadia\b/.test(t)) return "subarriendo";
  if (/\bcabana\b/.test(t)) return "Cabaña";
  if (/\bhostel\b|\bhostal\b|\bcompartido\b|\bdormitorio\b/.test(t)) return "Hostel";
  if (/\bhabitacion\b|\bprivad[ao]\b/.test(t)) return "Privada";
  return null;
}

function parseDates(text: string): { checkIn: string; checkOut: string } | null {
  const m = text.match(/(\d{4}-\d{2}-\d{2})\D+(\d{4}-\d{2}-\d{2})/);
  if (m && m[2] > m[1]) return { checkIn: m[1], checkOut: m[2] };
  return null;
}

function nights(a: string, b: string) {
  const out: string[] = [];
  for (let d = new Date(a + "T12:00:00"); d < new Date(b + "T12:00:00"); d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

const moneyCOP = (n: number) => `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

export async function agentTurn(messages: AgentMsg[]): Promise<{ reply: string; suggestions: Suggestion[]; followUp: string | null }> {
  const history = messages.map((m) => m.text).join("\n");
  const last = [...messages].reverse().find((m) => m.role === "user")?.text ?? "";
  const t = norm(history);

  if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches|hello)\b/.test(norm(last)) && history.length < 30) {
    return {
      reply: "¡Hola! Soy Bio, tu asistente de hospedaje. ¿Para qué ciudad buscas: Nocaima, Bogotá, Medellín, Cartagena, Santa Marta o Salento?",
      suggestions: [],
      followUp: "ciudad",
    };
  }

  const listings = (await store.listings()).filter((l) => l.active !== false);
  const channels = await store.listingChannels();
  const reservations = await store.reservations();
  const cities = Array.from(new Set(listings.map((l) => l.ciudad)));
  const city = cities.find((c) => t.includes(norm(c))) ?? null;
  const budget = parseBudget(history);
  const guests = parseGuests(history);
  const type = parseType(history);
  const dates = parseDates(history);

  let pool = listings.filter((l) => {
    if (city && l.ciudad !== city) return false;
    if (type === "subarriendo" && l.tipo !== "subarriendo") return false;
    if (type && type !== "subarriendo" && l.categoria !== type) return false;
    if (budget && budget > 0 && Number(l.precioNoche) > budget) return false;
    if (guests && l.huespedes < guests) return false;
    return true;
  });

  // Orden: disponibles primero (si hay fechas), luego rating, o precio si pidió barato
  const availOf = (l: (typeof listings)[number]): boolean | null => {
    if (!dates) return null;
    const dias = nights(dates.checkIn, dates.checkOut);
    const hitStatic = dias.some((d) => l.fechasOcupadasBooking.includes(d) || l.fechasOcupadasAirbnb.includes(d));
    const hitCh = channels.some((c) => c.listingId === l.id && dias.some((d) => c.occupied.includes(d)));
    const hitR = reservations.some((r) => r.listingId === l.id && r.status !== "cancelada" && r.checkIn < dates.checkOut && dates.checkIn < r.checkOut);
    return !(hitStatic || hitCh || hitR);
  };

  const minAll = pool.length ? Math.min(...pool.map((l) => Number(l.precioNoche))) : 0;
  pool = pool
    .map((l) => ({ l, a: availOf(l) }))
    .sort((x, y) => {
      if (budget === -1) return Number(x.l.precioNoche) - Number(y.l.precioNoche);
      if (x.a !== y.a) return x.a === false ? 1 : -1;
      return y.l.rating - x.l.rating;
    })
    .map((x) => x.l)
    .slice(0, 3);

  // RAG: dato curioso de apoyo
  const ragHits = searchDocs(last, await store.ragDocs(), 1, undefined).slice(0, 1);

  if (!city && !pool.length) {
    return {
      reply: "¿Para qué ciudad buscas hospedaje? Por ahora conozco Nocaima, Bogotá, Medellín, Cartagena, Santa Marta y Salento. También dime tu presupuesto si tienes uno.",
      suggestions: [],
      followUp: "ciudad",
    };
  }

  if (!pool.length) {
    return {
      reply: `No encontré opciones ${city ? `en ${city}` : ""}${budget && budget > 0 ? ` hasta ${moneyCOP(budget)}` : ""}${guests ? ` para ${guests}` : ""}. Prueba con otra ciudad o subiendo el presupuesto. ¿Te muestro lo más económico disponible?`,
      suggestions: [],
      followUp: "filtros",
    };
  }

  const suggestions: Suggestion[] = pool.map((l) => {
    const a = availOf(l);
    return {
      listingId: l.id,
      titulo: l.titulo,
      ciudad: l.ciudad,
      precioNoche: Number(l.precioNoche),
      rating: l.rating,
      resenas: l.resenas,
      imagen: l.imagen,
      available: a,
      note: !dates ? "Confírmame fechas para verificar" : a ? "Disponible en esas fechas" : "Ocupado en esas fechas",
    };
  });

  const hasFilters = !!(city || (budget && budget > 0) || guests || type || dates);
  const min = minAll;
  let reply: string;
  if (!hasFilters) {
    reply = `¿Qué tipo de hospedaje buscas? Puedo filtrar por ciudad (Nocaima, Bogotá, Medellín, Cartagena, Santa Marta, Salento), presupuesto, fechas y número de personas. Mientras tanto, esto es lo mejor valorado desde ${moneyCOP(min)} la noche:`;
  } else if (!dates) {
    reply = `Encontré ${pool.length} opción(es)${city ? ` en ${city}` : ""} desde ${moneyCOP(min)} la noche. Toca “Ver” para detalles o dime tus fechas (AAAA-MM-DD a AAAA-MM-DD) y verifico disponibilidad real en Booking, Airbnb y los canales del anfitrión.`;
  } else {
    const ok = suggestions.filter((s) => s.available).length;
    reply =
      ok > 0
        ? `Revisé ${dates.checkIn} al ${dates.checkOut}: ${ok} de ${suggestions.length} disponible(s). Abre la que te guste y confirma: la IA la marca como reservada en todos los canales.`
        : `Para ${dates.checkIn} al ${dates.checkOut} están ocupadas. Te sugiero mover las fechas unos días o mirar otra ciudad. ¿Pruebo con otras fechas?`;
  }
  if (hasFilters && ragHits.length && ragHits[0].score > 0.05 && ragHits[0].snippet.length > 40) {
    reply += `\nDato útil: ${ragHits[0].snippet}`;
  }

  // Pulido con LLM si hay uno configurado (plantilla local si no)
  try {
    const { polishReply } = await import("./ai");
    const ctx = `Opciones: ${suggestions.map((s) => `${s.titulo} (${s.ciudad}, $${s.precioNoche} COP, ${s.note})`).join(" | ")}`;
    const polished = await polishReply(reply, ctx);
    if (polished) reply = polished;
  } catch { /* plantilla local */ }

  return { reply, suggestions, followUp: dates ? "confirmar" : "fechas" };
}
