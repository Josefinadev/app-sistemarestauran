/* ═══════════════════════════════════════════════════════════
   API Client — Comunicación con el backend Express
   Misma API que usa la web, adaptada para React Native.
   ═══════════════════════════════════════════════════════════ */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LoginResponse } from "../types";

// En Android emulador usa 10.0.2.2 para acceder a localhost del host
// En dispositivo físico usa la IP de tu PC en la red local
const API_URL = "http://192.168.18.17:3001/api";

// ── Token Management ──

/** Obtener token guardado */
async function getAuthToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem("mesero-auth-token");
    return raw;
  } catch {
    return null;
  }
}

/** Guardar token */
export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem("mesero-auth-token", token);
}

/** Eliminar token */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem("mesero-auth-token");
  await AsyncStorage.removeItem("mesero-user-data");
  await AsyncStorage.removeItem("mesero-restaurante-data");
}

/** Guardar datos del usuario */
export async function saveUserData(data: any): Promise<void> {
  await AsyncStorage.setItem("mesero-user-data", JSON.stringify(data));
}

/** Obtener datos del usuario */
export async function getUserData(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem("mesero-user-data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Guardar datos del restaurante */
export async function saveRestauranteData(data: any): Promise<void> {
  await AsyncStorage.setItem("mesero-restaurante-data", JSON.stringify(data));
}

/** Obtener datos del restaurante */
export async function getRestauranteData(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem("mesero-restaurante-data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Core Fetch ──

async function apiFetch(path: string, options?: RequestInit) {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token) {
    await clearAuthToken();
    throw new Error("SESSION_EXPIRED");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Error ${res.status}`);
  }

  if (res.status === 204) return null;

  const json = await res.json();
  return json.data ?? json;
}

// ── Auth ──

export const loginAuth = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Email o contraseña incorrectos.");
  }

  const json = await res.json();
  return json.data;
};

export const getAuthMe = () => apiFetch("/auth/me");

// ── Pedidos ──

export const getPedidos = (params: {
  id_restaurante?: string;
  estado?: string;
  estado_pago?: string;
}) => {
  const query = new URLSearchParams();
  if (params.id_restaurante) query.set("id_restaurante", params.id_restaurante);
  if (params.estado) query.set("estado", params.estado);
  if (params.estado_pago) query.set("estado_pago", params.estado_pago);
  return apiFetch(`/pedidos?${query.toString()}`);
};

export const getPedido = (id: string) => apiFetch(`/pedidos/${id}`);

export const actualizarEstadoPedido = (id: string, estado: string) =>
  apiFetch(`/pedidos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

export const actualizarEstadoDetalle = (id: string, estado: string) =>
  apiFetch(`/pedidos/detalle/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

// ── Mesas ──

export const getMesas = (idRestaurante: string) =>
  apiFetch(`/mesas?id_restaurante=${idRestaurante}`);

// ── Productos ──

export const getProductos = (idRestaurante: string) =>
  apiFetch(`/productos?id_restaurante=${idRestaurante}&disponible=true`);

export const getCategorias = (idRestaurante: string) =>
  apiFetch(`/categorias?id_restaurante=${idRestaurante}`);

export const getProductoDetalle = (id: string) =>
  apiFetch(`/productos/${id}`);

// ── Crear Pedido (mesero toma pedido en mesa) ──

export const crearPedido = (data: {
  id_restaurante: string;
  id_mesa: string;
  id_usuario?: string;
  notas?: string;
  items: {
    id_producto: string;
    cantidad: number;
    notas?: string;
    agregados?: { id_agregado: string }[];
  }[];
}) => apiFetch("/pedidos", { method: "POST", body: JSON.stringify(data) });
