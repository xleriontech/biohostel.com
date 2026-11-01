import { store } from "@/lib/store";
import { buildIcalFeed } from "@/lib/ical";
import { reservationBlocks } from "@/lib/booking-engine";

// Feed iCal público por alojamiento: el anfitrión lo conecta en Airbnb/Booking
// (Importar calendario) para devolverles los bloqueos de Biohostels.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listings = await store.listings();
  const l = listings.find((x) => x.id === id);
  if (!l) return new Response("No existe", { status: 404 });
  const reservations = (await store.reservations())
    .filter((r) => r.listingId === id && reservationBlocks(r))
    .map((r) => ({ checkIn: r.checkIn, checkOut: r.checkOut, code: r.code, status: r.status }));
  const ics = buildIcalFeed(l.titulo, reservations);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="biohostels-${id}.ics"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
