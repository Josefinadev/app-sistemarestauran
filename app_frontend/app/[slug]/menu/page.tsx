"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useMenuDigital } from "@/viewmodels/useMenuDigital";
import { usePedidoConfirm } from "@/viewmodels/usePedidoConfirm";
import { useAuth } from "@/lib/store";
import type { Agregado } from "@/lib/database.types";
import {
  Search, ShoppingCart, Plus, X, StickyNote, CheckCircle2,
  User, FlaskConical, AlertTriangle, ChefHat,
  ChevronDown, Trash2, ShieldCheck, Check, Utensils, Loader2, AlertCircle,
  Clock, QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClientAuthModal } from "@/components/ClientAuthModal";

/* ─────────────────────────────────────────────────────────────────
   Category color mapping — deterministic per category name keyword
───────────────────────────────────────────────────────────────── */
const CAT_COLORS: [string, string][] = [
  ["entrada", "#F97316"],
  ["parrilla", "#EF4444"],
  ["pasta", "#E97B2E"],
  ["bebida", "#3B82F6"],
  ["cóctel", "#7C3AED"],
  ["coctel", "#7C3AED"],
  ["postre", "#E11D48"],
  ["sopa", "#CA8A04"],
  ["pescado", "#0EA5E9"],
  ["marisco", "#06B6D4"],
  ["pizza", "#F97316"],
  ["ensalada", "#16A34A"],
  ["hamburguesa", "#FB923C"],
  ["pollo", "#EAB308"],
  ["carne", "#DC2626"],
  ["vegetariano", "#22C55E"],
  ["sushi", "#E11D48"],
  ["desayuno", "#FBBF24"],
  ["arroz", "#84CC16"],
  ["piqueo", "#8B5CF6"],
  ["aperitivo", "#8B5CF6"],
  ["guarnición", "#65A30D"],
];

function getCatColor(name: string, primary: string): string {
  if (!name) return primary;
  const lower = name.toLowerCase();
  for (const [key, color] of CAT_COLORS) {
    if (lower.includes(key)) return color;
  }
  return primary;
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function MenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const vm = useMenuDigital();
  const cartVm = usePedidoConfirm();
  const { activePedidoId } = useAuth();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-show auth modal on first visit
  useEffect(() => {
    if (vm.loading) return;
    if (vm.usuario) return;
    const key = `auth-modal-shown:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setShowAuthModal(true);
  }, [vm.loading, vm.usuario, slug]);

  useEffect(() => {
    if (!isCartOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isCartOpen]);

  useEffect(() => {
    if (!vm.selectedProduct) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [vm.selectedProduct]);

  useEffect(() => {
    if (!vm.selectedProduct) return;
    requestAnimationFrame(() => {
      if (!sheetRef.current) return;
      sheetRef.current.scrollTo({ top: 0, behavior: "auto" });
      sheetRef.current.focus();
    });
  }, [vm.selectedProduct]);

  /* Loading skeleton */
  if (vm.loading) {
    return (
      <div className="mv2-loading">
        <Loader2 className="spin-icon" size={40} color="var(--primary)" />
      </div>
    );
  }

  const heroImage = vm.restaurante?.hero_banner_url || "/assets/placeholder-dish.png";
  const logoUrl = vm.restaurante?.logo_url;
  const primary = vm.restaurante?.color_primario || "#C5A059";
  const restName = vm.restaurante?.nombre || "Restaurante";
  const mesaNum = vm.mesa?.numero;

  return (
    <>
      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside
        className="mv2-sidebar"
        style={{ "--mv2-hero": `url(${heroImage})` } as CSSProperties}
      >
        <div className="mv2-sidebar-overlay" />
        <div className="mv2-sidebar-inner">
          {/* Logo */}
          <div className="mv2-sidebar-logo-wrap">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={restName} className="mv2-sidebar-logo" />
            ) : (
              <div className="mv2-sidebar-logo-fallback">
                <ChefHat size={52} color={primary} />
              </div>
            )}
          </div>

          {/* Brand name */}
          <div className="mv2-sidebar-brand">
            <span className="mv2-sidebar-brand-name" style={{ fontFamily: "var(--font-noto-serif), serif" }}>
              {restName}
            </span>
            <span className="mv2-sidebar-brand-sub">RESTAURANTE</span>
          </div>

          {/* Mesa card */}
          <div className="mv2-sidebar-mesa-card">
            <div className="mv2-sidebar-mesa-icon" style={{ color: primary }}>
              <Utensils size={20} />
            </div>
            <div>
              <p className="mv2-sidebar-mesa-num">{mesaNum ? `Mesa ${mesaNum}` : "Sin mesa"}</p>
              <p className="mv2-sidebar-mesa-sub">{vm.usuario?.nombre?.split(" ")[0] || "Cliente"}</p>
            </div>
          </div>

          {/* Tagline */}
          <p className="mv2-sidebar-tagline" style={{ color: primary }}>
            Sabor que<br />te hace volver
          </p>

          {/* Bottom actions */}
          <div className="mv2-sidebar-footer">
            <button onClick={() => setShowAuthModal(true)} className="mv2-sidebar-user-btn">
              <User size={13} />
              <span>{vm.usuario ? vm.usuario.nombre?.split(" ")[0] : "Mi cuenta"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MOBILE HEADER
      ══════════════════════════════════════════════ */}
      <header
        className="mv2-mobile-header"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="mv2-mobile-header-overlay" />
        <div className="mv2-mobile-header-content">
          {/* Left: logo + name */}
          <div className="mv2-mobile-brand">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={restName} className="mv2-mobile-logo" />
            ) : (
              <div className="mv2-mobile-logo-fallback">
                <ChefHat size={28} color={primary} />
              </div>
            )}
            <div className="mv2-mobile-brand-text">
              <span className="mv2-mobile-brand-sub">RESTAURANTE</span>
              <strong className="mv2-mobile-brand-name" style={{ fontFamily: "var(--font-noto-serif), serif" }}>
                {restName}
              </strong>
            </div>
          </div>

          {/* Right: mesa pill */}
          <button className="mv2-mobile-mesa-pill" onClick={() => setShowAuthModal(true)}>
            <Utensils size={14} color={primary} />
            <div className="mv2-mobile-mesa-pill-text">
              <span className="mv2-mobile-mesa-num">{mesaNum ? `Mesa ${mesaNum}` : "Sin mesa"}</span>
              <span className="mv2-mobile-mesa-sub">{vm.usuario?.nombre?.split(" ")[0] || "Cliente"}</span>
            </div>
            <ChevronDown size={13} />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <main className="mv2-main">
        {/* Desktop: restaurant title */}
        <div className="mv2-desktop-title">
          <h1 className="mv2-desktop-name" style={{ fontFamily: "var(--font-noto-serif), serif" }}>
            {restName}
          </h1>
          <div className="mv2-title-divider">
            <div className="mv2-title-divider-line" style={{ background: primary }} />
            <span style={{ color: primary, fontSize: 12 }}>◆</span>
            <div className="mv2-title-divider-line" style={{ background: primary }} />
          </div>
        </div>

        {/* Search bar */}
        <div className="mv2-search-wrap">
          <div className="mv2-search-box">
            <Search size={17} className="mv2-search-icon" />
            <input
              type="text"
              className="mv2-search-input"
              value={vm.searchTerm}
              onChange={(e) => vm.setSearchTerm(e.target.value)}
              placeholder="Busca tu plato favorito..."
            />
          </div>
        </div>

        {/* Category pills */}
        <nav className="mv2-cats-wrap" aria-label="Categorías">
          <div className="mv2-cats-scroll">
            <button
              onClick={() => vm.setSelectedCat("all")}
              className="mv2-cat-pill"
              style={vm.selectedCat === "all" ? {
                background: primary, color: "#fff",
                borderColor: primary, fontWeight: 700,
              } : {}}
            >
              <span className="mv2-cat-icon">⊞</span> Todos
            </button>
            {vm.categorias.map((cat: any) => {
              const isActive = vm.selectedCat === cat.id;
              const color = getCatColor(cat.nombre, primary);
              return (
                <button
                  key={cat.id}
                  onClick={() => vm.setSelectedCat(cat.id)}
                  className="mv2-cat-pill"
                  style={isActive ? {
                    background: color, color: "#fff",
                    borderColor: color, fontWeight: 700,
                  } : {}}
                >
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── DESKTOP GRID ── */}
        <div className="mv2-grid">
          {vm.productosFiltrados.map((prod: any) => {
            const catName = prod.categoria?.nombre || "";
            const badgeColor = getCatColor(catName, primary);
            const img = prod.imagen_url || "/assets/placeholder-dish.png";
            const agotado = prod.stock != null && prod.stock <= 0;
            return (
              <article
                key={prod.id}
                className="mv2-card"
                onClick={() => vm.openProductDetail(prod)}
                style={{ opacity: agotado ? 0.65 : 1 }}
              >
                <div className="mv2-card-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={prod.nombre} className="mv2-card-img" />
                  {catName && (
                    <span className="mv2-badge" style={{ background: badgeColor }}>{catName}</span>
                  )}
                  {agotado && <div className="mv2-card-agotado">Agotado</div>}
                </div>
                <div className="mv2-card-body">
                  <h2 className="mv2-card-name">{prod.nombre}</h2>
                  {prod.descripcion && <p className="mv2-card-desc">{prod.descripcion}</p>}
                  <div className="mv2-card-footer">
                    <span className="mv2-card-price" style={{ color: primary }}>
                      {formatPrecio(Number(prod.precio))}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {prod.stock != null && prod.stock > 0 && prod.stock <= 10 && (
                        <span className="mv2-stock-pill" style={{
                          borderColor: prod.stock <= 3 ? "#EF4444" : "#22C55E",
                          color: prod.stock <= 3 ? "#EF4444" : "#22C55E",
                        }}>
                          {prod.stock} disp.
                        </span>
                      )}
                      {!agotado && (
                        <motion.button
                          type="button"
                          className="mv2-add-btn"
                          style={{ background: primary }}
                          onClick={(e) => { e.stopPropagation(); vm.quickAddProduct(prod); }}
                          whileTap={{ scale: 0.85 }}
                          aria-label={`Agregar ${prod.nombre}`}
                        >
                          <Plus size={16} strokeWidth={3} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── MOBILE LIST ── */}
        <div className="mv2-list">
          {vm.productosFiltrados.map((prod: any) => {
            const catName = prod.categoria?.nombre || "";
            const badgeColor = getCatColor(catName, primary);
            const img = prod.imagen_url || "/assets/placeholder-dish.png";
            const agotado = prod.stock != null && prod.stock <= 0;
            return (
              <article
                key={prod.id}
                className="mv2-row"
                onClick={() => vm.openProductDetail(prod)}
                style={{ opacity: agotado ? 0.6 : 1 }}
              >
                <div className="mv2-row-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={prod.nombre} className="mv2-row-img" />
                  {catName && (
                    <span className="mv2-badge mv2-badge--sm" style={{ background: badgeColor }}>{catName}</span>
                  )}
                </div>
                <div className="mv2-row-body">
                  <h2 className="mv2-row-name">{prod.nombre}</h2>
                  {prod.descripcion && <p className="mv2-row-desc">{prod.descripcion}</p>}
                  <div className="mv2-row-footer">
                    <span className="mv2-row-price" style={{ color: primary }}>
                      {formatPrecio(Number(prod.precio))}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {prod.stock != null && prod.stock > 0 && prod.stock <= 10 && (
                        <span className="mv2-stock-pill" style={{
                          borderColor: prod.stock <= 3 ? "#EF4444" : "#22C55E",
                          color: prod.stock <= 3 ? "#EF4444" : "#22C55E",
                        }}>
                          {prod.stock} disp.
                        </span>
                      )}
                      {!agotado && (
                        <motion.button
                          type="button"
                          className="mv2-add-btn mv2-add-btn--sm"
                          style={{ background: primary }}
                          onClick={(e) => { e.stopPropagation(); vm.quickAddProduct(prod); }}
                          whileTap={{ scale: 0.85 }}
                          aria-label={`Agregar ${prod.nombre}`}
                        >
                          <Plus size={14} strokeWidth={3} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {vm.productosFiltrados.length === 0 && (
          <div className="mv2-empty">
            <Search size={40} style={{ opacity: 0.4 }} />
            <p>No se encontraron platos.</p>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ══════════════════════════════════════════════ */}
      {mounted && createPortal(
        <nav className="mv2-bottom-nav">
          <button className="mv2-nav-item mv2-nav-item--active">
            <Utensils size={20} />
            <span>Menú</span>
          </button>
          <button className="mv2-nav-item" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            <span>Pedido</span>
          </button>
          {/* Center FAB */}
          <button
            className="mv2-nav-fab"
            style={{ background: primary }}
            onClick={() => setIsCartOpen(true)}
          >
            <span className="mv2-nav-fab-badge">{vm.itemCount}</span>
            <ShoppingCart size={22} color="#fff" strokeWidth={2.4} />
            <span className="mv2-nav-fab-label">Ver pedido</span>
          </button>
          <button
            className="mv2-nav-item"
            onClick={() => activePedidoId && router.push(`/${slug}/estado?pedido=${activePedidoId}`)}
          >
            <Clock size={20} />
            <span>Historial</span>
          </button>
          <button className="mv2-nav-item" onClick={() => setShowAuthModal(true)}>
            <User size={20} />
            <span>Más</span>
          </button>
        </nav>,
        document.body
      )}

      {/* ══════════════════════════════════════════════
          CART DRAWER
      ══════════════════════════════════════════════ */}
      {mounted && createPortal(
        <AnimatePresence>
          {isCartOpen && vm.itemCount > 0 && (
            <div className="fixed inset-0 z-50">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="client-cart-drawer-overlay"
                onClick={() => setIsCartOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                className="client-cart-drawer"
              >
                <div className="client-cart-drawer-header">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 m-0 text-[var(--text)]">
                      <ShoppingCart size={20} style={{ color: primary }} />
                      Mi Pedido
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] m-0 mt-0.5">
                      Mesa {vm.mesa?.numero || "—"} · {vm.itemCount} item{vm.itemCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="bg-[var(--surface)] border-none rounded-xl p-2.5 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>

                <div className="client-cart-drawer-content">
                  <div className="flex flex-col gap-4">
                    {cartVm.items.map((item) => {
                      const image = item.producto.imagen_url || "/assets/placeholder-dish.png";
                      const itemTotal = item.precio_total * item.cantidad;
                      return (
                        <article key={item.id} className="flex gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt={item.producto.nombre} className="w-16 h-16 object-cover rounded-xl border border-[var(--border)] flex-shrink-0" />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-[14px] font-bold m-0 text-[var(--text)] line-clamp-1">{item.producto.nombre}</h4>
                              <span className="text-[14px] font-bold" style={{ color: primary }}>{formatPrecio(itemTotal)}</span>
                            </div>
                            {item.notas && (
                              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 m-0 my-0.5 line-clamp-1">
                                <StickyNote size={10} /> {item.notas}
                              </p>
                            )}
                            {item.agregados_seleccionados.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1 mt-1">
                                {item.agregados_seleccionados.map((extra) => (
                                  <span key={extra.id} className="text-[9px] bg-[var(--border)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md font-medium">
                                    + {extra.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] p-0.5">
                                <button type="button" onClick={() => cartVm.updateCantidad(item.id, item.cantidad - 1)} className="w-6 h-6 p-0 rounded hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center justify-center border-none bg-transparent cursor-pointer text-[var(--text)]">-</button>
                                <span className="min-w-[20px] text-center font-bold text-xs text-[var(--text)]">{item.cantidad}</span>
                                <button type="button" onClick={() => cartVm.updateCantidad(item.id, item.cantidad + 1)} className="w-6 h-6 p-0 rounded hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center justify-center border-none bg-transparent cursor-pointer text-[var(--text)]">+</button>
                              </div>
                              <button type="button" onClick={() => cartVm.removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div role="status" aria-live="polite" style={{ display: "flex", gap: 10, alignItems: "center", background: "linear-gradient(90deg,#fff4e5,#fffaf0)", border: "1px solid rgba(255,200,120,0.6)", padding: 12, borderRadius: 12, marginTop: 6 }}>
                    <AlertCircle size={18} className="text-[var(--warning)]" />
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#7a4b00" }}>
                      IMPORTANTE: Revisa tu pedido antes de confirmar. No hay devolución ni cambio de plato después de confirmar.
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-[var(--text)]">Notas del pedido (opcional)</span>
                      <input className="input h-10 rounded-xl text-xs" placeholder="Instrucciones especiales..." value={cartVm.notas} onChange={(e) => cartVm.setNotas(e.target.value)} />
                    </label>
                    {cartVm.geoStatus === "checking" && (
                      <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-[11px] font-medium">
                        <Loader2 size={13} className="spin-icon" /> Verificando ubicación...
                      </div>
                    )}
                    {cartVm.geoStatus === "ok" && (
                      <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-[11px] font-medium">
                        <ShieldCheck size={13} /> Ubicación válida.
                      </div>
                    )}
                    {cartVm.error && (
                      <div className="flex items-start gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[11px] font-medium">
                        <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                        <span>{cartVm.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="client-cart-drawer-footer">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[14px] font-semibold text-[var(--text-muted)]">Total</span>
                    <span className="text-2xl font-black" style={{ color: primary }}>{formatPrecio(cartVm.total)}</span>
                  </div>
                  <button
                    onClick={cartVm.handleConfirmar}
                    className="btn btn-primary w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 text-[14px]"
                    style={{ background: primary, borderColor: primary }}
                    disabled={cartVm.sending}
                  >
                    {cartVm.sending ? (
                      cartVm.geoStatus === "checking"
                        ? <><Loader2 size={16} className="spin-icon" /> Verificando...</>
                        : <><Loader2 size={16} className="spin-icon" /> Enviando...</>
                    ) : (
                      <><Check size={16} /> Confirmar pedido</>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("portal-root") || document.body
      )}

      {/* ══════════════════════════════════════════════
          PRODUCT DETAIL MODAL
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {vm.selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={vm.closeDetail}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
              ref={sheetRef}
              className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
              role="dialog" aria-modal="true" tabIndex={-1}
            >
              <div className="sticky top-0 z-10 bg-[var(--bg-elevated)] border-b border-[var(--border)] px-6 py-5">
                <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[22px] font-extrabold text-[var(--text)] m-0 leading-tight">{vm.selectedProduct.nombre}</h3>
                    <p className="text-[20px] font-extrabold m-0 mt-1" style={{ color: primary }}>{formatPrecio(Number(vm.selectedProduct.precio))}</p>
                  </div>
                  <button onClick={vm.closeDetail} className="bg-[var(--surface)] border-none rounded-xl p-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                    <X size={20} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-6 py-6 pb-32">
                {vm.selectedProduct.descripcion && (
                  <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">{vm.selectedProduct.descripcion}</p>
                )}
                {vm.productDetail?.producto_grupo?.map((pg: any) => {
                  const grupo = pg.grupo; if (!grupo) return null;
                  const min = grupo.min_seleccion || 0; const max = grupo.max_seleccion || 99;
                  const selectedInGroup = vm.selectedAgregados.filter((a: Agregado) => grupo.agregado?.some((ga: Agregado) => ga.id === a.id)).length;
                  const isGroupValid = selectedInGroup >= min; const isGroupFull = selectedInGroup >= max;
                  return (
                    <div key={grupo.id} className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <p className="label m-0 text-[12px]">{grupo.nombre}</p>
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${isGroupValid ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                          {selectedInGroup}/{max} {min > 0 ? `(mín. ${min})` : "opcional"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {grupo.agregado?.filter((a: Agregado) => a.disponible).map((ag: Agregado) => {
                          const isSelected = vm.selectedAgregados.some((a) => a.id === ag.id);
                          const isDisabled = !isSelected && isGroupFull;
                          return (
                            <button
                              key={ag.id} type="button"
                              onClick={() => !isDisabled && vm.toggleAgregado(ag, grupo.id)}
                              disabled={isDisabled}
                              className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${isSelected ? "bg-[var(--primary-ghost)] border-[var(--primary)]" : "bg-[var(--surface)] border-[var(--border)]"} ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? "border-none bg-[var(--primary)]" : "border-[var(--border)] bg-transparent"}`}>
                                  {isSelected && <CheckCircle2 size={12} className="text-[var(--text-inverse)]" />}
                                </div>
                                <span className="text-[14px] text-[var(--text)] font-medium">{ag.nombre}</span>
                              </div>
                              {Number(ag.precio) > 0 && <span className="text-[13px] font-bold text-[var(--text)]">+{formatPrecio(Number(ag.precio))}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="mb-6">
                  <p className="label mb-2 flex items-center gap-1.5 text-[12px]">
                    <StickyNote size={14} /> Notas especiales
                  </p>
                  <input className="input h-12 rounded-xl" placeholder="Ej: Sin cebolla, etc..." value={vm.notas} onChange={(e) => vm.setNotas(e.target.value)} />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[var(--bg-elevated)] border-t border-[var(--border)] p-4 pb-safe flex flex-col gap-3">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center bg-[var(--surface)] rounded-xl p-1.5 border border-[var(--border)]">
                    <button onClick={() => vm.setCantidad(Math.max(1, vm.cantidad - 1))} className="w-10 h-10 p-0 rounded-lg hover:bg-[var(--surface-hover)] text-xl font-medium flex items-center justify-center border-none bg-transparent cursor-pointer">-</button>
                    <span className="min-w-[40px] text-center font-extrabold text-[16px]">{vm.cantidad}</span>
                    <button onClick={() => vm.setCantidad(vm.cantidad + 1)} className="w-10 h-10 p-0 rounded-lg hover:bg-[var(--surface-hover)] text-xl font-medium flex items-center justify-center border-none bg-transparent cursor-pointer">+</button>
                  </div>
                  <button
                    onClick={vm.handleAddToCart}
                    disabled={!vm.canAddToCart}
                    className="btn btn-primary flex-1 h-[52px] font-extrabold rounded-2xl text-[15px]"
                    style={{ background: primary, borderColor: primary }}
                  >
                    Agregar · {formatPrecio(vm.precioConAgregados * vm.cantidad)}
                  </button>
                </div>
                {!vm.canAddToCart && (
                  <div className="flex items-center justify-center gap-2 text-[var(--warning)] text-[11px] font-semibold mt-1">
                    <AlertTriangle size={14} /> Completa las selecciones mínimas obligatorias
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client Auth Modal */}
      <ClientAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={() => setShowAuthModal(false)}
        slug={slug}
      />
    </>
  );
}
