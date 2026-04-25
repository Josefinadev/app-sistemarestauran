"use client";

import { useSuscripcion } from "@/viewmodels/useSuscripcion";
import { formatPrecio } from "@/lib/utils";
import { Crown, Palette, CheckCircle2 } from "lucide-react";

export default function SuscripcionDashboard() {
  const vm = useSuscripcion();

  if (vm.loading) {
    return (
      <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* SECCIÓN: 1. PLAN ACTUAL */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Crown size={20} color="var(--primary)" />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: 0 }}>Suscripción</h2>
        </div>
        
        <div className="card-flat" style={{ padding: 24, background: "var(--primary-ghost)", border: "1px solid rgba(197, 160, 89, 0.2)"}}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px 0" }}>Plan Actual</p>
          <h3 style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", margin: "0 0 8px 0" }}>
            {vm.suscripcionActual?.plan?.nombre || "Ninguno"}
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            {vm.suscripcionActual ? `Estado: ${vm.suscripcionActual.estado.toUpperCase()}` : "Sin suscripción activa"}
          </p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          {vm.planes.map((plan) => (
            <div key={plan.id} className="card-flat" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 8px 0" }}>{plan.nombre}</h4>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0", flex: 1 }}>{plan.descripcion}</p>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
                S/ {formatPrecio(plan.precio_mensual)} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/ mes</span>
              </div>
              <button 
                className={`btn ${vm.suscripcionActual?.id_plan === plan.id ? "btn-secondary" : "btn-primary"}`}
                onClick={() => vm.handleCambiarPlan(plan.id)}
                disabled={vm.suscripcionActual?.id_plan === plan.id || vm.saving}
                style={{ width: "100%" }}
              >
                {vm.suscripcionActual?.id_plan === plan.id ? (
                  <><CheckCircle2 size={16}/> Plan Actual</>
                ) : (
                  "Seleccionar Plan"
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN: 2. PERSONALIZACION */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Palette size={20} color="var(--tertiary)" />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: 0 }}>Personalización</h2>
        </div>
        
        <div className="card-flat" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Configura los colores principales de tu app para los clientes. Tus clientes verán estos colores cuando escaneen tu QR.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 8 }}>Color Primario</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input 
                  type="color" 
                  value={vm.colorPrimario} 
                  onChange={(e) => vm.setColorPrimario(e.target.value)}
                  style={{ width: 44, height: 44, padding: 0, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }}
                />
                <input 
                  type="text" 
                  className="input" 
                  value={vm.colorPrimario} 
                  onChange={(e) => vm.setColorPrimario(e.target.value)}
                  style={{ flex: 1, fontFamily: "monospace" }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 8 }}>Color Secundario</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input 
                  type="color" 
                  value={vm.colorSecundario} 
                  onChange={(e) => vm.setColorSecundario(e.target.value)}
                  style={{ width: 44, height: 44, padding: 0, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }}
                />
                <input 
                  type="text" 
                  className="input" 
                  value={vm.colorSecundario} 
                  onChange={(e) => vm.setColorSecundario(e.target.value)}
                  style={{ flex: 1, fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>
          
          {/* Vista Previa */}
          <div style={{ marginTop: 32, padding: 24, borderRadius: 16, background: "var(--surface-hover)", border: "1px dashed var(--border)"}}>
            <h5 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "0 0 16px 0" }}>Vista Previa</h5>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn" style={{ background: vm.colorPrimario, color: "#fff", border: "none" }}>Botón Primario</button>
              <button className="btn" style={{ background: "transparent", color: vm.colorPrimario, border: `1px solid ${vm.colorPrimario}` }}>Botón Outline</button>
              <button className="btn" style={{ background: vm.colorSecundario, color: "#fff", border: "none" }}>Botón Secundario</button>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button className="btn btn-primary" onClick={vm.handleUpdateColors} disabled={vm.saving}>
              {vm.saving ? "Guardando..." : "Guardar Apariencia"}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
