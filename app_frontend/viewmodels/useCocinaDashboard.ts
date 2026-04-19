/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useCocinaDashboard
   Lógica de cocina con flujo:
   PENDIENTE → EN_PREPARACION → LISTO (cocina termina aquí)
   LISTO → ENTREGADO (responsabilidad del mesero, cocina recibe notificación)
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { usePedidosRealtime, useDetallesRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import { playNuevoPedidoSound, playPlatoListoSound, playEntregadoSound } from "@/lib/notification-sound";
import type { PlatoCocina, ConteoEstados } from "@/models/cocina";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

export function useCocinaDashboard() {
  const [platos, setPlatos] = useState<PlatoCocina[]>([]);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO">("TODOS");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();
  const prevListosRef = useRef<Set<string>>(new Set());
  const prevPendientesRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const loadPlatos = useCallback(async () => {
    try {
      const data = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const mapped: PlatoCocina[] = [];

      // Calcular hace 24h para limitar entregados recientes
      const hace24h = new Date();
      hace24h.setHours(hace24h.getHours() - 24);

      for (const pedido of data || []) {
        for (const det of pedido.detalle_pedido || []) {
          // Excluir cancelados siempre
          if (det.estado === "CANCELADO") continue;

          // ⚡ Items que NO requieren preparación van directo al mesero
          // Cocina nunca los ve (ej: Inca Kola, Coca-Cola)
          if (det.producto?.requiere_preparacion === false) continue;

          // Para ENTREGADO, solo mostrar las últimas 24h
          if (det.estado === "ENTREGADO") {
            const updatedAt = new Date(det.updated_at || det.created_at);
            if (updatedAt < hace24h) continue;
          }

          mapped.push({
            id: det.id,
            nombre: det.producto?.nombre || "Plato",
            notas: det.notas || "",
            estado: det.estado,
            mesa: pedido.mesa?.numero || 0,
            hora: det.created_at || pedido.created_at,
            agregados: (det.detalle_pedido_agregado || []).map(
              (a: any) => a.agregado?.nombre || "Extra"
            ),
            pedidoId: pedido.id,
          });
        }
      }

      // 🔔 Detectar items que pasaron de LISTO → ENTREGADO (mesero los entregó)
      // Solo después de la primera carga para evitar notificaciones falsas
      if (!isFirstLoad.current) {
        const currentListos = new Set(mapped.filter(p => p.estado === "LISTO").map(p => p.id));
        const currentEntregados = new Set(mapped.filter(p => p.estado === "ENTREGADO").map(p => p.id));

        let hadEntregado = false;
        for (const id of prevListosRef.current) {
          if (!currentListos.has(id) && currentEntregados.has(id)) {
            hadEntregado = true;
            const item = mapped.find(p => p.id === id);
            if (item) {
              addNotif({
                tipo: "success",
                titulo: `✅ Entregado — Mesa ${item.mesa}`,
                mensaje: `${item.nombre} fue entregado al cliente por el mesero.`,
              });
            }
          }
        }
        // 🔊 Sonar cuando el mesero entrega un plato
        if (hadEntregado) {
          playEntregadoSound();
        }

        // 🔊 Detectar nuevos pedidos (items PENDIENTE nuevos)
        const currentPendientes = new Set(mapped.filter(p => p.estado === "PENDIENTE").map(p => p.id));
        for (const id of currentPendientes) {
          if (!prevPendientesRef.current.has(id)) {
            playNuevoPedidoSound();
            break; // Un solo sonido por batch
          }
        }
        prevPendientesRef.current = currentPendientes;
        prevListosRef.current = currentListos;
      } else {
        // Primera carga: solo guardar referencia, sin notificar
        prevListosRef.current = new Set(mapped.filter(p => p.estado === "LISTO").map(p => p.id));
        prevPendientesRef.current = new Set(mapped.filter(p => p.estado === "PENDIENTE").map(p => p.id));
        isFirstLoad.current = false;
      }

      setPlatos(mapped);
    } catch (err) {
      console.error("Error loading cocina data:", err);
    } finally {
      setLoading(false);
    }
  }, [addNotif]);

  useEffect(() => { loadPlatos(); }, [loadPlatos]);

  const handleRealtimeChange = useCallback(() => { loadPlatos(); }, [loadPlatos]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  const avanzarEstado = async (plato: PlatoCocina) => {
    // Cocina solo maneja: PENDIENTE → EN_PREPARACION → LISTO
    // La transición LISTO → ENTREGADO es responsabilidad del MESERO
    let nuevoEstado: string;
    if (plato.estado === "PENDIENTE") nuevoEstado = "EN_PREPARACION";
    else if (plato.estado === "EN_PREPARACION") nuevoEstado = "LISTO";
    else return; // LISTO y ENTREGADO no se tocan desde cocina

    setUpdating(plato.id);
    try {
      await actualizarEstadoDetalle(plato.id, nuevoEstado);
      setPlatos((prev) =>
        prev.map((p) => (p.id === plato.id ? { ...p, estado: nuevoEstado as any } : p))
      );

      // 🔔 Notificar que el plato está LISTO + 🔊 sonido
      if (nuevoEstado === "LISTO") {
        playPlatoListoSound();
        addNotif({
          tipo: "info",
          titulo: `🍽️ ¡Plato listo! — Mesa ${plato.mesa}`,
          mensaje: `${plato.nombre} está listo para recoger y servir al cliente.`,
        });
      }
    } catch (err) {
      console.error("Error updating estado:", err);
    } finally {
      setUpdating(null);
    }
  };

  const conteo = useMemo<ConteoEstados>(() => ({
    PENDIENTE: platos.filter((p) => p.estado === "PENDIENTE").length,
    EN_PREPARACION: platos.filter((p) => p.estado === "EN_PREPARACION").length,
    LISTO: platos.filter((p) => p.estado === "LISTO").length,
  }), [platos]);

  const entregadosCount = useMemo(() =>
    platos.filter((p) => p.estado === "ENTREGADO").length
  , [platos]);

  const platosFiltrados = useMemo(() => {
    if (filtro === "TODOS") return platos.filter((p) => p.estado !== "ENTREGADO");
    return platos.filter((p) => p.estado === filtro);
  }, [platos, filtro]);

  return {
    platos, platosFiltrados, conteo, entregadosCount,
    filtro, loading, updating,
    setFiltro, avanzarEstado,
  };
}
