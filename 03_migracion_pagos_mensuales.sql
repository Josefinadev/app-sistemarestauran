-- ==============================================================================
-- MIGRACIÓN: SISTEMA DE PAGOS MENSUALES CON MERCADO PAGO
-- 
-- Instrucciones:
-- Copia y pega este código en el editor SQL de tu panel de Supabase y dale a "Run".
-- ==============================================================================

-- 1. Crear la tabla de pagos mensuales
CREATE TABLE IF NOT EXISTS public.pago_mensualidad (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  mes_anio VARCHAR(7) NOT NULL,           -- Formato "YYYY-MM" (ej: "2026-07")
  monto NUMERIC NOT NULL DEFAULT 60,
  estado VARCHAR NOT NULL DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente', 'pagado', 'fallido')),
  preference_id VARCHAR,                   -- ID de preferencia de MercadoPago
  payment_id VARCHAR,                      -- ID del pago confirmado de MercadoPago
  pagado_en TIMESTAMP WITH TIME ZONE,      -- Fecha/hora cuando se confirmó el pago
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT pago_mensualidad_pkey PRIMARY KEY (id),
  CONSTRAINT fk_pm_restaurante FOREIGN KEY (id_restaurante) 
    REFERENCES public.restaurante(id) ON DELETE CASCADE,
  CONSTRAINT unique_restaurante_mes UNIQUE (id_restaurante, mes_anio)
);

-- 2. Crear índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_pago_mensualidad_restaurante 
  ON public.pago_mensualidad(id_restaurante);
  
CREATE INDEX IF NOT EXISTS idx_pago_mensualidad_estado 
  ON public.pago_mensualidad(estado);
  
CREATE INDEX IF NOT EXISTS idx_pago_mensualidad_mes 
  ON public.pago_mensualidad(mes_anio);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.pago_mensualidad ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad

-- Política: El propietario/admin puede ver sus propios pagos
CREATE POLICY "Usuario puede ver pagos de su restaurante"
  ON public.pago_mensualidad FOR SELECT
  USING (
    id_restaurante IN (
      SELECT id_restaurante FROM public.usuario 
      WHERE auth_id = auth.uid()
    )
  );

-- Política: Solo el backend (service role) puede insertar/actualizar
CREATE POLICY "Service role puede gestionar pagos"
  ON public.pago_mensualidad FOR ALL
  USING (auth.role() = 'service_role');

-- Política: Admin SaaS puede ver todos los pagos
CREATE POLICY "Admin SaaS puede ver todos los pagos"
  ON public.pago_mensualidad FOR SELECT
  USING (public.es_admin_saas());

-- ==============================================================================
-- COMENTARIOS SOBRE EL MODELO
-- ==============================================================================
-- 
-- FLUJO DE REGISTRO:
-- 1. Usuario llena formulario en landing page
-- 2. Frontend llama a POST /api/pagos/crear-preferencia con es_registro=true
-- 3. Backend crea preferencia en MercadoPago y devuelve init_point
-- 4. Usuario paga en MercadoPago
-- 5. Webhook recibe confirmación y CREA el restaurante + primer pago
--
-- FLUJO DE MENSUALIDAD:
-- 1. Dashboard detecta que hay meses sin pagar
-- 2. Usuario hace clic en "Pagar"
-- 3. Frontend llama a POST /api/pagos/crear-preferencia con meses_a_pagar
-- 4. Usuario paga en MercadoPago
-- 5. Webhook registra los meses como pagados
--
-- VERIFICACIÓN DE ACCESO:
-- - Si el restaurante tiene pagado el mes actual → acceso completo
-- - Si no tiene pagado → panel en gris, solo puede pagar
-- - La web pública del restaurante también se bloquea si no ha pagado
--
-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
