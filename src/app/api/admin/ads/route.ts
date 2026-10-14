import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ ads: await store.ads() });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { empresa, categoria, titulo, texto, color, image } = await req.json().catch(() => ({}));
  if (!empresa?.trim() || !titulo?.trim()) return NextResponse.json({ error: "Empresa y título obligatorios." }, { status: 400 });
  const all = await store.ads();
  const ad = {
    id: uid("ad"),
    empresa: String(empresa).slice(0, 120),
    categoria: String(categoria ?? "General").slice(0, 40),
    titulo: String(titulo).slice(0, 140),
    texto: String(texto ?? "").slice(0, 300),
    color: String(color ?? "#16a34a"),
    image: String(image ?? "").slice(0, 500),
    active: true,
  };
  all.unshift(ad);
  await store.saveAds(all);
  return NextResponse.json({ ad });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, active, empresa, categoria, titulo, texto, color, image } = await req.json().catch(() => ({}));
  const all = await store.ads();
  const ad = all.find((x) => x.id === id);
  if (!ad) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (typeof active === "boolean") ad.active = active;
  if (typeof empresa === "string" && empresa.trim()) ad.empresa = empresa.slice(0, 120);
  if (typeof categoria === "string") ad.categoria = categoria.slice(0, 40);
  if (typeof titulo === "string" && titulo.trim()) ad.titulo = titulo.slice(0, 140);
  if (typeof texto === "string") ad.texto = texto.slice(0, 300);
  if (typeof color === "string") ad.color = color;
  if (typeof image === "string") ad.image = image.slice(0, 500);
  await store.saveAds(all);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.ads();
  await store.saveAds(all.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true });
}
