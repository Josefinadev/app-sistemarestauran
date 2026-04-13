"use client";

import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useMenuDigital } from "@/viewmodels/useMenuDigital";
import type { Agregado } from "@/lib/database.types";
import {
  Search, ShoppingBag, Plus, X, StickyNote, CheckCircle2,
  Flame, Coffee, ArrowRight, AlertCircle, Info,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VIEW — Menú Digital
   Solo renderizado. Lógica en useMenuDigital.
   Bottom sheet centrado + validación min/max agregados.
   ═══════════════════════════════════════════════════════════ */

export default function MenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const vm = useMenuDigital();

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto" }} />
        <div style={{ display: "flex", gap: 8 }}>{[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ width: 80, height: 32, borderRadius: 16 }} />))}</div>
        {[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
          Menú <em style={{ color: "var(--primary)" }}>Digital</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Mesa {vm.mesa?.numero || "—"} · {vm.restaurante?.nombre || "El Mijano"}</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} placeholder="Buscar platos..." className="input" style={{ paddingLeft: 38, width: "100%" }} />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        <button onClick={() => vm.setSelectedCat("all")} className={`btn btn-sm ${vm.selectedCat === "all" ? "btn-primary" : "btn-secondary"}`} style={{ whiteSpace: "nowrap" }}>Todos</button>
        {vm.categorias.map((cat: any) => (
          <button key={cat.id} onClick={() => vm.setSelectedCat(cat.id)} className={`btn btn-sm ${vm.selectedCat === cat.id ? "btn-primary" : "btn-secondary"}`} style={{ whiteSpace: "nowrap" }}>{cat.nombre}</button>
        ))}
      </div>

      {/* Products */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {vm.productosFiltrados.map((prod: any) => (
          <div key={prod.id} onClick={() => vm.openProductDetail(prod)} style={{ display: "flex", gap: 16, padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all var(--duration-fast) var(--ease-out)" }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {prod.es_bebida ? <Coffee size={24} color="var(--primary)" /> : <Flame size={24} color="var(--primary)" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{prod.nombre}</h3>
              {prod.descripcion && (<p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{prod.descripcion}</p>)}
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(Number(prod.precio))}</span>
            </div>
          </div>
        ))}
      </div>

      {vm.productosFiltrados.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Search size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} /><p>No se encontraron platos</p>
        </div>
      )}

      {/* Cart FAB */}
      {vm.itemCount > 0 && (
        <button onClick={() => router.push(`/${slug}/pedido`)} className="btn btn-primary animate-fade-in-up" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", boxShadow: "0 8px 32px rgba(197,160,89,0.3)", display: "flex", alignItems: "center", gap: 8, zIndex: 50, padding: "14px 28px" }}>
          <ShoppingBag size={16} /> Ver pedido ({vm.itemCount}) · {formatPrecio(vm.cartTotal)} <ArrowRight size={14} />
        </button>
      )}

      {/* Bottom Sheet — centered properly */}
      {vm.selectedProduct && (
        <>
          <div className="overlay" onClick={vm.closeDetail} />
          <div className="bottom-sheet">
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{vm.selectedProduct.nombre}</h3>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{formatPrecio(Number(vm.selectedProduct.precio))}</p>
              </div>
              <button onClick={vm.closeDetail} style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}><X size={16} color="var(--text-muted)" /></button>
            </div>
            {vm.selectedProduct.descripcion && (<p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>{vm.selectedProduct.descripcion}</p>)}

            {/* Agregados with min/max validation */}
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
                    <div key={grupo.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <p className="label" style={{ margin: 0 }}>{grupo.nombre}</p>
                        <span style={{
                          fontSize: 9,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: !isGroupValid ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)",
                          color: !isGroupValid ? "var(--warning)" : "var(--success)",
                          fontWeight: 600,
                        }}>
                          {selectedInGroup}/{max} {min > 0 ? `(mín. ${min})` : "(opcional)"}
                        </span>
                      </div>
                      {min > 0 && selectedInGroup < min && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--warning)", marginBottom: 6 }}>
                          <AlertCircle size={10} /> Selecciona al menos {min}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 14px",
                                background: isSelected ? "var(--primary-ghost)" : "var(--surface)",
                                border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.4 : 1,
                                transition: "all var(--duration-fast) var(--ease-out)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: 4, border: isSelected ? "none" : "1px solid var(--border)", background: isSelected ? "var(--primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {isSelected && <CheckCircle2 size={12} color="var(--text-inverse)" />}
                                </div>
                                <span style={{ fontSize: 13, color: "var(--text)" }}>{ag.nombre}</span>
                              </div>
                              {Number(ag.precio) > 0 && (<span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>+{formatPrecio(Number(ag.precio))}</span>)}
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
              <input className="input" placeholder="Sin cebolla, extra picante..." value={vm.notas} onChange={(e) => vm.setNotas(e.target.value)} style={{ width: "100%" }} />
            </div>

            <button
              onClick={vm.handleAddToCart}
              disabled={!vm.canAddToCart}
              className="btn btn-primary btn-lg"
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: vm.canAddToCart ? 1 : 0.5,
              }}
            >
              <Plus size={16} /> Agregar al pedido · {formatPrecio(vm.precioConAgregados)}
            </button>
            {!vm.canAddToCart && (
              <p style={{ fontSize: 10, color: "var(--warning)", textAlign: "center", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <AlertCircle size={10} /> Completa las selecciones mínimas obligatorias
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
