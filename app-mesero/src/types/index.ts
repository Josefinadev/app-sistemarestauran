/* ═══════════════════════════════════════════════════════════
   TIPOS — App Mesero (espejo de los tipos del frontend web)
   ═══════════════════════════════════════════════════════════ */

export type EstadoPedido =
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type RolUsuario = "admin" | "cocina" | "mesero" | "caja" | "cliente";

export interface AuthUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  auth_id: string;
}

export interface Restaurante {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  direccion: string | null;
  telefono: string | null;
  moneda: string;
  activo: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: AuthUsuario;
  restaurante: Restaurante;
}

export interface ItemServir {
  id: string;
  nombre: string;
  mesa: number;
  hora: string;
  estado: "LISTO" | "ENTREGADO";
  esBebida: boolean;
  pedidoId: string;
  numeroPedido: number;
  horaPedido: string;
  notas: string | null;
  imagen_url: string | null;
  agregados: string[];
  cantidad: number;
}

export interface MesaEstado {
  numero: number;
  pedidoActivo: boolean;
  platosListos: number;
  totalPlatos: number;
  platosEntregados: number;
}

export interface Pedido {
  id: string;
  id_restaurante: string;
  id_mesa: string;
  numero_pedido: number;
  estado: EstadoPedido;
  total: number;
  notas: string | null;
  created_at: string;
  mesa?: { id: string; numero: number; slug: string };
  detalle_pedido?: DetallePedido[];
}

export interface DetallePedido {
  id: string;
  id_pedido: string;
  id_producto: string;
  precio_unitario: number;
  notas: string | null;
  estado: EstadoPedido;
  created_at: string;
  producto?: {
    id: string;
    nombre: string;
    precio: number;
    imagen_url: string | null;
    es_bebida: boolean;
    requiere_preparacion: boolean;
  };
  detalle_pedido_agregado?: {
    agregado: { id: string; nombre: string; precio: number };
  }[];
}
