import { NextResponse } from "next/server";
import { answerWithRAG } from "@/lib/ai";

export async function POST(req: Request) {
  const { question, listingId } = await req.json().catch(() => ({}));
  const q = String(question ?? "").trim().slice(0, 500);
  if (q.length < 3) return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
  const r = await answerWithRAG(q, listingId ? String(listingId) : undefined);
  return NextResponse.json(r);
}
