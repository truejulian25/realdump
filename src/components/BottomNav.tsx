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
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-center border-t border-white/10 bg-black/80 px-4 py-2 backdrop-blur-sm">
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
            <Icon size={24} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
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
