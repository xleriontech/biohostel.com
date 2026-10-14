"use client";

import { useState } from "react";
import { Icon } from "./icons";

export function AuthModal({ mode, onMode, onClose, onAuth }: {
  mode: "login" | "register";
  onMode: (m: "login" | "register") => void;
  onClose: () => void;
  onAuth: (mode: "login" | "register", name: string, email: string, password: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="eyebrow">BIOHOSTEL.COM</span>
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
          {err && <div className="aibox warn">{err}</div>}
          <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={loading} onClick={() => onAuth(mode, name, email, password, setErr, setLoading)}>
            {loading ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
