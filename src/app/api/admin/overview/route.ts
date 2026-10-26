import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const [users, listings, reservations, leads, ads] = await Promise.all([
    store.users(), store.listings(), store.reservations(), store.leads(), store.ads(),
  ]);
  const confirmed = reservations.filter((r) => r.status === "confirmada");
  const gmv = confirmed.reduce((s, r) => s + r.total, 0);
  const commissions = confirmed.reduce((s, r) => s + r.commission, 0);
  const byPlan: Record<string, number> = {};
  users.forEach((u) => { byPlan[u.plan] = (byPlan[u.plan] ?? 0) + 1; });
  const ocupacionProyectada = listings.length ? Math.round((confirmed.reduce((s, r) => s + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000, 0) / (30 * listings.filter((l) => l.active !== false).length)) * 100) : 0;
  return NextResponse.json({
    users: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    byPlan,
    listings: listings.length,
    activeListings: listings.filter((l) => l.active !== false).length,
    reservations: reservations.length,
    confirmed: confirmed.length,
    gmv,
    commissions,
    leads: leads.length,
    ads: ads.filter((a) => a.active).length,
    ocupacionProyectada,
  });
}
