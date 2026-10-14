import { store, type AIProvider } from "./store";
import { searchDocs } from "./rag";

// Cliente LLM multi-proveedor. Las keys viven solo en .data/ai-config.json (PC local).
// Sin key configurada → modo local extractivo (funciona offline).

export const PROVIDERS: { id: AIProvider; nombre: string; keyUrl: string; keyLabel: string; needsKey: boolean; defaultModel: string; baseUrl: string }[] = [
  { id: "local", nombre: "Local extractivo", keyUrl: "", keyLabel: "", needsKey: false, defaultModel: "extractivo-tfidf", baseUrl: "" },
  { id: "openai", nombre: "OpenAI (GPT)", keyUrl: "https://platform.openai.com/api-keys", keyLabel: "Crear API key de OpenAI", needsKey: true, defaultModel: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", nombre: "Anthropic (Claude)", keyUrl: "https://console.anthropic.com/settings/keys", keyLabel: "Crear API key de Anthropic", needsKey: true, defaultModel: "claude-3-5-haiku-latest", baseUrl: "https://api.anthropic.com/v1" },
  { id: "gemini", nombre: "Google Gemini", keyUrl: "https://aistudio.google.com/apikey", keyLabel: "Crear API key de Gemini", needsKey: true, defaultModel: "gemini-2.0-flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { id: "openrouter", nombre: "OpenRouter", keyUrl: "https://openrouter.ai/keys", keyLabel: "Crear API key de OpenRouter", needsKey: true, defaultModel: "openai/gpt-4o-mini", baseUrl: "https://openrouter.ai/api/v1" },
  { id: "ollama", nombre: "Ollama (PC local)", keyUrl: "https://ollama.com/download", keyLabel: "Descargar Ollama", needsKey: false, defaultModel: "llama3.1", baseUrl: "http://localhost:11434/v1" },
  { id: "custom", nombre: "Compatible OpenAI (otro)", keyUrl: "", keyLabel: "", needsKey: true, defaultModel: "", baseUrl: "" },
];

async function openAIChat(baseUrl: string, apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
    body: JSON.stringify({ model, temperature: 0.3, max_tokens: 500, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d?.error?.message ?? `HTTP ${res.status}`);
  const text = d?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Respuesta vacía del modelo.");
  return String(text).trim();
}

async function anthropicChat(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 500, system, messages: [{ role: "user", content: user }] }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d?.error?.message ?? `HTTP ${res.status}`);
  const text = d?.content?.map((b: { text?: string }) => b.text ?? "").join("");
  if (!text) throw new Error("Respuesta vacía del modelo.");
  return text.trim();
}

export async function testConnection(provider: AIProvider, model: string, apiKey: string, baseUrl: string): Promise<string> {
  if (provider === "local") return "Modo local: no necesita conexión. Responde con el contenido indexado.";
  if (provider === "anthropic") {
    if (!apiKey) throw new Error("Falta la API key.");
    return anthropicChat(apiKey, model || "claude-3-5-haiku-latest", "Responde solo: OK", "Responde solo: OK");
  }
  const meta = PROVIDERS.find((p) => p.id === provider)!;
  const base = (baseUrl || meta.baseUrl).replace(/\/$/, "");
  if (!base) throw new Error("Falta el Base URL.");
  if (meta.needsKey && !apiKey) throw new Error("Falta la API key.");
  if (!model && provider !== "custom") throw new Error("Falta el modelo.");
  return openAIChat(base, apiKey, model || meta.defaultModel, "Responde solo: OK", "Responde solo: OK");
}

export async function polishReply(draft: string, context: string): Promise<string | null> {
  const cfg = await store.aiConfig().catch(() => null);
  if (!cfg || cfg.provider === "local") return null;
  if (!cfg.apiKey && cfg.provider !== "ollama") return null;
  const system = "Eres Bio, asistente de reservas de BioHostel Colombia. Reescribe el borrador de forma cálida y breve (máx 5 líneas), sin inventar datos ni precios. Conserva cifras y fechas exactas.";
  try {
    if (cfg.provider === "anthropic") return await anthropicChat(cfg.apiKey, cfg.model, system, `${context}\n\nBorrador:\n${draft}`);
    return await openAIChat(cfg.baseUrl, cfg.apiKey, cfg.model, system, `${context}\n\nBorrador:\n${draft}`);
  } catch {
    return null;
  }
}

export async function answerWithRAG(question: string, listingId?: string): Promise<{ answer: string; sources: string[]; provider: string; grounded: boolean }> {
  const docs = await store.ragDocs();
  const hits = searchDocs(question, docs, 3, listingId);
  const cfg = await store.aiConfig().catch(() => ({ provider: "local" as AIProvider, model: "", apiKey: "", baseUrl: "", updatedAt: "" }));

  if (!hits.length) {
    return {
      answer: "Aún no tengo información sobre eso en los contenidos publicados. Pregunta por ubicación, precios, amenidades, políticas o disponibilidad.",
      sources: [],
      provider: cfg.provider,
      grounded: false,
    };
  }

  const context = hits.map((h, i) => `[${i + 1}] ${h.doc.title}: ${h.doc.text}`).join("\n\n");
  const system = "Eres el asistente de BioHostel. Responde SOLO con la información del contexto sobre alojamientos. Sé breve (máx 4 líneas), en español, con precios en COP. Si el contexto no alcanza, dilo.";
  const sources = hits.map((h) => h.doc.title);

  // Modo local: respuesta extractiva con citas
  if (cfg.provider === "local" || !cfg.apiKey) {
    if (cfg.provider !== "local" && !cfg.apiKey && cfg.provider !== "ollama") {
      // proveedor con key pendiente → igual responde extractivo
    }
    const bullets = hits.map((h, i) => `• ${h.snippet} (fuente: ${h.doc.title})`).join("\n");
    return { answer: `Según lo publicado:\n${bullets}`, sources, provider: "local", grounded: true };
  }

  try {
    const text =
      cfg.provider === "anthropic"
        ? await anthropicChat(cfg.apiKey, cfg.model, system, `Contexto:\n${context}\n\nPregunta: ${question}`)
        : await openAIChat(cfg.baseUrl, cfg.apiKey, cfg.model, system, `Contexto:\n${context}\n\nPregunta: ${question}`);
    return { answer: text, sources, provider: cfg.provider, grounded: true };
  } catch (e) {
    const bullets = hits.map((h, i) => `• ${h.snippet} (fuente: ${h.doc.title})`).join("\n");
    return {
      answer: `El modelo falló (${e instanceof Error ? e.message : "?"}). Te respondo con lo publicado:\n${bullets}`,
      sources,
      provider: "local-fallback",
      grounded: true,
    };
  }
}
