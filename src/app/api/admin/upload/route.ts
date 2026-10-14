import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/server-auth";
import { store, uid } from "@/lib/store";

const MAX_BYTES = 6 * 1024 * 1024;

// Sube imagen/GIF desde el PC (solo admin). También acepta { imageUrl } para traerla desde una URL.
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });

  const ct = req.headers.get("content-type") ?? "";
  // Caso 1: traer desde URL externa
  if (ct.includes("application/json")) {
    const { imageUrl } = await req.json().catch(() => ({}));
    if (!/^https?:\/\/.+/i.test(String(imageUrl ?? ""))) {
      return NextResponse.json({ error: "URL inválida." }, { status: 400 });
    }
    try {
      const res = await fetch(String(imageUrl), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mime = res.headers.get("content-type") ?? "";
      if (!mime.startsWith("image/")) throw new Error("Esa URL no es una imagen.");
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) throw new Error("La imagen supera 6 MB.");
      const ext = mime.includes("gif") ? "gif" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      const name = `${uid("img")}.${ext}`;
      await fs.writeFile(path.join(dir, name), buf);
      return NextResponse.json({ url: `/uploads/${name}` });
    } catch (e) {
      return NextResponse.json({ error: `No pude traerla: ${e instanceof Error ? e.message : "error"}` }, { status: 502 });
    }
  }

  // Caso 2: archivo desde el PC
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown;
    const kind = file === null ? "null" : typeof file === "string" ? "string" : (file as object).constructor?.name ?? typeof file;
    if (typeof file === "string" || file === null || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: `Sin archivo válido (recibido: ${kind}).` }, { status: 400 });
    }
    const blob = file as Blob;
    const mime = blob.type || "image/gif";
    if (!mime.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes o GIF." }, { status: 400 });
    if (blob.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 6 MB." }, { status: 400 });
    const ext = mime.includes("gif") ? "gif" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const name = `${uid("img")}.${ext}`;
    await fs.writeFile(path.join(dir, name), Buffer.from(await blob.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    return NextResponse.json({ error: `No se pudo subir el archivo (${e instanceof Error ? e.message : "?"})` }, { status: 500 });
  }
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const dir = path.join(process.cwd(), "public", "uploads");
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  return NextResponse.json({ files: files.filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f)).map((f) => `/uploads/${f}`) });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { url } = await req.json().catch(() => ({}));
  const name = path.basename(String(url ?? ""));
  if (!name || name.includes("..")) return NextResponse.json({ error: "Inválido." }, { status: 400 });
  await fs.unlink(path.join(process.cwd(), "public", "uploads", name)).catch(() => null);
  // Quita la referencia en ads que la usen
  const ads = await store.ads();
  ads.forEach((a) => { if (a.image === `/uploads/${name}`) a.image = ""; });
  await store.saveAds(ads);
  return NextResponse.json({ ok: true });
}
