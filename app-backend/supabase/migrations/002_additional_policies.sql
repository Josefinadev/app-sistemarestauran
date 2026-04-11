-- ═══════════════════════════════════════════════════════════
-- EL MIJANO — Migration 002: Additional RLS policies & fixes
-- Allows anon key to perform UPDATE operations needed by dashboards
-- ═══════════════════════════════════════════════════════════

-- Allow UPDATE on pedido (for estado changes by cocina/caja)
CREATE POLICY "Actualizar pedido" ON pedido FOR UPDATE USING (true) WITH CHECK (true);

-- Allow UPDATE on detalle_pedido (for estado changes by cocina)
CREATE POLICY "Actualizar detalle" ON detalle_pedido FOR UPDATE USING (true) WITH CHECK (true);

-- Allow full access to usuario for dashboard reads
CREATE POLICY "Leer usuarios" ON usuario FOR SELECT USING (true);

-- Allow UPDATE on producto (for admin edits)
CREATE POLICY "Actualizar producto" ON producto FOR UPDATE USING (true) WITH CHECK (true);

-- Allow INSERT on producto (for admin creates)
CREATE POLICY "Crear producto" ON producto FOR INSERT WITH CHECK (true);

-- Allow UPDATE on categoria (for admin edits)
CREATE POLICY "Actualizar categoria" ON categoria FOR UPDATE USING (true) WITH CHECK (true);

-- Allow INSERT on categoria (for admin creates)
CREATE POLICY "Crear categoria" ON categoria FOR INSERT WITH CHECK (true);

-- Allow full CRUD on mesa (for admin)
CREATE POLICY "Crear mesa" ON mesa FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar mesa" ON mesa FOR UPDATE USING (true) WITH CHECK (true);

-- Allow INSERT on usuario (for admin)
CREATE POLICY "Crear usuario" ON usuario FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar usuario" ON usuario FOR UPDATE USING (true) WITH CHECK (true);

-- Allow reading producto with deleted_at (for admin)
CREATE POLICY "Admin lectura producto" ON producto FOR SELECT USING (true);

-- Allow full access to grupo_agregados for management
CREATE POLICY "Gestionar grupo_agregados" ON grupo_agregados FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar grupo_agregados" ON grupo_agregados FOR UPDATE USING (true) WITH CHECK (true);

-- Allow full access to agregado for management
CREATE POLICY "Gestionar agregado" ON agregado FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar agregado" ON agregado FOR UPDATE USING (true) WITH CHECK (true);

-- Allow full access to producto_grupo for management
CREATE POLICY "Gestionar producto_grupo" ON producto_grupo FOR INSERT WITH CHECK (true);

-- Allow INSERT and UPDATE on promocion
CREATE POLICY "Gestionar promocion insert" ON promocion FOR INSERT WITH CHECK (true);
CREATE POLICY "Gestionar promocion update" ON promocion FOR UPDATE USING (true) WITH CHECK (true);

-- Also enable realtime for mesa (useful for admin QR tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE mesa;
