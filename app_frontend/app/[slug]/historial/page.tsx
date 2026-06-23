"use client";

import { useState, type CSSProperties } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, ChefHat, CheckCircle2, UtensilsCrossed,
  XCircle, Receipt, ShoppingBag, ChevronDown, LogIn,
  UserPlus, CalendarDays, MapPin, Eye, RefreshCw,
} from "lucide-react";
import { useHistorialPedidos } from "@/viewmodels/useHistorialPedidos";
import { formatPrecio } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClientAuthModal } from "@/components/ClientAuthModal";

/* ═══════════════════════════════════════════════════════════
   HISTORIAL DE PEDIDOS — Solo para clientes autenticados
   ═══════════════════════════════════════════════════════════ */

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  PENDIENTE:       { label: "Recibido",      color: "var(--text-muted)",  bg: "rgba(150,150,150,0.1)", Icon: Clock },
  EN_PREPARACION:  { label: "Preparando",    color: "var(--secondary)",   bg: "rgba(226,114,91,0.1)", Icon: ChefHat },
  LISTO:           { label: "Listo",         color: "var(--primary)",     bg: "var(--primary-ghost)", Icon: CheckCircle2 },
  ENTREGADO:       { label: "Entregado",     color: "#4ade80",            bg: "rgba(74,222,128,0.1)", Icon: UtensilsCrossed },
  CANCELADO:       { label: "Cancelado",     color: "var(--error)",       bg: "rgba(220,38,38,0.08)", Icon: XCircle },
};

const PAGO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente de pago", color: "var(--warning)" },
  PAGADO:    { label: "Pagado",            color: "#4ade80" },
  ANULADO:   { label: "Anulado",           color: "var(--error)" },
};

export default function HistorialPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const vm = useHistorialPedidos();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const heroImage = vm.restaurante?.hero_banner_url;

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── Loading skeleton ── */
  if (vm.loading) {
    return (
      <main className="client-menu-page animate-fade-in" style={{ paddingBottom: 40 }}>
        <div style={{ padding: "24px 0 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div className="skeleton" style={{ width: 160, height: 22, borderRadius: 8 }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 18, marginBottom: 12 }} />
        ))}
      </main>
    );
  }

  /* ── Guest (no logueado) ── */
  if (vm.isGuest) {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            background: heroImage
              ? `linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.45) 100%), url(${heroImage}) center/cover no-repeat`
              : "var(--bg)",
          }}
        >
          <main style={{ maxWidth: 420, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 0 }}>
            <ThemeToggle floating />

            <button
              onClick={() => router.push(`/${slug}/menu`)}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 40, backdropFilter: "blur(8px)" }}
            >
              <ArrowLeft size={15} /> Volver al menú
            </button>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 28, padding: "40px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}
            >
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "var(--primary-ghost)", border: "1px solid rgba(197,160,89,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <ShoppingBag size={32} color="var(--primary)" />
              </div>

              <h1 style={{ fontFamily: "var(--font-noto-serif),serif", fontSize: 24, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
                Mi historial de pedidos
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 28px", lineHeight: 1.6 }}>
                Inicia sesión o crea una cuenta para guardar y consultar el historial de todos tus pedidos en este restaurante.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <LogIn size={16} /> Iniciar sesión
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{ width: "100%", padding: "14px", background: "var(--surface-hover)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <UserPlus size={16} /> Crear cuenta
                </button>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "18px 0 0", lineHeight: 1.5 }}>
                Al crear una cuenta, todos tus futuros pedidos quedarán guardados automáticamente.
              </p>
            </motion.div>
          </main>
        </div>

        <ClientAuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onContinueAsGuest={() => { setShowAuthModal(false); router.push(`/${slug}/menu`); }}
          slug={slug}
        />
      </>
    );
  }

  /* ── Lista de pedidos ── */
  return (
    <main className="client-menu-page animate-fade-in" style={{ minHeight: "100dvh" }}>
      {/* Hero Header para historial */}
      <section className="client-hero" style={{ "--client-hero-image": heroImage ? `url(${heroImage})` : "none", paddingBottom: 24 } as CSSProperties}>
        <header className="client-topbar" style={{ padding: "16px 20px" }}>
          <button
            onClick={() => router.push(`/${slug}/menu`)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(12px)" }}
          >
            <ArrowLeft size={15} /> Volver al menú
          </button>
          <div className="client-top-actions">
            <ThemeToggle />
            <button
              onClick={vm.refetch}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, color: "#fff", cursor: "pointer", backdropFilter: "blur(12px)" }}
              title="Actualizar historial"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <div className="client-hero-copy" style={{ marginTop: 16 }}>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Historial de Pedidos</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500, margin: 0 }}>
            {vm.usuario?.nombre} — {vm.restaurante?.nombre}
          </p>
        </div>
      </section>

      {/* Content Body */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>
        
        {/* Error State */}
        {vm.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "16px 20px", background: "var(--surface)", borderLeft: "4px solid var(--error)", borderRadius: 16, boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
          >
            <XCircle size={24} color="var(--error)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>No pudimos cargar tus pedidos</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{vm.error}</p>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!vm.error && vm.pedidos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "64px 24px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "var(--shadow-sm)" }}
          >
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Receipt size={36} color="var(--text-muted)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>Aún no tienes pedidos</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 auto 32px", maxWidth: 280, lineHeight: 1.5 }}>
              Tus pedidos aparecerán aquí después de confirmar tu primera orden en el restaurante.
            </p>
            <button
              onClick={() => router.push(`/${slug}/menu`)}
              style={{ padding: "14px 28px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px var(--primary-glow)" }}
            >
              Ver el menú
            </button>
          </motion.div>
        )}

        {/* Pedidos list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {vm.pedidos.map((pedido, idx) => {
            const isExpanded = expandedId === pedido.id;
            const estadoConf = ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.PENDIENTE;
            const pagoConf = PAGO_CONFIG[pedido.estado_pago] || PAGO_CONFIG.PENDIENTE;
            const EstIcon = estadoConf.Icon;

            return (
              <motion.article
                key={pedido.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, type: "spring", stiffness: 380, damping: 28 }}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}
              >
                {/* Header del pedido — siempre visible */}
                <button
                  type="button"
                  onClick={() => toggle(pedido.id)}
                  style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 16, padding: "20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Estado icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: estadoConf.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <EstIcon size={22} color={estadoConf.color} />
                  </div>

                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{pedido.numeroPedidoFormateado}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: estadoConf.bg, color: estadoConf.color, letterSpacing: "0.02em" }}>
                        {estadoConf.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                        <CalendarDays size={12} /> {pedido.fechaFormateada}
                      </span>
                      {pedido.mesa && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                          <MapPin size={12} /> Mesa {pedido.mesa.numero}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total + chevron */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, paddingTop: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{pedido.totalFormateado}</span>
                    <span style={{ fontSize: 11, color: pagoConf.color, fontWeight: 700 }}>{pagoConf.label}</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginTop: 4 }}>
                      <ChevronDown size={20} color="var(--text-muted)" />
                    </motion.div>
                  </div>
                </button>

                {/* Detalles expandibles */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ borderTop: "1px solid var(--border)", padding: "20px", background: "var(--surface)" }}>
                        {/* Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                          {pedido.items.map((item) => (
                            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                              {/* Imagen del producto */}
                              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--bg)", border: "1px solid var(--border)" }}>
                                {item.producto?.imagen_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.producto.imagen_url} alt={item.producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Receipt size={20} color="var(--text-muted)" />
                                  </div>
                                )}
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.producto?.nombre || "Plato"}
                                </p>
                                {item.notas && (
                                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 6px", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>📝</span> {item.notas}
                                  </p>
                                )}
                                {item.agregados.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {item.agregados.map((ag, i) => (
                                      <span key={i} style={{ fontSize: 11, padding: "3px 8px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontWeight: 600 }}>
                                        + {ag.nombre}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", flexShrink: 0 }}>
                                {formatPrecio(item.precio_unitario)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Notas del pedido global */}
                        {pedido.notas && (
                          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.2)", borderRadius: 14, fontSize: 13, color: "var(--text)", fontStyle: "italic", display: "flex", gap: 8 }}>
                            <span>📋</span> <span>{pedido.notas}</span>
                          </div>
                        )}

                        {/* Footer CTA */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
                          {!pedido.esFinalizado && (
                            <button
                              onClick={() => router.push(`/${slug}/estado?pedido=${pedido.id}`)}
                              style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", background: "var(--primary-ghost)", border: "1px solid rgba(197,160,89,0.35)", borderRadius: 14, color: "var(--primary)", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                            >
                              <Eye size={16} /> Ver estado en vivo
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
