"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

/* ═══════════════════════════════════════════════════════════
   ThemeToggle — Boton de modo claro/oscuro.
   Variante inline para headers, variante floating para paginas sueltas.
   SIEMPRE visible. Persiste en localStorage.
   ═══════════════════════════════════════════════════════════ */

interface ThemeToggleProps {
  /** Si es true, se posiciona fixed en pantalla. Default: false (inline en header) */
  floating?: boolean;
}

export function ThemeToggle({ floating = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={floating ? "theme-toggle-btn theme-toggle-btn--floating" : "theme-toggle-btn"}
        aria-label="Cargando tema..."
        style={{ opacity: 0.5 }}
      >
        <Moon size={16} />
      </button>
    );
  }

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      className={floating ? "theme-toggle-btn theme-toggle-btn--floating" : "theme-toggle-btn"}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
