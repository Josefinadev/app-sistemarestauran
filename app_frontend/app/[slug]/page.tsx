"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRestaurante, getWebConfig, getWebCombos, getWebOfertas } from "@/lib/api";
import {
  Wine, CheckCircle2,
  X, Loader2, Utensils
} from "lucide-react";

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
    if (!reservaData.nombre || !reservaData.telefono || !reservaData.fecha || !config?.whatsapp) return;
    const msg = `🍷 *Reserva ${restaurante.nombre}*\n\n👤 ${reservaData.nombre}\n📞 ${reservaData.telefono}\n📅 ${reservaData.fecha} a las ${reservaData.hora}\n👥 ${reservaData.personas} personas\n📝 ${reservaData.notas || "Sin notas"}\n\n¡Gracias por reservar!`;
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    setReservaEnviada(true);
    setTimeout(() => { 
      setShowReserva(false); 
      setReservaEnviada(false); 
    }, 3000);
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
          <button onClick={() => setShowReserva(true)} className="btn btn-primary btn-sm">Reservar</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px", position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,11,14,0.85) 0%, rgba(12,11,14,0.6) 45%, rgba(12,11,14,0.9) 100%)", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 20 }}>Bienvenido a {restaurante.nombre}</p>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 400, margin: "0 0 20px" }}>
            Experiencia Culinaria <br /><em style={{ color: "var(--primary)" }}>Inolvidable</em>
          </h1>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => router.push(`/${slug}/menu`)} className="btn btn-primary btn-lg">Pedir ahora</button>
            <button onClick={() => setShowReserva(true)} className="btn btn-secondary btn-lg">Reservar Mesa</button>
          </div>
        </div>
      </section>

      {/* MODAL RESERVA */}
      {showReserva && (
        <>
          <div className="overlay" onClick={() => setShowReserva(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 24, padding: 32, width: "90%", maxWidth: 440, border: "1px solid var(--border)" }}>
            {reservaEnviada ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 color="var(--success)" size={48} style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 20, margin: "0 0 8px" }}>¡Solicitud enviada!</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Te contactaremos vía WhatsApp.</p>
              </div>
            ) : (
              <>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 22, fontFamily: "var(--font-noto-serif), serif", margin: 0 }}>Reservar</h3>
                  <button onClick={() => setShowReserva(false)} style={{ background: "none", border: "none" }}><X size={18} color="var(--text-muted)" /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input className="input" placeholder="Tu nombre" value={reservaData.nombre} onChange={e => setReservaData({...reservaData, nombre: e.target.value})} />
                  <input className="input" placeholder="Teléfono" value={reservaData.telefono} onChange={e => setReservaData({...reservaData, telefono: e.target.value})} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input className="input" type="date" value={reservaData.fecha} onChange={e => setReservaData({...reservaData, fecha: e.target.value})} />
                    <input className="input" type="time" value={reservaData.hora} onChange={e => setReservaData({...reservaData, hora: e.target.value})} />
                  </div>
                </div>
                <button onClick={enviarReserva} className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 24 }}>Confirmar vía WhatsApp</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
