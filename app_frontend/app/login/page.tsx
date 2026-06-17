"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import type { RolUsuario } from "@/lib/database.types";
import { useAuth, normalizeRole } from "@/lib/store";
import { loginAuth } from "@/lib/api";
import {
  Lock,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  AlertCircle,
  Users2,
  Clock,
  LayoutGrid,
  MapPin,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleRoutes: Partial<Record<RolUsuario, string>> = {
  admin: "/dashboard/admin",
  cocina: "/dashboard/cocina",
  mesero: "/dashboard/mesero",
  caja: "/dashboard/caja",
  cliente: "/",
};

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const prefersReducedMotion = useReducedMotion();
  const cardControls = useAnimationControls();

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;
  const isButtonDisabled = !mounted || !canSubmit || isLoading;

  useEffect(() => {
    if (!error) return;
    cardControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: "easeInOut" },
    });
  }, [error, cardControls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Ingresa tu email."); return; }
    if (!password.trim()) { setError("Ingresa la contraseña."); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await loginAuth(email.trim(), password);
      setSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        usuario: response.usuario,
        restaurante: response.restaurante,
      });
      const userRole = normalizeRole(response.usuario.rol);
      if (userRole === "admin_saas") {
        router.push("/superadmin");
      } else {
        const destino = userRole && (roleRoutes as any)[userRole]
          ? (roleRoutes as any)[userRole] : "/dashboard/admin";
        router.push(destino);
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContainer = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };

  const formItem = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } } };

  return (
    <main className="login-page">
      <ThemeToggle floating />

      {/* ── Card ── */}
      <motion.div
        className="login-card"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
      >
        <motion.div className="login-card-inner" animate={cardControls}>

          {/* ═══ PANEL IZQUIERDO: Visual / Branding ═══ */}
          <section className="login-visual-panel" aria-hidden="true">
            {/* Fondo: restaurant.jpg con overlay crema */}
            <div className="login-visual-bg">
              <Image
                src="/assets/restaurant.jpg"
                alt=""
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            {/* Contenido */}
            <div className="login-visual-content">
              {/* Logo Ordely */}
              <Image
                src="/assets/Ordely.png"
                alt="Ordely"
                width={190}
                height={130}
                style={{ objectFit: "contain" }}
                className="login-logo"
                priority
              />

              {/* — SISTEMA DE GESTIÓN — */}
              <div className="login-system-label">
                <span className="login-system-line" />
                <span>SISTEMA DE GESTIÓN</span>
                <span className="login-system-line" />
              </div>

              {/* Titular */}
              <h2 className="login-visual-headline">
                Gestión
                <br />
                <span>Inteligente</span>
              </h2>

              {/* Subtítulo */}
              <p className="login-visual-copy">
                Pedidos en tiempo real, menú digital y control total
                <br />
                desde cualquier dispositivo.
              </p>

              {/* Divisor dorado */}
              <div className="login-gold-rule" />

              {/* Stats */}
              <div className="login-stats">
                <div className="login-stat">
                  <Users2 size={16} className="login-stat-icon" />
                  <span className="login-stat-value">4</span>
                  <span className="login-stat-label">ROLES</span>
                </div>
                <div className="login-stat-sep" />
                <div className="login-stat">
                  <Clock size={16} className="login-stat-icon" />
                  <span className="login-stat-value">24/7</span>
                  <span className="login-stat-label">REAL-TIME</span>
                </div>
                <div className="login-stat-sep" />
                <div className="login-stat">
                  <LayoutGrid size={16} className="login-stat-icon" />
                  <span className="login-stat-value">8</span>
                  <span className="login-stat-label">MULTI-TENANT</span>
                </div>
              </div>

              {/* Footer del panel visual */}
              <div className="login-visual-footer">
                <span><MapPin size={11} /> TRUJILLO, PERU &mdash; © 2026</span>
                <span><ShieldCheck size={11} /> Conexión segura &middot; Supabase Auth</span>
              </div>
            </div>
          </section>

          {/* ═══ PANEL DERECHO: Formulario ═══ */}
          <motion.section
            className="login-form-panel"
            variants={formContainer}
            initial="hidden"
            animate="show"
            aria-label="Iniciar sesión"
          >
            {/* Logo Ordely (visible solo en móvil) */}
            <motion.div variants={formItem} className="login-logo-mobile">
              <Image
                src="/assets/Ordely.png"
                alt="Ordely"
                width={150}
                height={102}
                style={{ objectFit: "contain" }}
              />
              <div className="login-system-label login-system-label--sm">
                <span className="login-system-line" />
                <span>SISTEMA DE GESTIÓN</span>
                <span className="login-system-line" />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div variants={formItem} className="login-heading">
              <h1>Bienvenido</h1>
              <p className="login-heading-sub">de vuelta</p>
              <div className="login-heading-rule" />
            </motion.div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email */}
              <motion.div variants={formItem} className="login-field">
                <label className="login-field-label" htmlFor="lf-email">
                  CORREO ELECTRÓNICO
                </label>
                <div className={`login-input-wrap${emailFocus ? " focused" : ""}`}>
                  <span className="login-input-icon"><Mail size={15} /></span>
                  <input
                    id="lf-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    placeholder="tu@email.com"
                    className="login-input"
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={formItem} className="login-field">
                <label className="login-field-label" htmlFor="lf-pass">
                  CONTRASEÑA
                </label>
                <div className={`login-input-wrap${passFocus ? " focused" : ""}`}>
                  <span className="login-input-icon"><Lock size={15} /></span>
                  <input
                    id="lf-pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    placeholder="••••••••"
                    className="login-input"
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-eye-btn"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="login-error"
                    role="alert"
                  >
                    <AlertCircle size={12} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón */}
              <motion.button
                variants={formItem}
                type="submit"
                className="login-submit"
                disabled={isButtonDisabled}
                whileHover={!isButtonDisabled && !prefersReducedMotion ? { scale: 1.02, y: -1 } : undefined}
                whileTap={!isButtonDisabled && !prefersReducedMotion ? { scale: 0.97 } : undefined}
              >
                {isLoading ? (
                  <Loader2 size={16} className="spin-icon" />
                ) : (
                  <><LogIn size={15} /> INICIAR SESIÓN</>
                )}
              </motion.button>
            </form>

            {/* Decoración de puntos */}
            <motion.div variants={formItem} className="login-dots" aria-hidden>···</motion.div>

            {/* Marca de agua */}
            <motion.p variants={formItem} className="login-watermark">ORDERLY</motion.p>

            {/* Footer móvil (oculto en desktop) */}
            <motion.div variants={formItem} className="login-mobile-footer">
              <span><ShieldCheck size={11} /> Conexión segura · Supabase Auth</span>
              <span>TRUJILLO, PERU &mdash; © 2026</span>
            </motion.div>
          </motion.section>

        </motion.div>
      </motion.div>
    </main>
  );
}
