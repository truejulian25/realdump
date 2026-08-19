"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HouseSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = [
    { href: "/", label: t("bottomNav.home"), icon: HouseSimple },
    { href: "/search", label: t("bottomNav.search"), icon: MagnifyingGlass },
    { href: "/profile", label: t("bottomNav.profile"), icon: ProfileIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center px-4 pb-3">
      <div className="flex w-full max-w-sm items-center justify-between rounded-[25px] bg-[#F2F2F2] px-5 py-1.5 shadow-sm">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-0.5 text-xs transition-colors ${
              pathname === href
                ? "text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {href === "/profile" ? (
              <Icon size={20} profile={profile} />
            ) : (
              <Icon size={20} />
            )}
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function ProfileIcon({ profile }: { profile?: { avatar_url?: string | null; display_name?: string | null } | null }) {
  const { t } = useLanguage();
  const src = profile?.avatar_url
    ?? `https://ui-avatars.com/api/?name=${profile?.display_name ?? "user"}&background=6366f1&color=fff&size=24`;

  return (
    <div className="h-5 w-5 overflow-hidden rounded-full border border-zinc-500 bg-zinc-700">
      <img
        src={src}
        alt={t("bottomNav.profile")}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
