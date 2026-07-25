-- Analytics tables: profile views, video views, follower history
-- User already executed this query in Supabase dashboard.
-- This file serves as documentation.

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views (profile_id);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views (video_id);

ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video owners can view their video views"
  ON video_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM videos WHERE videos.id = video_id AND videos.user_id = auth.uid()));