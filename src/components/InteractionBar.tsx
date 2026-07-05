"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import CommentsDrawer from "./CommentsDrawer";

interface Props {
  videoId: string;
}

export default function InteractionBar({ videoId }: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [countResult] = await Promise.all([
        supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId),
      ]);

      setCommentCount(countResult.count ?? 0);

      if (!user) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);
        setLikeCount(count ?? 0);
        setLoading(false);
        return;
      }

      const [likeResponse, likeCountResponse] = await Promise.all([
        supabase
          .from("likes")
          .select("id")
          .eq("video_id", videoId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId),
      ]);

      setLiked(!!likeResponse.data);
      setLikeCount(likeCountResponse.count ?? 0);
      setLoading(false);
    };

    fetchData();
  }, [videoId, user, supabase]);

  const handleLike = async () => {
    if (!user || loading) return;

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);

      if (!error) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ video_id: videoId, user_id: user.id });

      if (!error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  return (
    <>
      <div className="flex items-center px-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-sm transition-colors"
          >
            {liked ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span className={liked ? "text-red-400" : "text-zinc-400"}>
              {likeCount}
            </span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-zinc-400">{commentCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="text-zinc-400 transition-colors hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          <button
            onClick={() => setSaved((s) => !s)}
            className="text-zinc-400 transition-colors hover:text-white"
          >
            {saved ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <CommentsDrawer
        videoId={videoId}
        open={showComments}
        onClose={() => setShowComments(false)}
        onCountChange={handleCommentCountChange}
      />
    </>
  );
}
