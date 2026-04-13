/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useMeseroDashboard
   Lógica del mesero con notificación al recibir platos listos.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from "react";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { useDetallesRealtime, usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import type { ItemServir, MesaEstado } from "@/models/mesero";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

export function useMeseroDashboard() {
  const [items, setItems] = useState<ItemServir[]>([]);
  const [mesasEstado, setMesasEstado] = useState<MesaEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "platos" | "bebidas">("todos");
  const [updating, setUpdating] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();
  const prevListosRef = useRef<Set<string>>(new Set());

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

            if (det.estado === "LISTO") {
              mesaMap[mesaNum].platosListos++;
            }

            newItems.push({
              id: det.id,
              nombre: det.producto?.nombre || "Plato",
              mesa: mesaNum,
              hora: det.created_at || pedido.created_at,
              estado: det.estado,
              esBebida: det.producto?.es_bebida || false,
              pedidoId: pedido.id,
            });
          }
        }
      }

      // 🔔 Detectar platos que pasaron a LISTO y notificar al mesero
      const currentListos = new Set(newItems.filter(i => i.estado === "LISTO").map(i => i.id));
      for (const id of currentListos) {
        if (!prevListosRef.current.has(id)) {
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

  const marcarEntregado = async (item: ItemServir) => {
    setUpdating(item.id);
    try {
      await actualizarEstadoDetalle(item.id, "ENTREGADO");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, estado: "ENTREGADO" as const } : i))
      );
      // No notificamos aquí — cocina recibe la notificación vía realtime
    } catch (err) {
      console.error("Error updating item:", err);
    } finally {
      setUpdating(null);
    }
  };

  const itemsFiltrados = items.filter((i) => {
    if (filtro === "platos") return !i.esBebida;
    if (filtro === "bebidas") return i.esBebida;
    return true;
  }).sort((a, b) => (a.estado === "LISTO" ? -1 : 1) - (b.estado === "LISTO" ? -1 : 1));

  const listosCount = items.filter((i) => i.estado === "LISTO").length;
  const bebidasCount = items.filter((i) => i.esBebida && i.estado === "LISTO").length;
  const mesasActivasCount = mesasEstado.filter((m) => m.pedidoActivo).length;

  return {
    items, itemsFiltrados, mesasEstado,
    loading, filtro, updating,
    listosCount, bebidasCount, mesasActivasCount,
    setFiltro, marcarEntregado,
  };
}
