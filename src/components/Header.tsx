"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, List, Bell } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnreadCount } from "@/hooks/useNotifications";
import HamburgerMenu from "@/components/HamburgerMenu";

const SCROLL_REVEAL_TOP = 60;
const SCROLL_THRESHOLD = 10;

export default function Header() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const unread = useUnreadCount(!!user);

  useEffect(() => {
    let lastY = window.scrollY;
    const applyScroll = (deltaY: number, scrollY: number) => {
      setHidden((prev) => {
        if (scrollY < SCROLL_REVEAL_TOP) return false;
        if (deltaY > SCROLL_THRESHOLD) return true;
        if (deltaY < -SCROLL_THRESHOLD) return false;
        return prev;
      });
    };
    const onWindowScroll = () => {
      const y = window.scrollY;
      applyScroll(y - lastY, y);
      lastY = y;
    };
    const onFeedScroll = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.deltaY === "number") {
        applyScroll(detail.deltaY, detail.scrollY ?? window.scrollY);
      }
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    window.addEventListener("realdump:scroll-header", onFeedScroll);
    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      window.removeEventListener("realdump:scroll-header", onFeedScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-offset",
      hidden ? "-3.5rem" : "3.5rem",
    );
  }, [hidden]);

  return (
    <>
    <header className={`fixed top-0 z-50 flex w-full items-center justify-center border-b border-zinc-200 bg-app-bg/80 px-4 py-3 backdrop-blur-sm transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      {user ? (
        <div className="grid w-full max-w-sm grid-cols-3 items-center">
          <div className="flex justify-start">
            {profile?.role === "creator" && (
              <Link
                href="/upload"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <Plus size={20} />
              </Link>
            )}
          </div>
          <Link href="/" className="text-center text-lg font-bold tracking-tight text-zinc-900">
            realdump
          </Link>
          <div className="flex items-center justify-end gap-1">
            {!loading && (
              <>
                <Link
                  href="/notificaciones"
                  aria-label={t("notifications.title")}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <List size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-sm items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
            realdump
          </Link>
          <div className="flex items-center gap-3">
            {loading ? null : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
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
