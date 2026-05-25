/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — usePedidoConfirm
   Lógica de confirmación del pedido del cliente.
   Incluye validación de geofencing ESTRICTA antes de confirmar.
   Si la geolocalización falla o es rechazada, el pedido se BLOQUEA.
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
  const { restaurante, mesa, setActivePedido } = useAuth();
  const { items, removeItem, updateCantidad, clearCart, getTotal } = useCarrito();

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

    // ── Geofencing ESTRICTO: Validar ubicación ──
    // La ubicación es OBLIGATORIA. Si falla, se bloquea el pedido.
    try {
      setGeoStatus("checking");
      const pos = await obtenerUbicacion();
      const geoResult = await validarUbicacion(
        slug,
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (geoResult && geoResult.dentroDelRadio === false) {
        setGeoStatus("failed");
        setError(
          `No estás dentro del restaurante. Estás a ${geoResult.distancia_metros}m, el límite es ${geoResult.radio_metros}m. Acércate para poder ordenar.`
        );
        setSending(false);
        return;
      }
      setGeoStatus("ok");
    } catch (geoErr: any) {
      // Geolocalización es OBLIGATORIA — si falla, bloqueamos el pedido.
      // Esto previene pedidos falsos desde fuera del restaurante.
      setGeoStatus("failed");
      const msg = geoErr?.message || "";
      if (msg.includes("denied") || msg.includes("permission") || msg.includes("Permission")) {
        setError("Debes permitir el acceso a tu ubicación para poder realizar pedidos. Activa los permisos de ubicación en tu navegador.");
      } else if (msg.includes("position unavailable") || msg.includes("unavailable")) {
        setError("No se pudo obtener tu ubicación. Asegúrate de tener el GPS activado e inténtalo de nuevo.");
      } else if (msg.includes("timeout")) {
        setError("Se agotó el tiempo para obtener tu ubicación. Verifica tu conexión GPS e inténtalo de nuevo.");
      } else {
        setError("No se pudo verificar tu ubicación. Activa el GPS y los permisos de ubicación para continuar.");
      }
      setSending(false);
      return;
    }

    // ── Crear pedido (solo si la geolocalización fue exitosa) ──
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
      setActivePedido(result.id, result.estado || "PENDIENTE");
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
    updateCantidad,
    handleConfirmar,
    goToMenu,
  };
}
