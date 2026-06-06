"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRestaurante, getWebConfig, getWebCombos, getWebOfertas } from "@/lib/api";
import {
  Wine, CheckCircle2,
  X, Loader2, Utensils, AlertTriangle, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   PÁGINA WEB PÚBLICA DEL RESTAURANTE (Dinamica por SLUG)
   ═══════════════════════════════════════════════════════════ */

export default function RestaurantPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [restaurante, setRestaurante] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);

  // Modal Reserva
  const [showReserva, setShowReserva] = useState(false);
  const [reservaData, setReservaData] = useState({ 
    nombre: "", telefono: "", fecha: "", 
    hora: "20:00", personas: "2", notas: "" 
  });
  const [reservaEnviada, setReservaEnviada] = useState(false);
  const [reservaError, setReservaError] = useState("");

  const openReserva = () => {
    setReservaError("");
    setShowReserva(true);
  };

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enviarReserva = () => {
    setReservaError("");
    if (!reservaData.nombre.trim()) {
      setReservaError("Por favor, ingresa tu nombre.");
      return;
    }
    if (!reservaData.telefono.trim()) {
      setReservaError("Por favor, ingresa tu número de teléfono.");
      return;
    }
    if (!reservaData.fecha) {
      setReservaError("Por favor, selecciona la fecha de la reserva.");
      return;
    }
    if (!config?.whatsapp) {
      setReservaError("El restaurante no tiene configurado un número de WhatsApp para reservas.");
      return;
    }
    const msg = `🍷 *Reserva ${restaurante.nombre}*\n\n👤 ${reservaData.nombre}\n📞 ${reservaData.telefono}\n📅 ${reservaData.fecha} a las ${reservaData.hora}\n👥 ${reservaData.personas} personas\n📝 ${reservaData.notas || "Sin notas"}\n\n¡Gracias por reservar!`;
    try {
      window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
      setReservaEnviada(true);
      setTimeout(() => { 
        setShowReserva(false); 
        setReservaEnviada(false); 
      }, 3000);
    } catch (err) {
      setReservaError("No se pudo abrir WhatsApp. Comprueba si tienes bloqueadores de popups activos.");
    }
  };

  if (loading) return (
    <div style={{ background: "#0C0B0E", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="spin-icon" color="#C5A059" size={48} />
    </div>
  );

  if (!restaurante) return (
    <div style={{ background: "#0C0B0E", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Utensils size={64} color="#5A4E38" />
      <h2 style={{ color: "#F0E6D0" }}>Restaurante no encontrado</h2>
      <button onClick={() => router.push("/")} className="btn btn-primary" style={{ background: "#C5A059", color: "#0C0B0E" }}>Volver al inicio</button>
    </div>
  );

  const heroImage = restaurante.hero_banner_url || "/assets/placeholder-dish.png";

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(12,11,14,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {restaurante.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={restaurante.logo_url} alt={restaurante.nombre} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, var(--primary), var(--primary-dark))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wine size={14} color="var(--text-inverse)" />
            </div>
          )}
          <span style={{ fontFamily: "var(--font-noto-serif), serif", fontStyle: "italic", fontSize: 18, color: "var(--primary)", letterSpacing: "0.04em" }}>{restaurante.nombre}</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href={`/${slug}/menu`} style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>Menú Digital</a>
          <button onClick={openReserva} className="btn btn-primary btn-sm">Reservar</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px", position: "relative",
        backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,11,14,0.85) 0%, rgba(12,11,14,0.6) 45%, rgba(12,11,14,0.9) 100%)", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {restaurante.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={restaurante.logo_url} alt={restaurante.nombre} style={{ width: 86, height: 86, objectFit: "cover", borderRadius: 24, border: "1px solid var(--primary)", margin: "0 auto 24px", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }} />
          )}
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 20 }}>Bienvenido a {restaurante.nombre}</p>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 400, margin: "0 0 20px" }}>
            Experiencia Culinaria <br /><em style={{ color: "var(--primary)" }}>Inolvidable</em>
          </h1>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => router.push(`/${slug}/menu`)} className="btn btn-primary btn-lg">Pedir ahora</button>
            <button onClick={openReserva} className="btn btn-secondary btn-lg">Reservar Mesa</button>
          </div>
        </div>
      </section>

      {/* MODAL RESERVA */}
      <AnimatePresence>
        {showReserva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReserva(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {reservaEnviada ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-6"
                >
                  <CheckCircle2 className="mx-auto mb-4 text-[var(--success)]" size={56} />
                  <h3 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h3>
                  <p className="text-[var(--text-muted)]">Te contactaremos vía WhatsApp.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-serif text-[var(--text)] m-0">Reservar Mesa</h3>
                    <button 
                      onClick={() => setShowReserva(false)} 
                      className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
                    >
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
                    <input className="input" placeholder="Tu nombre" value={reservaData.nombre} onChange={e => setReservaData({...reservaData, nombre: e.target.value})} />
                    <input className="input" placeholder="Teléfono" value={reservaData.telefono} onChange={e => setReservaData({...reservaData, telefono: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" type="date" value={reservaData.fecha} onChange={e => setReservaData({...reservaData, fecha: e.target.value})} />
                      <input className="input" type="time" value={reservaData.hora} onChange={e => setReservaData({...reservaData, hora: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={enviarReserva} className="btn btn-primary btn-lg w-full mt-6 rounded-2xl text-[15px] flex items-center justify-center gap-2">
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
