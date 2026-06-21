"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { registrarCliente } from "@/lib/api";
import { UserPlus, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, Bell, Clock, Tag, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/store";

export default function ClienteRegistroPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { restaurante } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: ""
  });
  const [notifOfertas, setNotifOfertas] = useState(true);
  const [notifPedidos, setNotifPedidos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) return;
    
    setLoading(true);
    setError("");
    
    try {
      await registrarCliente({
        ...formData,
        id_restaurante: restaurante.id
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${slug}/menu`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al crear cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "40px 24px" }}>
      <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginBottom: 32, gap: 8 }}>
        <ArrowLeft size={18} /> Volver
      </button>

      <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "rgba(197,160,89,0.1)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <UserPlus size={32} color="var(--primary)" />
        </div>
        
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Crea tu cuenta</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
          Únete a <strong>{restaurante?.nombre || "nuestro restaurante"}</strong> para guardar tus favoritos y ver tu historial.
        </p>

        {/* Benefits preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32, textAlign: "left" }}>
          {[
            { Icon: Clock, label: "Historial de pedidos", desc: "Ve todos tus pedidos anteriores" },
            { Icon: Tag, label: "Ofertas exclusivas", desc: "Recibe promos personalizadas" },
            { Icon: Bell, label: "Notificaciones", desc: "Estado de tu pedido en tiempo real" },
            { Icon: ShieldCheck, label: "Datos seguros", desc: "Tu información siempre protegida" },
          ].map(({ Icon, label, desc }) => (
            <div key={label} style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(197,160,89,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon size={14} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {success ? (
          <div className="animate-fade-in" style={{ padding: 40, background: "rgba(74,222,128,0.05)", border: "1px solid var(--success)", borderRadius: 24, textAlign: "center" }}>
            <CheckCircle size={48} color="var(--success)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>¡Cuenta creada!</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>Te estamos redirigiendo al menú...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Nombre completo</p>
              <input required className="input" placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Email</p>
              <input required type="email" className="input" placeholder="tu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Contraseña</p>
              <div style={{ position: "relative" }}>
                <input required type={showPassword ? "text" : "password"} className="input" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Notification preferences */}
            <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Preferencias de notificaciones</p>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag size={14} color="var(--primary)" />
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text)", margin: 0, fontWeight: 500 }}>Ofertas y promociones</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Descuentos exclusivos del restaurante</p>
                  </div>
                </div>
                <input type="checkbox" checked={notifOfertas} onChange={(e) => setNotifOfertas(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer", flexShrink: 0 }} />
              </label>
              <div style={{ height: 1, background: "var(--border)" }} />
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={14} color="var(--tertiary)" />
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text)", margin: 0, fontWeight: 500 }}>Estado de pedidos</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Notificaciones cuando tu pedido esté listo</p>
                  </div>
                </div>
                <input type="checkbox" checked={notifPedidos} onChange={(e) => setNotifPedidos(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--tertiary)", cursor: "pointer", flexShrink: 0 }} />
              </label>
            </div>

            {error && (
              <p style={{ color: "var(--warning)", fontSize: 13, textAlign: "center", background: "rgba(226,114,91,0.1)", padding: "12px", borderRadius: 12 }}>{error}</p>
            )}

            <button disabled={loading || !restaurante} type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", height: 56, borderRadius: 16, marginTop: 16 }}>
              {loading ? <Loader2 className="spin-icon" size={20} /> : "Registrarme"}
            </button>

            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", marginTop: 20 }}>
              ¿Ya tienes cuenta? <button type="button" onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>Inicia sesión</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
