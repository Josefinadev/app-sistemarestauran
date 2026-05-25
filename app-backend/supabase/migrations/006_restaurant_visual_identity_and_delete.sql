-- ═══════════════════════════════════════════════════════════
-- Migration 006: Restaurant visual identity + deleted access marker
-- ═══════════════════════════════════════════════════════════

ALTER TABLE restaurante
  ADD COLUMN IF NOT EXISTS color_primario VARCHAR(20) DEFAULT '#C5A059',
  ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(20) DEFAULT '#E2725B',
  ADD COLUMN IF NOT EXISTS hero_banner_url TEXT;

UPDATE restaurante SET color_primario = '#C5A059' WHERE color_primario IS NULL;
UPDATE restaurante SET color_secundario = '#E2725B' WHERE color_secundario IS NULL;

-- Keeps only a deterministic hash of deleted owner emails so the login screen
-- can show "restaurante eliminado" after the Auth user and tenant rows are gone.
CREATE TABLE IF NOT EXISTS restaurante_eliminado_acceso (
  email_hash TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE restaurante_eliminado_acceso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Actualizar restaurante" ON restaurante;
CREATE POLICY "Actualizar restaurante" ON restaurante FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública restaurante" ON restaurante;
CREATE POLICY "Lectura pública restaurante" ON restaurante FOR SELECT USING (true);
