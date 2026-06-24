"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRestaurante, getWebConfig, getWebCombos, getWebOfertas } from "@/lib/api";
import {
  Wine, CheckCircle2, X, Loader2, Utensils, AlertTriangle,
  MessageCircle, MapPin, Phone, Clock, ChefHat, Star,
  ArrowRight, Gift, Sparkles, QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RestaurantPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [restaurante, setRestaurante] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);

  const [showReserva, setShowReserva] = useState(false);
  const [reservaData, setReservaData] = useState({
    nombre: "", telefono: "", fecha: "",
    hora: "20:00", personas: "2", notas: ""
  });
  const [reservaEnviada, setReservaEnviada] = useState(false);
  const [reservaError, setReservaError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const restData = await getRestaurante(slug);
      setRestaurante(restData);
      const restaurantId = restData?.id;
      if (restaurantId) {
        const [configRes, combosRes, ofertasRes] = await Promise.allSettled([
          getWebConfig(restaurantId),
          getWebCombos(restaurantId),
          getWebOfertas(restaurantId),
        ]);
        if (configRes.status === "fulfilled" && configRes.value) setConfig(configRes.value);
        if (combosRes.status === "fulfilled") setCombos(combosRes.value || []);
        if (ofertasRes.status === "fulfilled") setOfertas(ofertasRes.value || []);
      }
    } catch (err) {
      console.error("Error cargando web pública:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadData(); }, [loadData]);

  const enviarReserva = () => {
    setReservaError("");
    if (!reservaData.nombre.trim()) { setReservaError("Por favor, ingresa tu nombre."); return; }
    if (!reservaData.telefono.trim()) { setReservaError("Por favor, ingresa tu número de teléfono."); return; }
    if (!reservaData.fecha) { setReservaError("Por favor, selecciona la fecha de la reserva."); return; }
    if (!config?.whatsapp) { setReservaError("El restaurante no tiene configurado un número de WhatsApp para reservas."); return; }
    const msg = `🍽️ *Reserva ${restaurante.nombre}*\n\n👤 ${reservaData.nombre}\n📞 ${reservaData.telefono}\n📅 ${reservaData.fecha} a las ${reservaData.hora}\n👥 ${reservaData.personas} personas\n📝 ${reservaData.notas || "Sin notas"}`;
    try {
      window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
      setReservaEnviada(true);
      setTimeout(() => { setShowReserva(false); setReservaEnviada(false); }, 3000);
    } catch {
      setReservaError("No se pudo abrir WhatsApp.");
    }
  };

  if (loading) return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="spin-icon" color="var(--primary)" size={48} />
    </div>
  );

  if (!restaurante) return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Utensils size={64} color="var(--text-muted)" />
      <h2 style={{ color: "var(--text)" }}>Restaurante no encontrado</h2>
      <button onClick={() => router.push("/")} className="btn btn-primary">Volver al inicio</button>
    </div>
  );

  const heroImage = restaurante.hero_banner_url || "/assets/placeholder-dish.png";
  const primaryColor = restaurante.color_primario || "#C5A059";

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "var(--surface)" : "rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {restaurante.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurante.logo_url} alt={restaurante.nombre}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "contain",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wine size={16} color="#fff" />
            </div>
          )}
          <span style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 18,
            color: scrolled ? "var(--text)" : "#fff",
            fontWeight: 600, letterSpacing: "0.02em",
            textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.4)" }}>
            {restaurante.nombre}
          </span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="#combos" style={{ fontSize: 13, fontWeight: 600,
            color: scrolled ? "var(--text-secondary)" : "rgba(255,255,255,0.85)",
            textDecoration: "none", transition: "color 0.2s" }}>Combos</a>
          <a href="#ofertas" style={{ fontSize: 13, fontWeight: 600,
            color: scrolled ? "var(--text-secondary)" : "rgba(255,255,255,0.85)",
            textDecoration: "none", transition: "color 0.2s" }}>Ofertas</a>
          <a href={`/${slug}/menu`} style={{ fontSize: 13, fontWeight: 700,
            color: primaryColor, textDecoration: "none" }}>Menú Digital</a>
          <ThemeToggle />
          <button onClick={() => setShowReserva(true)} className="btn btn-primary btn-sm">
            Reservar
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px 80px", position: "relative",
        backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(10,9,12,0.75) 0%, rgba(10,9,12,0.55) 45%, rgba(10,9,12,0.85) 100%)",
          zIndex: 0 }} />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ position: "relative", zIndex: 1, maxWidth: 700 }}
        >
          {restaurante.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurante.logo_url} alt={restaurante.nombre}
              style={{ width: 100, height: 100, objectFit: "contain", borderRadius: "50%",
                margin: "0 auto 28px",
                filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))" }} />
          )}
          <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase",
            color: primaryColor, marginBottom: 16, fontWeight: 700 }}>
            Bienvenido a {restaurante.nombre}
          </p>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif",
            fontSize: "clamp(36px, 7vw, 68px)", fontWeight: 700,
            margin: "0 0 20px", color: "#fff",
            lineHeight: 1.1, textShadow: "0 4px 32px rgba(0,0,0,0.6)" }}>
            Experiencia Culinaria <br />
            <em style={{ color: primaryColor, fontStyle: "italic" }}>Inolvidable</em>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 36,
            maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.6 }}>
            {config?.horario_semana ? `Lun–Vie: ${config.horario_semana}` : "La mejor gastronomía al alcance de tu mesa."}
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/${slug}/menu`)}
              className="btn btn-primary btn-lg"
              style={{ background: primaryColor, borderColor: primaryColor, fontSize: 15, padding: "14px 32px", borderRadius: 14 }}
            >
              <QrCode size={18} /> Pedir ahora
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowReserva(true)}
              style={{ padding: "14px 32px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8 }}
            >
              Reservar Mesa
            </motion.button>
          </div>
        </motion.div>
        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.5)", fontSize: 22, zIndex: 1 }}>
          ↓
        </motion.div>
      </section>

      {/* ── INFO BAR ── */}
      {(config?.direccion || config?.horario_semana || config?.telefono) && (
        <section style={{
          background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
          padding: "20px 32px", display: "flex", justifyContent: "center",
          flexWrap: "wrap", gap: 32,
        }}>
          {config?.direccion && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <MapPin size={16} color={primaryColor} />
              <span>{config.direccion}</span>
            </div>
          )}
          {config?.horario_semana && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <Clock size={16} color={primaryColor} />
              <span>Lun–Vie: {config.horario_semana}{config.horario_finde ? ` · Sáb–Dom: ${config.horario_finde}` : ""}</span>
            </div>
          )}
          {config?.telefono && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <Phone size={16} color={primaryColor} />
              <span>{config.telefono}</span>
            </div>
          )}
        </section>
      )}

      {/* ── OFERTAS ── */}
      {ofertas.length > 0 && (
        <section id="ofertas" style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
              color: primaryColor, fontWeight: 700, marginBottom: 10 }}>Promociones especiales</p>
            <h2 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Nuestras Ofertas
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {ofertas.map((oferta, i) => (
              <motion.div
                key={oferta.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 20, overflow: "hidden",
                  boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.2s",
                }}
                whileHover={{ y: -4 }}
              >
                {oferta.imagen_url && (
                  <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={oferta.imagen_url} alt={oferta.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {oferta.descuento && (
                      <span style={{ position: "absolute", top: 14, left: 14,
                        background: primaryColor, color: "#fff", fontSize: 11,
                        fontWeight: 800, padding: "4px 12px", borderRadius: 99 }}>
                        {oferta.descuento}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  {!oferta.imagen_url && oferta.descuento && (
                    <span style={{ display: "inline-block", background: `${primaryColor}20`,
                      color: primaryColor, fontSize: 11, fontWeight: 800,
                      padding: "3px 12px", borderRadius: 99, marginBottom: 10 }}>
                      {oferta.descuento}
                    </span>
                  )}
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{oferta.titulo}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{oferta.descripcion}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── COMBOS ── */}
      {combos.length > 0 && (
        <section id="combos" style={{
          padding: "80px 32px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
                color: primaryColor, fontWeight: 700, marginBottom: 10 }}>Para compartir</p>
              <h2 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Combos & Paquetes
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {combos.map((combo, i) => (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{
                    background: "var(--bg)", border: "1px solid var(--border)",
                    borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)",
                  }}
                  whileHover={{ y: -4 }}
                >
                  <div style={{ height: 200, overflow: "hidden", position: "relative", background: "var(--surface-hover)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={combo.imagen_url || "/assets/placeholder-dish.png"} alt={combo.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {combo.popular && (
                      <span style={{ position: "absolute", top: 14, left: 14,
                        background: primaryColor, color: "#fff", fontSize: 10,
                        fontWeight: 800, padding: "4px 12px", borderRadius: 99,
                        display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={9} fill="currentColor" /> Popular
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{combo.nombre}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>{combo.descripcion}</p>
                    {(combo.incluye || []).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                        {(combo.incluye || []).slice(0, 4).map((item: string, idx: number) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                            <CheckCircle2 size={12} color={primaryColor} /> {item}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        {combo.precio_original && (
                          <span style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "line-through", marginRight: 8 }}>
                            S/ {Number(combo.precio_original).toFixed(2)}
                          </span>
                        )}
                        <span style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>
                          S/ {Number(combo.precio).toFixed(2)}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => router.push(`/${slug}/menu`)}
                        style={{ padding: "8px 16px", background: primaryColor, color: "#fff",
                          border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        Pedir <ArrowRight size={13} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA MENU DIGITAL ── */}
      <section style={{ padding: "80px 32px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <div style={{ width: 72, height: 72, borderRadius: 20,
            background: `${primaryColor}20`, display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <ChefHat size={32} color={primaryColor} />
          </div>
          <h2 style={{ fontFamily: "var(--font-noto-serif), serif",
            fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700,
            color: "var(--text)", margin: "0 0 16px" }}>
            ¿Listo para ordenar?
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Escanea el QR de tu mesa o accede al menú digital para hacer tu pedido directamente desde tu celular.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/${slug}/menu`)}
              style={{ padding: "14px 32px", borderRadius: 14,
                background: primaryColor, color: "#fff",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <QrCode size={18} /> Ver el Menú Digital
            </motion.button>
            {config?.whatsapp && (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => window.open(`https://wa.me/${config.whatsapp}`, "_blank")}
                style={{ padding: "14px 32px", borderRadius: 14,
                  background: "transparent", color: "var(--text)",
                  border: "1.5px solid var(--border)", fontSize: 15, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <MessageCircle size={18} /> WhatsApp
              </motion.button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {restaurante.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurante.logo_url} alt={restaurante.nombre}
              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "contain" }} />
          ) : (
            <Wine size={20} color={primaryColor} />
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>{restaurante.nombre}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          © {new Date().getFullYear()} · Todos los derechos reservados
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
        </div>
      </footer>

      {/* ── MODAL RESERVA ── */}
      <AnimatePresence>
        {showReserva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReserva(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {reservaEnviada ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <CheckCircle2 className="mx-auto mb-4 text-[var(--success)]" size={56} />
                  <h3 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h3>
                  <p className="text-[var(--text-muted)]">Te contactaremos vía WhatsApp.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-serif text-[var(--text)] m-0">Reservar Mesa</h3>
                    <button onClick={() => setShowReserva(false)} className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors">
                      <X size={20} className="text-[var(--text-muted)]" />
                    </button>
                  </div>
                  {reservaError && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 text-red-400 text-[12px] font-semibold border border-red-500/20">
                      <AlertTriangle size={15} className="flex-shrink-0" />
                      <span>{reservaError}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <input className="input" placeholder="Tu nombre completo" value={reservaData.nombre} onChange={e => setReservaData({ ...reservaData, nombre: e.target.value })} />
                    <input className="input" placeholder="Teléfono / WhatsApp" value={reservaData.telefono} onChange={e => setReservaData({ ...reservaData, telefono: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Fecha</label>
                        <input className="input" type="date" value={reservaData.fecha} onChange={e => setReservaData({ ...reservaData, fecha: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Hora</label>
                        <input className="input" type="time" value={reservaData.hora} onChange={e => setReservaData({ ...reservaData, hora: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Personas</label>
                      <select className="input" value={reservaData.personas} onChange={e => setReservaData({ ...reservaData, personas: e.target.value })}>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "+8"].map(n => (
                          <option key={n} value={n}>{n} {n === "+8" ? "personas (grupo)" : n === "1" ? "persona" : "personas"}</option>
                        ))}
                      </select>
                    </div>
                    <textarea className="input" placeholder="Notas especiales (opcional)" rows={2}
                      value={reservaData.notas} onChange={e => setReservaData({ ...reservaData, notas: e.target.value })}
                      style={{ resize: "none", fontFamily: "inherit" }} />
                  </div>
                  <button onClick={enviarReserva} className="btn btn-primary btn-lg w-full mt-6 rounded-2xl text-[15px] flex items-center justify-center gap-2"
                    style={{ background: primaryColor, borderColor: primaryColor }}>
                    <MessageCircle size={18} /> Confirmar vía WhatsApp
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
