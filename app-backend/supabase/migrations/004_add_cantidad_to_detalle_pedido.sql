-- Add cantidad to detalle_pedido
ALTER TABLE detalle_pedido ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;

-- Update existing records to have cantidad 1
UPDATE detalle_pedido SET cantidad = 1 WHERE cantidad IS NULL;