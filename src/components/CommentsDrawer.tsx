"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Trash } from "@phosphor-icons/react";
import type { Comment } from "@/types";

interface CommentWithProfile extends Comment {
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  videoId: string;
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}M`;
  return `hace ${Math.floor(months / 12)}a`;
}

export default function CommentsDrawer({ videoId, open, onClose, onCountChange }: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setComments(data);
        onCountChange(data.length);
      }
      setLoading(false);
    };

    fetchComments();
  }, [open, videoId, supabase, onCountChange]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!user || !trimmed || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({ video_id: videoId, user_id: user.id, content: trimmed })
      .select("*, profiles(username, display_name, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [data, ...prev]);
      onCountChange(comments.length + 1);
      setContent("");
    }

    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(comments.length - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-zinc-900">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">
            Comentarios ({comments.length})
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">Cargando...</p>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No hay comentarios aún. ¡Sé el primero!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
                    <img
                      src={
                        comment.profiles?.avatar_url ??
                        `https://ui-avatars.com/api/?name=${comment.profiles?.username ?? comment.user_id}&background=6366f1&color=fff&size=32`
                      }
                      alt={comment.profiles?.username ?? "usuario"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        @{comment.profiles?.username ?? "usuario"}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {timeAgo(comment.created_at)}
                      </span>
                      {user && comment.user_id === user.id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="ml-auto text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-300 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
              <img
                src={`https://ui-avatars.com/api/?name=${user.email ?? "user"}&background=6366f1&color=fff&size=32`}
                alt="Tu avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Agrega un comentario..."
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-40 transition-colors"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
