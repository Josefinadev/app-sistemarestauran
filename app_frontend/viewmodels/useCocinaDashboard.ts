import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { agruparDetalles, type RawDetallePedido } from "@/lib/pedidoGrouping";
import { usePedidosRealtime, useDetallesRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";

import type { ConteoEstados, MesaCocina, PedidoRecienteCocina, PlatoCocina } from "@/models/cocina";

import { useAuth } from "@/lib/store";

export function useCocinaDashboard() {
  const { restaurante } = useAuth();
  const idRestaurante = restaurante?.id;

  const [mesas, setMesas] = useState<MesaCocina[]>([]);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO">("TODOS");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();
  const prevListosRef = useRef<Set<string>>(new Set());
  const prevPendientesRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const loadMesasCocina = useCallback(async () => {
    if (!idRestaurante) return;
    try {
      const data = await getPedidos({ id_restaurante: idRestaurante });
      const mesaMap = new Map<number, MesaCocina>();
      const allLineas: PlatoCocina[] = [];
      const hace24h = new Date();
      hace24h.setHours(hace24h.getHours() - 24);

      for (const pedido of data || []) {
        const mesaNum = pedido.mesa?.numero || 0;
        const detallesPedido: RawDetallePedido[] = [];

        for (const det of pedido.detalle_pedido || []) {
          if (det.estado === "CANCELADO") continue;
          if (det.producto?.requiere_preparacion === false) continue;

          if (det.estado === "ENTREGADO") {
            const updatedAt = new Date(det.updated_at || det.created_at);
            if (updatedAt < hace24h) continue;
          }

          detallesPedido.push(det);
        }

        const lineas = agruparDetalles(detallesPedido, { includeEstado: true }).map<PlatoCocina>((grupo) => ({
          id: `${pedido.id}::${grupo.key}`,
          nombre: grupo.nombre,
          cantidad: grupo.cantidad,
          notas: grupo.notas,
          estado: grupo.estado as PlatoCocina["estado"],
          mesa: mesaNum,
          hora: grupo.hora || pedido.created_at,
          agregados: grupo.agregados,
          pedidoId: pedido.id,
          detalleIds: grupo.detalleIds,
        }));

        if (lineas.length === 0) continue;

        const pedidoReciente: PedidoRecienteCocina = {
          id: pedido.id,
          numeroPedido: `PED-${String(pedido.numero_pedido).padStart(3, "0")}`,
          hora: pedido.created_at,
          cantidadPlatos: lineas.reduce((sum, linea) => sum + linea.cantidad, 0),
          lineas,
        };

        const mesaActual = mesaMap.get(mesaNum);
        if (!mesaActual) {
          mesaMap.set(mesaNum, {
            id: `mesa-${mesaNum}`,
            mesa: mesaNum,
            hora: pedido.created_at,
            cantidadPlatos: pedidoReciente.cantidadPlatos,
            cantidadPedidos: 1,
            pendientesCount: lineas.filter((linea) => linea.estado === "PENDIENTE").length,
            pedidosRecientes: [pedidoReciente],
            lineas: [...lineas],
          });
        } else {
          mesaActual.pedidosRecientes.push(pedidoReciente);
          mesaActual.lineas.push(...lineas);
          mesaActual.cantidadPlatos += pedidoReciente.cantidadPlatos;
          mesaActual.cantidadPedidos += 1;
          mesaActual.pendientesCount += lineas.filter((linea) => linea.estado === "PENDIENTE").length;
          if (pedido.created_at > mesaActual.hora) {
            mesaActual.hora = pedido.created_at;
          }
        }

        allLineas.push(...lineas);
      }

      const mapped = Array.from(mesaMap.values())
        .map((mesa) => ({
          ...mesa,
          pedidosRecientes: mesa.pedidosRecientes.sort((a, b) => b.hora.localeCompare(a.hora)),
          lineas: mesa.lineas.sort((a, b) => b.hora.localeCompare(a.hora)),
        }))
        .sort((a, b) => b.hora.localeCompare(a.hora));

      if (!isFirstLoad.current) {
        const currentListos = new Set(allLineas.filter((p) => p.estado === "LISTO").flatMap((p) => p.detalleIds));
        const currentEntregados = new Set(allLineas.filter((p) => p.estado === "ENTREGADO").flatMap((p) => p.detalleIds));

        let hadEntregado = false;
        for (const id of prevListosRef.current) {
          if (!currentListos.has(id) && currentEntregados.has(id)) {
            const item = allLineas.find((p) => p.detalleIds.includes(id));

            if (item) {
              addNotif({
                tipo: "success",
                titulo: `Entregado - Mesa ${item.mesa}`,
                mensaje: `${item.cantidad} ${item.nombre} fue${item.cantidad > 1 ? "ron" : ""} entregado${item.cantidad > 1 ? "s" : ""} al cliente por el mesero.`,
              });
            }
          }
        }
        // 🔊 Sonar cuando el mesero entrega un plato
        if (hadEntregado) {
          // playEntregadoSound();
        }

        // 🔊 Detectar nuevos pedidos (items PENDIENTE nuevos)
        const currentPendientes = new Set(allLineas.filter(p => p.estado === "PENDIENTE").map(p => p.id));
        for (const id of currentPendientes) {
          if (!prevPendientesRef.current.has(id)) {
            // playNuevoPedidoSound();
            break; // Un solo sonido por batch
          }
        }
        prevPendientesRef.current = currentPendientes;
        prevListosRef.current = currentListos;
      } else {

        prevListosRef.current = new Set(allLineas.filter((p) => p.estado === "LISTO").flatMap((p) => p.detalleIds));

        isFirstLoad.current = false;
      }

      setMesas(mapped);
    } catch (err) {
      console.error("Error loading cocina data:", err);
    } finally {
      setLoading(false);
    }
  }, [idRestaurante, addNotif]);

  useEffect(() => { loadMesasCocina(); }, [loadMesasCocina]);

  const handleRealtimeChange = useCallback(() => { loadMesasCocina(); }, [loadMesasCocina]);
  usePedidosRealtime(idRestaurante || "", handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  const empezarPreparacionMesa = async (mesa: MesaCocina) => {
    const pendientes = mesa.lineas.filter((linea) => linea.estado === "PENDIENTE");
    if (pendientes.length === 0) return;

    setUpdating(mesa.id);
    try {
      const detalleIds = pendientes.flatMap((linea) => linea.detalleIds);
      await Promise.all(detalleIds.map((detalleId) => actualizarEstadoDetalle(detalleId, "EN_PREPARACION")));
      await loadMesasCocina();
    } catch (err) {
      console.error("Error starting mesa prep:", err);
    } finally {
      setUpdating(null);
    }
  };

  const marcarPlatoListo = async (plato: PlatoCocina) => {
    if (plato.estado !== "EN_PREPARACION") return;

    setUpdating(plato.id);
    try {
      await Promise.all(plato.detalleIds.map((detalleId) => actualizarEstadoDetalle(detalleId, "LISTO")));
      await loadMesasCocina();


      addNotif({
        tipo: "info",
        titulo: `Plato listo - Mesa ${plato.mesa}`,
        mensaje: `${plato.cantidad} ${plato.nombre} esta${plato.cantidad > 1 ? "n" : ""} listo${plato.cantidad > 1 ? "s" : ""} para recoger y servir al cliente.`,
      });

    } catch (err) {
      console.error("Error marking plato ready:", err);
    } finally {
      setUpdating(null);
    }
  };

  const conteo = useMemo<ConteoEstados>(() => ({
    PENDIENTE: mesas.flatMap((m) => m.lineas).filter((p) => p.estado === "PENDIENTE").reduce((sum, p) => sum + p.cantidad, 0),
    EN_PREPARACION: mesas.flatMap((m) => m.lineas).filter((p) => p.estado === "EN_PREPARACION").reduce((sum, p) => sum + p.cantidad, 0),
    LISTO: mesas.flatMap((m) => m.lineas).filter((p) => p.estado === "LISTO").reduce((sum, p) => sum + p.cantidad, 0),
  }), [mesas]);

  const entregadosCount = useMemo(() =>
    mesas.flatMap((m) => m.lineas).filter((p) => p.estado === "ENTREGADO").reduce((sum, p) => sum + p.cantidad, 0)
  , [mesas]);

  const mesasFiltradas = useMemo(() => {
    return mesas
      .map((mesa) => {
        const pedidosRecientes = mesa.pedidosRecientes
          .map((pedido) => {
            const lineas = filtro === "TODOS"
              ? pedido.lineas.filter((p) => p.estado !== "ENTREGADO")
              : pedido.lineas.filter((p) => p.estado === filtro);

            return {
              ...pedido,
              lineas,
              cantidadPlatos: lineas.reduce((sum, p) => sum + p.cantidad, 0),
            };
          })
          .filter((pedido) => pedido.lineas.length > 0);

        const lineas = pedidosRecientes.flatMap((pedido) => pedido.lineas);

        return {
          ...mesa,
          pedidosRecientes,
          lineas,
          cantidadPlatos: lineas.reduce((sum, p) => sum + p.cantidad, 0),
          cantidadPedidos: pedidosRecientes.length,
          pendientesCount: lineas.filter((linea) => linea.estado === "PENDIENTE").length,
        };
      })
      .filter((mesa) => mesa.lineas.length > 0);
  }, [mesas, filtro]);

  return {
    mesas,
    mesasFiltradas,
    conteo,
    entregadosCount,
    filtro,
    loading,
    updating,
    setFiltro,
    empezarPreparacionMesa,
    marcarPlatoListo,
  };
}
