/* ═══════════════════════════════════════════════════════════
   API Client — Comunicación centralizada con el backend Express
   Todas las llamadas al backend pasan por aquí.
   Incluye auth token en las peticiones automáticamente.
   ═══════════════════════════════════════════════════════════ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Obtener el token de sesión actual del store (sin hooks) */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // El store (lib/store.ts) persiste en sessionStorage para mantener sesiones
    // independientes por pestaña. Leer de localStorage siempre devolvería null
    // y provocaría el error "Token faltante" en cada petición.
    const raw = sessionStorage.getItem("el-mijano-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Incluir token de auth si existe
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Prevent infinite "Guardando..." states if the backend hangs.
  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Tiempo de espera agotado (${timeoutMs / 1000}s). Verifica que el backend esté corriendo en ${API_URL}.`);
    }
    if (err instanceof TypeError) {
      throw new Error(`No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_URL}.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // Si el token expiró (401 real, no error temporal), limpiar sesión
  if (res.status === 401 && token) {
    const body = await res.json().catch(() => ({}));
    // Solo redirigir si es un 401 genuino (token invalido/expirado)
    if (body.message?.includes("expirada") || body.message?.includes("inválido") || body.message?.includes("faltante")) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("el-mijano-auth");
        window.location.href = "/login";
      }
    }
    throw new Error(body.message || "Error de autenticación");
  }

  // Error temporal del servidor - no cerrar sesión
  if (res.status === 503) {
    throw new Error("Error temporal del servidor. Intenta de nuevo.");
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

/** Login con email y contraseña — devuelve token + datos de usuario */
export const loginAuth = async (email: string, password: string) => {
  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Tiempo de espera agotado (${timeoutMs / 1000}s). Verifica que el backend esté corriendo en ${API_URL}.`);
    }
    if (err instanceof TypeError) {
      throw new Error(`No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_URL}.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Email o contraseña incorrectos.");
  }

  const json = await res.json();
  return json.data;
};

/** Registro de cliente (comensal) */
export const registrarCliente = (data: {
  email: string;
  password: string;
  nombre: string;
  id_restaurante: string;
}) => apiFetch("/auth/registrar-cliente", { method: "POST", body: JSON.stringify(data) });

/** Verificar sesión actual — devuelve datos del usuario */
export const getAuthMe = () => apiFetch("/auth/me");

/** Crear un nuevo usuario (solo admin) */
export const crearUsuarioAuth = (data: {
  email: string;
  password: string;
  nombre: string;
  rol: string;
  id_restaurante: string;
}) => apiFetch("/auth/crear-usuario", { method: "POST", body: JSON.stringify(data) });

/** Cambiar contraseña de un usuario (solo admin) */
export const cambiarPasswordAuth = (user_id: string, new_password: string) =>
  apiFetch("/auth/cambiar-password", {
    method: "POST",
    body: JSON.stringify({ user_id, new_password }),
  });

// Upload de imágenes
export async function uploadImage(file: File, folder: string = "web"): Promise<string> {
  const formData = new FormData();
  formData.append("imagen", file);
  formData.append("folder", folder);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.url;
}

// ── Delete image from Supabase Storage (non-blocking, best-effort) ──
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;
  try {
    const { supabase } = await import("@/lib/supabase");
    // URL format: ...supabase.co/storage/v1/object/public/imagenes/path/file.ext
    const marker = "/imagenes/";
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return; // not a Supabase storage URL, skip silently
    const filePath = imageUrl.substring(idx + marker.length).split("?")[0]; // strip query params
    if (!filePath) return;
    const { error } = await supabase.storage.from("imagenes").remove([filePath]);
    if (error) console.warn("Storage delete warning:", error.message);
  } catch (err) {
    console.warn("Could not delete image from storage:", err);
    // Non-fatal: silently swallow errors
  }
}

// ── Restaurante ──
export const getRestaurante = (slug: string) =>
  apiFetch(`/restaurante/${slug}`);

export const validarUbicacion = (slug: string, latitud: number, longitud: number) =>
  apiFetch(`/restaurante/${slug}/validar-ubicacion`, {
    method: "POST",
    body: JSON.stringify({ latitud, longitud }),
  });

/** Crear un nuevo restaurante (solo SuperAdmin) */
export const crearRestaurante = (data: {
  nombre: string;
  slug: string;
  propietario_nombre: string;
  propietario_email: string;
  propietario_password: string;
  color_primario?: string;
  color_secundario?: string;
  logo_url?: string;
  hero_banner_url?: string;
  latitud?: number;
  longitud?: number;
  radio_permitido_metros?: number;
}) => apiFetch("/restaurante", { method: "POST", body: JSON.stringify(data) });

export const actualizarRestauranteBranding = (id: string, data: {
  color_primario?: string;
  color_secundario?: string;
  logo_url?: string | null;
  hero_banner_url?: string | null;
}) => apiFetch(`/restaurante/${id}/branding`, { method: "PATCH", body: JSON.stringify(data) });

/** Actualizar restaurante completo (solo SuperAdmin) */
export const actualizarRestaurante = (id: string, data: {
  nombre?: string;
  slug?: string;
  color_primario?: string;
  color_secundario?: string;
  logo_url?: string | null;
  hero_banner_url?: string | null;
  latitud?: number;
  longitud?: number;
  radio_permitido_metros?: number;
}) => apiFetch(`/restaurante/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const eliminarRestaurante = (id: string) =>
  apiFetch(`/restaurante/${id}`, { method: "DELETE" });

// ── Categorías ──
export const getCategorias = (idRestaurante: string) =>
  apiFetch(`/categorias?id_restaurante=${idRestaurante}`);

export const crearCategoria = (data: any) =>
  apiFetch("/categorias", { method: "POST", body: JSON.stringify(data) });

export const actualizarCategoria = (id: string, data: any) =>
  apiFetch(`/categorias/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const eliminarCategoria = (id: string) =>
  apiFetch(`/categorias/${id}`, { method: "DELETE" });

// ── Productos ──
export const getProductos = (idRestaurante: string) =>
  apiFetch(`/productos?id_restaurante=${idRestaurante}&disponible=true`);

export const getProductosTodos = (idRestaurante: string) =>
  apiFetch(`/productos?id_restaurante=${idRestaurante}`);

export const getProductoDetalle = (id: string) =>
  apiFetch(`/productos/${id}`);

export const crearProducto = (data: any) =>
  apiFetch("/productos", { method: "POST", body: JSON.stringify(data) });

export const actualizarProducto = (id: string, data: any) =>
  apiFetch(`/productos/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const eliminarProducto = (id: string) =>
  apiFetch(`/productos/${id}`, { method: "DELETE" });

// ── Mesas ──
export const getMesas = (idRestaurante: string) =>
  apiFetch(`/mesas?id_restaurante=${idRestaurante}`);

export const getMesaPorSlug = (slug: string) =>
  apiFetch(`/mesas/slug/${slug}`);

export const crearMesa = (data: any) =>
  apiFetch("/mesas", { method: "POST", body: JSON.stringify(data) });

// ── Pedidos ──
export const getPedidos = (params: { id_restaurante?: string; estado?: string; estado_pago?: string }) => {
  const query = new URLSearchParams();
  if (params.id_restaurante) query.set("id_restaurante", params.id_restaurante);
  if (params.estado) query.set("estado", params.estado);
  if (params.estado_pago) query.set("estado_pago", params.estado_pago);
  return apiFetch(`/pedidos?${query.toString()}`);
};

export const getPedido = (id: string) =>
  apiFetch(`/pedidos/${id}`);

export const crearPedido = (data: {
  id_restaurante: string;
  id_mesa: string;
  notas?: string;
  items: { id_producto: string; cantidad: number; notas?: string; agregados?: { id_agregado: string }[] }[];
}) =>
  apiFetch("/pedidos", { method: "POST", body: JSON.stringify(data) });

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

export const actualizarEstadoDetalleBatch = (ids: string[], estado: string) =>
  apiFetch(`/pedidos/detalle/batch/estado`, {
    method: "PATCH",
    body: JSON.stringify({ ids, estado }),
  });

export const registrarPago = (id: string, metodo_pago: string, comprobante_url?: string, efectivo_recibido?: number, detalle_ids?: string[], monto?: number) =>
  apiFetch(`/pedidos/${id}/pago`, {
    method: "PATCH",
    body: JSON.stringify({ metodo_pago, comprobante_url, efectivo_recibido, detalle_ids, monto }),
  });

// ── Usuarios ──
export const getUsuarios = (idRestaurante: string) =>
  apiFetch(`/usuarios?id_restaurante=${idRestaurante}`);

export const crearUsuario = (data: { id_restaurante: string; nombre: string; email?: string; rol: string }) =>
  apiFetch("/usuarios", { method: "POST", body: JSON.stringify(data) });

export const actualizarUsuario = (id: string, data: any) =>
  apiFetch(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const eliminarUsuario = (id: string) =>
  apiFetch(`/usuarios/${id}`, { method: "DELETE" });

// ── Web ──
export const getWebConfig = (id_restaurante: string) => apiFetch(`/web/config/${id_restaurante}`);
export const saveWebConfig = (data: any) => apiFetch("/web/config", { method: "POST", body: JSON.stringify(data) });
export const getWebCombos = (id_restaurante: string) => apiFetch(`/web/combos/${id_restaurante}`);
export const crearWebCombo = (data: any) => apiFetch("/web/combos", { method: "POST", body: JSON.stringify(data) });
export const actualizarWebCombo = (id: string, data: any) => apiFetch(`/web/combos/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const eliminarWebCombo = (id: string) => apiFetch(`/web/combos/${id}`, { method: "DELETE" });
export const getWebOfertas = (id_restaurante: string) => apiFetch(`/web/ofertas/${id_restaurante}`);
export const crearWebOferta = (data: any) => apiFetch("/web/ofertas", { method: "POST", body: JSON.stringify(data) });
export const actualizarWebOferta = (id: string, data: any) => apiFetch(`/web/ofertas/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const eliminarWebOferta = (id: string) => apiFetch(`/web/ofertas/${id}`, { method: "DELETE" });

// ── Pagos (Mercado Pago) ──

export interface DatosRestauranteRegistro {
  nombre: string;
  slug: string;
  propietario_nombre: string;
  propietario_email: string;
  propietario_password: string;
  color_primario?: string;
  color_secundario?: string;
  logo_url?: string;
  hero_banner_url?: string;
  latitud?: number;
  longitud?: number;
  radio_permitido_metros?: number;
}

export interface PreferenciaResponse {
  init_point: string;
  sandbox_init_point: string;
  preference_id: string;
}

export interface EstadoPagos {
  restaurante: string;
  fecha_inicio: string;
  meses_requeridos: string[];
  meses_pagados: string[];
  meses_pendientes: string[];
  deuda_total: number;
  precio_mensual: number;
  al_dia: boolean;
  mes_actual: string;
}

export interface PagoMensualidad {
  id: string;
  id_restaurante: string;
  mes_anio: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'fallido';
  preference_id?: string;
  payment_id?: string;
  pagado_en?: string;
  created_at: string;
}

/** Crear preferencia de pago para registro de nuevo restaurante */
export const crearPreferenciaPagoRegistro = (datosRestaurante: DatosRestauranteRegistro): Promise<PreferenciaResponse> =>
  apiFetch("/pagos/crear-preferencia", {
    method: "POST",
    body: JSON.stringify({ es_registro: true, datos_restaurante: datosRestaurante }),
  });

/** Crear preferencia de pago para mensualidades pendientes */
export const crearPreferenciaPagoMensual = (id_restaurante: string, meses_a_pagar: string[]): Promise<PreferenciaResponse> =>
  apiFetch("/pagos/crear-preferencia", {
    method: "POST",
    body: JSON.stringify({ id_restaurante, meses_a_pagar }),
  });

/** Obtener estado de pagos de un restaurante */
export const obtenerEstadoPagos = (id_restaurante: string): Promise<EstadoPagos> =>
  apiFetch(`/pagos/estado/${id_restaurante}`);

/** Obtener historial de pagos de un restaurante */
export const obtenerHistorialPagos = (id_restaurante: string): Promise<PagoMensualidad[]> =>
  apiFetch(`/pagos/historial/${id_restaurante}`);

/** Verificar si un restaurante tiene acceso (público, sin auth) */
export const verificarAccesoRestaurante = async (id_restaurante: string): Promise<{ tiene_acceso: boolean; motivo?: string }> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const res = await fetch(`${API_URL}/pagos/verificar-acceso/${id_restaurante}`);
  return res.json();
};

