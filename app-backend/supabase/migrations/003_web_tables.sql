-- ═══════════════════════════════════════════════════════════
-- EL MIJANO — Migration 003: Web Management Tables
-- Tables for public website management (config, combos, ofertas)
-- NOTE: These tables may already exist if created via Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── CONFIGURACIÓN WEB ──
CREATE TABLE IF NOT EXISTS web_config (
  id_restaurante UUID PRIMARY KEY REFERENCES restaurante(id) ON DELETE CASCADE,
  whatsapp VARCHAR(20),
  telefono VARCHAR(20),
  direccion TEXT,
  horario_semana VARCHAR(100),
  horario_finde VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── COMBOS Y PAQUETES ──
CREATE TABLE IF NOT EXISTS web_combo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  precio_original DECIMAL(10,2),
  incluye TEXT[], -- Array de strings
  imagen_url TEXT,
  popular BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_combo_restaurante ON web_combo(id_restaurante);

-- ── OFERTAS / BANNERS ──
CREATE TABLE IF NOT EXISTS web_oferta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  descuento VARCHAR(50),
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_oferta_restaurante ON web_oferta(id_restaurante);

-- ═══════════════════════════════════════════════════════════
-- RLS Policies (run only if RLS is enabled on these tables)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE web_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_combo ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_oferta ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Lectura pública web_config" ON web_config FOR SELECT USING (true);
CREATE POLICY "Lectura pública web_combo" ON web_combo FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública web_oferta" ON web_oferta FOR SELECT USING (activo = true);

-- Full admin access (via service_role key or authenticated)
CREATE POLICY "Gestionar web_config" ON web_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar web_config" ON web_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Gestionar web_combo" ON web_combo FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar web_combo" ON web_combo FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Eliminar web_combo" ON web_combo FOR DELETE USING (true);
CREATE POLICY "Gestionar web_oferta" ON web_oferta FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar web_oferta" ON web_oferta FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Eliminar web_oferta" ON web_oferta FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- Enable Realtime for web tables
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE web_config;
ALTER PUBLICATION supabase_realtime ADD TABLE web_combo;
ALTER PUBLICATION supabase_realtime ADD TABLE web_oferta;

-- ═══════════════════════════════════════════════════════════
-- Seed Data (safe to re-run — uses ON CONFLICT for config)
-- ═══════════════════════════════════════════════════════════

-- Config inicial
INSERT INTO web_config (id_restaurante, whatsapp, telefono, direccion, horario_semana, horario_finde)
SELECT id, '51999888777', '+51 999 888 777', 'Av. Antenor Orrego s/n, Trujillo, Perú', '11:00 AM - 10:00 PM', '10:00 AM - 11:00 PM'
FROM restaurante WHERE slug = 'el-mijano' LIMIT 1
ON CONFLICT (id_restaurante) DO NOTHING;

-- Combos de ejemplo
INSERT INTO web_combo (id_restaurante, nombre, descripcion, precio, precio_original, incluye, popular) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Parrillada Familiar',
  'Banquete completo para compartir en familia. Ideal para 4 personas.',
  89.90, 120.00,
  ARRAY['Anticuchos de corazón', 'Lomo Saltado familiar', 'Arroz con Mariscos', '2 Chicha Morada (1L)', 'Postre del día'],
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Combo Criollo',
  'Lo mejor de la cocina peruana en un solo combo. Para 1 persona.',
  45.90, 58.00,
  ARRAY['Ceviche Clásico', 'Arroz con Mariscos', 'Chicha Morada'],
  false
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Noche Romántica',
  'Experiencia gastronómica premium para dos. Incluye decoración especial.',
  119.90, 150.00,
  ARRAY['2 Entradas a elegir', '2 Platos de fondo a elegir', '2 Pisco Sour', 'Suspiro Limeño para compartir'],
  true
);

-- Ofertas de ejemplo
INSERT INTO web_oferta (id_restaurante, titulo, descripcion, descuento) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  '2x1 en Pisco Sour',
  'Todos los viernes disfruta de 2 Pisco Sour por el precio de 1. ¡La mejor happy hour de Trujillo!',
  '2x1'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Happy Hour en Bebidas',
  'De lunes a jueves de 5pm a 7pm, todas las bebidas con 30% de descuento.',
  '30% OFF'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Postre Gratis',
  'En consumos mayores a S/80, te regalamos un Suspiro Limeño o Picarones. ¡Sin letra chica!',
  'GRATIS'
);
