"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Globe, FileText, Bookmark, Lock, QrCode, Trash, Funnel, ChartBar, UserSwitch, SignOut, Moon, CaretRight, CaretLeft, X, Check } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { availableLanguages, useLanguage, type Locale } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });

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

function IconUserPlus() {
  return <UserSwitch size={18} />;
}

function IconClock() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>;
}

function IconShieldCheck() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>;
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
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const handleRequestCreator = async () => {
    setRequestLoading(true);
    const res = await fetch("/api/role-request", { method: "POST" });
    if (res.ok) setRequestSent(true);
    setRequestLoading(false);
  };

  const handleRevokeCreator = async () => {
    setRevoking(true);
    const res = await fetch("/api/revoke-creator", { method: "POST" });
    if (res.ok) {
      await refreshProfile();
    }
    setRevoking(false);
    setShowRevokeConfirm(false);
  };

  const isViewer = profile?.role === "viewer";
  const isPending = profile?.role === "pending";
  const isAdmin = profile?.is_admin;
  const isCreator = profile?.role === "creator";

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

        {isCreator && (
          <>
            <MenuRow
              icon={<span className="text-red-400"><IconUserX /></span>}
              label="Dejar de ser creador"
              onClick={() => setShowRevokeConfirm(true)}
              hasArrow={false}
              danger
            />

            {showRevokeConfirm && (
              <div className="mx-4 mt-1 rounded-lg border border-red-800 bg-red-900/20 p-3">
                <p className="text-sm text-zinc-200">¿Dejar de ser creador?</p>
                <p className="mt-1 text-xs text-zinc-400">Tus videos seguirán publicados pero no podrás subir nuevos.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setShowRevokeConfirm(false)}
                    className="flex-1 rounded bg-zinc-800 py-1.5 text-xs text-white transition-colors hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRevokeCreator}
                    disabled={revoking}
                    className="flex-1 rounded bg-red-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {revoking ? "Cambiando..." : "Sí, dejar de ser creador"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <MenuRow icon={<IconTrash />} label={t("hamburgerMenu.accountManagement")} onClick={() => onSelect("accountManagement")} />

        {isViewer && (
          <MenuRow
            icon={<span className="text-blue-400"><IconUserPlus /></span>}
            label={requestSent ? "Solicitud enviada" : requestLoading ? "Enviando..." : "Solicitar ser creador"}
            onClick={requestSent || requestLoading ? undefined : handleRequestCreator}
            hasArrow={false}
          />
        )}

        {isPending && (
          <MenuRow
            icon={<span className="text-amber-400"><IconClock /></span>}
            label="Creador — Pendiente"
            hasArrow={false}
          />
        )}

        {isAdmin && (
          <MenuRow
            icon={<span className="text-emerald-400"><IconShieldCheck /></span>}
            label="Admin: Solicitudes"
            href="/admin/creators"
          />
        )}
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
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${locale === lang.code ? "bg-blue-500/10" : "hover:bg-zinc-800"}`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{lang.nativeName}</p>
              <p className="text-xs text-zinc-500">{lang.englishName}</p>
            </div>
            {locale === lang.code && (
              <span className="text-blue-400"><IconCheck /></span>
            )}
          </button>
        ))}
        <p className="mt-6 px-4 text-xs text-zinc-600">{t("hamburgerMenu.languageChangeNote")}</p>
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
          <button onClick={onBack} className="mt-2 rounded-lg bg-zinc-800 px-4 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700">
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
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.currentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.newPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.confirmNewPassword")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
          <div className="rounded-lg bg-white p-2">
            <QRCodeDisplay url={profileUrl} />
          </div>
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-zinc-800">
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
            className="self-start rounded-lg bg-red-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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
            className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "ELIMINAR" || loading}
          className="self-start rounded-lg bg-red-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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
          className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
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
          className="self-start rounded-lg bg-amber-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.filterWordsLabel")}</label>
          <textarea
            value={filterWords}
            onChange={(e) => setFilterWords(e.target.value)}
            placeholder={t("hamburgerMenu.filterWordsPlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.hideOffensiveLabel")}</label>
          <button
            onClick={() => setHideOffensive(!hideOffensive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${hideOffensive ? "bg-blue-600" : "bg-zinc-700"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${hideOffensive ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t("hamburgerMenu.customWordsLabel")}</label>
          <textarea
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            placeholder={t("hamburgerMenu.customWordsPlaceholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {saved ? t("hamburgerMenu.savedConfirm") : t("hamburgerMenu.savePreferences")}
        </button>
      </div>
    </>
  );
}
