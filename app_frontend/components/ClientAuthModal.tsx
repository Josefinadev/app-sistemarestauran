"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserPlus, LogIn, ShoppingBag, LogOut } from "lucide-react";
import { loginAuth, registrarCliente, completarRegistroCliente } from "@/lib/api";
import { useAuth } from "@/lib/store";

import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   ClientAuthModal — Modal de autenticacion para clientes
   Opciones: Continuar sin cuenta / Iniciar sesion / Registrarse / OTP
   Respeta colores primary/secondary del restaurante.
   ═══════════════════════════════════════════════════════════ */

type View = "options" | "login" | "register" | "otp" | "account";

interface Props {
  open: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  slug: string;
  onHistorial?: () => void;
}

export function ClientAuthModal({ open, onClose, onContinueAsGuest, slug, onHistorial }: Props) {
  const { restaurante, usuario, logout } = useAuth();
  const [view, setView] = useState<View>("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Cuando el modal se abre, mostrar la vista correcta según estado de sesión
  useEffect(() => {
    if (open) {
      setView(usuario ? "account" : "options");
      setSuccess(false);
      setError("");
    }
  }, [open, usuario]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    setError("");
    setShowPassword(false);
    setSuccess(false);
    setOtpCode("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await loginAuth(email.trim(), password);
      if (data.usuario?.rol !== "cliente") {
        setError("Esta cuenta no es de cliente. Usa el panel de administracion.");
        setLoading(false);
        return;
      }
      useAuth.getState().setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || "",
        usuario: data.usuario,
        restaurante: data.restaurante || restaurante,
      });
      setSuccess(true);
      setTimeout(() => { onClose(); setView("account"); }, 1000);
    } catch (err: any) {
      setError(err.message || "Email o contrasena incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !nombre.trim()) return;
    if (!restaurante?.id) return;
    setLoading(true);
    setError("");
    try {
      // 1. Crear la cuenta (se mandará el OTP automáticamente por Supabase si Confirm Email está activado)
      await registrarCliente({ email: email.trim(), password, nombre, id_restaurante: restaurante.id });
      
      // 2. Cambiar la vista a OTP en vez de iniciar sesión
      setView("otp");
    } catch (err: any) {
      setError(err.message || "Error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 8) {
      setError("Ingresa el código de 8 dígitos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Verificar OTP directamente con Supabase
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'signup'
      });

      if (otpError) throw otpError;

      // Una vez verificado el OTP, registramos oficialmente en la tabla de nuestra BD
      await completarRegistroCliente({
        email: email.trim(),
        nombre: nombre,
        id_restaurante: restaurante!.id
      });

      // Iniciamos sesión normalmente a nuestro backend
      const loginData = await loginAuth(email.trim(), password);
      
      useAuth.getState().setSession({
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token || "",
        usuario: loginData.usuario,
        restaurante: loginData.restaurante || restaurante,
      });
      
      setSuccess(true);
      setTimeout(() => { onClose(); setView("account"); }, 1000);
    } catch (err: any) {
      setError(err.message || "Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, width: "100vw", height: "100dvh" }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}
          style={{ position: "relative", width: "100%", maxWidth: 380, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}
        >
          {/* Close button */}
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "var(--surface-hover)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer", zIndex: 2, display: "flex" }}>
            <X size={16} color="var(--text-muted)" />
          </button>

          <div style={{ padding: "32px 24px 24px" }}>
            <AnimatePresence mode="wait">

              {/* ═══ ACCOUNT VIEW (usuario ya logueado) ═══ */}
              {view === "account" && !success && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-ghost)", border: "1px solid rgba(197,160,89,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <User size={24} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                      {usuario?.nombre || "Mi cuenta"}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{usuario?.email}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => {
                        onClose();
                        if (onHistorial) onHistorial();
                        else window.location.href = `/${slug}/historial`;
                      }}
                      style={{ width: "100%", padding: "14px 16px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <ShoppingBag size={16} /> Mi historial de pedidos
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                        setView("options");
                      }}
                      style={{ width: "100%", padding: "14px 16px", background: "rgba(220,38,38,0.06)", color: "var(--error)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}

              {view === "options" && !success && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <User size={24} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Bienvenido</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Elige como deseas continuar</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={onContinueAsGuest}
                      style={{ width: "100%", padding: "14px 16px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <ArrowRight size={16} /> Continuar sin cuenta
                    </button>
                    <button
                      onClick={() => { resetForm(); setView("login"); }}
                      style={{ width: "100%", padding: "14px 16px", background: "var(--surface-hover)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <LogIn size={16} /> Iniciar sesion
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "8px 0 0" }}>
                      No tienes cuenta?{" "}
                      <button onClick={() => { resetForm(); setView("register"); }} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                        Registrarse
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ═══ LOGIN VIEW ═══ */}
              {view === "login" && !success && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Iniciar sesion</h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Ingresa con tu cuenta de cliente</p>
                  </div>

                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: "12px 14px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contrasena" style={{ width: "100%", padding: "12px 40px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {error && <p style={{ fontSize: 12, color: "var(--error)", margin: 0, padding: "8px 12px", background: "rgba(220,38,38,0.06)", borderRadius: 8 }}>{error}</p>}

                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {loading ? <Loader2 size={16} className="spin-icon" /> : <LogIn size={16} />} {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                  </form>

                  <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "14px 0 0" }}>
                    <button onClick={() => { resetForm(); setView("options"); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12 }}>Volver</button>
                    {" · "}
                    <button onClick={() => { resetForm(); setView("register"); }} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Registrarse</button>
                  </p>
                </motion.div>
              )}

              {/* ═══ REGISTER VIEW ═══ */}
              {view === "register" && !success && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Registrarse</h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Crea tu cuenta para guardar tus pedidos</p>
                  </div>

                  <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                      <User size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: "100%", padding: "12px 14px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: "12px 14px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contrasena" style={{ width: "100%", padding: "12px 40px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {error && <p style={{ fontSize: 12, color: "var(--error)", margin: 0, padding: "8px 12px", background: "rgba(220,38,38,0.06)", borderRadius: 8 }}>{error}</p>}

                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {loading ? <Loader2 size={16} className="spin-icon" /> : <UserPlus size={16} />} {loading ? "Creando..." : "Crear cuenta"}
                    </button>
                  </form>

                  <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "14px 0 0" }}>
                    <button onClick={() => { resetForm(); setView("options"); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12 }}>Volver</button>
                    {" · "}Ya tienes cuenta?{" "}
                    <button onClick={() => { resetForm(); setView("login"); }} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Ingresar</button>
                  </p>
                </motion.div>
              )}

              {/* ═══ OTP VIEW ═══ */}
              {view === "otp" && !success && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Verifica tu correo</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                      Hemos enviado un código de verificación a <br/>
                      <strong style={{ color: "var(--text)" }}>{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input 
                        type="text" 
                        maxLength={8}
                        value={otpCode} 
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                        placeholder="12345678" 
                        style={{ width: "100%", padding: "12px 14px 12px 38px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 18, letterSpacing: 8, textAlign: "center", outline: "none", fontWeight: 700 }} 
                        autoFocus
                      />
                    </div>

                    {error && <p style={{ fontSize: 12, color: "var(--error)", margin: 0, padding: "8px 12px", background: "rgba(220,38,38,0.06)", borderRadius: 8 }}>{error}</p>}

                    <button type="submit" disabled={loading || otpCode.length !== 8} style={{ width: "100%", padding: "13px", background: "var(--primary)", color: "var(--text-inverse)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: (loading || otpCode.length !== 8) ? "not-allowed" : "pointer", opacity: (loading || otpCode.length !== 8) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {loading ? <Loader2 size={16} className="spin-icon" /> : <ArrowRight size={16} />} {loading ? "Verificando..." : "Verificar Código"}
                    </button>
                  </form>

                  <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "14px 0 0" }}>
                    <button onClick={() => { setView("register"); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12 }}>Volver atrás</button>
                  </p>
                </motion.div>
              )}

              {/* ═══ SUCCESS VIEW ═══ */}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{ textAlign: "center", padding: "20px 0" }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}
                  >
                    <User size={24} color="var(--primary)" />
                  </motion.div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Listo!</h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Sesion iniciada correctamente</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
