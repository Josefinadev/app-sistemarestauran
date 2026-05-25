
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { agruparDetalles, getDetalleCantidad, type RawDetallePedido } from "@/lib/pedidoGrouping";
import { useDetallesRealtime, usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import type { ItemServir, MesaEstado, PedidoMesero } from "@/models/mesero";


import { useAuth } from "@/lib/store";

export function useMeseroDashboard() {
  const { restaurante } = useAuth();
  const idRestaurante = restaurante?.id;

  const [mesas, setMesas] = useState<MesaEstado[]>([]);
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
    if (!idRestaurante) return;
    try {
      const data = await getPedidos({ id_restaurante: idRestaurante });
      const mesaMap = new Map<number, MesaEstado>();
      const allItems: ItemServir[] = [];

      for (const pedido of data || []) {
        const mesaNum = pedido.mesa?.numero || 0;

        if (!mesaMap.has(mesaNum)) {
          mesaMap.set(mesaNum, {
            numero: mesaNum,
            pedidoActivo: false,
            platosListos: 0,
            bebidasListas: 0,
            totalPlatos: 0,
            totalBebidas: 0,
            pedidos: [],
          });

        }

        const mesa = mesaMap.get(mesaNum)!;
        const detallesServibles: RawDetallePedido[] = [];

        for (const det of pedido.detalle_pedido || []) {

          const cantidad = getDetalleCantidad(det);
          const esBebida = Boolean(det.producto?.es_bebida);

          if (esBebida) mesa.totalBebidas += cantidad;
          else mesa.totalPlatos += cantidad;

          if (det.estado === "LISTO" || det.estado === "ENTREGADO") {
            mesa.pedidoActivo = true;

            if (det.estado === "LISTO") {
              if (esBebida) mesa.bebidasListas += cantidad;
              else mesa.platosListos += cantidad;
            }

            detallesServibles.push(det);
          }
        }

        const itemsPedido = agruparDetalles(detallesServibles, { includeEstado: true }).map<ItemServir>((grupo) => ({
          id: `${pedido.id}::${grupo.key}`,
          nombre: grupo.nombre,
          cantidad: grupo.cantidad,
          mesa: mesaNum,
          hora: grupo.hora || pedido.created_at,
          estado: grupo.estado as ItemServir["estado"],
          esBebida: grupo.esBebida,
          pedidoId: pedido.id,
          detalleIds: grupo.detalleIds,
        }));

        if (itemsPedido.length > 0) {
          const pedidoMesa: PedidoMesero = {
            id: pedido.id,
            numeroPedido: `PED-${String(pedido.numero_pedido).padStart(3, "0")}`,
            hora: pedido.created_at,
            items: itemsPedido.sort((a, b) => b.hora.localeCompare(a.hora)),
          };
          mesa.pedidos.push(pedidoMesa);
          allItems.push(...itemsPedido);
        }
      }

      const currentListos = new Set(allItems.filter((i) => i.estado === "LISTO").flatMap((i) => i.detalleIds));
      let hasNewListo = false;
      for (const id of currentListos) {
        if (!prevListosRef.current.has(id)) {
          hasNewListo = true;
          const item = allItems.find((i) => i.detalleIds.includes(id));
          if (item) {
            addNotif({
              tipo: "info",
              titulo: `${item.esBebida ? "Bebida" : "Plato"} listo - Mesa ${item.mesa}`,
              mensaje: `${item.cantidad} ${item.nombre} esta${item.cantidad > 1 ? "n" : ""} listo${item.cantidad > 1 ? "s" : ""} para servir.`,
            });
          }
        }
      }
      if (hasNewListo) {
        // playPlatoListoSound();
      }
      prevListosRef.current = currentListos;

      const mapped = Array.from(mesaMap.values())
        .filter((mesa) => mesa.totalPlatos > 0 || mesa.totalBebidas > 0)
        .map((mesa) => ({
          ...mesa,
          pedidos: mesa.pedidos.sort((a, b) => b.hora.localeCompare(a.hora)),
        }))
        .sort((a, b) => a.numero - b.numero);

      setMesas(mapped);
    } catch (err) {
      console.error("Error loading mesero data:", err);
    } finally {
      setLoading(false);
    }
  }, [idRestaurante, addNotif]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRealtimeChange = useCallback(() => { loadData(); }, [loadData]);
  usePedidosRealtime(idRestaurante || "", handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  // Marcar uno o varios items (aggregated)
  const marcarEntregado = async (item: ItemServir) => {
    setUpdating(item.id);
    try {
      await Promise.all(item.detalleIds.map((detalleId) => actualizarEstadoDetalle(detalleId, "ENTREGADO")));
      await loadData();
    } catch (err) {
      console.error("Error updating item:", err);
    } finally {
      setUpdating(null);
    }
  };


  const mesasFiltradas = useMemo(() => {
    return mesas
      .map((mesa) => {
        const pedidos = mesa.pedidos
          .map((pedido) => {
            const items = pedido.items.filter((item) => {
              if (filtro === "platos") return !item.esBebida;
              if (filtro === "bebidas") return item.esBebida;
              return true;
            });


            return { ...pedido, items };
          })
          .filter((pedido) => pedido.items.length > 0);

        const platosListos = pedidos.flatMap((p) => p.items).filter((i) => !i.esBebida && i.estado === "LISTO").reduce((sum, i) => sum + i.cantidad, 0);
        const bebidasListas = pedidos.flatMap((p) => p.items).filter((i) => i.esBebida && i.estado === "LISTO").reduce((sum, i) => sum + i.cantidad, 0);

        return {
          ...mesa,
          pedidos,
          platosListos,
          bebidasListas,
        };
      })
      .filter((mesa) => mesa.pedidos.length > 0);
  }, [mesas, filtro]);

  const items = mesas.flatMap((mesa) => mesa.pedidos.flatMap((pedido) => pedido.items));
  const listosCount = items.filter((i) => i.estado === "LISTO").reduce((sum, i) => sum + i.cantidad, 0);
  const bebidasCount = items.filter((i) => i.esBebida && i.estado === "LISTO").reduce((sum, i) => sum + i.cantidad, 0);
  const mesasActivasCount = mesas.filter((m) => m.pedidoActivo).length;

  return {
    mesas,
    mesasFiltradas,
    loading,
    filtro,
    updating,
    listosCount,
    bebidasCount,
    mesasActivasCount,
    setFiltro,
    marcarEntregado

  };
}
