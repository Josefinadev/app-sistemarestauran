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
  Info, User, QrCode, ArrowRight, Pencil,
  MapPin, FlaskConical, AlertTriangle, ChefHat,
  ChevronDown, Trash2, ShieldCheck, Check, Utensils, ArrowLeft, Loader2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClientAuthModal } from "@/components/ClientAuthModal";

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

  // Necesario para renderizar el FAB del carrito vía portal (solo en cliente).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar el modal de login automáticamente al entrar por primera vez al menú
  // (solo si el cliente no ha iniciado sesión y no se ha mostrado ya en esta sesión).
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartOpen]);

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
    <main className="client-menu-page animate-fade-in" style={{ paddingBottom: vm.itemCount > 0 ? 100 : 24 }}>
      <section className="client-hero" style={{ "--client-hero-image": `url(${heroImage})` } as CSSProperties}>
        <header className="client-topbar">
          <div className="client-brand">
            <div className="client-brand-mark">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={vm.restaurante?.nombre || "Restaurante"} />
              ) : (
                <ChefHat size={34} />
              )}
            </div>
            <div className="client-brand-text">
              <span className="client-brand-kicker">Restaurante</span>
              <strong>{vm.restaurante?.nombre || "Cargando..."}</strong>
            </div>
          </div>

          <div className="client-top-actions">
            <ThemeToggle />
            <div className="client-table-pill">
              <MapPin size={18} />
              <span>{vm.mesa ? `Mesa ${vm.mesa.numero}` : "Sin mesa"}</span>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="client-user-pill"
              style={{ border: "none", cursor: "pointer" }}
            >
              <User size={16} />
              <span>{vm.usuario?.nombre?.split(" ")[0] || "Cliente"}</span>
            </button>
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
              {/* Zona de info: clic = abre detalles + agregados */}
              <button
                type="button"
                className="client-product-body client-product-body--btn"
                onClick={() => vm.openProductDetail(prod)}
                aria-label={`Personalizar ${prod.nombre}`}
              >
                <div>
                  <span className="client-product-tag">{categoryLabel}</span>
                  <h2>{prod.nombre}</h2>
                  {prod.descripcion && <p className="client-product-desc">{prod.descripcion}</p>}
                </div>
                <div className="client-product-footer">
                  <strong>{formatPrecio(Number(prod.precio))}</strong>
                  {prod.stock != null && prod.stock <= 10 && (
                    <span style={{ fontSize: 10, color: prod.stock <= 3 ? "var(--error)" : "var(--warning)", fontWeight: 600 }}>
                      {prod.stock <= 0 ? "Agotado" : `${prod.stock} disp.`}
                    </span>
                  )}
                </div>
              </button>
              {/* Zona de imagen + dos acciones claras: lápiz = con notas, + = directo */}
              <div className="client-product-image-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImage} alt={prod.nombre} className="client-product-img" />
                <div className="client-product-actions">
                  <motion.button
                    type="button"
                    className="client-product-action-btn client-product-action-btn--customize"
                    onClick={(e) => {
                      e.stopPropagation();
                      vm.openProductDetail(prod);
                    }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    aria-label={`Personalizar ${prod.nombre} con notas o agregados`}
                    title="Personalizar con notas / agregados"
                  >
                    <Pencil size={14} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button
                    type="button"
                    className="client-product-action-btn client-product-action-btn--add"
                    onClick={(e) => {
                      e.stopPropagation();
                      vm.quickAddProduct(prod);
                    }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    aria-label={`Agregar ${prod.nombre} directo al carrito`}
                    title="Agregar sin notas"
                  >
                    <Plus size={18} strokeWidth={2.8} />
                  </motion.button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {vm.productosFiltrados.length === 0 && (
        <div className="client-empty-state"><Search size={44} /><p>No se encontraron platos.</p></div>
      )}

      {/* FAB del carrito — renderizado vía portal a <body> para flotar SIEMPRE
          por encima de todo el contenido (escapa de cualquier transform/stacking
          context de los ancestros, igual que un botón flotante de WhatsApp).
          Se oculta cuando hay un overlay abierto (carrito o detalle de producto). */}
      {mounted && createPortal(
        <AnimatePresence>
          {vm.itemCount > 0 && !isCartOpen && !vm.selectedProduct && (
            <motion.button
              key="cart-fab"
              className="client-cart-fab"
              onClick={() => setIsCartOpen(true)}
              type="button"
              initial={{ y: 80, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 80, scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.7 }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={vm.itemCount}
                  className="badge-count"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 700, damping: 14, mass: 0.4 }}
                >
                  {vm.itemCount}
                </motion.div>
              </AnimatePresence>
              <ShoppingCart size={22} strokeWidth={2.4} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ver Pedido</span>
                <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{formatPrecio(vm.cartTotal)}</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>,
        document.getElementById('portal-root') || document.body
      )}


      {/* FAB de pedido activo — esquina inferior izquierda, solo cuando hay pedido activo */}
      {mounted && createPortal(
        <AnimatePresence>
          {activePedidoId && !isCartOpen && !vm.selectedProduct && (
            <motion.button
              key="active-order-fab"
              className="client-active-order-fab"
              type="button"
              onClick={() => router.push(`/${slug}/estado?pedido=${activePedidoId}`)}
              initial={{ x: -80, scale: 0.5, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: -80, scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.7 }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
            >
              <span className="client-active-order-fab-dot" />
              <CheckCircle2 size={20} strokeWidth={2.2} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pedido activo</span>
                <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>Ver estado</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>,
        document.getElementById('portal-root') || document.body
      )}

      {/* CART DRAWER */}
      {mounted && createPortal(
        <AnimatePresence>
          {isCartOpen && vm.itemCount > 0 && (
            <div className="fixed inset-0 z-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="client-cart-drawer-overlay"
                onClick={() => setIsCartOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                className="client-cart-drawer"
              >
                <div className="client-cart-drawer-header">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 m-0 text-[var(--text)]">
                      <ShoppingCart size={20} className="text-[var(--primary)]" />
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
                              <span className="text-[14px] font-bold text-[var(--primary)]">{formatPrecio(itemTotal)}</span>
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
                              <button type="button" onClick={() => cartVm.removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" aria-label="Eliminar plato">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      background: "linear-gradient(90deg,#fff4e5,#fffaf0)",
                      border: "1px solid rgba(255,200,120,0.6)",
                      padding: 12,
                      borderRadius: 12,
                      marginTop: 6,
                    }}
                  >
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
                        <Loader2 size={13} className="spin-icon" /> Verificando ubicación del restaurante...
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
                    <span className="text-2xl font-black text-[var(--primary)]">{formatPrecio(cartVm.total)}</span>
                  </div>
                  <button
                    onClick={cartVm.handleConfirmar}
                    className="btn btn-primary w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 text-[14px]"
                    disabled={cartVm.sending}
                  >
                    {cartVm.sending ? (
                      cartVm.geoStatus === "checking" ? <><Loader2 size={16} className="spin-icon" /> Verificando...</> : <><Loader2 size={16} className="spin-icon" /> Enviando...</>
                    ) : (
                      <><Check size={16} /> Confirmar pedido</>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById('portal-root') || document.body
      )}

      <AnimatePresence>
        {vm.selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    <p className="text-[20px] font-extrabold text-[var(--primary)] m-0 mt-1">{formatPrecio(Number(vm.selectedProduct.precio))}</p>
                  </div>
                  <button onClick={vm.closeDetail} className="bg-[var(--surface)] border-none rounded-xl p-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                    <X size={20} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-6 py-6 pb-32">
                {vm.selectedProduct.descripcion && (
                  <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">
                    {vm.selectedProduct.descripcion}
                  </p>
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
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${isGroupValid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {selectedInGroup}/{max} {min > 0 ? `(mín. ${min})` : "opcional"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {grupo.agregado?.filter((a: Agregado) => a.disponible).map((ag: Agregado) => {
                          const isSelected = vm.selectedAgregados.some((a) => a.id === ag.id);
                          const isDisabled = !isSelected && isGroupFull;
                          return (
                            <button
                              key={ag.id}
                              type="button"
                              onClick={() => !isDisabled && vm.toggleAgregado(ag, grupo.id)}
                              disabled={isDisabled}
                              className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${isSelected ? 'bg-[var(--primary-ghost)] border-[var(--primary)]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary-light)]'
                                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'border-none bg-[var(--primary)]' : 'border-[var(--border)] bg-transparent'}`}>
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
                  <input
                    className="input h-12 rounded-xl"
                    placeholder="Ej: Sin cebolla, etc..."
                    value={vm.notas}
                    onChange={(e) => vm.setNotas(e.target.value)}
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[var(--bg-elevated)] border-t border-[var(--border)] p-4 pb-safe flex flex-col gap-3">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center bg-[var(--surface)] rounded-xl p-1.5 border border-[var(--border)]">
                    <button onClick={() => vm.setCantidad(Math.max(1, vm.cantidad - 1))} className="w-10 h-10 p-0 rounded-lg hover:bg-[var(--surface-hover)] text-xl font-medium flex items-center justify-center">-</button>
                    <span className="min-w-[40px] text-center font-extrabold text-[16px]">{vm.cantidad}</span>
                    <button onClick={() => vm.setCantidad(vm.cantidad + 1)} className="w-10 h-10 p-0 rounded-lg hover:bg-[var(--surface-hover)] text-xl font-medium flex items-center justify-center">+</button>
                  </div>
                  <button
                    onClick={vm.handleAddToCart}
                    disabled={!vm.canAddToCart}
                    className="btn btn-primary flex-1 h-[52px] font-extrabold rounded-2xl text-[15px]"
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
    </main>
  );
}
