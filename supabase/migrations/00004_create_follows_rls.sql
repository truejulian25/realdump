ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow themselves"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);
