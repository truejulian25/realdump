"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "error";

const messages: Record<string, { title: string; desc: string }> = {
  loading: { title: "Reactivando cuenta…", desc: "Por favor espera un momento." },
  success: { title: "Cuenta reactivada", desc: "Tu cuenta ha sido reactivada con éxito. Ya puedes iniciar sesión." },
  error: { title: "Enlace inválido o expirado", desc: "El enlace que usaste no es válido o ya expiró. Solicita un nuevo correo de reactivación." },
};

function ReactivateContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/reactivate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  const msg = messages[status];

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
      {status === "loading" ? (
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      ) : status === "success" ? (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
      ) : (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </div>
      )}

      <h1 className="text-lg font-bold text-white">{msg.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{msg.desc}</p>

      {status === "success" && (
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Iniciar sesión
        </Link>
      )}

      {status === "error" && (
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-zinc-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Volver al inicio de sesión
        </Link>
      )}
    </div>
  );
}

export default function ReactivatePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <h1 className="text-lg font-bold text-white">Reactivando cuenta…</h1>
        </div>
      }>
        <ReactivateContent />
      </Suspense>
    </div>
  );
}
