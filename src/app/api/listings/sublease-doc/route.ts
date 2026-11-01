import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server-auth";
import { deletePrivateFile, readPrivateFile, savePrivateFile } from "@/lib/storage";
import { store, uid } from "@/lib/store";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function listingFor(id: string, userId: string, isAdmin: boolean) {
  const all = await store.listings();
  const listing = all.find((l) => l.id === id);
  if (!listing) return { error: "No existe ese alojamiento.", status: 404 as const };
  if (listing.ownerId !== userId && !isAdmin) return { error: "Sin permiso.", status: 403 as const };
  return { all, listing };
}

// Sube la autorización escrita del propietario. Se guarda fuera del almacenamiento público.
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envía el documento como archivo." }, { status: 400 });
  }
  const listingId = String(form.get("listingId") ?? "").trim();
  const raw = form.get("file");
  if (!listingId || !raw || typeof raw === "string" || typeof (raw as Blob).arrayBuffer !== "function") {
    return NextResponse.json({ error: "Falta el alojamiento o el archivo." }, { status: 400 });
  }
  const blob = raw as Blob;
  const mime = (blob.type || "").toLowerCase();
  const ext = ALLOWED[mime];
  if (!ext) return NextResponse.json({ error: "Solo se aceptan PDF, JPG, PNG o WEBP." }, { status: 400 });
  if (blob.size === 0) return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  if (blob.size > MAX_BYTES) return NextResponse.json({ error: "El documento supera 8 MB." }, { status: 400 });

  const found = await listingFor(listingId, me.id, me.role === "admin");
  if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
  const { all, listing } = found;
  if (listing.tipo !== "subarriendo") {
    return NextResponse.json({ error: "La autorización solo aplica a subarriendos." }, { status: 400 });
  }

  const name = `${uid("sub")}.${ext}`;
  try {
    await savePrivateFile(name, new Uint8Array(await blob.arrayBuffer()), mime);
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el documento." }, { status: 500 });
  }

  const previous = listing.subleaseAuth?.docName;
  listing.subleaseAuth = {
    confirmed: true,
    docName: name,
    docMime: mime,
    uploadedAt: new Date().toISOString(),
  };
  await store.saveListings(all);
  if (previous && previous !== name) await deletePrivateFile(previous);
  return NextResponse.json({ ok: true, uploadedAt: listing.subleaseAuth.uploadedAt });
}

// Solo el anfitrión dueño o el administrador pueden leer el documento.
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const found = await listingFor(id, me.id, me.role === "admin");
  if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
  const doc = found.listing.subleaseAuth;
  if (!doc?.docName) return NextResponse.json({ error: "No hay documento." }, { status: 404 });
  if (!/^[\w.-]+$/.test(doc.docName)) return NextResponse.json({ error: "Documento inválido." }, { status: 400 });

  const file = await readPrivateFile(doc.docName);
  if (!file) return NextResponse.json({ error: "No se encontró el archivo." }, { status: 404 });
  const ext = doc.docName.split(".").pop() ?? "pdf";
  const body = file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": doc.docMime || file.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="autorizacion-subarriendo.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const found = await listingFor(id, me.id, me.role === "admin");
  if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
  const { all, listing } = found;

  const name = listing.subleaseAuth?.docName;
  listing.subleaseAuth = { confirmed: false };
  if (listing.tipo === "subarriendo") listing.active = false;
  await store.saveListings(all);
  if (name) await deletePrivateFile(name);
  return NextResponse.json({ ok: true, active: listing.active });
}
