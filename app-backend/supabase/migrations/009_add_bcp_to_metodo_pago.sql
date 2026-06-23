-- Add BCP value to metodo_pago enum
ALTER TYPE metodo_pago ADD VALUE IF NOT EXISTS 'BCP';
