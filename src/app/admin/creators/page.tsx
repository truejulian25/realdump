"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { CreatorVerification, Profile, VerificationEvent } from "@/types";

interface RequestRow extends CreatorVerification {
  profile: Profile | null;
}

function documentTypeLabel(t: <T = string>(key: string, params?: Record<string, string>) => T, value: string): string {
  const key =
    value === "id_card"
      ? "idCard"
      : value === "passport"
        ? "passport"
        : value === "driver_license"
          ? "driverLicense"
          : value;
  return t(`verificacion.documentTypes.${key}`);
}

export default function AdminCreatorsPage() {
  const { profile, loading } = useAuth();
  const { t, locale } = useLanguage();
  const checklist = t<string[]>("admin.checklist");
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, { photos?: { document?: string | null; selfie?: string | null; holding?: string | null }; events: VerificationEvent[] }>>({});
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [verifiedDobs, setVerifiedDobs] = useState<Record<string, string>>({});
  const [denialReasons, setDenialReasons] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; kind: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from("creator_verifications")
      .select("*, profile:profiles!creator_verifications_user_id_fkey(*)")
      .in("status", ["submitted", "in_review"])
      .order("submitted_at", { ascending: true });

    if (data) {
      const rows = data as RequestRow[];
      setRequests(rows);
      const nextChecks: Record<string, boolean[]> = {};
      const nextDobs: Record<string, string> = {};
      for (const r of rows) {
        nextChecks[r.id] = new Array(checklist.length).fill(false);
        nextDobs[r.id] = r.declared_dob ?? "";
      }
      setChecks(nextChecks);
      setVerifiedDobs(nextDobs);
    }
  }, [supabase]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchRequests();
    }
  }, [profile?.is_admin, fetchRequests]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const { data: events } = await supabase
      .from("verification_events")
      .select("*")
      .eq("verification_id", id)
      .order("created_at", { ascending: true });

    const res = await fetch("/api/admin/verifications/signed-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const urls = res.ok ? await res.json() : {};

    setDetail((prev) => ({
      ...prev,
      [id]: { photos: urls, events: events ?? [] },
    }));
  };

  const toggleCheck = (id: string, index: number) => {
    setChecks((prev) => {
      const list = prev[id] ?? [];
      const next = [...list];
      next[index] = !next[index];
      return { ...prev, [id]: next };
    });
  };

  const handleDecision = async (row: RequestRow, action: "approved" | "denied") => {
    setProcessing(row.id);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "approved") {
        payload.verifiedDob = verifiedDobs[row.id] || row.declared_dob || null;
      } else {
        payload.denialReason = denialReasons[row.id]?.trim();
        if (!payload.denialReason) {
          alert(t("admin.denialRequiredAlert"));
          return;
        }
      }
      const res = await fetch(`/api/admin/verifications/${row.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t("admin.processError"));
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== row.id));
      setExpandedId(null);
    } finally {
      setProcessing(null);
    }
  };

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

  return (
    <div className="min-h-screen bg-black pt-14 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-lg font-bold text-white mb-6">{t("admin.title")}</h1>

        {requests.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("admin.noPending")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
              >
                <button
                  onClick={() => toggleExpand(req.id)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-zinc-900"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {req.profile?.display_name ?? req.profile?.username ?? t("admin.userFallback")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      @{req.profile?.username ?? "—"} &middot;{" "}
                      {req.submitted_at
                        ? new Date(req.submitted_at).toLocaleDateString(locale)
                        : new Date(req.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {expandedId === req.id ? "▴" : "▾"}
                  </span>
                </button>

                {expandedId === req.id && (
                  <div className="border-t border-zinc-800 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(["document", "selfie", "holding"] as const).map((kind) => {
                        const url = detail[req.id]?.photos?.[kind];
                        return (
                          <div key={kind}>
                            {url ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto({ url, kind })}
                                className="block w-full"
                                title={t("admin.expandPhoto")}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={t(`admin.photoLabels.${kind}`)}
                                  className="h-24 w-full rounded-lg border border-zinc-800 object-cover transition-transform hover:scale-105 hover:border-blue-500"
                                />
                              </button>
                            ) : (
                              <div className="flex h-24 w-full items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                                <span className="text-[10px] text-zinc-600">{t("admin.noImage")}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {t("admin.photoLegend")}
                    </p>

                    <dl className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500">{t("admin.documentLabel")}</dt>
                        <dd className="text-right text-zinc-200">
                          {req.document_type ? documentTypeLabel(t, req.document_type) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500">{t("admin.declaredDobLabel")}</dt>
                        <dd className="text-right text-zinc-200">
                          {req.declared_dob
                            ? new Date(req.declared_dob + "T00:00:00").toLocaleDateString(locale)
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500">{t("admin.consentLabel")}</dt>
                        <dd className="text-right text-zinc-200">
                          {req.consent_biometric_at
                            ? new Date(req.consent_biometric_at).toLocaleString(locale)
                            : t("admin.notRecorded")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500">{t("admin.declarationLabel")}</dt>
                        <dd className="text-right text-zinc-200">
                          {req.content_declaration_at
                            ? new Date(req.content_declaration_at).toLocaleString(locale)
                            : t("admin.notRecordedDecl")}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-medium text-zinc-300">
                        {t("admin.verifiedDobLabel")}
                      </label>
                      <input
                        type="date"
                        value={verifiedDobs[req.id] ?? ""}
                        onChange={(e) =>
                          setVerifiedDobs((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {t("admin.checklistLabel")}
                      </p>
                      <div className="space-y-1.5">
                        {checklist.map((item, i) => {
                          const list = checks[req.id] ?? [];
                          const checked = list[i] ?? false;
                          return (
                            <button
                              key={item}
                              onClick={() => toggleCheck(req.id, i)}
                              className="flex w-full items-start gap-2 text-left"
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  checked ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-600"
                                }`}
                              >
                                {checked && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-xs ${checked ? "text-zinc-400 line-through" : "text-zinc-300"}`}>
                                {item}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {t("admin.auditLabel")}
                      </p>
                      <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        {detail[req.id]?.events.length ? (
                          detail[req.id].events.map((ev) => (
                            <div key={ev.id} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              <div className="min-w-0">
                                <p className="text-[11px] text-zinc-300">
                                  {t(`verificacion.events.${ev.event}`)}
                                </p>
                                <p className="text-[10px] text-zinc-600">
                                  {new Date(ev.created_at).toLocaleString(locale)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-zinc-600">{t("admin.noEvents")}</p>
                        )}
                      </div>
                    </div>

                    {processing === req.id ? (
                      <p className="mt-4 text-sm text-blue-400">{t("admin.processing")}</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div>
                          <textarea
                            value={denialReasons[req.id] ?? ""}
                            onChange={(e) =>
                              setDenialReasons((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            placeholder={t("admin.denialPlaceholder")}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDecision(req, "approved")}
                            disabled={(checks[req.id] ?? []).some((c) => !c)}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {t("admin.approve")}
                          </button>
                          <button
                            onClick={() => handleDecision(req, "denied")}
                            disabled={!(denialReasons[req.id]?.trim())}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {t("admin.deny")}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-600">
                          {t("admin.checklistRequired")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <PhotoModal
          src={selectedPhoto.url}
          label={t(`admin.photoLabels.${selectedPhoto.kind}`)}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PhotoModal({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
    >
      <button
        onClick={onClose}
        aria-label={t("admin.close")}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <p className="mb-3 text-sm font-medium text-zinc-300">{label}</p>
      <img
        src={src}
        alt={label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain"
      />
    </div>
  );
}
