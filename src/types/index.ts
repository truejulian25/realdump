export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  paypal_url: string | null;
  created_at: string;
  updated_at: string;
  role: string;
  is_admin: boolean;
  deactivated_at: string | null;
  deleted_at: string | null;
  verification_status: string | null;
  verified_at: string | null;
  verified_dob: string | null;
}

export type VerificationStatus = "draft" | "submitted" | "in_review" | "approved" | "denied";

export interface CreatorVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  document_type: string | null;
  declared_dob: string | null;
  verified_dob: string | null;
  document_url: string | null;
  selfie_url: string | null;
  holding_document_url: string | null;
  consent_biometric_at: string | null;
  consent_data_at: string | null;
  consent_ip: string | null;
  content_declaration_at: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationEvent {
  id: string;
  verification_id: string;
  event: string;
  metadata: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
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

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id: string | null;
  created_at: string;
}

export interface VideoView {
  id: string;
  video_id: string;
  viewer_id: string | null;
  created_at: string;
}
