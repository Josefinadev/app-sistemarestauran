/* ═══════════════════════════════════════════════════════════
   MODEL — Tipos de la capa de caja
   ═══════════════════════════════════════════════════════════ */

export interface PedidoCajaItem {
  nombre: string;
  precio: number;
  estado?: string;
}

export interface PedidoCaja {
  id: string;
  numeroPedido: string;
  mesa: number;
  items: PedidoCajaItem[];
  total: number;
  estadoPago: "PENDIENTE" | "PAGADO" | "ANULADO";
  estadoPedido?: string;
  metodoPago: string | null;
  hora: string;
  comprobanteUrl: string | null;
}
