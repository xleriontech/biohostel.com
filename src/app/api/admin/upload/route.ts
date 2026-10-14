import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { deleteUpload, listUploads, saveUpload } from "@/lib/storage";
import { store, uid } from "@/lib/store";

const MAX_BYTES = 6 * 1024 * 1024;

// Sube imagen/GIF: desde el PC (multipart) o trayéndola desde una URL externa.
// En Cloudflare se guarda en R2; en local, en public/uploads/. Siempre se sirve vía /api/files/.
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const ct = req.headers.get("content-type") ?? "";
  let bytes: Uint8Array | null = null;
  let mime = "image/jpeg";

  if (ct.includes("application/json")) {
    const { imageUrl } = await req.json().catch(() => ({}));
    if (!/^https?:\/\/.+/i.test(String(imageUrl ?? ""))) {
      return NextResponse.json({ error: "URL inválida." }, { status: 400 });
    }
    try {
      const res = await fetch(String(imageUrl), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      mime = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
      if (!mime.startsWith("image/")) throw new Error("Esa URL no es una imagen.");
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) throw new Error("La imagen supera 6 MB.");
      bytes = new Uint8Array(buf);
    } catch (e) {
      return NextResponse.json({ error: `No pude traerla: ${e instanceof Error ? e.message : "error"}` }, { status: 502 });
    }
  } else {
    try {
      const form = await req.formData();
      const file = form.get("file") as unknown;
      if (typeof file === "string" || file === null || typeof (file as Blob).arrayBuffer !== "function") {
        return NextResponse.json({ error: "Sin archivo válido." }, { status: 400 });
      }
      const blob = file as Blob;
      mime = blob.type || "image/jpeg";
      if (!mime.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes o GIF." }, { status: 400 });
      if (blob.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 6 MB." }, { status: 400 });
      bytes = new Uint8Array(await blob.arrayBuffer());
    } catch (e) {
      return NextResponse.json({ error: `No se pudo subir (${e instanceof Error ? e.message : "?"})` }, { status: 500 });
    }
  }

  const ext = mime.includes("gif") ? "gif" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const name = `${uid("img")}.${ext}`;
  try {
    await saveUpload(name, bytes!, mime);
  } catch (e) {
    return NextResponse.json({ error: `No se pudo guardar (${e instanceof Error ? e.message : "?"})` }, { status: 500 });
  }
  return NextResponse.json({ url: `/api/files/${name}` });
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ files: await listUploads() });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { url } = await req.json().catch(() => ({}));
  const name = String(url ?? "").split("/").pop() ?? "";
  if (!name || name.includes("..") || !/^[\w.-]+\.(png|jpe?g|gif|webp)$/i.test(name)) {
    return NextResponse.json({ error: "Inválido." }, { status: 400 });
  }
  await deleteUpload(name);
  const ads = await store.ads();
  ads.forEach((a) => {
    if (a.image && a.image.endsWith(`/${name}`)) a.image = "";
  });
  await store.saveAds(ads);
  return NextResponse.json({ ok: true });
}
