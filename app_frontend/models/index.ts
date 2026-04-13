/* ═══════════════════════════════════════════════════════════
   MODELS — Barrel export
   Re-exporta todos los modelos + los tipos de database.types
   ═══════════════════════════════════════════════════════════ */

export * from "./cocina";
export * from "./mesero";
export * from "./caja";
export type {
  Restaurante,
  Categoria,
  Producto,
  Mesa,
  Pedido,
  DetallePedido,
  Agregado,
  GrupoAgregados,
  ProductoGrupo,
  DetallePedidoAgregado,
  Usuario,
  Promocion,
  ProductoConDetalles,
  ItemCarrito,
  PedidoCompleto,
  EstadoPedido,
  EstadoPago,
  MetodoPago,
  RolUsuario,
} from "@/lib/database.types";
