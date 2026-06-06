"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  animate,
} from "framer-motion";
import type { RolUsuario } from "@/lib/database.types";
import { useAuth, normalizeRole } from "@/lib/store";
import { loginAuth } from "@/lib/api";
import {
  Wine,
  Lock,
  LogIn,
  Loader2,
  Crown,
  Monitor,
  Wifi,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const roleRoutes: Partial<Record<RolUsuario, string>> = {
  admin: "/dashboard/admin",
  cocina: "/dashboard/cocina",
  mesero: "/dashboard/mesero",
  caja: "/dashboard/caja",
  cliente: "/",
};

/* ── CountUp: número que se anima de 0 → to al entrar en viewport ── */
function CountUp({
  to,
  suffix = "",
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v)) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  // Patrón mounted: evita mismatches de hidratación cuando password managers
  // o extensiones del navegador auto-rellenan los inputs antes de que React hidrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const prefersReducedMotion = useReducedMotion();
  const cardControls = useAnimationControls();

  // Tilt 3D para el panel visual (desktop)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useTransform(tiltY, [-100, 100], [4, -4]);
  const rotateY = useTransform(tiltX, [-100, 100], [-4, 4]);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;
  const isButtonDisabled = !mounted || !canSubmit || isLoading;

  // Shake de la card cuando hay error de credenciales
  useEffect(() => {
    if (!error) return;
    cardControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: "easeInOut" },
    });
  }, [error, cardControls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Ingresa tu email.");
      return;
    }
    if (!password.trim()) {
      setError("Ingresa la contraseña.");
      return;
    }

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
        const destino =
          userRole && (roleRoutes as any)[userRole]
            ? (roleRoutes as any)[userRole]
            : "/dashboard/admin";
        router.push(destino);
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  // Variants para la entrada en cascada del form (stagger)
  const formContainer = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.07, delayChildren: 0.15 },
        },
      };

  const formItem = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring" as const, stiffness: 300, damping: 30 },
        },
      };

  return (
    <main className="login-page">
      {/* ── Orbes de fondo (drift orgánico, blurred) ── */}
      <motion.div
        className="login-orb login-orb--1"
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, -32, 0], scale: [1, 1.06, 1] }
        }
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        aria-hidden
      />
      <motion.div
        className="login-orb login-orb--2"
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, 28, 0], scale: [1, 1.05, 1] }
        }
        transition={{ duration: 11, ease: "easeInOut", repeat: Infinity, delay: 1.2 }}
        aria-hidden
      />
      <motion.div
        className="login-orb login-orb--3"
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, -18, 0], x: [0, 12, 0] }
        }
        transition={{ duration: 13, ease: "easeInOut", repeat: Infinity, delay: 0.6 }}
        aria-hidden
      />

      {/* ── Card principal (glass + spring entry) ── */}
      <motion.div
        className="login-card"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 280, damping: 30, mass: 0.9 }
        }
      >
        <motion.div animate={cardControls} className="login-card-inner">
          {/* ── Panel del Form ── */}
          <motion.section
            className="login-form-panel"
            variants={formContainer}
            initial="hidden"
            animate="show"
          >
            {/* Brand (móvil) */}
            <motion.div variants={formItem} className="login-brand login-brand--mobile">
              <div className="login-brand-mark">
                <Wine size={18} color="var(--text-inverse)" />
              </div>
              <span className="login-brand-text">El Mijano</span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={formItem}>
              <p className="label" style={{ marginBottom: 10 }}>
                Sistema de gestión
              </p>
              <h1 className="login-headline">
                Bienvenido
                <br />
                de <em>vuelta</em>
              </h1>
              <div className="login-headline-rule" />
            </motion.div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email */}
              <motion.div variants={formItem}>
                <p className="label" style={{ marginBottom: 8 }}>
                  Correo electrónico
                </p>
                <div className="login-input-wrap">
                  <motion.div
                    animate={{
                      scale: emailFocus ? 1.18 : 1,
                      color: emailFocus ? "var(--primary)" : "var(--text-muted)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="login-input-icon"
                  >
                    <Mail size={14} />
                  </motion.div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    placeholder="tu@email.com"
                    className="input-underline"
                    autoComplete="email"
                    style={{ paddingLeft: 24 }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={formItem}>
                <p className="label" style={{ marginBottom: 8 }}>
                  Contraseña
                </p>
                <div className="login-input-wrap">
                  <motion.div
                    animate={{
                      scale: passFocus ? 1.18 : 1,
                      color: passFocus ? "var(--primary)" : "var(--text-muted)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="login-input-icon"
                  >
                    <Lock size={14} />
                  </motion.div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    placeholder="••••••••"
                    className="input-underline"
                    autoComplete="current-password"
                    style={{ paddingLeft: 24 }}
                  />
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
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="login-error"
                    role="alert"
                  >
                    <AlertCircle size={12} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                variants={formItem}
                type="submit"
                className="btn btn-primary btn-lg login-submit"
                disabled={isButtonDisabled}
                whileHover={!isButtonDisabled && !prefersReducedMotion ? { scale: 1.02, y: -1 } : undefined}
                whileTap={!isButtonDisabled && !prefersReducedMotion ? { scale: 0.97 } : undefined}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                style={{ opacity: !isButtonDisabled ? 1 : 0.5 }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="spin-icon" />
                ) : (
                  <>
                    <LogIn size={14} />
                    Iniciar sesión
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer (solo desktop) */}
            <motion.p variants={formItem} className="login-footer-text">
              Trujillo, Perú · © 2026
            </motion.p>
          </motion.section>

          {/* ── Panel Visual (desktop: TiltedCard) ── */}
          <section className="login-visual-panel">
            <motion.div
              className="login-visual-tilt"
              style={{ rotateX, rotateY, transformPerspective: 1200 }}
              onMouseMove={(e) => {
                if (prefersReducedMotion) return;
                const rect = e.currentTarget.getBoundingClientRect();
                tiltX.set(e.clientX - rect.left - rect.width / 2);
                tiltY.set(e.clientY - rect.top - rect.height / 2);
              }}
              onMouseLeave={() => { tiltX.set(0); tiltY.set(0); }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              <div className="login-visual-inner">
                {/* Brand (desktop) */}
                <div className="login-brand login-brand--desktop">
                  <div className="login-brand-mark">
                    <Wine size={18} color="var(--text-inverse)" />
                  </div>
                  <span className="login-brand-text">El Mijano</span>
                </div>

                {/* Wine icon con float orgánico */}
                <motion.div
                  className="login-visual-icon"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { y: [0, -8, 0] }
                  }
                  transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
                >
                  <Wine size={42} color="var(--text-inverse)" />
                </motion.div>

                <h2 className="login-visual-title">
                  Gestión
                  <br />
                  <span>Inteligente</span>
                </h2>
                <p className="login-visual-copy">
                  Pedidos en tiempo real, menú digital y control total desde cualquier dispositivo.
                </p>

                {/* Stats con CountUp */}
                <div className="login-stats">
                  {([
                    { value: 4, label: "Roles", Icon: Crown, overrideValue: null as string | null },
                    { value: 0, label: "Real-time", Icon: Wifi, overrideValue: "24/7" },
                    { value: 0, label: "Multi-tenant", Icon: Monitor, overrideValue: "∞" },
                  ]).map((s) => (
                    <div key={s.label} className="login-stat">
                      <s.Icon size={14} className="login-stat-icon" />
                      <div className="login-stat-value">
                        {s.overrideValue ?? <CountUp to={s.value} />}
                      </div>
                      <div className="login-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Trust signal */}
                <div className="login-trust">
                  <ShieldCheck size={12} />
                  <span>Conexión segura · Supabase Auth</span>
                </div>
              </div>
            </motion.div>
          </section>
        </motion.div>
      </motion.div>
    </main>
  );
}
