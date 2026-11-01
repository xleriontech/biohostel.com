"use client";

import { useState } from "react";
import type { Listing, ListingTheme } from "@/lib/data";
import { Icon } from "@/app/icons";
import { LEGAL_VERSION, isValidRnt } from "@/lib/legal";

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
  const [rnt, setRnt] = useState(listing.rnt ?? "");
  const [subleaseDeclared, setSubleaseDeclared] = useState(!!listing.subleaseAuth?.confirmed);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [hasDoc, setHasDoc] = useState(!!listing.subleaseAuth?.docName);
  const [docBusy, setDocBusy] = useState(false);
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
  // Tema neutro por defecto: un micrositio sin configurar no debe parecerse a la marca de la plataforma.
  const [primary, setPrimary] = useState(listing.theme?.primary ?? "#3f3f46");
  const [accent, setAccent] = useState(listing.theme?.accent ?? "#e4e4e7");
  const [preset, setPreset] = useState<ListingTheme["preset"]>(listing.theme?.preset ?? "minimal");
  const [active, setActive] = useState(listing.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function subirDocumento(): Promise<boolean> {
    if (!docFile) return true;
    setDocBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("listingId", listing.id);
      form.append("file", docFile);
      const res = await fetch("/api/listings/sublease-doc", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir la autorización.");
        return false;
      }
      setHasDoc(true);
      setDocFile(null);
      return true;
    } catch {
      setError("Error de conexión al subir la autorización.");
      return false;
    } finally {
      setDocBusy(false);
    }
  }

  async function quitarDocumento() {
    if (!confirm("¿Quitar la autorización de subarriendo? La publicación se pausará.")) return;
    setDocBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/sublease-doc?id=${encodeURIComponent(listing.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo quitar el documento.");
        return;
      }
      setHasDoc(false);
      setSubleaseDeclared(false);
      notify("Autorización eliminada. La publicación fue pausada.");
      onSaved();
    } catch {
      setError("Error de conexión.");
    } finally {
      setDocBusy(false);
    }
  }

  async function guardar() {
    setError("");
    const mustComply = listing.legalVersion === LEGAL_VERSION;
    if (active && mustComply) {
      if (!isValidRnt(rnt)) {
        setError("El RNT es obligatorio para publicar. Escribe solo los dígitos del Registro Nacional de Turismo.");
        return;
      }
      if (tipo === "subarriendo" && !subleaseDeclared) {
        setError("Declara que cuentas con autorización escrita del propietario para subarrendar.");
        return;
      }
      if (tipo === "subarriendo" && !hasDoc && !docFile) {
        setError("Adjunta el documento de autorización del propietario antes de publicar.");
        return;
      }
    }
    setSaving(true);
    if (tipo === "subarriendo" && docFile) {
      const uploaded = await subirDocumento();
      if (!uploaded) {
        setSaving(false);
        return;
      }
    }
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
      rnt,
      subleaseDeclared,
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

          <div className="field">
            <label>RNT · Registro Nacional de Turismo</label>
            <input inputMode="numeric" value={rnt} maxLength={20} placeholder="Solo dígitos" onChange={(e) => setRnt(e.target.value)} />
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>Obligatorio para publicar (Decreto 1836 de 2021).</p>
            {listing.legalVersion !== LEGAL_VERSION && !rnt && (
              <div className="aibox warn" style={{ marginTop: 8 }}>
                Publicación heredada sin RNT. Complétalo para que aparezca en el micrositio.
              </div>
            )}
          </div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "1 1 200px" }}><label>Ciudad</label><input value={ciudad} maxLength={100} onChange={(e) => setCiudad(e.target.value)} /></div>
            <div className="field" style={{ flex: "2 1 280px" }}><label>Dirección</label><input value={direccion} maxLength={200} onChange={(e) => setDireccion(e.target.value)} /></div>
          </div>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field" style={{ flex: "1 1 150px" }}><label>Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value as "reserva" | "subarriendo")}><option value="reserva">Reserva por noche</option><option value="subarriendo">Subarriendo mensual</option></select></div>
            <div className="field" style={{ flex: "1 1 150px" }}><label>Categoría</label><input value={categoria} maxLength={40} disabled={tipo === "subarriendo"} onChange={(e) => setCategoria(e.target.value)} /></div>
            <div className="field" style={{ flex: "0 1 120px" }}><label>Huéspedes</label><input type="number" min={1} max={50} value={huespedes} onChange={(e) => setHuespedes(e.target.value)} /></div>
          </div>

          {tipo === "subarriendo" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <p className="eyebrow" style={{ marginTop: 0 }}>AUTORIZACIÓN DE SUBARRIENDO · LEY 820 DE 2003</p>
              <label className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}>
                <input type="checkbox" checked={subleaseDeclared} onChange={(e) => setSubleaseDeclared(e.target.checked)} />
                Declaro que cuento con autorización escrita del propietario para subarrendar este inmueble.
              </label>
              <div className="field" style={{ marginTop: 10 }}>
                <label>Documento de autorización (PDF, JPG, PNG o WEBP · máx. 8 MB)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={docBusy} onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                {hasDoc && (
                  <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
                    Documento cargado.{" "}
                    <a href={`/api/listings/sublease-doc?id=${encodeURIComponent(listing.id)}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                      Ver autorización
                    </a>
                    {" · "}
                    <button type="button" className="btn btn-ghost" disabled={docBusy} onClick={quitarDocumento}>Quitar</button>
                  </p>
                )}
                <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  Se guarda de forma privada: solo tú y el administrador pueden abrirlo.
                </p>
              </div>
            </div>
          )}

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
