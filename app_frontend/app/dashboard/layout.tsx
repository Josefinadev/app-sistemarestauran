"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth, useNotificaciones } from "@/lib/store";
import { useEffect, useState } from "react";
import {
  Crown,
  Flame,
  UtensilsCrossed,
  Wallet,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wine,
  LayoutDashboard,
  ChefHat,
  ClipboardList,
  Users,
  Tag,
  BarChart3,
  Gift,
  QrCode,
  CircleDot,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Sidebar inteligente por rol
   Cada rol solo ve su sección. Admin ve todo.
   ═══════════════════════════════════════════════════════════ */

const allNavItems = [
  { href: "/dashboard/admin", label: "Panel Admin", icon: Crown, rol: "admin" },
  { href: "/dashboard/admin/reportes", label: "Reportes", icon: BarChart3, rol: "admin" },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users, rol: "admin" },
  { href: "/dashboard/admin/web", label: "Gestión Web", icon: LayoutDashboard, rol: "admin" },
  { href: "/dashboard/cocina", label: "Cocina", icon: Flame, rol: "cocina" },
  { href: "/dashboard/mesero", label: "Mesero", icon: UtensilsCrossed, rol: "mesero" },
  { href: "/dashboard/caja", label: "Caja", icon: Wallet, rol: "caja" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { rol, usuario, logout } = useAuth();
  const { unreadCount } = useNotificaciones();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [time, setTime] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const { items: notifItems, markAllRead } = useNotificaciones();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // Filter nav items by role — admin sees ALL, others see only theirs
  const navItems = rol === "admin"
    ? allNavItems
    : allNavItems.filter((item) => item.rol === rol);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Role icon mapping
  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Crown size={14} />,
    cocina: <Flame size={14} />,
    mesero: <UtensilsCrossed size={14} />,
    caja: <Wallet size={14} />,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: sidebarCollapsed ? 72 : 240,
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "var(--bg-elevated)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "width var(--duration-normal) var(--ease-out)",
          overflow: "hidden",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {/* Top */}
        <div>
          {/* Logo */}
          <div
            style={{
              padding: sidebarCollapsed ? "20px 16px" : "20px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Wine size={16} color="var(--text-inverse)" />
            </div>
            {!sidebarCollapsed && (
              <span
                style={{
                  fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "var(--primary)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                El Mijano
              </span>
            )}
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: sidebarCollapsed ? "12px" : "12px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: isActive ? "var(--primary-ghost)" : "transparent",
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-out)",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    width: "100%",
                  }}
                >
                  <Icon
                    size={18}
                    style={{ flexShrink: 0 }}
                    color={isActive ? "var(--primary)" : "var(--text-muted)"}
                  />
                  {!sidebarCollapsed && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--primary)" : "var(--text-secondary)",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom - User */}
        <div
          style={{
            padding: sidebarCollapsed ? "16px" : "16px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--primary)",
                flexShrink: 0,
                border: "1px solid var(--border)",
              }}
            >
              {usuario?.nombre?.charAt(0) || "?"}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {usuario?.nombre || "Usuario"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {roleIcons[rol || ""] || null}
                  {rol || "Sin rol"}
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "8px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all var(--duration-fast) var(--ease-out)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <LogOut size={12} />
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header
          style={{
            height: 60,
            borderBottom: "1px solid var(--border)",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h2
              style={{
                fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                fontSize: 18,
                fontWeight: 400,
                color: "var(--text)",
                margin: 0,
              }}
            >
              {navItems.find((n) => pathname?.startsWith(n.href))?.label || "Dashboard"}
            </h2>
            <span
              className="badge badge-delivered"
              style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}
            >
              <CircleDot size={8} /> En línea
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {time}
            </span>

            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  if (!showNotifs) markAllRead();
                }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={16} color="var(--text-secondary)" />
              </button>
              {unreadCount() > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--secondary)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unreadCount()}
                </span>
              )}

              {/* Notification dropdown */}
              {showNotifs && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 320,
                    maxHeight: 400,
                    overflowY: "auto",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 100,
                    padding: "8px",
                  }}
                >
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      Notificaciones
                    </p>
                  </div>
                  {notifItems.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center" }}>
                      <Bell size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        Sin notificaciones
                      </p>
                    </div>
                  ) : (
                    notifItems.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          background: n.leida ? "transparent" : "var(--primary-ghost)",
                          marginBottom: 2,
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>
                          {n.titulo}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                          {n.mensaje}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "28px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
