"use client";

import Link from "next/link";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySelect } from "@/components/currency-select";
import { useSiteSettings } from "./site-settings-context";

type LegalKey = "terms" | "privacy" | "cookies";

export function LegalPageView({ page }: { page: LegalKey }) {
  const settings = useSiteSettings();
  const content = settings.legal[page];

  return (
    <div className="legal-shell">
      <header className="legal-head">
        <div className="row" style={{ gap: 24, flexWrap: "wrap" }}>
          <Brand />
          <nav aria-label="Legal">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/cookies">Cookies</Link>
          </nav>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {settings.modules.themeToggle && <ThemeToggle />}
          {settings.modules.currency && <CurrencySelect />}
          <Link className="btn btn-ghost" href="/">← Volver al sitio</Link>
        </div>
      </header>
      <main>
        <article className="legal-card">
          <h1>{content.title}</h1>
          <p className="legal-intro">{content.intro}</p>
          {content.sections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="legal-section">
              <h2>{section.title}</h2>
              <p style={{ whiteSpace: "pre-wrap" }}>{section.body}</p>
            </div>
          ))}
        </article>
      </main>
      <footer className="legal-foot">
        <p style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
          {settings.brand.name}{settings.brand.suffix}
        </p>
        <p>© {settings.brand.name} · {settings.footer.text}</p>
      </footer>
    </div>
  );
}
