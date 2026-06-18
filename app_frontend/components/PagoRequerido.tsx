"use client";

import { useState } from "react";
import { CreditCard, AlertTriangle, Loader2, Calendar, Clock } from "lucide-react";
import { crearPreferenciaPagoMensual, EstadoPagos } from "@/lib/api";

interface PagoRequeridoProps {
  estadoPagos: EstadoPagos;
  idRestaurante: string;
}

/**
 * Convierte YYYY-MM a nombre del mes en espanol
 */
function formatearMes(mesAnio: string): string {
  const [year, month] = mesAnio.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

export function PagoRequerido({ estadoPagos, idRestaurante }: PagoRequeridoProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesesPendientes = estadoPagos.meses_pendientes;
  const deudaTotal = estadoPagos.deuda_total;
  const cantidadMeses = mesesPendientes.length;

  const handlePagar = async () => {
    setLoading(true);
    setError(null);
    try {
      const preferencia = await crearPreferenciaPagoMensual(idRestaurante, mesesPendientes);
      window.location.href = preferencia.init_point;
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      {/* Overlay oscuro con blur */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)"
      }} />
      
      {/* Card de pago */}
      <div style={{
        position: "relative",
        background: "#1a1a1f",
        borderRadius: 24,
        padding: 40,
        maxWidth: 480,
        width: "100%",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}>
        {/* Icono de alerta */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "rgba(239,68,68,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px"
        }}>
          <AlertTriangle size={32} color="#ef4444" />
        </div>

        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
          color: "#fff"
        }}>
          Suscripcion Vencida
        </h2>

        <p style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.5)",
          marginBottom: 32,
          lineHeight: 1.6
        }}>
          Tu restaurante esta pausado temporalmente. Regulariza tu pago para continuar operando.
        </p>

        {/* Detalle de deuda */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={18} color="rgba(255,255,255,0.4)" />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                {cantidadMeses === 1 ? "Mes pendiente" : "Meses pendientes"}
              </span>
            </div>
            <span style={{ color: "#fff", fontWeight: 600 }}>
              {cantidadMeses}
            </span>
          </div>

          {/* Lista de meses */}
          <div style={{ marginBottom: 16 }}>
            {mesesPendientes.slice(0, 3).map((mes) => (
              <div key={mes} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                fontSize: 14
              }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{formatearMes(mes)}</span>
                <span style={{ color: "#ef4444" }}>S/{estadoPagos.precio_mensual}</span>
              </div>
            ))}
            {mesesPendientes.length > 3 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                +{mesesPendientes.length - 3} meses mas...
              </p>
            )}
          </div>

          {/* Total */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.05)"
          }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>Deuda Total</span>
            <span style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color: "#C5A059"
            }}>
              S/{deudaTotal}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#fca5a5",
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Boton de pago */}
        <button
          onClick={handlePagar}
          disabled={loading}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #C5A059, #A8863D)",
            border: "none",
            color: "#000",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s"
          }}
        >
          {loading ? (
            <Loader2 size={20} className="spin-icon" />
          ) : (
            <>
              <CreditCard size={20} />
              Pagar S/{deudaTotal} con Mercado Pago
            </>
          )}
        </button>

        <p style={{
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.3)",
          marginTop: 16
        }}>
          Seras redirigido a Mercado Pago para completar el pago de forma segura
        </p>
      </div>
    </div>
  );
}

export default PagoRequerido;
