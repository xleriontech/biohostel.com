"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ADS, LISTINGS, PLANS, SPONSORS, PAQUETES, aiVerificarReserva, type Ad, type Listing, type PlanId } from "@/lib/data";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySelect } from "./currency-select";
import { AssistantWidget } from "./assistant-widget";
import { AuthModal } from "./auth-modal";
import { Icon, type IconName } from "./icons";
import { useCurrency } from "@/lib/currency";

type User = { id: string; name: string; email: string; plan: PlanId; role?: string; favorites: string[]; follows: string[] };
type Booking = { id: string; code: string; listingTitle: string; checkIn: string; checkOut: string; guests: number; base: number; commission: number; total: number; status: string; aiReport: string; createdAt: string };
type ReservaPayload = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  extras: { seguro: boolean; desayuno: boolean };
  nombre?: string;
  email?: string;
  telefono?: string;
};

function normalizeText(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// alias para compatibilidad
const PACKS = PAQUETES;

function fmtMiles(n: number) {
  // Formato determinístico (evita hydration mismatch por locale del server vs cliente)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}



export function TasaDot({ live }: { live: boolean }) {
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: live ? "var(--green)" : "#b0b8b0" }} />
  );
}

// Cabecera premium de la card: foto + degradado + badges + título protagonista.
function CardImg({ listing: l, fav, onFav }: { listing: Listing; fav: boolean; onFav: () => void }) {
  const [err, setErr] = useState(false);
  const theme = (l as { theme?: { primary?: string; accent?: string } }).theme;
  return (
    <div className="limg" style={theme?.primary ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary} 60%, ${theme.accent || theme.primary})` } : {}}>
      {!err ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={l.imagen} alt={l.titulo} loading="lazy" onError={() => setErr(true)} />
      ) : (
        <div className="limg-fallback"><Icon name="logo" size={38} /><strong>{l.titulo}</strong></div>
      )}
      <div className="lshade" />
      <div className="ltop">
        <div className="row">
          <span className={`tag ${l.tipo === "reserva" ? "tag-reserva" : "tag-sub"}`}><Icon name={l.tipo === "reserva" ? "bed" : "home"} size={13} /> {l.tipo === "reserva" ? "RESERVA" : "SUBARRIENDO"}</span>
          {l.anfitrion.plan === "premium" && <span className="tag tag-plan-premium"><Icon name="star" size={12} filled /> PREMIUM</span>}
          {l.anfitrion.plan === "corporativo" && <span className="tag tag-plan-corporativo">◆ PRO</span>}
        </div>
        <button className={`lheart ${fav ? "on" : ""}`} onClick={onFav} aria-label="Guardar en favoritos"><Icon name="heart" size={18} filled={fav} /></button>
      </div>
      <div className="loverlay" style={theme?.accent ? { background: `linear-gradient(180deg, transparent, ${theme.accent}CC)` } : {}}>
        <span className="leyebrow">{l.categoria.toUpperCase()} · {l.ciudad.toUpperCase()}</span>
        <h3>{l.titulo}</h3>
        <div className="lmeta"><span className="lrating" style={theme?.accent ? { background: theme.accent, color: '#fff' } : {}}><Icon name="star" size={12} filled /> {l.rating}</span><span>{l.resenas} reseñas</span><span>·</span><span><Icon name="users" size={13} /> {l.huespedes}</span></div>
      </div>
    </div>
  );
}

export default function Site() {
  const [q, setQ] = useState("");
  const [ciudad, setCiudad] = useState("Todas");
  const [tipo, setTipo] = useState<"todos" | "reserva" | "subarriendo">("todos");
  const [checkIn, setCheckIn] = useState("2026-10-22");
  const [checkOut, setCheckOut] = useState("2026-10-24");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [aiMsg, setAiMsg] = useState("");
  const [aiOk, setAiOk] = useState<boolean | null>(null);
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [planActual, setPlanActual] = useState<PlanId>("gratuito");

  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [serverListings, setServerListings] = useState<Listing[] | null>(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lead, setLead] = useState<{ tipo: string; titulo: string; detalle: string } | null>(null);
  const [reserving, setReserving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lch, setLch] = useState<{ platform: string; url: string; occupied: string[]; lastSync: string }[]>([]);
  const [chatQ, setChatQ] = useState("");
  const [chatA, setChatA] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const router = useRouter();

  function openListing(l: Listing) {
    const slug = l.slug || (l.id || l.titulo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "alojamiento";
    router.push("/p/" + slug);
  }

  async function askAssistant() {
    if (!selected || chatQ.trim().length < 3) return;
    setChatLoading(true);
    setChatA("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: chatQ, listingId: selected.id }) });
      const d = await res.json();
      setChatA(res.ok ? `${d.answer}${d.sources?.length ? `\n\nFuentes: ${d.sources.join(", ")}` : ""}` : (d.error ?? "Error."));
    } catch { setChatA("Error de conexión."); } finally { setChatLoading(false); }
  }
  const { code: currencyCode, fmt, live: ratesLive, ratesDate } = useCurrency();

  const [adsLive, setAdsLive] = useState<Ad[] | null>(null);
  const [cfgRates, setCfgRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => null);
    fetch("/api/listings").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.listings)) setServerListings(d.listings);
    }).catch(() => null);
    fetch("/api/ads").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.ads) && d.ads.length) setAdsLive(d.ads);
    }).catch(() => null);
    fetch("/api/config").then((r) => r.json()).then((d) => {
      if (d?.config?.rates) setCfgRates(d.config.rates);
    }).catch(() => null);
  }, []);

  const todas = useMemo(() => serverListings ?? LISTINGS, [serverListings]);
  const ciudades = useMemo(() => ["Todas", ...Array.from(new Set(todas.map((l) => l.ciudad)))], [todas]);
  const filtrados = todas.filter((l) => {
    const okQ = !q || normalizeText(l.titulo + " " + l.ciudad + " " + l.descripcion).includes(normalizeText(q));
    const okC = ciudad === "Todas" || l.ciudad === ciudad;
    const okT = tipo === "todos" || l.tipo === tipo;
    return okQ && okC && okT;
  });
  const favs = user?.favorites ?? [];
  const seguidos = user?.follows ?? [];

  function notify(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  }

  function needLogin(): boolean {
    if (!user) { setAuthMode("login"); setAuthOpen(true); notify("Inicia sesión para continuar."); return true; }
    return false;
  }

  async function doAuth(mode: "login" | "register", name: string, email: string, password: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) {
    setErr(""); setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "No se pudo entrar."); return; }
      setUser(d.user);
      setAuthOpen(false);
      notify(`Hola ${d.user.name.split(" ")[0]}, sesión iniciada (${d.user.plan}).`);
    } catch { setErr("Error de conexión."); } finally { setLoading(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    notify("Sesión cerrada.");
  }

  async function toggleFav(id: string) {
    if (needLogin()) return;
    const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await res.json();
    if (d.user) setUser(d.user);
  }

  async function toggleFollow(host: string) {
    if (needLogin()) return;
    const res = await fetch("/api/follows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: host }) });
    const d = await res.json();
    if (d.user) { const adding = !seguidos.includes(host); setUser(d.user); if (adding) notify(`Ahora sigues a ${host}`); }
  }

  // Vista previa instantánea (la validación real la hace el servidor al reservar)
  function verificar(l: Listing) {
    const r = aiVerificarReserva(l, checkIn, checkOut);
    setAiOk(r.disponible);
    setAiMsg(r.mensaje);
    setSugerencia(r.sugerencia);
  }

  async function reservar(l: Listing) {
    if (user && checkOut <= checkIn) { notify("El check-out debe ser posterior al check-in."); return; }
    // Paso extra inteligente: extras opcionales
    const extras = confirm("¿Deseas agregar extras? (Seguro +5% · Desayuno +$20.000)\nOK = Sí, Cancelar = No extras");
    const extrasData = extras ? { seguro: true, desayuno: true } : { seguro: false, desayuno: false };
    // Si no está registrado, pide datos mínimos (fricción baja) para confirmar por teléfono
    let payload: ReservaPayload = { listingId: l.id, checkIn, checkOut, guests: l.huespedes, extras: extrasData };
    if (!user) {
      const nombreInv = prompt("Nombre para la reserva:", "Invitado") || "Invitado";
      const emailInv = prompt("Email para confirmación:", "") || `invitado@biohostel.com`;
      const telefonoInv = prompt("Teléfono (obligatorio para confirmar sin cuenta):", "");
      if (!telefonoInv || telefonoInv.trim().length < 6) {
        notify("Debes colocar tu teléfono para confirmar la reserva sin cuenta.");
        return;
      }
      payload = { ...payload, nombre: nombreInv, email: emailInv, telefono: telefonoInv.trim() };
    }
    setReserving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setAiOk(false);
        setAiMsg(d.aiReport ?? d.error ?? "No se pudo reservar.");
        setSugerencia(d.sugerencia ?? null);
        notify("IA bloqueó la reserva: fechas ocupadas.");
        return;
      }
      const r = d.reservation;
      setAiOk(true);
      setAiMsg(`${r.aiReport} Subtotal ${fmt(r.base)} + comisión ${fmt(r.commission)}${r.extrasTotal ? ` + extras ${fmt(r.extrasTotal)}` : ""} = Total ${fmt(r.total)}. Código ${r.code}.${r.extras?.seguro ? " · Seguro incluido" : ""}${r.extras?.desayuno ? " · Desayuno incluido" : ""}`);
      setSugerencia(null);
      notify(`Reserva ${r.code} confirmada · ${fmt(r.total)}`);
    } catch { notify("Error de conexión al reservar."); } finally { setReserving(false); }
  }

  async function elegirPlan(id: PlanId) {
    if (needLogin()) return;
    const res = await fetch("/api/auth/plan", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: id }) });
    const d = await res.json();
    if (!res.ok) { notify(d.error ?? "No se pudo cambiar el plan."); return; }
    setUser(d.user);
    notify(`Plan ${d.user.plan} activado. Comisión ahora ${Math.round(d.rate * 100)}%.`);
  }

  async function openBookings() {
    if (needLogin()) return;
    const res = await fetch("/api/reservations");
    const d = await res.json();
    setBookings(d.mine ?? []);
    setBookingsOpen(true);
  }

  async function cancelBooking(id: string) {
    const res = await fetch("/api/reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "cancelada" }) });
    if (res.ok) {
      setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: "cancelada" } : x)));
      notify("Reserva cancelada.");
    }
  }

  async function sendLead(nombre: string, email: string, mensaje: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) {
    if (!lead) return;
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: lead.tipo, nombre, email, mensaje, detalle: `${lead.titulo}` }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "No se pudo enviar."); return; }
      setLead(null);
      notify(`Solicitud enviada (folio ${d.id.slice(-6).toUpperCase()}). Te contactamos en 24h.`);
    } catch { setErr("Error de conexión."); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="topbar">BIOHOSTEL.COM · 1 RESERVA = 1 ÁRBOL · SINCRONIZADO CON BOOKING + AIRBNB</div>
      <header className="header">
        <div className="page header-in">
          <a className="brand" href="#top"><span className="brand-mark"><Icon name="logo" size={22} /></span><span>biohostel<small>.COM</small></span></a>
          <nav className="nav" aria-label="Secciones">
            <a href="#explorar">Explorar</a>
            <a href="#subarriendos">Subarriendos</a>
            <a href="#planes">Planes</a>
            <a href="#perfiles">Comunidad</a>
            <a href="#publicidad">Proveedores</a>
          </nav>
          <div className="hactions">
            <span className="hide-mobile"><CurrencySelect /></span>
            <span className="hide-mobile"><ThemeToggle /></span>
            <div className="usermenu">
              <button className="btn btn-ghost" onClick={() => setMenuOpen((o) => !o)} aria-label="Menú" aria-expanded={menuOpen} style={{ borderRadius: 999, padding: "9px 12px" }}>
                <Icon name="menu" size={18} /><Icon name="user" size={20} />
              </button>
              {menuOpen && (
                <div className="udropdown" onMouseLeave={() => setMenuOpen(false)}>
                  {user && <div className="uhead">Hola, <strong>{user.name.split(" ")[0]}</strong> · plan {user.plan}</div>}
                  <div className="only-mobile" style={{ padding: "4px 8px" }}>
                    <div className="row" style={{ gap: 8 }}>
                      <CurrencySelect />
                      <ThemeToggle />
                    </div>
                  </div>
                  <a href="#explorar" onClick={() => setMenuOpen(false)}><Icon name="search" size={16} /> Explorar</a>
                  <a href="#subarriendos" onClick={() => setMenuOpen(false)}><Icon name="home" size={16} /> Subarriendos</a>
                  <a href="#planes" onClick={() => setMenuOpen(false)}><Icon name="card" size={16} /> Planes</a>
                  <a href="#perfiles" onClick={() => setMenuOpen(false)}><Icon name="users" size={16} /> Comunidad</a>
                  <a href="#publicidad" onClick={() => setMenuOpen(false)}><Icon name="eye" size={16} /> Proveedores</a>
                  <hr />
                  {user ? (
                    <>
                      <button onClick={() => { setMenuOpen(false); openBookings(); }}><Icon name="case" size={16} /> Mis reservas</button>
                      <a href="/panel" onClick={() => setMenuOpen(false)}><Icon name="bed" size={16} /> Panel anfitrión</a>
                      {user.role === "admin" && <a href="/admin" onClick={() => setMenuOpen(false)}><Icon name="verified" size={16} /> Admin maestro</a>}
                      <button onClick={() => { setMenuOpen(false); logout(); }}><Icon name="logout" size={16} /> Cerrar sesión</button>
                    </>
                  ) : (
                    <button onClick={() => { setMenuOpen(false); setAuthMode("login"); setAuthOpen(true); }}><Icon name="user" size={16} /> Entrar / Crear cuenta</button>
                  )}
                </div>
              )}
            </div>
            <a className="btn btn-green" href="/panel">Publicar +</a>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="page">
          <p className="eyebrow">COMO BOOKING + AIRBNB, PERO VERDE</p>
          <h1>Reserva hostels <em>y subarriendos</em> con IA que evita overbooking.</h1>
          <p className="muted">Antes de cobrar, la IA verifica tus fechas en Booking y Airbnb. Si está ocupado, te sugiere otro día o lugar. Si está libre, reserva y bloquea las otras plataformas.</p>
          <div className="searchcard">
            <input placeholder="¿A dónde vas? Ej. Nocaima, Cartagena…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>{ciudades.map((c) => <option key={c}>{c}</option>)}</select>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            <button className="btn btn-dark" onClick={() => { const resultados = filtrados.length; document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" }); notify(`Mostrando ${resultados} alojamiento(s) con tus filtros.`); alert(`Búsqueda aplicada: ${resultados} resultados.`); }}>Buscar</button>
          </div>
          <div className="tabs">
            <button className={`pill ${tipo === "todos" ? "on" : ""}`} onClick={() => setTipo("todos")}>Todo</button>
            <button className={`pill ${tipo === "reserva" ? "on" : ""}`} onClick={() => setTipo("reserva")}><Icon name="bed" size={14} /> Reservas por noche</button>
            <button className={`pill ${tipo === "subarriendo" ? "on" : ""}`} onClick={() => setTipo("subarriendo")}><Icon name="home" size={14} /> Subarriendos mensuales</button>
          </div>
        </div>
      </section>

      <section className="section page" id="explorar">
        <p className="eyebrow">{filtrados.length} ALOJAMIENTOS EN COLOMBIA 🇨🇴</p>
        <h2>Explora y reserva</h2>
        <p className="muted"><Icon name="globe" size={14} /> Precios en {currencyCode} · <TasaDot live={ratesLive} /> {ratesLive ? `tasa del día ${ratesDate}` : "tasa de referencia"} · cambia la moneda arriba</p>
        <div className="grid3" style={{ marginTop: 18 }} id="subarriendos">
          {filtrados.map((l) => (
            <article key={l.id} className="lcard" onClick={() => openListing(l)} style={{ cursor: "pointer" }}>
              <CardImg listing={l} fav={favs.includes(l.id)} onFav={() => toggleFav(l.id)} />
              <div className="lbody">
                <div className="lhost">
                  <span className="lavatar">{l.anfitrion.avatar}</span>
                  <div className="lhost-txt"><strong>{l.anfitrion.nombre} {l.anfitrion.verificado && <Icon name="verified" size={14} />}</strong><small>{fmtMiles(l.anfitrion.seguidores)} seguidores · Responde ~1h</small></div>
                  {l.anfitrion.plan === "premium" && <span className="lsuper">SUPERHOST</span>}
                </div>
                <div className="lchips">{l.amenidades.slice(0, 3).map((a) => <span key={a} className="lchip"><Icon name="check" size={12} /> {a}</span>)}</div>
                <div className="lfoot">
                  <div><span className="price">{fmt(l.precioNoche)}</span><span className="muted"> /noche</span>{l.precioMes && <span className="muted"> · {fmt(l.precioMes)}/mes</span>}<small className="lia"><Icon name="bot" size={13} /> IA verificada</small></div>
                  <div className="row">
                    <button className="btn btn-green" onClick={(e) => { e.stopPropagation(); openListing(l); }}>Reservar</button>
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); toggleFollow(l.anfitrion.nombre); }}>{seguidos.includes(l.anfitrion.nombre) ? <><Icon name="check" size={14} /> Siguiendo</> : "+ Seguir"}</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section page" id="planes" style={{ background: "var(--paper)", borderRadius: 20, padding: 28 }}>
        <p className="eyebrow">PLANES PARA ANFITRIONES</p>
        <h2>Gratuito · Corporativo · Premium</h2>
        <p className="muted">Simula tu comisión: elige tu plan y verás cuánto retiene la plataforma.</p>
        <div className="row" style={{ marginTop: 12 }}>
          {PLANS.map((p) => (
            <button key={p.id} className={`pill ${planActual === p.id ? "on" : ""}`} onClick={() => setPlanActual(p.id)}>{p.nombre}</button>
          ))}
          <span className="muted">Ejemplo {fmt(200000)} → comisión {fmt(Math.round(200000 * (cfgRates?.[planActual] ?? PLANS.find((p) => p.id === planActual)!.comisionValor)))}</span>
        </div>
        <div className="plans">
          {PLANS.map((p) => (
            <div key={p.id} className={`plan ${p.destacado ? "hot" : ""}`}>
              {p.destacado && <span className="tag tag-plan-corporativo">RECOMENDADO</span>}
              <h3>{p.nombre}</h3>
              <p><strong style={{ fontSize: 26 }}>{p.precioCOP === 0 ? "$0" : fmt(p.precioCOP)}</strong> <span className="muted">{p.periodo}</span></p>
              <p className="muted"><Icon name="eye" size={13} /> {p.limiteFotos} · {p.limiteDescripcion} · <Icon name="card" size={13} /> {Math.round((cfgRates?.[p.id] ?? p.comisionValor) * 100)}% por reserva</p>
              <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <button className="btn btn-dark" style={{ width: "100%", justifyContent: "center" }} onClick={() => elegirPlan(p.id)}>{user?.plan === p.id ? <><Icon name="check" size={14} /> Tu plan actual</> : `Elegir ${p.nombre}`}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="section page" id="perfiles">
        <p className="eyebrow">COMUNIDAD ESTILO LINKEDIN + FACEBOOK</p>
        <h2>Perfiles que generan confianza</h2>
        <div className="profiles" style={{ marginTop: 16 }}>
          {LISTINGS.slice(0, 3).map((l) => (
            <div key={l.id} className="profile">
              <div className="cover" />
              <div className="pbody">
                <div className="avatar">{l.anfitrion.avatar}</div>
                <strong>{l.anfitrion.nombre} {l.anfitrion.verificado && <Icon name="verified" size={15} />}</strong>
                <p className="muted">Anfitrión {l.anfitrion.plan} · {l.ciudad} · <Icon name="users" size={13} /> {fmtMiles(l.anfitrion.seguidores)} seguidores</p>
                <p style={{ fontSize: 13 }}>{l.descripcion.slice(0, 110)}…</p>
                <div className="row">
                  <button className="btn btn-ghost" onClick={() => toggleFollow(l.anfitrion.nombre)}>{seguidos.includes(l.anfitrion.nombre) ? <><Icon name="check" size={14} /> Siguiendo</> : "+ Seguir"}</button>
                  <button className="btn btn-ghost" onClick={() => setLead({ tipo: "mensaje", titulo: `Mensaje a ${l.anfitrion.nombre}`, detalle: l.anfitrion.nombre })}><Icon name="message" size={14} /> Mensaje</button>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>⭐ {l.rating} · {l.resenas} reseñas · Responde en ~1h</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section page" id="publicidad">
        <p className="eyebrow">PUBLICIDAD DE PROVEEDORES</p>
        <h2>Tecnología · Colchones · Higiene · Energía</h2>
        <div className="ads" style={{ marginTop: 14 }}>
          {(adsLive ?? ADS).map((a) => (
            <div key={a.empresa} className="ad" style={{ background: a.color, overflow: "hidden" }}>
              {a.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt={a.empresa} style={{ width: "calc(100% + 32px)", height: 110, objectFit: "cover", margin: "-16px -16px 10px", display: "block" }} />
              ) : null}
              <small>{a.categoria.toUpperCase()}</small>
              <strong style={{ display: "block", margin: "6px 0" }}>{a.empresa}</strong>
              <span style={{ fontSize: 13 }}>{a.titulo} — {a.texto}</span>
              <div style={{ marginTop: 10 }}><button className="btn btn-ghost" onClick={() => setLead({ tipo: "publicidad", titulo: `Espacio publicitario (${a.categoria})`, detalle: a.empresa })}>Anunciarme</button></div>
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: 26 }}>Sponsors · Fundaciones</h3>
        <div className="sponsors">
          {SPONSORS.map((s) => (
            <div key={s.nombre} className="sponsor"><strong><Icon name={s.logo as IconName} size={16} /> {s.nombre}</strong><br /><span className="muted">{s.aporte}</span></div>
          ))}
          <div className="sponsor"><strong>+ Tu fundación aquí</strong><br /><span className="muted">Visibilidad en 6 países</span><br /><button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setLead({ tipo: "sponsor", titulo: "Alta de fundación sponsor", detalle: "" })}>Ser sponsor</button></div>
        </div>
        <h3 style={{ marginTop: 26 }}>Paquetes</h3>
        <div className="packs">
          {PACKS.map((p) => (
            <div key={p.id} className="pack">
              <div style={{ color: "var(--lime)" }}><Icon name={p.icono as IconName} size={30} /></div>
              <h3>{p.nombre}</h3>
              <strong style={{ color: "var(--lime)" }}>{fmt(p.precioCOP)} {p.precioNota}</strong>
              <p className="muted" style={{ color: "#cfe8cf" }}>{p.desc}</p>
              <button className="btn btn-green" onClick={() => setLead({ tipo: "paquete", titulo: `Paquete ${p.nombre} (${fmt(p.precioCOP)})`, detalle: p.id })}>Quiero este</button>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="page row" style={{ justifyContent: "space-between" }}>
          <div><strong><Icon name="logo" size={16} /> biohostel.com</strong><p className="muted">Hecho en Colombia · <a href="/panel" style={{ textDecoration: "underline" }}>Panel anfitrión</a> · <a href="/admin" style={{ textDecoration: "underline" }}>Admin maestro</a></p></div>
          <div className="row"><a href="/panel" className="btn btn-green">Ir al panel</a></div>
        </div>
      </footer>

      {selected && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-in">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">DETALLE Y RESERVA VERIFICADA</span>
                <button className="btn btn-ghost" onClick={() => setSelected(null)}><Icon name="x" size={16} /></button>
              </div>
              <h2 style={{ margin: "8px 0" }}>{selected.titulo}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.imagen} alt="" style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 12 }} />
              <p style={{ fontSize: 14 }}>{selected.descripcion}</p>
              <p><strong className="price" style={{ fontSize: 22 }}>{fmt(selected.precioNoche)}</strong><span className="muted"> /noche en {currencyCode}</span>{selected.precioMes && <span className="muted"> · {fmt(selected.precioMes)}/mes</span>}</p>
              <p className="muted">Políticas: {selected.politicas}</p>
              <p className="muted">{selected.amenidades.join(" · ")}</p>
              <div className="row">
                <div className="field"><label>Check-in</label><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div>
                <div className="field"><label>Check-out</label><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div>
              </div>
              <div className="aibox" style={{ marginBottom: 10 }}>
                <strong><Icon name="bot" size={14} /> Asistente del alojamiento — aprende de lo publicado</strong>
                <div className="row" style={{ marginTop: 8 }}>
                  <input value={chatQ} onChange={(e) => setChatQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askAssistant(); }} placeholder="¿Aceptan mascotas? ¿Qué incluye?" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
                  <button className="btn btn-dark" disabled={chatLoading} onClick={askAssistant}>{chatLoading ? "…" : "Preguntar"}</button>
                </div>
                {chatA && <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{chatA}</div>}
              </div>
              <div className="aibox" style={{ marginBottom: 10 }}>
                <strong><Icon name="refresh" size={14} /> Verificación cruzada:</strong> Booking [{selected.fechasOcupadasBooking.join(", ") || "libre"}] · Airbnb [{selected.fechasOcupadasAirbnb.join(", ") || "libre"}]
                {lch.map((c) => <span key={c.platform}> · {c.platform} [{c.occupied.length} noches ocupadas{c.lastSync !== "nunca" ? `, sync ${String(c.lastSync).slice(0, 10)}` : ""}]</span>)}
                <br />Si confirmas, la IA marca la reserva en todos estos canales y el anfitrión la devuelve a sus plataformas.
              </div>
              {aiMsg && <div className={`aibox ${aiOk ? "" : "warn"}`}><div>{aiMsg}</div>{sugerencia && <div style={{ marginTop: 6 }}><strong>Sugerencia IA:</strong> {sugerencia}</div>}</div>}
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => selected && verificar(selected)}><Icon name="search" size={15} /> Verificar fechas</button>
                <button className="btn btn-green" disabled={reserving} onClick={() => selected && reservar(selected)}>{reserving ? "⏳ Reservando…" : "Reservar ahora"}</button>
              </div>
              {!user && <p className="muted" style={{ marginTop: 8 }}>Necesitas una cuenta para reservar. Es gratis.</p>}
            </div>
          </div>
        </div>
      )}

      {authOpen && <AuthModal mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuth={doAuth} />}

      {bookingsOpen && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setBookingsOpen(false); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-in">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">MIS RESERVAS</span>
                <button className="btn btn-ghost" onClick={() => setBookingsOpen(false)}><Icon name="x" size={16} /></button>
              </div>
              {bookings.length === 0 ? <p className="muted">Aún no tienes reservas. Explora y reserva tu primera noche.</p> : (
                <table className="tbl"><thead><tr><th>CÓDIGO</th><th>ALOJAMIENTO</th><th>FECHAS</th><th>TOTAL</th><th>ESTADO</th><th></th></tr></thead>
                  <tbody>{bookings.map((b) => (
                    <tr key={b.id}><td><strong>{b.code}</strong></td><td>{b.listingTitle}</td><td>{b.checkIn} → {b.checkOut}</td><td>{fmt(b.total)}</td><td>{b.status === "confirmada" ? <><TasaDot live /> Confirmada</> : "Cancelada"}</td>
                      <td>{b.status === "confirmada" && <button className="btn btn-ghost" onClick={() => cancelBooking(b.id)}>Cancelar</button>}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {lead && <LeadModal titulo={lead.titulo} tipo={lead.tipo} user={user} onClose={() => setLead(null)} onSend={sendLead} />}

      <AssistantWidget onOpen={(id) => {
        const l = todas.find((x) => x.id === id);
        if (l) {
          document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" });
          openListing(l);
        } else notify("Ese alojamiento ya no está disponible.");
      }} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}



function LeadModal({ titulo, tipo, user, onClose, onSend }: {
  titulo: string; tipo: string; user: User | null;
  onClose: () => void;
  onSend: (nombre: string, email: string, mensaje: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) => void;
}) {
  const [nombre, setNombre] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mensaje, setMensaje] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="eyebrow">{tipo.toUpperCase()}</span>
            <button className="btn btn-ghost" onClick={onClose}><Icon name="x" size={16} /></button>
          </div>
          <h3>{titulo}</h3>
          <div className="field"><label>Tu nombre</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
          <div className="field"><label>Tu correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Cuéntanos más</label><textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Fechas, necesidades, presupuesto…" /></div>
          {err && <div className="aibox warn">{err}</div>}
          <button className="btn btn-green" style={{ width: "100%", justifyContent: "center" }} disabled={loading} onClick={() => onSend(nombre, email, mensaje, setErr, setLoading)}>
            {loading ? "⏳ Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
