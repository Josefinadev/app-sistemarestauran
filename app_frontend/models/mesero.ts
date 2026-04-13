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
}

export interface MesaEstado {
  numero: number;
  pedidoActivo: boolean;
  platosListos: number;
  totalPlatos: number;
}
