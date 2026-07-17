import { useInfiniteQuery } from "@tanstack/react-query";
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

  return useInfiniteQuery<VideoWithProfile[]>({
    queryKey: ["videos", "feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("id")
        .is("deactivated_at", null)
        .is("deleted_at", null);

      const ids = (activeProfiles || []).map((p) => p.id);
      if (ids.length === 0) return [];

      const start = (pageParam as number) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("videos")
        .select("*, profiles(username, display_name, avatar_url)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .range(start, end);

      return (data as VideoWithProfile[]) || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

// ─── Profile videos ───

export function useProfileVideos(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useInfiniteQuery<Video[]>({
    queryKey: ["videos", "profile", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const start = (pageParam as number) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .range(start, end);

      return (data as Video[]) || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!userId,
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
