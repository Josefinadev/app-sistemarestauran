export interface ItemServir {
  id: string;
  nombre: string;
  cantidad: number;
  mesa: number;
  hora: string;
  estado: "LISTO" | "ENTREGADO";
  esBebida: boolean;
  pedidoId: string;
  detalleIds: string[];
}

export interface PedidoMesero {
  id: string;
  numeroPedido: string;
  hora: string;
  items: ItemServir[];
}

export interface MesaEstado {
  numero: number;
  pedidoActivo: boolean;
  platosListos: number;
  bebidasListas: number;
  totalPlatos: number;
  totalBebidas: number;
  pedidos: PedidoMesero[];
}
