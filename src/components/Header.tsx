"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-sm">
      {user ? (
        <div className="grid w-full max-w-sm grid-cols-3 items-center">
          <div className="flex justify-start">
            <Link
              href="/upload"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </div>
          <Link href="/" className="text-center text-lg font-bold tracking-tight text-white">
            realdump
          </Link>
          <div className="flex justify-end">
            {!loading && (
              <button
                onClick={handleLogout}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-sm items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            realdump
          </Link>
          <div className="flex items-center gap-3">
            {loading ? null : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg border border-blue-500 px-3 py-1 text-sm text-blue-500 transition-colors hover:bg-blue-500/10"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
