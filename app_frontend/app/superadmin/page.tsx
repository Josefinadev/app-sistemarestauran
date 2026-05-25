"use client";

import { useAuth } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Wine, Crown, LogOut, Plus, X, Loader2, 
  Layers, CheckSquare, Square, MapPin, Trash2, Eye, EyeOff,
  Pencil, Save, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { crearRestaurante, eliminarRestaurante, actualizarRestaurante } from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { resetRestauranteBranding } from "@/lib/branding";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   VIEW — SuperAdmin SaaS Panel
   Gestión de inquilinos (restaurantes) y planes.
   Incluye creación, edición completa y eliminación.
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states — Crear restaurante
  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    propietario_nombre: "",
    propietario_email: "",
    propietario_password: "",
    color_primario: "#C5A059",
    color_secundario: "#E2725B",
    logo_url: "",
    hero_banner_url: "",
    latitud: -12.046374, // Default Lima
    longitud: -77.042793,
    radio_permitido_metros: 100
  });

  // Form states — Editar restaurante
  const [editData, setEditData] = useState({
    id: "",
    nombre: "",
    slug: "",
    color_primario: "#C5A059",
    color_secundario: "#E2725B",
    logo_url: "",
    hero_banner_url: "",
    latitud: -12.046374,
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
        resetRestauranteBranding(); // Asegura el color original
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
        logo_url: "", hero_banner_url: "",
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

  // ── Abrir modal de edición con datos pre-cargados ──
  const handleOpenEdit = (restaurante: any) => {
    setEditData({
      id: restaurante.id,
      nombre: restaurante.nombre || "",
      slug: restaurante.slug || "",
      color_primario: restaurante.color_primario || "#C5A059",
      color_secundario: restaurante.color_secundario || "#E2725B",
      logo_url: restaurante.logo_url || "",
      hero_banner_url: restaurante.hero_banner_url || "",
      latitud: restaurante.latitud ?? -12.046374,
      longitud: restaurante.longitud ?? -77.042793,
      radio_permitido_metros: restaurante.radio_permitido_metros ?? 100,
    });
    setSaveSuccess(false);
    setIsEditModalOpen(true);
  };

  // ── Guardar edición — respuesta inmediata con optimistic UI ──
  const handleUpdateRestaurante = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Optimistic UI: actualizar la lista localmente ANTES de la respuesta del servidor
    const optimisticData = { ...editData };
    setRestaurantes((prev) =>
      prev.map((r) =>
        r.id === editData.id
          ? { ...r, ...optimisticData }
          : r
      )
    );

    try {
      const { id, ...updateFields } = editData;
      await actualizarRestaurante(id, updateFields);
      setSaveSuccess(true);
      // Refrescar datos reales del servidor en segundo plano
      loadData();
      // Cerrar modal después de un breve feedback visual
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 800);
    } catch (error: any) {
      // Revertir optimistic UI si falla
      loadData();
      alert(error.message || "Error al actualizar restaurante");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRestaurante = async (restaurante: any) => {
    const ok = confirm(`¿Eliminar por completo "${restaurante.nombre}"? Esta acción borrará usuarios, pedidos, menú, imágenes y configuración asociada.`);
    if (!ok) return;

    setDeletingId(restaurante.id);
    try {
      await eliminarRestaurante(restaurante.id);
      // Optimistic: remover inmediatamente de la lista
      setRestaurantes((prev) => prev.filter((r) => r.id !== restaurante.id));
      alert("Restaurante eliminado completamente.");
    } catch (error: any) {
      alert(error.message || "Error al eliminar restaurante");
    } finally {
      setDeletingId(null);
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
                    <th style={{ textAlign: "right", padding: "16px 24px", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurantes.map(r => {
                    const sub = r.restaurante_suscripcion?.[0];
                    const prim = (typeof r.color_primario === "string" && r.color_primario.startsWith("#")) ? r.color_primario : "#C5A059";
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 10, height: 34, borderRadius: 999, background: prim, boxShadow: `0 0 0 1px rgba(255,255,255,0.08)` }} />
                            <div>
                              <span style={{ fontWeight: 700, display: "block", color: prim }}>{r.nombre}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {r.id.slice(0,8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "var(--primary)", fontSize: 13 }}>/{r.slug}</td>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><MapPin size={12} /> {r.latitud?.toFixed(4)}, {r.longitud?.toFixed(4)}</div>
                            <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 600 }}>Radio: {r.radio_permitido_metros || 100}m</span>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <div title={`Primario: ${r.color_primario}`} style={{ width: 20, height: 20, borderRadius: 6, background: r.color_primario || "#C5A059", border: "1px solid var(--border)" }} />
                            <div title={`Secundario: ${r.color_secundario}`} style={{ width: 20, height: 20, borderRadius: 6, background: r.color_secundario || "#E2725B", border: "1px solid var(--border)" }} />
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>{sub ? <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}><span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{sub.plan?.nombre}</span><span style={{ fontSize: 10, padding: "2px 8px", background: "var(--primary-ghost)", color: "var(--primary)", borderRadius: 6, width: "fit-content", fontWeight: 700 }}>{sub.estado.toUpperCase()}</span></div> : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin suscripción</span>}</td>
                        <td style={{ padding: "20px 24px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            {/* Botón Ver Web */}
                            <Link
                              href={`/${r.slug}`}
                              target="_blank"
                              title="Ver página web"
                              style={{
                                width: 38, height: 38, borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)",
                                color: "var(--text)",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >
                              <Eye size={16} />
                            </Link>
                            {/* Botón Editar */}
                            <button
                              onClick={() => handleOpenEdit(r)}
                              title="Editar restaurante"
                              style={{
                                width: 38, height: 38, borderRadius: 12,
                                border: "1px solid rgba(197,160,89,0.3)",
                                background: "rgba(197,160,89,0.08)",
                                color: "var(--primary)",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            {/* Botón Eliminar */}
                            <button
                              onClick={() => handleDeleteRestaurante(r)}
                              disabled={deletingId === r.id}
                              title="Eliminar restaurante"
                              style={{
                                width: 38, height: 38, borderRadius: 12,
                                border: "1px solid rgba(239,68,68,0.25)",
                                background: "rgba(239,68,68,0.08)",
                                color: "var(--error)",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                cursor: deletingId === r.id ? "wait" : "pointer",
                              }}
                            >
                              {deletingId === r.id ? <Loader2 className="spin-icon" size={16} /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </td>
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

      {/* ═══════ Modal: Nuevo Restaurante ═══════ */}
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
              <div><label className="label">CONTRASEÑA TEMPORAL</label><div style={{ position: "relative" }}><input required type={showOwnerPassword ? "text" : "password"} className="input" placeholder="••••••••" value={formData.propietario_password} onChange={e => setFormData({...formData, propietario_password: e.target.value})} style={{ paddingRight: 44 }} /><button type="button" onClick={() => setShowOwnerPassword(!showOwnerPassword)} aria-label={showOwnerPassword ? "Ocultar contraseña" : "Mostrar contraseña"} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "grid", placeItems: "center" }}>{showOwnerPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
              
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                <p className="label" style={{ marginBottom: 12 }}>Configuración Geográfica y Estilo</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label className="label" style={{ fontSize: 10 }}>LATITUD</label><input required type="number" step="any" className="input" value={Number.isNaN(formData.latitud) ? "" : formData.latitud} onChange={e => setFormData({...formData, latitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>LONGITUD</label><input required type="number" step="any" className="input" value={Number.isNaN(formData.longitud) ? "" : formData.longitud} onChange={e => setFormData({...formData, longitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>RADIO (MT)</label><input required type="number" min="10" className="input" value={Number.isNaN(formData.radio_permitido_metros) ? "" : formData.radio_permitido_metros} onChange={e => setFormData({...formData, radio_permitido_metros: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ background: "rgba(197,160,89,0.06)", padding: 12, borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <AlertCircle size={16} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    La <strong style={{ color: "var(--primary)" }}>latitud</strong>, <strong style={{ color: "var(--primary)" }}>longitud</strong> y <strong style={{ color: "var(--primary)" }}>radio</strong> son obligatorios. Solo los clientes dentro del perímetro podrán realizar pedidos. Esto previene pedidos falsos desde fuera del restaurante.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label className="label" style={{ fontSize: 10 }}>PRIMARIO</label><input type="color" className="input" style={{ height: 40, padding: 4 }} value={formData.color_primario} onChange={e => setFormData({...formData, color_primario: e.target.value})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>SECUNDARIO</label><input type="color" className="input" style={{ height: 40, padding: 4 }} value={formData.color_secundario} onChange={e => setFormData({...formData, color_secundario: e.target.value})} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                  <ImageUploadInput label="Logo" value={formData.logo_url} onChange={(url) => setFormData({...formData, logo_url: url})} height={130} />
                  <ImageUploadInput label="Hero banner" value={formData.hero_banner_url} onChange={(url) => setFormData({...formData, hero_banner_url: url})} height={130} hint="Imagen de portada del restaurante" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: "100%", height: 54, marginTop: 12, borderRadius: 16, fontSize: 16, fontWeight: 700 }}>{isLoading ? <Loader2 className="spin-icon" size={20} /> : "Registrar Restaurante"}</button>
            </form>
          </div>
        </>
      )}

      {/* ═══════ Modal: Editar Restaurante ═══════ */}
      {isEditModalOpen && (
        <>
          <div className="overlay" onClick={() => setIsEditModalOpen(false)} />
          <div className="modal" style={{ width: "95%", maxWidth: 640, padding: 32, borderRadius: 24, background: "var(--bg-elevated)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: editData.color_primario, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={16} color="#fff" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text)" }}>Editar Restaurante</h2>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={24} /></button>
            </div>

            <form onSubmit={handleUpdateRestaurante} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nombre y Slug */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label className="label">NOMBRE</label><input required className="input" placeholder="Nombre del restaurante" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} /></div>
                <div><label className="label">SLUG URL</label><input required className="input" placeholder="ej: el-mijano" value={editData.slug} onChange={e => setEditData({...editData, slug: e.target.value})} /></div>
              </div>

              {/* Configuración Geográfica */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                <p className="label" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><MapPin size={14} /> Configuración Geográfica</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div><label className="label" style={{ fontSize: 10 }}>LATITUD</label><input required type="number" step="any" className="input" value={Number.isNaN(editData.latitud) ? "" : editData.latitud} onChange={e => setEditData({...editData, latitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>LONGITUD</label><input required type="number" step="any" className="input" value={Number.isNaN(editData.longitud) ? "" : editData.longitud} onChange={e => setEditData({...editData, longitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10 }}>RADIO (MT)</label><input required type="number" min="10" className="input" value={Number.isNaN(editData.radio_permitido_metros) ? "" : editData.radio_permitido_metros} onChange={e => setEditData({...editData, radio_permitido_metros: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ background: "rgba(197,160,89,0.06)", padding: 10, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <AlertCircle size={14} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                    Solo clientes dentro de <strong style={{ color: "var(--primary)" }}>{editData.radio_permitido_metros}m</strong> del restaurante podrán hacer pedidos.
                  </p>
                </div>
              </div>

              {/* Colores */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                <p className="label" style={{ marginBottom: 12 }}>Colores Personalizados</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="label" style={{ fontSize: 10 }}>PRIMARIO</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="color" className="input" style={{ height: 40, width: 60, padding: 4 }} value={editData.color_primario} onChange={e => setEditData({...editData, color_primario: e.target.value})} />
                      <input type="text" className="input" style={{ fontFamily: "monospace", fontSize: 12 }} value={editData.color_primario} onChange={e => setEditData({...editData, color_primario: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 10 }}>SECUNDARIO</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="color" className="input" style={{ height: 40, width: 60, padding: 4 }} value={editData.color_secundario} onChange={e => setEditData({...editData, color_secundario: e.target.value})} />
                      <input type="text" className="input" style={{ fontFamily: "monospace", fontSize: 12 }} value={editData.color_secundario} onChange={e => setEditData({...editData, color_secundario: e.target.value})} />
                    </div>
                  </div>
                </div>
                {/* Preview de colores */}
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: editData.color_primario, border: "2px solid rgba(255,255,255,0.1)" }} />
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: editData.color_secundario, border: "2px solid rgba(255,255,255,0.1)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Vista previa de colores</span>
                </div>
              </div>

              {/* Imágenes */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                <p className="label" style={{ marginBottom: 12 }}>Imágenes</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <ImageUploadInput label="Logo" value={editData.logo_url} onChange={(url) => setEditData({...editData, logo_url: url})} height={130} />
                  <ImageUploadInput label="Hero banner" value={editData.hero_banner_url} onChange={(url) => setEditData({...editData, hero_banner_url: url})} height={130} hint="Imagen de portada" />
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{
                  width: "100%", height: 54, marginTop: 12, borderRadius: 16,
                  fontSize: 16, fontWeight: 700, gap: 10,
                  background: saveSuccess ? "var(--success, #22c55e)" : undefined,
                  transition: "background 0.3s ease",
                }}
              >
                {isSaving ? (
                  <><Loader2 className="spin-icon" size={20} /> Guardando...</>
                ) : saveSuccess ? (
                  <><CheckSquare size={20} /> ¡Guardado!</>
                ) : (
                  <><Save size={20} /> Guardar Cambios</>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
