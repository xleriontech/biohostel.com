"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ADS, PLANS, type Listing, type PlanId } from "@/lib/data";
import { ThemeToggle } from "../theme-toggle";
import { CurrencySelect } from "../currency-select";
import { AuthModal } from "../auth-modal";
import { Icon } from "../icons";
import { useCurrency } from "@/lib/currency";

type User = { id: string; name: string; email: string; plan: PlanId; favorites: string[]; follows: string[] };
type Reservation = { id: string; code: string; listingTitle: string; guestName: string; checkIn: string; checkOut: string; guests: number; base: number; commission: number; total: number; status: string; aiReport: string; createdAt: string };
type Lead = { id: string; tipo: string; nombre: string; email: string; mensaje: string; detalle: string; createdAt: string };
type Channel = { id: string; plataforma: string; cuenta: string; ultima: string };
type ImportData = { titulo: string; descripcion: string; h1: string; imagenes: string[]; amenidades: string[]; ciudad: string; fuente: string };



export default function Panel() {
  const [tab, setTab] = useState("resumen");
  const [user, setUser] = useState<User | null>(null);
  const [received, setReceived] = useState<Reservation[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [toast, setToast] = useState("");

  // Importar
  const [importUrl, setImportUrl] = useState("https://tropicalbiohostel.pages.dev/");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [imp, setImp] = useState<ImportData | null>(null);
  const [fTitulo, setFTitulo] = useState("");
  const [fCiudad, setFCiudad] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fPrecio, setFPrecio] = useState("180000");
  const [fTipo, setFTipo] = useState<"reserva" | "subarriendo">("reserva");
  const [fHuespedes, setFHuespedes] = useState("2");
  const [selImgs, setSelImgs] = useState<string[]>([]);
  // Canales
  const [chPlat, setChPlat] = useState("Booking");
  const [chCuenta, setChCuenta] = useState("");
  // Canales por alojamiento (la IA los consulta y bloquea)
  const [chOpen, setChOpen] = useState("");
  const [chList, setChList] = useState<{ id: string; platform: string; url: string; icalUrl: string; occupied: string[]; lastSync: string }[]>([]);
  const [chPlatform, setChPlatform] = useState("Airbnb");
  const [chUrl, setChUrl] = useState("");
  const [chIcal, setChIcal] = useState("");

  async function loadChannels(listingId: string) {
    const d = await fetch(`/api/listing-channels?listingId=${listingId}`).then((r) => r.json()).catch(() => ({}));
    setChList(d.channels ?? []);
  }

  async function addChannel(listingId: string) {
    const res = await fetch("/api/listing-channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, platform: chPlatform, url: chUrl, icalUrl: chIcal }) });
    const d = await res.json();
    if (!res.ok) { notify(d.error ?? "Error."); return; }
    setChUrl(""); setChIcal("");
    notify(`Canal ${chPlatform} agregado. La IA ya lo consulta.`);
    loadChannels(listingId);
  }

  async function syncChannel(id: string, listingId: string) {
    notify("Sincronizando calendario…");
    const res = await fetch("/api/listing-channels", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await res.json();
    notify(res.ok ? `Sincronizado: ${d.nights} noches ocupadas.` : (d.error ?? "Error."));
    loadChannels(listingId);
  }
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(true);
  const { code: currencyCode, fmt, live: ratesLive, ratesDate } = useCurrency();

  async function doAuth(mode: "login" | "register", name: string, email: string, password: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) {
    setErr(""); setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "No se pudo entrar."); return; }
      setUser(d.user);
      setAuthOpen(false);
      notify(`Hola ${d.user.name.split(" ")[0]}, bienvenido al panel.`);
      refresh();
    } catch { setErr("Error de conexión."); } finally { setLoading(false); }
  }

  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 3500); }

  async function refresh() {
    const me = await fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ user: null }));
    setUser(me.user ?? null);
    if (!me.user) return;
    const [res, lst, lds, chs] = await Promise.all([
      fetch("/api/reservations").then((r) => r.json()).catch(() => ({})),
      fetch("/api/listings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/leads").then((r) => r.json()).catch(() => ({})),
      fetch("/api/channels").then((r) => r.json()).catch(() => ({})),
    ]);
    setReceived(res.received ?? []);
    const all: Listing[] = lst.listings ?? [];
    setAllListings(all);
    setMine(all.filter((l) => (l as unknown as { ownerId?: string }).ownerId === me.user.id));
    setLeads(lds.leads ?? []);
    setChannels(chs.channels ?? []);
  }

  useEffect(() => { refresh(); }, []);

  const totales = useMemo(() => {
    const act = received.filter((r) => r.status === "confirmada");
    const ingreso = act.reduce((s, r) => s + r.total, 0);
    const comisiones = act.reduce((s, r) => s + r.commission, 0);
    return { ingreso, comisiones, neto: ingreso - comisiones, count: received.length };
  }, [received]);

  const plan = user?.plan ?? "gratuito";
  const limite = plan === "gratuito" ? { fotos: 5, desc: 300, alojamientos: 1 } : plan === "corporativo" ? { fotos: "∞", desc: "∞", alojamientos: 20 } : { fotos: "∞+video", desc: "∞+SEO", alojamientos: "∞" };

  async function cambiarPlan(p: PlanId) {
    const res = await fetch("/api/auth/plan", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p }) });
    const d = await res.json();
    if (!res.ok) { notify(d.error ?? "Error."); return; }
    setUser(d.user);
    notify(`Plan ${d.user.plan} activado · comisión ${Math.round(d.rate * 100)}%.`);
  }

  async function importar() {
    setImporting(true); setImportError(""); setImp(null);
    try {
      const res = await fetch("/api/import-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: importUrl }) });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error ?? "No se pudo importar."); return; }
      setImp(data);
      setFTitulo(data.h1 || data.titulo || "");
      setFCiudad(data.ciudad || "");
      setFDesc(data.descripcion || "");
      setSelImgs((data.imagenes as string[]).slice(0, 8));
      notify(`Extraído: ${(data.imagenes as string[]).length} imágenes, amenidades y descripción.`);
    } catch { setImportError("Error de conexión."); } finally { setImporting(false); }
  }

  async function publicar() {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: fTitulo, ciudad: fCiudad, descripcion: fDesc, precioNoche: Number(fPrecio), tipo: fTipo, huespedes: Number(fHuespedes), imagenes: selImgs, amenidades: imp?.amenidades ?? [], fuente: imp?.fuente ?? "" }),
    });
    const d = await res.json();
    if (!res.ok) { notify(d.error ?? "No se pudo publicar."); return; }
    setImp(null);
    notify(`"${d.listing.titulo}" publicado. Ya está en el sitio.`);
    refresh();
  }

  async function eliminarListing(id: string) {
    if (!confirm("¿Eliminar esta publicación del sitio?")) return;
    await fetch(`/api/listings?id=${id}`, { method: "DELETE" });
    notify("Publicación eliminada.");
    refresh();
  }

  async function setResStatus(id: string, status: string) {
    await fetch("/api/reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    notify(status === "cancelada" ? "Reserva cancelada y calendarios liberados." : "Reserva confirmada y notificada a los canales.");
    refresh();
  }

  async function conectarCanal() {
    const res = await fetch("/api/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plataforma: chPlat, cuenta: chCuenta }) });
    const d = await res.json();
    if (!res.ok) { notify(d.error ?? "Error."); return; }
    setChCuenta("");
    notify(`${d.channel.plataforma} conectado. La IA ya sincroniza ese calendario.`);
    refresh();
  }

  async function quitarCanal(id: string) {
    await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
    refresh();
  }

  if (user === null) {
    return (
      <div>
        <div className="topbar">PANEL DE CONTROL · BIOHOSTEL.COM</div>
        <header className="header"><div className="page header-in">
          <a className="brand" href="/"><span className="brand-mark"><Icon name="logo" size={22} /></span><span>biohostel<small>PANEL</small></span></a>
          <div className="hactions"><CurrencySelect /><ThemeToggle /><a className="btn btn-ghost" href="/">← Ver sitio</a></div>
        </div></header>
        <div className="page section" style={{ maxWidth: 520 }}>
          <p className="eyebrow">PANEL DE CONTROL</p>
          <h2>Entra para gestionar tu negocio</h2>
          <p className="muted">Usa tu misma cuenta del sitio. Si no tienes, regístrate aquí mismo gratis.</p>
          <div className="row">
            <button className="btn btn-green" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Entrar</button>
            <button className="btn btn-ghost" onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>Crear cuenta gratis</button>
          </div>
        </div>
        {authOpen && <AuthModal mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuth={doAuth} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">PANEL DE CONTROL · BIOHOSTEL.COM</div>
      <header className="header"><div className="page header-in">
        <a className="brand" href="/"><span className="brand-mark"><Icon name="logo" size={22} /></span><span>biohostel<small>PANEL</small></span></a>
        <nav className="nav">
          <button className={`pill ${tab === "resumen" ? "on" : ""}`} onClick={() => setTab("resumen")}>Resumen</button>
          <button className={`pill ${tab === "reservas" ? "on" : ""}`} onClick={() => setTab("reservas")}>Reservas + IA ({received.filter((r) => r.status === "confirmada").length})</button>
          <button className={`pill ${tab === "alojamientos" ? "on" : ""}`} onClick={() => setTab("alojamientos")}>Alojamientos ({mine.length})</button>
          <button className={`pill ${tab === "leads" ? "on" : ""}`} onClick={() => setTab("leads")}>Solicitudes ({leads.length})</button>
        </nav>
        <div className="hactions"><CurrencySelect /><ThemeToggle /><span className="muted"><Icon name="user" size={14} /> {user.name} · {user.plan}</span><a className="btn btn-ghost" href="/"><Icon name="arrowLeft" size={15} /> Ver sitio</a></div>
      </div></header>

      <div className="page section">
        <p className="eyebrow">HOLA, {user.name.toUpperCase()} · PLAN {plan.toUpperCase()}</p>
        <h2>Tu centro de mando</h2>
        <p className="muted"><Icon name="globe" size={14} /> Cifras en {currencyCode} · {ratesLive ? `tasa del día ${ratesDate}` : "tasa de referencia"}</p>
        <div className="row" style={{ margin: "12px 0" }}>
          <span className="muted">Cambiar plan:</span>
          {PLANS.map((p) => <button key={p.id} className={`pill ${plan === p.id ? "on" : ""}`} onClick={() => cambiarPlan(p.id)}>{p.nombre} · {p.comision}</button>)}
        </div>

        {tab === "resumen" && (
          <>
            <div className="kpis">
              <div className="kpi"><span className="muted">Reservas recibidas</span><strong>{totales.count}</strong><span className="muted">verificadas por IA</span></div>
              <div className="kpi"><span className="muted">Ingreso bruto</span><strong>{fmt(totales.ingreso)}</strong><span className="muted">incluye comisión</span></div>
              <div className="kpi"><span className="muted">Comisión plataforma</span><strong>{fmt(totales.comisiones)}</strong><span className="muted">según tu plan</span></div>
              <div className="kpi"><span className="muted">Neto para ti</span><strong>{fmt(totales.neto)}</strong><span className="muted">a tu cuenta</span></div>
            </div>
            <h3 style={{ marginTop: 22 }}><Icon name="bot" size={18} /> Verificación de reservas — conecta tus cuentas</h3>
            <p className="muted">La IA verifica cada reserva contra estos calendarios y bloquea las fechas automáticamente.</p>
            <table className="tbl"><thead><tr><th>PLATAFORMA</th><th>CUENTA</th><th>SYNC</th><th></th></tr></thead>
              <tbody>
                {channels.length === 0 && <tr><td colSpan={4} className="muted">Sin canales. Conecta tu Booking o Airbnb abajo.</td></tr>}
                {channels.map((c) => <tr key={c.id}><td><strong>{c.plataforma}</strong></td><td>{c.cuenta}</td><td><Icon name="check" size={14} /> {c.ultima}</td><td><button className="btn btn-ghost" onClick={() => quitarCanal(c.id)}><Icon name="trash" size={14} /> Quitar</button></td></tr>)}
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 10 }}>
              <select value={chPlat} onChange={(e) => setChPlat(e.target.value)} style={{ height: 46, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px" }}>
                <option>Booking</option><option>Airbnb</option><option>Expedia</option><option>Otro</option>
              </select>
              <input value={chCuenta} onChange={(e) => setChCuenta(e.target.value)} placeholder="ID de tu propiedad (ej. HMC-roma-44510)" style={{ flex: 1, height: 46, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px" }} />
              <button className="btn btn-green" onClick={conectarCanal}>+ Conectar</button>
            </div>
          </>
        )}

        {tab === "reservas" && (
          <>
            <h3>Reservas recibidas en tus alojamientos</h3>
            {received.length === 0 ? <p className="muted">Aún no recibes reservas. Publica y comparte tu enlace.</p> : (
              <table className="tbl"><thead><tr><th>CÓDIGO</th><th>HUÉSPED</th><th>ALOJAMIENTO</th><th>FECHAS</th><th>TOTAL</th><th>ESTADO</th><th></th></tr></thead>
                <tbody>{received.map((r) => (
                  <tr key={r.id}><td><strong>{r.code}</strong></td><td>{r.guestName}</td><td>{r.listingTitle}</td><td>{r.checkIn} → {r.checkOut}</td><td>{fmt(r.total)} <small className="muted">(com. {fmt(r.commission)})</small></td>
                    <td>{r.status === "confirmada" ? "Confirmada" : "Cancelada"}</td>
                    <td>{r.status === "confirmada" ? <button className="btn btn-ghost" onClick={() => setResStatus(r.id, "cancelada")}>Cancelar</button> : <button className="btn btn-ghost" onClick={() => setResStatus(r.id, "confirmada")}>Reactivar</button>}</td></tr>
                ))}</tbody>
              </table>
            )}
          </>
        )}

        {tab === "alojamientos" && (
          <>
            <h3>Importar cliente desde su página web</h3>
            <p className="muted">Pega la URL y los datos se rellenan solos: título, descripción, ciudad e imágenes.</p>
            <div className="row" style={{ marginTop: 8 }}>
              <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://mi-hostel.com" style={{ flex: 1, minWidth: 240, height: 46, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px" }} />
              <button className="btn btn-green" disabled={importing} onClick={importar}>{importing ? "Leyendo web…" : <><Icon name="download" size={15} /> Importar datos</>}</button>
            </div>
            {importError && <div className="aibox warn" style={{ marginTop: 10 }}>{importError}</div>}

            {imp && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, marginTop: 14 }}>
                <p className="eyebrow">DATOS EXTRAÍDOS · EDÍTALOS Y PUBLICA</p>
                {imp.amenidades.length > 0 && <p className="muted">Detectadas: {imp.amenidades.join(" · ")}</p>}
                <div className="field"><label>Título</label><input value={fTitulo} onChange={(e) => setFTitulo(e.target.value)} /></div>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}><label>Ciudad</label><input value={fCiudad} onChange={(e) => setFCiudad(e.target.value)} /></div>
                  <div className="field"><label>Precio / noche</label><input type="number" value={fPrecio} onChange={(e) => setFPrecio(e.target.value)} /></div>
                  <div className="field"><label>Tipo</label><select value={fTipo} onChange={(e) => setFTipo(e.target.value as "reserva" | "subarriendo")}><option value="reserva">Reserva por noche</option><option value="subarriendo">Subarriendo mensual</option></select></div>
                  <div className="field"><label>Huéspedes</label><input type="number" value={fHuespedes} onChange={(e) => setFHuespedes(e.target.value)} /></div>
                </div>
                <div className="field"><label>Descripción {plan === "gratuito" && `(${fDesc.length}/300)`}</label><textarea rows={4} value={fDesc} maxLength={plan === "gratuito" ? 300 : undefined} onChange={(e) => setFDesc(e.target.value)} /></div>
                <p className="muted">Toca para elegir fotos ({selImgs.length}{plan === "gratuito" ? "/5 máx" : ""}):</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {imp.imagenes.map((src) => {
                    const on = selImgs.includes(src);
                    return (
                      <button key={src} onClick={() => setSelImgs((cur) => (cur.includes(src) ? cur.filter((s) => s !== src) : [...cur, src]))} style={{ border: on ? "3px solid var(--green)" : "1px solid var(--line)", borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", opacity: on ? 1 : 0.55, position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                        {on && <span style={{ position: "absolute", top: 4, right: 4, background: "var(--green)", color: "white", borderRadius: 999, width: 22, height: 22, display: "grid", placeItems: "center" }}><Icon name="check" size={13} /></span>}
                      </button>
                    );
                  })}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btn-green" onClick={publicar}><Icon name="rocket" size={15} /> Publicar en biohostel.com</button>
                  <button className="btn btn-ghost" onClick={() => setImp(null)}>Descartar</button>
                </div>
              </div>
            )}

            <h3 style={{ marginTop: 26 }}>Mis publicaciones ({mine.length}/{plan === "gratuito" ? 1 : plan === "corporativo" ? 20 : "∞"})</h3>
            {mine.length === 0 ? <p className="muted">Nada publicado aún. Importa una web arriba.</p> : (
              <table className="tbl"><thead><tr><th>TÍTULO</th><th>TIPO</th><th>PRECIO</th><th>FOTOS</th><th></th></tr></thead>
                <tbody>{mine.map((p) => (
                  <Fragment key={p.id}>
                    <tr><td>{p.titulo}</td><td>{p.tipo}</td><td>{fmt(p.precioNoche)}</td><td>{p.galeria.length}</td>
                      <td><div className="row">
                        <button className="btn btn-ghost" onClick={() => { const open = chOpen === p.id ? "" : p.id; setChOpen(open); if (open) loadChannels(p.id); }}>Canales IA</button>
                        <button className="btn btn-ghost" onClick={() => eliminarListing(p.id)}>Eliminar</button>
                      </div></td></tr>
                    {chOpen === p.id && (
                      <tr key={`${p.id}-ch`}><td colSpan={5}>
                        <strong>Canales de “{p.titulo}”</strong>
                        <p className="muted">Agrega los links de Airbnb/Booking donde está el predio. Con el <strong>iCal</strong> (Airbnb → Disponibilidad → Exportar calendario) la IA lee la ocupación real. Al confirmar una reserva, la IA la marca aquí y te da el feed para devolver el bloqueo a esas plataformas.</p>
                        {chList.length === 0 ? <p className="muted">Sin canales. Agrega el primero abajo.</p> : (
                          <table className="tbl"><thead><tr><th>PLATAFORMA</th><th>LINK</th><th>OCUPADAS</th><th>SYNC</th><th></th></tr></thead>
                            <tbody>{chList.map((c) => (
                              <tr key={c.id}><td><strong>{c.platform}</strong></td>
                                <td>{c.url ? <a href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>abrir</a> : "—"}{c.icalUrl ? " · iCal ✓" : ""}</td>
                                <td>{c.occupied.length} noches</td><td>{c.lastSync === "nunca" ? "nunca" : String(c.lastSync).slice(0, 16).replace("T", " ")}</td>
                                <td><div className="row">
                                  {c.icalUrl && <button className="btn btn-ghost" onClick={() => syncChannel(c.id, p.id)}>Sincronizar</button>}
                                  <button className="btn btn-ghost" onClick={async () => { await fetch(`/api/listing-channels?id=${c.id}`, { method: "DELETE" }); loadChannels(p.id); }}>Quitar</button>
                                </div></td></tr>
                            ))}</tbody>
                          </table>
                        )}
                        <div className="row" style={{ marginTop: 8 }}>
                          <select value={chPlatform} onChange={(e) => setChPlatform(e.target.value)} style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10 }}>
                            <option>Airbnb</option><option>Booking</option><option>Expedia</option><option>Web</option><option>Otro</option>
                          </select>
                          <input value={chUrl} onChange={(e) => setChUrl(e.target.value)} placeholder="Link del anuncio https://…" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px" }} />
                          <input value={chIcal} onChange={(e) => setChIcal(e.target.value)} placeholder="URL iCal (exportar calendario)" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px" }} />
                          <button className="btn btn-green" onClick={() => addChannel(p.id)}>+ Agregar</button>
                        </div>
                        <p className="muted" style={{ marginTop: 8 }}>Feed para devolver bloqueos: <code>/api/calendar/{p.id}</code> — conéctalo en Airbnb/Booking como “Importar calendario”.</p>
                      </td></tr>
                    )}
                  </Fragment>
                ))}</tbody>
              </table>
            )}
            <p className="muted" style={{ marginTop: 12 }}>Catálogo total en el sitio: {allListings.length} alojamientos · Fotos: {String(limite.fotos)} · Descripción: {String(limite.desc)}</p>
          </>
        )}

        {tab === "leads" && (
          <>
            <h3>Solicitudes recibidas (paquetes, publicidad, mensajes)</h3>
            {leads.length === 0 ? <p className="muted">Sin solicitudes todavía.</p> : (
              <table className="tbl"><thead><tr><th>FECHA</th><th>TIPO</th><th>NOMBRE</th><th>EMAIL</th><th>DETALLE / MENSAJE</th></tr></thead>
                <tbody>{leads.map((l) => <tr key={l.id}><td>{l.createdAt.slice(0, 10)}</td><td><span className="tag tag-reserva">{l.tipo}</span></td><td>{l.nombre}</td><td>{l.email}</td><td><strong>{l.detalle}</strong><br /><span className="muted">{l.mensaje}</span></td></tr>)}</tbody>
              </table>
            )}
          </>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
