"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "../theme-toggle";
import { CurrencySelect } from "../currency-select";
import { AuthModal } from "../auth-modal";
import { Brand } from "../brand";
import { Icon } from "../icons";
import { useCurrency } from "@/lib/currency";
import { BarChart, DonutChart, LineChart, downloadCSV, downloadJSON } from "./charts";
import { SiteSettingsPanel } from "./site-settings";
import { ListingEditForm } from "@/components/listing-edit-form";

type AdminUser = { id: string; name: string; email: string; plan: string; role: string; banned?: boolean; favorites: string[]; follows: string[] };
type Overview = { users: number; admins: number; byPlan: Record<string, number>; listings: number; activeListings: number; reservations: number; confirmed: number; gmv: number; commissions: number; leads: number; ads: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const LEAD_ESTADOS = ["nuevo", "contactado", "en_proceso", "cerrado", "descartado"] as const;
const BANNERS = [
  { id: "tarjeta", nombre: "Tarjeta (grid)", w: "100%", h: 190 },
  { id: "leaderboard", nombre: "Leaderboard 970×90", w: "100%", h: 90 },
  { id: "rectangulo", nombre: "Rectángulo 300×250", w: 300, h: 250 },
  { id: "rascacielos", nombre: "Rascacielos 300×600", w: 300, h: 600 },
  { id: "barra", nombre: "Barra móvil 100%×64", w: "100%", h: 64 },
] as const;

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Admin() {
  const [gate, setGate] = useState<{ hasAdmin: boolean; isAdmin: boolean; me: AdminUser | null } | null>(null);
  const [tab, setTab] = useState("resumen");
  const [ov, setOv] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [toast, setToast] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(false);
  // setup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");
  const [sKey, setSKey] = useState("");
  const [sErr, setSErr] = useState("");
  // perfil usuario
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [tempPass, setTempPass] = useState("");
  // leads
  const [fTipo, setFTipo] = useState("todos");
  const [fEstado, setFEstado] = useState("todos");
  const [leadDetail, setLeadDetail] = useState<Row | null>(null);
  const [leadNotas, setLeadNotas] = useState("");
  // ads
  const [editingAd, setEditingAd] = useState<Row | null>(null);
  const [adEmpresa, setAdEmpresa] = useState("");
  const [adCat, setAdCat] = useState("Tecnología");
  const [adTitulo, setAdTitulo] = useState("");
  const [adTexto, setAdTexto] = useState("");
  const [adColor, setAdColor] = useState("#16a34a");
  const [adImage, setAdImage] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [library, setLibrary] = useState<string[]>([]);
  const [bannerType, setBannerType] = useState<string>("tarjeta");
  const [previewAdId, setPreviewAdId] = useState("");
  const [listingDetail, setListingDetail] = useState<Row | null>(null);
  const [editingListing, setEditingListing] = useState<Row | null>(null);
  // config
  const [rates, setRates] = useState({ gratuito: 10, corporativo: 5, premium: 0 });
  // IA + RAG
  const [aiCfg, setAiCfg] = useState<{ provider: string; model: string; hasKey: boolean; keyHint: string; baseUrl: string; updatedAt: string; providers: { id: string; nombre: string; keyUrl: string; keyLabel: string; needsKey: boolean; defaultModel: string; baseUrl: string }[] } | null>(null);
  const [aiProvider, setAiProvider] = useState("local");
  const [aiModel, setAiModel] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [aiBase, setAiBase] = useState("");
  const [aiTest, setAiTest] = useState("");
  const [ragStats, setRagStats] = useState<{ docs: number; indexedListings: number; totalListings: number; sample: { title: string; chars: number }[] } | null>(null);
  const [ragQ, setRagQ] = useState("¿Aceptan mascotas y qué incluye el desayuno?");
  const [ragA, setRagA] = useState("");
  const { fmt } = useCurrency();

  async function loadAI() {
    const [c, r] = await Promise.all([
      fetch("/api/admin/ai-config").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/rag").then((x) => x.json()).catch(() => ({})),
    ]);
    if (c?.config) {
      setAiCfg(c.config);
      setAiProvider(c.config.provider);
      setAiModel(c.config.model);
      setAiBase(c.config.baseUrl);
    }
    if (r?.docs !== undefined) setRagStats(r);
  }

  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 4000); }

  async function checkGate() {
    const g = await fetch("/api/admin/bootstrap").then((r) => r.json()).catch(() => null);
    setGate(g);
    if (g?.isAdmin) loadAll();
  }

  async function loadAll() {
    const [o, u, l, r, lds, ads, cfg] = await Promise.all([
      fetch("/api/admin/overview").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/users").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/listings").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/reservations").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/leads").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/ads").then((x) => x.json()).catch(() => ({})),
      fetch("/api/admin/config").then((x) => x.json()).catch(() => ({})),
    ]);
    if (o?.users !== undefined) setOv(o);
    if (u?.users) setUsers(u.users);
    setRows([
      ...((l?.listings ?? []) as Row[]).map((x) => ({ ...x, _kind: "listing" })),
      ...((r?.reservations ?? []) as Row[]).map((x) => ({ ...x, _kind: "reservation" })),
      ...((lds?.leads ?? []) as Row[]).map((x) => ({ ...x, _kind: "lead" })),
      ...((ads?.ads ?? []) as Row[]).map((x) => ({ ...x, _kind: "ad" })),
    ]);
    if (cfg?.config?.rates) {
      setRates({
        gratuito: Math.round(cfg.config.rates.gratuito * 100),
        corporativo: Math.round(cfg.config.rates.corporativo * 100),
        premium: Math.round(cfg.config.rates.premium * 100),
      });
    }
  }

  useEffect(() => { checkGate(); }, []);
  useEffect(() => { if (tab === "publicidad" && gate?.isAdmin) loadLibrary(); }, [tab]);
  useEffect(() => { if (tab === "ia" && gate?.isAdmin) loadAI(); }, [tab]);

  const listings = rows.filter((r) => r._kind === "listing");
  const reservations: Row[] = rows.filter((r) => r._kind === "reservation");
  const leads: Row[] = rows.filter((r) => r._kind === "lead");
  const ads: Row[] = rows.filter((r) => r._kind === "ad");

  const charts = useMemo(() => {
    const byStatus = [
      { label: "Confirmadas", value: reservations.filter((r) => r.status === "confirmada").length, color: "#16a34a" },
      { label: "Canceladas", value: reservations.filter((r) => r.status !== "confirmada").length, color: "#ef4444" },
    ];
    const months: Record<string, { n: number; gmv: number }> = {};
    reservations.forEach((r) => {
      const k = monthKey(r.createdAt);
      months[k] = months[k] ?? { n: 0, gmv: 0 };
      months[k].n += 1;
      if (r.status === "confirmada") months[k].gmv += Number(r.total) || 0;
    });
    const keys = Object.keys(months).sort().slice(-6);
    return {
      byStatus,
      perMonth: keys.map((k) => ({ label: k.slice(5), value: months[k].n })),
      gmvLine: keys.map((k) => ({ label: k.slice(5), value: months[k].gmv })),
      usersByPlan: [
        { label: "Gratuito", value: users.filter((u) => u.plan === "gratuito").length, color: "#8b5cf6" },
        { label: "Corporativo", value: users.filter((u) => u.plan === "corporativo").length, color: "#0ea5e9" },
        { label: "Premium", value: users.filter((u) => u.plan === "premium").length, color: "#f59e0b" },
      ],
    };
  }, [reservations, users]);

  const filteredLeads = leads.filter(
    (l) => (fTipo === "todos" || l.tipo === fTipo) && (fEstado === "todos" || (l.estado ?? "nuevo") === fEstado),
  );
  const leadTipos = ["todos", ...Array.from(new Set(leads.map((l) => l.tipo)))];

  async function doSetup() {
    setSErr("");
    const res = await fetch("/api/admin/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sName, email: sEmail, password: sPass, setupKey: sKey }),
    });
    const d = await res.json();
    if (!res.ok) { setSErr(d.error ?? "Error."); return; }
    notify(d.promoted ? "Cuenta promovida a administradora maestra." : "Administradora maestra creada.");
    checkGate();
  }

  async function doAuth(mode: "login" | "register", name: string, email: string, password: string, setErr: (m: string) => void, setLoading: (b: boolean) => void) {
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Error."); return; }
      setAuthOpen(false);
      checkGate();
    } catch { setErr("Error de conexión."); } finally { setLoading(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setGate({ hasAdmin: true, isAdmin: false, me: null });
  }

  async function call(url: string, method: string, body?: object) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) notify(d.error ?? "Error.");
    loadAll();
    return d;
  }

  async function resetPassword(u: AdminUser) {
    if (!confirm(`¿Restablecer la contraseña de ${u.name}? Se generará una temporal.`)) return;
    const d = await call("/api/admin/users", "POST", { id: u.id, action: "reset-password" });
    if (d?.tempPassword) {
      setTempPass(d.tempPassword);
      notify("Contraseña restablecida. Cópiala ahora: solo se muestra una vez.");
    }
  }

  function exportReservations(format: "csv" | "json") {
    const clean = reservations.map((r) => ({
      codigo: r.code, huesped: r.guestName, alojamiento: r.listingTitle,
      checkIn: r.checkIn, checkOut: r.checkOut, huespedes: r.guests,
      base: r.base, comision: r.commission, total: r.total, estado: r.status, fecha: r.createdAt,
    }));
    if (format === "csv") downloadCSV(`reservas-${new Date().toISOString().slice(0, 10)}.csv`, clean);
    else downloadJSON(`reservas-${new Date().toISOString().slice(0, 10)}.json`, clean);
    notify(`Exportadas ${clean.length} reservas en ${format.toUpperCase()}.`);
  }

  function profileStats(u: AdminUser) {
    return {
      listings: listings.filter((l) => l.ownerId === u.id).length,
      asGuest: reservations.filter((r) => r.guestId === u.id).length,
      received: reservations.filter((r) => r.hostId === u.id).length,
      favs: (u.favorites ?? []).length,
      follows: (u.follows ?? []).length,
    };
  }

  const previewAd: Row | null =
    ads.find((a) => a.id === previewAdId) ?? (editingAd || (adEmpresa || adTitulo ? { empresa: adEmpresa || "Tu empresa", categoria: adCat, titulo: adTitulo || "Título del anuncio", texto: adTexto || "Texto del anuncio", color: adColor, image: adImage } : ads[0] ?? null));

  async function loadLibrary() {
    const d = await fetch("/api/admin/upload").then((r) => r.json()).catch(() => ({}));
    if (Array.isArray(d?.files)) setLibrary(d.files);
  }

  async function uploadFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) { notify(d.error ?? "No se pudo subir."); return; }
      setAdImage(d.url);
      notify("Imagen subida.");
      loadLibrary();
    } catch { notify("Error al subir."); } finally { setUploading(false); }
  }

  async function fetchImageUrl() {
    if (!adImageUrl.trim()) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: adImageUrl.trim() }) });
      const d = await res.json();
      if (!res.ok) { notify(d.error ?? "No se pudo traer."); return; }
      setAdImage(d.url);
      setAdImageUrl("");
      notify("Imagen traída desde URL.");
      loadLibrary();
    } catch { notify("Error al traer."); } finally { setUploading(false); }
  }

  function startEditAd(a: Row) {
    setEditingAd(a); setPreviewAdId(a.id);
    setAdEmpresa(a.empresa); setAdCat(a.categoria); setAdTitulo(a.titulo); setAdTexto(a.texto); setAdColor(a.color); setAdImage(a.image ?? "");
    loadLibrary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAdForm() {
    setEditingAd(null); setAdEmpresa(""); setAdTitulo(""); setAdTexto(""); setAdColor("#16a34a"); setAdImage(""); setAdCat("Tecnología");
  }

  function ownerOf(l: Row) {
    return users.find((u) => u.id === l.ownerId);
  }
  const banner = BANNERS.find((b) => b.id === bannerType)!;

  if (!gate) return <div className="page section"><p className="muted">Cargando…</p></div>;

  if (!gate.hasAdmin) {
    return (
      <div>
        <div className="topbar">MODO MAESTRO · INSTALACIÓN</div>
        <div className="page section" style={{ maxWidth: 520 }}>
          <p className="eyebrow">ADMINISTRADOR MAESTRO</p>
          <h2>Instalación inicial</h2>
          <p className="muted">Crea la cuenta maestra o promueve tu correo existente. Requiere la clave de instalación (<strong>BIOHOSTEL-MASTER-2026</strong>, cámbiala con la variable <code>ADMIN_SETUP_KEY</code>).</p>
          <div className="field"><label>Nombre (solo cuenta nueva)</label><input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Tu nombre" /></div>
          <div className="field"><label>Correo</label><input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} placeholder="admin@biohostel.com" /></div>
          <div className="field"><label>Contraseña (mínimo 6)</label><input type="password" value={sPass} onChange={(e) => setSPass(e.target.value)} /></div>
          <div className="field"><label>Clave de instalación</label><input type="password" value={sKey} onChange={(e) => setSKey(e.target.value)} placeholder="BIOHOSTEL-MASTER-2026" /></div>
          {sErr && <div className="aibox warn">{sErr}</div>}
          <button className="btn btn-green" style={{ width: "100%", justifyContent: "center" }} onClick={doSetup}><Icon name="verified" size={16} /> Crear / promover administradora</button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  if (!gate.isAdmin) {
    return (
      <div>
        <div className="topbar">MODO MAESTRO · ACCESO RESTRINGIDO</div>
        <header className="header"><div className="page header-in">
          <Brand small="ADMIN" />
          <div className="hactions"><ThemeToggle /><Link className="btn btn-ghost" href="/">← Ver sitio</Link></div>
        </div></header>
        <div className="page section" style={{ maxWidth: 520 }}>
          <p className="eyebrow">SOLO ADMINISTRADOR MAESTRO</p>
          <h2>Zona restringida</h2>
          <p className="muted">Entra con tu cuenta maestra. Los anfitriones usan el <a href="/panel" style={{ textDecoration: "underline" }}>panel normal</a>.</p>
          <button className="btn btn-green" onClick={() => setAuthOpen(true)}>Entrar como maestra</button>
        </div>
        {authOpen && <AuthModal mode="login" onMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuth={doAuth} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">MODO MAESTRO · {gate.me?.name.toUpperCase()} · ACCESO TOTAL</div>
      <header className="header"><div className="page header-in">
        <Brand small="ADMIN" />
        <nav className="nav">
          {["resumen", "ajustes", "usuarios", "alojamientos", "reservas", "solicitudes", "publicidad", "ia", "comisiones"].map((t) => (
            <button key={t} className={`pill ${tab === t ? "on" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
          ))}
        </nav>
        <div className="hactions"><CurrencySelect /><ThemeToggle /><button className="btn btn-ghost" onClick={logout}><Icon name="logout" size={15} /> Salir</button></div>
      </div></header>

      <div className="page section">
        <p className="eyebrow">PANEL MAESTRO · TODA LA PLATAFORMA</p>
        <h2>Administración total</h2>

        {tab === "resumen" && ov && (
          <>
            <div className="kpis">
              <div className="kpi"><span className="muted">Usuarias ({ov.admins} maestras)</span><strong>{ov.users}</strong><span className="muted">G {ov.byPlan.gratuito ?? 0} · C {ov.byPlan.corporativo ?? 0} · P {ov.byPlan.premium ?? 0}</span></div>
              <div className="kpi"><span className="muted">Alojamientos ({ov.activeListings} activos)</span><strong>{ov.listings}</strong><span className="muted">en el marketplace</span></div>
              <div className="kpi"><span className="muted">Reservas ({ov.confirmed} confirmadas)</span><strong>{ov.reservations}</strong><span className="muted">GMV {fmt(ov.gmv)}</span></div>
              <div className="kpi"><span className="muted">Comisiones plataforma</span><strong>{fmt(ov.commissions)}</strong><span className="muted">{ov.leads} solicitudes · {ov.ads} ads</span></div>
            </div>
            <div className="grid3" style={{ marginTop: 16 }}>
              <div className="kpi"><strong style={{ fontSize: 16 }}>Usuarias por plan</strong><DonutChart data={charts.usersByPlan} /></div>
              <div className="kpi"><strong style={{ fontSize: 16 }}>Reservas por estado</strong><DonutChart data={charts.byStatus} /></div>
              <div className="kpi"><strong style={{ fontSize: 16 }}>Reservas por mes</strong><BarChart data={charts.perMonth} /></div>
            </div>
          </>
        )}

        {tab === "ajustes" && <SiteSettingsPanel notify={notify} />}

        {tab === "usuarios" && (
          <>
            <div className="kpi" style={{ marginBottom: 12 }}><strong style={{ fontSize: 16 }}>Distribución por plan</strong><DonutChart data={charts.usersByPlan} /></div>
            <table className="tbl"><thead><tr><th>NOMBRE</th><th>EMAIL</th><th>PLAN</th><th>ROL</th><th>ESTADO</th><th></th></tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.id} style={u.banned ? { opacity: 0.65 } : undefined}>
                  <td><strong>{u.name}</strong> {u.role === "admin" && <span className="tag tag-plan-premium">MAESTRA</span>}</td>
                  <td>{u.email}</td>
                  <td><select value={u.plan} onChange={(e) => call("/api/admin/users", "PATCH", { id: u.id, plan: e.target.value })}>
                    <option value="gratuito">gratuito</option><option value="corporativo">corporativo</option><option value="premium">premium</option>
                  </select></td>
                  <td><select value={u.role} onChange={(e) => call("/api/admin/users", "PATCH", { id: u.id, role: e.target.value })}>
                    <option value="user">user</option><option value="admin">admin</option>
                  </select></td>
                  <td>{u.banned ? "Baneada" : "Activa"}</td>
                  <td><div className="row">
                    <button className="btn btn-ghost" onClick={() => { setProfile(u); setTempPass(""); }}><Icon name="eye" size={14} /> Ver</button>
                    <button className="btn btn-ghost" onClick={() => call("/api/admin/users", "PATCH", { id: u.id, banned: !u.banned })}>{u.banned ? "Desbanear" : "Banear"}</button>
                    <button className="btn btn-ghost" onClick={() => resetPassword(u)}>Restablecer clave</button>
                    <button className="btn btn-ghost" onClick={() => { if (confirm(`¿Eliminar a ${u.name}?`)) call(`/api/admin/users?id=${u.id}`, "DELETE"); }}><Icon name="trash" size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "alojamientos" && (
          <>
            <p className="muted">Modera el contenido: abre la ficha para ver datos, fotos y anfitrión. Pausa la publicación o banea al usuario si sube contenido indebido.</p>
            <table className="tbl"><thead><tr><th></th><th>TÍTULO</th><th>ANFITRIÓN</th><th>PRECIO</th><th>ESTADO</th><th></th></tr></thead>
              <tbody>{listings.map((l) => {
                const owner = ownerOf(l);
                return (
                  <tr key={l.id} style={l.active === false ? { opacity: 0.65 } : undefined}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.imagen} alt="" style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 8 }} />
                    </td>
                    <td><strong>{l.titulo}</strong><br /><span className="muted">{l.ciudad} · {l.tipo} · {(l.galeria ?? []).length} fotos</span></td>
                    <td>{owner ? <>{owner.name}<br /><span className="muted">{owner.email}</span>{owner.banned && <><br /><span className="tag tag-plan-premium">BANEADO</span></>}</> : <span className="muted">demo</span>}</td>
                    <td>{fmt(l.precioNoche)}</td>
                    <td>{l.active === false ? "Pausada" : "Activa"}{l.featured ? " · ★" : ""}</td>
                    <td><div className="row">
                      <button className="btn btn-ghost" onClick={() => setListingDetail(l)}><Icon name="eye" size={14} /> Ficha</button>
                      <button className="btn btn-ghost" onClick={() => call("/api/admin/listings", "PATCH", { id: l.id, active: !(l.active !== false) })}>{l.active !== false ? "Pausar" : "Activar"}</button>
                      <button className="btn btn-ghost" onClick={() => { if (confirm(`¿Eliminar "${l.titulo}"?`)) call(`/api/admin/listings?id=${l.id}`, "DELETE"); }}><Icon name="trash" size={14} /></button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </>
        )}

        {tab === "reservas" && (
          <>
            <div className="grid3" style={{ marginBottom: 14 }}>
              <div className="kpi"><strong style={{ fontSize: 16 }}>Por estado</strong><DonutChart data={charts.byStatus} /></div>
              <div className="kpi"><strong style={{ fontSize: 16 }}>Por mes</strong><BarChart data={charts.perMonth} /></div>
              <div className="kpi"><strong style={{ fontSize: 16 }}>GMV por mes</strong><LineChart data={charts.gmvLine} /></div>
            </div>
            <div className="row" style={{ marginBottom: 10 }}>
              <button className="btn btn-ghost" onClick={() => exportReservations("csv")}><Icon name="download" size={15} /> Exportar CSV</button>
              <button className="btn btn-ghost" onClick={() => exportReservations("json")}><Icon name="download" size={15} /> Exportar JSON</button>
              <span className="muted">Compatible con Excel y Google Sheets</span>
            </div>
            <table className="tbl"><thead><tr><th>CÓDIGO</th><th>HUÉSPED</th><th>ALOJAMIENTO</th><th>FECHAS</th><th>TOTAL</th><th>ESTADO</th><th></th></tr></thead>
              <tbody>{reservations.map((r) => (
                <tr key={r.id}><td><strong>{r.code}</strong></td><td>{r.guestName}</td><td>{r.listingTitle}</td><td>{r.checkIn} → {r.checkOut}</td><td>{fmt(r.total)}</td>
                  <td>{r.status === "confirmada" ? "Confirmada" : "Cancelada"}</td>
                  <td><button className="btn btn-ghost" onClick={() => call("/api/admin/reservations", "PATCH", { id: r.id, status: r.status === "confirmada" ? "cancelada" : "confirmada" })}>Cambiar</button></td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "solicitudes" && (
          <>
            <div className="row" style={{ marginBottom: 10 }}>
              <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10 }}>
                {leadTipos.map((t) => <option key={t} value={t}>{t === "todos" ? "Todos los tipos" : t}</option>)}
              </select>
              <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10 }}>
                <option value="todos">Todos los estados</option>
                {LEAD_ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
              </select>
              <span className="muted">{filteredLeads.length} de {leads.length}</span>
            </div>
            <table className="tbl"><thead><tr><th>FECHA</th><th>TIPO</th><th>CONTACTO</th><th>ESTADO</th><th></th></tr></thead>
              <tbody>{filteredLeads.map((l) => (
                <tr key={l.id}><td>{String(l.createdAt).slice(0, 10)}</td><td><span className="tag tag-reserva">{l.tipo}</span></td>
                  <td><strong>{l.nombre}</strong><br /><span className="muted">{l.email}</span></td>
                  <td><select value={l.estado ?? "nuevo"} onChange={(e) => call("/api/admin/leads", "PATCH", { id: l.id, estado: e.target.value })}>
                    {LEAD_ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
                  </select></td>
                  <td><div className="row">
                    <button className="btn btn-ghost" onClick={() => { setLeadDetail(l); setLeadNotas(l.notas ?? ""); }}><Icon name="eye" size={14} /> Ficha</button>
                    <button className="btn btn-ghost" onClick={() => { if (confirm("¿Eliminar solicitud?")) call(`/api/admin/leads?id=${l.id}`, "DELETE"); }}><Icon name="trash" size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "publicidad" && (
          <>
            <h3>{editingAd ? `Editar: ${editingAd.empresa}` : "Nuevo anuncio"}</h3>
            <div className="row">
              <input value={adEmpresa} onChange={(e) => setAdEmpresa(e.target.value)} placeholder="Empresa" style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
              <select value={adCat} onChange={(e) => setAdCat(e.target.value)} style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10 }}>
                <option>Tecnología</option><option>Colchones</option><option>Higiene</option><option>Energía</option><option>General</option>
              </select>
              <input value={adTitulo} onChange={(e) => setAdTitulo(e.target.value)} placeholder="Título" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
              <input value={adTexto} onChange={(e) => setAdTexto(e.target.value)} placeholder="Texto" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
              <input type="color" value={adColor} onChange={(e) => setAdColor(e.target.value)} style={{ height: 42 }} />
              {editingAd ? (
                <>
                  <button className="btn btn-green" onClick={async () => {
                    await call("/api/admin/ads", "PATCH", { id: editingAd.id, empresa: adEmpresa, categoria: adCat, titulo: adTitulo, texto: adTexto, color: adColor, image: adImage });
                    resetAdForm();
                    notify("Anuncio actualizado.");
                  }}><Icon name="check" size={15} /> Guardar</button>
                  <button className="btn btn-ghost" onClick={resetAdForm}>Cancelar</button>
                </>
              ) : (
                <button className="btn btn-green" onClick={async () => {
                  const res = await fetch("/api/admin/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empresa: adEmpresa, categoria: adCat, titulo: adTitulo, texto: adTexto, color: adColor, image: adImage }) });
                  if (res.ok) { resetAdForm(); notify("Anuncio publicado en el sitio."); loadAll(); } else notify("Faltan empresa y título.");
                }}><Icon name="plus" size={15} /> Crear</button>
              )}
            </div>
            <h3 style={{ marginTop: 18 }}>Imagen / GIF del anuncio</h3>
            <div className="row">
              <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
                <Icon name="download" size={15} /> {uploading ? "Subiendo…" : "Subir desde PC"}
                <input type="file" accept="image/*,.gif" hidden onChange={(e) => uploadFile(e.target.files?.[0])} />
              </label>
              <input value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} placeholder="…o pega URL https://… (jpg, png, gif, webp)" style={{ flex: 1, minWidth: 220, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
              <button className="btn btn-ghost" disabled={uploading} onClick={fetchImageUrl}>Traer URL</button>
              {adImage && <button className="btn btn-ghost" onClick={() => setAdImage("")}>Quitar</button>}
            </div>
            {adImage && (
              <div style={{ marginTop: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={adImage} alt="Vista previa" style={{ maxHeight: 140, borderRadius: 10, border: "1px solid var(--line)" }} />
              </div>
            )}
            {library.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p className="muted">Biblioteca subida ({library.length}) — toca para usar:</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {library.map((src) => (
                    <button key={src} onClick={() => setAdImage(src)} style={{ border: adImage === src ? "3px solid var(--green)" : "1px solid var(--line)", borderRadius: 8, padding: 0, cursor: "pointer", overflow: "hidden" }} title={src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: 90, height: 60, objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ marginTop: 22 }}>Vista previa en vivo</h3>
            <div className="row" style={{ marginBottom: 10 }}>
              <select value={previewAdId} onChange={(e) => setPreviewAdId(e.target.value)} style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10 }}>
                <option value="">Borrador del formulario</option>
                {ads.map((a) => <option key={a.id} value={a.id}>{a.empresa} — {a.titulo}</option>)}
              </select>
              {BANNERS.map((b) => (
                <button key={b.id} className={`pill ${bannerType === b.id ? "on" : ""}`} onClick={() => setBannerType(b.id)}>{b.nombre}</button>
              ))}
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px dashed var(--line)", borderRadius: 14, padding: 18, display: "flex", justifyContent: "center" }}>
              {previewAd ? <BannerPreview ad={previewAd} banner={banner} /> : <span className="muted">Escribe un título o elige un anuncio para previsualizar.</span>}
            </div>

            <table className="tbl" style={{ marginTop: 12 }}><thead><tr><th>EMPRESA</th><th>CATEGORÍA</th><th>TÍTULO</th><th>VISIBLE</th><th></th></tr></thead>
              <tbody>{ads.map((a) => (
                <tr key={a.id}><td><strong>{a.empresa}</strong><br />{a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" style={{ width: 72, height: 44, objectFit: "cover", borderRadius: 6, marginTop: 4 }} />
                  ) : <span className="muted">sin imagen</span>}</td><td>{a.categoria}</td><td>{a.titulo}</td>
                  <td><button className="btn btn-ghost" onClick={() => call("/api/admin/ads", "PATCH", { id: a.id, active: !a.active })}>{a.active ? "Visible" : "Oculto"}</button></td>
                  <td><div className="row">
                    <button className="btn btn-ghost" onClick={() => startEditAd(a)}>Editar</button>
                    <button className="btn btn-ghost" onClick={() => { if (confirm("¿Eliminar anuncio?")) call(`/api/admin/ads?id=${a.id}`, "DELETE"); }}><Icon name="trash" size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "ia" && (
          <>
            <h3>Modelos IA — elige el cerebro (keys guardadas solo en este PC)</h3>
            <div className="grid3">
              {(aiCfg?.providers ?? []).map((p) => (
                <div key={p.id} className="kpi" style={aiProvider === p.id ? { borderColor: "var(--green)", borderWidth: 2 } : undefined}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{p.nombre}</strong>
                    {aiCfg?.provider === p.id && <span className="tag tag-reserva">ACTIVO</span>}
                  </div>
                  <p className="muted" style={{ fontSize: 12 }}>Modelo sugerido: <code>{p.defaultModel || "—"}</code></p>
                  <div className="row">
                    <button className="btn btn-ghost" onClick={() => {
                      setAiProvider(p.id);
                      setAiModel(aiCfg?.provider === p.id ? aiCfg.model : p.defaultModel);
                      setAiBase(aiCfg?.provider === p.id ? aiCfg.baseUrl : p.baseUrl);
                      setAiKey("");
                    }}>{aiProvider === p.id ? "Seleccionado" : "Usar este"}</button>
                    {p.keyUrl && <a className="btn btn-ghost" href={p.keyUrl} target="_blank" rel="noreferrer">{p.keyLabel} ↗</a>}
                  </div>
                </div>
              ))}
            </div>
            <div className="kpi" style={{ marginTop: 12 }}>
              <strong>Configurar: {(aiCfg?.providers ?? []).find((p) => p.id === aiProvider)?.nombre}</strong>
              <div className="row" style={{ marginTop: 8 }}>
                <div className="field" style={{ flex: 1 }}><label>Modelo</label><input value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="gpt-4o-mini" /></div>
                <div className="field" style={{ flex: 1 }}><label>API key {aiCfg?.hasKey && aiProvider === aiCfg.provider ? `(guardada ${aiCfg.keyHint} — déjala vacía para conservar)` : "(se guarda local)"}</label><input type="password" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="sk-…" /></div>
                <div className="field" style={{ flex: 1 }}><label>Base URL</label><input value={aiBase} onChange={(e) => setAiBase(e.target.value)} placeholder="https://api.openai.com/v1" /></div>
              </div>
              <div className="row">
                <button className="btn btn-green" onClick={async () => {
                  const res = await fetch("/api/admin/ai-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: aiProvider, model: aiModel, apiKey: aiKey, baseUrl: aiBase }) });
                  const d = await res.json();
                  if (!res.ok) { notify(d.error ?? "Error."); return; }
                  setAiCfg(d.config); setAiKey("");
                  notify("Configuración IA guardada en este PC.");
                }}><Icon name="check" size={15} /> Guardar</button>
                <button className="btn btn-ghost" onClick={async () => {
                  setAiTest("Probando…");
                  const res = await fetch("/api/admin/ai-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", provider: aiProvider, model: aiModel, apiKey: aiKey || undefined, baseUrl: aiBase }) });
                  const d = await res.json();
                  setAiTest(res.ok ? `Conexión OK → ${d.reply}` : `Falló: ${d.error}`);
                }}><Icon name="refresh" size={15} /> Probar conexión</button>
              </div>
              {aiTest && <div className="aibox" style={{ marginTop: 10 }}>{aiTest}</div>}
            </div>

            <h3 style={{ marginTop: 22 }}>RAG — lo que la IA aprendió de las propiedades</h3>
            <div className="kpis">
              <div className="kpi"><span className="muted">Documentos</span><strong>{ragStats?.docs ?? "…"}</strong></div>
              <div className="kpi"><span className="muted">Propiedades indexadas</span><strong>{ragStats ? `${ragStats.indexedListings}/${ragStats.totalListings}` : "…"}</strong></div>
              <div className="kpi"><span className="muted">Índice</span><strong>TF-IDF local</strong><span className="muted">cada publicación auto-indexa</span></div>
              <div className="kpi"><span className="muted">Acciones</span><strong>—</strong><button className="btn btn-ghost" onClick={async () => {
                const res = await fetch("/api/admin/rag", { method: "POST" });
                const d = await res.json();
                if (res.ok) { notify(`Reindexadas ${d.docs} propiedades.`); loadAI(); }
              }}><Icon name="refresh" size={14} /> Reindexar todo</button></div>
            </div>
            <div className="kpi" style={{ marginTop: 12 }}>
              <strong>Probar el asistente</strong>
              <div className="row" style={{ marginTop: 8 }}>
                <input value={ragQ} onChange={(e) => setRagQ(e.target.value)} placeholder="Pregunta sobre las propiedades…" style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 10px", background: "var(--surface)" }} />
                <button className="btn btn-green" onClick={async () => {
                  setRagA("Pensando…");
                  const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: ragQ }) });
                  const d = await res.json();
                  setRagA(res.ok ? `${d.answer}\n\n— motor: ${d.provider}${d.sources?.length ? ` · fuentes: ${d.sources.join(", ")}` : ""}` : (d.error ?? "Error."));
                }}>Preguntar</button>
              </div>
              {ragA && <div className="aibox" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{ragA}</div>}
            </div>
          </>
        )}

        {tab === "comisiones" && (
          <div style={{ maxWidth: 520 }}>
            <h3>Comisión por plan (se aplica a nuevas reservas)</h3>
            {(["gratuito", "corporativo", "premium"] as const).map((k) => (
              <div className="field" key={k}><label>{k} (%)</label>
                <input type="number" min={0} max={50} step={0.5} value={rates[k]} onChange={(e) => setRates({ ...rates, [k]: Number(e.target.value) })} />
              </div>
            ))}
            <button className="btn btn-green" onClick={async () => {
              const res = await fetch("/api/admin/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rates: { gratuito: rates.gratuito / 100, corporativo: rates.corporativo / 100, premium: rates.premium / 100 } }) });
              notify(res.ok ? "Comisiones actualizadas." : "Error al guardar.");
            }}><Icon name="check" size={15} /> Guardar comisiones</button>
          </div>
        )}
      </div>

      {profile && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setProfile(null); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-in">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">FICHA DE USUARIA · SIN CONTRASEÑA</span>
                <button className="btn btn-ghost" onClick={() => setProfile(null)}><Icon name="x" size={16} /></button>
              </div>
              <h2 style={{ margin: "8px 0" }}>{profile.name}</h2>
              <table className="tbl"><tbody>
                <tr><td><strong>Email</strong></td><td>{profile.email}</td></tr>
                <tr><td><strong>Plan</strong></td><td>{profile.plan}</td></tr>
                <tr><td><strong>Rol</strong></td><td>{profile.role}</td></tr>
                <tr><td><strong>Estado</strong></td><td>{profile.banned ? "Baneada" : "Activa"}</td></tr>
                <tr><td><strong>Registro</strong></td><td>{String((profile as Row).createdAt ?? "").slice(0, 10)}</td></tr>
                <tr><td><strong>Publicaciones</strong></td><td>{profileStats(profile).listings}</td></tr>
                <tr><td><strong>Reservas hechas</strong></td><td>{profileStats(profile).asGuest}</td></tr>
                <tr><td><strong>Reservas recibidas</strong></td><td>{profileStats(profile).received}</td></tr>
                <tr><td><strong>Favoritos / Seguidos</strong></td><td>{profileStats(profile).favs} / {profileStats(profile).follows}</td></tr>
              </tbody></table>
              {tempPass && <div className="aibox" style={{ marginTop: 12 }}><strong>Clave temporal:</strong> <code style={{ fontSize: 18 }}>{tempPass}</code><br /><span className="muted">Compártela por canal seguro. Solo se muestra una vez.</span></div>}
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-green" onClick={() => resetPassword(profile)}>Restablecer contraseña</button>
                <button className="btn btn-ghost" onClick={() => { call("/api/admin/users", "PATCH", { id: profile.id, banned: !profile.banned }); setProfile({ ...profile, banned: !profile.banned }); }}>{profile.banned ? "Desbanear" : "Banear"}</button>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>La contraseña nunca se muestra: solo se puede restablecer.</p>
            </div>
          </div>
        </div>
      )}

      {leadDetail && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLeadDetail(null); }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-in">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">FICHA DE SOLICITUD · {leadDetail.tipo.toUpperCase()}</span>
                <button className="btn btn-ghost" onClick={() => setLeadDetail(null)}><Icon name="x" size={16} /></button>
              </div>
              <h2 style={{ margin: "8px 0" }}>{leadDetail.nombre}</h2>
              <table className="tbl"><tbody>
                <tr><td><strong>Email</strong></td><td>{leadDetail.email}</td></tr>
                <tr><td><strong>Fecha</strong></td><td>{String(leadDetail.createdAt).slice(0, 16).replace("T", " ")}</td></tr>
                <tr><td><strong>Detalle</strong></td><td>{leadDetail.detalle || "—"}</td></tr>
                <tr><td><strong>Mensaje</strong></td><td>{leadDetail.mensaje || "—"}</td></tr>
              </tbody></table>
              <div className="row" style={{ marginTop: 12 }}>
                <div className="field" style={{ flex: 1 }}><label>Estado del pipeline</label>
                  <select value={leadDetail.estado ?? "nuevo"} onChange={(e) => { setLeadDetail({ ...leadDetail, estado: e.target.value }); call("/api/admin/leads", "PATCH", { id: leadDetail.id, estado: e.target.value }); }}>
                    {LEAD_ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label>Notas internas del equipo</label>
                <textarea rows={3} value={leadNotas} onChange={(e) => setLeadNotas(e.target.value)} placeholder="Llamada realizada, presupuesto, seguimiento…" />
              </div>
              <div className="row">
                <button className="btn btn-green" onClick={() => { call("/api/admin/leads", "PATCH", { id: leadDetail.id, notas: leadNotas }); notify("Ficha actualizada."); }}>Guardar ficha</button>
                <button className="btn btn-ghost" onClick={() => { if (confirm("¿Eliminar solicitud?")) { call(`/api/admin/leads?id=${leadDetail.id}`, "DELETE"); setLeadDetail(null); } }}><Icon name="trash" size={14} /> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {listingDetail && (() => {
        const owner = ownerOf(listingDetail);
        const galeria: string[] = listingDetail.galeria ?? [];
        return (
          <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setListingDetail(null); }}>
            <div className="modal" style={{ maxWidth: 720 }}>
              <div className="modal-in">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="eyebrow">FICHA DE MODERACIÓN · {(listingDetail.active !== false) ? "ACTIVA" : "PAUSADA"}</span>
                  <button className="btn btn-ghost" onClick={() => setListingDetail(null)}><Icon name="x" size={16} /></button>
                </div>
                <h2 style={{ margin: "8px 0" }}>{listingDetail.titulo}</h2>
                <p className="muted">{listingDetail.categoria} · {listingDetail.tipo} · {listingDetail.ciudad} · {fmt(listingDetail.precioNoche)}/noche{listingDetail.precioMes ? ` · ${fmt(listingDetail.precioMes)}/mes` : ""} · {listingDetail.huespedes} huéspedes · ⭐ {listingDetail.rating} ({listingDetail.resenas})</p>
                <p style={{ fontSize: 14 }}>{listingDetail.descripcion}</p>
                <p className="muted">Políticas: {listingDetail.politicas}</p>
                <p className="muted">Amenidades: {(listingDetail.amenidades ?? []).join(" · ") || "—"}</p>
                <p className="muted">Anfitrión: <strong>{owner ? `${owner.name} (${owner.email})` : `${listingDetail.anfitrion?.nombre ?? ""} (demo)`}</strong> {owner?.banned ? "· BANEADO" : ""}</p>
                <h3>Galería ({galeria.length} fotos)</h3>
                {galeria.length === 0 ? <p className="muted">Sin fotos.</p> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {galeria.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }} />
                    ))}
                  </div>
                )}
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn btn-green" onClick={() => setEditingListing(listingDetail)}><Icon name="edit" size={14} /> Editar contenido</button>
                  <button className="btn btn-ghost" onClick={async () => { await call("/api/admin/listings", "PATCH", { id: listingDetail.id, active: !(listingDetail.active !== false) }); setListingDetail(null); }}>
                    {listingDetail.active !== false ? "Pausar publicación" : "Activar publicación"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => call("/api/admin/listings", "PATCH", { id: listingDetail.id, featured: !listingDetail.featured })}>{listingDetail.featured ? "Quitar destacado" : "Destacar"}</button>
                  {owner && (
                    <button className="btn btn-ghost" onClick={async () => {
                      if (!confirm(`${owner.banned ? "Desbanear" : "Banear"} a ${owner.name}? ${owner.banned ? "" : "No podrá entrar ni operar."}`)) return;
                      await call("/api/admin/users", "PATCH", { id: owner.id, banned: !owner.banned });
                      setListingDetail(null);
                    }}>{owner.banned ? "Desbanear anfitrión" : "Banear anfitrión"}</button>
                  )}
                  <button className="btn btn-ghost" onClick={async () => {
                    if (!confirm(`¿Eliminar "${listingDetail.titulo}"?`)) return;
                    await call(`/api/admin/listings?id=${listingDetail.id}`, "DELETE");
                    setListingDetail(null);
                  }}><Icon name="trash" size={14} /> Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {editingListing && (
        <ListingEditForm
          listing={editingListing}
          endpoint="/api/admin/listings"
          notify={notify}
          onClose={() => setEditingListing(null)}
          onSaved={() => { setEditingListing(null); setListingDetail(null); loadAll(); }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function BannerPreview({ ad, banner }: { ad: Row; banner: { id: string; nombre: string; w: number | string; h: number } }) {
  const slim = banner.h <= 90;
  return (
    <div style={{ width: banner.w, maxWidth: "100%", height: banner.h, background: ad.color, borderRadius: 12, color: "white", padding: 0, display: "flex", flexDirection: slim ? "row" : "column", overflow: "hidden", boxShadow: "0 10px 30px #00000030", position: "relative" }}>
      {ad.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.image} alt="" style={slim ? { height: "100%", width: 140, objectFit: "cover" } : { width: "100%", height: banner.id === "tarjeta" ? 110 : Math.round(banner.h * 0.45), objectFit: "cover" }} />
      ) : null}
      <div style={{ padding: slim ? "0 18px" : 16, display: "flex", flexDirection: slim ? "row" : "column", alignItems: slim ? "center" : "flex-start", justifyContent: "center", gap: slim ? 14 : 6, flex: 1, minWidth: 0 }}>
        <small style={{ opacity: 0.85, letterSpacing: 1.5, fontSize: 10 }}>{String(ad.categoria ?? "").toUpperCase()} · {banner.nombre}</small>
        <strong style={{ fontSize: slim ? 15 : banner.h >= 600 ? 26 : 19, lineHeight: 1.2 }}>{ad.empresa} — {ad.titulo}</strong>
        {!slim && <span style={{ fontSize: 13, opacity: 0.92 }}>{ad.texto}</span>}
        <span style={{ background: "white", color: "#1a2e22", borderRadius: 999, padding: slim ? "6px 14px" : "8px 18px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>Ver más</span>
      </div>
    </div>
  );
}
