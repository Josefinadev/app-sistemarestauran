/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — usePedidoConfirm
   Lógica de confirmación del pedido del cliente.
   Incluye validación de geofencing antes de confirmar.
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useCarrito } from "@/lib/store";
import { crearPedido, validarUbicacion } from "@/lib/api";
import { obtenerUbicacion } from "@/lib/utils";

export function usePedidoConfirm() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { restaurante, mesa } = useAuth();
  const { items, removeItem, clearCart, getTotal } = useCarrito();

  const [notas, setNotas] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "checking" | "ok" | "failed">("idle");

  const handleConfirmar = async () => {
    if (items.length === 0) return;
    if (!restaurante?.id || !mesa?.id) {
      setError("No se pudo identificar la mesa. Escanea el QR de nuevo.");
      return;
    }

    setSending(true);
    setError("");

    // ── Geofencing: Validar ubicación ──
    try {
      setGeoStatus("checking");
      const pos = await obtenerUbicacion();
      const result = await validarUbicacion(
        slug,
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (result && result.dentroDelRadio === false) {
        setGeoStatus("failed");
        setError("No estás dentro del restaurante. Acércate para poder ordenar.");
        setSending(false);
        return;
      }
      setGeoStatus("ok");
    } catch (geoErr: any) {
      // Si el usuario rechaza la geolocalización o falla el endpoint,
      // dejamos pasar — no queremos bloquear por error técnico
      console.warn("Geofencing check skipped:", geoErr.message);
      setGeoStatus("ok");
    }

    // ── Crear pedido ──
    try {
      const pedidoData = {
        id_restaurante: restaurante.id,
        id_mesa: mesa.id,
        notas: notas || undefined,
        items: items.map((item) => ({
          id_producto: item.producto.id,
          cantidad: item.cantidad,
          notas: item.notas || undefined,
          agregados: item.agregados_seleccionados.map((a) => ({ id_agregado: a.id })),
        })),
      };

      const result = await crearPedido(pedidoData);
      clearCart();
      router.push(`/${slug}/estado?pedido=${result.id}`);
    } catch (err: any) {
      setError(err.message || "Error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const goToMenu = () => router.push(`/${slug}/menu`);

  return {
    items,
    notas,
    sending,
    error,
    geoStatus,
    total: getTotal(),
    mesa,
    slug,
    setNotas,
    removeItem,
    handleConfirmar,
    goToMenu,
  };
}
