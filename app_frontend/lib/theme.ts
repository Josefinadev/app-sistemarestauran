/* ═══════════════════════════════════════════════════════════
   THEME — Sistema de modo claro/oscuro
   Persiste en localStorage para consistencia entre páginas.
   Light mode es el predeterminado.
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = "el-mijano-theme";

export type Theme = "light" | "dark";

/** Lee el tema guardado en localStorage. Si no hay, retorna "light". */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "light";
}

/** Aplica el tema al DOM (data-theme en <html>). */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/** Guarda y aplica un tema. */
export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
}

/** Alterna entre light y dark. Retorna el nuevo tema. */
export function toggleTheme(): Theme {
  const current = getStoredTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
