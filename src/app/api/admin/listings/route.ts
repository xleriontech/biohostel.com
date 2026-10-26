import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";
import { applyListingEdit } from "@/lib/listing-edit";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ listings: await store.listings() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const all = await store.listings();
  const l = all.find((x) => x.id === body.id);
  if (!l) return NextResponse.json({ error: "No existe." }, { status: 404 });

  const error = applyListingEdit(l, body, { maxFotos: 30, maxDesc: 5000 });
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (typeof body.active === "boolean") l.active = body.active;
  if (typeof body.featured === "boolean") l.featured = body.featured;

  await store.saveListings(all);
  const { indexListing, removeFromIndex } = await import("@/lib/rag");
  if (l.active === false) await removeFromIndex(l.id).catch(() => null);
  else await indexListing(l).catch(() => null);
  return NextResponse.json({ ok: true, listing: l });
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
