"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatPrecio } from "@/lib/utils";
import {
  getProductosTodos,
  getCategorias,
  getMesas,
  getPedidos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearMesa,
  crearCategoria,
} from "@/lib/api";
import {
  Package,
  Tag,
  Armchair,
  Receipt,
  DollarSign,
  Plus,
  Pause,
  Play,
  Trash2,
  Search,
  QrCode,
  X,
  Download,
  BarChart3,
  Copy,
} from "lucide-react";
import { QRCode } from "react-qrcode-logo";

/* ═══════════════════════════════════════════════════════════
   ADMIN DASHBOARD (FUNCIONAL)
   Lucide icons — QR generation — responsive — no emojis
   ═══════════════════════════════════════════════════════════ */

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

const tabs = [
  { key: "productos", label: "Productos", Icon: Package },
  { key: "categorias", label: "Categorías", Icon: Tag },
  { key: "mesas", label: "Mesas & QR", Icon: QrCode },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("productos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [stats, setStats] = useState({ productos: 0, mesas: 0, pedidosHoy: 0, ingresosHoy: 0 });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<any>(null);

  const [newProd, setNewProd] = useState({
    nombre: "", id_categoria: "", precio: "", descripcion: "", stock: "10", es_bebida: false,
  });
  const [newMesa, setNewMesa] = useState({ numero: "", capacidad: "4" });
  const [newCat, setNewCat] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, cats, mesasData, pedidosData] = await Promise.all([
        getProductosTodos(ID_RESTAURANTE),
        getCategorias(ID_RESTAURANTE),
        getMesas(ID_RESTAURANTE),
        getPedidos({ id_restaurante: ID_RESTAURANTE }),
      ]);

      setProductos(prods || []);
      setCategorias(cats || []);
      setMesas(mesasData || []);

      const activePrds = (prods || []).filter((p: any) => p.disponible && !p.deleted_at);
      const activeMesas = (mesasData || []).filter((m: any) => m.activa);
      const pagados = (pedidosData || []).filter((p: any) => p.estado_pago === "PAGADO");
      const ingresos = pagados.reduce((s: number, p: any) => s + Number(p.total), 0);

      setStats({
        productos: activePrds.length,
        mesas: activeMesas.length,
        pedidosHoy: (pedidosData || []).length,
        ingresosHoy: ingresos,
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProduct = async () => {
    if (!newProd.nombre || !newProd.id_categoria || !newProd.precio) return;
    setSaving(true);
    try {
      await crearProducto({
        id_restaurante: ID_RESTAURANTE,
        id_categoria: newProd.id_categoria,
        nombre: newProd.nombre,
        descripcion: newProd.descripcion,
        precio: parseFloat(newProd.precio),
        stock: parseInt(newProd.stock) || 10,
        es_bebida: newProd.es_bebida,
        disponible: true,
      });
      setShowProductModal(false);
      setNewProd({ nombre: "", id_categoria: "", precio: "", descripcion: "", stock: "10", es_bebida: false });
      loadData();
    } catch (err) {
      console.error("Error creating product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisponible = async (prod: any) => {
    try {
      await actualizarProducto(prod.id, { disponible: !prod.disponible });
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, disponible: !p.disponible } : p))
      );
    } catch (err) {
      console.error("Error toggling product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await eliminarProducto(id);
      loadData();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleCreateMesa = async () => {
    if (!newMesa.numero) return;
    setSaving(true);
    try {
      await crearMesa({
        id_restaurante: ID_RESTAURANTE,
        numero: parseInt(newMesa.numero),
        capacidad: parseInt(newMesa.capacidad) || 4,
      });
      setShowMesaModal(false);
      setNewMesa({ numero: "", capacidad: "4" });
      loadData();
    } catch (err) {
      console.error("Error creating mesa:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCat.nombre) return;
    setSaving(true);
    try {
      await crearCategoria({
        id_restaurante: ID_RESTAURANTE,
        nombre: newCat.nombre,
        descripcion: newCat.descripcion,
        orden: categorias.length + 1,
      });
      setShowCatModal(false);
      setNewCat({ nombre: "", descripcion: "" });
      loadData();
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setSaving(false);
    }
  };

  const getQrUrl = (mesaSlug: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${base}/${mesaSlug}/menu`;
  };

  const downloadQr = (mesaSlug: string, mesaNum: number) => {
    const canvas = document.querySelector(`#qr-${mesaSlug} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `qr-mesa-${mesaNum}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const statCards = [
    { label: "Productos activos", value: String(stats.productos), Icon: Package, color: "var(--primary)" },
    { label: "Mesas activas", value: String(stats.mesas), Icon: Armchair, color: "var(--tertiary)" },
    { label: "Pedidos hoy", value: String(stats.pedidosHoy), Icon: Receipt, color: "var(--success)" },
    { label: "Ingresos hoy", value: formatPrecio(stats.ingresosHoy), Icon: DollarSign, color: "var(--primary)" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />
          ))}
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
                <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: "8px 0 0" }}>
                  {s.value}
                </p>
              </div>
              <s.Icon size={24} color={s.color} style={{ opacity: 0.3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0, overflowX: "auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                fontSize: 12,
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all var(--duration-fast) var(--ease-out)",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder={`Buscar ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ maxWidth: 320, paddingLeft: 36 }}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              if (activeTab === "productos") setShowProductModal(true);
              else if (activeTab === "mesas") setShowMesaModal(true);
              else if (activeTab === "categorias") setShowCatModal(true);
            }}
          >
            <Plus size={14} /> Agregar nuevo
          </button>
        </div>

        {/* Productos Table */}
        {activeTab === "productos" && (
          <div className="table-container animate-fade-in">
            <table>
              <thead>
                <tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {productos
                  .filter((p) => !p.deleted_at && p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500, color: "var(--text)" }}>{p.nombre}</td>
                      <td>{p.categoria?.nombre || "—"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrecio(Number(p.precio))}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{p.stock}</td>
                      <td>
                        <span className={`badge ${p.disponible ? "badge-ready" : "badge-cancelled"}`}>
                          {p.disponible ? "Disponible" : "Agotado"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleToggleDisponible(p)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>
                            {p.disponible ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Categorias */}
        {activeTab === "categorias" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {categorias
              .filter((c: any) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((cat: any) => (
                <div key={cat.id} className="card-flat" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Tag size={16} color="var(--primary)" />
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {cat.nombre}
                    </h4>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
                    {cat.descripcion || "Sin descripción"}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Mesas Grid with QR */}
        {activeTab === "mesas" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {mesas.map((m: any) => (
              <div
                key={m.id}
                className="card-flat"
                style={{
                  padding: "20px",
                  textAlign: "center",
                  opacity: m.activa ? 1 : 0.5,
                }}
              >
                {/* QR Code */}
                <div id={`qr-${m.slug}`} style={{ margin: "0 auto 12px", display: "flex", justifyContent: "center" }}>
                  <QRCode
                    value={getQrUrl(m.slug)}
                    size={120}
                    bgColor="transparent"
                    fgColor="#C5A059"
                    qrStyle="dots"
                    eyeRadius={8}
                  />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  Mesa {m.numero}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px" }}>
                  Cap. {m.capacidad} · {m.activa ? "Activa" : "Inactiva"}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    margin: "0 0 12px",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    padding: "4px 8px",
                    background: "var(--surface)",
                    borderRadius: 4,
                  }}
                >
                  /{m.slug}/menu
                </p>
                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  <button
                    onClick={() => downloadQr(m.slug, m.numero)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}
                  >
                    <Download size={12} /> Descargar QR
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getQrUrl(m.slug));
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px 10px" }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ))}
            {/* Add mesa card */}
            <div
              className="card-flat"
              onClick={() => setShowMesaModal(true)}
              style={{
                padding: "20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px dashed var(--border)",
                minHeight: 240,
              }}
            >
              <Plus size={32} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Nueva Mesa</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showProductModal && (
        <>
          <div className="overlay" onClick={() => setShowProductModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 420, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Nuevo Producto</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input className="input" placeholder="Nombre" value={newProd.nombre} onChange={(e) => setNewProd({ ...newProd, nombre: e.target.value })} />
              <select className="input" value={newProd.id_categoria} onChange={(e) => setNewProd({ ...newProd, id_categoria: e.target.value })} style={{ color: newProd.id_categoria ? "var(--text)" : "var(--text-muted)" }}>
                <option value="">Seleccionar categoría</option>
                {categorias.map((c: any) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>
              <input className="input" placeholder="Precio" type="number" step="0.01" value={newProd.precio} onChange={(e) => setNewProd({ ...newProd, precio: e.target.value })} />
              <input className="input" placeholder="Descripción" value={newProd.descripcion} onChange={(e) => setNewProd({ ...newProd, descripcion: e.target.value })} />
              <div style={{ display: "flex", gap: 12 }}>
                <input className="input" placeholder="Stock" type="number" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} style={{ flex: 1 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={newProd.es_bebida} onChange={(e) => setNewProd({ ...newProd, es_bebida: e.target.checked })} />
                  Es bebida
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowProductModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreateProduct} className="btn btn-primary" disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Crear"}
              </button>
            </div>
          </div>
        </>
      )}

      {showMesaModal && (
        <>
          <div className="overlay" onClick={() => setShowMesaModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 360, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Nueva Mesa</h3>
              <button onClick={() => setShowMesaModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input className="input" placeholder="Número de mesa" type="number" value={newMesa.numero} onChange={(e) => setNewMesa({ ...newMesa, numero: e.target.value })} />
              <input className="input" placeholder="Capacidad" type="number" value={newMesa.capacidad} onChange={(e) => setNewMesa({ ...newMesa, capacidad: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowMesaModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreateMesa} className="btn btn-primary" disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Crear"}
              </button>
            </div>
          </div>
        </>
      )}

      {showCatModal && (
        <>
          <div className="overlay" onClick={() => setShowCatModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 360, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Nueva Categoría</h3>
              <button onClick={() => setShowCatModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input className="input" placeholder="Nombre" value={newCat.nombre} onChange={(e) => setNewCat({ ...newCat, nombre: e.target.value })} />
              <input className="input" placeholder="Descripción (opcional)" value={newCat.descripcion} onChange={(e) => setNewCat({ ...newCat, descripcion: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCatModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreateCategoria} className="btn btn-primary" disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Crear"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
