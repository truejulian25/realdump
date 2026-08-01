"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CameraCapture from "@/components/CameraCapture";
import { createClient } from "@/lib/supabase/client";
import { VERIFICATION_STORAGE_BUCKET, VERIFICATION_EVENT_LABELS, storagePathFor } from "@/lib/verification";
import type { CreatorVerification, VerificationEvent } from "@/types";

const DOCUMENT_TYPES = [
  { value: "id_card", label: "Cédula de identidad" },
  { value: "passport", label: "Pasaporte" },
  { value: "driver_license", label: "Licencia de conducir" },
] as const;

const STEP_META = [
  {
    n: 1,
    title: "Documento oficial",
    desc: "Selecciona tu tipo de documento y toma una foto clara, con buena luz y sin reflejos.",
  },
  {
    n: 2,
    title: "Fecha de nacimiento",
    desc: "Declara tu fecha de nacimiento. Será cotejada contra tu documento por un administrador.",
  },
  {
    n: 3,
    title: "Selfie / prueba de vida",
    desc: "Toma una selfie de tu rostro con buena luz, mirando a la cámara.",
  },
  {
    n: 4,
    title: "Comparación facial",
    desc: "Tu selfie será comparada con la foto de tu documento para confirmar que eres la misma persona.",
  },
  {
    n: 5,
    title: "Consentimiento explícito",
    desc: "Necesitamos tu aceptación explícita para tratar tus datos personales y biométricos.",
  },
  {
    n: 6,
    title: "Registro de auditoría",
    desc: "Cada paso que completas queda registrado con fecha y hora en tu expediente de verificación.",
  },
  {
    n: 7,
    title: "Foto sosteniendo el documento",
    desc: "Sostén tu documento junto a tu rostro y toma una foto donde se vean ambos.",
  },
  {
    n: 8,
    title: "Revisión manual",
    desc: "Un administrador revisará toda la información antes de activar tu rol de creador.",
  },
] as const;

const CONTENT_DECLARATION = {
  heading: "Declaración de titularidad, autorización y consentimiento sobre el contenido",
  intro:
    "Al completar mi registro como creador, declaro y garantizo expresamente que todo contenido que publique, cargue, transmita o ponga a disposición en la plataforma cumple con las siguientes condiciones:",
  clauses: [
    {
      title: "Contenido propio:",
      body: "El contenido me representa personalmente o soy titular de los derechos necesarios para publicarlo y distribuirlo en la plataforma.",
    },
    {
      title: "Contenido de terceros:",
      body: "Cuando el contenido incluya a una o más personas distintas de mí, declaro que cuento con la autorización expresa, válida y suficiente de todas las personas que aparezcan en dicho contenido, incluyendo la autorización necesaria para su grabación, publicación, distribución y exhibición dentro de la plataforma.",
    },
    {
      title: "Personas mayores de edad:",
      body: "Declaro que todas las personas que aparezcan en el contenido son mayores de 18 años y que cuento con las autorizaciones correspondientes para la publicación del contenido.",
    },
    {
      title: "Ausencia de contenido no autorizado:",
      body: "No publicaré contenido de terceros sin su conocimiento o autorización, ni contenido obtenido, grabado o distribuido mediante engaño, coacción, amenaza, acceso no autorizado, apropiación indebida o cualquier otro medio contrario a la ley o a las normas de la plataforma.",
    },
    {
      title: "Responsabilidad:",
      body: "Comprendo y acepto que soy responsable de contar con las autorizaciones y derechos necesarios para publicar cualquier contenido que incorpore a otras personas.",
    },
    {
      title: "Denuncias y reclamaciones:",
      body: "Reconozco que cualquier persona que aparezca en un contenido publicado en mi cuenta podrá presentar una denuncia o reclamación ante la plataforma cuando considere que dicho contenido fue publicado sin su autorización, consentimiento o derechos suficientes.",
    },
    {
      title: "Retirada del contenido:",
      body: "La plataforma podrá restringir, suspender o retirar temporalmente el contenido denunciado mientras realiza las verificaciones correspondientes, especialmente cuando existan indicios razonables de publicación no autorizada, vulneración de derechos, falta de consentimiento o incumplimiento de las normas de la plataforma.",
    },
    {
      title: "Medidas sobre la cuenta:",
      body: "Si se determina que publiqué contenido sin la autorización requerida, o si incumplo las obligaciones establecidas en esta declaración, la plataforma podrá adoptar medidas contra mi cuenta, incluyendo la eliminación del contenido, restricciones de publicación, suspensión temporal o cierre permanente de mi perfil de creador, de acuerdo con las Políticas de la Plataforma y los procedimientos de revisión y apelación aplicables.",
    },
    {
      title: "Declaración de veracidad:",
      body: "Confirmo que la información proporcionada durante mi registro y las declaraciones realizadas son verdaderas, completas y exactas. Entiendo que proporcionar información falsa, utilizar documentación ajena o intentar evadir los mecanismos de verificación puede resultar en la suspensión o terminación de mi cuenta y en otras medidas que puedan corresponder conforme a la legislación aplicable.",
    },
  ],
  acceptance:
    "Declaro que he leído, comprendido y acepto esta declaración. Confirmo expresamente que cuento con los derechos, autorizaciones y consentimientos necesarios para publicar el contenido que subiré a la plataforma y que cumpliré las normas aplicables a los creadores.",
} as const;

type UploadKind = "document" | "selfie" | "holding";

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
      throw new Error(err.error || "Error al guardar");
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
        throw new Error(err.error || "Error al iniciar");
      }
      const data = await res.json();
      setVerification(data.verification);
      setStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar");
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
        throw new Error(err.error || "Error al reintentar");
      }
      const v = await load();
      if (v) {
        setStep(firstIncompleteStep(v));
        setDocumentType(v.document_type ?? "");
        setDeclaredDob(v.declared_dob ?? "");
        await refreshPreviews(v);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reintentar");
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
        throw new Error(err.error || "Error al activar");
      }
      await refreshProfile();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al activar");
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
      setError(e instanceof Error ? e.message : "Error al subir la foto");
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
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const saveDob = async () => {
    setError(null);
    try {
      await saveVerification({ declaredDob });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/submit", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al enviar");
      }
      const v = await load();
      if (v) setVerification(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar");
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
        <p className="text-zinc-400">Cargando...</p>
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
          Volver al perfil
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
        <h1 className="mb-2 text-xl font-bold text-white">Verificación de creador</h1>
        <p className="mb-6 text-xs text-zinc-500">
          Para convertirte en creador debes completar un proceso de verificación de identidad en 8 pasos.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <ul className="space-y-2 text-xs text-zinc-300">
            {STEP_META.map((s) => (
              <li key={s.n} className="flex items-start gap-2">
                <span className="shrink-0 font-semibold text-blue-400">{s.n}.</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Necesitarás tu documento oficial y una cámara. Todo el proceso queda registrado en un expediente de auditoría.
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={handleStart}
          disabled={busy}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Iniciando..." : "Comenzar verificación"}
        </button>
      </>
    );
  }

  // ── Denegada ────────────────────────────────────────────────────
  if (status === "denied") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">Verificación denegada</h1>
        <div className="rounded-lg border border-red-800 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">Tu solicitud no fue aprobada.</p>
          {verification?.denial_reason && (
            <p className="mt-2 text-xs text-red-300">{verification.denial_reason}</p>
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Puedes corregir la información y volver a intentar el proceso.
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={handleReapply}
          disabled={busy}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Procesando..." : "Reintentar verificación"}
        </button>
      </>
    );
  }

  // ── En revisión ─────────────────────────────────────────────────
  if (status === "submitted" || status === "in_review") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">Verificación en revisión</h1>
        <div className="rounded-lg border border-amber-800 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-400">
            Recibimos tu solicitud. Un administrador está revisando tu información.
          </p>
          <p className="mt-2 text-xs text-amber-300">
            Recibirás respuesta cuando la revisión termine. Mientras tanto tu cuenta permanece en estado pendiente, pero puedes disfrutar de las funciones de la página en modo no creador.
          </p>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Registro de auditoría</p>
          <AuditTimeline events={events} />
        </div>
      </>
    );
  }

  // ── Aprobada ────────────────────────────────────────────────────
  if (status === "approved") {
    return pageFrame(
      <>
        <h1 className="mb-2 text-xl font-bold text-white">Verificación aprobada</h1>
        <div className="rounded-lg border border-emerald-800 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-400">
            Tu identidad fue verificada correctamente.
          </p>
          {verification?.verified_dob && (
            <p className="mt-2 text-xs text-emerald-300">
              Fecha de nacimiento verificada: {new Date(verification.verified_dob + "T00:00:00").toLocaleDateString("es-CO")}
            </p>
          )}
        </div>
        {isCreator ? (
          <p className="mt-4 text-sm text-zinc-400">Ya tienes el rol de creador activo.</p>
        ) : (
          <>
            <p className="mt-4 text-xs text-zinc-500">
              Tu verificación está vigente pero tu rol de creador no está activo. Puedes activarlo cuando quieras.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <button
              onClick={handleActivate}
              disabled={busy}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Activando..." : "Activar rol de creador"}
            </button>
          </>
        )}
      </>
    );
  }

  // ── Wizard (draft) ──────────────────────────────────────────────
  const meta = STEP_META[step];
  return pageFrame(
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Verificación de creador</h1>
        <span className="text-xs text-zinc-500">Paso {meta.n} de 8</span>
      </div>

      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((step + 1) / 8) * 100}%` }}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-base font-semibold text-white">{meta.title}</h2>
        <p className="mt-1 text-xs text-zinc-400">{meta.desc}</p>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-300">Tipo de documento</p>
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
                  {dt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">Foto del documento</p>
            <PhotoField
              label="Tomar foto del documento"
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
            <label className="mb-1 block text-sm font-medium text-zinc-300">Fecha de nacimiento</label>
            <input
              type="date"
              value={declaredDob}
              onChange={(e) => setDeclaredDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Debes ser mayor de 18 años para publicar contenido. Tu fecha será verificada contra tu documento.
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
            Evita lentes, gorras o accesorios que cubran tu rostro. Usa buena luz.
          </p>
        </div>
      )}

      {(step === 3 || step === 5) && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            {step === 3
              ? "La comparación facial se realiza cotejando tu selfie con la fotografía de tu documento. Un administrador la verifica manualmente como parte de la revisión."
              : "Cada acción de este proceso (subidas, datos, consentimiento y decisión) queda registrada en un expediente de auditoría con fecha, hora y responsable. Tú puedes consultarlo en cualquier momento."}
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Autorizo a la Plataforma a recopilar y tratar mis datos personales y biométricos (fotografía de mi
              documento oficial, selfie y foto sosteniendo el documento) con la única finalidad de verificar mi
              identidad y mi edad para otorgar el rol de creador. Comprendo que estos datos se almacenan de forma
              segura, se utilizan exclusivamente para este proceso de verificación y de revisión manual, y que
              puedo solicitar su eliminación conforme a la política de privacidad y la legislación aplicable.
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
              Acepto el tratamiento de mis datos personales y biométricos conforme a lo descrito.{" "}
              <Link href="/terms" className="text-blue-400 underline">
                Ver Centro Legal
              </Link>
            </span>
          </button>

          <div className="border-t border-zinc-800" />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {CONTENT_DECLARATION.heading}
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-300 leading-relaxed">{CONTENT_DECLARATION.intro}</p>
              <ol className="list-decimal space-y-2 pl-4">
                {CONTENT_DECLARATION.clauses.map((c) => (
                  <li key={c.title} className="text-xs text-zinc-300 leading-relaxed">
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
              <span className="text-xs text-zinc-300 font-semibold">{CONTENT_DECLARATION.acceptance}</span>
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <PhotoField
            label="Tomar foto con el documento"
            preview={previews.holding}
            capture="environment"
            onSelect={(f) => handleFile("holding", f)}
            disabled={busy}
          />
          <p className="text-xs text-zinc-500">
            Sostén tu documento a la altura de tu rostro, con la cara visible y el documento legible.
          </p>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Resumen</p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Documento</dt>
                <dd className="text-right text-white">
                  {DOCUMENT_TYPES.find((d) => d.value === documentType)?.label ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Fecha de nacimiento</dt>
                <dd className="text-right text-white">
                  {declaredDob ? new Date(declaredDob + "T00:00:00").toLocaleDateString("es-CO") : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Selfie</dt>
                <dd className="text-right text-white">{previews.selfie ? "Completada" : "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Foto con documento</dt>
                <dd className="text-right text-white">{previews.holding ? "Completada" : "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Consentimiento</dt>
                <dd className="text-right text-white">{consentChecked ? "Aceptado" : "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Declaración de contenido</dt>
                <dd className="text-right text-white">{declarationChecked ? "Aceptado" : "Pendiente"}</dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-zinc-500">
            Al enviar, tu solicitud quedará en revisión manual. Esto registra tu consentimiento y tu declaración de
            contenido con fecha y hora.
          </p>
          {(!consentChecked || !declarationChecked) && (
            <p className="text-xs text-amber-400">
              Debes aceptar el consentimiento y la declaración de contenido en el paso 5 para poder enviar la
              solicitud.
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
          Atrás
        </button>
        <button
          onClick={nextStep}
          disabled={!canNext() || busy}
          className="rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy
            ? "Procesando..."
            : step === 7
              ? "Enviar solicitud"
              : "Continuar"}
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
  if (events.length === 0) {
    return <p className="text-xs text-zinc-600">Aún no hay eventos registrados.</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.id} className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200">
              {VERIFICATION_EVENT_LABELS[ev.event] ?? ev.event}
            </p>
            <p className="text-[11px] text-zinc-500">
              {new Date(ev.created_at).toLocaleString("es-CO")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
