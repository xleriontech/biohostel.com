"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      setTheme(document.documentElement.dataset.theme || localStorage.getItem("bio-theme") || "light");
    } catch { /* noop */ }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("bio-theme", next);
    } catch { /* noop */ }
  }

  return (
    <button className="btn btn-ghost" onClick={toggle} aria-label="Cambiar a modo oscuro/claro" title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} style={{ padding: "11px 13px" }}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
