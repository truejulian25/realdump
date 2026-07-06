"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { availableLanguages, useLanguage, type Locale } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";

type MenuView = "main" | "language" | "changePassword" | "qr" | "accountManagement" | "deactivateAccount" | "deleteAccount" | "filters";

interface Props {
  onClose: () => void;
}

export default function HamburgerMenu({ onClose }: Props) {
  const [view, setView] = useState<MenuView>("main");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-80 max-w-[85vw] flex-col bg-zinc-900 shadow-xl transition-transform duration-300 ${animate ? "translate-x-0" : "translate-x-full"}`}
      >
        {view === "main" && <MainMenu onSelect={setView} onClose={onClose} />}
        {view === "language" && <LanguageView onBack={() => setView("main")} />}
        {view === "changePassword" && <ChangePasswordView onBack={() => setView("main")} />}
        {view === "qr" && <QRView onBack={() => setView("main")} />}
        {view === "accountManagement" && <AccountManagementView onSelect={setView} onBack={() => setView("main")} />}
        {view === "deactivateAccount" && <DeactivateAccountView onBack={() => setView("main")} />}
        {view === "deleteAccount" && <DeleteAccountView onBack={() => setView("main")} />}
        {view === "filters" && <FiltersView onBack={() => setView("main")} />}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" /><rect x="14" y="2" width="8" height="8" />
      <rect x="2" y="14" width="8" height="8" /><path d="M14 14h4v4h-4zM18 14h.01M14 18h.01M20 16h.01" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconUserX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable row                                                        */
/* ------------------------------------------------------------------ */

function MenuRow({ icon, label, onClick, href, hasArrow = true, danger = false }: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  hasArrow?: boolean;
  danger?: boolean;
}) {
  const base = `flex w-full items-center gap-3 px-4 py-3.5 text-sm transition-colors ${danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-300 hover:bg-zinc-800"}`;

  if (href) {
    return (
      <Link href={href} className={base} onClick={onClick}>
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {hasArrow && <span className="text-zinc-600"><IconChevronRight /></span>}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={base}>
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hasArrow && <span className="text-zinc-600"><IconChevronRight /></span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Views                                                              */
/* ------------------------------------------------------------------ */

function MainMenu({ onSelect, onClose }: {
  onSelect: (v: MenuView) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-base font-bold text-white">{t("header.menu")}</span>
        <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 transition-colors hover:text-white">
          <IconX />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <MenuRow icon={<IconGlobe />} label={t("hamburgerMenu.language")} onClick={() => onSelect("language")} />
        <MenuRow icon={<IconBookmark />} label={t("hamburgerMenu.saved")} href="/saved" />
        <MenuRow icon={<IconQr />} label={t("hamburgerMenu.qr")} onClick={() => onSelect("qr")} />
        <MenuRow icon={<IconBarChart />} label={t("hamburgerMenu.stats")} href="/profile/stats" />
        <MenuRow icon={<IconUserX />} label={t("hamburgerMenu.blocked")} href="/profile/blocked" />
        <MenuRow icon={<IconFilter />} label={t("hamburgerMenu.filters")} onClick={() => onSelect("filters")} />
        <MenuRow icon={<IconFileText />} label={t("hamburgerMenu.terms")} href="/terms" />
        <MenuRow icon={<IconLock />} label={t("hamburgerMenu.changePassword")} onClick={() => onSelect("changePassword")} />
        <MenuRow icon={<IconTrash />} label={t("hamburgerMenu.accountManagement")} onClick={() => onSelect("accountManagement")} />
      </div>

      <div className="border-t border-zinc-800 py-1">
        <MenuRow icon={<IconLogOut />} label={t("hamburgerMenu.logout")} onClick={handleLogout} hasArrow={false} danger />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
      <button onClick={onBack} className="rounded-lg p-1 text-zinc-400 transition-colors hover:text-white">
        <IconArrowLeft />
      </button>
      <span className="text-base font-bold text-white">{title}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LanguageView({ onBack }: { onBack: () => void }) {
  const { t, locale, setLocale } = useLanguage();

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.language")} onBack={onBack} />
      <div className="flex-1 px-4 py-4">
        <p className="mb-4 text-sm text-zinc-500">{t("hamburgerMenu.selectLanguage")}</p>
        {availableLanguages.map((lang, i) => (
          <label
            key={lang.code}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${i > 0 ? "mt-2" : ""} ${locale === lang.code ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 hover:bg-zinc-800"}`}
          >
            <input type="radio" name="lang" value={lang.code} checked={locale === lang.code} onChange={() => setLocale(lang.code)} className="accent-blue-500" />
            <div>
              <p className="text-sm font-medium text-white">{lang.nativeName}</p>
              <p className="text-xs text-zinc-500">{lang.englishName}</p>
            </div>
          </label>
        ))}
        <p className="mt-6 text-xs text-zinc-600">{t("hamburgerMenu.languageChangeNote")}</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ChangePasswordView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError(t("hamburgerMenu.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("hamburgerMenu.passwordsDontMatch"));
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (err) {
      setError(err.message === "The new password should be different from the old password."
        ? t("hamburgerMenu.passwordDifferent")
        : err.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <>
        <ViewHeader title={t("hamburgerMenu.changePassword")} onBack={onBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="rounded-full bg-emerald-500/20 p-3 text-emerald-400"><IconCheck /></span>
          <p className="text-sm font-medium text-white">{t("hamburgerMenu.passwordUpdated")}</p>
          <p className="text-xs text-zinc-500">{t("hamburgerMenu.passwordUpdatedDesc")}</p>
          <button onClick={onBack} className="mt-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700">
            {t("hamburgerMenu.backToMenu")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.changePassword")} onBack={onBack} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("hamburgerMenu.currentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("hamburgerMenu.newPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("hamburgerMenu.confirmNewPassword")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-auto rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("hamburgerMenu.updating") : t("hamburgerMenu.changePasswordBtn")}
        </button>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */

function QRView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const profileUrl = origin ? `${origin}/profile` : "";

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.qr")} onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        {profileUrl ? (
          <div className="rounded-xl bg-white p-4">
            <QRCodeCanvas value={profileUrl} size={180} />
          </div>
        ) : (
          <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-zinc-800">
            <p className="text-xs text-zinc-500">{t("hamburgerMenu.loading")}</p>
          </div>
        )}
        <p className="text-sm font-medium text-white">{t("hamburgerMenu.shareProfile")}</p>
        <p className="text-xs text-zinc-500">{t("hamburgerMenu.scanQR")}</p>
        <p className="mt-2 text-xs text-zinc-600 break-all">{profileUrl}</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function DeleteAccountView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/delete-account", { method: "POST" });
      if (!res.ok) throw new Error("Error al eliminar la cuenta");
      await signOut();
      router.push("/auth/login");
      router.refresh();
    } catch {
      setError(t("hamburgerMenu.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "warning") {
    return (
      <>
        <ViewHeader title={t("hamburgerMenu.deleteAccount")} onBack={onBack} />
        <div className="flex flex-1 flex-col justify-between px-4 py-4">
          <div className="space-y-3">
            <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
              <p className="font-medium">{t("hamburgerMenu.areYouSure")}</p>
              <p className="mt-1 text-xs text-red-300">
                {t("hamburgerMenu.irreversibleAction")}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2">• {t("hamburgerMenu.deleteVideos")}</li>
              <li className="flex items-center gap-2">• {t("hamburgerMenu.deleteLikes")}</li>
              <li className="flex items-center gap-2">• {t("hamburgerMenu.noRecovery")}</li>
              <li className="flex items-center gap-2">• {t("hamburgerMenu.usernameAvailable")}</li>
            </ul>
          </div>
          <button
            onClick={() => setStep("confirm")}
            className="rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {t("hamburgerMenu.continue")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.deleteAccount")} onBack={() => setStep("warning")} />
      <div className="flex flex-1 flex-col justify-between px-4 py-4">
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            {t("hamburgerMenu.writeToConfirm", { word: "ELIMINAR" })}
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-600"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "ELIMINAR" || loading}
          className="rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? t("hamburgerMenu.deleting") : t("hamburgerMenu.deleteMyAccount")}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

function AccountManagementView({ onSelect, onBack }: {
  onSelect: (v: MenuView) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.accountManagement")} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <button
          onClick={() => onSelect("deactivateAccount")}
          className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <IconMoon />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{t("hamburgerMenu.deactivateAccount")}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t("hamburgerMenu.deactivateAccountDesc")}</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("deleteAccount")}
          className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-red-800 hover:bg-red-900/10"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <IconTrash />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{t("hamburgerMenu.deleteAccount")}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t("hamburgerMenu.deleteAccountDesc")}</p>
          </div>
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function DeactivateAccountView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"warning" | "done">("warning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/deactivate-account", { method: "POST" });
      if (!res.ok) throw new Error("Error al desactivar");
      await signOut();
      router.push("/auth/login");
      router.refresh();
    } catch {
      setError(t("hamburgerMenu.deactivationError"));
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <>
        <ViewHeader title={t("hamburgerMenu.deactivateAccount")} onBack={onBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="rounded-full bg-emerald-500/20 p-3 text-emerald-400"><IconCheck /></span>
          <p className="text-sm font-medium text-white">{t("hamburgerMenu.accountDeactivated")}</p>
          <p className="text-xs text-zinc-500">{t("hamburgerMenu.accountDeactivatedDesc")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.deactivateAccount")} onBack={onBack} />
      <div className="flex flex-1 flex-col justify-between px-4 py-4">
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-500/10 p-4 text-sm text-amber-400">
            <p className="font-medium">{t("hamburgerMenu.areYouSure")}</p>
            <ul className="mt-3 space-y-2 text-xs text-amber-300">
              <li className="flex items-center gap-2">• {t("hamburgerMenu.deactivateWarning1")}</li>
              <li className="flex items-center gap-2">• {t("hamburgerMenu.deactivateWarning2")}</li>
              <li className="flex items-center gap-2">• {t("hamburgerMenu.deactivateWarning3")}</li>
            </ul>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <button
          onClick={handleDeactivate}
          disabled={loading}
          className="rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? t("hamburgerMenu.deactivating") : t("hamburgerMenu.deactivate")}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function FiltersView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [filterWords, setFilterWords] = useState("");
  const [hideOffensive, setHideOffensive] = useState(true);
  const [customWords, setCustomWords] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("filterWords", filterWords);
    localStorage.setItem("hideOffensive", JSON.stringify(hideOffensive));
    localStorage.setItem("customWords", customWords);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <ViewHeader title={t("hamburgerMenu.contentFilters")} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">{t("hamburgerMenu.filterWordsLabel")}</label>
          <p className="mb-2 text-xs text-zinc-500">{t("hamburgerMenu.filterWordsDesc")}</p>
          <textarea
            value={filterWords}
            onChange={(e) => setFilterWords(e.target.value)}
            placeholder={t("hamburgerMenu.filterWordsPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-600 resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">{t("hamburgerMenu.hideOffensiveLabel")}</label>
          <p className="mb-2 text-xs text-zinc-500">{t("hamburgerMenu.hideOffensiveDesc")}</p>
          <button
            onClick={() => setHideOffensive(!hideOffensive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${hideOffensive ? "bg-blue-600" : "bg-zinc-700"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${hideOffensive ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">{t("hamburgerMenu.customWordsLabel")}</label>
          <p className="mb-2 text-xs text-zinc-500">{t("hamburgerMenu.customWordsDesc")}</p>
          <textarea
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            placeholder={t("hamburgerMenu.customWordsPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-600 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-auto rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {saved ? t("hamburgerMenu.savedConfirm") : t("hamburgerMenu.savePreferences")}
        </button>
      </div>
    </>
  );
}
