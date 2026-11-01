// QA del RAG por fragmentos: cubrición del troceo, citas por seccion y retro-compatibilidad.
// No toca .data/ ni la red: usa el seed del repo. Ejecuta con: npm run qa:rag
import assert from "node:assert/strict";
import { LISTINGS } from "@/lib/data";
import { chunkListing, searchDocs, docText } from "@/lib/rag";

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error });
  }
}

const docs = [];
for (const l of LISTINGS.filter((x) => x.active !== false)) {
  chunkListing(l).forEach((c, i) => docs.push({
    id: `rag-${l.id}-${i}`,
    listingId: l.id,
    title: l.titulo,
    text: c.text,
    label: c.label,
    chunkIndex: i,
    chunkCount: chunkListing(l).length,
    updatedAt: "qa",
  }));
}

check("cada alojamiento queda en varios fragmentos", () => {
  const porListado = new Map();
  docs.forEach((d) => porListado.set(d.listingId, (porListado.get(d.listingId) ?? 0) + 1));
  [...porListado.values()].forEach((n) => assert.ok(n >= 2, `solo ${n} fragmentos`));
});

check("los fragmentos cubren el texto completo del alojamiento", () => {
  for (const l of LISTINGS) {
    const esperado = docText(l);
    const unido = chunkListing(l).map((c) => c.text).join("\n");
    assert.equal(unido, esperado, l.id);
  }
});

check("ningun fragmento es excesivamente largo", () => {
  docs.forEach((d) => assert.ok(d.text.length <= 260 + 240, `${d.id} mide ${d.text.length} caracteres`));
});

check("toda cita apunta a una seccion del alojamiento", () => {
  const hits = searchDocs("cancelacion check-in silencio", docs, 4);
  assert.ok(hits.length, "sin resultados");
  hits.forEach((h) => {
    assert.match(h.source, /^«.+» — .+$/, h.source);
    assert.ok(h.snippet.length > 0, "snippet vacio");
  });
});

check("una seccion larga se parte con etiqueta 1/n", () => {
  const largo = { ...LISTINGS[0], descripcion: "Cabaña ecológica entre bosque nativo con pileta. ".repeat(14) };
  const partes = chunkListing(largo).filter((c) => c.label.startsWith("Descripción"));
  assert.ok(partes.length >= 2, `una sola parte: ${partes[0]?.text.length} caracteres`);
  assert.match(partes[0].label, /^Descripción 1\/\d+$/, partes[0].label);
});

check("un alojamiento no acapara mas de dos fragmentos", () => {
  const hits = searchDocs("wifi desayuno pileta tour café", docs, 8);
  const porListado = new Map();
  hits.forEach((h) => porListado.set(h.doc.listingId, (porListado.get(h.doc.listingId) ?? 0) + 1));
  [...porListado.entries()].forEach(([id, n]) => assert.ok(n <= 2, `${id} aporta ${n} fragmentos`));
});

check("una sola palabra clave obtiene al menos una cita con seccion", () => {
  for (const q of ["wifi", "desayuno", "cancelación"]) {
    const hits = searchDocs(q, docs, 4);
    assert.ok(hits.length >= 1, `"${q}" no devolvió resultados`);
    assert.match(hits[0].source, / — /, `"${q}" citó sin seccion: ${hits[0].source}`);
  }
});

check("el formato antiguo (documento completo) sigue siendo citable", () => {
  const legacy = [{ id: "rag-viejo", listingId: "viejo", title: "Doc antiguo", text: "Políticas: mascotas permitidas bajo consulta", updatedAt: "qa" }];
  const hits = searchDocs("mascotas", legacy, 3);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].source, "«Doc antiguo»");
});

check("filtro por alojamiento y pregunta sin tokens utiles", () => {
  const solo = docs.filter((d) => d.listingId === docs[0].listingId);
  assert.ok(searchDocs("wifi", docs, 5, solo[0].listingId).every((h) => h.doc.listingId === solo[0].listingId));
  assert.deepEqual(searchDocs("¿??", docs, 3), []);
});

let failed = 0;
for (const c of checks) {
  if (c.ok) {
    console.log(`  ok   ${c.name}`);
  } else {
    failed++;
    console.log(`  FAIL ${c.name}\n       ${c.error.message}`);
  }
}
console.log(`\nRAG: ${checks.length - failed}/${checks.length} verificaciones OK · ${docs.length} fragmentos indexados`);
process.exit(failed ? 1 : 0);
