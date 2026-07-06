"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AccountStatus = null | "deactivated" | "deleted";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [deactivatedUserId, setDeactivatedUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAccountStatus(null);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("deactivated_at, deleted_at")
      .single();

    if (profile?.deleted_at) {
      setAccountStatus("deleted");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile?.deactivated_at) {
      setDeactivatedUserId(signInData.user.id);
      setAccountStatus("deactivated");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await fetch("/api/resend-reactivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: deactivatedUserId }),
      });
    } catch {
      // silent
    }
    setResending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-lg bg-zinc-900 p-8">
        {accountStatus === "deleted" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
            <h2 className="text-lg font-bold text-white">Cuenta eliminada</h2>
            <p className="mt-2 text-sm text-zinc-400">Esta cuenta fue eliminada permanentemente. No puedes volver a iniciar sesión.</p>
          </div>
        ) : accountStatus === "deactivated" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-white">Cuenta desactivada</h2>
            <p className="mt-2 text-sm text-zinc-400">Te hemos enviado un correo con instrucciones para reactivar tu cuenta.</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="mt-4 text-sm text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
            >
              {resending ? "Enviando…" : "Reenviar correo"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <h1 className="text-center text-2xl font-bold text-white">Iniciar sesión</h1>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded bg-zinc-800 px-4 py-2 text-white placeholder-zinc-400"
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded bg-zinc-800 px-4 py-2 text-white placeholder-zinc-400"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-sm text-zinc-400">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/register" className="text-blue-400 hover:underline">
                Regístrate
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
