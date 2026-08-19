"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useNotifications,
  useMarkNotificationsRead,
  type AppNotification,
} from "@/hooks/useNotifications";

const MESSAGE_KEY_BY_TYPE: Record<string, string> = {
  reportReviewed: "notifications.reportReviewed",
  reportDismissed: "notifications.reportDismissed",
  reportVideoDeleted: "notifications.reportVideoDeleted",
  reportAccountSuspended: "notifications.reportAccountSuspended",
  reportNeedsInfo: "notifications.reportNeedsInfo",
  videoRemoved: "notifications.videoRemoved",
  accountSuspended: "notifications.accountSuspended",
  videoTag: "notifications.videoTag",
  videoTagAccepted: "notifications.videoTagAccepted",
  videoTagRejected: "notifications.videoTagRejected",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [respondingTag, setRespondingTag] = useState<string | null>(null);
  const [respondedTags, setRespondedTags] = useState<Set<string>>(new Set());
  const [tagActionError, setTagActionError] = useState<string | null>(null);

  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  const handleMarkAllRead = () => {
    markRead();
  };

  const handleMarkOneRead = (n: AppNotification) => {
    if (!n.read_at) {
      markRead([n.id]);
    }
  };

  const handleSubmitReply = async (n: AppNotification) => {
    const reportId = String(n.data.reportId ?? "");
    const text = replyText.trim();
    if (!text || !reportId) return;

    setSending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setReplyError(err.error || t("notifications.replyError"));
        return;
      }
      setReplyText("");
      setReplyingTo(null);
      setSentFor(n.id);
      markRead([n.id]);
    } finally {
      setSending(false);
    }
  };

  const handleTagResponse = async (n: AppNotification, action: "approved" | "rejected") => {
    const videoTagId = String(n.data.videoTagId ?? "");
    if (!videoTagId) return;

    setRespondingTag(n.id);
    setTagActionError(null);
    try {
      const res = await fetch(`/api/video-tags/${videoTagId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setTagActionError(err.error || t("videoTags.tagResponseError"));
        return;
      }
      setRespondedTags((prev) => new Set(prev).add(n.id));
      markRead([n.id]);
    } finally {
      setRespondingTag(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg pt-14 pb-20">
        <div className="mx-auto w-full max-w-sm px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-zinc-200 animate-pulse" />
            <div className="h-5 w-32 rounded bg-zinc-200 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-zinc-200 animate-pulse" />
            <div className="h-16 rounded-xl bg-zinc-200 animate-pulse" />
            <div className="h-16 rounded-xl bg-zinc-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="text-zinc-500 transition-colors hover:text-zinc-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">{t("notifications.title")}</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="ml-auto rounded-lg border border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-zinc-200 p-4 text-zinc-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-sm text-zinc-600">{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const messageKey = MESSAGE_KEY_BY_TYPE[n.type];
              const message =
                messageKey && n.type === "videoRemoved"
                  ? t(messageKey, { title: String(n.data.title ?? "") })
                  : messageKey && n.type === "videoTag"
                    ? t(messageKey, {
                        tagger: String(n.data.tagger ?? ""),
                        title: String(n.data.videoTitle ?? ""),
                      })
                    : messageKey &&
                        (n.type === "videoTagAccepted" || n.type === "videoTagRejected")
                      ? t(messageKey, {
                          name: String(n.data.name ?? ""),
                          title: String(n.data.videoTitle ?? ""),
                        })
                      : messageKey && n.type === "reportReviewed"
                        ? t(messageKey, { note: String(n.data.note ?? "") })
                        : messageKey
                          ? t(messageKey)
                          : n.type;
              const unread = !n.read_at;
              const reportId = String(n.data.reportId ?? "");
              const canReply = n.type === "reportNeedsInfo" && !!reportId;
              const canRespondTag =
                n.type === "videoTag" && !!n.data.videoTagId && !respondedTags.has(n.id);

              return (
                <div
                  key={n.id}
                  className={`overflow-hidden rounded-xl border ${
                    unread
                      ? "border-zinc-700 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <button
                    onClick={() => handleMarkOneRead(n)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          unread ? "bg-blue-500" : "bg-zinc-700"
                        }`}
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${unread ? "text-white" : "text-zinc-300"}`}>
                          {message}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  </button>

                  {canRespondTag && (
                    <div className="border-t border-zinc-800 p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTagResponse(n, "approved")}
                          disabled={respondingTag === n.id}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                          {t("videoTags.approve")}
                        </button>
                        <button
                          onClick={() => handleTagResponse(n, "rejected")}
                          disabled={respondingTag === n.id}
                          className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                        >
                          {t("videoTags.reject")}
                        </button>
                      </div>
                      {tagActionError && (
                        <p className="mt-1 text-xs text-red-400">{tagActionError}</p>
                      )}
                    </div>
                  )}

                  {canReply && (
                    <div className="border-t border-zinc-800 p-3">
                      {sentFor === n.id ? (
                        <p className="text-xs text-emerald-400">{t("notifications.replySent")}</p>
                      ) : replyingTo === n.id ? (
                        <>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t("notifications.replyPlaceholder")}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleSubmitReply(n)}
                              disabled={sending || !replyText.trim()}
                              className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                              {t("notifications.replySubmit")}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                                setReplyError(null);
                              }}
                              className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
                            >
                              {t("adminReports.measureCancel")}
                            </button>
                          </div>
                          {replyError && (
                            <p className="mt-1 text-xs text-red-400">{replyError}</p>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyText("");
                            setReplyError(null);
                            setReplyingTo(n.id);
                          }}
                          className="w-full rounded-lg border border-blue-500/50 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10"
                        >
                          {t("notifications.reply")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
