-- Reportes de perfil: video opcional + target de perfil
ALTER TABLE reports ALTER COLUMN video_id DROP NOT NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES profiles(id);
ALTER TABLE reports ADD CONSTRAINT reports_target_check
  CHECK (video_id IS NOT NULL OR reported_user_id IS NOT NULL);