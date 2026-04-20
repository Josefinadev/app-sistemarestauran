import { useState, useEffect, useCallback } from "react";
import { formatPrecio } from "@/lib/utils";
import { getPedidos, registrarPago, actualizarEstadoPedido } from "@/lib/api";
import { agruparDetalles, getDetalleCantidad, type RawDetallePedido } from "@/lib/pedidoGrouping";
import { usePedidosRealtime, useDetallesRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import type { PedidoCaja } from "@/models/caja";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

export interface MonitorItem {
  mesa: number;
  estadoPedido: string;
  platosTotal: number;
  platosPendientes: number;
  platosPreparando: number;
  platosListos: number;
  platosEntregados: number;
}

interface RawPedidoCaja {
  id: string;
  numero_pedido: number;
  total: number | string;
  estado: string;
  estado_pago: "PENDIENTE" | "PAGADO" | "ANULADO";
  metodo_pago: string | null;
  created_at: string;
  comprobante_url: string | null;
  mesa?: {
    numero?: number | null;
  } | null;
  detalle_pedido?: RawDetallePedido[];
}

export function useCajaDashboard() {
  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [rawPedidos, setRawPedidos] = useState<RawPedidoCaja[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "PAGADO">("TODOS");
  const [activeTab, setActiveTab] = useState<"pedidos" | "cuadre" | "monitor">("pedidos");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [showComprobante, setShowComprobante] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();

  const loadPedidos = useCallback(async () => {
    try {
      const data = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const rawData = (data || []) as RawPedidoCaja[];
      setRawPedidos(rawData);
      const mapped: PedidoCaja[] = rawData.map((p) => {
        const items = agruparDetalles((p.detalle_pedido || []) as RawDetallePedido[], { includeEstado: false }).map((d) => ({
          nombre: d.nombre,
          cantidad: d.cantidad,
          precio: d.precioTotal,
          precioUnitario: d.precioUnitario,
          estado: d.estados.length === 1 ? d.estado : "MIXTO",
        }));

        return {
          id: p.id,
          numeroPedido: `PED-${String(p.numero_pedido).padStart(3, "0")}`,
          mesa: p.mesa?.numero || 0,
          items,
          total: Number(p.total),
          estadoPago: p.estado_pago,
          metodoPago: p.metodo_pago,
          hora: p.created_at,
          comprobanteUrl: p.comprobante_url,
          estadoPedido: p.estado,
        };
      });
      setPedidos(mapped);
    } catch (err) {
      console.error("Error loading caja data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  const handleRealtimeChange = useCallback(() => { loadPedidos(); }, [loadPedidos]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  const confirmarPago = async (id: string, metodo: string) => {
    setProcesando(true);
    try {
      await registrarPago(id, metodo);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, estadoPago: "PAGADO" as const, metodoPago: metodo } : p
        )
      );
      const ped = pedidos.find((p) => p.id === id);

      addNotif({
        tipo: "success",
        titulo: `Pago registrado - ${ped?.numeroPedido}`,
        mensaje: `Mesa ${ped?.mesa} pago ${formatPrecio(ped?.total || 0)} via ${metodo}.`,
      });
      setSelectedPedido(null);
    } catch (err) {
      console.error("Error processing payment:", err);
    } finally {
      setProcesando(false);
    }
  };

  const marcarPedidoListo = async (id: string) => {
    setProcesando(true);
    try {
      await actualizarEstadoPedido(id, "LISTO");
      const ped = pedidos.find((p) => p.id === id);

      addNotif({
        tipo: "info",
        titulo: `Pedido listo - Mesa ${ped?.mesa}`,
        mensaje: `${ped?.numeroPedido} esta listo para recoger y llevar al cliente.`,
      });
      loadPedidos();
    } catch (err) {
      console.error("Error marking order ready:", err);
    } finally {
      setProcesando(false);
    }
  };

  const pendientes = pedidos.filter((p) => p.estadoPago === "PENDIENTE");
  const pagados = pedidos.filter((p) => p.estadoPago === "PAGADO");
  const totalDia = pagados.reduce((s, p) => s + p.total, 0);
  const pedidosFiltrados = pedidos.filter(
    (p) => filtro === "TODOS" || p.estadoPago === filtro
  );
  const pedidoSeleccionado = pedidos.find((p) => p.id === selectedPedido);

  const cuadre = {
    totalVentas: totalDia,
    cantidadPedidos: pagados.length,
    porMetodo: pagados.reduce<Record<string, { cantidad: number; total: number }>>((acc, p) => {
      const m = p.metodoPago || "SIN METODO";
      if (!acc[m]) acc[m] = { cantidad: 0, total: 0 };
      acc[m].cantidad++;
      acc[m].total += p.total;
      return acc;
    }, {}),
    ticketPromedio: pagados.length > 0 ? totalDia / pagados.length : 0,
    pendientesCobro: pendientes.reduce((s, p) => s + p.total, 0),
    cantidadPendientes: pendientes.length,
  };

  const monitorData: MonitorItem[] = (() => {
    const mesaMap: Record<number, MonitorItem> = {};
    for (const p of rawPedidos) {
      if (p.estado === "CANCELADO") continue;
      const mesaNum = p.mesa?.numero || 0;
      if (!mesaMap[mesaNum]) {
        mesaMap[mesaNum] = {
          mesa: mesaNum, estadoPedido: p.estado, platosTotal: 0,
          platosPendientes: 0, platosPreparando: 0, platosListos: 0, platosEntregados: 0,
        };
      }
      for (const det of p.detalle_pedido || []) {
        const cantidad = getDetalleCantidad(det);
        mesaMap[mesaNum].platosTotal += cantidad;
        if (det.estado === "PENDIENTE") mesaMap[mesaNum].platosPendientes += cantidad;
        if (det.estado === "EN_PREPARACION") mesaMap[mesaNum].platosPreparando += cantidad;
        if (det.estado === "LISTO") mesaMap[mesaNum].platosListos += cantidad;
        if (det.estado === "ENTREGADO") mesaMap[mesaNum].platosEntregados += cantidad;
      }
    }
    return Object.values(mesaMap).sort((a, b) => a.mesa - b.mesa);
  })();

  return {
    pedidos,
    pedidosFiltrados,
    pedidoSeleccionado,
    selectedPedido,
    filtro,
    loading,
    procesando,
    showComprobante,
    activeTab,
    cuadre,
    monitorData,
    pendientes,
    pagados,
    totalDia,
    setFiltro,
    setSelectedPedido,
    setShowComprobante,
    setActiveTab,
    confirmarPago,
    marcarPedidoListo,
  };
}
