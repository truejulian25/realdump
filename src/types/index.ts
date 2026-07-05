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
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
