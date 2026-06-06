"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { formatPrecio } from "@/lib/utils";
import { useAdminDashboard } from "@/viewmodels/useAdminDashboard";
import { QRCode } from "react-qrcode-logo";
import {
  Package, Tag, Armchair, Receipt, DollarSign, Plus, Pause, Play,
  Trash2, Search, QrCode as QrIcon, X, Download, Copy, ImageIcon, ChefHat,
  GlassWater, Sparkles, Hash, Users, BookOpen,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";

/* ═══════════════════════════════════════════════════════════
   VIEW — Admin Dashboard
   Solo renderizado. Lógica en useAdminDashboard.
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { key: "productos", label: "Productos", Icon: Package },
  { key: "categorias", label: "Categorías", Icon: Tag },
  { key: "mesas", label: "Mesas & QR", Icon: QrIcon },
];

export default function AdminDashboard() {
  const vm = useAdminDashboard();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setPreviewUrl("");
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const statCards = [
    { label: "Productos activos", value: String(vm.stats.productos), Icon: Package, color: "var(--primary)" },
    { label: "Mesas activas", value: String(vm.stats.mesas), Icon: Armchair, color: "var(--tertiary)" },
    { label: "Pedidos hoy", value: String(vm.stats.pedidosHoy), Icon: Receipt, color: "var(--success)" },
    { label: "Ingresos hoy", value: formatPrecio(vm.stats.ingresosHoy), Icon: DollarSign, color: "var(--primary)" },
  ];

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
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card-flat" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: "8px 0 0" }}>{s.value}</p>
              </div>
              <s.Icon size={24} color={s.color} style={{ opacity: 0.3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Error Toast */}
      {vm.error && (
        <div className="animate-fade-in" style={{
          padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "var(--radius-md)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>{vm.error}</p>
          <button onClick={vm.clearError} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={14} color="var(--error)" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0, overflowX: "auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button key={tab.key} onClick={() => vm.setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 12, fontWeight: vm.activeTab === tab.key ? 600 : 400, color: vm.activeTab === tab.key ? "var(--primary)" : "var(--text-muted)", background: "transparent", border: "none", borderBottom: vm.activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", transition: "all var(--duration-fast) var(--ease-out)", marginBottom: -1, whiteSpace: "nowrap" }}>
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder={`Buscar ${vm.activeTab}...`} value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} className="input" style={{ maxWidth: 320, paddingLeft: 36 }} />
        </div>
        <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => { if (vm.activeTab === "productos") vm.setShowProductModal(true); else if (vm.activeTab === "mesas") vm.setShowMesaModal(true); else vm.setShowCatModal(true); }}>
          <Plus size={14} /> Agregar nuevo
        </button>
      </div>

      {/* Productos */}
      {vm.activeTab === "productos" && (
        <div className="table-container animate-fade-in">
          <table>
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Flujo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {vm.productosFiltrados.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: "var(--text)" }}>{p.nombre}</td>
                  <td>{p.categoria?.nombre || "—"}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrecio(Number(p.precio))}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{p.stock}</td>
                  <td>
                    {p.es_bebida && p.requiere_preparacion === false ? (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(151,176,255,0.1)", color: "var(--tertiary)", fontWeight: 600 }}>⚡ Directo</span>
                    ) : (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: "var(--warning)", fontWeight: 600 }}>🔥 Cocina</span>
                    )}
                  </td>
                  <td><span className={`badge ${p.disponible ? "badge-ready" : "badge-cancelled"}`}>{p.disponible ? "Disponible" : "Agotado"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => vm.handleToggleDisponible(p)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>{p.disponible ? <Pause size={14} /> : <Play size={14} />}</button>
                      <button onClick={() => vm.handleDeleteProduct(p.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Categorías */}
      {vm.activeTab === "categorias" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {vm.categoriasFiltradas.map((cat: any) => (
            <div key={cat.id} className="card-flat" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Tag size={16} color="var(--primary)" /><h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>{cat.nombre}</h4></div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{cat.descripcion || "Sin descripción"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mesas & QR */}
      {vm.activeTab === "mesas" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {vm.mesas.map((m: any) => (
            <div key={m.id} className="card-flat" style={{ padding: "20px", textAlign: "center", opacity: m.activa ? 1 : 0.5 }}>
              <div id={`qr-${m.slug}`} style={{ margin: "0 auto 12px", display: "flex", justifyContent: "center" }}>
                <QRCode value={vm.getQrUrl(m.slug)} size={120} bgColor="transparent" fgColor="#C5A059" qrStyle="dots" eyeRadius={8} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Mesa {m.numero}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px" }}>Cap. {m.capacidad} · {m.activa ? "Activa" : "Inactiva"}</p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <button onClick={() => downloadQr(m.slug, m.numero)} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}><Download size={12} /> Descargar QR</button>
                <button onClick={() => navigator.clipboard.writeText(vm.getQrUrl(m.slug))} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}><Copy size={14} /></button>
              </div>
            </div>
          ))}
          <div className="card-flat" onClick={() => vm.setShowMesaModal(true)} style={{ padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px dashed var(--border)", minHeight: 240 }}>
            <Plus size={32} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Nueva Mesa</p>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
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
            <button
              onClick={() => { vm.setShowProductModal(false); handleClearImage(); }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                const created = await vm.handleCreateProduct(selectedImageFile);
                if (created) handleClearImage();
              }}
              className="btn btn-primary"
              disabled={vm.saving}
              style={{ opacity: vm.saving ? 0.6 : 1 }}
            >
              {vm.saving ? "Guardando..." : "Crear producto"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nombre del plato</label>
          <input
            className="input"
            placeholder="Ej: Lomo Saltado"
            value={vm.newProd.nombre}
            onChange={(e) => vm.setNewProd({ ...vm.newProd, nombre: e.target.value })}
            autoFocus
          />
        </div>

        <div className="premium-field">
          <label className="premium-field-label">Categoría</label>
          <select
            className="input"
            value={vm.newProd.id_categoria}
            onChange={(e) => vm.setNewProd({ ...vm.newProd, id_categoria: e.target.value })}
            style={{ color: vm.newProd.id_categoria ? "var(--text)" : "var(--text-muted)" }}
          >
            <option value="">Seleccionar categoría</option>
            {vm.categorias.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="premium-field-row">
          <div className="premium-field">
            <label className="premium-field-label">Precio (S/)</label>
            <input
              className="input"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={vm.newProd.precio}
              onChange={(e) => vm.setNewProd({ ...vm.newProd, precio: e.target.value })}
            />
          </div>
          <div className="premium-field">
            <label className="premium-field-label">Stock</label>
            <input
              className="input"
              placeholder="10"
              type="number"
              value={vm.newProd.stock}
              onChange={(e) => vm.setNewProd({ ...vm.newProd, stock: e.target.value })}
            />
          </div>
        </div>

        <div className="premium-field">
          <label className="premium-field-label">Descripción</label>
          <input
            className="input"
            placeholder="Breve descripción para el cliente"
            value={vm.newProd.descripcion}
            onChange={(e) => vm.setNewProd({ ...vm.newProd, descripcion: e.target.value })}
          />
        </div>

        <div className="premium-field">
          <label className="premium-field-label">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ImageIcon size={12} /> Imagen del plato
            </span>
          </label>
          {previewUrl ? (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
              />
            </div>
          ) : (
            <div style={{
              display: "grid", placeItems: "center", minHeight: 120,
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: 14, color: "var(--text-muted)", fontSize: 12,
            }}>
              Selecciona una imagen para mostrar en la carta
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, minWidth: 140 }}
            >
              {previewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={handleClearImage}
                className="btn btn-ghost btn-sm"
                style={{ minWidth: 100 }}
              >
                Quitar
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="premium-field">
          <label style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            padding: "10px 12px", borderRadius: 10,
            border: "1px solid var(--border)",
            background: vm.newProd.es_bebida ? "rgba(91, 192, 222, 0.06)" : "transparent",
            transition: "background var(--duration-fast) var(--ease-out)",
          }}>
            <input
              type="checkbox"
              checked={vm.newProd.es_bebida}
              onChange={(e) => vm.setNewProd({
                ...vm.newProd,
                es_bebida: e.target.checked,
                requiere_preparacion: e.target.checked ? vm.newProd.requiere_preparacion : true,
              })}
              style={{ accentColor: "var(--tertiary)" }}
            />
            <GlassWater size={14} color="var(--tertiary)" />
            <span style={{ fontSize: 13, color: "var(--text)" }}>Es bebida</span>
          </label>

          {vm.newProd.es_bebida && (
            <div style={{
              padding: "10px 12px", background: "var(--surface)", borderRadius: 10,
              border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6,
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={vm.newProd.requiere_preparacion}
                  onChange={(e) => vm.setNewProd({ ...vm.newProd, requiere_preparacion: e.target.checked })}
                  style={{ accentColor: "var(--primary)" }}
                />
                <ChefHat size={13} color="var(--primary)" />
                <span>Requiere preparación en cocina</span>
              </label>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0 24px" }}>
                {vm.newProd.requiere_preparacion
                  ? "🔥 Pasa por cocina (ej: Chicha Morada, Limonada)"
                  : "⚡ Va directo al mesero (ej: Coca-Cola, Inca Kola)"}
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={vm.showMesaModal}
        onClose={() => vm.setShowMesaModal(false)}
        title="Nueva mesa"
        description="Generaremos su QR automáticamente para que los clientes escaneen."
        icon={<Armchair size={18} />}
        accentColor="var(--tertiary)"
        size="sm"
        footer={
          <ModalFooter>
            <button onClick={() => vm.setShowMesaModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={vm.handleCreateMesa}
              className="btn btn-primary"
              disabled={vm.saving}
              style={{ opacity: vm.saving ? 0.6 : 1, background: "var(--tertiary)", borderColor: "var(--tertiary)" }}
            >
              {vm.saving ? "Guardando..." : "Crear mesa"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Hash size={12} /> Número de mesa
            </span>
          </label>
          <input
            className="input"
            placeholder="Ej: 1, 2, 3..."
            type="number"
            value={vm.newMesa.numero}
            onChange={(e) => vm.setNewMesa({ ...vm.newMesa, numero: e.target.value })}
            autoFocus
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Users size={12} /> Capacidad
            </span>
          </label>
          <input
            className="input"
            placeholder="Ej: 4 personas"
            type="number"
            value={vm.newMesa.capacidad}
            onChange={(e) => vm.setNewMesa({ ...vm.newMesa, capacidad: e.target.value })}
          />
          <span className="premium-field-hint">Número máximo de comensales en esta mesa.</span>
        </div>
      </Modal>

      <Modal
        open={vm.showCatModal}
        onClose={() => vm.setShowCatModal(false)}
        title="Nueva categoría"
        description="Agrupa platos similares para que el cliente navegue mejor la carta."
        icon={<Tag size={18} />}
        accentColor="var(--success)"
        size="sm"
        footer={
          <ModalFooter>
            <button onClick={() => vm.setShowCatModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={vm.handleCreateCategoria}
              className="btn btn-primary"
              disabled={vm.saving}
              style={{ opacity: vm.saving ? 0.6 : 1, background: "var(--success)", borderColor: "var(--success)" }}
            >
              {vm.saving ? "Guardando..." : "Crear categoría"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={12} /> Nombre
            </span>
          </label>
          <input
            className="input"
            placeholder="Ej: Entradas, Platos fuertes, Postres"
            value={vm.newCat.nombre}
            onChange={(e) => vm.setNewCat({ ...vm.newCat, nombre: e.target.value })}
            autoFocus
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Descripción (opcional)</label>
          <input
            className="input"
            placeholder="Una nota breve para tu equipo"
            value={vm.newCat.descripcion}
            onChange={(e) => vm.setNewCat({ ...vm.newCat, descripcion: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
