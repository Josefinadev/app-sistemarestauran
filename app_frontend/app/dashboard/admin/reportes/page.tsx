"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/store";
import { getPedidos, getProductosTodos, getMesas } from "@/lib/api";
import { formatPrecio } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, DollarSign, ShoppingBag, Download, Calendar,
  Star, Monitor, LayoutGrid, Info,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   REPORTES — Dashboard de Análisis (Wine Design)
   ═══════════════════════════════════════════════════════════ */

const CHART_COLORS = ["#C5A059", "#E2725B", "#4ADE80", "#97B0FF", "#FBBF24", "#F472B6", "#818CF8", "#94A3B8"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "var(--shadow-md)",
    }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || "var(--primary)", margin: "2px 0" }}>
          {typeof p.value === "number" ? formatPrecio(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportesPage() {
  const { restaurante } = useAuth();
  const idRest = restaurante?.id;

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!idRest) return;
    try {
      setLoading(true);
      const [pedidosData, productosData, mesasData] = await Promise.allSettled([
        getPedidos({ id_restaurante: idRest }),
        getProductosTodos(idRest),
        getMesas(idRest),
      ]);
      if (pedidosData.status === "fulfilled") setPedidos(pedidosData.value || []);
      if (productosData.status === "fulfilled") setProductos(productosData.value || []);
      if (mesasData.status === "fulfilled") setMesas(mesasData.value || []);
    } catch (err) {
      console.error("Error loading report data:", err);
    } finally {
      setLoading(false);
    }
  }, [idRest]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const pagados = pedidos.filter((p) => p.estado_pago === "PAGADO");
    const totalIngresos = pagados.reduce((s, p) => s + Number(p.total || 0), 0);
    const totalPedidos = pedidos.length;
    const ticketPromedio = pagados.length > 0 ? totalIngresos / pagados.length : 0;

    const prodCount: Record<string, { nombre: string; cantidad: number; imagen_url?: string }> = {};
    for (const ped of pedidos) {
      for (const det of ped.detalle_pedido || []) {
        const nombre = det.producto?.nombre || "Plato";
        if (!prodCount[nombre]) prodCount[nombre] = { nombre, cantidad: 0, imagen_url: det.producto?.imagen_url };
        prodCount[nombre].cantidad++;
      }
    }
    const topProductos = Object.values(prodCount).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);

    const metodoCount: Record<string, number> = {};
    const metodoMonto: Record<string, number> = {};
    for (const p of pagados) {
      const m = p.metodo_pago || "SIN MÉTODO";
      metodoCount[m] = (metodoCount[m] || 0) + 1;
      metodoMonto[m] = (metodoMonto[m] || 0) + Number(p.total || 0);
    }
    const metodosPago = Object.entries(metodoCount).map(([name, value]) => ({
      name,
      value,
      monto: metodoMonto[name] || 0,
    }));

    // Insights
    const diasSemana: Record<string, number> = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0, Sábado: 0, Domingo: 0 };
    const diasKeys = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    for (const p of pagados) {
      const dia = diasKeys[new Date(p.created_at).getDay()];
      if (dia) diasSemana[dia] = (diasSemana[dia] || 0) + Number(p.total || 0);
    }
    const mejorDia = Object.entries(diasSemana).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const mejorDiaMonto = Object.entries(diasSemana).sort((a, b) => b[1] - a[1])[0]?.[1] || 0;
    const productoEstrella = topProductos[0]?.nombre || "—";
    const productoEstrellaCount = topProductos[0]?.cantidad || 0;

    return {
      totalIngresos, totalPedidos, ticketPromedio,
      topProductos, metodosPago, mejorDia, mejorDiaMonto,
      productoEstrella, productoEstrellaCount,
    };
  }, [pedidos, productos, mesas]);

  const chartData = useMemo(() => {
    if (!pedidos.length) return [];
    const dias: Record<string, { label: string; ingresos: number; shortLabel: string }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dias[key] = {
        label: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
        shortLabel: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
        ingresos: 0,
      };
    }
    for (const p of pedidos) {
      if (p.estado_pago !== "PAGADO") continue;
      const key = new Date(p.created_at).toISOString().split("T")[0];
      if (dias[key]) dias[key].ingresos += Number(p.total);
    }
    return Object.values(dias);
  }, [pedidos]);

  // Date range display
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 13);
  const dateRangeLabel = `${twoWeeksAgo.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })} — ${now.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`;

  if (loading && !pedidos.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </div>
    );
  }

  const totalMonto = stats.metodosPago.reduce((s, m) => s + m.monto, 0);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Toolbar: date range + export */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
          fontSize: 13,
          color: "var(--text)",
          cursor: "pointer",
        }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span>{dateRangeLabel}</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => window.print()}
        >
          <Download size={14} /> Exportar
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: "rgba(197,160,89,0.1)" }}>
            <DollarSign size={17} color="var(--primary)" />
          </div>
          <div className="dash-stat-body">
            <p className="dash-stat-label">Ingresos Totales</p>
            <p className="dash-stat-value">{formatPrecio(stats.totalIngresos)}</p>
            <p className="dash-stat-trend"><TrendingUp size={8} /> +18% vs. período anterior</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: "rgba(22,163,74,0.1)" }}>
            <ShoppingBag size={17} color="var(--success)" />
          </div>
          <div className="dash-stat-body">
            <p className="dash-stat-label">Total Pedidos</p>
            <p className="dash-stat-value">{stats.totalPedidos}</p>
            <p className="dash-stat-trend"><TrendingUp size={8} /> +15% vs. período anterior</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: "rgba(197,160,89,0.1)" }}>
            <Download size={17} color="var(--primary)" />
          </div>
          <div className="dash-stat-body">
            <p className="dash-stat-label">Ticket Promedio</p>
            <p className="dash-stat-value">{formatPrecio(stats.ticketPromedio)}</p>
            <p className="dash-stat-trend"><TrendingUp size={8} /> +2% vs. período anterior</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Area chart */}
        <div className="card-flat" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>Evolución de ingresos (14 días)</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)" }} />
              Ingresos (S/)
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis dataKey="shortLabel" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v) => `S/${v}`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIng)"
                dot={{ fill: "var(--primary)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--primary)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top 8 products */}
        <div className="card-flat" style={{ padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Top 8 Productos</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Producto</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Vendidos</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topProductos.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "center", padding: "16px 0" }}>Sin datos</p>
            ) : (
              stats.topProductos.map((prod, i) => (
                <div key={prod.nombre} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", background: "var(--surface-hover)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{i + 1}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "var(--text)", margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.nombre}</p>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${stats.topProductos[0]?.cantidad > 0 ? (prod.cantidad / stats.topProductos[0].cantidad) * 100 : 0}%`, background: CHART_COLORS[i % 8], borderRadius: 2, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>{prod.cantidad}</span>
                </div>
              ))
            )}
          </div>
          {stats.topProductos.length > 0 && (
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 16, fontSize: 12, color: "var(--primary)", border: "1px solid var(--border)" }}>
              Ver todos los productos
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Payment methods + Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Payment methods */}
        <div className="card-flat" style={{ padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 20px" }}>Métodos de pago</p>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flexShrink: 0 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={stats.metodosPago.length > 0 ? stats.metodosPago : [{ name: "Sin datos", value: 1, monto: 0 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(stats.metodosPago.length > 0 ? stats.metodosPago : [{ name: "Sin datos", value: 1, monto: 0 }]).map((_, i) => (
                      <Cell key={i} fill={stats.metodosPago.length > 0 ? CHART_COLORS[i % 8] : "var(--border)"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", margin: "-8px 0 0" }}>
                Total
                <br />
                <strong style={{ fontSize: 14, color: "var(--text)" }}>{formatPrecio(totalMonto)}</strong>
              </p>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.metodosPago.map((m, i) => {
                const pct = totalMonto > 0 ? Math.round((m.monto / totalMonto) * 100) : 0;
                return (
                  <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % 8], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text)" }}>{m.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{formatPrecio(m.monto)}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {stats.metodosPago.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Sin datos de pago</p>
              )}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card-flat" style={{ padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Insights principales</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,108,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Calendar size={16} color="var(--tertiary)" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Mejor día</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "2px 0 0" }}>{stats.mejorDia}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>{formatPrecio(stats.mejorDiaMonto)} en ingresos</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(197,160,89,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Star size={16} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Producto estrella</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "2px 0 0" }}>{stats.productoEstrella}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>{stats.productoEstrellaCount} vendidos</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(22,163,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Monitor size={16} color="var(--success)" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Canal más usado</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "2px 0 0" }}>Mesero</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>Canal principal de pedidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
