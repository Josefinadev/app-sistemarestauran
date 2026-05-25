/* ═══════════════════════════════════════════════════════════
   Supabase Realtime Hooks — Actualizaciones en tiempo real
   Escucha cambios en pedidos y detalle_pedido via WebSocket
   ═══════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Nota: estos hooks solo se ejecutan en cliente.

/**
 * Escucha nuevos pedidos y cambios de estado para un restaurante.
 * Útil para dashboards de cocina, mesero y caja.
 */
export function usePedidosRealtime(
  idRestaurante: string | null,
  onInsert?: (pedido: any) => void,
  onUpdate?: (pedido: any) => void
) {
  useEffect(() => {
    if (!idRestaurante) return;

    const channel = supabase
      .channel(`pedidos-${idRestaurante}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pedido",
          filter: `id_restaurante=eq.${idRestaurante}`,
        },
        (payload) => onInsert?.(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedido",
          filter: `id_restaurante=eq.${idRestaurante}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idRestaurante, onInsert, onUpdate]);
}

/**
 * Escucha cambios en detalle_pedido (estados de platos).
 * Útil para cocina y mesero.
 */
export function useDetallesRealtime(
  onInsert?: (detalle: any) => void,
  onUpdate?: (detalle: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel("detalles-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "detalle_pedido" },
        (payload) => onInsert?.(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "detalle_pedido" },
        (payload) => onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert, onUpdate]);
}

/**
 * Escucha cambios de un pedido específico (por ID).
 * Útil para la página de estado del pedido del cliente.
 */
export function usePedidoRealtime(
  pedidoId: string | null,
  onUpdate?: (pedido: any) => void
) {
  useEffect(() => {
    if (!pedidoId) return;

    const channel = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedido",
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId, onUpdate]);
}

/**
 * Escucha cambios en detalles de un pedido específico.
 * Útil para la página de estado del pedido del cliente.
 */
export function useDetallesPedidoRealtime(
  pedidoId: string | null,
  onUpdate?: (detalle: any) => void
) {
  useEffect(() => {
    if (!pedidoId) return;

    const channel = supabase
      .channel(`detalles-pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "detalle_pedido",
          filter: `id_pedido=eq.${pedidoId}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId, onUpdate]);
}

/**
 * Escucha cambios de branding/colores del restaurante.
 * Útil para aplicar paleta en tiempo real en todos los módulos.
 */
export function useRestauranteRealtime(
  idRestaurante: string | null,
  onUpdate?: (restaurante: any) => void
) {
  useEffect(() => {
    if (!idRestaurante) return;

    const channel = supabase
      .channel(`restaurante-${idRestaurante}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "restaurante",
          filter: `id=eq.${idRestaurante}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idRestaurante, onUpdate]);
}

/**
 * Escucha cambios en productos para un restaurante.
 * En UI normalmente solo se usa para hacer refetch rápido.
 */
export function useProductosRealtime(
  idRestaurante: string | null,
  onChange?: () => void
) {
  useEffect(() => {
    if (!idRestaurante) return;

    const channel = supabase
      .channel(`productos-${idRestaurante}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "producto",
          filter: `id_restaurante=eq.${idRestaurante}`,
        },
        () => onChange?.()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idRestaurante, onChange]);
}
