"use client";

import { useState } from "react";
import type { Listing, ListingTheme } from "@/lib/data";
import { Icon } from "@/app/icons";

type EditableListing = Listing & { active?: boolean };

export function ListingEditForm({ listing, endpoint, maxDesc = 5000, notify, onClose, onSaved }: {
  listing: EditableListing;
  endpoint: "/api/listings" | "/api/admin/listings";
  maxDesc?: number;
  notify: (message: string) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(listing.titulo);
  const [ciudad, setCiudad] = useState(listing.ciudad);
  const [direccion, setDireccion] = useState(listing.direccion ?? "");
  const [tipo, setTipo] = useState<"reserva" | "subarriendo">(listing.tipo);
  const [categoria, setCategoria] = useState(listing.categoria);
  const [precioNoche, setPrecioNoche] = useState(String(listing.precioNoche));
  const [precioMes, setPrecioMes] = useState(listing.precioMes ? String(listing.precioMes) : "");
  const [huespedes, setHuespedes] = useState(String(listing.huespedes));
  const [descripcion, setDescripcion] = useState(listing.descripcion);
  const [fotos, setFotos] = useState(listing.galeria.join("\n"));
  const [amenidades, setAmenidades] = useState(listing.amenidades.join(", "));
  const [checkIn, setCheckIn] = useState(listing.checkIn);
  const [checkOut, setCheckOut] = useState(listing.checkOut);
  const [minStay, setMinStay] = useState(String(listing.minStay));
  const [maxStay, setMaxStay] = useState(String(listing.maxStay));
  const [breakfast, setBreakfast] = useState(listing.breakfastIncluded);
  const [cancellationPolicy, setCancellationPolicy] = useState(listing.cancellationPolicy);
  const [reglas, setReglas] = useState(listing.houseRules.join("\n"));
  const [politicas, setPoliticas] = useState(listing.politicas);
  const [primary, setPrimary] = useState(listing.theme?.primary ?? "#1d4a2c");
  const [accent, setAccent] = useState(listing.theme?.accent ?? "#bef264");
  const [preset, setPreset] = useState<ListingTheme["preset"]>(listing.theme?.preset ?? "selva");
  const [active, setActive] = useState(listing.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    setSaving(true);
    setError("");
    const payload = {
      id: listing.id,
      titulo,
      ciudad,
      direccion,
      tipo,
      categoria,
      precioNoche: Number(precioNoche) || 0,
      precioMes: precioMes ? Number(precioMes) : undefined,
      huespedes: Number(huespedes) || 1,
      descripcion,
      imagenes: fotos.split("\n").map((s) => s.trim()).filter(Boolean),
      amenidades: amenidades.split(",").map((s) => s.trim()).filter(Boolean),
      checkIn,
      checkOut,
      minStay: Number(minStay) || 1,
      maxStay: Number(maxStay) || 30,
      breakfastIncluded: breakfast,
      cancellationPolicy,
      houseRules: reglas.split("\n").map((s) => s.trim()).filter(Boolean),
      politicas,
      theme: { primary, accent, preset },
      active,
    };
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      notify("Alojamiento actualizado.");
      onSaved();
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="eyebrow">EDITAR ALOJAMIENTO</span>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
          </div>
          <h3 style={{ margin: "6px 0 14px" }}>{listing.titulo}</h3>

          <div className="field"><label>Título</label><input value={titulo} maxLength={140} onChange={(e) => setTitulo(e.target.value)} /></div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "1 1 200px" }}><label>Ciudad</label><input value={ciudad} maxLength={100} onChange={(e) => setCiudad(e.target.value)} /></div>
            <div className="field" style={{ flex: "2 1 280px" }}><label>Dirección</label><input value={direccion} maxLength={200} onChange={(e) => setDireccion(e.target.value)} /></div>
          </div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "1 1 150px" }}><label>Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value as "reserva" | "subarriendo")}><option value="reserva">Reserva por noche</option><option value="subarriendo">Subarriendo mensual</option></select></div>
            <div className="field" style={{ flex: "1 1 150px" }}><label>Categoría</label><input value={categoria} maxLength={40} disabled={tipo === "subarriendo"} onChange={(e) => setCategoria(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Huéspedes</label><input type="number" min={1} max={50} value={huespedes} onChange={(e) => setHuespedes(e.target.value)} /></div>
          </div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "1 1 160px" }}><label>Precio / noche (COP)</label><input type="number" min={0} value={precioNoche} onChange={(e) => setPrecioNoche(e.target.value)} /></div>
            <div className="field" style={{ flex: "1 1 160px" }}><label>Precio / mes (COP)</label><input type="number" min={0} value={precioMes} disabled={tipo !== "subarriendo"} onChange={(e) => setPrecioMes(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Check-in</label><input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Check-out</label><input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div>
          </div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "0 1 140px" }}><label>Mín. noches</label><input type="number" min={1} max={365} value={minStay} onChange={(e) => setMinStay(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 140px" }}><label>Máx. noches</label><input type="number" min={1} max={3650} value={maxStay} onChange={(e) => setMaxStay(e.target.value)} /></div>
            <label className="row" style={{ gap: 8, marginTop: 24, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={breakfast} onChange={(e) => setBreakfast(e.target.checked)} /> Desayuno incluido
            </label>
            <label className="row" style={{ gap: 8, marginTop: 24, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Publicación activa
            </label>
          </div>

          <div className="field">
            <label>Descripción ({descripcion.length}/{maxDesc})</label>
            <textarea rows={4} value={descripcion} maxLength={maxDesc} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <div className="field">
            <label>Fotos · una URL por línea (la primera es la portada)</label>
            <textarea rows={4} value={fotos} onChange={(e) => setFotos(e.target.value)} placeholder="https://…/foto-1.jpg" />
          </div>

          <div className="field"><label>Amenidades · separadas por coma</label><input value={amenidades} onChange={(e) => setAmenidades(e.target.value)} placeholder="Wifi, Desayuno, Piscina" /></div>
          <div className="field"><label>Política de cancelación</label><textarea rows={2} value={cancellationPolicy} maxLength={500} onChange={(e) => setCancellationPolicy(e.target.value)} /></div>
          <div className="field"><label>Reglas de la casa · una por línea</label><textarea rows={3} value={reglas} onChange={(e) => setReglas(e.target.value)} /></div>
          <div className="field"><label>Políticas generales</label><textarea rows={2} value={politicas} maxLength={500} onChange={(e) => setPoliticas(e.target.value)} /></div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Color principal</label><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Color acento</label><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} /></div>
            <div className="field" style={{ flex: "1 1 160px" }}><label>Preset del micrositio</label><select value={preset} onChange={(e) => setPreset(e.target.value as ListingTheme["preset"])}><option value="selva">Selva</option><option value="mar">Mar</option><option value="colonial">Colonial</option><option value="urbano">Urbano</option><option value="minimal">Minimal</option></select></div>
          </div>

          {error && <div className="aibox warn">{error}</div>}

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn btn-green" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
