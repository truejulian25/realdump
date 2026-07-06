"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function Header() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
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
                onClick={() => setIsMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
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
                  {t("header.login")}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg border border-blue-500 px-3 py-1 text-sm text-blue-500 transition-colors hover:bg-blue-500/10"
                >
                  {t("header.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      </header>
      {isMenuOpen && <HamburgerMenu onClose={() => setIsMenuOpen(false)} />}
    </>
  );
}
