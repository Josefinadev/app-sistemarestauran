"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, Loader2, Star, Eye, EyeOff,
  CreditCard, AlertCircle, CheckCircle, Calendar, QrCode,
  Users, Zap, ShieldCheck, Moon, Sun,
} from "lucide-react";
import { crearPreferenciaPagoRegistro } from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { resetRestauranteBranding } from "@/lib/branding";

const PRECIO_MENSUAL = 60;
const PRIMARY = "#C5A059";
const PRIMARY_DARK = "#A8863D";
const BG_LIGHT = "#FFFDF7";
const BG_CREAM = "#F9F5EC";
const TEXT_DARK = "#1A1410";
const TEXT_GRAY = "#6B6257";
const BORDER = "#E8DFD0";

export default function SaaSLandingPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [pagoMessage, setPagoMessage] = useState<{ type: "success" | "error" | "pending"; text: string } | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", slug: "", propietario_nombre: "", propietario_email: "",
    propietario_password: "", color_primario: "#C5A059", color_secundario: "#E2725B",
    logo_url: "", hero_banner_url: "", latitud: -12.046374, longitud: -77.042793, radio_permitido_metros: 100,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const pagoStatus = urlParams.get("pago");
    if (pagoStatus === "fallido") setPagoMessage({ type: "error", text: "El pago no se pudo completar. Intenta nuevamente." });
    else if (pagoStatus === "pendiente") setPagoMessage({ type: "pending", text: "Tu pago esta pendiente. Te notificaremos cuando se procese." });
    if (pagoStatus) { const url = new URL(window.location.href); url.searchParams.delete("pago"); window.history.replaceState({}, "", url.toString()); }
  }, []);

  useEffect(() => { resetRestauranteBranding(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const preferencia = await crearPreferenciaPagoRegistro(formData); window.location.href = preferencia.sandbox_init_point; }
    catch (err: any) { alert(err.message || "Error al procesar el registro."); setLoading(false); }
  };

  const bg = darkMode ? "#0C0B0E" : BG_LIGHT;
  const bgCream = darkMode ? "#111014" : BG_CREAM;
  const bgCard = darkMode ? "#1A1A1C" : "#FFFFFF";
  const textMain = darkMode ? "#F0E6D0" : TEXT_DARK;
  const textGray = darkMode ? "#9B9386" : TEXT_GRAY;
  const border = darkMode ? "#2A2118" : BORDER;
  const navBg = darkMode ? "rgba(12,11,14,0.95)" : "rgba(255,253,247,0.97)";

  return (
    <div style={{ background: bg, color: textMain, minHeight: "100vh", fontFamily: "var(--font-manrope), system-ui, sans-serif", transition: "background 0.3s, color 0.3s" }}>
      {pagoMessage && (
        <div style={{ position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)", zIndex: 1001, padding: "14px 20px", borderRadius: 14, display: "flex", alignItems: "center", gap: 10, background: pagoMessage.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", border: `1px solid ${pagoMessage.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: pagoMessage.type === "error" ? "#dc2626" : "#16a34a", fontSize: 14 }}>
          {pagoMessage.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{pagoMessage.text}</span>
          <button onClick={() => setPagoMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", marginLeft: 6, fontSize: 18 }}>x</button>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6%", position: "sticky", top: 0, zIndex: 100, background: navBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/Ordely.png" alt="Ordely" style={{ height: 54, width: "auto", objectFit: "contain" }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: textMain, letterSpacing: "-0.02em" }}>Ordely</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" style={{ color: textGray, textDecoration: "none", fontSize: 15, fontWeight: 500 }}>Caracteristicas</a>
          <a href="#pricing" style={{ color: textGray, textDecoration: "none", fontSize: 15, fontWeight: 500 }}>Precios</a>
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", cursor: "pointer", color: textGray, fontSize: 15, fontWeight: 600, padding: "8px 16px", letterSpacing: "0.02em" }}>INGRESAR</button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: `1px solid ${border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: textGray }}>
            {darkMode ? <Sun size={16} color={PRIMARY} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "72px 6% 88px", position: "relative", overflow: "hidden", background: bg }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 280, height: 280, pointerEvents: "none", opacity: darkMode ? 0.12 : 0.35 }}>
          <svg viewBox="0 0 280 280" fill="none"><circle cx="0" cy="280" r="80" stroke={PRIMARY} strokeWidth="1" fill="none" /><circle cx="0" cy="280" r="120" stroke={PRIMARY} strokeWidth="1" fill="none" /><circle cx="0" cy="280" r="160" stroke={PRIMARY} strokeWidth="1" fill="none" /><circle cx="0" cy="280" r="200" stroke={PRIMARY} strokeWidth="1" fill="none" /><circle cx="0" cy="280" r="240" stroke={PRIMARY} strokeWidth="1" fill="none" /></svg>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "center", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "inline-block", marginBottom: 18, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: PRIMARY, textTransform: "uppercase" as const }}>
              Arquitectura Multi-Tenant de Nueva Generacion
            </div>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 62px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", color: textMain, margin: "0 0 22px" }}>
              El sistema operativo<br />para tu Imperio<br />Gastronomico.
            </h1>
            <p style={{ fontSize: 16, color: textGray, lineHeight: 1.7, margin: "0 0 38px", maxWidth: 420 }}>
              Desde menus digitales inteligentes hasta gestion operativa en tiempo real.
              Todo lo que necesitas para escalar tu restaurante en una sola plataforma.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
              <button onClick={() => setShowRegModal(true)} style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 8 }}>
                REGISTRA TU RESTAURANTE <ArrowRight size={16} />
              </button>
              <button style={{ background: "transparent", color: textMain, border: `1.5px solid ${border}`, borderRadius: 10, padding: "14px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color={PRIMARY} /> AGENDAR DEMO
              </button>
            </div>
          </div>
          <div>
            <img src="/assets/img_web.png" alt="Ordely Dashboard" style={{ width: "115%", maxWidth: 700, height: "auto", display: "block", filter: "drop-shadow(0 20px 48px rgba(197,160,89,0.18))" }} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: bgCard, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 1200, margin: "0 auto" }}>
          {[
            { icon: <QrCode size={34} color={PRIMARY} />, title: "Menu Digital Inteligente", desc: "Pedidos desde la mesa con validacion de geolocalizacion. Reduce tiempos y mejora la experiencia del cliente." },
            { icon: <Users size={34} color={PRIMARY} />, title: "Control Total Multi-Tenant", desc: "Gestiona multiples locales, roles (Cocinero, Mesero, Cajero) y analiticas avanzadas en un panel unificado." },
            { icon: <Zap size={34} color={PRIMARY} />, title: "Real-Time de Verdad", desc: "La cocina recibe pedidos al instante. Sincronizacion perfecta entre todos los dispositivos del staff." },
            { icon: <ShieldCheck size={34} color={PRIMARY} />, title: "Precio Simple y Transparente", desc: "Sin planes complicados. Paga mensualmente y ten acceso completo." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "52px 32px", borderRight: i < 3 ? `1px solid ${border}` : "none", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: darkMode ? "rgba(197,160,89,0.1)" : "#FFF5E0", border: `1px solid ${darkMode ? "rgba(197,160,89,0.25)" : "#F0DEB0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: textMain, margin: 0, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: textGray, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "100px 6%", background: bgCream, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: "50%", transform: "translateY(-50%)", opacity: darkMode ? 0.08 : 0.3, pointerEvents: "none" }}>
          <svg width="400" height="400" viewBox="0 0 400 400">{[70, 110, 150, 190, 230, 270, 310, 350].map((r, i) => (<circle key={i} cx="400" cy="200" r={r} stroke={PRIMARY} strokeWidth="1.2" fill="none" opacity={0.9 - i * 0.08} />))}</svg>
        </div>
        <div style={{ position: "absolute", left: 48, bottom: 48, opacity: darkMode ? 0.07 : 0.18, pointerEvents: "none" }}>
          <svg width="100" height="100" viewBox="0 0 100 100">{Array.from({ length: 5 }).flatMap((_, row) => Array.from({ length: 5 }).map((_, col) => (<circle key={`${row}-${col}`} cx={col * 20 + 10} cy={row * 20 + 10} r={2.5} fill={PRIMARY} />)))}</svg>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.5fr", gap: 48, alignItems: "center", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: darkMode ? "rgba(197,160,89,0.1)" : "#FFF5E0", border: `1px solid ${darkMode ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/assets/Ordely.png" alt="Ordely" style={{ width: 44, height: 44, objectFit: "contain" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 52, fontWeight: 900, color: textMain, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>Todo Incluido</h2>
              <div style={{ width: 48, height: 3, background: PRIMARY, borderRadius: 2, margin: "16px 0 20px" }} />
              <p style={{ fontSize: 15, color: textGray, lineHeight: 1.7, margin: 0 }}>Una sola plataforma.<br />Todo lo que tu restaurante necesita<br />para crecer sin limites.</p>
            </div>
          </div>
          <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 24, padding: "38px 34px", boxShadow: "0 8px 40px rgba(197,160,89,0.1)" }}>
            <div style={{ background: PRIMARY, borderRadius: 10, padding: "10px 0", textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Plan Ordely</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 72, fontWeight: 900, color: PRIMARY, letterSpacing: "-0.04em", lineHeight: 1 }}>S/60</span>
              <span style={{ fontSize: 18, color: textGray }}> /mes</span>
            </div>
            <div style={{ height: 1, background: border, margin: "0 0 24px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 26 }}>
              {["Menu Digital con QR", "Gestion de Pedidos en Tiempo Real", "Panel de Administracion Completo", "Roles: Mesero, Cocinero, Cajero", "Web Publica Personalizada", "Soporte Tecnico"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 21, height: 21, borderRadius: "50%", background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} color="#fff" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ background: darkMode ? "rgba(197,160,89,0.08)" : "#FFFBF0", border: `1px solid ${darkMode ? "rgba(197,160,89,0.2)" : "#F0DEB0"}`, borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <Star size={20} fill={PRIMARY} color={PRIMARY} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: textMain, margin: 0, lineHeight: 1.3 }}>Paga tu primer mes y activa</p>
                <p style={{ fontSize: 13, color: textGray, margin: 0, lineHeight: 1.3 }}>tu restaurante al instante</p>
              </div>
            </div>
            <button onClick={() => setShowRegModal(true)} style={{ width: "100%", padding: "16px 0", background: PRIMARY, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Empezar ahora
            </button>
          </div>
          <div />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "28px 6%", borderTop: `1px solid ${border}`, textAlign: "center", background: bg }}>
        <p style={{ color: textGray, fontSize: 13, margin: 0 }}>© 2026 Ordely Platform. Potenciado por Multi-Tenant SDK.</p>
      </footer>

      {/* MODAL */}
      {showRegModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="animate-fade-in" style={{ background: bgCard, width: "100%", maxWidth: 760, maxHeight: "92vh", overflowY: "auto", borderRadius: 28, padding: "40px 44px", border: `1px solid ${border}`, position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <button onClick={() => setShowRegModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: `1px solid ${border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: textGray, fontSize: 18 }}>x</button>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: textMain, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Registra tu Restaurante</h2>
            <p style={{ color: textGray, margin: "0 0 24px", fontSize: 14 }}>Completa los datos y realiza el pago del primer mes para activar tu cuenta.</p>
            <div style={{ background: darkMode ? "rgba(197,160,89,0.1)" : "#FFFBF0", border: `1px solid ${darkMode ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, borderRadius: 14, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><CreditCard size={18} color={PRIMARY} /><span style={{ color: textGray, fontSize: 14 }}>Pago del primer mes</span></div>
              <span style={{ fontSize: 22, fontWeight: 800, color: PRIMARY }}>S/{PRECIO_MENSUAL}</span>
            </div>
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input required style={{ height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, color: textMain, padding: "0 16px", fontSize: 14, outline: "none" }} placeholder="Nombre del Restaurante" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                <input required style={{ height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, color: textMain, padding: "0 16px", fontSize: 14, outline: "none" }} placeholder="Slug (ej: mi-restaurante)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><p style={{ fontSize: 11, fontWeight: 600, color: textGray, margin: "0 0 5px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Color principal</p><input type="color" style={{ width: "100%", height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, padding: 6, cursor: "pointer" }} value={formData.color_primario} onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })} /></div>
                <div><p style={{ fontSize: 11, fontWeight: 600, color: textGray, margin: "0 0 5px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Color secundario</p><input type="color" style={{ width: "100%", height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, padding: 6, cursor: "pointer" }} value={formData.color_secundario} onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <ImageUploadInput label="Logo del restaurante" value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} height={110} />
                <ImageUploadInput label="Hero banner" value={formData.hero_banner_url} onChange={(url) => setFormData({ ...formData, hero_banner_url: url })} height={110} hint="Imagen portada y menu" />
              </div>
              <div style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F9F5EC", padding: "16px 18px", borderRadius: 14, border: `1px solid ${border}` }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: textGray, margin: "0 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Configuracion Geografica</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 10, color: textGray, display: "block", marginBottom: 4 }}>LATITUD</label><input required type="number" step="any" style={{ width: "100%", height: 44, borderRadius: 10, background: darkMode ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, color: textMain, padding: "0 12px", fontSize: 13, outline: "none" }} value={Number.isNaN(formData.latitud) ? "" : formData.latitud} onChange={(e) => setFormData({ ...formData, latitud: parseFloat(e.target.value) })} /></div>
                  <div><label style={{ fontSize: 10, color: textGray, display: "block", marginBottom: 4 }}>LONGITUD</label><input required type="number" step="any" style={{ width: "100%", height: 44, borderRadius: 10, background: darkMode ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, color: textMain, padding: "0 12px", fontSize: 13, outline: "none" }} value={Number.isNaN(formData.longitud) ? "" : formData.longitud} onChange={(e) => setFormData({ ...formData, longitud: parseFloat(e.target.value) })} /></div>
                  <div><label style={{ fontSize: 10, color: textGray, display: "block", marginBottom: 4 }}>RADIO (m)</label><input required type="number" min="10" style={{ width: "100%", height: 44, borderRadius: 10, background: darkMode ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, color: textMain, padding: "0 12px", fontSize: 13, outline: "none" }} value={Number.isNaN(formData.radio_permitido_metros) ? "" : formData.radio_permitido_metros} onChange={(e) => setFormData({ ...formData, radio_permitido_metros: parseInt(e.target.value) })} /></div>
                </div>
                <p style={{ fontSize: 11, color: textGray, margin: "8px 0 0", lineHeight: 1.5 }}>Solo clientes dentro del radio (metros) podran hacer pedidos.</p>
              </div>
              <hr style={{ border: 0, borderTop: `1px solid ${border}`, margin: "2px 0" }} />
              <input required style={{ height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, color: textMain, padding: "0 16px", fontSize: 14, outline: "none" }} placeholder="Nombre del Dueno" value={formData.propietario_nombre} onChange={(e) => setFormData({ ...formData, propietario_nombre: e.target.value })} />
              <input required type="email" style={{ height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, color: textMain, padding: "0 16px", fontSize: 14, outline: "none" }} placeholder="Email de acceso" value={formData.propietario_email} onChange={(e) => setFormData({ ...formData, propietario_email: e.target.value })} />
              <div style={{ position: "relative" }}>
                <input required type={showPassword ? "text" : "password"} style={{ width: "100%", height: 50, borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "#F9F5EC", border: `1px solid ${border}`, color: textMain, padding: "0 48px 0 16px", fontSize: 14, outline: "none" }} placeholder="Contrasena segura" value={formData.propietario_password} onChange={(e) => setFormData({ ...formData, propietario_password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: textGray, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button disabled={loading} type="submit" style={{ height: 56, borderRadius: 14, marginTop: 6, width: "100%", background: PRIMARY, color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 className="spin-icon" size={20} /> : <><CreditCard size={18} /> Pagar S/{PRECIO_MENSUAL} y Crear Restaurante</>}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: textGray, margin: "4px 0 0" }}>Seras redirigido a Mercado Pago para completar el pago de forma segura</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


