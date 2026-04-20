export interface PlatoCocina {
  id: string;
  nombre: string;
  cantidad: number;
  notas: string;
  estado: "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO";
  mesa: number;
  hora: string;
  agregados: string[];
  pedidoId: string;
  detalleIds: string[];
}

export interface PedidoRecienteCocina {
  id: string;
  numeroPedido: string;
  hora: string;
  cantidadPlatos: number;
  lineas: PlatoCocina[];
}

export interface MesaCocina {
  id: string;
  mesa: number;
  hora: string;
  cantidadPlatos: number;
  cantidadPedidos: number;
  pendientesCount: number;
  pedidosRecientes: PedidoRecienteCocina[];
  lineas: PlatoCocina[];
}

export interface ConteoEstados {
  PENDIENTE: number;
  EN_PREPARACION: number;
  LISTO: number;
}
