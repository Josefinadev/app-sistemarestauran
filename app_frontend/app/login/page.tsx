"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { RolUsuario } from "@/lib/database.types";
import { useAuth } from "@/lib/store";
import { loginAuth } from "@/lib/api";
import {
  Wine,
  Lock,
  LogIn,
  Loader2,
  Monitor,
  Wifi,
  Crown,
  Mail,
  CircleDot,
} from "lucide-react";

const roleRoutes: Record<RolUsuario, string> = {
  admin: "/dashboard/admin",
  cocina: "/dashboard/cocina",
  mesero: "/dashboard/mesero",
  caja: "/dashboard/caja",
  cliente: "/",
  propietario: "/dashboard/admin",
  admin_saas: "/superadmin"
};

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

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
      // Autenticación real con Supabase Auth via backend
      const response = await loginAuth(email.trim(), password);

      // Guardar sesión en el store (persiste en localStorage)
      setSession({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        usuario: response.usuario,
        restaurante: response.restaurante,
      });

      // Redirigir al dashboard según el rol del usuario
      const destino = roleRoutes[response.usuario.rol as RolUsuario] || "/dashboard/admin";
      router.push(destino);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg)",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 960,
          minHeight: 560,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--bg-elevated)",
          borderRadius: 28,
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Panel Izquierdo ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 40px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wine size={16} color="var(--text-inverse)" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 20,
                letterSpacing: "0.06em",
                color: "var(--primary)",
              }}
            >
              Restaurant OS
            </span>
          </div>

          {/* Formulario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <p className="label" style={{ marginBottom: 12 }}>
                Sistema de gestión
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                  fontWeight: 400,
                  fontSize: "clamp(36px, 4vw, 48px)",
                  lineHeight: 1.1,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Bienvenido
                <br />
                de{" "}
                <em style={{ fontStyle: "italic", color: "var(--primary)" }}>
                  vuelta
                </em>
              </h1>
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: "var(--border)",
                  marginTop: 20,
                }}
              />
            </div>

            {isClient ? (
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
              {/* Email */}
              <div>
                <p className="label" style={{ marginBottom: 8 }}>
                  Correo electrónico
                </p>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="tu@email.com"
                    className="input-underline"
                    autoComplete="email"
                    style={{ paddingLeft: 24 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <p className="label" style={{ marginBottom: 8 }}>
                  Contraseña
                </p>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    className="input-underline"
                    autoComplete="current-password"
                    style={{ paddingLeft: 24 }}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  className="animate-fade-in"
                  style={{
                    fontSize: 12,
                    color: "var(--secondary)",
                    margin: 0,
                    padding: "8px 12px",
                    background: "rgba(226, 114, 91, 0.08)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(226, 114, 91, 0.2)",
                  }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!canSubmit || isLoading}
                style={{
                  width: "100%",
                  opacity: canSubmit && !isLoading ? 1 : 0.5,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="spin-icon" />
                ) : (
                  <>
                    <LogIn size={14} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>
            ) : (
              <div style={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="spin-icon" size={24} color="var(--text-muted)" />
              </div>
            )}
          </div>

          {/* Footer */}
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              margin: 0,
              opacity: 0.5,
            }}
          >
            Trujillo, Perú · © 2026
          </p>
        </div>

        {/* ── Panel Derecho — Visual ── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #1A1610 0%, #0E0C08 100%)",
          }}
        >
          {/* Decorative shapes */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              right: "10%",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(197,160,89,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              left: "5%",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(226,114,91,0.06) 0%, transparent 70%)",
            }}
          />

          {/* Blend edge */}
          <div
            style={{
              position: "absolute",
              left: -40,
              top: 0,
              bottom: 0,
              width: 80,
              background: "var(--bg-elevated)",
              borderRadius: "0 50% 50% 0",
              zIndex: 2,
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "48px",
              textAlign: "center",
            }}
          >
            <div
              className="animate-fade-in-up"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(197,160,89,0.25)",
                }}
              >
                <Wine size={36} color="var(--text-inverse)" />
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                  fontSize: 28,
                  fontWeight: 400,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Gestión
                <br />
                <span style={{ color: "var(--primary)" }}>Inteligente</span>
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  maxWidth: 260,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Pedidos en tiempo real, menú digital y control total desde cualquier dispositivo.
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                {[
                  { value: "4", label: "Roles", Icon: Crown },
                  { value: "∞", label: "Mesas", Icon: Monitor },
                  { value: "24/7", label: "Real-time", Icon: Wifi },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(197,160,89,0.06)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(197,160,89,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
      `}} />
    </main>
  );
}
