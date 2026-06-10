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
  Crown,
  Flame,
  UtensilsCrossed,
  Wallet,
  Bell,
  LogOut,
  Wine,
  LayoutDashboard,
  Users,
  BarChart3,
  Gift,
  CircleDot,
  Menu,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Sidebar inteligente por rol
   Cada rol solo ve su sección. Admin ve todo.
   ═══════════════════════════════════════════════════════════ */

const allNavItems = [
  { href: "/dashboard/admin", label: "Panel Admin", icon: Crown, rol: "admin", modulo: "gestion-pedidos" },
  { href: "/dashboard/admin/reportes", label: "Reportes", icon: BarChart3, rol: "admin", modulo: "marketing-analitico" },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users, rol: "admin" },
  { href: "/dashboard/admin/web", label: "Gestión Web", icon: LayoutDashboard, rol: "admin" },
  { href: "/dashboard/admin/suscripcion", label: "Mi Plan", icon: Gift, rol: "admin" },
  { href: "/dashboard/cocina", label: "Cocina", icon: Flame, rol: "cocina", modulo: "gestion-pedidos" },
  { href: "/dashboard/mesero", label: "Mesero", icon: UtensilsCrossed, rol: "mesero", modulo: "gestion-pedidos" },
  { href: "/dashboard/caja", label: "Caja", icon: Wallet, rol: "caja", modulo: "gestion-pedidos" },
];

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
  const [time, setTime] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [modulosActivos, setModulosActivos] = useState<string[]>([]);

  // ── Auth Guard: Redirigir al login si no hay sesión ──
  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push("/login");
    }
  }, [_hasHydrated, accessToken, router]);

  // ── Role Guard: evitar navegación por URL a módulos no permitidos ──
  useEffect(() => {
    if (!_hasHydrated || !accessToken || !rol) return;

     const allowedPrefixesByRole: Record<string, string[]> = {
       admin: ["/dashboard/admin", "/dashboard/cocina", "/dashboard/mesero", "/dashboard/caja"],
       propietario: ["/dashboard/admin", "/dashboard/cocina", "/dashboard/mesero", "/dashboard/caja"],
       cocina: ["/dashboard/cocina"],
       caja: ["/dashboard/caja"],
       mesero: ["/dashboard/mesero"],
       // Superadmin can access the SaaS panel and the tenant admin dashboard.
       // This prevents surprising redirects to /superadmin when a superadmin refreshes
       // a tenant dashboard URL (common while configuring a newly created tenant).
       admin_saas: ["/superadmin", "/dashboard/admin"],
       cliente: ["/"],
     };

    const allowed = allowedPrefixesByRole[rol] || ["/dashboard/admin"];
    const isAllowed = allowed.some((p) => pathname?.startsWith(p));
    if (!isAllowed) {
      router.replace(allowed[0] || "/dashboard/admin");
    }
  }, [_hasHydrated, accessToken, rol, pathname, router]);

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

  // ── Close mobile menu when route changes ──
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ── Mobile drawer: cerrar con Esc + bloquear scroll del body ──
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

  // Fetch active modules for tenant
  useEffect(() => {
    async function loadModulos() {
      if (!restaurante?.id) return;
      
      try {
        // Obtenemos la suscripción activa
        const { data: subData } = await (supabase
          .from("restaurante_suscripcion") as any)
          .select("id_plan")
          .eq("id_restaurante", restaurante.id)
          .eq("estado", "activa")
          .maybeSingle();
          
        if (subData?.id_plan) {
          // Obtenemos los módulos habilitados para ese plano
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

  // Refrescar restaurante (branding) desde DB para no depender del snapshot del login.
  useEffect(() => {
    async function refreshRestaurante() {
      if (!accessToken || !restaurante?.id) return;
      const { data, error } = await (supabase.from("restaurante") as any)
        .select("*")
        .eq("id", restaurante.id)
        .maybeSingle();
      if (!error && data) {
        // Evita perder datos existentes si la fila no trae algún campo.
        useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...data });
      }
    }
    refreshRestaurante();
  }, [accessToken, restaurante?.id]);

  // Branding en tiempo real
  useRestauranteRealtime(restaurante?.id || null, (r) => {
    // Mantener el objeto local en sync para que el resto de UI use lo último.
    useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...r });
  });

  // ── Dynamic Theming: Inject CSS Variables ──
  useEffect(() => {
    applyRestauranteBranding(restaurante);
  }, [restaurante?.color_primario, restaurante?.color_secundario]);

  // Filter nav items by role and active modules
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

  if (!_hasHydrated) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }}>
            <Wine size={24} color="var(--text-inverse)" />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) return null;

  const roleIcons: Record<string, ReactNode> = {
    admin: <Crown size={14} />,
    cocina: <Flame size={14} />,
    mesero: <UtensilsCrossed size={14} />,
    caja: <Wallet size={14} />,
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      <CursorGlow />
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
        <div className="premium-sidebar-header">
          <div className="premium-sidebar-logo" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <div className="premium-sidebar-logo-img">
              {restaurante?.logo_url ? (
                <img src={restaurante.logo_url} alt={restaurante.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Wine size={16} color="var(--text-inverse, #fff)" />
              )}
            </div>
            <span className="premium-sidebar-brand">{restaurante?.nombre || "Cargando..."}</span>
          </div>
          <button
            className="premium-sidebar-collapse"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Colapsar menú"
            title="Colapsar"
          >
            <ChevronsLeft size={14} />
          </button>
        </div>
        <nav className="premium-sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
                {isActive && (
                  <div className="premium-sidebar-item-dot" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="premium-sidebar-footer">
          <div className="premium-sidebar-user" title={`${usuario?.nombre || "Usuario"} · ${rol || ""}`}>
            <div className="premium-sidebar-avatar">
              {usuario?.nombre?.charAt(0).toUpperCase() || "?"}
              <div className="premium-sidebar-avatar-pulse" />
            </div>
            <div className="premium-sidebar-user-info">
              <div className="premium-sidebar-user-name">{usuario?.nombre || "Usuario"}</div>
              <div className="premium-sidebar-user-role">
                {roleIcons[rol || ""] || null}
                {rol || "Sin rol"}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="premium-sidebar-logout" aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={12} /><span>Cerrar sesión</span>
          </button>
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
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="premium-header-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              aria-controls="premium-sidebar"
            >
              <Menu size={18} />
            </button>
            <h2 className="dashboard-header-title">{navItems.find((n) => pathname?.startsWith(n.href))?.label || "Dashboard"}</h2>
            <span className="badge badge-delivered dashboard-header-status" style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><CircleDot size={8} /> En línea</span>
          </div>
          <div className="dashboard-header-right">
            <span className="dashboard-header-time" style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{time}</span>
            <ThemeToggle />
            <div style={{ position: "relative" }}>
              <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Bell size={16} color="var(--text-secondary)" /></button>
              {unreadCount() > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "var(--secondary)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount()}</span>}
              {showNotifs && (
                <div className="dashboard-notif-dropdown" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, maxHeight: 400, overflowY: "auto", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 9999, padding: "8px" }}>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}><p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: 0 }}>Notificaciones</p></div>
                  {notifItems.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}><Bell size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} /><p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Sin notificaciones</p></div> : notifItems.slice(0, 10).map((n) => (<div key={n.id} style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", background: n.leida ? "transparent" : "var(--primary-ghost)", marginBottom: 2 }}><p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>{n.titulo}</p><p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{n.mensaje}</p></div>))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
