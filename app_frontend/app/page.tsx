"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wine, Zap, Shield, Smartphone, Globe, 
  ArrowRight, Check, Loader2, Star,
  Utensils, LayoutDashboard, QrCode, Eye, EyeOff,
  CreditCard, AlertCircle, CheckCircle
} from "lucide-react";
import { crearPreferenciaPagoRegistro } from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { resetRestauranteBranding } from "@/lib/branding";

const PRECIO_MENSUAL = 60; // S/60

export default function SaaSLandingPage() {
  const router = useRouter();

  // Verificar si viene de un pago
  const [pagoMessage, setPagoMessage] = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const pagoStatus = urlParams.get('pago');
    
    if (pagoStatus === 'fallido') {
      setPagoMessage({ type: 'error', text: 'El pago no se pudo completar. Intenta nuevamente.' });
    } else if (pagoStatus === 'pendiente') {
      setPagoMessage({ type: 'pending', text: 'Tu pago esta pendiente de confirmacion. Te notificaremos cuando se procese.' });
    }
    
    // Limpiar el parametro de la URL
    if (pagoStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete('pago');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Reset branding para que la landing no muestre colores del restaurante
  useEffect(() => { resetRestauranteBranding(); }, []);
  const [showRegModal, setShowRegModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    propietario_nombre: "",
    propietario_email: "",
    propietario_password: "",
    color_primario: "#C5A059",
    color_secundario: "#E2725B",
    logo_url: "",
    hero_banner_url: "",
    latitud: -12.046374,
    longitud: -77.042793,
    radio_permitido_metros: 100
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Crear preferencia de pago en Mercado Pago
      const preferencia = await crearPreferenciaPagoRegistro(formData);
      
      // Redirigir al checkout de Mercado Pago
      // TODO: Cambiar a init_point cuando MP esté en producción
      window.location.href = preferencia.sandbox_init_point;
      
    } catch (err: any) {
      alert(err.message || "Error al procesar el registro.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0C0B0E", color: "#fff", minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>
      {/* Notificacion de estado de pago */}
      {pagoMessage && (
        <div style={{ 
          position: "fixed", 
          top: 100, 
          left: "50%", 
          transform: "translateX(-50%)", 
          zIndex: 1001,
          padding: "16px 24px",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: pagoMessage.type === 'error' ? 'rgba(239,68,68,0.15)' : pagoMessage.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
          border: `1px solid ${pagoMessage.type === 'error' ? 'rgba(239,68,68,0.3)' : pagoMessage.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
          color: pagoMessage.type === 'error' ? '#fca5a5' : pagoMessage.type === 'success' ? '#86efac' : '#fde047'
        }}>
          {pagoMessage.type === 'error' ? <AlertCircle size={20} /> : pagoMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{pagoMessage.text}</span>
          <button onClick={() => setPagoMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>x</button>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(12,11,14,0.8)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #C5A059, #A8863D)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wine size={20} color="#000" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Restaurant<span style={{ color: "#C5A059" }}>OS</span></span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#features" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>Características</a>
          <a href="#pricing" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>Precios</a>
          <button onClick={() => router.push("/login")} className="btn btn-ghost" style={{ color: "#fff" }}>Ingresar</button>
          <button onClick={() => setShowRegModal(true)} className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 24px" }}>Empezar Gratis</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: "120px 5% 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "60%", background: "radial-gradient(circle, rgba(197,160,89,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ padding: "8px 16px", background: "rgba(197,160,89,0.1)", color: "#C5A059", borderRadius: 100, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24, display: "inline-block" }}>
            Arquitectura Multi-Tenant de Nueva Generación
          </span>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 84px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "0 0 32px" }}>
            El sistema operativo para tu <br />
            <span style={{ background: "linear-gradient(to right, #C5A059, #F5E0B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Imperio Gastronómico.</span>
          </h1>
          <p style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", maxWidth: 700, margin: "0 auto 48px", lineHeight: 1.6 }}>
            Desde menús digitales inteligentes hasta gestión operativa en tiempo real. Todo lo que necesitas para escalar tu restaurante en una sola plataforma.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button onClick={() => setShowRegModal(true)} className="btn btn-primary btn-lg" style={{ height: 64, padding: "0 40px", fontSize: 18, borderRadius: 16, gap: 12 }}>
              Registra tu Restaurante <ArrowRight size={20} />
            </button>
            <button className="btn btn-secondary btn-lg" style={{ height: 64, padding: "0 40px", fontSize: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
              Agendar Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: "100px 5%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40 }}>
          <div style={{ padding: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 32 }}>
            <div style={{ width: 48, height: 48, background: "rgba(197,160,89,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <QrCode color="#C5A059" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Menú Digital Inteligente</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Pedidos desde la mesa con validación de geolocalización. Reduce tiempos y mejora la experiencia del cliente.</p>
          </div>
          <div style={{ padding: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 32 }}>
            <div style={{ width: 48, height: 48, background: "rgba(197,160,89,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <LayoutDashboard color="#C5A059" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Control Total Multi-Tenant</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Gestiona múltiples locales, roles (Cocinero, Mesero, Cajero) y analíticas avanzadas en un panel unificado.</p>
          </div>
          <div style={{ padding: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 32 }}>
            <div style={{ width: 48, height: 48, background: "rgba(197,160,89,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Smartphone color="#C5A059" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Real-Time de Verdad</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>La cocina recibe pedidos al instante. Sincronización perfecta entre todos los dispositivos del staff.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: "100px 5%", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>Precio Simple y Transparente</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Sin planes complicados. Paga mensualmente y ten acceso completo.</p>
        </div>
        
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          {/* Plan Unico */}
          <div style={{ padding: 48, background: "rgba(197,160,89,0.05)", border: "2px solid #C5A059", borderRadius: 40, position: "relative" }}>
            <span style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", background: "#C5A059", color: "#000", padding: "6px 16px", borderRadius: 100, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Todo Incluido</span>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: "#C5A059", marginBottom: 12 }}>Plan RestaurantOS</h4>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 32 }}>
              <span style={{ fontSize: 48, fontWeight: 800 }}>S/{PRECIO_MENSUAL}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>/mes</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Menu Digital con QR</li>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Gestion de Pedidos en Tiempo Real</li>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Panel de Administracion Completo</li>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Roles: Mesero, Cocinero, Cajero</li>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Web Publica Personalizada</li>
              <li style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}><Check size={18} color="#C5A059" /> Soporte Tecnico</li>
            </ul>
            <button onClick={() => setShowRegModal(true)} className="btn btn-primary" style={{ width: "100%", height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CreditCard size={18} /> Comenzar Ahora
            </button>
            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Paga tu primer mes y activa tu restaurante al instante
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "80px 5%", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>© 2026 Restaurante OS Platform. Potenciado por Multi-Tenant SDK.</p>
      </footer>

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="animate-fade-in-up" style={{ background: "#151419", width: "100%", maxWidth: 760, maxHeight: "92vh", overflowY: "auto", borderRadius: 32, padding: 40, border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
            <button onClick={() => setShowRegModal(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>x</button>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Registra tu Restaurante</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Completa los datos y realiza el pago del primer mes para activar tu cuenta.</p>
            
            {/* Indicador de precio */}
            <div style={{ background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CreditCard size={20} color="#C5A059" />
                <span style={{ color: "rgba(255,255,255,0.7)" }}>Pago del primer mes</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#C5A059" }}>S/{PRECIO_MENSUAL}</span>
            </div>
            
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <input required style={{ height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} placeholder="Nombre del Restaurante" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                <input required style={{ height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} placeholder="Slug (ej: mi-nuevo-local)" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div>
                  <p className="label" style={{ marginBottom: 8 }}>Color principal</p>
                  <input type="color" style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: 6 }} value={formData.color_primario} onChange={e => setFormData({...formData, color_primario: e.target.value})} />
                </div>
                <div>
                  <p className="label" style={{ marginBottom: 8 }}>Color secundario</p>
                  <input type="color" style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: 6 }} value={formData.color_secundario} onChange={e => setFormData({...formData, color_secundario: e.target.value})} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <ImageUploadInput label="Logo del restaurante" value={formData.logo_url} onChange={(url) => setFormData({...formData, logo_url: url})} height={150} />
                <ImageUploadInput label="Hero banner" value={formData.hero_banner_url} onChange={(url) => setFormData({...formData, hero_banner_url: url})} height={150} hint="Imagen amplia para portada y menú" />
              </div>
              
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", marginTop: 8 }}>
                <p className="label" style={{ marginBottom: 12, color: "rgba(255,255,255,0.6)" }}>Configuración Geográfica y Radio de Pedidos</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label className="label" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>LATITUD</label><input required type="number" step="any" style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} value={Number.isNaN(formData.latitud) ? "" : formData.latitud} onChange={e => setFormData({...formData, latitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>LONGITUD</label><input required type="number" step="any" style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} value={Number.isNaN(formData.longitud) ? "" : formData.longitud} onChange={e => setFormData({...formData, longitud: parseFloat(e.target.value)})} /></div>
                  <div><label className="label" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>RADIO (MT)</label><input required type="number" min="10" style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} value={Number.isNaN(formData.radio_permitido_metros) ? "" : formData.radio_permitido_metros} onChange={e => setFormData({...formData, radio_permitido_metros: parseInt(e.target.value)})} /></div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                    Solo los clientes dentro del perímetro (radio en metros) respecto a las coordenadas especificadas podrán realizar pedidos, previniendo así comandas falsas.
                  </p>
                </div>
              </div>
              <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "8px 0" }} />
              <input required style={{ height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} placeholder="Nombre del Dueño" value={formData.propietario_nombre} onChange={e => setFormData({...formData, propietario_nombre: e.target.value})} />
              <input required type="email" style={{ height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 20px" }} placeholder="Email de acceso" value={formData.propietario_email} onChange={e => setFormData({...formData, propietario_email: e.target.value})} />
              <div style={{ position: "relative" }}>
                <input required type={showPassword ? "text" : "password"} style={{ width: "100%", height: 54, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0 52px 0 20px" }} placeholder="Contraseña segura" value={formData.propietario_password} onChange={e => setFormData({...formData, propietario_password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <button disabled={loading} type="submit" className="btn btn-primary" style={{ height: 60, borderRadius: 16, marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <Loader2 className="spin-icon" size={20} /> : <><CreditCard size={20} /> Pagar S/{PRECIO_MENSUAL} y Crear Restaurante</>}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                Seras redirigido a Mercado Pago para completar el pago de forma segura
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
