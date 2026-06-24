import { useState, useEffect, useCallback, useMemo } from "react";
import { getPedidos, registrarPago, getUsuarios } from "@/lib/api";
import { useAuth, useNotificaciones } from "@/lib/store";
import { usePedidosRealtime } from "@/lib/realtime";

export interface PedidoItemCaja {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precioUnitario: number;
  estado: string;
  pagado?: boolean;
  imagenUrl?: string | null;
}

export interface PedidoPago {
  id: string;
  metodoPago: string;
  monto: number;
  efectivoRecibido?: number | null;
  comprobanteUrl?: string | null;
  detalleIds?: string[];
  createdAt: string;
}

export interface PedidoCaja {
  id: string;
  numeroPedido: string;
  mesa: number | string;
  total: number;
  estado: string;
  estadoPago: string;
  metodoPago: string | null;
  comprobanteUrl: string | null;
  montoPagado: number;
  montoRestante: number;
  pagos: PedidoPago[];
  hora: string;
  items: PedidoItemCaja[];
}

export interface MesaCaja {
  mesa: number | string;
  pedidos: PedidoCaja[];
  total: number;
  itemsCount: number;
  estadoPago: "PENDIENTE" | "PAGADO" | "MIXTO";
}

export function useCajaDashboard() {
  const { restaurante } = useAuth();
  const idRest = restaurante?.id;
  const { add: addNotif } = useNotificaciones();

  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pedidos" | "cuadre" | "monitor">("pedidos");
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "PAGADO">("PENDIENTE");
  const [selectedMesa, setSelectedMesa] = useState<string | number | null>(null);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [showComprobante, setShowComprobante] = useState<string | null>(null);
  const [noUsuariosAsignados, setNoUsuariosAsignados] = useState(false);

  useEffect(() => {
    const checkUsuarios = async () => {
      if (!idRest) return;
      try {
        const usuarios = await getUsuarios(idRest);
        const usuariosCaja = (usuarios || []).filter((u: any) => u.rol === "caja");
        setNoUsuariosAsignados(usuariosCaja.length === 0);
      } catch (err) {
        console.error("Error checking usuarios:", err);
      }
    };
    checkUsuarios();
  }, [idRest]);

  const loadPedidos = useCallback(async () => {
    if (!idRest) return;
    try {
      if (loading) setLoading(true);
      const res = await getPedidos({ id_restaurante: idRest });

      const mapped: PedidoCaja[] = (res || []).map((p: any) => {
        const pagosData: PedidoPago[] = (p.pedido_pago || []).map((pay: any) => ({
          id: pay.id,
          metodoPago: pay.metodo_pago,
          monto: Number(pay.monto || 0),
          efectivoRecibido: pay.efectivo_recibido !== null ? Number(pay.efectivo_recibido) : undefined,
          comprobanteUrl: pay.comprobante_url || null,
          detalleIds: pay.detalle_ids || [],
          createdAt: pay.created_at,
        }));
        const montoPagado = pagosData.reduce((sum: number, pay: { monto: number }) => sum + pay.monto, 0);
        const montoRestante = Math.max(0, Number(p.total || 0) - montoPagado);
        const metodoPago = pagosData.length === 1 ? pagosData[0].metodoPago : p.metodo_pago || null;
        const estadoPago = montoRestante <= 0
          ? 'PAGADO'
          : montoPagado > 0
          ? 'MIXTO'
          : p.estado_pago === 'PAGADO'
          ? 'PAGADO'
          : p.estado_pago === 'MIXTO'
          ? 'MIXTO'
          : 'PENDIENTE';

        return {
          id: p.id,
          numeroPedido: `PED-${String(p.numero_pedido).padStart(3, "0")}`,
          mesa: p.mesa?.numero || "S/M",
          total: p.total || 0,
          estado: p.estado,
          estadoPago,
          metodoPago,
          comprobanteUrl: p.comprobante_url,
          montoPagado,
          montoRestante,
          pagos: pagosData,
          hora: p.created_at,
          items: (p.detalle_pedido || []).map((d: any) => {
            const isPaidByDetalle = pagosData.some((pay: any) => Array.isArray(pay.detalleIds) && pay.detalleIds.includes(d.id));
            const allPaidPedido = montoRestante <= 0;
            const pagado = allPaidPedido || isPaidByDetalle;
            return {
              id: d.id,
              nombre: d.producto?.nombre || "Producto",
              cantidad: d.cantidad || 1,
              precio: (d.precio_unitario || 0) * (d.cantidad || 1),
              precioUnitario: d.precio_unitario || 0,
              estado: d.estado,
              pagado,
              imagenUrl: d.producto?.imagen_url || null,
            };
          }),
        };
      });

      setPedidos(mapped);
    } catch (err) {
      console.error("Error loading caja data:", err);
    } finally {
      setLoading(false);
    }
  }, [idRest]);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);
  usePedidosRealtime(idRest || null, loadPedidos, loadPedidos);

  // ── Agrupar por mesa ──
  const mesasAgrupadas = useMemo<MesaCaja[]>(() => {
    const map = new Map<string | number, MesaCaja>();
    for (const p of pedidos) {
      const key = p.mesa;
      if (!map.has(key)) {
        map.set(key, { mesa: key, pedidos: [], total: 0, itemsCount: 0, estadoPago: "PENDIENTE" });
      }
      const m = map.get(key)!;
      m.pedidos.push(p);
      m.total += p.total;
      m.itemsCount += p.items.reduce((s, i) => s + i.cantidad, 0);
    }
    // Determinar estado de pago de la mesa
    for (const m of map.values()) {
      const allPaid = m.pedidos.every((p) => p.estadoPago === "PAGADO");
      const allPending = m.pedidos.every((p) => p.estadoPago === "PENDIENTE");
      m.estadoPago = allPaid ? "PAGADO" : allPending ? "PENDIENTE" : "MIXTO";
    }
    return Array.from(map.values()).sort((a, b) => {
      // Pendientes primero
      if (a.estadoPago === "PENDIENTE" && b.estadoPago !== "PENDIENTE") return -1;
      if (a.estadoPago !== "PENDIENTE" && b.estadoPago === "PENDIENTE") return 1;
      return 0;
    });
  }, [pedidos]);

  const mesasFiltradas = useMemo(() => {
    if (filtro === "TODOS") return mesasAgrupadas;
    return mesasAgrupadas.filter((m) => m.estadoPago === filtro || (filtro === "PENDIENTE" && m.estadoPago === "MIXTO"));
  }, [mesasAgrupadas, filtro]);

  // Stats
  const pendientes = useMemo(
    () => pedidos.filter((p) => p.estadoPago === "PENDIENTE" || p.estadoPago === "MIXTO"),
    [pedidos]
  );
  const pagados = useMemo(() => pedidos.filter((p) => p.estadoPago === "PAGADO"), [pedidos]);
  const totalDia = useMemo(
    () => pedidos.flatMap((p) => p.pagos || []).reduce((acc, pago) => acc + pago.monto, 0),
    [pedidos]
  );

  const pedidoSeleccionado = useMemo(() => {
    return pedidos.find((p) => p.id === selectedPedidoId) || null;
  }, [pedidos, selectedPedidoId]);

  const mesaSeleccionada = useMemo(() => {
    return mesasAgrupadas.find((m) => m.mesa === selectedMesa) || null;
  }, [mesasAgrupadas, selectedMesa]);

  // Cuadre
  const cuadre = useMemo(() => {
    const porMetodo: Record<string, { total: number; cantidad: number }> = {};
    const allPagos = pedidos.flatMap((p) => p.pagos || []);
    allPagos.forEach((pago) => {
      const m = pago.metodoPago || "OTROS";
      if (!porMetodo[m]) porMetodo[m] = { total: 0, cantidad: 0 };
      porMetodo[m].total += pago.monto;
      porMetodo[m].cantidad += 1;
    });
    const pedidosConPago = pedidos.filter((p) => Array.isArray(p.pagos) && p.pagos.length > 0);
    const totalVentas = allPagos.reduce((sum, pago) => sum + pago.monto, 0);

    return {
      totalVentas,
      cantidadPedidos: pedidosConPago.length,
      ticketPromedio: pedidosConPago.length > 0 ? totalVentas / pedidosConPago.length : 0,
      cantidadPendientes: pendientes.length,
      pendientesCobro: pendientes.reduce((acc, p) => acc + p.montoRestante, 0),
      porMetodo,
    };
  }, [pedidos, pendientes]);

  // Monitor data
  interface MonitorMesa {
    mesa: string | number;
    platosTotal: number;
    platosPendientes: number;
    platosPreparando: number;
    platosListos: number;
    platosEntregados: number;
  }

  const monitorData = useMemo<MonitorMesa[]>(() => {
    const mesasMap: Record<string, MonitorMesa> = {};
    pedidos.filter((p) => p.estado !== "CANCELADO" && p.estadoPago !== "PAGADO").forEach((p) => {
      if (!mesasMap[p.mesa]) {
        mesasMap[p.mesa] = { mesa: p.mesa, platosTotal: 0, platosPendientes: 0, platosPreparando: 0, platosListos: 0, platosEntregados: 0 };
      }
      p.items.forEach((it) => {
        mesasMap[p.mesa].platosTotal += 1;
        if (it.estado === "PENDIENTE") mesasMap[p.mesa].platosPendientes += 1;
        else if (it.estado === "EN_PREPARACION") mesasMap[p.mesa].platosPreparando += 1;
        else if (it.estado === "LISTO") mesasMap[p.mesa].platosListos += 1;
        else if (it.estado === "ENTREGADO") mesasMap[p.mesa].platosEntregados += 1;
      });
    });
    return Object.values(mesasMap);
  }, [pedidos]);

  const confirmarPago = async (pedidoId: string, metodo: string, efectivo_recibido?: number, detalle_ids?: string[], monto?: number) => {
    setProcesando(true);
    try {
      await registrarPago(pedidoId, metodo, undefined, efectivo_recibido, detalle_ids?.length ? detalle_ids : undefined, monto);
      addNotif({ tipo: "success", titulo: "Pago registrado", mensaje: `Pedido pagado via ${metodo}` });
      await loadPedidos();
    } catch (err: any) {
      addNotif({ tipo: "error", titulo: "Error", mensaje: err.message || "No se pudo registrar el pago" });
    } finally {
      setProcesando(false);
    }
  };

  const pagarTodaLaMesa = async (mesa: MesaCaja, metodo: string) => {
    setProcesando(true);
    try {
      const pendientesPago = mesa.pedidos.filter((p) => p.estadoPago !== "PAGADO");
      for (const p of pendientesPago) {
        await registrarPago(p.id, metodo);
      }
      addNotif({ tipo: "success", titulo: "Mesa pagada", mensaje: `Mesa ${mesa.mesa} - Todos los pedidos pagados via ${metodo}` });
      setSelectedMesa(null);
      await loadPedidos();
    } catch (err: any) {
      addNotif({ tipo: "error", titulo: "Error", mensaje: err.message || "No se pudo registrar el pago" });
    } finally {
      setProcesando(false);
    }
  };

  return {
    loading,
    pedidos,
    pendientes,
    pagados,
    totalDia,
    activeTab,
    setActiveTab,
    filtro,
    setFiltro,
    mesasAgrupadas,
    mesasFiltradas,
    selectedMesa,
    setSelectedMesa,
    mesaSeleccionada,
    selectedPedido: selectedPedidoId,
    setSelectedPedido: setSelectedPedidoId,
    pedidoSeleccionado,
    procesando,
    confirmarPago,
    pagarTodaLaMesa,
    showComprobante,
    setShowComprobante,
    cuadre,
    monitorData,
    noUsuariosAsignados,
  };
}
