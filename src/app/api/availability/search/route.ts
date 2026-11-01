import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { rateLimit } from "@/lib/security";
import { checkAvailability, isISODate, validateStay } from "@/lib/booking-engine";
import { syncStaleChannels } from "@/lib/channel-sync";

// GET /api/availability/search?checkIn=...&checkOut=...&guests=1
// Disponibilidad de todo el catálogo para unas fechas concretas.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const checkIn = (url.searchParams.get("checkIn") ?? "").slice(0, 10);
  const checkOut = (url.searchParams.get("checkOut") ?? "").slice(0, 10);
  const guests = Math.max(1, Math.trunc(Number(url.searchParams.get("guests")) || 1));

  const key = req.headers.get("x-forwarded-for") || "anon";
  if (!rateLimit(`avail-search-${key}`, 30, 60000)) {
    return NextResponse.json({ error: "Demasiadas búsquedas. Intenta en 1 min." }, { status: 429 });
  }

  if (!isISODate(checkIn) || !isISODate(checkOut)) {
    return NextResponse.json({ error: "Indica fechas válidas (entrada y salida)." }, { status: 400 });
  }

  // Mejor esfuerzo: refresca hasta 3 canales iCal vencidos antes de responder.
  await syncStaleChannels({ timeoutMs: 2500, limit: 3 }).catch(() => 0);

  const [listings, channels, reservations] = await Promise.all([
    store.listings(),
    store.listingChannels(),
    store.reservations(),
  ]);

  const results = listings
    .filter((listing) => listing.active !== false)
    .map((listing) => {
      const issues = validateStay(listing, checkIn, checkOut, guests);
      const check = checkAvailability(listing, channels, reservations, checkIn, checkOut);
      const available = issues.length === 0 && check.available;
      const conflictLabel = check.conflicts.map((c) => c.platform).join(", ");
      return {
        listingId: listing.id,
        slug: listing.slug || listing.id,
        available,
        reason: issues[0]?.message ?? (conflictLabel ? `Ocupado en ${conflictLabel}` : null),
        issues,
        conflicts: check.conflicts,
      };
    });

  return NextResponse.json({ checkIn, checkOut, guests, results });
}
