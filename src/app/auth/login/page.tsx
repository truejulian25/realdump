"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("deactivated_at, deleted_at")
      .eq("id", signInData.user.id)
      .single();

    if (profileError || !profile) {
      setError(t("auth.login.verifyError"));
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.deleted_at) {
      setAccountStatus("deleted");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.deactivated_at) {
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
      <div className="w-full max-w-sm">
        {accountStatus === "deleted" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
            <h2 className="text-lg font-bold text-white">{t("auth.login.accountDeleted")}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t("auth.login.accountDeletedDesc")}</p>
          </div>
        ) : accountStatus === "deactivated" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-white">{t("auth.login.accountDeactivated")}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t("auth.login.accountDeactivatedDesc")}</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="mt-4 text-sm text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
            >
              {resending ? t("auth.login.resending") : t("auth.login.resend")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <h1 className="text-center text-xl font-bold text-white">{t("auth.login.title")}</h1>

            <input
              type="email"
              placeholder={t("common.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500 border-b border-zinc-800"
            />

            <input
              type="password"
              placeholder={t("common.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500 border-b border-zinc-800"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t("auth.login.entering") : t("auth.login.enter")}
            </button>

            <p className="text-sm text-zinc-400">
              {t("auth.login.noAccount")}{" "}
              <Link href="/auth/register" className="text-blue-400 hover:underline">
                {t("auth.login.registerLink")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
