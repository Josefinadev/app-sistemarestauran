"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { obtenerEstadoPagos, obtenerHistorialPagos, crearPreferenciaPagoMensual, EstadoPagos, PagoMensualidad } from "@/lib/api";
import { 
  CreditCard, Calendar, CheckCircle, XCircle, Clock, 
  AlertTriangle, Loader2, ArrowLeft, Receipt, TrendingUp
} from "lucide-react";
import Link from "next/link";

const PRECIO_MENSUAL = 60;

/**
 * Convierte YYYY-MM a nombre del mes en espanol
 */
function formatearMes(mesAnio: string): string {
  const [year, month] = mesAnio.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

/**
 * Formatea fecha ISO a formato legible
 */
function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PagosPage() {
  const { restaurante } = useAuth();
  const [estadoPagos, setEstadoPagos] = useState<EstadoPagos | null>(null);
  const [historial, setHistorial] = useState<PagoMensualidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurante?.id) {
      cargarDatos();
    }
  }, [restaurante?.id]);

  const cargarDatos = async () => {
    if (!restaurante?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const [estado, hist] = await Promise.all([
        obtenerEstadoPagos(restaurante.id),
        obtenerHistorialPagos(restaurante.id)
      ]);
      setEstadoPagos(estado);
      setHistorial(hist);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos de pagos");
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (meses: string[]) => {
    if (!restaurante?.id) return;
    
    setPagando(true);
    setError(null);
    try {
      const preferencia = await crearPreferenciaPagoMensual(restaurante.id, meses);
      window.location.href = preferencia.init_point;
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      setPagando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "60vh",
        color: "rgba(255,255,255,0.5)"
      }}>
        <Loader2 size={32} className="spin-icon" />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/dashboard/admin" style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 8, 
          color: "rgba(255,255,255,0.5)",
          textDecoration: "none",
          marginBottom: 16,
          fontSize: 14
        }}>
          <ArrowLeft size={16} /> Volver al Panel
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Gestion de Pagos
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Administra tu suscripcion y revisa el historial de pagos
        </p>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "#fca5a5"
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {estadoPagos && (
        <>
          {/* Estado Actual */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 20,
            marginBottom: 32
          }}>
            {/* Card: Estado */}
            <div style={{
              background: estadoPagos.al_dia ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${estadoPagos.al_dia ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {estadoPagos.al_dia ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Estado</span>
              </div>
              <p style={{ 
                fontSize: 20, 
                fontWeight: 700,
                color: estadoPagos.al_dia ? "#22c55e" : "#ef4444"
              }}>
                {estadoPagos.al_dia ? "Al dia" : "Pendiente"}
              </p>
            </div>

            {/* Card: Mes Actual */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Calendar size={20} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Mes Actual</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {formatearMes(estadoPagos.mes_actual)}
              </p>
            </div>

            {/* Card: Precio Mensual */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CreditCard size={20} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Precio Mensual</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#C5A059" }}>
                S/{estadoPagos.precio_mensual}
              </p>
            </div>

            {/* Card: Meses Pagados */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <TrendingUp size={20} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Meses Pagados</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {estadoPagos.meses_pagados.length}
              </p>
            </div>
          </div>

          {/* Deuda pendiente */}
          {estadoPagos.meses_pendientes.length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 20,
              padding: 32,
              marginBottom: 32
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <AlertTriangle size={24} color="#ef4444" />
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>Pagos Pendientes</h3>
              </div>

              <div style={{ marginBottom: 24 }}>
                {estadoPagos.meses_pendientes.map((mes) => (
                  <div key={mes} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{formatearMes(mes)}</span>
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>S/{PRECIO_MENSUAL}</span>
                  </div>
                ))}
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 16,
                marginBottom: 24
              }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Deuda Total</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#C5A059" }}>
                  S/{estadoPagos.deuda_total}
                </span>
              </div>

              <button
                onClick={() => handlePagar(estadoPagos.meses_pendientes)}
                disabled={pagando}
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #C5A059, #A8863D)",
                  border: "none",
                  color: "#000",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: pagando ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  opacity: pagando ? 0.7 : 1
                }}
              >
                {pagando ? (
                  <Loader2 size={20} className="spin-icon" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pagar S/{estadoPagos.deuda_total} con Mercado Pago
                  </>
                )}
              </button>
            </div>
          )}

          {/* Boton para pagar proximo mes (si esta al dia) */}
          {estadoPagos.al_dia && (
            <div style={{
              background: "rgba(197,160,89,0.05)",
              border: "1px solid rgba(197,160,89,0.2)",
              borderRadius: 20,
              padding: 32,
              marginBottom: 32,
              textAlign: "center"
            }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Estas al dia!</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
                Tu suscripcion esta activa. Puedes adelantar el pago del proximo mes si lo deseas.
              </p>
              {/* Aqui podriamos agregar opcion de pagar por adelantado */}
            </div>
          )}
        </>
      )}

      {/* Historial de Pagos */}
      <div>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <Receipt size={20} />
          Historial de Pagos
        </h3>

        {historial.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            color: "rgba(255,255,255,0.4)"
          }}>
            <Receipt size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>No hay pagos registrados aun</p>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {/* Header de tabla */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 100px 1fr",
              gap: 16,
              padding: "16px 24px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase"
            }}>
              <span>Periodo</span>
              <span>Fecha de Pago</span>
              <span>Monto</span>
              <span>Estado</span>
            </div>

            {/* Filas */}
            {historial.map((pago) => (
              <div key={pago.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px 1fr",
                gap: 16,
                padding: "16px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                alignItems: "center"
              }}>
                <span style={{ fontWeight: 500 }}>{formatearMes(pago.mes_anio)}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  {pago.pagado_en ? formatearFecha(pago.pagado_en) : "-"}
                </span>
                <span style={{ fontWeight: 600, color: "#C5A059" }}>S/{pago.monto}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {pago.estado === 'pagado' ? (
                    <>
                      <CheckCircle size={16} color="#22c55e" />
                      <span style={{ color: "#22c55e", fontSize: 14 }}>Pagado</span>
                    </>
                  ) : pago.estado === 'pendiente' ? (
                    <>
                      <Clock size={16} color="#eab308" />
                      <span style={{ color: "#eab308", fontSize: 14 }}>Pendiente</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} color="#ef4444" />
                      <span style={{ color: "#ef4444", fontSize: 14 }}>Fallido</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
