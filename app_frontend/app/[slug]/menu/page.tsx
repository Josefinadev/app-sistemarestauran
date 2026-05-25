"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useMenuDigital } from "@/viewmodels/useMenuDigital";
import type { Agregado } from "@/lib/database.types";
import {
  Search, ShoppingCart, Plus, X, StickyNote, CheckCircle2,
  Info, User, QrCode, ArrowRight,
  MapPin, FlaskConical, AlertTriangle, ChefHat, Menu as MenuIcon,
  ChevronDown,
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
      <div className="client-menu-page" style={{ paddingTop: 24 }}>
        <div className="skeleton" style={{ height: 230, borderRadius: 28, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ width: 92, height: 36, borderRadius: 18 }} />)}
        </div>
        <div className="client-product-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 176, borderRadius: 20 }} />)}
        </div>
      </div>
    );
  }

  const showMesaWarning = !vm.mesa;
  const heroImage = vm.restaurante?.hero_banner_url || "/assets/placeholder-dish.png";
  const logoUrl = vm.restaurante?.logo_url;

  return (
    <main className="client-menu-page animate-fade-in" style={{ paddingBottom: vm.itemCount > 0 ? 150 : 32 }}>
      <section className="client-hero" style={{ "--client-hero-image": `url(${heroImage})` } as CSSProperties}>
        <header className="client-topbar">
          <button type="button" className="client-round-button client-mobile-only" aria-label="Abrir menú">
            <MenuIcon size={20} />
          </button>

          <div className="client-brand">
            <div className="client-brand-mark">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={vm.restaurante?.nombre || "Restaurante"} />
              ) : (
                <ChefHat size={34} />
              )}
            </div>
            <div>
              <span className="client-brand-kicker">Restaurante</span>
              <strong>{vm.restaurante?.nombre || "Cargando..."}</strong>
            </div>
          </div>

          <div className="client-top-actions">
            <div className="client-table-pill">
              <MapPin size={18} />
              <span>{vm.mesa ? `Mesa ${vm.mesa.numero}` : "Sin mesa"}</span>
              <ChevronDown size={16} />
            </div>
            <div className="client-user-pill">
              <User size={16} />
              <span>{vm.usuario?.nombre?.split(" ")[0] || "Cliente"}</span>
            </div>
          </div>
        </header>

        <div className="client-hero-copy">
          <h1>Busca tu plato favorito...</h1>
          <div className="client-search-box">
            <input
              type="text"
              value={vm.searchTerm}
              onChange={(e) => vm.setSearchTerm(e.target.value)}
              placeholder="Busca tu plato favorito..."
            />
            <Search size={22} />
          </div>
        </div>
      </section>

      <nav className="client-category-row" aria-label="Categorías del menú">
        <button onClick={() => vm.setSelectedCat("all")} className={`client-category-pill ${vm.selectedCat === "all" ? "active" : ""}`}>Todos</button>
        {vm.categorias.map((cat: any) => (
          <button key={cat.id} onClick={() => vm.setSelectedCat(cat.id)} className={`client-category-pill ${vm.selectedCat === cat.id ? "active" : ""}`}>
            {cat.nombre}
          </button>
        ))}
      </nav>

      {showMesaWarning && (
        <section className="client-warning-card">
          <div className="client-warning-icon"><QrCode size={22} /></div>
          <div>
            <h2>Mesa no identificada</h2>
            <p>Escanea el QR de tu mesa o usa una mesa de prueba para poder ordenar.</p>
          </div>
          <div className="client-warning-actions">
            <button type="button" onClick={vm.usarMesaPrueba} className="btn btn-secondary"><FlaskConical size={16} /> Mesa de prueba</button>
            <button type="button" className="btn btn-primary">Escanear <ArrowRight size={16} /></button>
          </div>
        </section>
      )}

      <section className="client-product-grid">
        {vm.productosFiltrados.map((prod: any) => {
          const categoryLabel = prod.categoria?.nombre || (prod.es_bebida ? "Bebida" : "Plato");
          const productImage = prod.imagen_url || "/assets/placeholder-dish.png";
          return (
            <article key={prod.id} className="client-product-card">
              <div className="client-product-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImage} alt={prod.nombre} />
              </div>
              <div className="client-product-body">
                <div>
                  <h2>{prod.nombre}</h2>
                  {prod.descripcion && <p className="client-product-desc">{prod.descripcion}</p>}
                  <span className="client-product-tag">{categoryLabel}</span>
                </div>
                <div className="client-product-footer">
                  <strong>{formatPrecio(Number(prod.precio))}</strong>
                  <div className="client-product-actions">
                    <button type="button" className="client-outline-button" onClick={() => vm.openProductDetail(prod)}><Info size={14} /> Detalles</button>
                    <button type="button" className="client-fill-button" onClick={() => vm.quickAddProduct(prod)}><Plus size={14} /> Agregar</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {vm.productosFiltrados.length === 0 && (
        <div className="client-empty-state"><Search size={44} /><p>No se encontraron platos.</p></div>
      )}

      {vm.itemCount > 0 && (
        <button className="client-cart-fab animate-scale-in" onClick={() => router.push(`/${slug}/pedido`)} type="button">
          <div className="badge-count">{vm.itemCount}</div>
          <ShoppingCart size={24} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ver Pedido</span>
            <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{formatPrecio(vm.cartTotal)}</span>
          </div>
        </button>
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
    </main>
  );
}
