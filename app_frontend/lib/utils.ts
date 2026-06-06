import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Calcula la distancia en metros entre dos coordenadas GPS
 * usando la fórmula de Haversine.
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verifica si el usuario está dentro del radio permitido del restaurante.
 */
export function dentroDelRadio(
  userLat: number,
  userLon: number,
  restLat: number,
  restLon: number,
  radioMetros: number
): boolean {
  return calcularDistancia(userLat, userLon, restLat, restLon) <= radioMetros;
}

/**
 * Solicita la geolocalización del navegador.
 * Retorna las coordenadas o un error.
 */
export function obtenerUbicacion(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada por este navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Formatea un precio en soles peruanos.
 */
export function formatPrecio(precio: number): string {
  return `S/ ${precio.toFixed(2)}`;
}

/**
 * Formatea una fecha ISO a formato legible.
 */
export function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea una hora ISO a formato legible.
 */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea fecha y hora completa.
 */
export function formatFechaHora(iso: string): string {
  return `${formatFecha(iso)} ${formatHora(iso)}`;
}

/**
 * Genera un color de badge según el estado del pedido.
 */
export function getEstadoColor(estado: string): string {
  const colores: Record<string, string> = {
    PENDIENTE: "badge-pending",
    EN_PREPARACION: "badge-preparing",
    LISTO: "badge-ready",
    ENTREGADO: "badge-delivered",
    CANCELADO: "badge-cancelled",
  };
  return colores[estado] || "badge-pending";
}

/**
 * Traduce el estado del pedido a texto legible.
 */
export function getEstadoTexto(estado: string): string {
  const textos: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    LISTO: "Listo",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return textos[estado] || estado;
}

/**
 * Trunca un texto a un máximo de caracteres.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Genera un slug aleatorio UUID v4 (para mesas seguras).
 */
export function generarSlugMesa(): string {
  return crypto.randomUUID();
}

/**
 * Merge Tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
