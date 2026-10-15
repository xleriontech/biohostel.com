import { store, type RagDoc } from "./store";

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

export function docText(l: {
  titulo: string;
  descripcion: string;
  ciudad: string;
  categoria: string;
  amenidades: string[];
  politicas: string;
  precioNoche: number;
  huespedes: number;
  theme?: { primary: string; accent: string; preset: string; font: string; rationale: string };
}): string {
  return [
    `Título: ${l.titulo}`,
    `Ubicación: ${l.ciudad}`,
    `Categoría: ${l.categoria}`,
    `Precio por noche: ${l.precioNoche} COP para ${l.huespedes} huéspedes`,
    `Descripción: ${l.descripcion}`,
    `Amenidades: ${l.amenidades.join(", ")}`,
    `Políticas: ${l.politicas}`,
    l.theme ? `Diseño del sitio: estilo ${l.theme.preset}, colores ${l.theme.primary} y ${l.theme.accent}, tipografía ${l.theme.font}. ${l.theme.rationale}` : "",
  ].filter(Boolean).join("\n");
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  tokens.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
  const n = Math.max(1, tokens.length);
  m.forEach((v, k) => m.set(k, v / n));
  return m;
}

export type Scored = { doc: RagDoc; score: number; snippet: string };

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

  return pool
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
      return { doc, score, snippet: bestSnippet(doc.text, qTokens) };
    })
    .filter((s) => s.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
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

export async function indexListing(l: { id: string; titulo: string; descripcion: string; ciudad: string; categoria: string; amenidades: string[]; politicas: string; precioNoche: number; huespedes: number; theme?: { primary: string; accent: string; preset: string; font: string; rationale: string } }) {
  const docs = await store.ragDocs();
  const text = docText(l);
  const i = docs.findIndex((d) => d.listingId === l.id);
  const row: RagDoc = { id: i >= 0 ? docs[i].id : `rag-${l.id}`, listingId: l.id, title: l.titulo, text, updatedAt: new Date().toISOString() };
  if (i >= 0) docs[i] = row;
  else docs.push(row);
  await store.saveRagDocs(docs);
  return row;
}

export async function removeFromIndex(listingId: string) {
  const docs = await store.ragDocs();
  await store.saveRagDocs(docs.filter((d) => d.listingId !== listingId));
}

export async function reindexAll() {
  const listings = await store.listings();
  const docs: RagDoc[] = listings
    .filter((l) => l.active !== false)
    .map((l) => ({ id: `rag-${l.id}`, listingId: l.id, title: l.titulo, text: docText(l), updatedAt: new Date().toISOString() }));
  await store.saveRagDocs(docs);
  return docs.length;
}
