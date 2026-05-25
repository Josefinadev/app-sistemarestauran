import type { Restaurante } from "@/lib/database.types";

/**
 * Aplica la paleta de un restaurante a variables CSS globales.
 * Mantener esto centralizado evita diferencias entre módulos.
 */
export function applyRestauranteBranding(restaurante: Pick<Restaurante, "color_primario" | "color_secundario"> | null | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const primaryStr = restaurante?.color_primario || "#C5A059";
  const secondaryStr = restaurante?.color_secundario || "#E2725B";

  if (typeof primaryStr === "string" && primaryStr.startsWith("#")) {
    root.style.setProperty("--primary", primaryStr);
    root.style.setProperty("--primary-light", `${primaryStr}dd`);
    root.style.setProperty("--primary-dark", `${primaryStr}aa`);
    root.style.setProperty("--primary-ghost", `${primaryStr}15`);
    root.style.setProperty("--primary-glow", `${primaryStr}25`);
  } else {
    root.style.setProperty("--primary", "#C5A059");
    root.style.setProperty("--primary-light", "#D4B474");
    root.style.setProperty("--primary-dark", "#A8863D");
    root.style.setProperty("--primary-ghost", "rgba(197, 160, 89, 0.08)");
    root.style.setProperty("--primary-glow", "rgba(197, 160, 89, 0.15)");
  }

  if (typeof secondaryStr === "string" && secondaryStr.startsWith("#")) {
    root.style.setProperty("--secondary", secondaryStr);
  } else {
    root.style.setProperty("--secondary", "#E2725B");
  }
}

/**
 * Elimina la paleta personalizada inyectada, restaurando
 * los valores originales del CSS. Ideal para el SuperAdmin.
 */
export function resetRestauranteBranding() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-light");
  root.style.removeProperty("--primary-dark");
  root.style.removeProperty("--primary-ghost");
  root.style.removeProperty("--primary-glow");
  root.style.removeProperty("--secondary");
}
