"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/store";
import { getPedidos, getProductosTodos, getMesas } from "@/lib/api";
import { formatPrecio, formatHora } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import {
  Calendar, TrendingUp, DollarSign, ShoppingBag, ChefHat,
  Flame, Clock, Users, CreditCard, Receipt,
  ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   REPORTES — Datos reales de Supabase
   Ingresos, pedidos, productos top, métodos de pago,
   historial de pedidos, horas pico
   ═══════════════════════════════════════════════════════════ */

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";
const CHART_COLORS = ["#C5A059", "#E2725B", "#97B0FF", "#4ADE80", "#FBBF24", "#D4B474", "#F472B6", "#818CF8"];

type Vista = "diario" | "semanal" | "mensual";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A1A1C", border: "1px solid #2A2118", borderRadius: 12, padding: "12px 16px" }}>
      <p style={{ fontSize: 11, color: "#5A4E38", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" && p.name.includes("ngreso") ? formatPrecio(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportesPage() {
  const { restaurante } = useAuth();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<Vista>("diario");
  const [showHistorial, setShowHistorial] = useState(false);

  const idRest = restaurante?.id || ID_RESTAURANTE;

  const loadData = useCallback(async () => {
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

  // ── Procesamiento de datos ──
  const stats = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pagados = pedidos.filter((p) => p.estado_pago === "PAGADO");
    const pedidosHoy = pedidos.filter((p) => new Date(p.created_at) >= hoy);
    const pagadosHoy = pedidosHoy.filter((p) => p.estado_pago === "PAGADO");

    const totalIngresos = pagados.reduce((s, p) => s + Number(p.total || 0), 0);
    const ingresosHoy = pagadosHoy.reduce((s, p) => s + Number(p.total || 0), 0);
    const totalPedidos = pedidos.length;
    const ticketPromedio = pagados.length > 0 ? totalIngresos / pagados.length : 0;

    // Comparación con ayer
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const pedidosAyer = pedidos.filter((p) => {
      const d = new Date(p.created_at);
      return d >= ayer && d < hoy;
    });
    const ingresosAyer = pedidosAyer.filter(p => p.estado_pago === "PAGADO").reduce((s, p) => s + Number(p.total || 0), 0);
    const variacionIngresos = ingresosAyer > 0 ? ((ingresosHoy - ingresosAyer) / ingresosAyer * 100) : 0;

    // Productos más vendidos
    const prodCount: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {};
    for (const ped of pedidos) {
      for (const det of ped.detalle_pedido || []) {
        const nombre = det.producto?.nombre || "Plato";
        if (!prodCount[nombre]) prodCount[nombre] = { nombre, cantidad: 0, ingresos: 0 };
        prodCount[nombre].cantidad++;
        prodCount[nombre].ingresos += Number(det.precio_unitario || 0);
      }
    }
    const topProductos = Object.values(prodCount).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);

    // Métodos de pago
    const metodoCount: Record<string, number> = {};
    for (const p of pagados) {
      const m = p.metodo_pago || "SIN MÉTODO";
      metodoCount[m] = (metodoCount[m] || 0) + 1;
    }
    const metodosPago = Object.entries(metodoCount).map(([name, value]) => ({ name, value }));

    // Hora pico (distribución por hora)
    const horaCount: Record<number, number> = {};
    for (const p of pedidos) {
      const h = new Date(p.created_at).getHours();
      horaCount[h] = (horaCount[h] || 0) + 1;
    }
    const horasPico = Array.from({ length: 24 }, (_, i) => ({
      hora: `${String(i).padStart(2, "0")}:00`,
      pedidos: horaCount[i] || 0,
    })).filter(h => h.pedidos > 0);

    // Estado de pedidos
    const estadoCount: Record<string, number> = {};
    for (const p of pedidos) {
      estadoCount[p.estado] = (estadoCount[p.estado] || 0) + 1;
    }
    const estadosPedido = Object.entries(estadoCount).map(([name, value]) => ({ name, value }));

    // Mesa con más pedidos
    const mesaCount: Record<string, { mesa: number; pedidos: number; ingreso: number }> = {};
    for (const p of pedidos) {
      const mNum = p.mesa?.numero || 0;
      const key = String(mNum);
      if (!mesaCount[key]) mesaCount[key] = { mesa: mNum, pedidos: 0, ingreso: 0 };
      mesaCount[key].pedidos++;
      if (p.estado_pago === "PAGADO") mesaCount[key].ingreso += Number(p.total || 0);
    }
    const topMesas = Object.values(mesaCount).sort((a, b) => b.pedidos - a.pedidos).slice(0, 5);

    return {
      totalIngresos, ingresosHoy, totalPedidos, pedidosHoy: pedidosHoy.length,
      ticketPromedio, variacionIngresos,
      pagados: pagados.length, pagadosHoy: pagadosHoy.length,
      topProductos, metodosPago, horasPico, estadosPedido, topMesas,
      productosTotal: productos.length, mesasTotal: mesas.length,
    };
  }, [pedidos, productos, mesas]);

  // ── Datos por vista temporal ──
  const chartData = useMemo(() => {
    if (!pedidos.length) return [];

    if (vista === "diario") {
      const dias: Record<string, { label: string; pedidos: number; ingresos: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dias[key] = { label: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }), pedidos: 0, ingresos: 0 };
      }
      for (const p of pedidos) {
        const key = new Date(p.created_at).toISOString().split("T")[0];
        if (dias[key]) {
          dias[key].pedidos++;
          if (p.estado_pago === "PAGADO") dias[key].ingresos += Number(p.total);
        }
      }
      return Object.values(dias);
    }

    if (vista === "semanal") {
      // Últimas 8 semanas
      const semanas: Record<string, { label: string; pedidos: number; ingresos: number }> = {};
      for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split("T")[0];
        semanas[key] = {
          label: `Sem ${weekStart.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}`,
          pedidos: 0, ingresos: 0,
        };
      }
      for (const p of pedidos) {
        const d = new Date(p.created_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split("T")[0];
        if (semanas[key]) {
          semanas[key].pedidos++;
          if (p.estado_pago === "PAGADO") semanas[key].ingresos += Number(p.total);
        }
      }
      return Object.values(semanas);
    }

    // Mensual
    const meses: Record<string, { label: string; pedidos: number; ingresos: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses[key] = { label: d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" }), pedidos: 0, ingresos: 0 };
    }
    for (const p of pedidos) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (meses[key]) {
        meses[key].pedidos++;
        if (p.estado_pago === "PAGADO") meses[key].ingresos += Number(p.total);
      }
    }
    return Object.values(meses);
  }, [pedidos, vista]);

  // Pedidos recientes para historial
  const pedidosRecientes = useMemo(() =>
    pedidos.slice(0, 20).map((p) => ({
      id: p.id,
      mesa: p.mesa?.numero || "—",
      estado: p.estado,
      estadoPago: p.estado_pago,
      metodoPago: p.metodo_pago || "—",
      total: Number(p.total || 0),
      items: (p.detalle_pedido || []).length,
      hora: p.created_at,
    }))
  , [pedidos]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </div>
    );
  }

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      PENDIENTE: "badge-pending", EN_PREPARACION: "badge-preparing",
      LISTO: "badge-ready", ENTREGADO: "badge-ready", CANCELADO: "badge-cancelled",
    };
    return map[estado] || "badge-pending";
  };

  const estadoPagoColor = (ep: string) => ep === "PAGADO" ? "var(--success)" : "var(--warning)";

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
            Reportes e <em style={{ color: "var(--primary)" }}>Historial</em>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Datos en tiempo real — {pedidos.length} pedidos registrados · {stats.productosTotal} productos · {stats.mesasTotal} mesas
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["diario", "semanal", "mensual"] as Vista[]).map((v) => (
            <button key={v} onClick={() => setVista(v)} className={`btn btn-sm ${vista === v ? "btn-primary" : "btn-secondary"}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={12} /> {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card-flat" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Ingresos hoy</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--primary)", margin: "8px 0 0" }}>{formatPrecio(stats.ingresosHoy)}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                {stats.variacionIngresos !== 0 && (
                  <span style={{ fontSize: 10, color: stats.variacionIngresos > 0 ? "var(--success)" : "var(--error)", display: "flex", alignItems: "center", gap: 2 }}>
                    {stats.variacionIngresos > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(stats.variacionIngresos).toFixed(1)}% vs ayer
                  </span>
                )}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(197,160,89,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={20} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="card-flat" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Ingresos totales</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--success)", margin: "8px 0 0" }}>{formatPrecio(stats.totalIngresos)}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 0" }}>{stats.pagados} pedidos pagados</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={20} color="var(--success)" />
            </div>
          </div>
        </div>

        <div className="card-flat" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Pedidos hoy</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--tertiary)", margin: "8px 0 0" }}>{stats.pedidosHoy}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 0" }}>{stats.totalPedidos} totales</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(151,176,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={20} color="var(--tertiary)" />
            </div>
          </div>
        </div>

        <div className="card-flat" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Ticket promedio</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--secondary)", margin: "8px 0 0" }}>{formatPrecio(stats.ticketPromedio)}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 0" }}>por pedido pagado</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(226,114,91,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Receipt size={20} color="var(--secondary)" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Ingresos */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p className="label" style={{ margin: "0 0 4px" }}>Ingresos</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Vista {vista}</p>
            </div>
            <DollarSign size={16} color="var(--primary)" style={{ opacity: 0.5 }} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2118" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} tickFormatter={(v) => `S/${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#C5A059" fill="url(#gradIngreso)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos por periodo */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p className="label" style={{ margin: "0 0 4px" }}>Pedidos</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Vista {vista}</p>
            </div>
            <ShoppingBag size={16} color="var(--tertiary)" style={{ opacity: 0.5 }} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2118" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#97B0FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ MIDDLE ROW ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {/* Top Productos */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Flame size={16} color="var(--secondary)" />
            <p className="label" style={{ margin: 0 }}>Más vendidos</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.topProductos.map((prod, i) => (
              <div key={prod.nombre} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: CHART_COLORS[i] || "var(--primary)", width: 24, textAlign: "center" }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0 }}>{prod.nombre}</p>
                  <div style={{ width: "100%", height: 4, borderRadius: 2, background: "var(--surface-active)", marginTop: 4, overflow: "hidden" }}>
                    <div style={{ width: `${stats.topProductos[0] ? (prod.cantidad / stats.topProductos[0].cantidad) * 100 : 0}%`, height: "100%", borderRadius: 2, background: CHART_COLORS[i] || "var(--primary)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{prod.cantidad}</p>
                  <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0 }}>{formatPrecio(prod.ingresos)}</p>
                </div>
              </div>
            ))}
            {stats.topProductos.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: 20 }}>Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <CreditCard size={16} color="var(--success)" />
            <p className="label" style={{ margin: 0 }}>Métodos de pago</p>
          </div>
          {stats.metodosPago.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stats.metodosPago} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={4} dataKey="value">
                    {stats.metodosPago.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                {stats.metodosPago.map((m, i) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: 40 }}>Sin pagos registrados</p>
          )}
        </div>

        {/* Horas Pico */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Clock size={16} color="var(--warning)" />
            <p className="label" style={{ margin: 0 }}>Horas pico</p>
          </div>
          {stats.horasPico.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.horasPico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2118" />
                <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} />
                <YAxis tick={{ fontSize: 9, fill: "#5A4E38" }} axisLine={{ stroke: "#2A2118" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pedidos" name="Pedidos" fill="#FBBF24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: 40 }}>Sin datos de horarios</p>
          )}
        </div>
      </div>

      {/* ═══ MESA TOP + HISTORIAL ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Mesas top */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Users size={16} color="var(--tertiary)" />
            <p className="label" style={{ margin: 0 }}>Mesas con más pedidos</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.topMesas.map((m, i) => (
              <div key={m.mesa} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: i === 0 ? "var(--primary-ghost)" : "transparent", borderRadius: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--primary)" : "var(--text-muted)", width: 24 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {m.mesa}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>{m.pedidos} pedidos</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{formatPrecio(m.ingreso)}</span>
              </div>
            ))}
            {stats.topMesas.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Sin datos</p>}
          </div>
        </div>

        {/* Historial de pedidos */}
        <div className="card-flat" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Receipt size={16} color="var(--primary)" />
              <p className="label" style={{ margin: 0 }}>Últimos pedidos</p>
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pedidosRecientes.length} más recientes</span>
          </div>
          <div className="table-container" style={{ maxHeight: 350, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Items</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Método</th>
                  <th>Total</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {pedidosRecientes.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>Mesa {p.mesa}</td>
                    <td>{p.items}</td>
                    <td><span className={`badge ${estadoBadge(p.estado)}`} style={{ fontSize: 9 }}>{p.estado}</span></td>
                    <td><span style={{ color: estadoPagoColor(p.estadoPago), fontSize: 11, fontWeight: 600 }}>{p.estadoPago}</span></td>
                    <td style={{ fontSize: 11 }}>{p.metodoPago}</td>
                    <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatPrecio(p.total)}</td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatHora(p.hora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
