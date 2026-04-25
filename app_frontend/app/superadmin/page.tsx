"use client";

import { useAuth } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Wine, Crown, LogOut, Plus, X, Loader2, 
  Layers, CheckSquare, Square, MapPin 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { crearRestaurante } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════
   VIEW — SuperAdmin SaaS Panel
   Gestión de inquilinos (restaurantes) y planes.
   ═══════════════════════════════════════════════════════════ */

export default function SuperAdminPage() {
  const { rol, _hasHydrated, logout } = useAuth();
  const router = useRouter();
  
  const [tab, setTab] = useState<"restaurantes" | "planes">("restaurantes");
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [planes, setPlanes] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [planModulos, setPlanModulos] = useState<Record<string, string[]>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    propietario_nombre: "",
    propietario_email: "",
    propietario_password: "",
    color_primario: "#C5A059",
    color_secundario: "#E2725B",
    latitud: -12.046374, // Default Lima
    longitud: -77.042793,
    radio_permitido_metros: 100
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: restData } = await supabase
        .from("restaurante")
        .select("*, restaurante_suscripcion!left(*, plan:suscripcion_plan(*))")
        .order("created_at", { ascending: false });
      
      if (restData) setRestaurantes(restData);

      const { data: planesData } = await supabase.from("suscripcion_plan").select("*");
      const { data: modulosData } = await supabase.from("suscripcion_modulo").select("*");
      const { data: relData } = await (supabase.from("suscripcion_plan_modulo") as any).select("*");
      
      if (planesData) setPlanes(planesData);
      if (modulosData) setModulos(modulosData);
      
      if (relData) {
        const mapping: Record<string, string[]> = {};
        (relData as any[]).forEach(r => {
          if (!mapping[r.id_plan]) mapping[r.id_plan] = [];
          mapping[r.id_plan].push(r.id_modulo);
        });
        setPlanModulos(mapping);
      }
    } catch (err) {
      console.error("Error loading superadmin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated) {
      if (rol !== "admin_saas") {
        router.push("/login");
      } else {
        loadData();
      }
    }
  }, [_hasHydrated, rol, router, loadData]);

  const handleCreateRestaurante = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await crearRestaurante(formData);
      setIsModalOpen(false);
      setFormData({ 
        nombre: "", slug: "", propietario_nombre: "", 
        propietario_email: "", propietario_password: "",
        color_primario: "#C5A059", color_secundario: "#E2725B",
        latitud: -12.046374, longitud: -77.042793,
        radio_permitido_metros: 100
      });
      loadData();
    } catch (error: any) {
      alert(error.message || "Error al crear restaurante");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModuloEnPlan = async (planId: string, moduloId: string) => {
    const isActivo = planModulos[planId]?.includes(moduloId);
    try {
      if (isActivo) {
        await (supabase.from("suscripcion_plan_modulo") as any).delete().eq("id_plan", planId).eq("id_modulo", moduloId);
      } else {
        await (supabase.from("suscripcion_plan_modulo") as any).insert({ id_plan: planId, id_modulo: moduloId });
      }
      loadData();
    } catch (err) {
      console.error("Error toggling module:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!_hasHydrated || rol !== "admin_saas") {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Loader2 className="spin-icon" color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, borderRight: "1px solid var(--border)", background: "var(--bg-elevated)", padding: 24, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: "var(--primary)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wine size={18} color="var(--text-inverse)" />
          </div>
          <span style={{ fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", fontSize: 18 }}>SaaS Panel</span>
        </div>
        
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => setTab("restaurantes")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: tab === "restaurantes" ? "var(--primary-ghost)" : "transparent", color: tab === "restaurantes" ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s", textAlign: "left", width: "100%", fontWeight: tab === "restaurantes" ? 600 : 400 }}><Crown size={18}/> Restaurantes</button>
          <button onClick={() => setTab("planes")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: tab === "planes" ? "var(--primary-ghost)" : "transparent", color: tab === "planes" ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s", textAlign: "left", width: "100%", fontWeight: tab === "planes" ? 600 : 400 }}><Layers size={18}/> Planes y Módulos</button>
        </nav>

        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-muted)", cursor: "pointer", marginTop: "auto" }}><LogOut size={18}/> Cerrar sesión</button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: 40 }}>
        {tab === "restaurantes" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>Restaurantes</h1>
                <p style={{ color: "var(--text-muted)", margin: "4px 0 0" }}>Gestiona los inquilinos (tenants) de la plataforma.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ gap: 8, height: 48, padding: "0 24px", borderRadius: 14 }}><Plus size={18} /> Nuevo Restaurante</button>
            </div>
            
            <div style={{ background: "var(--bg-elevated)", borderRadius: 24, border: "1px solid var(--border)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>RESTAURANTE</th>
                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>SLUG</th>
                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>UBICACIÓN</th>
                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>ESTILO</th>
                    <th style={{ textAlign: "left", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>PLAN ACTUAL</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurantes.map(r => {
                    const sub = r.restaurante_suscripcion?.[0];
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "20px 24px" }}><span style={{ fontWeight: 600, display: "block", color: "var(--text)" }}>{r.nombre}</span><span style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {r.id.slice(0,8)}...</span></td>
                        <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "var(--primary)", fontSize: 13 }}>/{r.slug}</td>
                        <td style={{ padding: "20px 24px" }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><MapPin size={12} /> {r.latitud.toFixed(4)}, {r.longitud.toFixed(4)}</div></td>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <div title={`Primario: ${r.color_primario}`} style={{ width: 20, height: 20, borderRadius: 6, background: r.color_primario || "#C5A059", border: "1px solid var(--border)" }} />
                            <div title={`Secundario: ${r.color_secundario}`} style={{ width: 20, height: 20, borderRadius: 6, background: r.color_secundario || "#E2725B", border: "1px solid var(--border)" }} />
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>{sub ? <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}><span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{sub.plan?.nombre}</span><span style={{ fontSize: 10, padding: "2px 8px", background: "var(--primary-ghost)", color: "var(--primary)", borderRadius: 6, width: "fit-content", fontWeight: 700 }}>{sub.estado.toUpperCase()}</span></div> : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin suscripción</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "planes" && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 32 }}><h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "var(--text)", letterSpacing: "-0.02em" }}>Estructura de Planes</h1><p style={{ color: "var(--text-muted)", margin: "4px 0 0" }}>Configura qué funciones incluye cada nivel de suscripción.</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>{planes.map(plan => (<div key={plan.id} style={{ background: "var(--bg-elevated)", borderRadius: 24, padding: 32, border: "1px solid var(--border)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text)" }}>{plan.nombre}</h3><span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>${plan.precio_mensual}<small style={{ fontSize: 12, opacity: 0.5 }}>/mes</small></span></div><div style={{ display: "flex", flexDirection: "column", gap: 12 }}><p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Módulos Incluidos</p>{modulos.map(mod => { const isActivo = planModulos[plan.id]?.includes(mod.id); return (<button key={mod.id} onClick={() => toggleModuloEnPlan(plan.id, mod.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isActivo ? "var(--primary-ghost)" : "transparent", border: `1px solid ${isActivo ? "var(--primary)" : "var(--border)"}`, borderRadius: 14, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>{isActivo ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--text-muted)" />}<div><span style={{ fontSize: 14, fontWeight: 600, color: isActivo ? "var(--text)" : "var(--text-muted)" }}>{mod.nombre}</span><span style={{ fontSize: 11, display: "block", opacity: 0.5, color: "var(--text-muted)" }}>{mod.descripcion}</span></div></button>); })}</div></div>))}</div>
          </div>
        )}
      </main>

      {/* Modal: Nuevo Restaurante */}
      {isModalOpen && (
        <>
          <div className="overlay" onClick={() => setIsModalOpen(false)} />
          <div className="modal" style={{ width: "95%", maxWidth: 640, padding: 32, borderRadius: 24, background: "var(--bg-elevated)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text)" }}>Nuevo Restaurante</h2><button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={24} /></button></div>
            <form onSubmit={handleCreateRestaurante} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label className="label">NOMBRE</label><input required className="input" placeholder="Ej: El Mijano" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                <div><label className="label">SLUG URL</label><input required className="input" placeholder="ej: el-mijano" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label className="label">DUEÑO (NOMBRE)</label><input required className="input" placeholder="Ej: Jose Sanchez" value={formData.propietario_nombre} onChange={e => setFormData({...formData, propietario_nombre: e.target.value})} /></div>
                <div><label className="label">EMAIL DE ACCESO</label><input required type="email" className="input" placeholder="dueño@email.com" value={formData.propietario_email} onChange={e => setFormData({...formData, propietario_email: e.target.value})} /></div>
              </div>
              <div><label className="label">CONTRASEÑA TEMPORAL</label><input required type="password" className="input" placeholder="••••••••" value={formData.propietario_password} onChange={e => setFormData({...formData, propietario_password: e.target.value})} /></div>
              
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                <p className="label" style={{ marginBottom: 12 }}>Configuración Geográfica y Estilo</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label className="label" style={{ fontSize: 10 }}>LATITUD</label><input type="number" step="any" className="input" value={formData.latitud} onChange={e => setFormData({...formData, latitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>LONGITUD</label><input type="number" step="any" className="input" value={formData.longitud} onChange={e => setFormData({...formData, longitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>RADIO (MT)</label><input type="number" className="input" value={formData.radio_permitido_metros} onChange={e => setFormData({...formData, radio_permitido_metros: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label className="label" style={{ fontSize: 10 }}>PRIMARIO</label><input type="color" className="input" style={{ height: 40, padding: 4 }} value={formData.color_primario} onChange={e => setFormData({...formData, color_primario: e.target.value})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>SECUNDARIO</label><input type="color" className="input" style={{ height: 40, padding: 4 }} value={formData.color_secundario} onChange={e => setFormData({...formData, color_secundario: e.target.value})} /></div>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: "100%", height: 54, marginTop: 12, borderRadius: 16, fontSize: 16, fontWeight: 700 }}>{isLoading ? <Loader2 className="spin-icon" size={20} /> : "Registrar Restaurante"}</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
