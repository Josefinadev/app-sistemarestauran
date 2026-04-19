/* ═══════════════════════════════════════════════════════════
   MODEL — Tipos de la capa de mesero
   ═══════════════════════════════════════════════════════════ */

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
}

export interface AggregatedItem {
  key: string;
  nombre: string;
  cantidad: number;
  itemIds: string[];
  mesa: number;
  hora: string;
  estado: "LISTO" | "ENTREGADO" | "MIXED";
  esBebida: boolean;
  notas: string | null;
  imagen_url: string | null;
  agregados: string[];
  listosIds: string[];
}

export interface PedidoGroup {
  pedidoId: string;
  mesa: number;
  numeroPedido: number;
  horaPedido: string;
  items: ItemServir[];
  aggregated: AggregatedItem[];
  listosCount: number;
  entregadosCount: number;
}

export interface MesaEstado {
  numero: number;
  pedidoActivo: boolean;
  platosListos: number;
  totalPlatos: number;
}
