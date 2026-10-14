import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getMeta(html: string, attr: string, value: string) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0] ?? "";
  return tag.match(/content=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
}

function absolutizar(src: string, base: string) {
  try {
    const u = new URL(src, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

const AMENIDAD_KEYWORDS: Record<string, string[]> = {
  Wifi: ["wifi", "internet", "fibra"],
  Piscina: ["piscina", "pileta", "alberca", "pool"],
  Yoga: ["yoga", "meditaci", "bienestar", "tai chi", "chi kung"],
  Cocina: ["cocina", "comedor", "gastronom"],
  "Tour café": ["caf[eé]", "cacao", "tour", "recorrido", "finca"],
  Naturaleza: ["bosque", "naturaleza", "sendero", "caminata", "flora", "fauna"],
  Desayuno: ["desayuno", "breakfast"],
  "Pet friendly": ["mascota", "pet friendly", "perro"],
};

export async function POST(req: Request) {
  let url = "";
  try {
    url = (await req.json())?.url ?? "";
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  if (!/^https?:\/\/.+\..+/.test(url.trim())) {
    return NextResponse.json({ error: "Coloca una URL válida (https://…)." }, { status: 400 });
  }

  let html = "";
  try {
    const res = await fetch(url.trim(), {
      headers: { "User-Agent": "BioHostelBot/1.0 (+https://biohostel.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) throw new Error("Esa URL no devolvió una página HTML.");
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      { error: `No pude leer esa web: ${e instanceof Error ? e.message : "error de red"}. Revisa la URL.` },
      { status: 502 },
    );
  }

  const titulo =
    getMeta(html, "property", "og:title") ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ||
    "Alojamiento importado";

  const descripcion =
    getMeta(html, "property", "og:description") ||
    getMeta(html, "name", "description") ||
    html
      .match(/<p[^>]*>([^<]{40,400})<\/p>/i)?.[1]
      ?.replace(/\s+/g, " ")
      .trim() ||
    "";

  const h1 = html.match(/<h1[^>]*>([\s\S]{1,160}?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? "";

  // Imágenes: og:image primero + todos los <img>, absolutizadas y deduplicadas
  const vistas = new Set<string>();
  const ogImg = getMeta(html, "property", "og:image");
  if (ogImg) {
    const abs = absolutizar(ogImg, url);
    if (abs) vistas.add(abs);
  }
  for (const m of html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const abs = absolutizar(m[1], url);
    if (!abs) continue;
    if (/\.(svg|ico)(\?|$)/i.test(abs) && !/logo/i.test(abs)) continue;
    if (/pixel|tracking|analytics|1x1/i.test(abs)) continue;
    vistas.add(abs);
    if (vistas.size >= 24) break;
  }
  const imagenes = [...vistas];
  // Prioriza fotos reales (fotos/, uploads, images) sobre logos
  imagenes.sort((a, b) => {
    const score = (s: string) => (/foto|upload|image|hostel|bungalo|caba|room|habitaci/i.test(s) ? 0 : 1);
    return score(a) - score(b);
  });

  const textoPlano = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const amenidades = Object.entries(AMENIDAD_KEYWORDS)
    .filter(([, kws]) => kws.some((k) => new RegExp(k, "i").test(textoPlano)))
    .map(([nombre]) => nombre);

  // Intento de ciudad: busca "Ciudad, Departamento/País" típico en el texto
  const ciudadMatch = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+),\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/);
  const ciudad = ciudadMatch?.[1] ?? "";

  return NextResponse.json({ titulo, descripcion, h1, imagenes, amenidades, ciudad, fuente: url.trim() });
}
