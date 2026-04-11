"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { getCategorias, getProductos, getProductoDetalle } from "@/lib/api";
import { useAuth, useCarrito } from "@/lib/store";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  StickyNote,
  CheckCircle2,
  Flame,
  Coffee,
  ArrowRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MENÚ DIGITAL — Responsive, Lucide icons, datos reales
   ═══════════════════════════════════════════════════════════ */

import type { Agregado } from "@/lib/database.types";

interface GrupoAgregado { id: string; nombre: string; min_seleccion: number; max_seleccion: number; agregado: Agregado[]; }

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { restaurante, mesa } = useAuth();
  const { addItem, getItemCount, getTotal } = useCarrito();

  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [notas, setNotas] = useState("");
  const [selectedAgregados, setSelectedAgregados] = useState<Agregado[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      if (!restaurante?.id) return;
      try {
        const [cats, prods] = await Promise.all([
          getCategorias(restaurante.id),
          getProductos(restaurante.id),
        ]);
        setCategorias(cats || []);
        setProductos(prods || []);
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [restaurante?.id]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p: any) => {
      const matchCat = selectedCat === "all" || p.id_categoria === selectedCat;
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, selectedCat, searchTerm]);

  const openProductDetail = async (prod: any) => {
    setSelectedProduct(prod);
    setNotas("");
    setSelectedAgregados([]);
    setLoadingDetail(true);

    try {
      const detail = await getProductoDetalle(prod.id);
      setProductDetail(detail);
    } catch {
      setProductDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleAgregado = (ag: Agregado) => {
    setSelectedAgregados((prev) =>
      prev.find((a) => a.id === ag.id)
        ? prev.filter((a) => a.id !== ag.id)
        : [...prev, ag]
    );
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem(selectedProduct, notas, selectedAgregados);
    setSelectedProduct(null);
    setProductDetail(null);
  };

  const itemCount = getItemCount();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto" }} />
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ width: 80, height: 32, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
          fontSize: "clamp(20px, 4vw, 26px)",
          fontWeight: 400, color: "var(--text)", margin: "0 0 4px",
        }}>
          Menú <em style={{ color: "var(--primary)" }}>Digital</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Mesa {mesa?.numero || "—"} · {restaurante?.nombre || "El Mijano"}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar platos..."
          className="input"
          style={{ paddingLeft: 38, width: "100%" }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        <button
          onClick={() => setSelectedCat("all")}
          className={`btn btn-sm ${selectedCat === "all" ? "btn-primary" : "btn-secondary"}`}
          style={{ whiteSpace: "nowrap" }}
        >
          Todos
        </button>
        {categorias.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`btn btn-sm ${selectedCat === cat.id ? "btn-primary" : "btn-secondary"}`}
            style={{ whiteSpace: "nowrap" }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {productosFiltrados.map((prod: any) => (
          <div
            key={prod.id}
            onClick={() => openProductDetail(prod)}
            style={{
              display: "flex",
              gap: 16,
              padding: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              cursor: "pointer",
              transition: "all var(--duration-fast) var(--ease-out)",
            }}
          >
            {/* Icon placeholder */}
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: "var(--primary-ghost)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {prod.es_bebida ? (
                <Coffee size={24} color="var(--primary)" />
              ) : (
                <Flame size={24} color="var(--primary)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                {prod.nombre}
              </h3>
              {prod.descripcion && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                  {prod.descripcion}
                </p>
              )}
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>
                {formatPrecio(Number(prod.precio))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Search size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p>No se encontraron platos</p>
        </div>
      )}

      {/* Cart FAB */}
      {itemCount > 0 && (
        <button
          onClick={() => router.push(`/${slug}/pedido`)}
          className="btn btn-primary animate-fade-in-up"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 8px 32px rgba(197,160,89,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 50,
            padding: "14px 28px",
          }}
        >
          <ShoppingBag size={16} />
          Ver pedido ({itemCount}) · {formatPrecio(getTotal())}
          <ArrowRight size={14} />
        </button>
      )}

      {/* ── Product Detail Bottom Sheet ── */}
      {selectedProduct && (
        <>
          <div className="overlay" onClick={() => setSelectedProduct(null)} />
          <div
            className="animate-fade-in-up"
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: 500,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "var(--bg-elevated)",
              borderRadius: "24px 24px 0 0",
              border: "1px solid var(--border)",
              borderBottom: "none",
              padding: "24px",
              zIndex: 91,
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  {selectedProduct.nombre}
                </h3>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", margin: 0 }}>
                  {formatPrecio(Number(selectedProduct.precio))}
                </p>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}>
                <X size={16} color="var(--text-muted)" />
              </button>
            </div>

            {selectedProduct.descripcion && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
                {selectedProduct.descripcion}
              </p>
            )}

            {/* Agregados */}
            {!loadingDetail && productDetail?.producto_grupo?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {productDetail.producto_grupo.map((pg: any) => (
                  <div key={pg.grupo?.id || Math.random()} style={{ marginBottom: 16 }}>
                    <p className="label" style={{ marginBottom: 8 }}>
                      {pg.grupo?.nombre || "Extras"}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {pg.grupo?.agregado?.filter((a: Agregado) => a.disponible).map((ag: Agregado) => {
                        const isSelected = selectedAgregados.some((a) => a.id === ag.id);
                        return (
                          <button
                            key={ag.id}
                            type="button"
                            onClick={() => toggleAgregado(ag)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: isSelected ? "var(--primary-ghost)" : "var(--surface)",
                              border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                              transition: "all var(--duration-fast) var(--ease-out)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 18, height: 18, borderRadius: 4,
                                border: isSelected ? "none" : "1px solid var(--border)",
                                background: isSelected ? "var(--primary)" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {isSelected && <CheckCircle2 size={12} color="var(--text-inverse)" />}
                              </div>
                              <span style={{ fontSize: 13, color: "var(--text)" }}>{ag.nombre}</span>
                            </div>
                            {Number(ag.precio) > 0 && (
                              <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                                +{formatPrecio(Number(ag.precio))}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notas */}
            <div style={{ marginBottom: 20 }}>
              <p className="label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <StickyNote size={12} /> Notas
              </p>
              <input
                className="input"
                placeholder="Sin cebolla, extra picante..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {/* Add button */}
            <button
              onClick={handleAddToCart}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Plus size={16} />
              Agregar al pedido · {formatPrecio(
                Number(selectedProduct.precio) +
                selectedAgregados.reduce((s, a) => s + Number(a.precio), 0)
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
