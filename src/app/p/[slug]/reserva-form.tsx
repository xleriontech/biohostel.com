"use client";

import { useState, useEffect } from "react";

export default function ReservaForm({
  listingId,
  defaultCheckIn,
  defaultCheckOut,
}: {
  listingId: string;
  defaultCheckIn: string;
  defaultCheckOut: string;
}) {
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState("2");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [extraSeguro, setExtraSeguro] = useState(false);
  const [extraDesayuno, setExtraDesayuno] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [resMsg, setResMsg] = useState("");
  const [resCode, setResCode] = useState("");

  async function reservarMicro() {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setResMsg("Fechas inválidas.");
      return;
    }
    if (!nombre.trim() || !email.trim() || !telefono.trim()) {
      setResMsg("Completa nombre, email y teléfono para confirmar.");
      return;
    }
    setReserving(true);
    setResMsg("Verificando disponibilidad...");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests: Number(guests) || 2,
          extras: { seguro: extraSeguro, desayuno: extraDesayuno },
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setResMsg(d.error || "No se pudo reservar (fechas ocupadas o límite).");
        return;
      }
      const r = d.reservation;
      setResCode(r.code);
      setResMsg(`Reserva confirmada: ${r.code} · Total: $${r.total.toLocaleString()} COP`);
    } catch (e) {
      setResMsg("Error de conexión al reservar.");
    } finally {
      setReserving(false);
    }
  }

  return (
    <div suppressHydrationWarning style={{ maxWidth: 560, margin: "0 auto 48px", padding: "32px 24px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(26,46,34,0.08)", border: "1px solid rgba(26,46,34,0.06)" }}>
      <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: 20, letterSpacing: "-1px", color: "#1d4a2c" }}>Reservar en este micrositio</h2>
      <p style={{ color: "#6b7f6e", fontSize: 14, marginBottom: 16 }}>Este motor es independiente. El precio usa pricing dinámico y los extras se aplican según tu cuenta.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Check-in</label>
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Check-out</label>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Huéspedes</label>
        <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#1a2e22", cursor: "pointer" }}>
          <input type="checkbox" checked={extraSeguro} onChange={(e) => setExtraSeguro(e.target.checked)} /> Seguro de cancelación (+5%)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#1a2e22", cursor: "pointer", marginTop: 6 }}>
          <input type="checkbox" checked={extraDesayuno} onChange={(e) => setExtraDesayuno(e.target.checked)} /> Desayuno incluido (+$20.000 COP)
        </label>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Nombre completo</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Correo electrónico</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1d4a2c", marginBottom: 6 }}>Teléfono (obligatorio para confirmar)</label>
        <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 123 4567" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #dcebd8", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 20 }}>
        <button disabled={reserving} onClick={reservarMicro} style={{ width: "100%", padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 16, background: "#1d4a2c", color: "#fff", border: "none", cursor: "pointer", opacity: reserving ? 0.7 : 1 }}>{reserving ? "Reservando..." : "Reservar en este micrositio"}</button>
      </div>
      {resMsg && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 15, background: resMsg.startsWith("Reserva confirmada") ? "#eef7ea" : "#fdeae9", color: resMsg.startsWith("Reserva confirmada") ? "#14532d" : "#7f1d1d", border: resMsg.startsWith("Reserva confirmada") ? "1px solid #dcebd8" : "1px solid #f5bcbc" }}>
          {resMsg}{resCode ? " · Código: " + resCode : ""}
        </div>
      )}
    </div>
  );
}
