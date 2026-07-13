-- Add Mux video fields to the videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS mux_asset_id TEXT;
