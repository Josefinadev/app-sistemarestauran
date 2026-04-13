-- ═══════════════════════════════════════════════════════════
-- MIGRACIÓN 004 — Integración con Supabase Auth
-- Vincula la tabla usuario con auth.users de Supabase
-- ═══════════════════════════════════════════════════════════

-- Añadir columna auth_id que vincula usuario local → auth.users
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Índice para búsquedas rápidas por auth_id
CREATE INDEX IF NOT EXISTS idx_usuario_auth_id ON usuario(auth_id);

-- Política: los usuarios autenticados pueden leer su propio registro
CREATE POLICY "Usuario puede leer su propio perfil" ON usuario
  FOR SELECT USING (auth_id = auth.uid());

-- Política: permitir lectura de usuarios para el backend (service_role bypass RLS)
-- El backend usa service_role, así que las políticas no le afectan

-- ═══════════════════════════════════════════════════════════
-- NOTA: Ejecutar esta migración en Supabase SQL Editor
-- Luego crear los usuarios con el endpoint POST /api/auth/crear-usuario
-- ═══════════════════════════════════════════════════════════
