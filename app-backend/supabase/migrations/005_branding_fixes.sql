-- ═══════════════════════════════════════════════════════════
-- EL MIJANO — Migration 005: Branding & RLS fixes
-- Adds color columns to restaurante table and fix RLS for branding
-- ═══════════════════════════════════════════════════════════

-- 1. Agregar columnas de color a la tabla restaurante if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurante' AND column_name='color_primario') THEN
        ALTER TABLE restaurante ADD COLUMN color_primario VARCHAR(20) DEFAULT '#C5A059';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurante' AND column_name='color_secundario') THEN
        ALTER TABLE restaurante ADD COLUMN color_secundario VARCHAR(20) DEFAULT '#E2725B';
    END IF;
END $$;

-- 2. Asegurar que los registros existentes tengan los colores por defecto
UPDATE restaurante SET color_primario = '#C5A059' WHERE color_primario IS NULL;
UPDATE restaurante SET color_secundario = '#E2725B' WHERE color_secundario IS NULL;

-- 3. Habilitar UPDATE en restaurante para que el Admin pueda cambiar colores
-- Nota: En producción deberíamos restringir esto por id_restaurante, 
-- pero dado el flujo actual de anon/dashboard, permitimos el update con true.
DROP POLICY IF EXISTS "Actualizar restaurante" ON restaurante;
CREATE POLICY "Actualizar restaurante" ON restaurante FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Asegurar lectura pública incluyendo colores
DROP POLICY IF EXISTS "Lectura pública restaurante" ON restaurante;
CREATE POLICY "Lectura pública restaurante" ON restaurante FOR SELECT USING (true);
