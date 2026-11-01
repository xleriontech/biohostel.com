import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";
import {
  checkAvailability,
  findAlternatives,
  mergeOccupied,
  quoteFor,
  stayLength,
  validateStay,
  type Alternative,
  type Quote,
} from "@/lib/booking-engine";
import { commissionRateFor } from "@/lib/booking-service";
import { syncListingChannels } from "@/lib/channel-sync";

// GET /api/availability?listingId=...&checkIn=...&checkOut=...&guests=2
// Sin fechas devuelve el calendario completo y las restricciones del alojamiento.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const listingId = (url.searchParams.get("listingId") ?? "").slice(0, 120);
  if (!listingId) return NextResponse.json({ error: "Falta listingId." }, { status: 400 });

  const listings = await store.listings();
  const listing = listings.find((x) => x.id === listingId && x.active !== false);
  if (!listing) return NextResponse.json({ error: "Alojamiento no disponible." }, { status: 404 });

  // Refresca iCal vencidos (máx. 20 min de antigüedad) antes de responder.
  await syncListingChannels(listing.id, { timeoutMs: 2000, limit: 2 }).catch(() => 0);

  const [channels, reservations, me] = await Promise.all([
    store.listingChannels(),
    store.reservations(),
    currentUser(),
  ]);

  const occupied = mergeOccupied(listing, channels, reservations);
  const constraints = {
    minStay: Math.max(1, Number(listing.minStay) || 1),
    maxStay: Number(listing.maxStay) || 0,
    maxGuests: Math.max(1, Number(listing.huespedes) || 1),
  };

  const checkIn = (url.searchParams.get("checkIn") ?? "").slice(0, 10);
  const checkOut = (url.searchParams.get("checkOut") ?? "").slice(0, 10);
  if (!checkIn && !checkOut) {
    return NextResponse.json({ listingId, occupied, constraints });
  }

  const guests = Math.trunc(Number(url.searchParams.get("guests")) || 2);
  const issues = validateStay(listing, checkIn, checkOut, guests);
  const nights = Math.max(0, stayLength(checkIn, checkOut));
  const check = checkAvailability(listing, channels, reservations, checkIn, checkOut);
  const registrado = !!me;

  let quote: Quote | null = null;
  let alternatives: Alternative[] = [];
  if (nights > 0 && issues.length === 0) {
    const rateFor = await commissionRateFor();
    quote = quoteFor(listing, checkIn, checkOut, guests, registrado, rateFor(listing));
    if (check.conflicts.length) {
      alternatives = findAlternatives({
        listing,
        listings,
        channels,
        reservations,
        checkIn,
        checkOut,
        guests,
        registrado,
        rateFor,
      });
    }
  }

  return NextResponse.json({
    listingId,
    checkIn,
    checkOut,
    guests,
    nights,
    available: issues.length === 0 && check.available,
    issues,
    conflicts: check.conflicts,
    quote,
    alternatives,
    constraints,
    occupied,
  });
}
