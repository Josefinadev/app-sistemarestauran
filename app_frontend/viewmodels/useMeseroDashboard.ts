/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useMeseroDashboard
   Agrupa por PEDIDO con agregación de duplicados + auto-colapso.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { useDetallesRealtime, usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import { playPlatoListoSound } from "@/lib/notification-sound";
import type { ItemServir, AggregatedItem, MesaEstado, PedidoGroup } from "@/models/mesero";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

// Función para agregar items duplicados
function aggregateItems(rawItems: ItemServir[]): AggregatedItem[] {
  const map = new Map<string, AggregatedItem>();
  for (const item of rawItems) {
    const key = `${item.nombre}|${item.notas || ""}|${item.agregados.join(",")}`;
    const existing = map.get(key);
    if (existing) {
      existing.cantidad++;
      existing.itemIds.push(item.id);
      if (item.estado === "LISTO") existing.listosIds.push(item.id);
      if (existing.estado !== item.estado) existing.estado = "MIXED";
    } else {
      map.set(key, {
        key,
        nombre: item.nombre,
        cantidad: 1,
        itemIds: [item.id],
        mesa: item.mesa,
        hora: item.hora,
        estado: item.estado,
        esBebida: item.esBebida,
        notas: item.notas,
        imagen_url: item.imagen_url,
        agregados: item.agregados,
        listosIds: item.estado === "LISTO" ? [item.id] : [],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (a.listosIds.length > 0 ? -1 : 1) - (b.listosIds.length > 0 ? -1 : 1)
  );
}

export function useMeseroDashboard() {
  const [items, setItems] = useState<ItemServir[]>([]);
  const [mesasEstado, setMesasEstado] = useState<MesaEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "platos" | "bebidas">("todos");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());
  const { add: addNotif } = useNotificaciones();
  const prevListosRef = useRef<Set<string>>(new Set());

  const togglePedido = (pedidoId: string) => {
    setExpandedPedidos((prev) => {
      const next = new Set(prev);
      if (next.has(pedidoId)) next.delete(pedidoId);
      else next.add(pedidoId);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    try {
      const data = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const newItems: ItemServir[] = [];
      const mesaMap: Record<number, MesaEstado> = {};

      for (const pedido of data || []) {
        const mesaNum = pedido.mesa?.numero || 0;
        if (!mesaMap[mesaNum]) {
          mesaMap[mesaNum] = { numero: mesaNum, pedidoActivo: false, platosListos: 0, totalPlatos: 0 };
        }

        for (const det of pedido.detalle_pedido || []) {
          mesaMap[mesaNum].totalPlatos++;
          if (det.estado === "LISTO" || det.estado === "ENTREGADO") {
            mesaMap[mesaNum].pedidoActivo = true;
            if (det.estado === "LISTO") mesaMap[mesaNum].platosListos++;

            const agregados = (det.detalle_pedido_agregado || [])
              .map((a: any) => a.agregado?.nombre)
              .filter(Boolean);

            newItems.push({
              id: det.id,
              nombre: det.producto?.nombre || "Plato",
              mesa: mesaNum,
              hora: det.created_at || pedido.created_at,
              estado: det.estado,
              esBebida: det.producto?.es_bebida || false,
              pedidoId: pedido.id,
              numeroPedido: pedido.numero_pedido || 0,
              horaPedido: pedido.created_at,
              notas: det.notas || null,
              imagen_url: det.producto?.imagen_url || null,
              agregados,
            });
          }
        }
      }

      // 🔔 Detectar nuevos LISTO
      const currentListos = new Set(newItems.filter(i => i.estado === "LISTO").map(i => i.id));
      let hasNewListo = false;
      for (const id of currentListos) {
        if (!prevListosRef.current.has(id)) {
          hasNewListo = true;
          const item = newItems.find(i => i.id === id);
          if (item) {
            addNotif({
              tipo: "info",
              titulo: `🍽️ ¡Plato listo! — Mesa ${item.mesa}`,
              mensaje: `${item.nombre} está listo para servir.`,
            });
          }
        }
      }
      if (hasNewListo) playPlatoListoSound();
      prevListosRef.current = currentListos;

      setItems(newItems);
      setMesasEstado(Object.values(mesaMap).filter(m => m.totalPlatos > 0).sort((a, b) => a.numero - b.numero));
    } catch (err) {
      console.error("Error loading mesero data:", err);
    } finally {
      setLoading(false);
    }
  }, [addNotif]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRealtimeChange = useCallback(() => { loadData(); }, [loadData]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  // Marcar uno o varios items (aggregated)
  const marcarEntregadoIds = async (ids: string[], groupKey?: string) => {
    setUpdating(groupKey || ids[0]);
    try {
      for (const id of ids) {
        await actualizarEstadoDetalle(id, "ENTREGADO");
      }
      setItems((prev) =>
        prev.map((i) => ids.includes(i.id) ? { ...i, estado: "ENTREGADO" as const } : i)
      );
    } catch (err) {
      console.error("Error updating item:", err);
    } finally {
      setUpdating(null);
    }
  };

  // Marcar TODOS + auto-colapsar
  const marcarTodosPedido = async (pedidoId: string, pedidoItems: ItemServir[]) => {
    const listos = pedidoItems.filter((i) => i.estado === "LISTO");
    if (listos.length === 0) return;
    setUpdating("pedido-all");
    try {
      for (const item of listos) {
        await actualizarEstadoDetalle(item.id, "ENTREGADO");
      }
      setItems((prev) =>
        prev.map((i) =>
          listos.some((l) => l.id === i.id) ? { ...i, estado: "ENTREGADO" as const } : i
        )
      );
      // Auto-colapsar
      setExpandedPedidos((prev) => {
        const next = new Set(prev);
        next.delete(pedidoId);
        return next;
      });
    } catch (err) {
      console.error("Error updating all:", err);
    } finally {
      setUpdating(null);
    }
  };

  // Filtrar
  const itemsFiltrados = items.filter((i) => {
    if (filtro === "platos") return !i.esBebida;
    if (filtro === "bebidas") return i.esBebida;
    return true;
  });

  // Agrupar por PEDIDO con agregación
  const pedidoGroups: PedidoGroup[] = useMemo(() => {
    const map = new Map<string, ItemServir[]>();
    for (const item of itemsFiltrados) {
      const arr = map.get(item.pedidoId) || [];
      arr.push(item);
      map.set(item.pedidoId, arr);
    }
    return Array.from(map.entries())
      .map(([pedidoId, items]) => ({
        pedidoId,
        mesa: items[0].mesa,
        numeroPedido: items[0].numeroPedido,
        horaPedido: items[0].horaPedido,
        items,
        aggregated: aggregateItems(items),
        listosCount: items.filter((i) => i.estado === "LISTO").length,
        entregadosCount: items.filter((i) => i.estado === "ENTREGADO").length,
      }))
      .sort((a, b) => b.listosCount - a.listosCount);
  }, [itemsFiltrados]);

  const listosCount = items.filter((i) => i.estado === "LISTO").length;
  const bebidasCount = items.filter((i) => i.esBebida && i.estado === "LISTO").length;
  const mesasActivasCount = mesasEstado.filter((m) => m.pedidoActivo).length;

  return {
    items, itemsFiltrados, pedidoGroups, mesasEstado,
    loading, filtro, updating, expandedPedidos,
    listosCount, bebidasCount, mesasActivasCount,
    setFiltro, marcarEntregadoIds, marcarTodosPedido, togglePedido,
  };
}
