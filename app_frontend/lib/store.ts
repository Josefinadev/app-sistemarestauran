import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemCarrito, Producto, Agregado, RolUsuario, Restaurante, Mesa, EstadoPedido } from "@/lib/database.types";
import { v4 as uuidv4 } from "uuid";

// Normalize role aliases coming from backend or external labels to canonical RolUsuario
export function normalizeRole(input?: string | null) {
  if (!input) return null;
  const r = String(input).toLowerCase();
  // SaaS / superadmin variants -> keep as admin_saas to distinguish from tenant `admin`
  if (r === "admin_saas" || r === "adminsas" || r === "saas_admin" || r === "adminsaas" || r.includes("superadmin") || r.includes("super") || r.includes("owner")) return "admin_saas";
  if (r === "admin" || r === "propietario") return "admin";
  if (r.includes("cocina")) return "cocina";
  if (r.includes("mesero")) return "mesero";
  if (r.includes("caja")) return "caja";
  if (r.includes("cliente") || r.includes("client")) return "cliente";
  // fallback: if already a canonical role name
  if (["admin", "cocina", "mesero", "caja", "cliente"].includes(r)) return r as RolUsuario;
  return null;
}

/* ═══════════════════════════════════════════════════════════
   Store del Carrito (Cliente)
   ═══════════════════════════════════════════════════════════ */

interface CarritoState {
  items: ItemCarrito[];
  addItem: (producto: Producto, cantidad: number, notas: string, agregados: Agregado[]) => void;
  removeItem: (itemId: string) => void;
  updateNotas: (itemId: string, notas: string) => void;
  updateCantidad: (itemId: string, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCarrito = create<CarritoState>((set, get) => ({
  items: [],

  addItem: (producto, cantidad, notas, agregados) => {
    const precioAgregados = agregados.reduce((sum, a) => sum + a.precio, 0);
    const precioTotal = producto.precio + precioAgregados;

    // Check if item already exists (same product, notes, agregados)
    const existingIndex = get().items.findIndex((item) =>
      item.producto.id === producto.id &&
      item.notas === notas &&
      JSON.stringify(item.agregados_seleccionados.map(a => a.id).sort()) === JSON.stringify(agregados.map(a => a.id).sort())
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      set((state) => ({
        items: state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        ),
      }));
    } else {
      // Add new item
      const newItem: ItemCarrito = {
        id: uuidv4(),
        producto,
        notas,
        agregados_seleccionados: agregados,
        precio_total: precioTotal,
        cantidad,
      };
      set((state) => ({ items: [...state.items, newItem] }));
    }
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
  },

  updateNotas: (itemId, notas) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, notas } : i)),
    }));
  },

  updateCantidad: (itemId, cantidad) => {
    if (cantidad <= 0) {
      // Remove item if quantity is 0 or less
      set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
    } else {
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? { ...i, cantidad } : i)),
      }));
    }
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + (i.precio_total * i.cantidad), 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
}));

/* ═══════════════════════════════════════════════════════════
   Store de Sesión / Auth real con Supabase
   Persiste en localStorage para sobrevivir recargas de página
   ═══════════════════════════════════════════════════════════ */

interface AuthUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string; // allow admin_saas (superadmin) aliases
  auth_id: string;
}

interface LoginSessionData {
  accessToken: string;
  refreshToken: string;
  usuario: AuthUsuario;
  restaurante: Restaurante | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  rol: string | null; // can be 'admin', 'admin_saas', 'cocina', etc.
  usuario: AuthUsuario | null;
  restaurante: Restaurante | null;
  mesa: Mesa | null;
  activePedidoId: string | null;
  activePedidoEstado: EstadoPedido | null;
  _hasHydrated: boolean;
  setSession: (data: LoginSessionData) => void;
  setRestaurante: (restaurante: Restaurante) => void;
  setMesa: (mesa: Mesa) => void;
  setActivePedido: (pedidoId: string, estado: EstadoPedido) => void;
  clearActivePedido: () => void;
  logout: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      rol: null,
      usuario: null,
      restaurante: null,
      mesa: null,
      activePedidoId: null,
      activePedidoEstado: null,
      _hasHydrated: false,

        setSession: ({ accessToken, refreshToken, usuario, restaurante }) => {
          const norm = normalizeRole((usuario as any)?.rol) as string | null;
          set({
            accessToken,
            refreshToken,
            rol: norm,
            usuario: usuario ? { ...usuario, rol: norm as string } : null,
            restaurante,
          });
        },

      setRestaurante: (restaurante) => set({ restaurante }),
      setMesa: (mesa) => set({ mesa }),
      setActivePedido: (pedidoId, estado) =>
        set({
          activePedidoId: pedidoId,
          activePedidoEstado: estado,
        }),
      clearActivePedido: () =>
        set({
          activePedidoId: null,
          activePedidoEstado: null,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          rol: null,
          usuario: null,
          restaurante: null,
          mesa: null,
          activePedidoId: null,
          activePedidoEstado: null,
        }),

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "el-mijano-auth",
      // Use per-tab storage (sessionStorage) so multiple tabs can hold independent sessions.
      // This avoids the last-write-wins behavior of shared localStorage when different
      // roles are logged in across tabs in the same browser profile.
      getStorage: () => sessionStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/* ═══════════════════════════════════════════════════════════
   Store de Notificaciones
   ═══════════════════════════════════════════════════════════ */

export interface Notificacion {
  id: string;
  tipo: "info" | "success" | "warning" | "error";
  titulo: string;
  mensaje: string;
  timestamp: number;
  leida: boolean;
}

interface NotificacionesState {
  items: Notificacion[];
  add: (n: Omit<Notificacion, "id" | "timestamp" | "leida">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  unreadCount: () => number;
}

export const useNotificaciones = create<NotificacionesState>((set, get) => ({
  items: [],

  add: (n) => {
    const newN: Notificacion = {
      ...n,
      id: uuidv4(),
      timestamp: Date.now(),
      leida: false,
    };
    set((state) => ({ items: [newN, ...state.items].slice(0, 50) }));
  },

  markRead: (id) =>
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    })),

  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, leida: true })),
    })),

  clear: () => set({ items: [] }),

  unreadCount: () => get().items.filter((n) => !n.leida).length,
}));
