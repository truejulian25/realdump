-- Video tags / collaborations with approval flow
-- A video owner can tag creator accounts as collaborators; the tagged creator
-- must approve the tag before it appears on their "Etiquetados" section.

CREATE TABLE IF NOT EXISTS video_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT video_tags_video_user_unique UNIQUE (video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_video_tags_user_status ON video_tags (user_id, status);
CREATE INDEX IF NOT EXISTS idx_video_tags_video ON video_tags (video_id);

ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;

-- Idempotent re-run: drop existing policies before recreating them.
DROP POLICY IF EXISTS "Video tags are publicly readable" ON video_tags;
DROP POLICY IF EXISTS "Video owners can tag collaborators" ON video_tags;
DROP POLICY IF EXISTS "Tagged users can respond to their tag" ON video_tags;
DROP POLICY IF EXISTS "Video owners can remove tags" ON video_tags;

-- Public read: tagged sections are public like videos.
CREATE POLICY "Video tags are publicly readable"
  ON video_tags FOR SELECT
  USING (true);

-- Only the video owner can tag collaborators on their own videos.
CREATE POLICY "Video owners can tag collaborators"
  ON video_tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.user_id = auth.uid())
  );

-- The tagged user can respond (approve/reject) their own pending tag.
CREATE POLICY "Tagged users can respond to their tag"
  ON video_tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The video owner can remove tags (e.g. when editing the collaborator list).
CREATE POLICY "Video owners can remove tags"
  ON video_tags FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.user_id = auth.uid())
  );