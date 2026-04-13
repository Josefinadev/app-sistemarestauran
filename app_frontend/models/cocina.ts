/* ═══════════════════════════════════════════════════════════
   MODEL — Tipos de la capa de cocina
   ═══════════════════════════════════════════════════════════ */

export interface PlatoCocina {
  id: string;
  nombre: string;
  notas: string;
  estado: "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO";
  mesa: number;
  hora: string;
  agregados: string[];
  pedidoId: string;
}

export interface ConteoEstados {
  PENDIENTE: number;
  EN_PREPARACION: number;
  LISTO: number;
}
