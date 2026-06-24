"use client";

import { useSuscripcion } from "@/viewmodels/useSuscripcion";
import { formatPrecio } from "@/lib/utils";
import { useState } from "react";
import { Crown, CheckCircle2, Palette, Leaf, Rocket, Diamond, Pencil, Calendar, CreditCard, FileText, Save, X, Printer } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SUSCRIPCIÓN — Wine Design
   Plan actual, planes disponibles, colores de marca
   ═══════════════════════════════════════════════════════════ */

const planIcons: Record<string, any> = {
  basico: Leaf,
  profesional: Crown,
  avanzado: Rocket,
  empresarial: Diamond,
};

const planIconColors: Record<string, string> = {
  basico: "#16a34a",
  profesional: "var(--primary)",
  avanzado: "var(--tertiary)",
  empresarial: "#9333ea",
};

const planIconBgs: Record<string, string> = {
  basico: "rgba(22,163,74,0.1)",
  profesional: "rgba(197,160,89,0.1)",
  avanzado: "rgba(74,108,247,0.1)",
  empresarial: "rgba(147,51,234,0.1)",
};

function getPlanKey(nombre: string): string {
  const n = nombre?.toLowerCase() || "";
  if (n.includes("básico") || n.includes("basico")) return "basico";
  if (n.includes("profesional")) return "profesional";
  if (n.includes("avanzado")) return "avanzado";
  if (n.includes("empresarial")) return "empresarial";
  return "profesional";
}

export default function SuscripcionDashboard() {
  const vm = useSuscripcion();
  const [showHistorial, setShowHistorial] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"mensual" | "anual">("mensual");

  if (vm.loading) {
    return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />;
  }

  const currentPlanKey = getPlanKey(vm.suscripcionActual?.plan?.nombre || "");

  return (
    <div className="animate-fade-in" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* ── Main column ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Current plan banner */}
        {vm.suscripcionActual && (
          <div style={{
            background: "linear-gradient(135deg, rgba(197,160,89,0.08) 0%, rgba(197,160,89,0.04) 100%)",
            border: "2px solid rgba(197,160,89,0.3)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(197,160,89,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 20, right: 32, opacity: 0.06 }}>
              <Crown size={120} color="var(--primary)" />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--primary)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Plan Actual
                </span>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--text)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 12 }}>
                  {vm.suscripcionActual.plan?.nombre || "Plan"}
                  <Crown size={28} color="var(--primary)" />
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px" }}>
                  {vm.suscripcionActual.plan?.descripcion || "Ideal para restaurantes en crecimiento"}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: "var(--primary)" }}>
                    {formatPrecio(vm.suscripcionActual.plan?.precio_mensual || 0)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>por mes + IGV</span>
                </div>
              </div>
              <div style={{ minWidth: 200 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>Incluye:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                  {["Productos ilimitados", "Mesas y QR ilimitados", "Usuarios ilimitados", "Reportes avanzados", "Integraciones", "Soporte prioritario"].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                      <CheckCircle2 size={13} color="var(--success)" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available plans */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Planes disponibles</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "2px" }}>
              <button
                onClick={() => setBillingPeriod("mensual")}
                style={{ padding: "5px 14px", borderRadius: 6, background: billingPeriod === "mensual" ? "var(--primary)" : "transparent", border: "none", color: billingPeriod === "mensual" ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingPeriod("anual")}
                style={{ padding: "5px 14px", borderRadius: 6, background: billingPeriod === "anual" ? "var(--primary)" : "transparent", border: "none", color: billingPeriod === "anual" ? "#fff" : "var(--text-muted)", fontSize: 12, cursor: "pointer", position: "relative", transition: "all 0.15s" }}
              >
                Anual
                <span style={{ position: "absolute", top: -8, right: -4, background: "var(--success)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 99 }}>Ahorra 20%</span>
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {vm.planes.map((plan) => {
              const isCurrent = vm.suscripcionActual?.id_plan === plan.id;
              const planKey = getPlanKey(plan.nombre);
              const PlanIcon = planIcons[planKey] || Crown;
              const iconColor = planIconColors[planKey] || "var(--primary)";
              const iconBg = planIconBgs[planKey] || "rgba(197,160,89,0.1)";
              const precioMensual = plan.precio_mensual || 0;
              const precioAnual = precioMensual * 12 * 0.8; // 20% descuento anual
              const precioMostrado = billingPeriod === "anual" ? precioAnual / 12 : precioMensual;

              return (
                <div key={plan.id} className={`plan-card ${isCurrent ? "plan-card--current" : ""}`} style={{ position: "relative" }}>
                  {isCurrent && (
                    <span style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "var(--primary)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 12px", borderRadius: "0 0 8px 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Plan Actual
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, marginTop: isCurrent ? 16 : 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PlanIcon size={22} color={iconColor} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>{plan.nombre}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{plan.descripcion}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
                    {formatPrecio(precioMostrado)}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 16px" }}>
                    {billingPeriod === "anual"
                      ? `por mes · S/ ${precioAnual.toFixed(2)}/año + IGV`
                      : "por mes + IGV"
                    }
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, flex: 1 }}>
                    {(planKey === "basico"
                      ? ["Hasta 200 productos", "Hasta 10 mesas", "2 usuarios", "Reportes básicos", "Soporte por correo"]
                      : planKey === "avanzado"
                      ? ["Todo en Profesional", "Sucursales ilimitadas", "Control de inventario", "Reportes personalizados", "API y Webhooks"]
                      : planKey === "empresarial"
                      ? ["Todo en Avanzado", "Múltiples compañías", "Permisos avanzados", "Consultor dedicado", "SLA garantizado"]
                      : ["Productos ilimitados", "Mesas y QR ilimitados", "Usuarios ilimitados", "Reportes avanzados", "Soporte prioritario"]
                    ).map((f: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                        <CheckCircle2 size={12} color="var(--success)" /> {f}
                      </div>
                    ))}
                  </div>
                  <button
                    className={`btn ${isCurrent ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => vm.handleCambiarPlan(plan.id)}
                    disabled={isCurrent || vm.saving}
                    style={{ width: "100%", background: isCurrent ? "var(--primary)" : "transparent", color: isCurrent ? "#fff" : "var(--primary)", border: `1px solid ${isCurrent ? "var(--primary)" : "var(--primary)"}` }}
                  >
                    {isCurrent ? <><CheckCircle2 size={14} /> Plan Actual</> : "Cambiar plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color preview + brand colors */}
        <div className="card-flat" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>Colores de marca</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>Elige los colores que representan tu marca en el sistema.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, alignItems: "flex-start" }}>
            {/* Preview buttons */}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Vista previa de colores</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ padding: "8px 16px", background: vm.colorPrimario, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "default" }}>Botón primario</button>
                <button style={{ padding: "8px 16px", background: "transparent", color: vm.colorPrimario, border: `1.5px solid ${vm.colorPrimario}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "default" }}>Botón outline</button>
                <button style={{ padding: "8px 16px", background: vm.colorSecundario, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "default" }}>Botón secundario</button>
              </div>
            </div>
            {/* Color primary */}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Color primario</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                <input type="color" value={vm.colorPrimario} onChange={(e) => vm.setColorPrimario(e.target.value)} style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 0 }} />
                <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text)" }}>{vm.colorPrimario}</span>
                <Pencil size={12} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
              </div>
            </div>
            {/* Color secondary */}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Color secundario</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                <input type="color" value={vm.colorSecundario} onChange={(e) => vm.setColorSecundario(e.target.value)} style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 0 }} />
                <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text)" }}>{vm.colorSecundario}</span>
                <Pencil size={12} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-primary" onClick={vm.handleUpdateColors} disabled={vm.saving} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Save size={14} /> {vm.saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Footer security note — removed */}
      </div>

      {/* ── Right billing summary ── */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div className="card-flat" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Resumen de facturación</p>
          {vm.suscripcionActual ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} /> Próximo pago</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                  {vm.suscripcionActual.fecha_fin ? new Date(vm.suscripcionActual.fecha_fin).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "Sin fecha"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Importe</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                  {formatPrecio(vm.suscripcionActual.plan?.precio_mensual || 0)} + IGV
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Estado</span>
                <span className={`badge ${vm.suscripcionActual.estado === "activa" ? "badge-ready" : "badge-pending"}`} style={{ fontSize: 10 }}>
                  {vm.suscripcionActual.estado === "activa" ? "Activa" : (vm.suscripcionActual.estado || "Inactiva")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Plan</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
                  {vm.suscripcionActual.plan?.nombre || "—"}
                </span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>Facturación</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: "var(--text)" }}>
                    {formatPrecio(vm.suscripcionActual.plan?.precio_mensual || 0)}/mes
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }} onClick={() => setShowHistorial(true)}>
                <FileText size={13} /> Ver historial de facturación
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "16px", background: "rgba(197,160,89,0.06)", borderRadius: 12, border: "1px solid rgba(197,160,89,0.2)", textAlign: "center" }}>
                <Crown size={28} color="var(--primary)" style={{ margin: "0 auto 8px", display: "block", opacity: 0.6 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Sin suscripción activa</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Selecciona un plan para activar tu cuenta</p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={13} /> Ver planes disponibles
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Historial de facturación modal ── */}
      {showHistorial && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowHistorial(false)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "min(600px, 92vw)", maxHeight: "80vh", overflowY: "auto", boxShadow: "var(--shadow-xl)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Historial de facturación</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
                  <Printer size={13} /> Imprimir
                </button>
                <button onClick={() => setShowHistorial(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            {vm.suscripcionActual ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Plan {vm.suscripcionActual.plan?.nombre}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(vm.suscripcionActual.plan?.precio_mensual || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <span>Inicio: {vm.suscripcionActual.fecha_inicio ? new Date(vm.suscripcionActual.fecha_inicio).toLocaleDateString("es-PE") : "—"}</span>
                    <span>Vence: {vm.suscripcionActual.fecha_fin ? new Date(vm.suscripcionActual.fecha_fin).toLocaleDateString("es-PE") : "—"}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${vm.suscripcionActual.estado === "activa" ? "badge-ready" : "badge-pending"}`} style={{ fontSize: 10 }}>
                      {vm.suscripcionActual.estado === "activa" ? "Activa" : vm.suscripcionActual.estado}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  El historial completo de pagos estará disponible próximamente.
                </p>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No hay suscripción activa.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
