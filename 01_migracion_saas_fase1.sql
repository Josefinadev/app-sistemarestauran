-- ==============================================================================
-- FASE 1: MIGRACIÓN PARA ARQUITECTURA SAAS MULTI-TENANT
-- 
-- Instrucciones:
-- Copia y pega este código en el editor SQL de tu panel de Supabase y dale a "Run".
-- ==============================================================================

-- 1. Modificar tabla restaurante para añadir colores de personalización
ALTER TABLE public.restaurante 
ADD COLUMN IF NOT EXISTS color_primario VARCHAR(20) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(20) DEFAULT '#ffffff';

-- 2. Modificar el enum de roles (si no te deja hacerlo así, coméntalo e ingrésalo manual)
-- Agregamos los roles 'propietario' (dueño de un restaurante) y 'admin_saas' (el equipo creador).
ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'propietario';
ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'admin_saas';

-- 3. Modificar la tabla usuario para permitir administradores globales
-- (los administradores no pertenecen a un restaurante específico, por eso se permite NULL)
ALTER TABLE public.usuario ALTER COLUMN id_restaurante DROP NOT NULL;

-- 4. Crear la tabla de Planes Disponibles (suscripcion_plan)
CREATE TABLE IF NOT EXISTS public.suscripcion_plan (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  precio_mensual NUMERIC NOT NULL DEFAULT 0 CHECK (precio_mensual >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT suscripcion_plan_pkey PRIMARY KEY (id)
);

-- Insertamos los dos planes iniciales
INSERT INTO public.suscripcion_plan (nombre, descripcion, precio_mensual)
VALUES 
  ('Básico', 'Plan gratuito con funciones básicas de pedidos', 0),
  ('Marketing', 'Plan avanzado incluyendo análisis y promociones', 49.99);

-- 5. Crear la tabla de Módulos (suscripcion_modulo)
CREATE TABLE IF NOT EXISTS public.suscripcion_modulo (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT suscripcion_modulo_pkey PRIMARY KEY (id)
);

-- Insertamos los módulos base
INSERT INTO public.suscripcion_modulo (nombre, slug, descripcion)
VALUES 
  ('Gestión de Pedidos QR', 'gestion-pedidos', 'Permite recibir pedidos de mesas y QR'),
  ('Marketing Analítico', 'marketing-analitico', 'Acceso a tableros de análisis y métricas de ventas');

-- 6. Crear la relación entre Planes y Módulos (suscripcion_plan_modulo)
CREATE TABLE IF NOT EXISTS public.suscripcion_plan_modulo (
  id_plan uuid NOT NULL,
  id_modulo uuid NOT NULL,
  CONSTRAINT suscripcion_plan_modulo_pkey PRIMARY KEY (id_plan, id_modulo),
  CONSTRAINT fk_spm_plan FOREIGN KEY (id_plan) REFERENCES public.suscripcion_plan(id) ON DELETE CASCADE,
  CONSTRAINT fk_spm_modulo FOREIGN KEY (id_modulo) REFERENCES public.suscripcion_modulo(id) ON DELETE CASCADE
);

-- Asignamos módulos a los planes
-- Al plan Básico le damos 'gestion-pedidos'
INSERT INTO public.suscripcion_plan_modulo (id_plan, id_modulo)
SELECT p.id, m.id 
FROM public.suscripcion_plan p, public.suscripcion_modulo m
WHERE p.nombre = 'Básico' AND m.slug = 'gestion-pedidos';

-- Al plan Marketing le damos 'gestion-pedidos' Y 'marketing-analitico'
INSERT INTO public.suscripcion_plan_modulo (id_plan, id_modulo)
SELECT p.id, m.id 
FROM public.suscripcion_plan p, public.suscripcion_modulo m
WHERE p.nombre = 'Marketing' AND (m.slug = 'gestion-pedidos' OR m.slug = 'marketing-analitico');


-- 7. Crear la tabla de estado de suscripción de cada restaurante (restaurante_suscripcion)
CREATE TABLE IF NOT EXISTS public.restaurante_suscripcion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL UNIQUE, -- 1-a-1 por restaurante para saber su plan activo actual
  id_plan uuid NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'cancelada')),
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_fin_periodo TIMESTAMP WITH TIME ZONE, -- puede ser null si es un plan gratuito de por vida
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT restaurante_suscripcion_pkey PRIMARY KEY (id),
  CONSTRAINT fk_rs_restaurante FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_plan FOREIGN KEY (id_plan) REFERENCES public.suscripcion_plan(id)
);

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
