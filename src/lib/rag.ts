import { store, type ListingTheme, type RagDoc } from "./store";

// RAG léxico local (TF-IDF + coseno): aprende del contenido que suben los usuarios.
// Sin dependencias ni claves: funciona offline. Si se configura un LLM, se usa para redactar.

const STOP = new Set(
  "el,la,los,las,un,una,de,del,en,y,o,u,que,se,con,por,para,como,su,al,lo,esto,esta,este,son,hay,muy,mas,más,sin,sus,entre,hasta,desde,the,and,for,with,from,que,los".split(","),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  tokens.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
  const n = Math.max(1, tokens.length);
  m.forEach((v, k) => m.set(k, v / n));
  return m;
}

export type Scored = { doc: RagDoc; score: number; snippet: string; source: string };

type Section = { label: string; text: string };
type Chunk = { label: string; text: string };

// Fragmentos pequeños para que la cita apunte a la sección exacta del alojamiento.
const MIN_SECTION = 150;
const MAX_CHUNK = 260;

function splitLong(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const cut = rest.lastIndexOf(" ", max);
    const at = cut > Math.floor(max * 0.5) ? cut : max;
    parts.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// Las secciones con sustento van solas (partidas si exceden MAX_CHUNK); las cortas se agrupan.
function assembleChunks(sections: Section[]): Chunk[] {
  const chunks: Chunk[] = [];
  let group: Section[] = [];
  let chars = 0;
  const flush = () => {
    if (!group.length) return;
    chunks.push({ label: group.map((s) => s.label).join(" · "), text: group.map((s) => s.text).join("\n") });
    group = [];
    chars = 0;
  };
  for (const s of sections) {
    if (s.text.length >= MIN_SECTION) {
      flush();
      const parts = splitLong(s.text, MAX_CHUNK);
      parts.forEach((p, j) => chunks.push({ label: parts.length > 1 ? `${s.label} ${j + 1}/${parts.length}` : s.label, text: p }));
      continue;
    }
    if (group.length && chars + s.text.length > MAX_CHUNK) flush();
    group.push(s);
    chars += s.text.length;
  }
  flush();
  return chunks;
}

// Contenido del alojamiento partido en fragmentos etiquetados por sección.
export type IndexableListing = {
  titulo: string;
  descripcion: string;
  ciudad: string;
  categoria: string;
  amenidades: string[];
  politicas: string;
  precioNoche: number;
  huespedes: number;
  theme?: ListingTheme;
};

export function chunkListing(l: IndexableListing): Chunk[] {
  const sections: Section[] = [
    {
      label: "Perfil",
      text: [`Título: ${l.titulo}`, `Ubicación: ${l.ciudad}`, `Categoría: ${l.categoria}`, `Capacidad: ${l.huespedes} huéspedes`].join("\n"),
    },
    { label: "Precio", text: `Precio por noche: ${l.precioNoche} COP para ${l.huespedes} huéspedes` },
    { label: "Descripción", text: `Descripción: ${l.descripcion}` },
    { label: "Amenidades", text: `Amenidades: ${l.amenidades.join(", ")}` },
    { label: "Políticas", text: `Políticas: ${l.politicas}` },
    l.theme
      ? {
          label: "Diseño",
          text: `Diseño del sitio: estilo ${l.theme.preset}, colores ${l.theme.primary} y ${l.theme.accent}, tipografía ${l.theme.font}. ${l.theme.rationale}`,
        }
      : null,
  ].filter((s): s is Section => Boolean(s) && s!.text.trim().length > 0);
  return assembleChunks(sections);
}

// El texto completo del alojamiento (concatenando sus fragmentos).
export function docText(l: IndexableListing): string {
  return chunkListing(l).map((c) => c.text).join("\n");
}

export function searchDocs(query: string, docs: RagDoc[], topK = 3, listingId?: string): Scored[] {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const pool = listingId ? docs.filter((d) => d.listingId === listingId) : docs;
  const N = Math.max(1, pool.length);
  const df = new Map<string, number>();
  const docTokens = pool.map((d) => {
    const toks = tokenize(d.text);
    new Set(toks).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
    return toks;
  });
  const idf = (t: string) => Math.log(1 + N / (1 + (df.get(t) ?? 0)));
  const qTf = tf(qTokens);
  let qNorm = 0;
  qTf.forEach((v, k) => { qNorm += (v * idf(k)) ** 2; });
  qNorm = Math.sqrt(qNorm) || 1;

  const scored = pool
    .map((doc, i) => {
      const dTf = tf(docTokens[i]);
      let dot = 0;
      let dNorm = 0;
      dTf.forEach((v, k) => {
        const w = v * idf(k);
        dNorm += w * w;
        if (qTf.has(k)) dot += w * (qTf.get(k)! * idf(k));
      });
      const score = dot / ((Math.sqrt(dNorm) || 1) * qNorm);
      return { doc, score, snippet: bestSnippet(doc.text, qTokens), source: sourceOf(doc) };
    })
    .filter((s) => s.score > 0.02);

  // TopK por alojamiento: un solo listado no puede acaparar todas las citas.
  const perListing = new Map<string, number>();
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => {
      const n = (perListing.get(s.doc.listingId) ?? 0) + 1;
      if (n > 2) return false;
      perListing.set(s.doc.listingId, n);
      return true;
    })
    .slice(0, topK);
}

function sourceOf(doc: RagDoc): string {
  const base = `«${doc.title}»`;
  if (!doc.label) return base;
  const parts = doc.label.split(" · ");
  if (parts.length === 1) return `${base} — ${doc.label}`;
  const shown = parts.slice(0, 2).join(" · ");
  return `${base} — ${shown}${parts.length > 2 ? ` (+${parts.length - 2} más)` : ""}`;
}

function bestSnippet(text: string, qTokens: string[]): string {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lines = text.split("\n").filter((l) => l.trim().length > 10);
  // Las líneas de "Título:" no aportan: solo como último recurso
  const content = lines.filter((l) => !/^título:/i.test(l.trim()));
  const pool = content.length ? content : lines;
  let best = pool[0] ?? "";
  let bestScore = -1;
  for (const line of pool) {
    const nl = norm(line);
    const s = qTokens.reduce((acc, t) => acc + (nl.includes(t) ? 1 : 0), 0);
    if (s > bestScore) { bestScore = s; best = line; }
  }
  return best.trim().slice(0, 280);
}

function chunkRows(l: IndexableListing & { id: string }): RagDoc[] {
  const chunks = chunkListing(l);
  const now = new Date().toISOString();
  return chunks.map((c, i) => ({
    id: `rag-${l.id}-${i}`,
    listingId: l.id,
    title: l.titulo,
    text: c.text,
    label: c.label,
    chunkIndex: i,
    chunkCount: chunks.length,
    updatedAt: now,
  }));
}

export async function indexListing(l: IndexableListing & { id: string }) {
  const docs = await store.ragDocs();
  const rows = chunkRows(l);
  await store.saveRagDocs([...docs.filter((d) => d.listingId !== l.id), ...rows]);
  return rows;
}

export async function removeFromIndex(listingId: string) {
  const docs = await store.ragDocs();
  await store.saveRagDocs(docs.filter((d) => d.listingId !== listingId));
}

// Devuelve el número de alojamientos reindexados (no de fragmentos).
export async function reindexAll() {
  const listings = await store.listings();
  const activos = listings.filter((l) => l.active !== false);
  await store.saveRagDocs(activos.flatMap((l) => chunkRows(l)));
  return activos.length;
}
