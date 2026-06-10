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
  Calendar, TrendingUp, DollarSign, ShoppingBag,
  Flame, Clock, Users, CreditCard, Receipt,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   REPORTES — Dashboard de Análisis
   Visualización de ingresos, pedidos y métricas clave.
   ═══════════════════════════════════════════════════════════ */

const CHART_COLORS = ["#C5A059", "#E2725B", "#97B0FF", "#4ADE80", "#FBBF24", "#D4B474", "#F472B6", "#818CF8"];

type Vista = "diario" | "semanal" | "mensual";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A1A1C", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" && (p.name.includes("ngreso") || p.name.includes("Total")) ? formatPrecio(p.value) : p.value}
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
  const [vista, setVista] = useState<Vista>("diario");

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

    // Productos top
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

    return {
      totalIngresos, totalPedidos, ticketPromedio,
      topProductos, metodosPago,
      productosTotal: productos.length, mesasTotal: mesas.length,
    };
  }, [pedidos, productos, mesas]);

  const chartData = useMemo(() => {
    if (!pedidos.length) return [];
    const dias: Record<string, { label: string; ingresos: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dias[key] = { label: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }), ingresos: 0 };
    }
    for (const p of pedidos) {
      if (p.estado_pago !== "PAGADO") continue;
      const key = new Date(p.created_at).toISOString().split("T")[0];
      if (dias[key]) dias[key].ingresos += Number(p.total);
    }
    return Object.values(dias);
  }, [pedidos]);

  if (loading && !pedidos.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
          Reportes y <em style={{ color: "var(--primary)" }}>Análisis</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          {pedidos.length} pedidos totales · {stats.productosTotal} productos · {stats.mesasTotal} mesas
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card-flat" style={{ padding: 20 }}>
          <p className="label" style={{ fontSize: 10 }}>Ingresos Totales</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "var(--success)", margin: "8px 0" }}>{formatPrecio(stats.totalIngresos)}</p>
          <div style={{ width: 40, height: 40, position: "absolute", top: 20, right: 20, background: "rgba(74,222,128,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={20} color="var(--success)" /></div>
        </div>
        <div className="card-flat" style={{ padding: 20 }}>
          <p className="label" style={{ fontSize: 10 }}>Pedidos</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", margin: "8px 0" }}>{stats.totalPedidos}</p>
          <div style={{ width: 40, height: 40, position: "absolute", top: 20, right: 20, background: "rgba(197,160,89,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingBag size={20} color="var(--primary)" /></div>
        </div>
        <div className="card-flat" style={{ padding: 20 }}>
          <p className="label" style={{ fontSize: 10 }}>Ticket Promedio</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "var(--tertiary)", margin: "8px 0" }}>{formatPrecio(stats.ticketPromedio)}</p>
          <div style={{ width: 40, height: 40, position: "absolute", top: 20, right: 20, background: "rgba(151,176,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={20} color="var(--tertiary)" /></div>
        </div>
      </div>

      <div className="card-flat" style={{ padding: 24 }}>
        <p className="label" style={{ marginBottom: 20 }}>Evolución de Ingresos (14 días)</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs><linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v) => `S/${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--primary)" fillOpacity={1} fill="url(#colorIng)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        <div className="card-flat" style={{ padding: 24 }}>
          <p className="label" style={{ marginBottom: 20 }}>Top 8 Productos</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.topProductos.map((prod, i) => (
              <div key={prod.nombre} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: CHART_COLORS[i % 8], width: 24 }}>{i+1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{prod.nombre}</p>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 4 }}>
                    <div style={{ height: "100%", width: `${(prod.cantidad / stats.topProductos[0].cantidad) * 100}%`, background: CHART_COLORS[i % 8], borderRadius: 2 }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{prod.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-flat" style={{ padding: 24 }}>
          <p className="label" style={{ marginBottom: 20 }}>Métodos de Pago</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.metodosPago} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.metodosPago.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 8]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 12 }}>
            {stats.metodosPago.map((m, i) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % 8] }} />
                <span>{m.name} ({m.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
