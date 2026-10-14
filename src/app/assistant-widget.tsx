"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { useCurrency } from "@/lib/currency";

type Msg = { role: "user" | "assistant"; text: string };
type Sug = { listingId: string; titulo: string; ciudad: string; precioNoche: number; rating: number; resenas: number; imagen: string; available: boolean | null; note: string };

const QUICK = ["Busco en Cartagena", "Subarriendo en Bogotá", "Lo más barato", "Hola"];

export function AssistantWidget({ onOpen }: { onOpen: (listingId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "¡Hola! Soy Bio. Te ayudo a encontrar tu hospedaje ideal: dime ciudad, presupuesto y fechas y verifico disponibilidad real." },
  ]);
  const [sugs, setSugs] = useState<Sug[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { fmt } = useCurrency();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, open]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...msgs, { role: "user" as const, text: t }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const d = await res.json();
      setMsgs([...next, { role: "assistant" as const, text: d.reply ?? "…" }]);
      setSugs(d.suggestions ?? []);
    } catch {
      setMsgs([...next, { role: "assistant" as const, text: "Tuve un problema de conexión. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Hablar con Bio, asistente IA"
          style={{ position: "fixed", right: 18, bottom: 18, zIndex: 90, width: 58, height: 58, borderRadius: "50%", border: 0, background: "linear-gradient(135deg,#16a34a,#65a30d)", color: "white", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 12px 32px #14532d55" }}
        >
          <Icon name="bot" size={28} />
        </button>
      )}
      {open && (
        <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 90, width: "min(380px, calc(100vw - 36px))", height: "min(560px, calc(100vh - 120px))", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "0 24px 70px #00000045", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", background: "linear-gradient(135deg,#14532d,#16a34a)", color: "white", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bot" size={24} />
            <div style={{ flex: 1 }}><strong>Bio · Asistente</strong><br /><small style={{ opacity: 0.85 }}>Conoce todo el catálogo</small></div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" style={{ border: 0, background: "transparent", color: "white", cursor: "pointer" }}><Icon name="x" size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? "var(--green)" : "var(--tint)", color: m.role === "user" ? "white" : "var(--ink)", borderRadius: 14, padding: "9px 12px", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.text}</div>
            ))}
            {sugs.map((s) => (
              <div key={s.listingId} style={{ display: "flex", gap: 10, border: "1px solid var(--line)", borderRadius: 12, padding: 8, background: "var(--surface-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imagen} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.titulo}</strong>
                  <small className="muted">{s.ciudad} · ⭐ {s.rating} · {fmt(s.precioNoche)}</small><br />
                  <small style={{ color: s.available === false ? "#ef4444" : "var(--green)", fontWeight: 700 }}>{s.note}</small>
                  <div><button className="btn btn-green" style={{ padding: "6px 12px", fontSize: 12, marginTop: 4 }} onClick={() => onOpen(s.listingId)}>Ver y reservar</button></div>
                </div>
              </div>
            ))}
            {loading && <div className="muted" style={{ fontSize: 12 }}>Bio está buscando…</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "8px 10px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--line)" }}>
            {QUICK.map((q) => (
              <button key={q} className="pill" style={{ fontSize: 11, padding: "6px 10px" }} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
          <div style={{ padding: "8px 10px 10px", display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(input); }} placeholder="Ej. Cabaña en Santa Marta del 2026-12-01 al 2026-12-05" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
            <button className="btn btn-green" disabled={loading} onClick={() => send(input)} aria-label="Enviar" style={{ padding: "0 14px" }}><Icon name="send" size={17} /></button>
          </div>
        </div>
      )}
    </>
  );
}
