"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useMenuDigital } from "@/viewmodels/useMenuDigital";
import type { Agregado } from "@/lib/database.types";
import {
  Search, ShoppingBag, Plus, X, StickyNote, CheckCircle2,
  Flame, Coffee, AlertCircle, Info,
} from "lucide-react";

export default function MenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const vm = useMenuDigital();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!vm.selectedProduct) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    sheetRef.current?.focus();
  }, [vm.selectedProduct]);

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ width: 80, height: 32, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: vm.itemCount > 0 ? 140 : 24 }}>
      <section className="card hero-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <p className="label">Menú digital</p>
            <h2 style={{ fontSize: 24, margin: "8px 0", color: "var(--text)", fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontWeight: 400 }}>
              {vm.restaurante?.nombre || "El Mijano"}
            </h2>
            <p className="section-note">Mesa {vm.mesa?.numero || "—"} · Ordena rápido, sin filas y con el estilo del restaurante.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <span className="menu-pill" style={{ color: "var(--primary)" }}>
              {vm.mesa ? "QR activo" : "Mesa pendiente"}
            </span>
            {vm.hasActivePedido && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => router.push(`/${slug}/estado?pedido=${vm.activePedidoId}`)}
              >
                Ver estado del pedido
              </button>
            )}
          </div>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="label">Buscar</p>
            <div style={{ position: "relative" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
                placeholder="¿Qué te apetece hoy?"
                className="input"
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            <button onClick={() => vm.setSelectedCat("all")} className={`menu-pill ${vm.selectedCat === "all" ? "active" : ""}`}>Todos</button>
            {vm.categorias.map((cat: any) => (
              <button key={cat.id} onClick={() => vm.setSelectedCat(cat.id)} className={`menu-pill ${vm.selectedCat === cat.id ? "active" : ""}`}>{cat.nombre}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="menu-grid">
        {vm.productosFiltrados.map((prod: any) => (
          <article key={prod.id} className="menu-card" style={{ textAlign: "left" }}>
            {prod.imagen_url ? (
              <div className="menu-card-image">
                <img src={prod.imagen_url} alt={prod.nombre} />
              </div>
            ) : null}
            <div className="menu-card-meta">
              <div className="menu-card-icon">
                {prod.es_bebida ? <Coffee size={22} /> : <Flame size={22} />}
              </div>
              <div className="menu-card-title">
                <h3>{prod.nombre}</h3>
                {prod.descripcion && <p>{prod.descripcion}</p>}
              </div>
            </div>
            <div className="menu-card-footer">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{formatPrecio(Number(prod.precio))}</span>
                <span className="menu-pill">{prod.es_bebida ? "Bebida" : "Plato"}</span>
              </div>
              <Info size={18} color="var(--text-muted)" />
            </div>
            <div className="menu-card-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => vm.openProductDetail(prod)}>
                Ver opciones
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => vm.quickAddProduct(prod)}>
                + Agregar
              </button>
            </div>
          </article>
        ))}
      </section>

      {vm.productosFiltrados.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Search size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p>No se encontraron platos con ese término.</p>
        </div>
      )}

      {vm.itemCount > 0 && (
        <div className="cart-bottom-bar">
          <button onClick={() => router.push(`/${slug}/pedido`)} className="btn btn-primary btn-lg" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <ShoppingBag size={18} /> Ver pedido ({vm.itemCount}) · {formatPrecio(vm.cartTotal)}
          </button>
        </div>
      )}

      {vm.selectedProduct && (
        <>
          <div className="overlay" onClick={vm.closeDetail} />
          <div className="bottom-sheet">
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{vm.selectedProduct.nombre}</h3>
                <p style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{formatPrecio(Number(vm.selectedProduct.precio))}</p>
              </div>
              <button onClick={vm.closeDetail} style={{ background: "var(--surface)", border: "none", borderRadius: 10, padding: 10, cursor: "pointer" }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            {vm.selectedProduct.descripcion && (
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.7 }}>{vm.selectedProduct.descripcion}</p>
            )}

            {!vm.loadingDetail && vm.productDetail?.producto_grupo?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {vm.productDetail.producto_grupo.map((pg: any) => {
                  const grupo = pg.grupo;
                  if (!grupo) return null;
                  const min = grupo.min_seleccion || 0;
                  const max = grupo.max_seleccion || 99;
                  const selectedInGroup = vm.selectedAgregados.filter((a: Agregado) =>
                    grupo.agregado?.some((ga: Agregado) => ga.id === a.id)
                  ).length;
                  const isGroupValid = selectedInGroup >= min;
                  const isGroupFull = selectedInGroup >= max;

                  return (
                    <div key={grupo.id} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <p className="label" style={{ margin: 0 }}>{grupo.nombre}</p>
                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: "999px", background: isGroupValid ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: isGroupValid ? "var(--success)" : "var(--warning)", fontWeight: 700 }}>
                          {selectedInGroup}/{max} {min > 0 ? `(mín. ${min})` : "opcional"}
                        </span>
                      </div>
                      {min > 0 && selectedInGroup < min && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--warning)", marginBottom: 10 }}>
                          <AlertCircle size={12} /> Selecciona al menos {min}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {grupo.agregado?.filter((a: Agregado) => a.disponible).map((ag: Agregado) => {
                          const isSelected = vm.selectedAgregados.some((a) => a.id === ag.id);
                          const isDisabled = !isSelected && isGroupFull;
                          return (
                            <button
                              key={ag.id}
                              type="button"
                              onClick={() => !isDisabled && vm.toggleAgregado(ag, grupo.id)}
                              disabled={isDisabled}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 16px",
                                background: isSelected ? "var(--primary-ghost)" : "var(--surface)",
                                border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.45 : 1,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: 6, border: isSelected ? "none" : "1px solid var(--border)", background: isSelected ? "var(--primary)" : "transparent", display: "grid", placeItems: "center" }}>
                                  {isSelected && <CheckCircle2 size={12} color="var(--text-inverse)" />}
                                </div>
                                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{ag.nombre}</span>
                              </div>
                              {Number(ag.precio) > 0 && (
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>+{formatPrecio(Number(ag.precio))}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p className="label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><StickyNote size={12} /> Notas</p>
              <input className="input" placeholder="Sin cebolla, extra picante..." value={vm.notas} onChange={(e) => vm.setNotas(e.target.value)} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p className="label" style={{ marginBottom: 8 }}>Cantidad</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <button onClick={() => vm.setCantidad(Math.max(1, vm.cantidad - 1))} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 18, fontWeight: 600 }}>-</button>
                <span style={{ fontSize: 16, fontWeight: 600, minWidth: 40, textAlign: "center" }}>{vm.cantidad}</span>
                <button onClick={() => vm.setCantidad(vm.cantidad + 1)} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 18, fontWeight: 600 }}>+</button>
              </div>
            </div>

            <button
              onClick={vm.handleAddToCart}
              disabled={!vm.canAddToCart}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: vm.canAddToCart ? 1 : 0.55 }}
            >
              <Plus size={16} /> Agregar al pedido · {formatPrecio(vm.precioConAgregados * vm.cantidad)}
            </button>
            {!vm.canAddToCart && (
              <p style={{ fontSize: 11, color: "var(--warning)", textAlign: "center", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <AlertCircle size={12} /> Debes completar las selecciones mínimas.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
