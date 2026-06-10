interface RawAgregado {
  agregado?: {
    nombre?: string | null;
  } | null;
}

interface RawProducto {
  nombre?: string | null;
  es_bebida?: boolean | null;
  requiere_preparacion?: boolean | null;
  imagen_url?: string | null;
}

export interface RawDetallePedido {
  id: string;
  cantidad?: number | null;
  estado?: string | null;
  notas?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  precio_unitario?: number | null;
  producto?: RawProducto | null;
  detalle_pedido_agregado?: RawAgregado[] | null;
}

export interface DetalleAgrupado {
  key: string;
  nombre: string;
  cantidad: number;
  estado: string;
  estados: string[];
  notas: string;
  agregados: string[];
  esBebida: boolean;
  requierePreparacion: boolean;
  hora: string;
  detalleIds: string[];
  precioUnitario: number;
  precioTotal: number;
  imagenUrl: string | null;
}

export function getDetalleCantidad(detalle: RawDetallePedido) {
  return Math.max(1, Number(detalle.cantidad) || 1);
}

function normalizarAgregados(detalle: RawDetallePedido) {
  return (detalle.detalle_pedido_agregado || [])
    .map((item) => item.agregado?.nombre || "Extra")
    .sort((a, b) => a.localeCompare(b));
}

function buildGroupKey(detalle: RawDetallePedido, includeEstado: boolean) {
  const nombre = detalle.producto?.nombre || "Plato";
  const notas = detalle.notas || "";
  const agregados = normalizarAgregados(detalle).join("|");
  const estado = includeEstado ? detalle.estado || "" : "";
  return [nombre, notas, agregados, estado].join("::");
}

export function agruparDetalles(
  detalles: RawDetallePedido[],
  options?: { includeEstado?: boolean }
) {
  const includeEstado = options?.includeEstado ?? true;
  const grouped = new Map<string, DetalleAgrupado>();

  for (const detalle of detalles) {
    const key = buildGroupKey(detalle, includeEstado);
    const current = grouped.get(key);
    const cantidad = getDetalleCantidad(detalle);
    const agregados = normalizarAgregados(detalle);
    const estado = detalle.estado || "PENDIENTE";
    const precioUnitario = Number(detalle.precio_unitario) || 0;

    if (!current) {
      grouped.set(key, {
        key,
        nombre: detalle.producto?.nombre || "Plato",
        cantidad,
        estado,
        estados: [estado],
        notas: detalle.notas || "",
        agregados,
        esBebida: Boolean(detalle.producto?.es_bebida),
        requierePreparacion: detalle.producto?.requiere_preparacion !== false,
        hora: detalle.created_at || "",
        detalleIds: [detalle.id],
        precioUnitario,
        precioTotal: precioUnitario * cantidad,
        imagenUrl: detalle.producto?.imagen_url || null,
      });
      continue;
    }

    current.cantidad += cantidad;
    current.detalleIds.push(detalle.id);
    current.precioTotal += precioUnitario * cantidad;
    if (!current.estados.includes(estado)) {
      current.estados.push(estado);
    }
    if (detalle.created_at && (!current.hora || detalle.created_at < current.hora)) {
      current.hora = detalle.created_at;
    }
  }

  return Array.from(grouped.values());
}
