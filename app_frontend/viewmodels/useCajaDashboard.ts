import { useState, useEffect, useCallback, useMemo } from "react";
import { getPedidos, registrarPago, actualizarEstadoPedido } from "@/lib/api";
import { useAuth, useNotificaciones } from "@/lib/store";
import { usePedidosRealtime } from "@/lib/realtime";

export function useCajaDashboard() {
  const { restaurante } = useAuth();
  const idRest = restaurante?.id;
  const { add: addNotif } = useNotificaciones();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pedidos" | "cuadre" | "monitor">("pedidos");
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "PAGADO">("PENDIENTE");
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [showComprobante, setShowComprobante] = useState<string | null>(null);

  const loadPedidos = useCallback(async () => {
    if (!idRest) return;
    try {
      if (loading) setLoading(true);
      const res = await getPedidos({ id_restaurante: idRest });
      
      const mapped = (res || []).map((p: any) => ({
        id: p.id,
        numeroPedido: p.numero_pedido || `#${p.id.slice(0, 4)}`,
        id_mesa: p.id_mesa,
        mesa: p.mesa?.numero || "S/M",
        total: p.total || 0,
        estado: p.estado,
        estadoPago: p.estado_pago,
        metodoPago: p.metodo_pago,
        comprobanteUrl: p.comprobante_url,
        hora: p.created_at,
        items: (p.detalle_pedido || []).map((d: any) => ({
          nombre: d.producto?.nombre || "Producto",
          cantidad: d.cantidad || 1,
          precio: (d.precio_unitario || 0) * (d.cantidad || 1),
          precioUnitario: d.precio_unitario || 0,
          estado: d.estado
        }))
      }));

      setPedidos(mapped);
    } catch (err) {
      console.error("Error loading caja data:", err);
    } finally {
      setLoading(false);
    }
  }, [idRest, loading]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  // Realtime update
  usePedidosRealtime(idRest || null, loadPedidos, loadPedidos);

  // Derived stats
  const pendientes = useMemo(() => pedidos.filter(p => p.estadoPago === "PENDIENTE"), [pedidos]);
  const pagados = useMemo(() => pedidos.filter(p => p.estadoPago === "PAGADO"), [pedidos]);
  const totalDia = useMemo(() => pagados.reduce((acc, p) => acc + p.total, 0), [pagados]);

  const pedidosFiltrados = useMemo(() => {
    if (filtro === "TODOS") return pedidos;
    return pedidos.filter(p => p.estadoPago === filtro);
  }, [pedidos, filtro]);

  const pedidoSeleccionado = useMemo(() => {
    return pedidos.find(p => p.id === selectedPedidoId) || null;
  }, [pedidos, selectedPedidoId]);

  // Cuadre de caja logic
  const cuadre = useMemo(() => {
    const porMetodo: Record<string, { total: number, cantidad: number }> = {};
    pagados.forEach(p => {
      const m = p.metodoPago || "OTROS";
      if (!porMetodo[m]) porMetodo[m] = { total: 0, cantidad: 0 };
      porMetodo[m].total += p.total;
      porMetodo[m].cantidad += 1;
    });

    return {
      totalVentas: totalDia,
      cantidadPedidos: pagados.length,
      ticketPromedio: pagados.length > 0 ? totalDia / pagados.length : 0,
      cantidadPendientes: pendientes.length,
      pendientesCobro: pendientes.reduce((acc, p) => acc + p.total, 0),
      porMetodo
    };
  }, [pagados, pendientes, totalDia]);

  // Monitor data: agrupación por mesa
  const monitorData = useMemo(() => {
    const mesasMap: Record<string, any> = {};
    pedidos.filter(p => p.estado !== "CANCELADO" && p.estado !== "ENTREGADO").forEach(p => {
      if (!mesasMap[p.mesa]) {
        mesasMap[p.mesa] = {
          mesa: p.mesa,
          platosTotal: 0,
          platosPendientes: 0,
          platosPreparando: 0,
          platosListos: 0,
          platosEntregados: 0
        };
      }
      p.items.forEach((it: any) => {
        mesasMap[p.mesa].platosTotal += 1;
        if (it.estado === "PENDIENTE") mesasMap[p.mesa].platosPendientes += 1;
        else if (it.estado === "EN_PREPARACION") mesasMap[p.mesa].platosPreparando += 1;
        else if (it.estado === "LISTO") mesasMap[p.mesa].platosListos += 1;
        else if (it.estado === "ENTREGADO") mesasMap[p.mesa].platosEntregados += 1;
      });
    });
    return Object.values(mesasMap);
  }, [pedidos]);

  const confirmarPago = async (pedidoId: string, metodo: string) => {
    setProcesando(true);
    try {
      await registrarPago(pedidoId, metodo);
      addNotif({ tipo: "success", titulo: "Pago exitoso", mensaje: `Pedido marcado como pagado via ${metodo}` });
      await loadPedidos();
    } catch (err: any) {
      addNotif({ tipo: "error", titulo: "Error", mensaje: err.message || "No se pudo registrar el pago" });
    } finally {
      setProcesando(false);
    }
  };

  const marcarPedidoListo = async (pedidoId: string) => {
    try {
      await actualizarEstadoPedido(pedidoId, "ENTREGADO");
      addNotif({ tipo: "success", titulo: "Mesero notificado", mensaje: "El pedido ha sido marcado como entregado." });
      await loadPedidos();
    } catch (err: any) {
      addNotif({ tipo: "error", titulo: "Error", mensaje: "No se pudo actualizar el estado." });
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
    pedidosFiltrados,
    selectedPedido: selectedPedidoId,
    setSelectedPedido: setSelectedPedidoId,
    pedidoSeleccionado,
    procesando,
    confirmarPago,
    marcarPedidoListo,
    showComprobante,
    setShowComprobante,
    cuadre,
    monitorData
  };
}
