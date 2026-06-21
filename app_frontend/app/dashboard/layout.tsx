"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth, useNotificaciones } from "@/lib/store";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { applyRestauranteBranding } from "@/lib/branding";
import { useRestauranteRealtime } from "@/lib/realtime";
import { CursorGlow } from "@/components/CursorGlow";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ChefHat,
  Bell,
  LogOut,
  Wine,
  LayoutDashboard,
  Users,
  BarChart3,
  Globe,
  Crown,
  User,
  Menu,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Wine Design v2
   Sidebar con nuevo diseño, header con título+subtítulo
   ═══════════════════════════════════════════════════════════ */

const allNavItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, rol: "admin", modulo: "gestion-pedidos" },
  { href: "/dashboard/admin/reportes", label: "Reportes", icon: BarChart3, rol: "admin", modulo: "marketing-analitico" },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users, rol: "admin" },
  { href: "/dashboard/admin/web", label: "Gestión Web", icon: Globe, rol: "admin" },
  { href: "/dashboard/admin/suscripcion", label: "Suscripción", icon: Crown, rol: "admin" },
  { href: "/dashboard/cocina", label: "Cocina", icon: ChefHat, rol: "cocina", modulo: "gestion-pedidos" },
  { href: "/dashboard/caja", label: "Caja", icon: CreditCard, rol: "caja", modulo: "gestion-pedidos" },
  { href: "/dashboard/mesero", label: "Mesero", icon: User, rol: "mesero", modulo: "gestion-pedidos" },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  "/dashboard/admin": { title: "Panel Administrativo", subtitle: "Resumen general de tu restaurante" },
  "/dashboard/admin/reportes": { title: "Reportes", subtitle: "Analiza el rendimiento de tu restaurante" },
  "/dashboard/admin/usuarios": { title: "Usuarios", subtitle: "Gestiona los usuarios y permisos del sistema" },
  "/dashboard/admin/web": { title: "Gestión Web", subtitle: "Administra el contenido visible en tu sitio web" },
  "/dashboard/admin/suscripcion": { title: "Suscripción", subtitle: "Gestiona tu plan, facturación y preferencias" },
  "/dashboard/cocina": { title: "Cocina", subtitle: "Gestiona y prepara los pedidos en tiempo real" },
  "/dashboard/caja": { title: "Caja", subtitle: "Panel de cobros y control de pedidos" },
  "/dashboard/mesero": { title: "Panel Mesero", subtitle: "Gestiona y entrega pedidos a tus mesas" },
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { rol, usuario, logout, accessToken, _hasHydrated, restaurante } = useAuth();
  const { unreadCount, items: notifItems, markAllRead } = useNotificaciones();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [modulosActivos, setModulosActivos] = useState<string[]>([]);

  // ── Auth Guard ──
  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push("/login");
    }
  }, [_hasHydrated, accessToken, router]);

  // ── Role Guard ──
  useEffect(() => {
    if (!_hasHydrated || !accessToken || !rol) return;

    const allowedPrefixesByRole: Record<string, string[]> = {
      admin: ["/dashboard/admin", "/dashboard/cocina", "/dashboard/mesero", "/dashboard/caja"],
      propietario: ["/dashboard/admin", "/dashboard/cocina", "/dashboard/mesero", "/dashboard/caja"],
      cocina: ["/dashboard/cocina"],
      caja: ["/dashboard/caja"],
      mesero: ["/dashboard/mesero"],
      admin_saas: ["/superadmin", "/dashboard/admin"],
      cliente: ["/"],
    };

    const allowed = allowedPrefixesByRole[rol] || ["/dashboard/admin"];
    const isAllowed = allowed.some((p) => pathname?.startsWith(p));
    if (!isAllowed) {
      router.replace(allowed[0] || "/dashboard/admin");
    }
  }, [_hasHydrated, accessToken, rol, pathname, router]);

  // ── Close mobile menu on route change ──
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ── Mobile drawer: Esc + scroll lock ──
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  // ── Load active modules ──
  useEffect(() => {
    async function loadModulos() {
      if (!restaurante?.id) return;
      try {
        const { data: subData } = await (supabase
          .from("restaurante_suscripcion") as any)
          .select("id_plan")
          .eq("id_restaurante", restaurante.id)
          .eq("estado", "activa")
          .maybeSingle();

        if (subData?.id_plan) {
          const { data: modsData } = await (supabase
            .from("suscripcion_plan_modulo") as any)
            .select("id_modulo, modulo:suscripcion_modulo(slug)")
            .eq("id_plan", subData.id_plan);

          if (modsData) {
            const slugs = (modsData as any[]).map((m: any) => m.modulo?.slug).filter(Boolean);
            setModulosActivos(slugs);
          }
        }
      } catch (err) {
        console.error("Error loading modules:", err);
      }
    }
    if (accessToken && restaurante?.id) {
      loadModulos();
    }
  }, [restaurante?.id, accessToken]);

  // ── Refresh restaurante branding ──
  useEffect(() => {
    async function refreshRestaurante() {
      if (!accessToken || !restaurante?.id) return;
      const { data, error } = await (supabase.from("restaurante") as any)
        .select("*")
        .eq("id", restaurante.id)
        .maybeSingle();
      if (!error && data) {
        useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...data });
      }
    }
    refreshRestaurante();
  }, [accessToken, restaurante?.id]);

  // ── Real-time branding ──
  useRestauranteRealtime(restaurante?.id || null, (r) => {
    useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...r });
  });

  // ── Apply CSS Variables ──
  useEffect(() => {
    applyRestauranteBranding(restaurante);
  }, [restaurante?.color_primario, restaurante?.color_secundario]);

  // ── Filter nav by role & modules ──
  const navItems = allNavItems.filter((item) => {
    const isAdminLike = rol === "admin" || rol === "admin_saas" || rol === "propietario";
    if (!isAdminLike && item.rol !== rol) return false;
    if (item.modulo && modulosActivos.length > 0 && !modulosActivos.includes(item.modulo)) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // ── Get current page info ──
  const currentInfo = Object.entries(pageInfo).find(([key]) => pathname?.startsWith(key))?.[1]
    || { title: "Dashboard", subtitle: "Panel de administración" };

  if (!_hasHydrated) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }}>
            <Wine size={24} color="var(--text-inverse, #fff)" />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) return null;

  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      <CursorGlow />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="premium-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        id="premium-sidebar"
        className={[
          "premium-sidebar",
          sidebarCollapsed ? "premium-sidebar--collapsed" : "",
          mobileMenuOpen ? "premium-sidebar--mobile-open" : "",
        ].filter(Boolean).join(" ")}
        aria-label="Navegación principal"
        role={mobileMenuOpen ? "dialog" : undefined}
        aria-modal={mobileMenuOpen ? true : undefined}
      >
        {/* Logo header */}
        <div className="premium-sidebar-header">
          <div className="premium-sidebar-logo" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <div className="premium-sidebar-logo-img">
              {restaurante?.logo_url ? (
                <img src={restaurante.logo_url} alt={restaurante.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Wine size={16} color="var(--text-inverse, #fff)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="premium-sidebar-brand">{restaurante?.nombre || "Restaurante"}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 1 }}>
                Restaurante
              </div>
            </div>
          </div>
          <button
            className="premium-sidebar-collapse"
            onClick={() => { setSidebarCollapsed(true); setMobileMenuOpen(false); }}
            aria-label="Cerrar menú"
            title="Cerrar"
          >
            <ChevronsLeft size={14} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="premium-sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard/admin") || (item.href === "/dashboard/admin" && pathname === "/dashboard/admin");
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`premium-sidebar-item ${isActive ? "premium-sidebar-item--active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="premium-sidebar-pill"
                    className="premium-sidebar-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                  />
                )}
                <Icon size={18} className="premium-sidebar-item-icon" />
                <span className="premium-sidebar-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="premium-sidebar-footer">
          <div className="sidebar-divider" />

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="sidebar-logout-item"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>

          {/* Expand button (collapsed state) */}
          <button
            className="premium-sidebar-expand"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expandir menú"
            title="Expandir"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="premium-header-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
              aria-controls="premium-sidebar"
            >
              <Menu size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h2 className="dashboard-header-title">{currentInfo.title}</h2>
              <p className="dashboard-header-subtitle">{currentInfo.subtitle}</p>
            </div>
          </div>

          <div className="dashboard-header-right" style={{ gap: 10 }}>
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications bell */}
            <div style={{ position: "relative", zIndex: 9999 }}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Bell size={16} color="var(--text-secondary)" />
                {unreadCount() > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--bg)",
                  }}>
                    {unreadCount()}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="dashboard-notif-dropdown" style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  maxHeight: 400,
                  overflowY: "auto",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 9999,
                  padding: "8px",
                  minWidth: 280,
                }}>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: 0 }}>Notificaciones</p>
                  </div>
                  {notifItems.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center" }}>
                      <Bell size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Sin notificaciones</p>
                    </div>
                  ) : (
                    notifItems.slice(0, 10).map((n) => (
                      <div key={n.id} style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: n.leida ? "transparent" : "var(--primary-ghost)",
                        marginBottom: 2,
                      }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>{n.titulo}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{n.mensaje}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User display */}
            <div className="header-user-display">
              <div className="header-user-avatar">
                {restaurante?.logo_url ? (
                  <img src={restaurante.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  usuario?.nombre?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{usuario?.nombre || "Usuario"}</span>
                <span className="header-user-role">
                  {rol === "admin" ? "Administrador" : rol === "cocina" ? "Cocinero" : rol === "mesero" ? "Mesero" : rol === "caja" ? "Cajero" : rol || "Sin rol"}
                </span>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          </div>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
