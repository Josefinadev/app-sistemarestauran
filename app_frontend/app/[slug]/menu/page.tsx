"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useMenuDigital } from "@/viewmodels/useMenuDigital";
import type { Agregado } from "@/lib/database.types";
import {
  Search, ShoppingBag, Plus, X, StickyNote, CheckCircle2,
  Flame, Coffee, Info, User, QrCode, ArrowRight,
  MapPin, FlaskConical, AlertTriangle
} from "lucide-react";

export default function MenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const vm = useMenuDigital();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!vm.selectedProduct) return;
    requestAnimationFrame(() => {
      if (!sheetRef.current) return;
      sheetRef.current.scrollTo({ top: 0, behavior: "auto" });
      sheetRef.current.focus();
    });
  }, [vm.selectedProduct]);

  useEffect(() => {
    if (!vm.selectedProduct) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [vm.selectedProduct]);

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ width: 80, height: 32, borderRadius: 16 }} />))}
        </div>
        {[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />))}
      </div>
    );
  }

  const showMesaWarning = !vm.mesa;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: vm.itemCount > 0 ? 140 : 24 }}>
      {/* MESA WARNING BAR */}
      {showMesaWarning && (
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 20, padding: "20px", display: "flex", flexDirection: "column", gap: 16, marginBottom: -8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <QrCode size={22} color="var(--warning)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>Mesa no identificada</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>Debes escanear el QR o usar una mesa de prueba para poder ordenar.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={vm.usarMesaPrueba} 
              className="btn btn-secondary" 
              style={{ flex: 1, height: 44, fontSize: 13, gap: 8, background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border)" }}
            >
              <FlaskConical size={16} /> Mesa de prueba
            </button>
            <button className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 13, gap: 8 }}>
              Escanear <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <section className="card hero-card" style={{ padding: 24, borderRadius: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <p className="label">Restaurante</p>
            <h2 style={{ fontSize: 28, margin: "8px 0", color: "var(--text)", fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontWeight: 400, letterSpacing: "-0.02em" }}>
              {vm.restaurante?.nombre || "Cargando..."}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="menu-pill" style={{ color: "var(--primary)", background: "var(--primary-ghost)", fontWeight: 700 }}>
                {vm.mesa ? `Mesa ${vm.mesa.numero}` : "Sin mesa"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 100, border: "1px solid var(--border)" }}>
                <MapPin size={10} color="var(--primary)" />
                {vm.restaurante?.latitud ? "Ubicación requerida para pedidos" : "Ubicación no configurada"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            {vm.usuario ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 100, border: "1px solid var(--border)" }}>
                <User size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{vm.usuario.nombre.split(" ")[0]}</span>
              </div>
            ) : (
              <button onClick={() => router.push(`/${slug}/registro`)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Crear cuenta</button>
            )}
          </div>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ position: "relative" }}>
              <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} placeholder="Busca tu plato favorito..." className="input" style={{ paddingLeft: 46, height: 52, borderRadius: 16 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, width: "100%" }}>
            <button onClick={() => vm.setSelectedCat("all")} className={`menu-pill ${vm.selectedCat === "all" ? "active" : ""}`} style={{ padding: "10px 20px" }}>Todos</button>
            {vm.categorias.map((cat: any) => (<button key={cat.id} onClick={() => vm.setSelectedCat(cat.id)} className={`menu-pill ${vm.selectedCat === cat.id ? "active" : ""}`} style={{ padding: "10px 20px" }}>{cat.nombre}</button>))}
          </div>
        </div>
      </section>

      <section className="menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {vm.productosFiltrados.map((prod: any) => (
          <article key={prod.id} className="menu-card" style={{ textAlign: "left", borderRadius: 24, overflow: "hidden" }}>
            {prod.imagen_url && <div className="menu-card-image" style={{ height: 180 }}><img src={prod.imagen_url} alt={prod.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div style={{ padding: 20 }}>
              <div className="menu-card-meta">
                <div className="menu-card-icon" style={{ background: "var(--primary-ghost)", color: "var(--primary)" }}>{prod.es_bebida ? <Coffee size={20} /> : <Flame size={20} />}</div>
                <div className="menu-card-title"><h3 style={{ fontSize: 18, fontWeight: 700 }}>{prod.nombre}</h3>{prod.descripcion && <p style={{ fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{prod.descripcion}</p>}</div>
              </div>
              <div className="menu-card-footer" style={{ marginTop: 16 }}>
                <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{formatPrecio(Number(prod.precio))}</span><span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{prod.es_bebida ? "Bebida" : "Plato"}</span></div>
                <button type="button" onClick={() => vm.openProductDetail(prod)} style={{ background: "var(--surface)", border: "none", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Info size={18} color="var(--text-muted)" /></button>
              </div>
              <div className="menu-card-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: 12 }} onClick={() => vm.openProductDetail(prod)}>Detalles</button>
                <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, borderRadius: 12 }} onClick={() => vm.quickAddProduct(prod)}>+ Agregar</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {vm.productosFiltrados.length === 0 && (
        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}><Search size={48} style={{ margin: "0 auto 16px", display: "block", opacity: 0.2 }} /><p style={{ fontSize: 16 }}>No se encontraron platos.</p></div>
      )}

      {vm.itemCount > 0 && (
        <div className="cart-bottom-bar" style={{ padding: "20px 24px", background: "rgba(12,11,14,0.85)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)" }}>
          <button onClick={() => router.push(`/${slug}/pedido`)} className="btn btn-primary btn-lg" style={{ width: "100%", height: 56, borderRadius: 18, fontSize: 16, fontWeight: 800, gap: 12, boxShadow: "0 8px 30px rgba(197, 160, 89, 0.3)" }}>
            <ShoppingBag size={20} /> Mi pedido ({vm.itemCount}) · {formatPrecio(vm.cartTotal)}
          </button>
        </div>
      )}

      {vm.selectedProduct && (
        <>
          <div className="overlay" onClick={vm.closeDetail} />
          <div ref={sheetRef} className="bottom-sheet" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: "24px 24px 40px" }} role="dialog" aria-modal="true" tabIndex={-1}>
            <div style={{ position: "sticky", top: 0, zIndex: 2, margin: "-24px -24px 24px", padding: "16px 24px 16px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}><h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>{vm.selectedProduct.nombre}</h3><p style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)", margin: 0 }}>{formatPrecio(Number(vm.selectedProduct.precio))}</p></div>
                <button onClick={vm.closeDetail} style={{ background: "var(--surface)", border: "none", borderRadius: 12, padding: 12, cursor: "pointer" }}><X size={20} color="var(--text-muted)" /></button>
              </div>
            </div>
            {vm.selectedProduct.descripcion && <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.7 }}>{vm.selectedProduct.descripcion}</p>}
            {vm.productDetail?.producto_grupo?.map((pg: any) => {
              const grupo = pg.grupo; if (!grupo) return null;
              const min = grupo.min_seleccion || 0; const max = grupo.max_seleccion || 99;
              const selectedInGroup = vm.selectedAgregados.filter((a: Agregado) => grupo.agregado?.some((ga: Agregado) => ga.id === a.id)).length;
              const isGroupValid = selectedInGroup >= min; const isGroupFull = selectedInGroup >= max;
              return (
                <div key={grupo.id} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><p className="label" style={{ margin: 0, fontSize: 12 }}>{grupo.nombre}</p><span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 100, background: isGroupValid ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)", color: isGroupValid ? "var(--success)" : "var(--warning)", fontWeight: 700 }}>{selectedInGroup}/{max} {min > 0 ? `(mín. ${min})` : "opcional"}</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {grupo.agregado?.filter((a: Agregado) => a.disponible).map((ag: Agregado) => {
                      const isSelected = vm.selectedAgregados.some((a) => a.id === ag.id);
                      const isDisabled = !isSelected && isGroupFull;
                      return (<button key={ag.id} type="button" onClick={() => !isDisabled && vm.toggleAgregado(ag, grupo.id)} disabled={isDisabled} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: isSelected ? "var(--primary-ghost)" : "var(--surface)", border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)", borderRadius: 16, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.4 : 1, transition: "all 0.2s" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 20, height: 20, borderRadius: 6, border: isSelected ? "none" : "1px solid var(--border)", background: isSelected ? "var(--primary)" : "transparent", display: "grid", placeItems: "center" }}>{isSelected && <CheckCircle2 size={12} color="var(--text-inverse)" />}</div><span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{ag.nombre}</span></div>{Number(ag.precio) > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>+{formatPrecio(Number(ag.precio))}</span>}</button>);
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ marginBottom: 24 }}><p className="label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><StickyNote size={14} /> Notas especiales</p><input className="input" placeholder="Ej: Sin cebolla, etc..." value={vm.notas} onChange={(e) => vm.setNotas(e.target.value)} style={{ height: 50, borderRadius: 14 }} /></div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", borderRadius: 14, padding: 6, border: "1px solid var(--border)" }}>
                <button onClick={() => vm.setCantidad(Math.max(1, vm.cantidad - 1))} className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0 }}>-</button>
                <span style={{ minWidth: 40, textAlign: "center", fontWeight: 800, fontSize: 16 }}>{vm.cantidad}</span>
                <button onClick={() => vm.setCantidad(vm.cantidad + 1)} className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0 }}>+</button>
              </div>
              <button 
                onClick={vm.handleAddToCart} 
                disabled={!vm.canAddToCart} 
                className="btn btn-primary" 
                style={{ flex: 1, height: 52, fontWeight: 800, borderRadius: 16, fontSize: 15 }}
              >
                Agregar · {formatPrecio(vm.precioConAgregados * vm.cantidad)}
              </button>
            </div>
            {!vm.canAddToCart && <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 12, color: "var(--warning)", fontSize: 11, fontWeight: 600 }}><AlertTriangle size={14} /> Completa las selecciones mínimas obligatorias</div>}
          </div>
        </>
      )}
    </div>
  );
}
