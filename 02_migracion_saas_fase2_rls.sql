-- ==============================================================================
-- FASE 2: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- 
-- Instrucciones:
-- 1. Ve al panel SQL de Supabase y ejecuta este código.
-- 2. Esto protegerá las nuevas tablas para que los clientes no puedan
--    modificar tus planes, pero sí puedan verlos. Solo el 'admin_saas'
--    tendrá permisos completos.
-- ==============================================================================

-- 1. Funciones auxiliares para verificar roles (se corren con permisos altos)
CREATE OR REPLACE FUNCTION public.es_admin_saas()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario
    WHERE auth_id = auth.uid() AND rol = 'admin_saas'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.es_propietario_restaurante(restaurante_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario
    WHERE auth_id = auth.uid() 
      AND rol = 'propietario'
      AND id_restaurante = restaurante_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilitar RLS en las nuevas tablas
ALTER TABLE public.suscripcion_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripcion_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripcion_plan_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurante_suscripcion ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para suscripcion_plan (Todos ven, Admin edita)
CREATE POLICY "Planes visibles para todos" 
  ON public.suscripcion_plan FOR SELECT USING (true);

CREATE POLICY "Solo admin modifica planes" 
  ON public.suscripcion_plan FOR ALL USING (public.es_admin_saas());

-- 4. Políticas para suscripcion_modulo (Todos ven, Admin edita)
CREATE POLICY "Módulos visibles para todos" 
  ON public.suscripcion_modulo FOR SELECT USING (true);

CREATE POLICY "Solo admin modifica módulos" 
  ON public.suscripcion_modulo FOR ALL USING (public.es_admin_saas());

-- 5. Políticas para suscripcion_plan_modulo (Todos ven, Admin edita)
CREATE POLICY "Relación plan-modulo visible para todos" 
  ON public.suscripcion_plan_modulo FOR SELECT USING (true);

CREATE POLICY "Solo admin modifica relación plan-módulo" 
  ON public.suscripcion_plan_modulo FOR ALL USING (public.es_admin_saas());

-- 6. Políticas para restaurante_suscripcion 
-- (El dueño ve la suya, el Admin_saas ve y modifica todas)
CREATE POLICY "Dueño ve su suscripción" 
  ON public.restaurante_suscripcion FOR SELECT 
  USING (public.es_propietario_restaurante(id_restaurante) OR public.es_admin_saas());

CREATE POLICY "Solo admin saas asigna y modifica planes globalmente" 
  ON public.restaurante_suscripcion FOR ALL 
  USING (public.es_admin_saas());

-- (Opcional por ahora) Si queremos que el dueño contrate un plan directamente insertando, 
-- agregamos una política de INSERT, pero por ahora asumimos que lo manejarás
-- vía tu panel de admin o una función de base de datos específica luego.
CREATE POLICY "Dueño puede insertar su propia suscripcion" 
  ON public.restaurante_suscripcion FOR INSERT 
  WITH CHECK (public.es_propietario_restaurante(id_restaurante));

CREATE POLICY "Dueño puede actualizar su propia suscripcion" 
  ON public.restaurante_suscripcion FOR UPDATE 
  USING (public.es_propietario_restaurante(id_restaurante));

-- ==============================================================================
-- FIN DEL SCRIPT FASE 2
-- ==============================================================================
