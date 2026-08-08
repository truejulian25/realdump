"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVideoThumbnail } from "@/lib/video-thumbnail";
import type { Report } from "@/types";

type ReportStatus = Report["status"];

interface ReportRow extends Report {
  video: {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    mux_playback_id: string | null;
    user_id: string;
    profiles: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
      deactivated_at: string | null;
    } | null;
  } | null;
  reported: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    deactivated_at: string | null;
  } | null;
  reporter: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

type Filter = "all" | ReportStatus;

const FILTERS: Filter[] = ["all", "pending", "needs_info", "reviewed", "dismissed"];

function userLabel(
  u: { username: string | null; display_name: string | null } | null,
  fallback: string,
) {
  if (!u) return fallback;
  return u.display_name ?? u.username ?? fallback;
}

function ReportThumb({ video }: { video: NonNullable<ReportRow["video"]> }) {
  const { t } = useLanguage();
  const thumb = useVideoThumbnail(video);

  return (
    <Link
      href={`/user/${video.user_id}?video_id=${video.id}`}
      title={t("adminReports.openVideo")}
      prefetch={false}
      className="shrink-0"
    >
      {thumb ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={thumb}
          alt=""
          className="h-16 w-28 rounded-lg border border-zinc-800 object-cover transition-transform hover:scale-105 hover:border-blue-500"
        />
      ) : (
        <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition-colors hover:border-blue-500">
          <span className="text-[10px] text-zinc-600">
            {t("adminReports.noThumbnail")}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function AdminReportsPage() {
  const { profile, loading } = useAuth();
  const { t, locale } = useLanguage();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [measureFor, setMeasureFor] = useState<string | null>(null);
  const [measureNote, setMeasureNote] = useState("");

  const fetchReports = useCallback(async () => {
    const res = await fetch("/api/admin/reports");
    if (!res.ok) return;
    const data = (await res.json()) as ReportRow[];
    if (Array.isArray(data)) {
      setReports(data);
    }
  }, []);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchReports();
    }
  }, [profile?.is_admin, fetchReports]);

  const handleAction = async (
    report: ReportRow,
    action: "resolved" | "dismissed" | "needs_info" | "delete_video" | "deactivate_user",
    note?: string,
  ) => {
    if (action === "delete_video" && !window.confirm(t("adminReports.deleteVideoConfirm"))) return;
    if (action === "deactivate_user" && !window.confirm(t("adminReports.deactivateUserConfirm"))) return;
    if (action === "needs_info" && !window.confirm(t("adminReports.requestInfoConfirm"))) return;

    if (action === "resolved") {
      const cleanNote = note?.trim() ?? "";
      if (!cleanNote) {
        alert(t("adminReports.measureRequired"));
        return;
      }
      setMeasureFor(null);
      setMeasureNote("");
    }

    setProcessing(report.id);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note?.trim() ?? "" }),
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
    needs_info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
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
              const isProfileReport = !!report.reported_user_id && !report.video;
              const owner = isProfileReport ? report.reported : (report.video?.profiles ?? null);
              const ownerDeactivated = owner?.deactivated_at != null;
              const ownerName =
                owner?.display_name ?? owner?.username ?? t("admin.userFallback");
              return (
                <div
                  key={report.id}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
                >
                  <div className="flex items-start gap-3 p-4">
                    {isProfileReport ? (
                      <Link
                        href={`/user/${report.reported_user_id}`}
                        title={t("adminReports.openProfile")}
                        prefetch={false}
                        className="shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={owner?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName ?? "")}&background=6366f1&color=fff&size=96`}
                          alt=""
                          className="h-16 w-16 rounded-full border border-zinc-800 object-cover transition-transform hover:scale-105 hover:border-blue-500"
                        />
                      </Link>
                    ) : report.video ? (
                      <ReportThumb video={report.video} />
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
                          {isProfileReport
                            ? t("adminReports.profileReported") + " " + ownerName
                            : report.video?.title || t("adminReports.videoFallback")}
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
                      {isProfileReport && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          {t("adminReports.profileType")}
                        </p>
                      )}
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

                    {report.reporter_reply && (
                      <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                        <span className="text-[10px] uppercase text-blue-400">
                          {t("adminReports.reporterReply")}
                        </span>
                        <p className="mt-1 text-xs text-zinc-200 break-words">
                          {report.reporter_reply}
                        </p>
                      </div>
                    )}

                    {processing === report.id ? (
                      <p className="mt-4 text-sm text-blue-400">{t("adminReports.processing")}</p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setMeasureNote("");
                              setMeasureFor(measureFor === report.id ? null : report.id);
                            }}
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
                        <button
                          onClick={() => handleAction(report, "needs_info")}
                          disabled={report.status !== "pending"}
                          className="w-full rounded-lg border border-blue-500/50 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
                        >
                          {t("adminReports.requestInfo")}
                        </button>
                      </div>
                    )}

                    {measureFor === report.id && (
                      <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
                        <textarea
                          value={measureNote}
                          onChange={(e) => setMeasureNote(e.target.value)}
                          placeholder={t("adminReports.measurePlaceholder")}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleAction(report, "resolved", measureNote)}
                            disabled={processing === report.id}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {t("adminReports.measureConfirm")}
                          </button>
                          <button
                            onClick={() => {
                              setMeasureFor(null);
                              setMeasureNote("");
                            }}
                            className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
                          >
                            {t("adminReports.measureCancel")}
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
