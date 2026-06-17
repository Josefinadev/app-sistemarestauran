"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";
import {
  getWebConfig, saveWebConfig, getWebCombos, crearWebCombo, actualizarWebCombo,
  eliminarWebCombo, getWebOfertas, crearWebOferta, actualizarWebOferta, eliminarWebOferta,
  uploadImage, actualizarRestauranteBranding,
} from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { toast } from "@/lib/toast";
import {
  Gift, Plus, Trash2, Pencil, Save, CheckCircle2, Star,
  MessageCircle, Loader2, Upload, ImagePlus, Flame, Phone, MapPin, Clock, Eye,
  Globe, Package, Sparkles, Settings,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";

/* ═══════════════════════════════════════════════════════════
   ADMIN — Gestión de Web Pública (Wine Design)
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { key: "combos", label: "Combos & Paquetes", Icon: Gift },
  { key: "ofertas", label: "Ofertas", Icon: Sparkles },
  { key: "config", label: "Configuración", Icon: Settings },
] as const;

export default function GestionWebPage() {
  const { restaurante, setRestaurante } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("combos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVisual, setSavingVisual] = useState(false);

  const [combos, setCombos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [searchCombos, setSearchCombos] = useState("");
  const [searchOfertas, setSearchOfertas] = useState("");
  const [webConfig, setWebConfig] = useState({ whatsapp: "", telefono: "", direccion: "", horario_semana: "", horario_finde: "" });
  const [visualConfig, setVisualConfig] = useState({ color_primario: "#C5A059", color_secundario: "#E2725B", logo_url: "", hero_banner_url: "" });

  const [showComboModal, setShowComboModal] = useState(false);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [editingOferta, setEditingOferta] = useState<any>(null);
  const [newCombo, setNewCombo] = useState({ nombre: "", descripcion: "", precio: "", precio_original: "", incluye: [] as string[], popular: false, imagen_url: "", incluye_input: "" });
  const [newOferta, setNewOferta] = useState({ titulo: "", descripcion: "", descuento: "", imagen_url: "" });
  const [uploading, setUploading] = useState(false);
  const comboFileRef = useRef<HTMLInputElement>(null);
  const ofertaFileRef = useRef<HTMLInputElement>(null);

  const id_restaurante = restaurante?.id;

  useEffect(() => {
    if (id_restaurante) loadData();
    else setLoading(false);
  }, [id_restaurante]);

  useEffect(() => {
    if (!restaurante) return;
    setVisualConfig({
      color_primario: restaurante.color_primario || "#C5A059",
      color_secundario: restaurante.color_secundario || "#E2725B",
      logo_url: restaurante.logo_url || "",
      hero_banner_url: restaurante.hero_banner_url || "",
    });
  }, [restaurante?.id, restaurante?.color_primario, restaurante?.color_secundario, restaurante?.logo_url, restaurante?.hero_banner_url]);

  const loadData = async () => {
    if (!id_restaurante) return;
    setLoading(true);
    try {
      const [configData, combosData, ofertasData] = await Promise.allSettled([
        getWebConfig(id_restaurante),
        getWebCombos(id_restaurante),
        getWebOfertas(id_restaurante),
      ]);
      if (configData.status === "fulfilled" && configData.value) setWebConfig(prev => ({ ...prev, ...configData.value }));
      if (combosData.status === "fulfilled") setCombos(combosData.value || []);
      if (ofertasData.status === "fulfilled") setOfertas(ofertasData.value || []);
    } catch (err) {
      console.error("Error loading web data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, target: "combo" | "oferta") => {
    setUploading(true);
    try {
      const url = await uploadImage(file, "web");
      if (target === "combo") setNewCombo(prev => ({ ...prev, imagen_url: url }));
      else setNewOferta(prev => ({ ...prev, imagen_url: url }));
    } catch (err: any) {
      toast.error({ message: "Error al subir imagen", description: err.message });
    } finally { setUploading(false); }
  };

  const handleSaveConfig = async () => {
    if (!id_restaurante) return;
    setSaving(true);
    try {
      await saveWebConfig({ id_restaurante, ...webConfig });
      toast.success({ message: "Configuración guardada", description: "Tu web ya refleja los cambios." });
    } catch (err: any) {
      toast.error({ message: "Error al guardar", description: err?.message });
    } finally { setSaving(false); }
  };

  const handleSaveVisual = async () => {
    if (!id_restaurante) return;
    setSavingVisual(true);
    try {
      const updated = await actualizarRestauranteBranding(id_restaurante, visualConfig);
      setRestaurante({ ...restaurante, ...updated } as any);
      toast.success({ message: "Identidad visual guardada" });
    } catch (err: any) {
      toast.error({ message: "Error al guardar", description: err?.message });
    } finally { setSavingVisual(false); }
  };

  // ── Combos ──
  const openComboModal = (combo?: any) => {
    if (combo) {
      setEditingCombo(combo);
      setNewCombo({
        nombre: combo.nombre, descripcion: combo.descripcion || "",
        precio: String(combo.precio), precio_original: combo.precio_original ? String(combo.precio_original) : "",
        incluye: combo.incluye || [], popular: combo.popular || false, imagen_url: combo.imagen_url || "", incluye_input: "",
      });
    } else {
      setEditingCombo(null);
      setNewCombo({ nombre: "", descripcion: "", precio: "", precio_original: "", incluye: [], popular: false, imagen_url: "", incluye_input: "" });
    }
    setShowComboModal(true);
  };

  const closeComboModal = () => { setShowComboModal(false); setEditingCombo(null); };

  const handleAddIncluyeItem = () => {
    const item = newCombo.incluye_input.trim();
    if (!item) return;
    setNewCombo(prev => ({ ...prev, incluye: [...prev.incluye, item], incluye_input: "" }));
  };

  const handleRemoveIncluyeItem = (i: number) => {
    setNewCombo(prev => ({ ...prev, incluye: prev.incluye.filter((_, idx) => idx !== i) }));
  };

  const handleSaveCombo = async () => {
    if (!id_restaurante || !newCombo.nombre || !newCombo.precio) return;
    try {
      const data: any = {
        id_restaurante, nombre: newCombo.nombre, descripcion: newCombo.descripcion,
        precio: parseFloat(newCombo.precio),
        precio_original: newCombo.precio_original ? parseFloat(newCombo.precio_original) : null,
        incluye: newCombo.incluye, popular: newCombo.popular, imagen_url: newCombo.imagen_url || "/assets/placeholder-dish.png",
      };
      if (editingCombo) {
        await actualizarWebCombo(editingCombo.id, data);
        toast.success({ message: "Combo actualizado", description: newCombo.nombre });
      } else {
        await crearWebCombo(data);
        toast.success({ message: "Combo creado", description: newCombo.nombre });
      }
      closeComboModal(); loadData();
    } catch (err: any) { toast.error({ message: "No se pudo guardar", description: err?.message }); }
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm("¿Eliminar este combo?")) return;
    try { await eliminarWebCombo(id); loadData(); toast.success({ message: "Combo eliminado" }); }
    catch (err: any) { toast.error({ message: "No se pudo eliminar", description: err?.message }); }
  };

  // ── Ofertas ──
  const openOfertaModal = (oferta?: any) => {
    if (oferta) {
      setEditingOferta(oferta);
      setNewOferta({ titulo: oferta.titulo, descripcion: oferta.descripcion || "", descuento: oferta.descuento || "", imagen_url: oferta.imagen_url || "" });
    } else {
      setEditingOferta(null);
      setNewOferta({ titulo: "", descripcion: "", descuento: "", imagen_url: "" });
    }
    setShowOfertaModal(true);
  };

  const closeOfertaModal = () => { setShowOfertaModal(false); setEditingOferta(null); };

  const handleSaveOferta = async () => {
    if (!id_restaurante || !newOferta.titulo) return;
    try {
      const data: any = { id_restaurante, titulo: newOferta.titulo, descripcion: newOferta.descripcion, descuento: newOferta.descuento, imagen_url: newOferta.imagen_url || null, activo: true };
      if (editingOferta) {
        await actualizarWebOferta(editingOferta.id, data);
        toast.success({ message: "Oferta actualizada" });
      } else {
        await crearWebOferta(data);
        toast.success({ message: "Oferta creada" });
      }
      closeOfertaModal(); loadData();
    } catch (err: any) { toast.error({ message: "No se pudo guardar", description: err?.message }); }
  };

  const handleDeleteOferta = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta?")) return;
    try { await eliminarWebOferta(id); loadData(); toast.success({ message: "Oferta eliminada" }); }
    catch (err: any) { toast.error({ message: "No se pudo eliminar", description: err?.message }); }
  };

  // ── Image picker ──
  const ImagePicker = ({ value, onChange, isUploading, fileRef: ref, target }: { value: string; onChange: (url: string) => void; isUploading: boolean; fileRef: React.RefObject<HTMLInputElement | null>; target: "combo" | "oferta" }) => (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "2px dashed var(--border)", background: "var(--surface-hover)", minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, target); e.target.value = ""; }} />
      {value ? (
        <>
          <img src={value} alt="Imagen" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, background: "rgba(0,0,0,0.5)", padding: "6px 12px", borderRadius: 8 }}>Cambiar imagen</span>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 20 }}>
          {isUploading ? <Loader2 className="spin-icon" size={28} color="var(--primary)" /> : <ImagePlus size={28} color="var(--text-muted)" />}
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", margin: 0 }}>Arrastra una imagen aquí</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>o haz clic para seleccionar</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Formatos: JPG, PNG · Máx. 5MB</p>
        </div>
      )}
    </div>
  );

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}><Loader2 className="spin-icon" color="var(--primary)" size={32} /></div>;

  const filteredCombos = combos.filter(c => c.nombre?.toLowerCase().includes(searchCombos.toLowerCase()));
  const filteredOfertas = ofertas.filter(o => o.titulo?.toLowerCase().includes(searchOfertas.toLowerCase()));

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab bar */}
      <div className="wine-tab-bar">
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`wine-tab-btn ${activeTab === tab.key ? "wine-tab-btn--active" : ""}`}>
              <Icon size={13} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ COMBOS ═══ */}
      {activeTab === "combos" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Buscar combos por nombre..." value={searchCombos} onChange={(e) => setSearchCombos(e.target.value)} className="input" style={{ paddingLeft: 36, width: 280 }} />
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <button onClick={() => openComboModal()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Crear combo
            </button>
          </div>
          {filteredCombos.length === 0 ? (
            <div className="card-flat" style={{ padding: 48, textAlign: "center" }}>
              <Gift size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 4px" }}>No hay combos configurados</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Crea tu primer combo para mostrar en tu web</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredCombos.map((combo) => (
                <div key={combo.id} className="card-flat" style={{ overflow: "hidden", position: "relative" }}>
                  <div style={{ height: 180, overflow: "hidden", background: "var(--surface-hover)", position: "relative" }}>
                    <img src={combo.imagen_url || "/assets/placeholder-dish.png"} alt={combo.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {combo.popular && (
                      <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "var(--primary)", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={9} fill="currentColor" /> Popular
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{combo.nombre}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>{combo.descripcion}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                      {(combo.incluye || []).slice(0, 3).map((item: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                          <CheckCircle2 size={12} color="var(--success)" /> {item}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        {combo.precio_original && <span style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "line-through", marginRight: 8 }}>S/{combo.precio_original}</span>}
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>S/ {Number(combo.precio).toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openComboModal(combo)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteCombo(combo.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", color: "var(--secondary)" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ OFERTAS ═══ */}
      {activeTab === "ofertas" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Buscar ofertas..." value={searchOfertas} onChange={(e) => setSearchOfertas(e.target.value)} className="input" style={{ paddingLeft: 36, width: 280 }} />
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <button onClick={() => openOfertaModal()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Crear oferta
            </button>
          </div>
          {filteredOfertas.length === 0 ? (
            <div className="card-flat" style={{ padding: 48, textAlign: "center" }}>
              <Sparkles size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>No hay ofertas configuradas</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filteredOfertas.map((oferta) => (
                <div key={oferta.id} className="card-flat" style={{ overflow: "hidden", position: "relative" }}>
                  {oferta.imagen_url && (
                    <div style={{ height: 160, overflow: "hidden", background: "var(--surface-hover)", position: "relative" }}>
                      <img src={oferta.imagen_url} alt={oferta.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {oferta.descuento && (
                        <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "var(--primary)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                          {oferta.descuento}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: 14 }}>
                    {!oferta.imagen_url && oferta.descuento && (
                      <span style={{ display: "inline-block", padding: "3px 10px", background: "rgba(197,160,89,0.1)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>{oferta.descuento}</span>
                    )}
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{oferta.titulo}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>{oferta.descripcion}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge badge-ready" style={{ fontSize: 10 }}>{oferta.activo ? "Activa" : "Inactiva"}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openOfertaModal(oferta)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteOferta(oferta.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", color: "var(--secondary)" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Mostrando 1 a {filteredOfertas.length} de {filteredOfertas.length} ofertas</p>
        </div>
      )}

      {/* ═══ CONFIG ═══ */}
      {activeTab === "config" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "flex-start" }}>
          {/* Left: form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 1. Identidad visual */}
            <div className="card-flat" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>1. Identidad visual</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px" }}>Define los colores, logo y elementos visuales de tu sitio web.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>Color primario</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)" }}>
                    <input type="color" value={visualConfig.color_primario} onChange={(e) => setVisualConfig({ ...visualConfig, color_primario: e.target.value })} style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 0 }} />
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text)" }}>{visualConfig.color_primario}</span>
                    <Pencil size={12} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>Color secundario</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)" }}>
                    <input type="color" value={visualConfig.color_secundario} onChange={(e) => setVisualConfig({ ...visualConfig, color_secundario: e.target.value })} style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 0 }} />
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text)" }}>{visualConfig.color_secundario}</span>
                    <Pencil size={12} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <ImageUploadInput label="Logo" value={visualConfig.logo_url} onChange={(url) => setVisualConfig({ ...visualConfig, logo_url: url })} height={120} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>Banner principal (Hero)</p>
                  {visualConfig.hero_banner_url ? (
                    <div style={{ borderRadius: 10, overflow: "hidden", height: 80, border: "1px solid var(--border)" }}>
                      <img src={visualConfig.hero_banner_url} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ height: 80, border: "1px dashed var(--border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-hover)" }}>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin banner</p>
                    </div>
                  )}
                  <ImageUploadInput label="" value={visualConfig.hero_banner_url} onChange={(url) => setVisualConfig({ ...visualConfig, hero_banner_url: url })} height={0} hint="1920x800 px. JPG, PNG. Máx. 5MB." />
                </div>
              </div>
            </div>

            {/* 2. Contacto */}
            <div className="card-flat" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>2. Contacto</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px" }}>Administra la información de contacto que se mostrará en tu sitio.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <MessageCircle size={12} /> WhatsApp
                  </p>
                  <input className="input" value={webConfig.whatsapp} onChange={(e) => setWebConfig({ ...webConfig, whatsapp: e.target.value })} placeholder="+51 987 654 321" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Phone size={12} /> Teléfono
                  </p>
                  <input className="input" value={webConfig.telefono} onChange={(e) => setWebConfig({ ...webConfig, telefono: e.target.value })} placeholder="(01) 234 5678" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={12} /> Dirección
                  </p>
                  <input className="input" value={webConfig.direccion} onChange={(e) => setWebConfig({ ...webConfig, direccion: e.target.value })} placeholder="Av. Larco 1234, Lima, Perú" />
                </div>
              </div>
            </div>

            {/* 3. Horarios */}
            <div className="card-flat" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>3. Horarios</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px" }}>Define los horarios de atención que se mostrarán en tu sitio web.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} /> Lunes – Viernes
                  </p>
                  <input className="input" value={webConfig.horario_semana} onChange={(e) => setWebConfig({ ...webConfig, horario_semana: e.target.value })} placeholder="12:00 p.m. – 11:00 p.m." />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} /> Sábado – Domingo
                  </p>
                  <input className="input" value={webConfig.horario_finde} onChange={(e) => setWebConfig({ ...webConfig, horario_finde: e.target.value })} placeholder="11:30 a.m. – 12:00 a.m." />
                </div>
              </div>
            </div>

            {/* Save button */}
            <button onClick={async () => { await handleSaveVisual(); await handleSaveConfig(); }} disabled={saving || savingVisual} className="btn btn-primary" style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 8, padding: "12px 24px" }}>
              {(saving || savingVisual) ? <Loader2 className="spin-icon" size={14} /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>

          {/* Right: Live preview */}
          <div style={{ position: "sticky", top: 16 }}>
            <div className="card-flat" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>Vista previa en vivo</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Así se verá tu sitio web con la configuración actual.</p>
              </div>
              <div style={{ background: "var(--surface-hover)", padding: 12 }}>
                {/* Mini browser preview */}
                <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
                  {/* Preview navbar */}
                  <div style={{ padding: "10px 14px", background: "#fff", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: visualConfig.color_primario, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Globe size={14} color="#fff" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#111", margin: 0 }}>{restaurante?.nombre || "Restaurante"}</p>
                      </div>
                    </div>
                    <div style={{ width: 20, height: 14, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ height: 1.5, background: "#333", borderRadius: 2 }} />)}
                    </div>
                  </div>
                  {/* Preview hero */}
                  <div style={{ height: 120, background: `linear-gradient(135deg, ${visualConfig.color_secundario}dd, ${visualConfig.color_primario})`, position: "relative", overflow: "hidden" }}>
                    {visualConfig.hero_banner_url && <img src={visualConfig.hero_banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />}
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12 }}>
                      <p style={{ fontSize: 9, color: visualConfig.color_primario, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Experiencias que perduran</p>
                      <p style={{ fontSize: 14, color: "#fff", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2 }}>Buena comida,<br />buenos momentos.</p>
                      <button style={{ alignSelf: "flex-start", padding: "5px 12px", background: visualConfig.color_primario, color: "#fff", border: "none", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "default" }}>
                        Reservar ahora →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--surface-hover)", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Eye size={10} /> La vista previa es aproximada.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMBO MODAL ═══ */}
      <Modal
        open={showComboModal}
        onClose={closeComboModal}
        title={editingCombo ? "Editar combo" : "Crear nuevo combo"}
        description="Crea paquetes con precio especial."
        icon={<Gift size={18} />}
        accentColor="var(--primary)"
        size="lg"
        footer={
          <ModalFooter>
            <button onClick={closeComboModal} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSaveCombo} className="btn btn-primary">{editingCombo ? "Actualizar" : "Guardar combo"}</button>
          </ModalFooter>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          {/* Left: image */}
          <div>
            <ImagePicker value={newCombo.imagen_url} onChange={(url) => setNewCombo({ ...newCombo, imagen_url: url })} isUploading={uploading} fileRef={comboFileRef} target="combo" />
          </div>
          {/* Right: form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="premium-field">
              <label className="premium-field-label">Nombre *</label>
              <input className="input" placeholder="Ej: Combo Clásico" value={newCombo.nombre} onChange={(e) => setNewCombo({ ...newCombo, nombre: e.target.value })} autoFocus />
            </div>
            <div className="premium-field">
              <label className="premium-field-label">Descripción *</label>
              <textarea className="input" placeholder="Describe brevemente este combo..." value={newCombo.descripcion} onChange={(e: any) => setNewCombo({ ...newCombo, descripcion: e.target.value })} rows={2} style={{ resize: "none", fontFamily: "inherit" }} maxLength={120} />
              <span className="premium-field-hint" style={{ textAlign: "right" }}>{newCombo.descripcion.length}/120</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="premium-field">
                <label className="premium-field-label">Precio del combo (S/) *</label>
                <input className="input" placeholder="Ej: 35.00" type="number" step="0.01" value={newCombo.precio} onChange={(e) => setNewCombo({ ...newCombo, precio: e.target.value })} />
              </div>
              <div className="premium-field">
                <label className="premium-field-label">Precio original (S/)</label>
                <input className="input" placeholder="Ej: 45.00" type="number" step="0.01" value={newCombo.precio_original} onChange={(e) => setNewCombo({ ...newCombo, precio_original: e.target.value })} />
                <span className="premium-field-hint">Dejar vacío si no tiene precio original</span>
              </div>
            </div>
          </div>
        </div>
        {/* Include items */}
        <div className="premium-field" style={{ marginTop: 8 }}>
          <label className="premium-field-label">¿Qué incluye? *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input" placeholder="Agrega los productos incluidos en el combo..."
              value={newCombo.incluye_input}
              onChange={(e) => setNewCombo({ ...newCombo, incluye_input: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddIncluyeItem(); } }}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleAddIncluyeItem} className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Agregar
            </button>
          </div>
          {newCombo.incluye.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {newCombo.incluye.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-hover)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 14, color: "var(--text-muted)", cursor: "grab" }}>⋮⋮</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{item}</span>
                  <button type="button" onClick={() => handleRemoveIncluyeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--secondary)", padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: newCombo.popular ? "rgba(197,160,89,0.06)" : "transparent" }}>
          <input type="checkbox" checked={newCombo.popular} onChange={(e) => setNewCombo({ ...newCombo, popular: e.target.checked })} style={{ accentColor: "var(--primary)" }} />
          <Star size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, color: "var(--text)" }}>Marcar como popular</span>
        </label>
      </Modal>

      {/* ═══ OFERTA MODAL ═══ */}
      <Modal
        open={showOfertaModal}
        onClose={closeOfertaModal}
        title={editingOferta ? "Editar oferta" : "Nueva oferta"}
        description="Promociones que aparecen en la portada de la web."
        icon={<Sparkles size={18} />}
        accentColor="var(--secondary)"
        size="lg"
        footer={
          <ModalFooter>
            <button onClick={closeOfertaModal} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSaveOferta} className="btn btn-primary" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
              {editingOferta ? "Actualizar" : "Guardar oferta"}
            </button>
          </ModalFooter>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "flex-start" }}>
          {/* Left: form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>Imagen</p>
              <ImagePicker value={newOferta.imagen_url} onChange={(url) => setNewOferta({ ...newOferta, imagen_url: url })} isUploading={uploading} fileRef={ofertaFileRef} target="oferta" />
            </div>
            <div className="premium-field">
              <label className="premium-field-label">Título</label>
              <input className="input" placeholder="Ej: Martes de Pastas" value={newOferta.titulo} onChange={(e) => setNewOferta({ ...newOferta, titulo: e.target.value })} autoFocus />
            </div>
            <div className="premium-field">
              <label className="premium-field-label">Descripción</label>
              <textarea className="input" placeholder="Describe brevemente la oferta..." value={newOferta.descripcion} onChange={(e: any) => setNewOferta({ ...newOferta, descripcion: e.target.value })} rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} maxLength={120} />
              <span className="premium-field-hint" style={{ textAlign: "right" }}>{newOferta.descripcion.length}/120</span>
            </div>
            <div className="premium-field">
              <label className="premium-field-label">Etiqueta de descuento</label>
              <input className="input" placeholder="Selecciona o escribe una etiqueta" value={newOferta.descuento} onChange={(e) => setNewOferta({ ...newOferta, descuento: e.target.value })} />
              <span className="premium-field-hint">Ejemplos: -20%, 2x1, Envío gratis, -15%</span>
            </div>
          </div>

          {/* Right: preview */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 10px" }}>Vista previa en el sitio web</p>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ position: "relative", height: 130, background: "var(--surface-hover)", overflow: "hidden" }}>
                {newOferta.imagen_url ? (
                  <img src={newOferta.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImagePlus size={32} color="var(--text-muted)" />
                  </div>
                )}
                {newOferta.descuento && (
                  <span style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", background: "var(--primary)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff" }}>{newOferta.descuento}</span>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{newOferta.titulo || "Título de la oferta"}</p>
                <p style={{ fontSize: 11, color: "#666", margin: "0 0 10px", lineHeight: 1.4 }}>{newOferta.descripcion || "Descripción breve de la oferta que verán tus clientes."}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#888" }}>
                  <Clock size={10} /> Válido todos los martes
                </div>
              </div>
            </div>
            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={10} /> Así se verá tu oferta en la sección de promociones.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
