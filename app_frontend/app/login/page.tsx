"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "framer-motion";
import type { RolUsuario } from "@/lib/database.types";
import { useAuth, normalizeRole } from "@/lib/store";
import { loginAuth } from "@/lib/api";
import {
  Lock, LogIn, Loader2, Eye, EyeOff, Mail, ShieldCheck, AlertCircle,
  Users2, Clock, Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleRoutes: Partial<Record<RolUsuario, string>> = {
  admin:   "/dashboard/admin",
  cocina:  "/dashboard/cocina",
  mesero:  "/dashboard/mesero",
  caja:    "/dashboard/caja",
  cliente: "/",
};

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const prefersReducedMotion = useReducedMotion();
  const shake = useAnimationControls();
  const disabled = !mounted || !email.trim() || !password.trim() || loading;

  useEffect(() => {
    if (!error) return;
    shake.start({ x: [0, -8, 8, -5, 5, -2, 2, 0], transition: { duration: 0.38 } });
  }, [error, shake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Ingresa tu email."); return; }
    if (!password.trim()) { setError("Ingresa la contraseña."); return; }
    setLoading(true); setError("");
    try {
      const res = await loginAuth(email.trim(), password);
      setSession({
        accessToken:  res.access_token,
        refreshToken: res.refresh_token,
        usuario:      res.usuario,
        restaurante:  res.restaurante,
      });
      const role = normalizeRole(res.usuario.rol);
      router.push(role === "admin_saas" ? "/superadmin" : ((roleRoutes as any)[role!] ?? "/dashboard/admin"));
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas.");
    } finally { setLoading(false); }
  };

  return (
    <div className="lv-root">
      <ThemeToggle floating />

      {/* ════════════════════════════
          CUERPO PRINCIPAL
          ════════════════════════════ */}
      <div className="lv-body">

        {/* ── CARD IZQUIERDO: Formulario ── */}
        <motion.aside className="lv-card" animate={shake}>
          {/* Ornamento esquinas */}
          <span className="lv-corner lv-corner--tl" aria-hidden />
          <span className="lv-corner lv-corner--tr" aria-hidden />

          {/* Logo */}
          <div className="lv-brand">
            <Image
              src="/assets/Ordely.png"
              alt="Ordely Restaurante"
              width={72}
              height={72}
              style={{ objectFit: "contain" }}
            />
            <div className="lv-brand-text">
              <span className="lv-brand-name">ORDELY</span>
              <span className="lv-brand-sub">RESTAURANTE</span>
            </div>
          </div>

          {/* Encabezado */}
          <div className="lv-intro">
            <p className="lv-sistema">SISTEMA DE GESTIÓN</p>
            <h1 className="lv-title">
              Bienvenido<br />
              de vuelta
            </h1>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="lv-form" noValidate>
            {/* Email */}
            <div className="lv-field">
              <label>CORREO ELECTRÓNICO</label>
              <div className="lv-input">
                <Mail size={15} className="lv-input-ico" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="lv-field">
              <label>CONTRASEÑA</label>
              <div className="lv-input">
                <Lock size={15} className="lv-input-ico" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (error) setError(""); }}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className="lv-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Recuérdame + Olvidaste */}
            <div className="lv-row-aux">
              <label className="lv-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>Recuérdame</span>
              </label>
              <button type="button" className="lv-forgot">¿Olvidaste tu contraseña?</button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lv-error"
                >
                  <AlertCircle size={12} /><span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón */}
            <motion.button
              type="submit"
              className="lv-btn"
              disabled={disabled}
              whileHover={!disabled && !prefersReducedMotion ? { scale: 1.015 } : undefined}
              whileTap={!disabled && !prefersReducedMotion ? { scale: 0.985 } : undefined}
            >
              {loading
                ? <Loader2 size={17} className="spin-icon" />
                : <><LogIn size={16} /> INICIAR SESIÓN</>}
            </motion.button>
          </form>

          {/* Nota seguridad */}
          <div className="lv-secure">
            <ShieldCheck size={13} />
            <span>Conexión segura · Supabase Auth</span>
          </div>
        </motion.aside>

        {/* ── PANEL DERECHO: Imagen + contenido ── */}
        <section className="lv-hero">
          {/* Imagen de fondo */}
          <Image
            src="/assets/imgLogin.png"
            alt="Gestión de restaurante"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />

          {/* Ornamento esquina top-right */}
          <div className="lv-hero-orn" aria-hidden />

          {/* Contenido superpuesto */}
          <div className="lv-hero-content">
            <div className="lv-hero-top">
              <h2 className="lv-hero-title">
                Gestión<br />
                Inteligente
              </h2>
              <div className="lv-fleur" aria-hidden>⚜</div>
              <p className="lv-hero-desc">
                Pedidos en tiempo real, menú digital y<br />
                control total desde cualquier dispositivo.
              </p>
            </div>

            {/* Stats */}
            <div className="lv-stats">
              <div className="lv-stat">
                <Users2 size={22} className="lv-stat-ico" />
                <strong>4</strong>
                <span>ROLES</span>
              </div>
              <div className="lv-stat-div" />
              <div className="lv-stat">
                <Clock size={22} className="lv-stat-ico" />
                <strong>24/7</strong>
                <span>REAL-TIME</span>
              </div>
              <div className="lv-stat-div" />
              <div className="lv-stat">
                <Building2 size={22} className="lv-stat-ico" />
                <strong>8</strong>
                <span>MULTI-TENANT</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lv-footer">
        <span className="lv-footer-fleur" aria-hidden>⚜</span>
        <span>TRUJILLO, PERÚ - © 2026</span>
      </footer>
    </div>
  );
}
