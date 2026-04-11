-- ═══════════════════════════════════════════════════════════
-- EL MIJANO — Esquema de Base de Datos (Supabase / PostgreSQL)
-- Migración inicial — Multi-restaurante SaaS
-- ═══════════════════════════════════════════════════════════

-- ── Extensiones ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ──
CREATE TYPE estado_pedido AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE estado_pago AS ENUM ('PENDIENTE', 'PAGADO', 'ANULADO');
CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'YAPE', 'PLIN', 'TARJETA', 'OTRO');
CREATE TYPE rol_usuario AS ENUM ('admin', 'cocina', 'mesero', 'caja', 'cliente');

-- ═══════════════════════════════════════════════════════════
-- TABLA RAÍZ: restaurante
-- ═══════════════════════════════════════════════════════════
CREATE TABLE restaurante (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  logo_url TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  latitud DOUBLE PRECISION NOT NULL DEFAULT -8.1116,
  longitud DOUBLE PRECISION NOT NULL DEFAULT -79.0290,
  radio_permitido_metros INT NOT NULL DEFAULT 50,
  moneda VARCHAR(10) NOT NULL DEFAULT 'PEN',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- BLOQUE CATÁLOGO
-- ═══════════════════════════════════════════════════════════

CREATE TABLE categoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categoria_restaurante ON categoria(id_restaurante);

CREATE TABLE producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  id_categoria UUID NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  imagen_url TEXT,
  disponible BOOLEAN NOT NULL DEFAULT true,
  stock INT NOT NULL DEFAULT 0,
  es_bebida BOOLEAN NOT NULL DEFAULT false,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_producto_restaurante ON producto(id_restaurante);
CREATE INDEX idx_producto_categoria ON producto(id_categoria);
CREATE INDEX idx_producto_disponible ON producto(disponible) WHERE deleted_at IS NULL;

CREATE TABLE grupo_agregados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  min_seleccion INT NOT NULL DEFAULT 0,
  max_seleccion INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE producto_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_producto UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  id_grupo UUID NOT NULL REFERENCES grupo_agregados(id) ON DELETE CASCADE,
  UNIQUE(id_producto, id_grupo)
);

CREATE TABLE agregado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_grupo UUID NOT NULL REFERENCES grupo_agregados(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  disponible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agregado_grupo ON agregado(id_grupo);

-- ═══════════════════════════════════════════════════════════
-- BLOQUE OPERATIVO
-- ═══════════════════════════════════════════════════════════

CREATE TABLE mesa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
  capacidad INT NOT NULL DEFAULT 4,
  activa BOOLEAN NOT NULL DEFAULT true,
  qr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_restaurante, numero)
);

CREATE INDEX idx_mesa_restaurante ON mesa(id_restaurante);
CREATE INDEX idx_mesa_slug ON mesa(slug);

CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  email VARCHAR(255),
  nombre VARCHAR(150) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'cliente',
  avatar_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuario_restaurante ON usuario(id_restaurante);
CREATE INDEX idx_usuario_rol ON usuario(rol);

CREATE TABLE pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  id_mesa UUID NOT NULL REFERENCES mesa(id) ON DELETE RESTRICT,
  id_usuario UUID REFERENCES usuario(id) ON DELETE SET NULL,
  numero_pedido SERIAL,
  estado estado_pedido NOT NULL DEFAULT 'PENDIENTE',
  estado_pago estado_pago NOT NULL DEFAULT 'PENDIENTE',
  metodo_pago metodo_pago,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas TEXT,
  comprobante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pagado_en TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ -- Soft delete / auditoría
);

CREATE INDEX idx_pedido_restaurante ON pedido(id_restaurante);
CREATE INDEX idx_pedido_mesa ON pedido(id_mesa);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_estado_pago ON pedido(estado_pago);
CREATE INDEX idx_pedido_created ON pedido(created_at DESC);

-- Cada fila = 1 plato individual (sin campo cantidad)
CREATE TABLE detalle_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  id_producto UUID NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
  precio_unitario DECIMAL(10,2) NOT NULL, -- Precio congelado al momento del pedido
  notas TEXT,
  estado estado_pedido NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detalle_pedido ON detalle_pedido(id_pedido);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);

CREATE TABLE detalle_pedido_agregado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_detalle_pedido UUID NOT NULL REFERENCES detalle_pedido(id) ON DELETE CASCADE,
  id_agregado UUID NOT NULL REFERENCES agregado(id) ON DELETE RESTRICT,
  precio_momento DECIMAL(10,2) NOT NULL -- Precio congelado al momento del pedido
);

CREATE INDEX idx_detalle_agregado ON detalle_pedido_agregado(id_detalle_pedido);

-- ═══════════════════════════════════════════════════════════
-- PROMOCIONES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE promocion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_restaurante UUID NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  descuento_porcentaje DECIMAL(5,2) CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  descuento_fijo DECIMAL(10,2) CHECK (descuento_fijo >= 0),
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promocion_restaurante ON promocion(id_restaurante);
CREATE INDEX idx_promocion_activa ON promocion(activa, fecha_inicio, fecha_fin);

-- ═══════════════════════════════════════════════════════════
-- Triggers para updated_at automático
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_restaurante_updated_at BEFORE UPDATE ON restaurante
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_producto_updated_at BEFORE UPDATE ON producto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_usuario_updated_at BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_pedido_updated_at BEFORE UPDATE ON pedido
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_detalle_pedido_updated_at BEFORE UPDATE ON detalle_pedido
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Datos de prueba — Restaurante "El Mijano"
-- ═══════════════════════════════════════════════════════════

INSERT INTO restaurante (id, nombre, slug, latitud, longitud, radio_permitido_metros, direccion)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'El Mijano',
  'el-mijano',
  -8.1116,
  -79.0290,
  50,
  'Av. Antenor Orrego s/n, Trujillo, Perú'
);

-- Categorías
INSERT INTO categoria (id, id_restaurante, nombre, orden) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Entradas', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Platos Fuertes', 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Bebidas', 3),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Postres', 4);

-- Productos
INSERT INTO producto (id, id_restaurante, id_categoria, nombre, descripcion, precio, disponible, stock, es_bebida) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Ceviche Clásico', 'Pescado fresco marinado en limón con cebolla morada, ají y camote', 32.00, true, 15, false),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Causa Limeña', 'Papa amarilla prensada rellena de pollo con palta y mayonesa', 18.00, true, 12, false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Lomo Saltado', 'Trozos de lomo fino salteados con tomate, cebolla y papas fritas', 28.00, true, 20, false),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Ají de Gallina', 'Pollo deshilachado en crema de ají amarillo con arroz y papa', 25.00, true, 18, false),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Arroz con Mariscos', 'Arroz jugoso con langostinos, calamar, choros y conchas', 35.00, true, 10, false),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Chicha Morada', 'Bebida tradicional de maíz morado con frutas y especias', 8.00, true, 30, true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Pisco Sour', 'Cóctel clásico peruano con pisco, limón, clara de huevo y amargo', 18.00, true, 25, true),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Inca Kola', 'La bebida del Perú', 6.00, true, 50, true),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Suspiro Limeño', 'Postre de manjar blanco con merengue de oporto', 12.00, true, 8, false),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Picarones', 'Donas de camote y zapallo con miel de chancaca', 14.00, true, 10, false);

-- Mesas
INSERT INTO mesa (id, id_restaurante, numero, slug, capacidad) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 'mesa-a1b2c3d4', 4),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, 'mesa-e5f6a7b8', 2),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, 'mesa-c9d0e1f2', 6),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, 'mesa-a3b4c5d6', 4),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5, 'mesa-e7f8a9b0', 8);

-- Usuarios de prueba
INSERT INTO usuario (id, id_restaurante, nombre, rol, email) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Administrador', 'admin', 'admin@elmijano.pe'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Chef Carlos', 'cocina', 'cocina@elmijano.pe'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mesero Pedro', 'mesero', 'mesero@elmijano.pe'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Cajera María', 'caja', 'caja@elmijano.pe');

-- Grupo de agregados
INSERT INTO grupo_agregados (id, id_restaurante, nombre, min_seleccion, max_seleccion) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Extras de guarnición', 0, 3),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Modificaciones', 0, 2);

-- Agregados
INSERT INTO agregado (id_grupo, nombre, precio) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Extra arroz', 3.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra camote', 4.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra cancha', 3.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra palta', 3.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra mariscos', 8.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra miel', 2.00),
  ('f0000000-0000-0000-0000-000000000001', 'Extra huevo', 2.00),
  ('f0000000-0000-0000-0000-000000000002', 'Sin cebolla', 0.00),
  ('f0000000-0000-0000-0000-000000000002', 'Extra picante', 0.00),
  ('f0000000-0000-0000-0000-000000000002', 'Sin ají', 0.00);

-- Enlazar productos con grupos de agregados
INSERT INTO producto_grupo (id_producto, id_grupo) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001');

-- Promoción de ejemplo
INSERT INTO promocion (id_restaurante, titulo, descripcion, descuento_porcentaje, fecha_inicio, fecha_fin) VALUES
  ('a0000000-0000-0000-0000-000000000001', '¡2x1 en Pisco Sour!', 'Todos los viernes, lleva dos Pisco Sour por el precio de uno.', 50, '2026-04-01T00:00:00Z', '2026-06-30T23:59:59Z');

-- ═══════════════════════════════════════════════════════════
-- RLS (Row Level Security) para multi-tenant
-- ═══════════════════════════════════════════════════════════

ALTER TABLE restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_agregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE agregado ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido_agregado ENABLE ROW LEVEL SECURITY;
ALTER TABLE promocion ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (el menú es público)
CREATE POLICY "Lectura pública restaurante" ON restaurante FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública categoría" ON categoria FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública producto" ON producto FOR SELECT USING (disponible = true AND deleted_at IS NULL);
CREATE POLICY "Lectura pública agregado" ON agregado FOR SELECT USING (disponible = true);
CREATE POLICY "Lectura pública grupo_agregados" ON grupo_agregados FOR SELECT USING (true);
CREATE POLICY "Lectura pública producto_grupo" ON producto_grupo FOR SELECT USING (true);
CREATE POLICY "Lectura pública mesa" ON mesa FOR SELECT USING (activa = true);
CREATE POLICY "Lectura pública promocion" ON promocion FOR SELECT USING (activa = true AND fecha_inicio <= now() AND fecha_fin >= now());

-- Política INSERT para pedidos (cualquiera puede crear pedido desde el menú)
CREATE POLICY "Crear pedido público" ON pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "Crear detalle público" ON detalle_pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "Crear detalle agregado público" ON detalle_pedido_agregado FOR INSERT WITH CHECK (true);

-- Política SELECT para pedidos (solo tu pedido)
CREATE POLICY "Leer pedido propio" ON pedido FOR SELECT USING (true);
CREATE POLICY "Leer detalle propio" ON detalle_pedido FOR SELECT USING (true);
CREATE POLICY "Leer detalle agregado propio" ON detalle_pedido_agregado FOR SELECT USING (true);

-- Las políticas de UPDATE/DELETE las manejarán los roles del backend (service_role)

-- ══════════════════════════════════════════════════════════
-- Habilitar Realtime para las tablas operativas
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_pedido;
