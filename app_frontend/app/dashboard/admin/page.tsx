"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { formatPrecio } from "@/lib/utils";
import { useAdminDashboard } from "@/viewmodels/useAdminDashboard";
import { useNotificaciones } from "@/lib/store";
import { QRCode } from "react-qrcode-logo";
import {
  Package, Tag, Armchair, Receipt, DollarSign, Plus, Pause, Play,
  Trash2, Search, QrCode as QrIcon, Download, Copy, ImageIcon, ChefHat,
  GlassWater, Sparkles, Hash, Users, BookOpen, AlertCircle, Pencil,
  TrendingUp, BarChart3,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { sanitize, validate } from "@/lib/inputValidation";
import { ConfirmDeleteModal } from "@/components/ActionFeedback";

/* ═══════════════════════════════════════════════════════════
   VIEW — Admin Dashboard (Wine Design)
   2-column layout: main content + right panel
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { key: "productos", label: "Productos", Icon: Package },
  { key: "categorias", label: "Categorías", Icon: Tag },
  { key: "mesas", label: "Mesas & QR", Icon: QrIcon },
];

const ITEMS_PER_PAGE = 5;

// Activity icon colors
const activityColors: Record<string, { bg: string; color: string; icon: string }> = {
  producto: { bg: "rgba(197,160,89,0.1)", color: "var(--primary)", icon: "+" },
  mesa: { bg: "rgba(74,108,247,0.1)", color: "var(--tertiary)", icon: "⊞" },
  usuario: { bg: "rgba(197,160,89,0.1)", color: "var(--primary)", icon: "👤" },
};

export default function AdminDashboard() {
  const vm = useAdminDashboard();
  const { items: notifItems } = useNotificaciones();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Delete confirmation ──
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string; type: "producto" | "categoria" } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reset page on tab change
  useEffect(() => { setCurrentPage(1); }, [vm.activeTab, vm.searchTerm]);

  const downloadQr = (mesaSlug: string, mesaNum: number) => {
    const canvas = document.querySelector(`#qr-${mesaSlug} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `qr-mesa-${mesaNum}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImageFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl("");
  };

  // ── Live form validation ──
  const productErrors = useMemo(() => ({
    nombre: validate(vm.newProd.nombre, "text", { required: true }),
    id_categoria: validate(vm.newProd.id_categoria, "text", { required: true }),
    precio: validate(vm.newProd.precio, "decimal", { required: true, min: 0.01, max: 99999 }),
  }), [vm.newProd.nombre, vm.newProd.id_categoria, vm.newProd.precio]);

  const isProductFormValid = !productErrors.nombre && !productErrors.id_categoria && !productErrors.precio;

  const mesaErrors = useMemo(() => ({
    numero: validate(vm.newMesa.numero, "integer", { required: true, min: 1, max: 9999 }),
  }), [vm.newMesa.numero]);

  const isMesaFormValid = !mesaErrors.numero;

  const categoriaErrors = useMemo(() => ({
    nombre: validate(vm.newCat.nombre, "text", { required: true }),
  }), [vm.newCat.nombre]);

  const isCategoriaFormValid = !categoriaErrors.nombre;

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setPreviewUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Edit product ──
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editData, setEditData] = useState({ nombre: "", precio: "", stock: "", descripcion: "", disponible: true, id_categoria: "", es_bebida: false, requiere_preparacion: true, imagen_url: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const editFileRef = useRef<HTMLInputElement | null>(null);

  const handleEditProduct = (p: any) => {
    setEditProduct(p);
    setEditImageFile(null);
    setEditPreviewUrl(p.imagen_url || "");
    setEditData({
      nombre: p.nombre || "",
      precio: String(p.precio || ""),
      stock: String(p.stock || ""),
      descripcion: p.descripcion || "",
      disponible: p.disponible !== false,
      id_categoria: p.id_categoria || "",
      es_bebida: p.es_bebida || false,
      requiere_preparacion: p.requiere_preparacion !== false,
      imagen_url: p.imagen_url || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    setEditSaving(true);
    try {
      const ok = await vm.handleUpdateProduct(
        editProduct.id,
        {
          nombre: editData.nombre,
          precio: parseFloat(editData.precio),
          stock: parseInt(editData.stock) || 0,
          descripcion: editData.descripcion,
          disponible: editData.disponible,
          id_categoria: editData.id_categoria,
          es_bebida: editData.es_bebida,
          requiere_preparacion: editData.requiere_preparacion,
          imagen_url: editData.imagen_url,
        },
        editImageFile
      );
      if (ok) { setEditProduct(null); setEditImageFile(null); setEditPreviewUrl(""); }
    } finally { setEditSaving(false); }
  };

  // ── Edit/Delete categories ──
  const [editCat, setEditCat] = useState<any>(null);
  const [editCatData, setEditCatData] = useState({ nombre: "", descripcion: "" });

  const handleEditCategoria = (cat: any) => {
    setEditCat(cat);
    setEditCatData({ nombre: cat.nombre || "", descripcion: cat.descripcion || "" });
  };

  const handleSaveEditCat = async () => {
    if (!editCat) return;
    const ok = await vm.handleUpdateCategoria(editCat.id, editCatData);
    if (ok) setEditCat(null);
  };

  const handleDeleteCategoria = (id: string, nombre: string) => {
    setDeleteConfirm({ id, nombre, type: "categoria" });
  };

  // ── Stat cards data ──
  const statCards = [
    {
      label: "Productos activos", value: String(vm.stats.productos),
      sub: "Disponibles en carta", Icon: Package,
      iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)",
      trend: "+12% vs ayer",
    },
    {
      label: "Mesas activas", value: String(vm.stats.mesas),
      sub: "De mesas totales", Icon: Armchair,
      iconBg: "rgba(74,108,247,0.1)", iconColor: "var(--tertiary)",
      trend: "+8% vs ayer",
    },
    {
      label: "Pedidos hoy", value: String(vm.stats.pedidosHoy),
      sub: "Total del día", Icon: Receipt,
      iconBg: "rgba(22,163,74,0.1)", iconColor: "var(--success)",
      trend: "+15% vs ayer",
    },
    {
      label: "Ingresos hoy", value: formatPrecio(vm.stats.ingresosHoy),
      sub: "Total pagado", Icon: DollarSign,
      iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)",
      trend: "+18% vs ayer",
    },
  ];

  // ── Pagination ──
  const totalItems = vm.productosFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedProductos = vm.productosFiltrados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />))}
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* ── Main content column ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Stat Cards — compact row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {statCards.map((s) => (
            <div key={s.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: s.iconBg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.Icon size={17} color={s.iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "1px 0", lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ fontSize: 9, color: "var(--success)", margin: 0, display: "flex", alignItems: "center", gap: 2, lineHeight: 1.2 }}>
                  <TrendingUp size={8} /> {s.trend}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="wine-tab-bar">
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <button
                key={tab.key}
                onClick={() => vm.setActiveTab(tab.key)}
                className={`wine-tab-btn ${vm.activeTab === tab.key ? "wine-tab-btn--active" : ""}`}
              >
                <Icon size={13} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder={`Buscar ${vm.activeTab === "productos" ? "producto" : vm.activeTab === "categorias" ? "categoría" : "mesa"} por nombre...`}
              value={vm.searchTerm}
              onChange={(e) => vm.setSearchTerm(e.target.value)}
              className="input"
              style={{ maxWidth: 320, paddingLeft: 36 }}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              if (vm.activeTab === "productos") vm.setShowProductModal(true);
              else if (vm.activeTab === "mesas") vm.setShowMesaModal(true);
              else vm.setShowCatModal(true);
            }}
          >
            <Plus size={14} /> Agregar nuevo
          </button>
        </div>

        {/* ── Productos tab ── */}
        {vm.activeTab === "productos" && (
          <div className="animate-fade-in card-flat" style={{ overflow: "hidden" }}>
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Imagen</th>
                    <th>Nombre del producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Flujo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProductos.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "var(--surface-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.imagen_url ? (
                            <img src={p.imagen_url} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          ) : (
                            <ImageIcon size={16} color="var(--text-muted)" />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>{p.nombre}</td>
                      <td style={{ color: "var(--text-muted)" }}>{p.categoria?.nombre || "—"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatPrecio(Number(p.precio))}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{p.stock}</td>
                      <td>
                        {p.es_bebida && p.requiere_preparacion === false ? (
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(74,108,247,0.1)", color: "var(--tertiary)", fontWeight: 600 }}>Directo</span>
                        ) : (
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: "var(--warning)", fontWeight: 600 }}>Cocina</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${p.disponible ? "badge-ready" : "badge-cancelled"}`}>
                          {p.disponible ? "Disponible" : "Agotado"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleEditProduct(p)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => vm.handleToggleDisponible(p)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} title={p.disponible ? "Pausar" : "Activar"}>
                            {p.disponible ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: p.id, nombre: p.nombre, type: "producto" })} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", color: "var(--secondary)" }} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedProductos.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>
                        No hay productos con este filtro
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="table-pagination">
              <span className="table-pagination-info">
                Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} a {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems} productos
              </span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg} className={`page-btn ${pg === currentPage ? "page-btn--active" : ""}`} onClick={() => setCurrentPage(pg)}>
                      {pg}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "0 4px" }}>...</span>}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                )}
                <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Categorías tab ── */}
        {vm.activeTab === "categorias" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {vm.categoriasFiltradas.map((cat: any) => (
              <div key={cat.id} className="card-flat" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(197,160,89,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Tag size={16} color="var(--primary)" />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>{cat.nombre}</h4>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 14px" }}>{cat.descripcion || "Sin descripción"}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleEditCategoria(cat)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} title="Editar"><Pencil size={12} /></button>
                  <button onClick={() => handleDeleteCategoria(cat.id, cat.nombre)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px", color: "var(--secondary)" }} title="Eliminar"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {vm.categoriasFiltradas.length === 0 && (
              <div className="card-flat" style={{ padding: 32, textAlign: "center", gridColumn: "1 / -1" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No hay categorías</p>
              </div>
            )}
          </div>
        )}

        {/* ── Mesas & QR tab ── */}
        {vm.activeTab === "mesas" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {vm.mesas.map((m: any) => (
              <div key={m.id} className="card-flat" style={{ padding: "20px", textAlign: "center", opacity: m.activa ? 1 : 0.5 }}>
                <div id={`qr-${m.slug}`} style={{ margin: "0 auto 14px", display: "flex", justifyContent: "center", background: "#FFFFFF", borderRadius: 12, padding: 10, border: "1px solid #E8DFD0", width: "fit-content" }}>
                  <QRCode
                    value={vm.getQrUrl(m.slug)}
                    size={140}
                    bgColor="#FFFFFF"
                    fgColor="#1A1410"
                    qrStyle="dots"
                    eyeRadius={6}
                    quietZone={4}
                  />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Mesa {m.numero}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 12px" }}>Cap. {m.capacidad} · {m.activa ? "Activa" : "Inactiva"}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => downloadQr(m.slug, m.numero)} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                    <Download size={12} /> Descargar QR
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(vm.getQrUrl(m.slug))} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}><Copy size={14} /></button>
                </div>
              </div>
            ))}
            <div className="card-flat" onClick={() => vm.setShowMesaModal(true)} style={{ padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px dashed var(--border)", minHeight: 200 }}>
              <Plus size={32} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Nueva Mesa</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Actividad reciente */}
        <div className="dash-panel-card">
          <p className="dash-panel-title">Actividad reciente</p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifItems.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Sin actividad reciente</p>
              </div>
            ) : (
              notifItems.slice(0, 5).map((n, i) => {
                const colors = [
                  { bg: "rgba(197,160,89,0.12)", color: "var(--primary)" },
                  { bg: "rgba(74,108,247,0.12)", color: "var(--tertiary)" },
                  { bg: "rgba(197,160,89,0.12)", color: "var(--primary)" },
                  { bg: "rgba(74,108,247,0.12)", color: "var(--tertiary)" },
                  { bg: "rgba(22,163,74,0.12)", color: "var(--success)" },
                ];
                const c = colors[i % colors.length];
                return (
                  <div key={n.id} className="dash-activity-item">
                    <div className="dash-activity-dot" style={{ background: c.bg }}>
                      <span style={{ fontSize: 11, color: c.color, fontWeight: 700 }}>+</span>
                    </div>
                    <div className="dash-activity-body">
                      <p className="dash-activity-title">{n.titulo}</p>
                      <p className="dash-activity-desc">{n.mensaje || "—"}</p>
                    </div>
                    <span className="dash-activity-time">Hace {i * 15 + 5} min</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="dash-panel-card">
          <p className="dash-panel-title">Accesos rápidos</p>
          <div className="dash-quick-grid">
            <button
              className="dash-quick-btn"
              onClick={() => { vm.setActiveTab("productos"); vm.setShowProductModal(true); }}
            >
              <div className="dash-quick-btn-icon" style={{ background: "rgba(197,160,89,0.1)" }}>
                <Package size={16} color="var(--primary)" />
              </div>
              <span style={{ fontSize: 12 }}>+ Producto</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => { vm.setActiveTab("categorias"); vm.setShowCatModal(true); }}
            >
              <div className="dash-quick-btn-icon" style={{ background: "rgba(197,160,89,0.1)" }}>
                <Tag size={16} color="var(--primary)" />
              </div>
              <span style={{ fontSize: 12 }}>+ Categoría</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => { vm.setActiveTab("mesas"); vm.setShowMesaModal(true); }}
            >
              <div className="dash-quick-btn-icon" style={{ background: "rgba(74,108,247,0.1)" }}>
                <Armchair size={16} color="var(--tertiary)" />
              </div>
              <span style={{ fontSize: 12 }}>+ Mesa</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => window.location.href = "/dashboard/admin/reportes"}
            >
              <div className="dash-quick-btn-icon" style={{ background: "rgba(22,163,74,0.1)" }}>
                <BarChart3 size={16} color="var(--success)" />
              </div>
              <span style={{ fontSize: 12 }}>Ver reportes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {/* Product Modal */}
      <Modal
        open={vm.showProductModal}
        onClose={() => { vm.setShowProductModal(false); handleClearImage(); }}
        title="Nuevo producto"
        description="Agrégalo a la carta. Aparecerá inmediatamente en la vista del cliente."
        icon={<Sparkles size={18} />}
        accentColor="var(--primary)"
        size="lg"
        footer={
          <ModalFooter>
            <button onClick={() => { vm.setShowProductModal(false); handleClearImage(); }} className="btn btn-secondary">Cancelar</button>
            <button
              onClick={async () => { const created = await vm.handleCreateProduct(selectedImageFile); if (created) handleClearImage(); }}
              className="btn btn-primary"
              disabled={vm.saving || !isProductFormValid}
              style={{ opacity: vm.saving || !isProductFormValid ? 0.5 : 1 }}
            >
              {vm.saving ? "Guardando..." : "Crear producto"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nombre del plato *</label>
          <input className={`input ${productErrors.nombre ? "input--invalid" : ""}`} placeholder="Ej: Lomo Saltado" value={vm.newProd.nombre} onChange={(e) => vm.setNewProd({ ...vm.newProd, nombre: e.target.value })} autoFocus />
          {productErrors.nombre && <span className="premium-field-error"><AlertCircle size={11} /> {productErrors.nombre}</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Categoría *</label>
          <select className={`input ${productErrors.id_categoria ? "input--invalid" : ""}`} value={vm.newProd.id_categoria} onChange={(e) => vm.setNewProd({ ...vm.newProd, id_categoria: e.target.value })}>
            <option value="">Seleccionar categoría</option>
            {vm.categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {productErrors.id_categoria && <span className="premium-field-error"><AlertCircle size={11} /> {productErrors.id_categoria}</span>}
        </div>
        <div className="premium-field-row">
          <div className="premium-field">
            <label className="premium-field-label">Precio (S/) *</label>
            <input className={`input ${productErrors.precio ? "input--invalid" : ""}`} placeholder="0.00" inputMode="decimal" value={vm.newProd.precio} onChange={(e) => vm.setNewProd({ ...vm.newProd, precio: sanitize(e.target.value, "decimal") })} onKeyDown={(e) => { if (["e","E","+","-"].includes(e.key)) e.preventDefault(); }} />
            {productErrors.precio ? <span className="premium-field-error"><AlertCircle size={11} /> {productErrors.precio}</span> : <span className="premium-field-hint">Solo números, hasta 2 decimales.</span>}
          </div>
          <div className="premium-field">
            <label className="premium-field-label">Stock</label>
            <input className="input" placeholder="10" inputMode="numeric" value={vm.newProd.stock} onChange={(e) => vm.setNewProd({ ...vm.newProd, stock: sanitize(e.target.value, "integer") || "0" })} onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }} />
          </div>
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Descripción</label>
          <input className="input" placeholder="Breve descripción para el cliente" value={vm.newProd.descripcion} onChange={(e) => vm.setNewProd({ ...vm.newProd, descripcion: e.target.value })} />
        </div>
        <div className="premium-field">
          <label className="premium-field-label"><ImageIcon size={12} style={{ display: "inline", marginRight: 5 }} />Imagen del plato</label>
          {previewUrl ? (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={previewUrl} alt="Vista previa" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ display: "grid", placeItems: "center", minHeight: 120, background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 14, color: "var(--text-muted)", fontSize: 12 }}>
              Selecciona una imagen para mostrar en la carta
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>{previewUrl ? "Cambiar imagen" : "Seleccionar imagen"}</button>
            {previewUrl && <button type="button" onClick={handleClearImage} className="btn btn-ghost btn-sm">Quitar</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </div>
        </div>
        <div className="premium-field">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: vm.newProd.es_bebida ? "rgba(91,192,222,0.06)" : "transparent" }}>
            <input type="checkbox" checked={vm.newProd.es_bebida} onChange={(e) => vm.setNewProd({ ...vm.newProd, es_bebida: e.target.checked, requiere_preparacion: e.target.checked ? vm.newProd.requiere_preparacion : true })} style={{ accentColor: "var(--tertiary)" }} />
            <GlassWater size={14} color="var(--tertiary)" />
            <span style={{ fontSize: 13, color: "var(--text)" }}>Es bebida</span>
          </label>
          {vm.newProd.es_bebida && (
            <div style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                <input type="checkbox" checked={vm.newProd.requiere_preparacion} onChange={(e) => vm.setNewProd({ ...vm.newProd, requiere_preparacion: e.target.checked })} style={{ accentColor: "var(--primary)" }} />
                <ChefHat size={13} color="var(--primary)" />
                <span>Requiere preparación en cocina</span>
              </label>
            </div>
          )}
        </div>
      </Modal>

      {/* Mesa Modal */}
      <Modal open={vm.showMesaModal} onClose={() => vm.setShowMesaModal(false)} title="Nueva mesa" description="Generaremos su QR automáticamente." icon={<Armchair size={18} />} accentColor="var(--tertiary)" size="sm"
        footer={<ModalFooter><button onClick={() => vm.setShowMesaModal(false)} className="btn btn-secondary">Cancelar</button><button onClick={vm.handleCreateMesa} className="btn btn-primary" disabled={vm.saving || !isMesaFormValid} style={{ opacity: vm.saving || !isMesaFormValid ? 0.5 : 1, background: "var(--tertiary)", borderColor: "var(--tertiary)" }}>{vm.saving ? "Guardando..." : "Crear mesa"}</button></ModalFooter>}
      >
        <div className="premium-field">
          <label className="premium-field-label"><Hash size={12} style={{ display: "inline", marginRight: 5 }} />Número de mesa *</label>
          <input className={`input ${mesaErrors.numero ? "input--invalid" : ""}`} placeholder="Ej: 1, 2, 3..." inputMode="numeric" value={vm.newMesa.numero} onChange={(e) => vm.setNewMesa({ ...vm.newMesa, numero: sanitize(e.target.value, "integer") })} onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }} autoFocus />
          {mesaErrors.numero && <span className="premium-field-error"><AlertCircle size={11} /> {mesaErrors.numero}</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label"><Users size={12} style={{ display: "inline", marginRight: 5 }} />Capacidad</label>
          <input className="input" placeholder="Ej: 4 personas" inputMode="numeric" value={vm.newMesa.capacidad} onChange={(e) => vm.setNewMesa({ ...vm.newMesa, capacidad: sanitize(e.target.value, "integer") })} onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }} />
          <span className="premium-field-hint">Número máximo de comensales.</span>
        </div>
      </Modal>

      {/* Categoría Modal */}
      <Modal open={vm.showCatModal} onClose={() => vm.setShowCatModal(false)} title="Nueva categoría" description="Agrupa platos similares para la carta." icon={<Tag size={18} />} accentColor="var(--success)" size="sm"
        footer={<ModalFooter><button onClick={() => vm.setShowCatModal(false)} className="btn btn-secondary">Cancelar</button><button onClick={vm.handleCreateCategoria} className="btn btn-primary" disabled={vm.saving || !isCategoriaFormValid} style={{ opacity: vm.saving || !isCategoriaFormValid ? 0.5 : 1, background: "var(--success)", borderColor: "var(--success)" }}>{vm.saving ? "Guardando..." : "Crear categoría"}</button></ModalFooter>}
      >
        <div className="premium-field">
          <label className="premium-field-label"><BookOpen size={12} style={{ display: "inline", marginRight: 5 }} />Nombre *</label>
          <input className={`input ${categoriaErrors.nombre ? "input--invalid" : ""}`} placeholder="Ej: Entradas, Platos fuertes, Postres" value={vm.newCat.nombre} onChange={(e) => vm.setNewCat({ ...vm.newCat, nombre: e.target.value })} autoFocus />
          {categoriaErrors.nombre && <span className="premium-field-error"><AlertCircle size={11} /> {categoriaErrors.nombre}</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Descripción (opcional)</label>
          <input className="input" placeholder="Una nota breve para tu equipo" value={vm.newCat.descripcion} onChange={(e) => vm.setNewCat({ ...vm.newCat, descripcion: e.target.value })} />
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Editar producto" description={`Editando: ${editProduct?.nombre || ""}`} icon={<Pencil size={18} />} accentColor="var(--primary)"
        footer={<ModalFooter><button onClick={() => setEditProduct(null)} className="btn btn-secondary">Cancelar</button><button onClick={handleSaveEdit} className="btn btn-primary" disabled={editSaving} style={{ opacity: editSaving ? 0.5 : 1 }}>{editSaving ? "Guardando..." : "Guardar cambios"}</button></ModalFooter>}
      >
        <div className="premium-field">
          <label className="premium-field-label"><ImageIcon size={12} style={{ display: "inline", marginRight: 5 }} />Imagen</label>
          {editPreviewUrl ? (
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 8, border: "1px solid var(--border)" }}>
              <img src={editPreviewUrl} alt="Vista previa" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ display: "grid", placeItems: "center", minHeight: 90, background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>Sin imagen</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => editFileRef.current?.click()} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>{editPreviewUrl ? "Cambiar" : "Seleccionar"}</button>
            {editPreviewUrl && <button type="button" onClick={() => { setEditImageFile(null); setEditPreviewUrl(""); setEditData(d => ({ ...d, imagen_url: "" })); if (editFileRef.current) editFileRef.current.value = ""; }} className="btn btn-ghost btn-sm">Quitar</button>}
            <input ref={editFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0] || null; setEditImageFile(f); if (f) setEditPreviewUrl(URL.createObjectURL(f)); }} />
          </div>
        </div>
        <div className="premium-field"><label className="premium-field-label">Nombre</label><input className="input" value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} /></div>
        <div className="premium-field"><label className="premium-field-label">Categoría</label>
          <select className="input" value={editData.id_categoria} onChange={(e) => setEditData({ ...editData, id_categoria: e.target.value })}>
            <option value="">Seleccionar...</option>
            {vm.categorias.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>
        </div>
        <div className="premium-field-row">
          <div className="premium-field"><label className="premium-field-label">Precio</label><input className="input" type="number" step="0.01" value={editData.precio} onChange={(e) => setEditData({ ...editData, precio: e.target.value })} /></div>
          <div className="premium-field"><label className="premium-field-label">Stock</label><input className="input" type="number" value={editData.stock} onChange={(e) => setEditData({ ...editData, stock: e.target.value })} /></div>
        </div>
        <div className="premium-field"><label className="premium-field-label">Descripción</label><input className="input" value={editData.descripcion} onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })} /></div>
        <div className="premium-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="edit-bebida" checked={editData.es_bebida} onChange={(e) => setEditData({ ...editData, es_bebida: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
          <label htmlFor="edit-bebida" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer" }}>Es bebida</label>
        </div>
        <div className="premium-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="edit-prep" checked={editData.requiere_preparacion} onChange={(e) => setEditData({ ...editData, requiere_preparacion: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
          <label htmlFor="edit-prep" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer" }}>Requiere preparación (pasa por cocina)</label>
        </div>
        <div className="premium-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="edit-disp" checked={editData.disponible} onChange={(e) => setEditData({ ...editData, disponible: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
          <label htmlFor="edit-disp" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer" }}>Disponible en la carta</label>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Editar categoría" description={`Editando: ${editCat?.nombre || ""}`} icon={<Pencil size={18} />} accentColor="var(--primary)"
        footer={<ModalFooter><button onClick={() => setEditCat(null)} className="btn btn-secondary">Cancelar</button><button onClick={handleSaveEditCat} className="btn btn-primary">Guardar</button></ModalFooter>}
      >
        <div className="premium-field"><label className="premium-field-label">Nombre</label><input className="input" value={editCatData.nombre} onChange={(e) => setEditCatData({ ...editCatData, nombre: e.target.value })} /></div>
        <div className="premium-field"><label className="premium-field-label">Descripción</label><input className="input" value={editCatData.descripcion} onChange={(e) => setEditCatData({ ...editCatData, descripcion: e.target.value })} placeholder="Opcional" /></div>
      </Modal>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        open={!!deleteConfirm}
        title={deleteConfirm?.type === "producto" ? "¿Eliminar producto?" : "¿Eliminar categoría?"}
        message={
          deleteConfirm?.type === "producto"
            ? `¿Estás seguro de eliminar "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`
            : `¿Estás seguro de eliminar la categoría "${deleteConfirm?.nombre}"?`
        }
        confirmLabel="Eliminar"
        type="danger"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === "producto") vm.handleDeleteProduct(deleteConfirm.id);
          else vm.handleDeleteCategoria(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}

