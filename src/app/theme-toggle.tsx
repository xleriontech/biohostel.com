"use client";

import { useLayoutEffect, useState } from "react";
import { Icon } from "./icons";

// El script de arranque del layout aplica el tema antes del primer pintado.
// En dev React remonta <html> y limpia el atributo, por eso se vuelve a aplicar aquí.
function readTheme(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem("bio-theme");
    return stored === "dark" || stored === "light" ? stored : document.documentElement.dataset.theme || fallback;
  } catch {
    return fallback;
  }
}

export function ThemeToggle({ defaultTheme = "light" }: { defaultTheme?: string }) {
  const [theme, setTheme] = useState(() => readTheme(defaultTheme));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = readTheme(defaultTheme);
  }, [defaultTheme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("bio-theme", next);
    } catch { /* noop */ }
  }

  return (
    <button className="btn btn-ghost" onClick={toggle} aria-label="Cambiar a modo oscuro/claro" title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} style={{ padding: "11px 13px" }}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
