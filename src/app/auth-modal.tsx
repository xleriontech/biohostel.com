"use client";

import { useState } from "react";
import { Icon } from "./icons";

export function AuthModal({ mode, onMode, onClose, onAuth }: {
  mode: "login" | "register";
  onMode: (m: "login" | "register") => void;
  onClose: () => void;
  onAuth: (mode: "login" | "register", name: string, email: string, password: string, setErr: (m: string) => void, setLoading: (b: boolean) => void, consent: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="eyebrow">BIOHOSTELS.COM</span>
            <button className="btn btn-ghost" onClick={onClose}><Icon name="x" size={16} /></button>
          </div>
          <h3>{mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta gratis"}</h3>
          <div className="row" style={{ marginBottom: 12 }}>
            <button className={`pill ${mode === "login" ? "on" : ""}`} onClick={() => { onMode("login"); setErr(""); }}>Entrar</button>
            <button className={`pill ${mode === "register" ? "on" : ""}`} onClick={() => { onMode("register"); setErr(""); }}>Registrarme</button>
          </div>
          {mode === "register" && <div className="field"><label>Nombre</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" /></div>}
          <div className="field"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
          <div className="field"><label>Contraseña {mode === "register" && "(mínimo 6 caracteres)"}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {mode === "register" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--muted)", margin: "2px 0 8px", lineHeight: 1.45 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
              <span>
                Autorizo el tratamiento de mis datos para crear la cuenta, gestionar reservas y prevenir fraude.{" "}
                <a href="/privacidad" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--green)" }}>
                  Política de Privacidad
                </a>
                .
              </span>
            </label>
          )}
          {err && <div className="aibox warn">{err}</div>}
          <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={loading} onClick={() => {
            if (mode === "register" && !consent) {
              setErr("Debes autorizar el tratamiento de tus datos para crear la cuenta.");
              return;
            }
            onAuth(mode, name, email, password, setErr, setLoading, consent);
          }}>
            {loading ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
