-- Add index on videos.user_id for faster feed queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos (created_at DESC);
