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

    // DEV: salta el geofence si la URL trae ?skipGeo=1. Útil para testear
    // el flujo de pedido en una PC de escritorio sin GPS preciso.
    // No afecta a usuarios reales (no agregan el param).
    const skipGeo = typeof window !== "undefined"
      && new URLSearchParams(window.location.search).get("skipGeo") === "1";

    setSending(true);
    setError("");

    if (skipGeo) {
      console.warn("[DEV] Geofence saltado por ?skipGeo=1 — no se valida ubicación");
      setGeoStatus("ok");
    } else {
      // ── 1) Geolocalización del navegador (OBLIGATORIA) ──
      // Separado del backend para que un fallo de red no se confunda con
      // un problema de permisos/GPS del dispositivo.
      setGeoStatus("checking");
      let pos: GeolocationPosition;
      try {
        pos = await obtenerUbicacion();
        console.info("[geo] posición obtenida:", {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
      } catch (geoErr: any) {
        setGeoStatus("failed");
        // GeolocationPositionError: code 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        // Firefox suele dejar `message` vacío, así que chequeamos también por `code`.
        const code = typeof geoErr?.code === "number" ? geoErr.code : 0;
        const raw = geoErr?.message || "";
        if (code === 1 || /denied|permission/i.test(raw)) {
          setError("Debes permitir el acceso a tu ubicación para poder realizar pedidos. Activa los permisos de ubicación en tu navegador.");
        } else if (code === 2 || /unavailable/i.test(raw)) {
          setError("No se pudo obtener tu ubicación. Activa los servicios de ubicación de tu sistema operativo (o usa ?skipGeo=1 para testear).");
        } else if (code === 3 || /timeout/i.test(raw)) {
          setError("Se agotó el tiempo para obtener tu ubicación. Verifica tu conexión GPS e inténtalo de nuevo.");
        } else {
          setError(`No se pudo verificar tu ubicación. Activa el GPS y los permisos de ubicación para continuar.${raw ? ` (${raw})` : ""}`);
        }
        setSending(false);
        return;
      }

      // ── 2) Validación con el backend (separada) ──
      // Un error aquí NO es de GPS — es de red, CORS, timeout, o que el
      // restaurante no existe / no tiene coordenadas configuradas.
      let geoResult: { dentroDelRadio: boolean; distancia_metros: number; radio_metros: number } | undefined;
      try {
        geoResult = await validarUbicacion(slug, pos.coords.latitude, pos.coords.longitude);
        console.info("[geo] validación backend:", geoResult);
      } catch (apiErr: any) {
        setGeoStatus("failed");
        console.error("[validarUbicacion] error de backend:", apiErr);
        const raw = apiErr?.message || "Error desconocido";
        if (/Tiempo de espera|timeout|abort/i.test(raw)) {
          setError(`El servidor no responde. ${raw}`);
        } else if (/Failed to fetch|NetworkError|fetch|conexi[oó]n/i.test(raw)) {
          setError("No se pudo contactar al servidor. Verifica tu conexión a internet.");
        } else if (/no encontr/i.test(raw)) {
          setError("No se encontró el restaurante. Verifica el enlace (slug) del QR.");
        } else {
          setError(`No se pudo validar la ubicación con el restaurante. ${raw}`);
        }
        setSending(false);
        return;
      }

      if (geoResult && geoResult.dentroDelRadio === false) {
        setGeoStatus("failed");
        setError(
          `No estás dentro del restaurante. Estás a ${geoResult.distancia_metros}m, el límite es ${geoResult.radio_metros}m. Acércate para poder ordenar.`
        );
        setSending(false);
        return;
      }
      setGeoStatus("ok");
    }

    // ── 3) Crear pedido (solo si la geolocalización fue exitosa) ──
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
      console.error("[crearPedido] error:", err);
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
