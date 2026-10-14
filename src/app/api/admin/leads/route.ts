import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ leads: await store.leads() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, estado, notas } = await req.json().catch(() => ({}));
  const all = await store.leads();
  const l = all.find((x) => x.id === id);
  if (!l) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (estado && ["nuevo", "contactado", "en_proceso", "cerrado", "descartado"].includes(estado)) l.estado = estado;
  if (typeof notas === "string") l.notas = notas.slice(0, 2000);
  await store.saveLeads(all);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.leads();
  await store.saveLeads(all.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true });
}
