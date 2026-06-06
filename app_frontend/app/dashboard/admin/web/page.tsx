"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";
import {
  getWebConfig, saveWebConfig, getWebCombos, crearWebCombo, actualizarWebCombo,
  eliminarWebCombo, getWebOfertas, crearWebOferta, actualizarWebOferta, eliminarWebOferta,
  uploadImage, actualizarRestauranteBranding,
} from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import {
  Globe, Gift, Calendar, Plus, Trash2, Pencil,
  Save, ExternalLink, CheckCircle2, Star, Sparkles,
  MessageCircle, Loader2, Zap, Database, Upload, ImagePlus, Flame,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";

/* ═══════════════════════════════════════════════════════════
   ADMIN — Gestión de Web Pública
   Combos, Ofertas & Configuración — Todo conectado a Supabase
   Con upload de imágenes real vía Supabase Storage
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { key: "combos", label: "Combos & Paquetes", Icon: Gift },
  { key: "ofertas", label: "Ofertas", Icon: Sparkles },
  { key: "config", label: "Configuración", Icon: Globe },
] as const;

export default function GestionWebPage() {
  const { restaurante, setRestaurante } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("combos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVisual, setSavingVisual] = useState(false);

  // Data
  const [combos, setCombos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [webConfig, setWebConfig] = useState({
    whatsapp: "", telefono: "", direccion: "", horario_semana: "", horario_finde: "",
  });
  const [visualConfig, setVisualConfig] = useState({
    color_primario: "#C5A059",
    color_secundario: "#E2725B",
    logo_url: "",
    hero_banner_url: "",
  });

  // Modals
  const [showComboModal, setShowComboModal] = useState(false);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [editingOferta, setEditingOferta] = useState<any>(null);
  const [newCombo, setNewCombo] = useState({ nombre: "", descripcion: "", precio: "", precio_original: "", incluye: "", popular: false, imagen_url: "" });
  const [newOferta, setNewOferta] = useState({ titulo: "", descripcion: "", descuento: "", imagen_url: "" });

  // Image upload
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
      if (configData.status === "fulfilled" && configData.value)
        setWebConfig(prev => ({ ...prev, ...configData.value }));
      if (combosData.status === "fulfilled") setCombos(combosData.value || []);
      if (ofertasData.status === "fulfilled") setOfertas(ofertasData.value || []);
    } catch (err) {
      console.error("Error al cargar datos web:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── IMAGE UPLOAD ──
  const handleImageUpload = async (
    file: File,
    target: "combo" | "oferta"
  ) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, "web");
      if (target === "combo") {
        setNewCombo(prev => ({ ...prev, imagen_url: url }));
      } else {
        setNewOferta(prev => ({ ...prev, imagen_url: url }));
      }
    } catch (err: any) {
      alert("Error al subir imagen: " + (err.message || "Error desconocido"));
    } finally {
      setUploading(false);
    }
  };

  // ── Config ──
  const handleSaveConfig = async () => {
    if (!id_restaurante) return;
    setSaving(true);
    try {
      await saveWebConfig({ id_restaurante, ...webConfig });
      alert("Configuración guardada ✅");
    } catch (err: any) {
      alert(err?.message || "Error al guardar");
    }
    finally { setSaving(false); }
  };

  const handleSaveVisual = async () => {
    if (!id_restaurante) return;
    setSavingVisual(true);
    try {
      const updated = await actualizarRestauranteBranding(id_restaurante, visualConfig);
      setRestaurante({ ...restaurante, ...updated } as any);
      alert("Identidad visual guardada ✅");
    } catch (err: any) {
      alert(err?.message || "Error al guardar identidad visual");
    } finally {
      setSavingVisual(false);
    }
  };

  // ── Combos ──
  const openComboModal = (combo?: any) => {
    if (combo) {
      setEditingCombo(combo);
      setNewCombo({
        nombre: combo.nombre, descripcion: combo.descripcion || "",
        precio: String(combo.precio),
        precio_original: combo.precio_original ? String(combo.precio_original) : "",
        incluye: (combo.incluye || []).join(", "),
        popular: combo.popular || false,
        imagen_url: combo.imagen_url || "",
      });
    } else {
      setEditingCombo(null);
      setNewCombo({ nombre: "", descripcion: "", precio: "", precio_original: "", incluye: "", popular: false, imagen_url: "" });
    }
    setShowComboModal(true);
  };
  const closeComboModal = () => {
    setShowComboModal(false); setEditingCombo(null);
    setNewCombo({ nombre: "", descripcion: "", precio: "", precio_original: "", incluye: "", popular: false, imagen_url: "" });
  };
  const handleSaveCombo = async () => {
    if (!id_restaurante || !newCombo.nombre || !newCombo.precio) return;
    try {
      const data: any = {
        id_restaurante, nombre: newCombo.nombre, descripcion: newCombo.descripcion,
        precio: parseFloat(newCombo.precio),
        precio_original: newCombo.precio_original ? parseFloat(newCombo.precio_original) : null,
        incluye: newCombo.incluye.split(",").map(s => s.trim()).filter(Boolean),
        popular: newCombo.popular,
        imagen_url: newCombo.imagen_url || "/assets/placeholder-dish.png",
      };
      if (editingCombo) await actualizarWebCombo(editingCombo.id, data);
      else await crearWebCombo(data);
      closeComboModal();
      loadData();
    } catch { alert("Error al guardar combo"); }
  };
  const handleDeleteCombo = async (id: string) => {
    if (!confirm("¿Eliminar este combo?")) return;
    try { await eliminarWebCombo(id); loadData(); } catch { alert("Error al eliminar"); }
  };

  // ── Ofertas ──
  const openOfertaModal = (oferta?: any) => {
    if (oferta) {
      setEditingOferta(oferta);
      setNewOferta({
        titulo: oferta.titulo, descripcion: oferta.descripcion || "",
        descuento: oferta.descuento || "", imagen_url: oferta.imagen_url || "",
      });
    } else {
      setEditingOferta(null);
      setNewOferta({ titulo: "", descripcion: "", descuento: "", imagen_url: "" });
    }
    setShowOfertaModal(true);
  };
  const closeOfertaModal = () => {
    setShowOfertaModal(false); setEditingOferta(null);
    setNewOferta({ titulo: "", descripcion: "", descuento: "", imagen_url: "" });
  };
  const handleSaveOferta = async () => {
    if (!id_restaurante || !newOferta.titulo) return;
    try {
      const data: any = {
        id_restaurante, titulo: newOferta.titulo, descripcion: newOferta.descripcion,
        descuento: newOferta.descuento, imagen_url: newOferta.imagen_url || null, activo: true,
      };
      if (editingOferta) await actualizarWebOferta(editingOferta.id, data);
      else await crearWebOferta(data);
      closeOfertaModal();
      loadData();
    } catch { alert("Error al guardar oferta"); }
  };
  const handleDeleteOferta = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta?")) return;
    try { await eliminarWebOferta(id); loadData(); } catch { alert("Error al eliminar"); }
  };

  // ── Seed ──
  const seedExampleData = async () => {
    if (!id_restaurante) return;
    if (!confirm("¿Cargar datos de ejemplo? Esto creará combos, ofertas y configuración de muestra.")) return;
    setLoading(true);
    try {
      await saveWebConfig({ id_restaurante, whatsapp: "51999888777", telefono: "+51 999 888 777", direccion: "Av. Antenor Orrego s/n, Trujillo, Perú", horario_semana: "11:00 AM - 10:00 PM", horario_finde: "10:00 AM - 11:00 PM" });
      await Promise.all([
        crearWebCombo({ id_restaurante, nombre: "Parrillada Familiar", descripcion: "Banquete completo para compartir en familia. Ideal para 4 personas.", precio: 89.90, precio_original: 120.00, incluye: ["Anticuchos de corazón", "Lomo Saltado familiar", "Arroz con Mariscos", "2 Chicha Morada (1L)", "Postre del día"], popular: true, imagen_url: "/assets/placeholder-dish.png" }),
        crearWebCombo({ id_restaurante, nombre: "Combo Criollo", descripcion: "Lo mejor de la cocina peruana en un solo combo.", precio: 45.90, precio_original: 58.00, incluye: ["Ceviche Clásico", "Arroz con Mariscos", "Chicha Morada"], popular: false, imagen_url: "/assets/placeholder-dish.png" }),
        crearWebCombo({ id_restaurante, nombre: "Noche Romántica", descripcion: "Experiencia gastronómica premium para dos.", precio: 119.90, precio_original: 150.00, incluye: ["2 Entradas a elegir", "2 Platos de fondo a elegir", "2 Pisco Sour", "Suspiro Limeño para compartir"], popular: true, imagen_url: "/assets/placeholder-dish.png" }),
      ]);
      await Promise.all([
        crearWebOferta({ id_restaurante, titulo: "2x1 en Pisco Sour", descripcion: "Todos los viernes disfruta de 2 Pisco Sour por el precio de 1.", descuento: "2x1", activo: true }),
        crearWebOferta({ id_restaurante, titulo: "Happy Hour en Bebidas", descripcion: "De lunes a jueves de 5pm a 7pm, todas las bebidas con 30% de descuento.", descuento: "30% OFF", activo: true }),
        crearWebOferta({ id_restaurante, titulo: "Postre Gratis", descripcion: "En consumos mayores a S/80, te regalamos un Suspiro Limeño o Picarones.", descuento: "GRATIS", activo: true }),
      ]);
      await loadData();
    } catch { alert("Error al cargar datos de ejemplo"); setLoading(false); }
  };

  // ── IMAGE PICKER COMPONENT ──
  const ImagePicker = ({ value, onChange, uploading: isUploading, fileRef, target }: {
    value: string; onChange: (url: string) => void; uploading: boolean;
    fileRef: React.RefObject<HTMLInputElement | null>; target: "combo" | "oferta";
  }) => (
    <div>
      <p className="label" style={{ marginBottom: 6, fontSize: 11 }}>Imagen</p>
      <input
        ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, target);
          e.target.value = "";
        }}
      />
      {value ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagen seleccionada" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
              style={{ padding: "8px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {isUploading ? <Loader2 className="spin-icon" size={14} /> : <Upload size={14} />}
              Cambiar
            </button>
            <button type="button" onClick={() => onChange("")}
              style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={14} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
          style={{
            width: "100%", height: 140, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            background: "var(--surface-hover)", border: "2px dashed var(--border)",
            borderRadius: 12, cursor: isUploading ? "wait" : "pointer",
            transition: "border-color 0.2s, background 0.2s", color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-ghost)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-hover)"; }}
        >
          {isUploading ? (
            <>
              <Loader2 className="spin-icon" size={28} color="var(--primary)" />
              <span style={{ fontSize: 12 }}>Subiendo imagen...</span>
            </>
          ) : (
            <>
              <ImagePlus size={28} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Haz clic para elegir imagen</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>JPG, PNG, WebP — Máx 5MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
      <Loader2 className="spin-icon" color="var(--primary)" size={32} />
    </div>
  );

  const isEmpty = combos.length === 0 && ofertas.length === 0 && !webConfig.whatsapp;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
            Gestión <em style={{ color: "var(--primary)" }}>Web</em>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Administra la página pública — los cambios se reflejan en /web</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isEmpty && (
            <button onClick={seedExampleData} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Database size={14} /> Cargar ejemplos
            </button>
          )}
          <a href="/web" target="_blank" className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <ExternalLink size={14} /> Ver sitio web
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          const count = tab.key === "combos" ? combos.length : tab.key === "ofertas" ? ofertas.length : 0;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)", background: "transparent", border: "none", borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", marginBottom: -1, whiteSpace: "nowrap" }}>
              <Icon size={14} />{tab.label}
              {count > 0 && <span style={{ background: "var(--primary-ghost)", color: "var(--primary)", padding: "1px 6px", borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ═══ COMBOS ═══ */}
      {activeTab === "combos" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{combos.length} combos en la nube</p>
            <button onClick={() => openComboModal()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Nuevo combo
            </button>
          </div>
          {combos.length === 0 ? (
            <div className="card-flat" style={{ padding: 48, textAlign: "center" }}>
              <Gift size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 4px" }}>No hay combos configurados</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Crea tu primer combo o usa &quot;Cargar ejemplos&quot;</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {combos.map((combo) => (
                <div key={combo.id} className="card-flat" style={{ overflow: "hidden", position: "relative" }}>
                  <div style={{ height: 150, overflow: "hidden", background: "var(--surface-hover)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={combo.imagen_url || "/assets/placeholder-dish.png"} alt={combo.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {combo.popular && (
                    <span style={{ position: "absolute", top: 12, right: 12, padding: "3px 8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-full)", fontSize: 9, fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={8} /> Popular
                    </span>
                  )}
                  <div style={{ padding: 16 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{combo.nombre}</h4>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.4 }}>{combo.descripcion}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
                      {(combo.incluye || []).map((item: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                          <CheckCircle2 size={10} color="var(--success)" /> {item}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        {combo.precio_original && <span style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "line-through", marginRight: 6 }}>S/{combo.precio_original}</span>}
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>S/{combo.precio}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openComboModal(combo)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} title="Editar"><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteCombo(combo.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} title="Eliminar"><Trash2 size={12} /></button>
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
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{ofertas.length} ofertas activas</p>
            <button onClick={() => openOfertaModal()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Nueva oferta
            </button>
          </div>
          {ofertas.length === 0 ? (
            <div className="card-flat" style={{ padding: 48, textAlign: "center" }}>
              <Sparkles size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 4px" }}>No hay ofertas configuradas</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Crea una oferta o usa &quot;Cargar ejemplos&quot;</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {ofertas.map((oferta) => (
                <div key={oferta.id} className="card-flat" style={{ overflow: "hidden", position: "relative" }}>
                  {oferta.imagen_url && (
                    <div style={{ height: 130, overflow: "hidden", background: "var(--surface-hover)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={oferta.imagen_url} alt={oferta.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    {oferta.descuento && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "rgba(226,114,91,0.12)", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, color: "var(--secondary)", marginBottom: 8 }}>
                        <Zap size={10} /> {oferta.descuento}
                      </span>
                    )}
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>{oferta.titulo}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>{oferta.descripcion}</p>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      <button onClick={() => openOfertaModal(oferta)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} title="Editar"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteOferta(oferta.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} title="Eliminar"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CONFIG ═══ */}
      {activeTab === "config" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="card-flat" style={{ padding: 24, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <ImagePlus size={18} color="var(--primary)" /> Identidad visual
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div><p className="label" style={{ marginBottom: 6 }}>Color principal</p><input type="color" className="input" value={visualConfig.color_primario} onChange={(e) => setVisualConfig({ ...visualConfig, color_primario: e.target.value })} style={{ height: 48, padding: 5 }} /></div>
              <div><p className="label" style={{ marginBottom: 6 }}>Color secundario</p><input type="color" className="input" value={visualConfig.color_secundario} onChange={(e) => setVisualConfig({ ...visualConfig, color_secundario: e.target.value })} style={{ height: 48, padding: 5 }} /></div>
              <ImageUploadInput label="Logo" value={visualConfig.logo_url} onChange={(url) => setVisualConfig({ ...visualConfig, logo_url: url })} height={150} />
              <ImageUploadInput label="Hero banner" value={visualConfig.hero_banner_url} onChange={(url) => setVisualConfig({ ...visualConfig, hero_banner_url: url })} height={150} hint="Imagen amplia para web pública y menú" />
            </div>
            <button onClick={handleSaveVisual} disabled={savingVisual} className="btn btn-primary" style={{ width: "100%", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {savingVisual ? <Loader2 className="spin-icon" size={14} /> : <Save size={14} />} Guardar identidad visual
            </button>
          </div>
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={18} color="var(--success)" /> Contacto
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><p className="label" style={{ marginBottom: 6 }}>WhatsApp (Sin +, ej: 51999888777)</p><input className="input" value={webConfig.whatsapp} onChange={(e) => setWebConfig({ ...webConfig, whatsapp: e.target.value })} placeholder="51999999999" /></div>
              <div><p className="label" style={{ marginBottom: 6 }}>Teléfono</p><input className="input" value={webConfig.telefono} onChange={(e) => setWebConfig({ ...webConfig, telefono: e.target.value })} /></div>
              <div><p className="label" style={{ marginBottom: 6 }}>Dirección</p><input className="input" value={webConfig.direccion} onChange={(e) => setWebConfig({ ...webConfig, direccion: e.target.value })} /></div>
            </div>
          </div>
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} color="var(--tertiary)" /> Horarios
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><p className="label" style={{ marginBottom: 6 }}>Lunes - Viernes</p><input className="input" value={webConfig.horario_semana} onChange={(e) => setWebConfig({ ...webConfig, horario_semana: e.target.value })} /></div>
              <div><p className="label" style={{ marginBottom: 6 }}>Sábado - Domingo</p><input className="input" value={webConfig.horario_finde} onChange={(e) => setWebConfig({ ...webConfig, horario_finde: e.target.value })} /></div>
            </div>
            <button onClick={handleSaveConfig} disabled={saving} className="btn btn-primary" style={{ width: "100%", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving ? <Loader2 className="spin-icon" size={14} /> : <Save size={14} />} Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* ═══ COMBO MODAL ═══ */}
      <Modal
        open={showComboModal}
        onClose={closeComboModal}
        title={editingCombo ? "Editar combo" : "Nuevo combo"}
        description="Crea paquetes que agrupen varios productos con precio especial."
        icon={<Gift size={18} />}
        accentColor="var(--primary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={closeComboModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSaveCombo} className="btn btn-primary">
              {editingCombo ? "Actualizar" : "Guardar combo"}
            </button>
          </ModalFooter>
        }
      >
        <ImagePicker
          value={newCombo.imagen_url}
          onChange={(url) => setNewCombo({ ...newCombo, imagen_url: url })}
          uploading={uploading} fileRef={comboFileRef} target="combo"
        />
        <div className="premium-field">
          <label className="premium-field-label">Nombre del combo</label>
          <input
            className="input"
            placeholder="Ej: Combo Familiar"
            value={newCombo.nombre}
            onChange={(e) => setNewCombo({ ...newCombo, nombre: e.target.value })}
            autoFocus
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Descripción</label>
          <input
            className="input"
            placeholder="Una línea que enganche al cliente"
            value={newCombo.descripcion}
            onChange={(e) => setNewCombo({ ...newCombo, descripcion: e.target.value })}
          />
        </div>
        <div className="premium-field-row">
          <div className="premium-field">
            <label className="premium-field-label">Precio del combo (S/)</label>
            <input
              className="input"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={newCombo.precio}
              onChange={(e) => setNewCombo({ ...newCombo, precio: e.target.value })}
            />
          </div>
          <div className="premium-field">
            <label className="premium-field-label">Precio original (S/)</label>
            <input
              className="input"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={newCombo.precio_original}
              onChange={(e) => setNewCombo({ ...newCombo, precio_original: e.target.value })}
            />
            <span className="premium-field-hint">Tachado en la web para mostrar el ahorro.</span>
          </div>
        </div>
        <div className="premium-field">
          <label className="premium-field-label">¿Qué incluye?</label>
          <input
            className="input"
            placeholder="Ej: 2 hamburguesas, papas, 2 refrescos"
            value={newCombo.incluye}
            onChange={(e) => setNewCombo({ ...newCombo, incluye: e.target.value })}
          />
          <span className="premium-field-hint">Separa los items con comas.</span>
        </div>
        <label style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          padding: "10px 12px", borderRadius: 10,
          border: "1px solid var(--border)",
          background: newCombo.popular ? "rgba(197,160,89,0.06)" : "transparent",
          transition: "background var(--duration-fast) var(--ease-out)",
        }}>
          <input
            type="checkbox"
            checked={newCombo.popular}
            onChange={(e) => setNewCombo({ ...newCombo, popular: e.target.checked })}
            style={{ accentColor: "var(--primary)" }}
          />
          <Flame size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, color: "var(--text)" }}>Marcar como popular</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>Se destacará en la web</span>
        </label>
      </Modal>

      {/* ═══ OFERTA MODAL ═══ */}
      <Modal
        open={showOfertaModal}
        onClose={closeOfertaModal}
        title={editingOferta ? "Editar oferta" : "Nueva oferta"}
        description="Promociones temporales que aparecen en la portada de la web."
        icon={<Sparkles size={18} />}
        accentColor="var(--secondary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={closeOfertaModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSaveOferta}
              className="btn btn-primary"
              style={{ background: "var(--secondary)", borderColor: "var(--secondary)" }}
            >
              {editingOferta ? "Actualizar" : "Crear oferta"}
            </button>
          </ModalFooter>
        }
      >
        <ImagePicker
          value={newOferta.imagen_url}
          onChange={(url) => setNewOferta({ ...newOferta, imagen_url: url })}
          uploading={uploading} fileRef={ofertaFileRef} target="oferta"
        />
        <div className="premium-field">
          <label className="premium-field-label">Título</label>
          <input
            className="input"
            placeholder="Ej: 2x1 en Pisco Sour"
            value={newOferta.titulo}
            onChange={(e) => setNewOferta({ ...newOferta, titulo: e.target.value })}
            autoFocus
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Descripción</label>
          <textarea
            className="input"
            placeholder="Detalles de la promoción..."
            value={newOferta.descripcion}
            onChange={(e: any) => setNewOferta({ ...newOferta, descripcion: e.target.value })}
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Etiqueta de descuento</label>
          <input
            className="input"
            placeholder="Ej: 2x1, 30% OFF, GRATIS"
            value={newOferta.descuento}
            onChange={(e) => setNewOferta({ ...newOferta, descuento: e.target.value })}
          />
          <span className="premium-field-hint">Texto corto que aparece como badge encima de la imagen.</span>
        </div>
      </Modal>
    </div>
  );
}
