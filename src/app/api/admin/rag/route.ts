import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";
import { reindexAll } from "@/lib/rag";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const docs = await store.ragDocs();
  const listings = await store.listings();
  return NextResponse.json({
    docs: docs.length,
    chunks: docs.length,
    indexedListings: new Set(docs.map((d) => d.listingId)).size,
    totalListings: listings.length,
    sample: docs.slice(0, 5).map((d) => ({ title: d.title, label: d.label ?? "documento completo", chars: d.text.length, updatedAt: d.updatedAt })),
    // false si el índice sigue con el formato antiguo de documento completo: hace falta reindexar.
    chunked: docs.length > 0 && docs.every((d) => Boolean(d.label)),
  });
}

export async function POST() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const n = await reindexAll();
  const chunks = (await store.ragDocs()).length;
  return NextResponse.json({ ok: true, docs: n, listings: n, chunks });
}
