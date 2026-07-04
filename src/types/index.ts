export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: number;
  created_at: string;
}
