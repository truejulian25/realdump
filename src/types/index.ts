export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  role: string;
  is_admin: boolean;
}

export interface RoleRequest {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  created_at: string;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface SavedVideo {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  video_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
}
