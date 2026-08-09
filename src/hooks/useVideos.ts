import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/types";

const PAGE_SIZE = 10;

interface VideoWithProfile extends Video {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SavedVideoWithVideo {
  id: string;
  video_id: string;
  created_at: string;
  videos: Video | null;
}

// ─── Feed (home page) ───

export function useVideoFeed() {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<VideoWithProfile[]>({
    queryKey: ["videos", "feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, profiles!inner(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useVideoFeed] videos error:", error);
        return [];
      }

      return (data as VideoWithProfile[]) || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

// ─── Profile videos ───

export function useProfileVideos(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<Video[]>({
    queryKey: ["videos", "profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      return (data as Video[]) || [];
    },
    enabled: !!userId,
  });
}

// ─── Tagged videos (approved collaborations) ───

export function useTaggedVideos(profileId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<Video[]>({
    queryKey: ["videos", "tagged", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("video_tags")
        .select("videos(*)")
        .eq("user_id", profileId!)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (!data) return [];

      const seen = new Set<string>();
      const result: Video[] = [];
      for (const row of data as unknown as { videos: Video | null }[]) {
        if (!row.videos || seen.has(row.videos.id)) continue;
        seen.add(row.videos.id);
        result.push(row.videos);
      }
      return result;
    },
    enabled: !!profileId,
  });
}

// ─── Saved videos ───

export function useSavedVideos(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useInfiniteQuery<SavedVideoWithVideo[]>({
    queryKey: ["videos", "saved", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const start = (pageParam as number) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("saved_videos")
        .select("*, videos(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .range(start, end);

      return (data as SavedVideoWithVideo[]) || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}

// ─── Publicaciones (other user's videos) ───

export function usePublicacionesVideos(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useInfiniteQuery<VideoWithProfile[]>({
    queryKey: ["videos", "publicaciones", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const start = (pageParam as number) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("videos")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .range(start, end);

      return (data as VideoWithProfile[]) || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}
