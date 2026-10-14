import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ listings: await store.listings() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, active, featured } = await req.json().catch(() => ({}));
  const all = await store.listings();
  const l = all.find((x) => x.id === id);
  if (!l) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (typeof active === "boolean") l.active = active;
  if (typeof featured === "boolean") l.featured = featured;
  await store.saveListings(all);
  const { indexListing, removeFromIndex } = await import("@/lib/rag");
  if (typeof active === "boolean") {
    if (active) await indexListing(l).catch(() => null);
    else await removeFromIndex(l.id).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.listings();
  await store.saveListings(all.filter((x) => x.id !== id));
  const { removeFromIndex } = await import("@/lib/rag");
  if (id) await removeFromIndex(id).catch(() => null);
  return NextResponse.json({ ok: true });
}
