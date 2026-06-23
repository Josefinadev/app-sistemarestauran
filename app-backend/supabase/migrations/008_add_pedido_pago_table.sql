-- Add pedido_pago table for mixed and partial payments
CREATE TABLE pedido_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  id_usuario UUID REFERENCES usuario(id) ON DELETE SET NULL,
  metodo_pago metodo_pago NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  efectivo_recibido DECIMAL(10,2),
  comprobante_url TEXT,
  detalle_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedido_pago ON pedido_pago(id_pedido);

CREATE TRIGGER tr_pedido_pago_updated_at
  BEFORE UPDATE ON pedido_pago
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE pedido_pago ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE pedido_pago;
