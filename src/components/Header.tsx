"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AuthButton from "@/components/AuthButton";

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex w-full max-w-sm items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-white">
          realdump
        </h1>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <AuthButton email={user.email ?? null} />
          ) : (
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
    </header>
  );
}
