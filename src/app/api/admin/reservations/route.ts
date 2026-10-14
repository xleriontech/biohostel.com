import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ reservations: await store.reservations() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, status } = await req.json().catch(() => ({}));
  if (!["confirmada", "cancelada"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const all = await store.reservations();
  const r = all.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "No existe." }, { status: 404 });
  r.status = status;
  await store.saveReservations(all);
  return NextResponse.json({ ok: true });
}
