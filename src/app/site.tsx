"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ADS, LISTINGS, PLANS, SPONSORS, PAQUETES, type Ad, type Listing, type PlanId } from "@/lib/data";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySelect } from "./currency-select";
import { AssistantWidget } from "./assistant-widget";
import { AuthModal } from "./auth-modal";
import { Icon, type IconName } from "./icons";
import { useCurrency } from "@/lib/currency";
import { Brand } from "./brand";
import { useSiteSettings } from "./site-settings-context";

type User = { id: string; name: string; email: string; plan: PlanId; role?: string; favorites: string[]; follows: string[] };
type Booking = { id: string; code: string; listingTitle: string; checkIn: string; checkOut: string; guests: number; base: number; commission: number; total: number; status: string; aiReport: string; createdAt: string };

function normalizeText(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// alias para compatibilidad
const PACKS = PAQUETES;

function fmtMiles(n: number) {
  // Formato determinístico (evita hydration mismatch por locale del server vs cliente)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function shortRateDate(raw: string) {
  if (!raw || raw === "referencia") return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function HeroTitle({ title, highlight }: { title: string; highlight: string }) {
  const idx = highlight ? title.indexOf(highlight) : -1;
  if (idx < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, idx)}
      <em>{highlight}</em>
      {title.slice(idx + highlight.length)}
    </>
  );
}

export function TasaDot({ live }: { live: boolean }) {
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: live ? "var(--green)" : "#b0b8b0" }} />
  );
}

function ListingMedia({ listing: l, fav, onFav, fmt }: { listing: Listing; fav: boolean; onFav: () => void; fmt: (n: number) => string }) {
  const [err, setErr] = useState(false);
  const theme = (l as { theme?: { primary?: string; accent?: string } }).theme;
  const monthly = l.tipo === "subarriendo" && l.precioMes;
  return (
    <div className="ld-media" style={theme?.primary ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})` } : undefined}>
      {!err ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={l.imagen} alt={l.titulo} loading="lazy" onError={() => setErr(true)} />
      ) : (
        <div className="ld-media-fallback"><Icon name="logo" size={36} /><strong>{l.titulo}</strong></div>
      )}
      <div className="ld-media-top">
        <div className="ld-tags">
          <span className={`ld-tag ${l.tipo === "reserva" ? "ld-tag--lime" : "ld-tag--dark"}`}>
            <Icon name={l.tipo === "reserva" ? "bed" : "home"} size={12} /> {l.tipo === "reserva" ? "RESERVA" : "SUBARRIENDO"}
          </span>
          {l.anfitrion.plan === "premium" && <span className="ld-tag"><Icon name="star" size={11} filled /> PREMIUM</span>}
          {l.anfitrion.plan === "corporativo" && <span className="ld-tag"><Icon name="verified" size={11} /> PRO</span>}
        </div>
        <button
          type="button"
          className={`ld-fav ${fav ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          aria-label="Guardar en favoritos"
          aria-pressed={fav}
        >
          <Icon name="heart" size={18} filled={fav} />
        </button>
      </div>
      <span className="ld-media-price">
        {monthly ? <>{fmt(l.precioMes!)} <small>/mes</small></> : <>{fmt(l.precioNoche)} <small>/noche</small></>}
      </span>
    </div>
  );
}

function HeroVisual({ image, listing, fmt, brand }: { image: string; listing: Listing | null; fmt: (n: number) => string; brand: string }) {
  const [err, setErr] = useState(false);
  const src = image || listing?.imagen || "";
  const showListing = !image && !!listing;
  return (
    <div className="ld-hero-visual" aria-hidden="true">
      <div className="ld-shot">
        {src && !err ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt="" onError={() => setErr(true)} />
        ) : (
          <div className="ld-shot-fallback"><Icon name="logo" size={48} /><strong>{brand}</strong></div>
        )}
        {showListing && listing && (
          <>
            <div className="ld-shot-shade" />
            <div className="ld-shot-body">
              <span className="ld-shot-kicker">{listing.categoria.toUpperCase()} · {listing.ciudad.toUpperCase()}</span>
              <strong>{listing.titulo}</strong>
              <div className="ld-shot-meta">
                <span><Icon name="star" size={12} filled /> {listing.rating}</span>
                <span>{listing.resenas} reseñas</span>
                <span><Icon name="bed" size={12} /> {fmt(listing.precioNoche)}/noche</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="ld-float ld-float--a">
        <span className="ld-float-ico"><Icon name="refresh" size={17} /></span>
        <div><strong>Fechas verificadas</strong><small>Booking · Airbnb · iCal</small></div>
      </div>
      <div className="ld-float ld-float--b">
        <span className="ld-float-ico"><Icon name="tree" size={17} /></span>
        <div><strong>1 reserva = 1 árbol</strong><small>Turismo que regenera</small></div>
      </div>
    </div>
  );
}

export default function Site({ defaultCheckIn, defaultCheckOut }: { defaultCheckIn: string; defaultCheckOut: string }) {
  const [q, setQ] = useState("");
  const [ciudad, setCiudad] = useState("Todas");
  const [tipo, setTipo] = useState<"todos" | "reserva" | "subarriendo">("todos");
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [planActual, setPlanActual] = useState<PlanId>("gratuito");

  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [serverListings, setServerListings] = useState<Listing[] | null>(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lead, setLead] = useState<{ tipo: string; titulo: string; detalle: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [adsLive, setAdsLive] = useState<Ad[] | null>(null);
  const [cfgRates, setCfgRates] = useState<Record<string, number> | null>(null);

  const router = useRouter();
  const settings = useSiteSettings();
  const { code: currencyCode, fmt, live: ratesLive, ratesDate } = useCurrency();

  function openListing(l: Listing) {
    const slug = l.slug || (l.id || l.titulo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "alojamiento";
    router.push("/p/" + slug);
  }

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
  const heroListing = todas.find((l) => l.imagen) ?? todas[0] ?? null;
  const favs = user?.favorites ?? [];
  const seguidos = user?.follows ?? [];
  const brandName = `${settings.brand.name}${settings.brand.suffix}`;
  const navItems = settings.nav.filter((item) => {
    if (item.href === "#planes" && !settings.modules.plans) return false;
    if (item.href === "#perfiles" && !settings.modules.profiles) return false;
    if (
      item.href === "#publicidad" &&
      !settings.modules.publicAds &&
      !settings.modules.sponsors &&
      !settings.modules.packs
    ) {
      return false;
    }
    return true;
  });

  const faqs = [
    {
      q: "¿Cómo evita BioHostel el overbooking?",
      a: "Antes de confirmar cruzamos tus fechas con los calendarios de Booking, Airbnb y los canales iCal conectados. Si hay conflicto te proponemos otras fechas u otro alojamiento; si está libre, reservamos y bloqueamos el resto de canales.",
    },
    {
      q: "¿Puedo reservar sin crear una cuenta?",
      a: "Sí. Para reservar sin cuenta pedimos nombre, correo y un teléfono de contacto. Con cuenta puedes guardar favoritos, seguir anfitriones y consultar tus reservas desde el menú.",
    },
    {
      q: "¿Qué diferencia hay entre reserva por noche y subarriendo?",
      a: "Las reservas por noche se cobran por estancia y tienen check-in y check-out. Los subarriendos son estancias mensuales pensadas para vivir o trabajar unos meses; el precio se muestra por mes.",
    },
    ...(settings.modules.plans
      ? [{
          q: "¿Cómo funcionan los planes para anfitriones?",
          a: "Puedes empezar con el plan gratuito. Cuando necesitas más fotos, más alojamientos o una comisión menor, solicitas un plan desde el panel y el equipo lo activa tras el pago.",
        }]
      : []),
    {
      q: "¿Cómo se protegen mis datos?",
      a: "Usamos conexión cifrada y solo compartimos los datos necesarios con los proveedores que intervienen en la reserva. Puedes revisar el detalle en la política de privacidad y ejercer tus derechos ARCO.",
    },
  ];

  function notify(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buscar() {
    const resultados = filtrados.length;
    scrollTo("explorar");
    notify(`${resultados} alojamiento${resultados === 1 ? "" : "s"} con tus filtros.`);
  }

  function limpiarFiltros() {
    setQ("");
    setCiudad("Todas");
    setTipo("todos");
    notify("Filtros limpiados.");
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

  function elegirPlan(id: PlanId) {
    if (needLogin()) return;
    if (user?.plan === id) return;
    const p = PLANS.find((x) => x.id === id);
    setLead({ tipo: "plan", titulo: `Solicitud de plan ${p?.nombre ?? id}`, detalle: id });
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
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: lead.tipo, nombre, email, mensaje, detalle: lead.detalle || lead.titulo }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "No se pudo enviar."); return; }
      setLead(null);
      notify(`Solicitud enviada (folio ${d.id.slice(-6).toUpperCase()}). Te contactamos en 24h.`);
    } catch { setErr("Error de conexión."); } finally { setLoading(false); }
  }

  return (
    <div className="ld">
      <div className="topbar">{settings.announcement}</div>

      <header className="header">
        <div className="page header-in">
          <Brand href="#top" />
          <nav className="nav" aria-label="Secciones">
            {navItems.map((item) => (
              <a key={`${item.label}-${item.href}`} href={item.href}>{item.label}</a>
            ))}
          </nav>
          <div className="hactions">
            {settings.modules.currency && <span className="hide-mobile"><CurrencySelect /></span>}
            {settings.modules.themeToggle && <span className="hide-mobile"><ThemeToggle /></span>}
            <div className="usermenu">
              <button className="ld-icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menú" aria-expanded={menuOpen}>
                <Icon name="menu" size={17} /><Icon name="user" size={18} />
              </button>
              {menuOpen && (
                <div className="udropdown" onMouseLeave={() => setMenuOpen(false)}>
                  {user && <div className="uhead">Hola, <strong>{user.name.split(" ")[0]}</strong> · plan {user.plan}</div>}
                  {(settings.modules.currency || settings.modules.themeToggle) && (
                    <div className="only-mobile" style={{ padding: "4px 8px" }}>
                      <div className="row" style={{ gap: 8 }}>
                        {settings.modules.currency && <CurrencySelect />}
                        {settings.modules.themeToggle && <ThemeToggle />}
                      </div>
                    </div>
                  )}
                  <a href="#explorar" onClick={() => setMenuOpen(false)}><Icon name="search" size={16} /> Explorar</a>
                  <a href="#subarriendos" onClick={() => setMenuOpen(false)}><Icon name="home" size={16} /> Subarriendos</a>
                  {settings.modules.plans && <a href="#planes" onClick={() => setMenuOpen(false)}><Icon name="card" size={16} /> Planes</a>}
                  {settings.modules.profiles && <a href="#perfiles" onClick={() => setMenuOpen(false)}><Icon name="users" size={16} /> Comunidad</a>}
                  {(settings.modules.publicAds || settings.modules.sponsors || settings.modules.packs) && (
                    <a href="#publicidad" onClick={() => setMenuOpen(false)}><Icon name="eye" size={16} /> Proveedores</a>
                  )}
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
            <a className="ld-btn ld-btn--dark ld-btn--sm" href="/panel"><Icon name="plus" size={15} /> Publicar</a>
          </div>
        </div>
      </header>

      <section className="ld-hero" id="top">
        <div className="page">
          <div className="ld-hero-grid">
            <div className="ld-hero-copy">
              <p className="ld-eyebrow"><span className="dot" />{settings.hero.eyebrow}</p>
              <h1><HeroTitle title={settings.hero.title} highlight={settings.hero.highlight} /></h1>
              <p className="ld-sub">{settings.hero.subtitle}</p>
              <div className="ld-hero-actions">
                <button type="button" className="ld-btn ld-btn--lime" onClick={() => scrollTo("explorar")}>
                  Explorar alojamientos <Icon name="arrow" size={17} />
                </button>
                <a className="ld-btn ld-btn--ghost" href="/panel">Publicar mi alojamiento</a>
              </div>
              <div className="ld-proof">
                <div className="ld-proof-item"><span className="ico"><Icon name="refresh" size={16} /></span><span>Verificación en Booking + Airbnb</span></div>
                <div className="ld-proof-item"><span className="ico"><Icon name="bed" size={16} /></span><span>Reservas por noche y por mes</span></div>
                <div className="ld-proof-item"><span className="ico"><Icon name="tree" size={16} /></span><span>1 reserva = 1 árbol</span></div>
              </div>
            </div>
            <HeroVisual image={settings.hero.image} listing={heroListing} fmt={fmt} brand={brandName} />
          </div>

          <form className="ld-search" onSubmit={(e) => { e.preventDefault(); buscar(); }}>
            <label className="ld-field" htmlFor="ld-q">
              <span>Destino</span>
              <input id="ld-q" placeholder="Nocaima, Cartagena…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="ld-field" htmlFor="ld-ciudad">
              <span>Ciudad</span>
              <select id="ld-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                {ciudades.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="ld-field" htmlFor="ld-check-in">
              <span>Entrada</span>
              <input id="ld-check-in" type="date" value={checkIn} min={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </label>
            <label className="ld-field" htmlFor="ld-check-out">
              <span>Salida</span>
              <input id="ld-check-out" type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
            </label>
            <button className="ld-btn ld-btn--dark" type="submit"><Icon name="search" size={16} /> Buscar</button>
          </form>
        </div>
      </section>

      <section className="ld-strip" aria-label="Canales sincronizados">
        <div className="page ld-strip-in">
          <div className="ld-channels">
            <span>SINCRONIZADO CON</span>
            <span className="ld-channel">Booking.com</span>
            <span className="ld-channel">Airbnb</span>
            <span className="ld-channel">iCal</span>
            <span className="ld-channel">Reserva directa</span>
          </div>
          <span className="ld-strip-note"><Icon name="check" size={14} /> Menos overbooking, más ingresos</span>
        </div>
      </section>

      <section className="ld-section page" id="explorar">
        <div className="ld-section-head">
          <div>
            <p className="ld-eyebrow"><span className="dot" />Catálogo</p>
            <h2>Encuentra tu próximo refugio</h2>
            <p className="ld-sub">Reservas por noche y subarriendos mensuales verificados en toda Colombia. Filtra, guarda favoritos y sigue a tus anfitriones.</p>
          </div>
          <div className="ld-count">
            <strong>{filtrados.length}</strong>
            <span>alojamiento{filtrados.length === 1 ? "" : "s"} activo{filtrados.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div id="subarriendos">
          <div className="ld-toolbar">
            <div className="ld-tabs" aria-label="Tipo de alojamiento">
              <button type="button" className={`ld-tab ${tipo === "todos" ? "on" : ""}`} aria-pressed={tipo === "todos"} onClick={() => setTipo("todos")}>Todo</button>
              <button type="button" className={`ld-tab ${tipo === "reserva" ? "on" : ""}`} aria-pressed={tipo === "reserva"} onClick={() => setTipo("reserva")}><Icon name="bed" size={14} /> Reservas por noche</button>
              <button type="button" className={`ld-tab ${tipo === "subarriendo" ? "on" : ""}`} aria-pressed={tipo === "subarriendo"} onClick={() => setTipo("subarriendo")}><Icon name="home" size={14} /> Subarriendos mensuales</button>
            </div>
            <span className="ld-rate"><Icon name="globe" size={14} /> Precios en {currencyCode} · <TasaDot live={ratesLive} /> {ratesLive ? `tasa del día ${shortRateDate(ratesDate)}` : "tasa de referencia"}</span>
          </div>

          {filtrados.length > 0 ? (
            <div className="ld-grid">
              {filtrados.map((l) => (
                <article key={l.id} className="ld-card" onClick={() => openListing(l)}>
                  <ListingMedia listing={l} fav={favs.includes(l.id)} onFav={() => toggleFav(l.id)} fmt={fmt} />
                  <div className="ld-card-body">
                    <span className="ld-card-loc"><Icon name="pin" size={12} /> {l.ciudad} · {l.categoria}</span>
                    <h3>{l.titulo}</h3>
                    <div className="ld-host">
                      <span className="ld-avatar">{l.anfitrion.avatar}</span>
                      <div className="ld-host-txt">
                        <strong>{l.anfitrion.nombre} {l.anfitrion.verificado && <Icon name="verified" size={13} />}</strong>
                        <small>{fmtMiles(l.anfitrion.seguidores)} seguidores</small>
                      </div>
                      <button
                        type="button"
                        className={`ld-follow ${seguidos.includes(l.anfitrion.nombre) ? "on" : ""}`}
                        aria-pressed={seguidos.includes(l.anfitrion.nombre)}
                        onClick={(e) => { e.stopPropagation(); toggleFollow(l.anfitrion.nombre); }}
                      >
                        {seguidos.includes(l.anfitrion.nombre) ? <><Icon name="check" size={12} /> Siguiendo</> : "+ Seguir"}
                      </button>
                    </div>
                    {l.amenidades.length > 0 && (
                      <div className="ld-chips">
                        {l.amenidades.slice(0, 3).map((a) => <span key={a} className="ld-chip"><Icon name="check" size={11} /> {a}</span>)}
                      </div>
                    )}
                    <div className="ld-card-foot">
                      <div>
                        <span className="ld-price">
                          {l.tipo === "subarriendo" && l.precioMes ? <>{fmt(l.precioMes)} <small>/mes</small></> : <>{fmt(l.precioNoche)} <small>/noche</small></>}
                        </span>
                        {l.tipo === "reserva" && l.precioMes && <span className="ld-price-month">{fmt(l.precioMes)}/mes</span>}
                        <span className="ld-ai"><Icon name="bot" size={12} /> IA verificada</span>
                      </div>
                      <button type="button" className="ld-btn ld-btn--dark ld-btn--sm" onClick={(e) => { e.stopPropagation(); openListing(l); }}>
                        Ver y reservar <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ld-empty">
              <span className="ld-empty-ico"><Icon name="search" size={22} /></span>
              <h3>No encontramos alojamientos con esos filtros</h3>
              <p>Prueba con otra ciudad, otras fechas o limpia los filtros para ver todo el catálogo.</p>
              <button type="button" className="ld-btn ld-btn--dark" onClick={limpiarFiltros}>Limpiar filtros</button>
            </div>
          )}
        </div>
      </section>

      <section className="ld-dark" id="como-funciona">
        <div className="page">
          <p className="ld-eyebrow"><span className="dot" />Cómo funciona</p>
          <h2>Una reserva. Tres canales. Cero overbooking.</h2>
          <p className="ld-sub">La IA revisa la disponibilidad antes de cobrar y sincroniza los calendarios cuando confirmas.</p>
          <div className="ld-steps">
            <div className="ld-step">
              <span className="ld-step-num">01</span>
              <h3>Explora y elige</h3>
              <p>Reservas por noche o subarriendos mensuales con fotos, reglas de la casa y disponibilidad real.</p>
            </div>
            <div className="ld-step">
              <span className="ld-step-num">02</span>
              <span className="ld-step-ico"><Icon name="bot" size={20} /></span>
              <h3>La IA verifica</h3>
              <p>Cruzamos tus fechas con Booking, Airbnb y los canales iCal conectados antes de confirmar.</p>
            </div>
            <div className="ld-step">
              <span className="ld-step-num">03</span>
              <h3>Confirma y sincroniza</h3>
              <p>Una sola reserva bloquea el calendario en todas las plataformas para que nadie más la tome.</p>
            </div>
          </div>
          <button type="button" className="ld-btn ld-btn--lime" onClick={() => scrollTo("explorar")}>
            Explorar alojamientos <Icon name="arrow" size={16} />
          </button>
        </div>
      </section>

      {settings.modules.plans && (
        <section className="ld-section page" id="planes">
          <div className="ld-section-head">
            <div>
              <p className="ld-eyebrow"><span className="dot" />Planes de anfitrión</p>
              <h2>Publica gratis. Crece cuando quieras.</h2>
              <p className="ld-sub">Elige un plan cuando tu alojamiento lo necesite. La activación la aprueba el equipo tras el pago.</p>
            </div>
          </div>

          <div className="ld-plan-sim">
            <div className="ld-tabs" aria-label="Simulador de comisión">
              {PLANS.map((p) => (
                <button key={p.id} type="button" className={`ld-tab ${planActual === p.id ? "on" : ""}`} aria-pressed={planActual === p.id} onClick={() => setPlanActual(p.id)}>{p.nombre}</button>
              ))}
            </div>
            <p className="ld-sim-note">
              Ejemplo {fmt(200000)} → comisión <strong>{fmt(Math.round(200000 * (cfgRates?.[planActual] ?? PLANS.find((p) => p.id === planActual)!.comisionValor)))}</strong>
            </p>
          </div>

          <div className="ld-plans">
            {PLANS.map((p) => (
              <div key={p.id} className={`ld-plan ${p.destacado ? "hot" : ""}`}>
                {p.destacado && <span className="ld-plan-badge">RECOMENDADO</span>}
                <h3>{p.nombre}</h3>
                <p className="ld-plan-price">{p.precioCOP === 0 ? "$0" : fmt(p.precioCOP)} <span>{p.periodo}</span></p>
                <p className="ld-plan-meta">
                  <Icon name="eye" size={13} /> {p.limiteFotos} · {p.limiteDescripcion}
                  <Icon name="card" size={13} /> {Math.round((cfgRates?.[p.id] ?? p.comisionValor) * 100)}% por reserva
                </p>
                <ul>
                  {p.features.map((f) => <li key={f}><Icon name="check" size={14} /> {f}</li>)}
                </ul>
                <button
                  type="button"
                  className={`ld-btn ${p.destacado ? "ld-btn--lime" : "ld-btn--dark"}`}
                  disabled={user?.plan === p.id}
                  onClick={() => elegirPlan(p.id)}
                >
                  {user?.plan === p.id ? <><Icon name="check" size={14} /> Tu plan actual</> : `Solicitar ${p.nombre}`}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {settings.modules.profiles && (
        <section className="ld-section page" id="perfiles">
          <div className="ld-section-head">
            <div>
              <p className="ld-eyebrow"><span className="dot" />Comunidad</p>
              <h2>Anfitriones reales, confianza real.</h2>
              <p className="ld-sub">Sigue a tus anfitriones, revisa sus alojamientos y conversa con ellos antes de reservar.</p>
            </div>
          </div>
          <div className="ld-profiles">
            {todas.slice(0, 3).map((l) => (
              <article key={l.id} className="ld-profile">
                <div className="ld-profile-cover" />
                <div className="ld-profile-avatar">{l.anfitrion.avatar}</div>
                <strong>{l.anfitrion.nombre} {l.anfitrion.verificado && <Icon name="verified" size={14} />}</strong>
                <span className="ld-profile-meta">Anfitrión {l.anfitrion.plan} · {l.ciudad}</span>
                <p className="ld-profile-desc">{l.descripcion.slice(0, 110)}…</p>
                <div className="ld-profile-stats">
                  <span><Icon name="star" size={12} filled /> {l.rating}</span>
                  <span>{l.resenas} reseñas</span>
                  <span><Icon name="users" size={12} /> {fmtMiles(l.anfitrion.seguidores)}</span>
                </div>
                <div className="ld-profile-actions">
                  <button type="button" className="ld-btn ld-btn--ghost ld-btn--sm" onClick={() => toggleFollow(l.anfitrion.nombre)}>
                    {seguidos.includes(l.anfitrion.nombre) ? <><Icon name="check" size={13} /> Siguiendo</> : "+ Seguir"}
                  </button>
                  <button type="button" className="ld-btn ld-btn--ghost ld-btn--sm" onClick={() => setLead({ tipo: "mensaje", titulo: `Mensaje a ${l.anfitrion.nombre}`, detalle: l.anfitrion.nombre })}>
                    <Icon name="message" size={13} /> Mensaje
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(settings.modules.publicAds || settings.modules.sponsors || settings.modules.packs) && (
        <section className="ld-section page" id="publicidad">
          <div className="ld-section-head">
            <div>
              <p className="ld-eyebrow"><span className="dot" />Proveedores</p>
              <h2>{settings.modules.publicAds ? "Marcas que acompañan cada estancia." : "Comunidad BioHostel."}</h2>
              <p className="ld-sub">{settings.modules.publicAds ? "Tecnología, descanso, higiene y energía para anfitriones que quieren mejorar la experiencia." : "Aliados, fundaciones y paquetes que hacen crecer tu alojamiento."}</p>
            </div>
          </div>

          {settings.modules.publicAds && (
            <div className="ld-ads">
              {(adsLive ?? ADS).map((a) => (
                <div key={a.empresa} className="ld-ad">
                  <div className="ld-ad-head" style={{ background: a.color }}>
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt={a.empresa} />
                    ) : (
                      <strong>{a.empresa}</strong>
                    )}
                    <span className="ld-ad-cat">{a.categoria.toUpperCase()}</span>
                  </div>
                  <div className="ld-ad-body">
                    <strong>{a.titulo}</strong>
                    <p>{a.texto}</p>
                    <button type="button" className="ld-btn ld-btn--ghost ld-btn--sm" onClick={() => setLead({ tipo: "publicidad", titulo: `Espacio publicitario (${a.categoria})`, detalle: a.empresa })}>
                      Anunciarme
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {settings.modules.sponsors && (
            <div className="ld-subsection">
              <h3>Sponsors y fundaciones</h3>
              <div className="ld-sponsors">
                {SPONSORS.map((s) => (
                  <div key={s.nombre} className="ld-sponsor">
                    <strong><Icon name={s.logo as IconName} size={16} /> {s.nombre}</strong>
                    <span>{s.aporte}</span>
                  </div>
                ))}
                <div className="ld-sponsor">
                  <strong>+ Tu fundación aquí</strong>
                  <span>Visibilidad en 6 países</span>
                  <span><button type="button" className="ld-btn ld-btn--ghost ld-btn--sm" onClick={() => setLead({ tipo: "sponsor", titulo: "Alta de fundación sponsor", detalle: "" })}>Ser sponsor</button></span>
                </div>
              </div>
            </div>
          )}

          {settings.modules.packs && (
            <div className="ld-subsection">
              <h3>Paquetes para anfitriones</h3>
              <div className="ld-packs">
                {PACKS.map((p) => (
                  <div key={p.id} className="ld-pack">
                    <span className="ld-pack-ico"><Icon name={p.icono as IconName} size={22} /></span>
                    <h3>{p.nombre}</h3>
                    <strong>{fmt(p.precioCOP)} <small>{p.precioNota}</small></strong>
                    <p>{p.desc}</p>
                    <button type="button" className="ld-btn ld-btn--lime ld-btn--sm" onClick={() => setLead({ tipo: "paquete", titulo: `Paquete ${p.nombre} (${fmt(p.precioCOP)})`, detalle: p.id })}>
                      Quiero este
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="ld-faq" id="faq">
        <div className="page ld-faq-grid">
          <div className="ld-faq-intro">
            <p className="ld-eyebrow"><span className="dot" />Preguntas frecuentes</p>
            <h2>Lo que suelen preguntar</h2>
            <p className="ld-sub">Si no encuentras tu respuesta, escríbenos y te respondemos en menos de 24 horas.</p>
            <button type="button" className="ld-btn ld-btn--ghost" onClick={() => setLead({ tipo: "contacto", titulo: "Hablar con el equipo", detalle: "" })}>
              <Icon name="message" size={15} /> Escribir al equipo
            </button>
          </div>
          <div className="ld-faq-list">
            {faqs.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={f.q} className={`ld-faq-item ${open ? "open" : ""}`}>
                  <button type="button" className="ld-faq-q" aria-expanded={open} onClick={() => setFaqOpen(open ? null : i)}>
                    <span>{f.q}</span>
                    <span className="ld-faq-chev"><Icon name="plus" size={16} /></span>
                  </button>
                  {open && <div className="ld-faq-a">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ld-cta">
        <div className="page">
          <div className="ld-cta-in">
            <div className="ld-cta-copy">
              <p className="ld-eyebrow"><span className="dot" />Para anfitriones</p>
              <h2>Tu espacio puede generar más, con menos riesgo.</h2>
              <p>Publica gratis, conecta tus calendarios y deja que la IA evite el overbooking.</p>
            </div>
            <div className="ld-cta-actions">
              <a className="ld-btn ld-btn--lime" href="/panel">Publicar mi alojamiento <Icon name="arrow" size={16} /></a>
              <button type="button" className="ld-btn ld-btn--on-dark" onClick={() => setLead({ tipo: "contacto", titulo: "Hablar con el equipo", detalle: "" })}>
                Hablar con el equipo
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="page">
          <div className="ld-footer-grid">
            <div>
              <span className="ld-foot-brand">{brandName}</span>
              <p className="ld-foot-tag">{settings.brand.tagline}</p>
              <div className="ld-foot-contact">
                {settings.footer.contactEmail && (
                  <a href={`mailto:${settings.footer.contactEmail}`}>{settings.footer.contactEmail}</a>
                )}
                {settings.footer.socials.map((item) => (
                  <a key={item.label} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4>Explorar</h4>
              <div className="ld-foot-links">
                {navItems.map((item) => (
                  <a key={`foot-${item.label}-${item.href}`} href={item.href}>{item.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4>Cuenta</h4>
              <div className="ld-foot-links">
                {settings.footer.links.length > 0 ? settings.footer.links.map((item) => (
                  <a key={`${item.label}-${item.href}`} href={item.href}>{item.label}</a>
                )) : <a href="/panel">Panel anfitrión</a>}
              </div>
            </div>
          </div>
          <div className="ld-foot-bottom">
            <span>© {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</span>
            <span>{settings.footer.text}</span>
          </div>
        </div>
      </footer>

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

      {settings.modules.assistant && (
        <AssistantWidget onOpen={(id) => {
          const l = todas.find((x) => x.id === id);
          if (l) {
            scrollTo("explorar");
            openListing(l);
          } else notify("Ese alojamiento ya no está disponible.");
        }} />
      )}
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
