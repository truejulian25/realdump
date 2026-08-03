-- RLS: los administradores pueden ver todos los reportes
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (public.is_admin());

-- RLS: los administradores pueden actualizar el estado de los reportes
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
