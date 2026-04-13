import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemCarrito, Producto, Agregado, RolUsuario, Restaurante, Mesa } from "@/lib/database.types";
import { v4 as uuidv4 } from "uuid";

/* ═══════════════════════════════════════════════════════════
   Store del Carrito (Cliente)
   ═══════════════════════════════════════════════════════════ */

interface CarritoState {
  items: ItemCarrito[];
  addItem: (producto: Producto, notas: string, agregados: Agregado[]) => void;
  removeItem: (itemId: string) => void;
  updateNotas: (itemId: string, notas: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCarrito = create<CarritoState>((set, get) => ({
  items: [],

  addItem: (producto, notas, agregados) => {
    const precioAgregados = agregados.reduce((sum, a) => sum + a.precio, 0);
    const newItem: ItemCarrito = {
      id: uuidv4(),
      producto,
      notas,
      agregados_seleccionados: agregados,
      precio_total: producto.precio + precioAgregados,
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
  },

  updateNotas: (itemId, notas) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, notas } : i)),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.precio_total, 0),

  getItemCount: () => get().items.length,
}));

/* ═══════════════════════════════════════════════════════════
   Store de Sesión / Auth real con Supabase
   Persiste en localStorage para sobrevivir recargas de página
   ═══════════════════════════════════════════════════════════ */

interface AuthUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  auth_id: string;
}

interface LoginSessionData {
  accessToken: string;
  refreshToken: string;
  usuario: AuthUsuario;
  restaurante: Restaurante;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  rol: RolUsuario | null;
  usuario: AuthUsuario | null;
  restaurante: Restaurante | null;
  mesa: Mesa | null;
  _hasHydrated: boolean;
  setSession: (data: LoginSessionData) => void;
  setRestaurante: (restaurante: Restaurante) => void;
  setMesa: (mesa: Mesa) => void;
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
      _hasHydrated: false,

      setSession: ({ accessToken, refreshToken, usuario, restaurante }) =>
        set({
          accessToken,
          refreshToken,
          rol: usuario.rol,
          usuario,
          restaurante,
        }),

      setRestaurante: (restaurante) => set({ restaurante }),
      setMesa: (mesa) => set({ mesa }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          rol: null,
          usuario: null,
          restaurante: null,
          mesa: null,
        }),

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "el-mijano-auth",
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
