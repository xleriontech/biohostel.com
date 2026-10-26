"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "../icons";
import {
  FONT_PRESETS,
  THEME_PRESETS,
  legalToText,
  textToLegal,
  type LegalPage,
  type LegalSection,
  type NavItem,
  type SiteSettings,
  type SocialLink,
} from "@/lib/site-settings";

type LegalKey = "terms" | "privacy" | "cookies";

export function SiteSettingsPanel({ notify }: { notify: (message: string) => void }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [legalKey, setLegalKey] = useState<LegalKey>("terms");

  async function load() {
    const data = await fetch("/api/admin/settings").then((r) => r.json()).catch(() => ({}));
    if (data?.settings) setSettings(data.settings);
    else setErr("No se pudieron cargar los ajustes.");
  }

  useEffect(() => {
    load();
  }, []);

  function update(fn: (draft: SiteSettings) => void) {
    setSettings((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }

  async function save() {
    if (!settings) return;
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "No se pudieron guardar los ajustes.");
      return;
    }
    setSettings(data.settings);
    notify("Ajustes guardados. Recarga el sitio para verlos.");
  }

  async function reset() {
    if (!confirm("¿Restaurar todos los ajustes al diseño y contenido original?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "No se pudo restaurar.");
      return;
    }
    setSettings(data.settings);
    notify("Ajustes restaurados al original.");
  }

  async function uploadImage(kind: "logo" | "hero" | "og", file?: File) {
    if (!file) return;
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error ?? "No se pudo subir la imagen.");
        return;
      }
      update((draft) => {
        if (kind === "logo") draft.brand.logoUrl = data.url;
        if (kind === "hero") draft.hero.image = data.url;
        if (kind === "og") draft.seo.ogImage = data.url;
      });
      notify("Imagen subida. Guarda los ajustes para publicarla.");
    } catch {
      notify("Error al subir la imagen.");
    } finally {
      setUploading("");
    }
  }

  if (!settings) {
    return <p className="muted">{err || "Cargando ajustes…"}</p>;
  }

  const legal = settings.legal[legalKey];

  return (
    <div className="admin-form">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0 }}>Ajustes del sitio</h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Marca, contenido, diseño, estilos, SEO, módulos y legal. Actualizado: {settings.updatedAt.slice(0, 16).replace("T", " ")}
          </p>
        </div>
        <div className="row">
          <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
            <Icon name="eye" size={15} /> Ver sitio
          </a>
          <button className="btn btn-green" type="button" disabled={busy} onClick={save}>
            <Icon name="check" size={15} /> {busy ? "Guardando…" : "Guardar ajustes"}
          </button>
        </div>
      </div>

      {err && <div className="aibox warn">{err}</div>}

      <Block title="Marca y cabecera" hint="Nombre, logo y cinta superior que aparecen en todo el sitio.">
        <div className="grid3">
          <Field label="Nombre de marca">
            <input value={settings.brand.name} onChange={(e) => update((d) => { d.brand.name = e.target.value; })} />
          </Field>
          <Field label="Sufijo / texto pequeño">
            <input value={settings.brand.suffix} onChange={(e) => update((d) => { d.brand.suffix = e.target.value; })} />
          </Field>
          <Field label="Tagline">
            <input value={settings.brand.tagline} onChange={(e) => update((d) => { d.brand.tagline = e.target.value; })} />
          </Field>
        </div>
        <MediaField
          label="Logo (reemplaza el icono de la marca)"
          value={settings.brand.logoUrl}
          onChange={(value) => update((d) => { d.brand.logoUrl = value; })}
          onUpload={(file) => uploadImage("logo", file)}
          uploading={uploading === "logo"}
        />
        <Field label="Cinta superior (announcement)">
          <input value={settings.announcement} onChange={(e) => update((d) => { d.announcement = e.target.value; })} />
        </Field>
      </Block>

      <Block title="Hero de la página de inicio" hint="El texto clave del sitio. La parte resaltada se pinta con el color primario.">
        <div className="grid3">
          <Field label="Eyebrow">
            <input value={settings.hero.eyebrow} onChange={(e) => update((d) => { d.hero.eyebrow = e.target.value; })} />
          </Field>
          <Field label="Título">
            <input value={settings.hero.title} onChange={(e) => update((d) => { d.hero.title = e.target.value; })} />
          </Field>
          <Field label="Parte resaltada del título">
            <input value={settings.hero.highlight} onChange={(e) => update((d) => { d.hero.highlight = e.target.value; })} />
          </Field>
        </div>
        <Field label="Subtítulo">
          <textarea rows={3} value={settings.hero.subtitle} onChange={(e) => update((d) => { d.hero.subtitle = e.target.value; })} />
        </Field>
        <MediaField
          label="Imagen de fondo del hero (opcional)"
          value={settings.hero.image}
          onChange={(value) => update((d) => { d.hero.image = value; })}
          onUpload={(file) => uploadImage("hero", file)}
          uploading={uploading === "hero"}
        />
      </Block>

      <Block title="Navegación principal" hint="Enlaces visibles en la cabecera. Usa #seccion para anclas internas o /ruta para páginas.">
        <LinksEditor
          items={settings.nav}
          onChange={(nav) => update((d) => { d.nav = nav; })}
          addLabel="Añadir enlace"
        />
      </Block>

      <Block title="Pie de página" hint="Texto, contacto, enlaces y redes sociales.">
        <div className="grid3">
          <Field label="Texto del pie">
            <input value={settings.footer.text} onChange={(e) => update((d) => { d.footer.text = e.target.value; })} />
          </Field>
          <Field label="Correo de contacto">
            <input type="email" value={settings.footer.contactEmail} onChange={(e) => update((d) => { d.footer.contactEmail = e.target.value; })} />
          </Field>
        </div>
        <h4>Enlaces del pie</h4>
        <LinksEditor
          items={settings.footer.links}
          onChange={(links) => update((d) => { d.footer.links = links; })}
          addLabel="Añadir enlace"
        />
        <h4>Redes sociales</h4>
        <SocialsEditor
          items={settings.footer.socials}
          onChange={(socials) => update((d) => { d.footer.socials = socials; })}
        />
      </Block>

      <Block title="Diseño y estilos" hint="Paletas, colores, tipografía, radios y tema por defecto. Se aplican en tiempo real a todo el sitio.">
        <div className="row" style={{ marginBottom: 14 }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn btn-ghost"
              onClick={() => update((d) => { Object.assign(d.design, preset.light); Object.assign(d.dark, preset.dark); })}
            >
              <span style={{ display: "inline-flex", gap: 3, marginRight: 4 }}>
                {[preset.light.primary, preset.light.accent, preset.light.background].map((c) => (
                  <span key={c} style={{ width: 14, height: 14, borderRadius: 4, background: c, border: "1px solid #0002" }} />
                ))}
              </span>
              {preset.label}
            </button>
          ))}
        </div>

        <h4>Modo claro</h4>
        <div className="grid3">
          <ColorField label="Primario" value={settings.design.primary} onChange={(v) => update((d) => { d.design.primary = v; })} />
          <ColorField label="Primario profundo" value={settings.design.primaryDeep} onChange={(v) => update((d) => { d.design.primaryDeep = v; })} />
          <ColorField label="Acento" value={settings.design.accent} onChange={(v) => update((d) => { d.design.accent = v; })} />
          <ColorField label="Lima / detalle" value={settings.design.lime} onChange={(v) => update((d) => { d.design.lime = v; })} />
          <ColorField label="Fondo" value={settings.design.background} onChange={(v) => update((d) => { d.design.background = v; })} />
          <ColorField label="Superficie" value={settings.design.surface} onChange={(v) => update((d) => { d.design.surface = v; })} />
          <ColorField label="Texto" value={settings.design.ink} onChange={(v) => update((d) => { d.design.ink = v; })} />
          <ColorField label="Líneas / bordes" value={settings.design.line} onChange={(v) => update((d) => { d.design.line = v; })} />
        </div>

        <h4>Modo oscuro</h4>
        <div className="grid3">
          <ColorField label="Fondo" value={settings.dark.background} onChange={(v) => update((d) => { d.dark.background = v; })} />
          <ColorField label="Superficie" value={settings.dark.surface} onChange={(v) => update((d) => { d.dark.surface = v; })} />
          <ColorField label="Texto" value={settings.dark.ink} onChange={(v) => update((d) => { d.dark.ink = v; })} />
          <ColorField label="Primario" value={settings.dark.primary} onChange={(v) => update((d) => { d.dark.primary = v; })} />
          <ColorField label="Acento" value={settings.dark.accent} onChange={(v) => update((d) => { d.dark.accent = v; })} />
          <ColorField label="Líneas / bordes" value={settings.dark.line} onChange={(v) => update((d) => { d.dark.line = v; })} />
        </div>

        <h4>Tipografía y formas</h4>
        <div className="grid3">
          <Field label="Tipografía">
            <select value={settings.design.font} onChange={(e) => update((d) => { d.design.font = e.target.value as SiteSettings["design"]["font"]; })}>
              {FONT_PRESETS.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
            </select>
          </Field>
          <Field label="Tema por defecto">
            <select value={settings.design.defaultTheme} onChange={(e) => update((d) => { d.design.defaultTheme = e.target.value as SiteSettings["design"]["defaultTheme"]; })}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </Field>
          <Field label="Radio de tarjetas (px)">
            <input type="number" min={0} max={40} value={settings.design.cardRadius} onChange={(e) => update((d) => { d.design.cardRadius = Number(e.target.value); })} />
          </Field>
          <Field label="Radio de botones (px)">
            <input type="number" min={0} max={999} value={settings.design.buttonRadius} onChange={(e) => update((d) => { d.design.buttonRadius = Number(e.target.value); })} />
          </Field>
          <Field label="Radio de campos (px)">
            <input type="number" min={0} max={40} value={settings.design.inputRadius} onChange={(e) => update((d) => { d.design.inputRadius = Number(e.target.value); })} />
          </Field>
        </div>
      </Block>

      <Block title="SEO y metadatos" hint="Título, descripción e imagen que ven Google y las redes.">
        <Field label="Título del sitio">
          <input value={settings.seo.title} onChange={(e) => update((d) => { d.seo.title = e.target.value; })} />
        </Field>
        <Field label="Descripción">
          <textarea rows={3} value={settings.seo.description} onChange={(e) => update((d) => { d.seo.description = e.target.value; })} />
        </Field>
        <MediaField
          label="Imagen Open Graph"
          value={settings.seo.ogImage}
          onChange={(value) => update((d) => { d.seo.ogImage = value; })}
          onUpload={(file) => uploadImage("og", file)}
          uploading={uploading === "og"}
        />
      </Block>

      <Block title="Módulos visibles" hint="Apaga secciones sin borrar su contenido. La navegación se ajusta sola.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {(Object.keys(settings.modules) as (keyof SiteSettings["modules"])[]).map((key) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.modules[key]}
                onChange={(e) => update((d) => { d.modules[key] = e.target.checked; })}
              />
              {MODULE_LABELS[key]}
            </label>
          ))}
        </div>
      </Block>

      <Block title="Páginas legales" hint="Términos, privacidad y cookies editables sin tocar código.">
        <div className="row" style={{ marginBottom: 10 }}>
          {(["terms", "privacy", "cookies"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`pill ${legalKey === key ? "on" : ""}`}
              onClick={() => setLegalKey(key)}
            >
              {settings.legal[key].title}
            </button>
          ))}
        </div>
        <div className="grid3">
          <Field label="Título de la página">
            <input value={legal.title} onChange={(e) => update((d) => { d.legal[legalKey].title = e.target.value; })} />
          </Field>
          <Field label="Intro / vigencia">
            <input value={legal.intro} onChange={(e) => update((d) => { d.legal[legalKey].intro = e.target.value; })} />
          </Field>
        </div>
        <Field label="Contenido (cada sección empieza con ## )">
          <LegalEditor
            key={legalKey}
            page={legal}
            onChange={(sections) => update((d) => { d.legal[legalKey].sections = sections; })}
          />
        </Field>
      </Block>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={reset}>
          <Icon name="refresh" size={15} /> Restaurar original
        </button>
        <button className="btn btn-green" type="button" disabled={busy} onClick={save}>
          <Icon name="check" size={15} /> {busy ? "Guardando…" : "Guardar ajustes"}
        </button>
      </div>
    </div>
  );
}

const MODULE_LABELS: Record<keyof SiteSettings["modules"], string> = {
  plans: "Planes y comisiones",
  profiles: "Perfiles de anfitriones",
  publicAds: "Publicidad de proveedores",
  sponsors: "Sponsors / fundaciones",
  packs: "Paquetes",
  assistant: "Asistente IA flotante",
  currency: "Selector de moneda",
  themeToggle: "Selector claro/oscuro",
};

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="kpi" style={{ marginBottom: 14 }}>
      <strong style={{ fontSize: 16 }}>{title}</strong>
      {hint && <p className="muted" style={{ fontSize: 13, margin: "4px 0 14px" }}>{hint}</p>}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <Field label={label}>
      <div className="row" style={{ gap: 8 }}>
        <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} style={{ width: 54, height: 40, padding: 3, flex: "0 0 auto" }} />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#15803d" />
      </div>
    </Field>
  );
}

function MediaField({
  label,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file?: File) => void;
  uploading: boolean;
}) {
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <div className="row" style={{ gap: 8 }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… o /api/files/…" />
        <label className="btn btn-ghost" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
          <Icon name="download" size={15} /> {uploading ? "Subiendo…" : "Subir"}
          <input type="file" accept="image/*,.gif" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
        {value && <button className="btn btn-ghost" type="button" onClick={() => onChange("")}>Quitar</button>}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Vista previa" style={{ maxHeight: 110, marginTop: 8, borderRadius: 8, border: "1px solid var(--line)" }} />
      )}
    </div>
  );
}

function LinksEditor({ items, onChange, addLabel }: { items: NavItem[]; onChange: (items: NavItem[]) => void; addLabel: string }) {
  function setItem(index: number, patch: Partial<NavItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="row" style={{ gap: 6, marginBottom: 6 }}>
          <input value={item.label} onChange={(e) => setItem(index, { label: e.target.value })} placeholder="Etiqueta" style={{ flex: "0 0 30%" }} />
          <input value={item.href} onChange={(e) => setItem(index, { href: e.target.value })} placeholder="/ruta o #seccion" />
          <button className="btn btn-ghost" type="button" onClick={() => move(index, -1)} disabled={index === 0} title="Subir">↑</button>
          <button className="btn btn-ghost" type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Bajar">↓</button>
          <button className="btn btn-ghost" type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} title="Quitar">×</button>
        </div>
      ))}
      <button className="btn btn-ghost" type="button" onClick={() => onChange([...items, { label: "Nuevo enlace", href: "#" }])}>
        + {addLabel}
      </button>
    </div>
  );
}

function SocialsEditor({ items, onChange }: { items: SocialLink[]; onChange: (items: SocialLink[]) => void }) {
  function setItem(index: number, patch: Partial<SocialLink>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="row" style={{ gap: 6, marginBottom: 6 }}>
          <input value={item.label} onChange={(e) => setItem(index, { label: e.target.value })} placeholder="Instagram" style={{ flex: "0 0 30%" }} />
          <input value={item.url} onChange={(e) => setItem(index, { url: e.target.value })} placeholder="https://instagram.com/…" />
          <button className="btn btn-ghost" type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} title="Quitar">×</button>
        </div>
      ))}
      <button className="btn btn-ghost" type="button" onClick={() => onChange([...items, { label: "Instagram", url: "https://" }])}>
        + Añadir red social
      </button>
    </div>
  );
}

function LegalEditor({ page, onChange }: { page: LegalPage; onChange: (sections: LegalSection[]) => void }) {
  const [raw, setRaw] = useState(() => legalToText(page));

  return (
    <div>
      <textarea
        rows={16}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => onChange(textToLegal(raw))}
        placeholder={"## 1. Título de la sección\nTexto del párrafo…\n\n## 2. Otra sección\nMás texto…"}
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-ghost" type="button" onClick={() => onChange(textToLegal(raw))}>
          <Icon name="check" size={14} /> Aplicar contenido
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setRaw(legalToText(page))}>
          Descartar cambios
        </button>
        <span className="muted">Formato: cada sección empieza con ## </span>
      </div>
    </div>
  );
}
