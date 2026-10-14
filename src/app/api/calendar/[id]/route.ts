import { store } from "@/lib/store";
import { buildIcalFeed } from "@/lib/ical";

// Feed iCal público por alojamiento: el anfitrión lo conecta en Airbnb/Booking
// (Importar calendario) para devolverles los bloqueos de BioHostel.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listings = await store.listings();
  const l = listings.find((x) => x.id === id);
  if (!l) return new Response("No existe", { status: 404 });
  const reservations = (await store.reservations()).filter((r) => r.listingId === id && r.status === "confirmada");
  const ics = buildIcalFeed(l.titulo, reservations);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="biohostel-${id}.ics"` } });
}
