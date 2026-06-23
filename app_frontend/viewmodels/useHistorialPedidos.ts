/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useHistorialPedidos
   Historial de pedidos del cliente autenticado.
   Si el usuario no está logueado, retorna isGuest: true.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import { getMisPedidos } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { formatPrecio } from "@/lib/utils";

export interface PedidoHistorial {
  id: string;
  numero_pedido: number;
  numeroPedidoFormateado: string;
  estado: string;
  estado_pago: string;
  metodo_pago: string | null;
  total: number;
  totalFormateado: string;
  notas: string | null;
  created_at: string;
  fechaFormateada: string;
  horaFormateada: string;
  pagado_en: string | null;
  mesa: { id: string; numero: number } | null;
  items: PedidoHistorialItem[];
  esFinalizado: boolean;
}

export interface PedidoHistorialItem {
  id: string;
  precio_unitario: number;
  notas: string | null;
  estado: string;
  producto: {
    id: string;
    nombre: string;
    imagen_url: string | null;
    precio: number;
  } | null;
  agregados: { nombre: string; precio_momento: number }[];
}

function formatearFecha(isoStr: string) {
  const d = new Date(isoStr);
  return {
    fecha: d.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }),
    hora: d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapPedido(raw: any): PedidoHistorial {
  const { fecha, hora } = formatearFecha(raw.created_at);
  const items: PedidoHistorialItem[] = (raw.detalle_pedido || []).map((d: any) => ({
    id: d.id,
    precio_unitario: Number(d.precio_unitario),
    notas: d.notas,
    estado: d.estado,
    producto: d.producto || null,
    agregados: (d.detalle_pedido_agregado || []).map((a: any) => ({
      nombre: a.agregado?.nombre || "Agregado",
      precio_momento: Number(a.precio_momento),
    })),
  }));

  return {
    id: raw.id,
    numero_pedido: raw.numero_pedido,
    numeroPedidoFormateado: `PED-${String(raw.numero_pedido).padStart(3, "0")}`,
    estado: raw.estado,
    estado_pago: raw.estado_pago,
    metodo_pago: raw.metodo_pago,
    total: Number(raw.total),
    totalFormateado: formatPrecio(Number(raw.total)),
    notas: raw.notas,
    created_at: raw.created_at,
    fechaFormateada: fecha,
    horaFormateada: hora,
    pagado_en: raw.pagado_en,
    mesa: raw.mesa || null,
    items,
    esFinalizado: raw.estado === "ENTREGADO" || raw.estado === "CANCELADO",
  };
}

export function useHistorialPedidos() {
  const { usuario, restaurante } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoHistorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGuest = !usuario || usuario.rol !== "cliente";

  const fetch = useCallback(async () => {
    if (isGuest || !restaurante?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMisPedidos(restaurante.id);
      setPedidos((data || []).map(mapPedido));
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [isGuest, restaurante?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    pedidos,
    loading,
    error,
    isGuest,
    usuario,
    restaurante,
    refetch: fetch,
  };
}
