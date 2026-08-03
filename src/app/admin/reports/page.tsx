"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { Report } from "@/types";

type ReportStatus = Report["status"];

interface ReportRow extends Report {
  video: {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    mux_playback_id: string | null;
    user_id: string;
    profiles: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
      deactivated_at: string | null;
    } | null;
  } | null;
  reporter: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

type Filter = "all" | ReportStatus;

const FILTERS: Filter[] = ["all", "pending", "reviewed", "dismissed"];

function userLabel(
  u: { username: string | null; display_name: string | null } | null,
  fallback: string,
) {
  if (!u) return fallback;
  return u.display_name ?? u.username ?? fallback;
}

function thumbSrc(video: ReportRow["video"]) {
  if (!video) return null;
  if (video.mux_playback_id) {
    return `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=200`;
  }
  return video.thumbnail_url;
}

export default function AdminReportsPage() {
  const { profile, loading } = useAuth();
  const { t, locale } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select(`
        *,
        video:videos(id, title, thumbnail_url, mux_playback_id, user_id, profiles(username, display_name, avatar_url, deactivated_at)),
        reporter:profiles!reports_reporter_id_fkey(username, display_name, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data as ReportRow[]);
    }
  }, [supabase]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchReports();
    }
  }, [profile?.is_admin, fetchReports]);

  const handleAction = async (
    report: ReportRow,
    action: "resolved" | "dismissed" | "delete_video" | "deactivate_user",
  ) => {
    if (action === "delete_video" && !window.confirm(t("adminReports.deleteVideoConfirm"))) return;
    if (action === "deactivate_user" && !window.confirm(t("adminReports.deactivateUserConfirm"))) return;

    setProcessing(report.id);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t("adminReports.processError"));
        return;
      }
      await fetchReports();
    } finally {
      setProcessing(null);
    }
  };

  const visible = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-500">{t("admin.noAccess")}</p>
      </div>
    );
  }

  const statusBadge: Record<ReportStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    reviewed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dismissed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };

  return (
    <div className="min-h-screen bg-black pt-14 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-lg font-bold text-white mb-6">{t("adminReports.title")}</h1>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {t(`adminReports.filter${f[0].toUpperCase()}${f.slice(1)}`)}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("adminReports.noPending")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((report) => {
              const owner = report.video?.profiles ?? null;
              const thumb = thumbSrc(report.video);
              const ownerDeactivated = owner?.deactivated_at != null;
              return (
                <div
                  key={report.id}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
                >
                  <div className="flex items-start gap-3 p-4">
                    {thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumb}
                        alt=""
                        className="h-16 w-28 shrink-0 rounded-lg border border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                        <span className="text-[10px] text-zinc-600">
                          {t("adminReports.videoDeleted")}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {report.video?.title || t("adminReports.videoFallback")}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge[report.status]}`}
                        >
                          {t(`adminReports.status${report.status[0].toUpperCase()}${report.status.slice(1)}`)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("adminReports.ownerLabel")}{" "}
                        <span className="text-zinc-300">
                          @{owner?.username ?? t("admin.userFallback")}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                        {t("adminReports.reporterLabel")}
                        {report.reporter?.avatar_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={report.reporter.avatar_url}
                            alt=""
                            className="h-4 w-4 rounded-full object-cover"
                          />
                        )}
                        <span className="truncate text-zinc-300">
                          {userLabel(report.reporter, t("admin.userFallback"))}
                        </span>
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {new Date(report.created_at).toLocaleString(locale)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 p-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex gap-3">
                        <span className="shrink-0 text-zinc-500">{t("adminReports.reasonLabel")}</span>
                        <span className="text-zinc-200">{report.reason}</span>
                      </div>
                      {report.description && (
                        <div className="flex gap-3">
                          <span className="shrink-0 text-zinc-500">
                            {t("adminReports.descriptionLabel")}
                          </span>
                          <span className="text-zinc-300 break-words">{report.description}</span>
                        </div>
                      )}
                    </div>

                    {processing === report.id ? (
                      <p className="mt-4 text-sm text-blue-400">{t("adminReports.processing")}</p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(report, "resolved")}
                            disabled={report.status === "reviewed"}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {t("adminReports.resolve")}
                          </button>
                          <button
                            onClick={() => handleAction(report, "dismissed")}
                            disabled={report.status === "dismissed"}
                            className="flex-1 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
                          >
                            {t("adminReports.dismiss")}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(report, "delete_video")}
                            disabled={!report.video}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {t("adminReports.deleteVideo")}
                          </button>
                          <button
                            onClick={() => handleAction(report, "deactivate_user")}
                            disabled={ownerDeactivated}
                            className="flex-1 rounded-lg border border-red-600/50 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-600/10 disabled:opacity-50"
                          >
                            {t("adminReports.deactivateUser")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
