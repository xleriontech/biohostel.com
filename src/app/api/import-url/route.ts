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
    if (!res.headers.get("content-type")?.includes("text/html")) throw new Error("Esa URL no devolvió una página HTML.");
    // 1. Leer texto RAW
    const rawText = await res.text();
    // 2. Extraer imágenes DEL HTML CRUPO ANTES de normalizar (para no romper src="...")
    let html = rawText;
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
    // 3. Normalización Latin-1→UTF-8 DESPUÉS de capturar imágenes
    // (sino los replace de Ã± etc. pueden romper los src="..." ya capturados)
    html = rawText;
    const latinToUtf8 = [
      ["Ã±", "ñ"], ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
      ["Ã", "Á"], ["Ã‰", "É"], ["Ãˆ", "Í"], ["Ã“", "Ó"], ["Ãš", "Ú"],
    ];
    for (const [broken, correct] of latinToUtf8) {
      html = html.replace(new RegExp(broken, "g"), correct);
    }
    // 4. Re-buscar imágenes DESPUÉS de normalizar (por si og-image o tags cambiaron)
    const vistas2 = new Set<string>();
    for (const m of html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
      const abs = absolutizar(m[1], url);
      if (!abs) continue;
      if (/\.(svg|ico)(\?|$)/i.test(abs) && !/logo/i.test(abs)) continue;
      if (/pixel|tracking|analytics|1x1/i.test(abs)) continue;
      vistas2.add(abs);
      if (vistas2.size >= 24) break;
    }
    // Merge: unir ambas sets
    for (const v of vistas2) { if (!vistas.has(v)) vistas.add(v); }
    // Si aun así no hay imágenes, usar og:image o placeholder
    if (vistas.size === 0) {
      if (ogImg) {
        const abs = absolutizar(ogImg, url);
        if (abs) vistas.add(abs);
      }
      if (vistas.size === 0) {
        vistas.add("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80");
      }
    }
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
  // Prioriza fotos reales (foto/, uploads, images) sobre logos
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

  const style = extraerEstilo(html, textoPlano);

  return NextResponse.json({ titulo, descripcion, h1, imagenes, amenidades, ciudad, fuente: url.trim(), style });
}

const VIBES: { preset: "selva" | "mar" | "colonial" | "urbano" | "minimal"; kws: RegExp; label: string }[] = [
  { preset: "selva", kws: /bosque|selva|naturaleza|eco|finca|monta[ñn]a|caf[eé]|rural|sostenible/i, label: "eco-natural" },
  { preset: "mar", kws: /playa|mar|caribe|oc[eé]ano|brisa|tropical|costa|isla/i, label: "costero" },
  { preset: "colonial", kws: /colonial|patrimonio|hist[oó]rico|casco antiguo|tradici[oó]n|artesanal/i, label: "colonial" },
  { preset: "urbano", kws: /cowork|n[oó]mada digital|ciudad|urbano|moderno|dise[ñn]o|boutique/i, label: "urbano" },
  { preset: "minimal", kws: /minimal|zen|bienestar|yoga|retiro|calma|contemplaci[oó]n/i, label: "bienestar minimal" },
];

function esNeutro(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx - mn < 28 || (mx > 225 && mn > 215) || mx < 30;
}

// BioStyle: deduce paleta, tipografía y preset desde el contenido del cliente
function extraerEstilo(html: string, textoPlano: string) {
  const themeColor = getMeta(html, "name", "theme-color") || getMeta(html, "name", "msapplication-TileColor");
  const css = [...html.matchAll(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join(" ");
  const inline = [...html.matchAll(/style=["']([^"']*)["']/gi)].map((m) => m[1]).join(" ");
  const freq = new Map<string, number>();
  for (const m of `${css} ${inline}`.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const hex = `#${m[1].toLowerCase()}`;
    if (!esNeutro(hex)) freq.set(hex, (freq.get(hex) ?? 0) + 1);
  }
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h);
  const fonts = `${css} ${inline}`.toLowerCase();
  const font: "serif" | "sans" = /georgia|playfair|merriweather|garamond|times|serif/.test(fonts) ? "serif" : "sans";
  const vibe = VIBES.find((v) => v.kws.test(textoPlano)) ?? { preset: "selva" as const, label: "eco-natural" };
  const defaults: Record<string, [string, string]> = {
    selva: ["#1d4a2c", "#bef264"],
    mar: ["#0e7490", "#fef3c7"],
    colonial: ["#92400e", "#fcd34d"],
    urbano: ["#1e3a8a", "#93c5fd"],
    minimal: ["#3f3f46", "#e4e4e7"],
  };
  const [dPrimary, dAccent] = defaults[vibe.preset];
  const primary = /^#[0-9a-f]{6}$/.test(themeColor) && !esNeutro(themeColor.toLowerCase()) ? themeColor : ranked[0] ?? dPrimary;
  const accent = ranked.find((h) => h !== primary) ?? dAccent;
  return {
    primary,
    accent,
    preset: vibe.preset,
    font,
    rationale: `Detecté estilo ${vibe.label}: primario ${primary} (de tu web) + acento ${accent}, tipografía ${font === "serif" ? "con serifas clásicas" : "moderna sin serifas"}. Puedes ajustarlo abajo.`,
  };
}