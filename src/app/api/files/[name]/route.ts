import { readUpload } from "@/lib/storage";

// Sirve imágenes subidas (R2 en Cloudflare, public/uploads en local).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w.-]+\.(png|jpe?g|gif|webp)$/i.test(name)) {
    return new Response("Inválido", { status: 400 });
  }
  const file = await readUpload(name);
  if (!file) return new Response("No existe", { status: 404 });
  const body = file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
