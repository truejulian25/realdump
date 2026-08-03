"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import CameraCapture from "@/components/CameraCapture";
import { createClient } from "@/lib/supabase/client";
import { VERIFICATION_STORAGE_BUCKET, storagePathFor } from "@/lib/verification";
import type { CreatorVerification, VerificationEvent } from "@/types";

const DOCUMENT_TYPES = [
  { value: "id_card" },
  { value: "passport" },
  { value: "driver_license" },
] as const;

const STEP_KEYS = [
  { n: 1, titleKey: "step1Title", descKey: "step1Desc" },
  { n: 2, titleKey: "step2Title", descKey: "step2Desc" },
  { n: 3, titleKey: "step3Title", descKey: "step3Desc" },
  { n: 4, titleKey: "step4Title", descKey: "step4Desc" },
  { n: 5, titleKey: "step5Title", descKey: "step5Desc" },
  { n: 6, titleKey: "step6Title", descKey: "step6Desc" },
  { n: 7, titleKey: "step7Title", descKey: "step7Desc" },
  { n: 8, titleKey: "step8Title", descKey: "step8Desc" },
] as const;

type UploadKind = "document" | "selfie" | "holding";

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

function firstIncompleteStep(v: CreatorVerification): number {
  if (!(v.document_type && v.document_url)) return 0;
  if (!v.declared_dob) return 1;
  if (!v.selfie_url) return 2;
  if (!v.holding_document_url) return 6;
  return 7;
}

export default function VerificacionPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { t, locale } = useLanguage();

  const [verification, setVerification] = useState<CreatorVerification | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [declaredDob, setDeclaredDob] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [previews, setPreviews] = useState<Record<UploadKind, string | null>>({
    document: null,
    selfie: null,
    holding: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/verification");
    const data = await res.json();
    setVerification(data.verification);
    setEvents(data.events ?? []);
    return data.verification as CreatorVerification | null;
  }, []);

  const refreshPreviews = useCallback(async (v: CreatorVerification) => {
    const next: Record<UploadKind, string | null> = { document: null, selfie: null, holding: null };
    const bucket = supabase.storage.from(VERIFICATION_STORAGE_BUCKET);
    const entries: [UploadKind, string | null][] = [
      ["document", v.document_url],
      ["selfie", v.selfie_url],
      ["holding", v.holding_document_url],
    ];
    for (const [kind, path] of entries) {
      if (path) {
        const { data } = await bucket.createSignedUrl(path, 3600);
        next[kind] = data?.signedUrl ?? null;
      }
    }
    setPreviews(next);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const v = await load();
        if (v) {
          setStep(firstIncompleteStep(v));
          setDocumentType(v.document_type ?? "");
          setDeclaredDob(v.declared_dob ?? "");
          await refreshPreviews(v);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, load, refreshPreviews]);

  const saveVerification = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/verification", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || t("verificacion.saveError"));
    }
    const data = await res.json();
    if (data.verification) setVerification(data.verification);
  };

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/start", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("verificacion.startError"));
      }
      const data = await res.json();
      setVerification(data.verification);
      setStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.startError"));
    } finally {
      setBusy(false);
    }
  };

  const handleReapply = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/reapply", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("verificacion.reapplyError"));
      }
      const v = await load();
      if (v) {
        setStep(firstIncompleteStep(v));
        setDocumentType(v.document_type ?? "");
        setDeclaredDob(v.declared_dob ?? "");
        await refreshPreviews(v);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.reapplyError"));
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/activate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("verificacion.activateError"));
      }
      await refreshProfile();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.activateError"));
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (kind: UploadKind, file: File) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const path = storagePathFor(user.id, kind);
      const { error } = await supabase.storage
        .from(VERIFICATION_STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw new Error(error.message);

      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [kind]: previewUrl }));

      const key =
        kind === "document" ? "documentUrl" : kind === "selfie" ? "selfieUrl" : "holdingDocumentUrl";
      await saveVerification({ [key]: path });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  const selectDocumentType = async (value: string) => {
    setDocumentType(value);
    setError(null);
    try {
      await saveVerification({ documentType: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.saveError"));
    }
  };

  const saveDob = async () => {
    setError(null);
    try {
      await saveVerification({ declaredDob });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.saveError"));
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/submit", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("verificacion.submitError"));
      }
      const v = await load();
      if (v) setVerification(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("verificacion.submitError"));
    } finally {
      setBusy(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!documentType && !!previews.document;
    if (step === 1) return !!declaredDob;
    if (step === 2) return !!previews.selfie;
    if (step === 3) return true;
    if (step === 4) return consentChecked && declarationChecked;
    if (step === 5) return true;
    if (step === 6) return !!previews.holding;
    return consentChecked && declarationChecked;
  };

  const nextStep = async () => {
    setError(null);
    if (step === 1) await saveDob();
    if (step === 7) {
      await handleSubmit();
      return;
    }
    setStep((s) => Math.min(s + 1, 7));
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const pageFrame = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <Link
          href="/profile"
          className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("verificacion.backToProfile")}
        </Link>
        {children}
      </div>
    </div>
  );

  const status = verification?.status ?? null;
  const isCreator = profile?.role === "creator";

  // ── Estados sin solicitud activa ────────────────────────────────
  if (!status) {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">{t("verificacion.noRequestTitle")}</h1>
        <p className="mb-6 text-xs text-zinc-500">
          {t("verificacion.noRequestDesc")}
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <ul className="space-y-2 text-xs text-zinc-300">
            {STEP_KEYS.map((s) => (
              <li key={s.n} className="flex items-start gap-2">
                <span className="shrink-0 font-semibold text-blue-400">{s.n}.</span>
                <span>{t(`verificacion.${s.titleKey}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          {t("verificacion.needDoc")}
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={handleStart}
          disabled={busy}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? t("verificacion.starting") : t("verificacion.startBtn")}
        </button>
      </>
    );
  }

  // ── Denegada ────────────────────────────────────────────────────
  if (status === "denied") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">{t("verificacion.deniedTitle")}</h1>
        <div className="rounded-lg border border-red-800 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">{t("verificacion.deniedDesc")}</p>
          {verification?.denial_reason && (
            <p className="mt-2 text-xs text-red-300">{verification.denial_reason}</p>
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          {t("verificacion.deniedNote")}
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={handleReapply}
          disabled={busy}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? t("verificacion.processing") : t("verificacion.retryBtn")}
        </button>
      </>
    );
  }

  // ── En revisión ─────────────────────────────────────────────────
  if (status === "submitted" || status === "in_review") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">{t("verificacion.inReviewTitle")}</h1>
        <div className="rounded-lg border border-amber-800 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-400">
            {t("verificacion.inReviewDesc")}
          </p>
          <p className="mt-2 text-xs text-amber-300">
            {t("verificacion.inReviewNote")}
          </p>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("verificacion.auditLog")}</p>
          <AuditTimeline events={events} />
        </div>
      </>
    );
  }

  // ── Aprobada ────────────────────────────────────────────────────
  if (status === "approved") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">{t("verificacion.approvedTitle")}</h1>
        <div className="rounded-lg border border-emerald-800 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-400">
            {t("verificacion.approvedDesc")}
          </p>
          {verification?.verified_dob && (
            <p className="mt-2 text-xs text-emerald-300">
              {t("verificacion.verifiedDob", { date: new Date(verification.verified_dob + "T00:00:00").toLocaleDateString(locale) })}
            </p>
          )}
        </div>
        {isCreator ? (
          <p className="mt-4 text-sm text-zinc-400">{t("verificacion.alreadyCreator")}</p>
        ) : (
          <>
            <p className="mt-4 text-xs text-zinc-500">
              {t("verificacion.approvalActive")}
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <button
              onClick={handleActivate}
              disabled={busy}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? t("verificacion.activating") : t("verificacion.activateBtn")}
            </button>
          </>
        )}
      </>
    );
  }

  // ── Wizard (draft) ──────────────────────────────────────────────
  const meta = STEP_KEYS[step];
  return pageFrame(
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">{t("verificacion.wizardTitle")}</h1>
        <span className="text-xs text-zinc-500">{t("verificacion.stepOf", { current: String(meta.n) })}</span>
      </div>

      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((step + 1) / 8) * 100}%` }}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-base font-semibold text-white">{t(`verificacion.${meta.titleKey}`)}</h2>
        <p className="mt-1 text-xs text-zinc-400">{t(`verificacion.${meta.descKey}`)}</p>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-300">{t("verificacion.documentTypeLabel")}</p>
            <div className="flex flex-col gap-2">
              {DOCUMENT_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => selectDocumentType(dt.value)}
                  className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    documentType === dt.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {documentTypeLabel(t, dt.value)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">{t("verificacion.documentPhotoLabel")}</p>
            <PhotoField
              label={t("verificacion.takeDocumentPhoto")}
              preview={previews.document}
              capture="environment"
              onSelect={(f) => handleFile("document", f)}
              disabled={busy}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">{t("verificacion.dobLabel")}</label>
            <input
              type="date"
              value={declaredDob}
              onChange={(e) => setDeclaredDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-zinc-500">
            {t("verificacion.dobNote")}
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <CameraCapture
            preview={previews.selfie}
            onCapture={(f) => handleFile("selfie", f)}
            onRetake={() => setPreviews((p) => ({ ...p, selfie: null }))}
            disabled={busy}
          />
          <p className="text-xs text-zinc-500">
            {t("verificacion.selfieNote")}
          </p>
        </div>
      )}

      {(step === 3 || step === 5) && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            {step === 3
              ? t("verificacion.faceComparison")
              : t("verificacion.auditInfo")}
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t("verificacion.consentText")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConsentChecked((c) => !c)}
            className="flex w-full items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-600"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                consentChecked ? "border-blue-500 bg-blue-500/10" : "border-zinc-600"
              }`}
            >
              {consentChecked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span className="text-xs text-zinc-300">
              {t("verificacion.consentAccept")}{" "}
              <Link href="/terms" className="text-blue-400 underline">
                {t("verificacion.viewLegalCenter")}
              </Link>
            </span>
          </button>

          <div className="border-t border-zinc-800" />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("verificacion.contentDeclarationHeading")}
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-300 leading-relaxed">{t("verificacion.contentDeclarationIntro")}</p>
              <ol className="list-decimal space-y-2 pl-4">
                {t<{ title: string; body: string }[]>("verificacion.contentDeclarationClauses").map((c, i) => (
                  <li key={i} className="text-xs text-zinc-300 leading-relaxed">
                    <span className="font-semibold">{c.title}</span> {c.body}
                  </li>
                ))}
              </ol>
            </div>
            <button
              type="button"
              onClick={() => setDeclarationChecked((d) => !d)}
              className="mt-3 flex w-full items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-600"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  declarationChecked ? "border-blue-500 bg-blue-500/10" : "border-zinc-600"
                }`}
              >
                {declarationChecked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-zinc-300 font-semibold">{t("verificacion.contentDeclarationAcceptance")}</span>
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <PhotoField
            label={t("verificacion.takeHoldingPhoto")}
            preview={previews.holding}
            capture="environment"
            onSelect={(f) => handleFile("holding", f)}
            disabled={busy}
          />
          <p className="text-xs text-zinc-500">
            {t("verificacion.holdingNote")}
          </p>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("verificacion.summary")}</p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summaryDocument")}</dt>
                <dd className="text-right text-white">
                  {documentType ? documentTypeLabel(t, documentType) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summaryDob")}</dt>
                <dd className="text-right text-white">
                  {declaredDob ? new Date(declaredDob + "T00:00:00").toLocaleDateString(locale) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summarySelfie")}</dt>
                <dd className="text-right text-white">{previews.selfie ? t("verificacion.completed") : t("verificacion.pending")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summaryHolding")}</dt>
                <dd className="text-right text-white">{previews.holding ? t("verificacion.completed") : t("verificacion.pending")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summaryConsent")}</dt>
                <dd className="text-right text-white">{consentChecked ? t("verificacion.accepted") : t("verificacion.pending")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">{t("verificacion.summaryDeclaration")}</dt>
                <dd className="text-right text-white">{declarationChecked ? t("verificacion.accepted") : t("verificacion.pending")}</dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-zinc-500">
            {t("verificacion.submitNote")}
          </p>
          {(!consentChecked || !declarationChecked) && (
            <p className="text-xs text-amber-400">
              {t("verificacion.mustAcceptNote")}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || busy}
          className="rounded-lg border border-zinc-800 px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:opacity-50"
        >
          {t("verificacion.back")}
        </button>
        <button
          onClick={nextStep}
          disabled={!canNext() || busy}
          className="rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy
            ? t("verificacion.processing")
            : step === 7
              ? t("verificacion.submitRequest")
              : t("verificacion.continue")}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function PhotoField({
  label,
  preview,
  capture,
  onSelect,
  disabled,
}: {
  label: string;
  preview: string | null;
  capture: string;
  onSelect: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-900 transition-colors hover:border-blue-500 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-zinc-400">{label}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture as "user" | "environment"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AuditTimeline({ events }: { events: VerificationEvent[] }) {
  const { t, locale } = useLanguage();
  if (events.length === 0) {
    return <p className="text-xs text-zinc-600">{t("verificacion.noEvents")}</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.id} className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200">
              {t(`verificacion.events.${ev.event}`)}
            </p>
            <p className="text-[11px] text-zinc-500">
              {new Date(ev.created_at).toLocaleString(locale)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
