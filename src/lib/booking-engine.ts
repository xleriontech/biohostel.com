import { addDays, toISODate } from "./dates";
import { dynamicPrice } from "./pricing";
import type { ListingChannel, StoredListing, StoredReservation } from "./store";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type StayIssue = { code: string; message: string };
export type ConflictSource = { platform: string; dates: string[] };
export type Quote = { base: number; commission: number; rate: number; total: number; nights: number };

export type Alternative = {
  kind: "fechas" | "alojamiento";
  listingId: string;
  slug: string;
  titulo: string;
  ciudad: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  precio: number;
  imagen: string;
  motivo: string;
};

export function isISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
}

export function nightsBetween(checkIn: string, checkOut: string): string[] {
  if (!isISODate(checkIn) || !isISODate(checkOut)) return [];
  const out: string[] = [];
  const end = new Date(`${checkOut}T12:00:00`);
  for (let d = new Date(`${checkIn}T12:00:00`); d < end; d = addDays(d, 1)) out.push(toISODate(d));
  return out;
}

export function stayLength(checkIn: string, checkOut: string): number {
  if (!isISODate(checkIn) || !isISODate(checkOut)) return 0;
  return Math.round((new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / 86400000);
}

export function validateStay(
  listing: StoredListing,
  checkIn: string,
  checkOut: string,
  guests: number,
  today = toISODate(new Date()),
): StayIssue[] {
  const issues: StayIssue[] = [];
  if (listing.active === false) issues.push({ code: "inactive", message: "Este alojamiento no está disponible." });
  if (!isISODate(checkIn) || !isISODate(checkOut)) {
    return [...issues, { code: "invalid_dates", message: "Fechas inválidas." }];
  }
  if (checkOut <= checkIn) issues.push({ code: "date_order", message: "La salida debe ser posterior a la entrada." });
  if (checkIn < today) issues.push({ code: "past", message: "La fecha de entrada ya pasó." });
  const nights = stayLength(checkIn, checkOut);
  const minStay = Math.max(1, Number(listing.minStay) || 1);
  if (nights > 0 && nights < minStay) {
    issues.push({ code: "min_stay", message: `La estancia mínima es de ${minStay} noche${minStay === 1 ? "" : "s"}.` });
  }
  const maxStay = Number(listing.maxStay) || 0;
  if (maxStay > 0 && nights > maxStay) {
    issues.push({ code: "max_stay", message: `La estancia máxima es de ${maxStay} noches.` });
  }
  const capacity = Math.max(1, Number(listing.huespedes) || 1);
  if (!Number.isInteger(guests) || guests < 1) {
    issues.push({ code: "guests", message: "Indica al menos un huésped." });
  } else if (guests > capacity) {
    issues.push({ code: "capacity", message: `Este alojamiento admite hasta ${capacity} huéspedes.` });
  }
  return issues;
}

function platformLabel(platform: string): string {
  if (/^booking/i.test(platform)) return "Booking";
  if (/^airbnb/i.test(platform)) return "Airbnb";
  return platform;
}

// Una reserva bloquea fechas si está confirmada o si tiene un pago pendiente
// dentro de su ventana de retención (holdUntil).
export function reservationBlocks(r: StoredReservation, now = Date.now()): boolean {
  if (r.status === "confirmada") return true;
  if (r.status !== "pendiente_pago") return false;
  if (!r.holdUntil) return true;
  const until = new Date(r.holdUntil).getTime();
  return Number.isFinite(until) && until > now;
}

export function reservationHoldExpired(r: StoredReservation, now = Date.now()): boolean {
  return r.status === "pendiente_pago" && !!r.holdUntil && new Date(r.holdUntil).getTime() <= now;
}

export function occupancySources(
  listing: StoredListing,
  channels: ListingChannel[],
  reservations: StoredReservation[],
): ConflictSource[] {
  const byPlatform = new Map<string, Set<string>>();
  const add = (platform: string, dates: string[] | undefined) => {
    if (!dates?.length) return;
    const name = platformLabel(platform);
    const set = byPlatform.get(name) ?? new Set<string>();
    for (const raw of dates) {
      const day = String(raw).slice(0, 10);
      if (isISODate(day)) set.add(day);
    }
    if (set.size) byPlatform.set(name, set);
  };

  add("Booking", listing.fechasOcupadasBooking);
  add("Airbnb", listing.fechasOcupadasAirbnb);
  for (const channel of channels) {
    if (channel.listingId === listing.id) add(channel.platform, channel.occupied);
  }
  const internal = reservations
    .filter((r) => r.listingId === listing.id && reservationBlocks(r))
    .flatMap((r) => nightsBetween(r.checkIn, r.checkOut));
  add("Biohostels", internal);

  return [...byPlatform.entries()]
    .map(([platform, dates]) => ({ platform, dates: [...dates].sort() }))
    .filter((source) => source.dates.length > 0);
}

export function mergeOccupied(
  listing: StoredListing,
  channels: ListingChannel[],
  reservations: StoredReservation[],
): string[] {
  const days = new Set<string>();
  for (const source of occupancySources(listing, channels, reservations)) {
    for (const day of source.dates) days.add(day);
  }
  return [...days].sort();
}

export function conflictsFor(nights: string[], sources: ConflictSource[]): ConflictSource[] {
  if (!nights.length) return [];
  const wanted = new Set(nights);
  return sources
    .map((source) => ({ platform: source.platform, dates: source.dates.filter((d) => wanted.has(d)) }))
    .filter((source) => source.dates.length > 0);
}

export function checkAvailability(
  listing: StoredListing,
  channels: ListingChannel[],
  reservations: StoredReservation[],
  checkIn: string,
  checkOut: string,
) {
  const nights = nightsBetween(checkIn, checkOut);
  const sources = occupancySources(listing, channels, reservations);
  const conflicts = conflictsFor(nights, sources);
  return { nights, sources, conflicts, available: nights.length > 0 && conflicts.length === 0 };
}

export function quoteFor(
  listing: StoredListing,
  checkIn: string,
  checkOut: string,
  guests: number,
  registrado: boolean,
  rate: number,
): Quote {
  const base = dynamicPrice(
    Number(listing.precioNoche) || 0,
    listing.tipo,
    listing.precioMes ? Number(listing.precioMes) : undefined,
    { checkIn, checkOut },
    guests,
    Number(listing.huespedes) || 2,
    registrado,
  );
  return {
    base,
    commission: Math.round(base * rate),
    rate,
    total: base + Math.round(base * rate),
    nights: Math.max(1, stayLength(checkIn, checkOut)),
  };
}

export function findAlternatives(options: {
  listing: StoredListing;
  listings: StoredListing[];
  channels: ListingChannel[];
  reservations: StoredReservation[];
  checkIn: string;
  checkOut: string;
  guests: number;
  registrado: boolean;
  rateFor: (listing: StoredListing) => number;
  today?: string;
  limit?: number;
}): Alternative[] {
  const { listing, listings, channels, reservations, checkIn, checkOut, guests, registrado, rateFor } = options;
  const today = options.today ?? toISODate(new Date());
  const limit = options.limit ?? 6;
  const nights = stayLength(checkIn, checkOut);
  if (nights < 1 || !isISODate(checkIn)) return [];

  const alternatives: Alternative[] = [];
  const start = new Date(`${checkIn}T12:00:00`);

  for (const offset of [1, -1, 2, -2, 3, -3]) {
    const altIn = toISODate(addDays(start, offset));
    const altOut = toISODate(addDays(start, offset + nights));
    if (validateStay(listing, altIn, altOut, guests, today).length > 0) continue;
    const check = checkAvailability(listing, channels, reservations, altIn, altOut);
    if (!check.available) continue;
    const quote = quoteFor(listing, altIn, altOut, guests, registrado, rateFor(listing));
    alternatives.push({
      kind: "fechas",
      listingId: listing.id,
      slug: listing.slug || listing.id,
      titulo: listing.titulo,
      ciudad: listing.ciudad,
      checkIn: altIn,
      checkOut: altOut,
      nights,
      precio: quote.total,
      imagen: listing.imagen,
      motivo: offset < 0 ? `${Math.abs(offset)} día${Math.abs(offset) === 1 ? "" : "s"} antes` : `${offset} día${offset === 1 ? "" : "s"} después`,
    });
    if (alternatives.length >= 3) break;
  }

  const otherListings = listings
    .filter((candidate) => candidate.id !== listing.id)
    .filter((candidate) => candidate.active !== false && candidate.ciudad === listing.ciudad)
    .filter((candidate) => (Number(candidate.huespedes) || 1) >= guests)
    .filter((candidate) => validateStay(candidate, checkIn, checkOut, guests, today).length === 0)
    .filter((candidate) => checkAvailability(candidate, channels, reservations, checkIn, checkOut).available)
    .map((candidate) => ({
      candidate,
      quote: quoteFor(candidate, checkIn, checkOut, guests, registrado, rateFor(candidate)),
    }))
    .sort((a, b) => Number(b.candidate.rating) - Number(a.candidate.rating) || a.quote.total - b.quote.total);

  for (const { candidate, quote } of otherListings) {
    if (alternatives.length >= limit) break;
    alternatives.push({
      kind: "alojamiento",
      listingId: candidate.id,
      slug: candidate.slug || candidate.id,
      titulo: candidate.titulo,
      ciudad: candidate.ciudad,
      checkIn,
      checkOut,
      nights,
      precio: quote.total,
      imagen: candidate.imagen,
      motivo: "Mismo destino, fechas libres",
    });
  }

  return alternatives;
}
