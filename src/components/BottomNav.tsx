"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = [
    { href: "/", label: t("bottomNav.home"), icon: HomeIcon },
    { href: "/search", label: t("bottomNav.search"), icon: SearchIcon },
    { href: "/profile", label: t("bottomNav.profile"), icon: ProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-center border-t border-zinc-800 bg-black/80 px-4 py-2 backdrop-blur-sm">
      <div className="flex w-full max-w-sm items-center justify-between">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
              pathname === href
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon profile={profile} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProfileIcon({ profile }: { profile?: { avatar_url?: string | null; display_name?: string | null } | null }) {
  const src = profile?.avatar_url
    ?? `https://ui-avatars.com/api/?name=${profile?.display_name ?? "user"}&background=6366f1&color=fff&size=24`;

  return (
    <div className="h-6 w-6 overflow-hidden rounded-md border border-zinc-500 bg-zinc-700">
      <img
        src={src}
        alt="Perfil"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
