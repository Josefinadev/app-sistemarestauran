/* ═══════════════════════════════════════════════════════════
   API Client — Comunicación centralizada con el backend Express
   Todas las llamadas al backend pasan por aquí.
   ═══════════════════════════════════════════════════════════ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Error ${res.status}`);
  }

  // Handle 204 No Content (e.g., DELETE responses)
  if (res.status === 204) return null;

  const json = await res.json();
  return json.data ?? json;
}

// Upload de imágenes (multipart/form-data, no JSON)
export async function uploadImage(file: File, folder: string = "web"): Promise<string> {
  const formData = new FormData();
  formData.append("imagen", file);
  formData.append("folder", folder);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.url;
}

// ── Restaurante ──
export const getRestaurante = (slug: string) =>
  apiFetch(`/restaurante/${slug}`);

export const validarUbicacion = (slug: string, latitud: number, longitud: number) =>
  apiFetch(`/restaurante/${slug}/validar-ubicacion`, {
    method: "POST",
    body: JSON.stringify({ latitud, longitud }),
  });

// ── Categorías ──
export const getCategorias = (idRestaurante: string) =>
  apiFetch(`/categorias?id_restaurante=${idRestaurante}`);

export const crearCategoria = (data: any) =>
  apiFetch("/categorias", { method: "POST", body: JSON.stringify(data) });

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
  items: { id_producto: string; notas?: string; agregados?: { id_agregado: string }[] }[];
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

export const registrarPago = (id: string, metodo_pago: string, comprobante_url?: string) =>
  apiFetch(`/pedidos/${id}/pago`, {
    method: "PATCH",
    body: JSON.stringify({ metodo_pago, comprobante_url }),
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

// ── Web & Marketing ──
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
