import { create } from "zustand";
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
   Store de Sesión / Auth simulado
   ═══════════════════════════════════════════════════════════ */

interface AuthState {
  rol: RolUsuario | null;
  usuario: { nombre: string; rol: RolUsuario } | null;
  restaurante: Restaurante | null;
  mesa: Mesa | null;
  setRol: (rol: RolUsuario) => void;
  setRestaurante: (restaurante: Restaurante) => void;
  setMesa: (mesa: Mesa) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  rol: null,
  usuario: null,
  restaurante: null,
  mesa: null,

  setRol: (rol) =>
    set({
      rol,
      usuario: { nombre: rol.charAt(0).toUpperCase() + rol.slice(1), rol },
    }),

  setRestaurante: (restaurante) => set({ restaurante }),
  setMesa: (mesa) => set({ mesa }),

  logout: () =>
    set({ rol: null, usuario: null, restaurante: null, mesa: null }),
}));

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
