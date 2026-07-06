"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { Globe, FileText, Bookmark, Lock, QrCode, Trash, Funnel, ChartBar, UserSwitch, SignOut, Moon, CaretRight, CaretLeft, X, Check } from "@phosphor-icons/react";
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
  return <Globe size={18} />;
}

function IconFileText() {
  return <FileText size={18} />;
}

function IconBookmark() {
  return <Bookmark size={18} />;
}

function IconLock() {
  return <Lock size={18} />;
}

function IconQr() {
  return <QrCode size={18} />;
}

function IconTrash() {
  return <Trash size={18} />;
}

function IconFilter() {
  return <Funnel size={18} />;
}

function IconBarChart() {
  return <ChartBar size={18} />;
}

function IconUserX() {
  return <UserSwitch size={18} />;
}

function IconLogOut() {
  return <SignOut size={18} />;
}

function IconMoon() {
  return <Moon size={18} />;
}

function IconChevronRight() {
  return <CaretRight size={14} />;
}

function IconArrowLeft() {
  return <CaretLeft size={18} />;
}

function IconX() {
  return <X size={18} />;
}

function IconCheck() {
  return <Check size={18} />;
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
  const base = `flex w-full items-center gap-3 px-4 py-3.5 text-sm transition-colors ${danger ? "text-red-300 hover:bg-red-500/15" : "text-zinc-300 hover:bg-zinc-800"}`;

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
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
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

      <div className="border-t border-white/10 py-1">
        <MenuRow icon={<IconLogOut />} label={t("hamburgerMenu.logout")} onClick={handleLogout} hasArrow={false} danger />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
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
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${i > 0 ? "mt-2" : ""} ${locale === lang.code ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:bg-zinc-800"}`}
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-600"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-auto rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.97] hover:bg-blue-700 disabled:opacity-50"
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
            className="rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.97] hover:bg-red-700"
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-600"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "ELIMINAR" || loading}
          className="rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.97] hover:bg-red-700 disabled:opacity-50"
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
          className="flex items-center gap-4 rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-left transition-colors hover:border-white/20 hover:bg-zinc-800/50"
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
          className="flex items-center gap-4 rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-left transition-colors hover:border-red-800 hover:bg-red-900/10"
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
          className="rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.97] hover:bg-amber-700 disabled:opacity-50"
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-600 resize-none"
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
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-600 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-auto rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.97] hover:bg-blue-700"
        >
          {saved ? t("hamburgerMenu.savedConfirm") : t("hamburgerMenu.savePreferences")}
        </button>
      </div>
    </>
  );
}
