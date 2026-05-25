/* ═══════════════════════════════════════════════════════════
   EL MIJANO — Database Types (Supabase/PostgreSQL)
   Auto-generado a partir del esquema del modelo de datos
   ═══════════════════════════════════════════════════════════ */

export type EstadoPedido = "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO";
export type EstadoPago = "PENDIENTE" | "PAGADO" | "ANULADO";
export type MetodoPago = "EFECTIVO" | "YAPE" | "PLIN" | "TARJETA" | "OTRO";
export type RolUsuario = "admin" | "cocina" | "mesero" | "caja" | "cliente" | "propietario" | "admin_saas";

export interface Restaurante {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  hero_banner_url: string | null;
  direccion: string | null;
  telefono: string | null;
  latitud: number;
  longitud: number;
  radio_permitido_metros: number;
  moneda: string;
  activo: boolean;
  color_primario: string | null;
  color_secundario: string | null;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  id_restaurante: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  id_restaurante: string;
  id_categoria: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  disponible: boolean;
  stock: number;
  es_bebida: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GrupoAgregados {
  id: string;
  id_restaurante: string;
  nombre: string;
  min_seleccion: number;
  max_seleccion: number;
  created_at: string;
}

export interface ProductoGrupo {
  id: string;
  id_producto: string;
  id_grupo: string;
}

export interface Agregado {
  id: string;
  id_grupo: string;
  nombre: string;
  precio: number;
  disponible: boolean;
  created_at: string;
}

export interface Mesa {
  id: string;
  id_restaurante: string;
  numero: number;
  slug: string; // UUID aleatorio para QR seguro
  capacidad: number;
  activa: boolean;
  qr_url: string | null;
  created_at: string;
}

export interface Usuario {
  id: string;
  id_restaurante: string;
  auth_id: string | null;
  email: string | null;
  nombre: string;
  rol: RolUsuario;
  avatar_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  id_restaurante: string;
  id_mesa: string;
  id_usuario: string | null;
  numero_pedido: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  metodo_pago: MetodoPago | null;
  subtotal: number;
  descuento: number;
  total: number;
  notas: string | null;
  comprobante_url: string | null;
  created_at: string;
  updated_at: string;
  pagado_en: string | null;
  deleted_at: string | null;
}

export interface DetallePedido {
  id: string;
  id_pedido: string;
  id_producto: string;
  precio_unitario: number;
  notas: string | null;
  estado: EstadoPedido;
  created_at: string;
  updated_at: string;
  // Relaciones cargadas opcionalmente
  producto?: Producto;
  agregados?: DetallePedidoAgregado[];
}

export interface DetallePedidoAgregado {
  id: string;
  id_detalle_pedido: string;
  id_agregado: string;
  precio_momento: number;
  // Relación
  agregado?: Agregado;
}

export interface Promocion {
  id: string;
  id_restaurante: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  descuento_porcentaje: number | null;
  descuento_fijo: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  created_at: string;
}

export interface SuscripcionPlan {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_mensual: number;
  activo: boolean;
  created_at: string;
}

export interface SuscripcionModulo {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface SuscripcionPlanModulo {
  id_plan: string;
  id_modulo: string;
}

export interface RestauranteSuscripcion {
  id: string;
  id_restaurante: string;
  id_plan: string;
  estado: "activa" | "vencida" | "cancelada";
  fecha_inicio: string;
  fecha_fin_periodo: string | null;
  created_at: string;
  updated_at: string;
  plan?: SuscripcionPlan;
}

/* ═══════════════════════════════════════════════════════════
   Tipos auxiliares para la UI
   ═══════════════════════════════════════════════════════════ */

/** Producto con su categoría y agregados para el menú */
export interface ProductoConDetalles extends Producto {
  categoria?: Categoria;
  grupos_agregados?: (GrupoAgregados & { agregados: Agregado[] })[];
}

/** Item del carrito del cliente */
export interface ItemCarrito {
  id: string; // ID temporal del item en carrito
  producto: Producto;
  notas: string;
  agregados_seleccionados: Agregado[];
  precio_total: number; // precio producto + suma de agregados
  cantidad: number;
}

/** Pedido con todos sus detalles expandidos */
export interface PedidoCompleto extends Pedido {
  mesa?: Mesa;
  detalles?: (DetallePedido & {
    producto: Producto;
    agregados: (DetallePedidoAgregado & { agregado: Agregado })[];
  })[];
}

/** Supabase Database type placeholder */
export type Database = {
  public: {
    Tables: {
      restaurante: { Row: Restaurante; Insert: Partial<Restaurante>; Update: Partial<Restaurante> };
      categoria: { Row: Categoria; Insert: Partial<Categoria>; Update: Partial<Categoria> };
      producto: { Row: Producto; Insert: Partial<Producto>; Update: Partial<Producto> };
      grupo_agregados: { Row: GrupoAgregados; Insert: Partial<GrupoAgregados>; Update: Partial<GrupoAgregados> };
      producto_grupo: { Row: ProductoGrupo; Insert: Partial<ProductoGrupo>; Update: Partial<ProductoGrupo> };
      agregado: { Row: Agregado; Insert: Partial<Agregado>; Update: Partial<Agregado> };
      mesa: { Row: Mesa; Insert: Partial<Mesa>; Update: Partial<Mesa> };
      usuario: { Row: Usuario; Insert: Partial<Usuario>; Update: Partial<Usuario> };
      pedido: { Row: Pedido; Insert: Partial<Pedido>; Update: Partial<Pedido> };
      detalle_pedido: { Row: DetallePedido; Insert: Partial<DetallePedido>; Update: Partial<DetallePedido> };
      detalle_pedido_agregado: { Row: DetallePedidoAgregado; Insert: Partial<DetallePedidoAgregado>; Update: Partial<DetallePedidoAgregado> };
      promocion: { Row: Promocion; Insert: Partial<Promocion>; Update: Partial<Promocion> };
      suscripcion_plan: { Row: SuscripcionPlan; Insert: Partial<SuscripcionPlan>; Update: Partial<SuscripcionPlan> };
      suscripcion_modulo: { Row: SuscripcionModulo; Insert: Partial<SuscripcionModulo>; Update: Partial<SuscripcionModulo> };
      suscripcion_plan_modulo: { Row: SuscripcionPlanModulo; Insert: Partial<SuscripcionPlanModulo>; Update: Partial<SuscripcionPlanModulo> };
      restaurante_suscripcion: { Row: RestauranteSuscripcion; Insert: Partial<RestauranteSuscripcion>; Update: Partial<RestauranteSuscripcion> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_pedido: EstadoPedido;
      estado_pago: EstadoPago;
      metodo_pago: MetodoPago;
      rol_usuario: RolUsuario;
    };
  };
};
