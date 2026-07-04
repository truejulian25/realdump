"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton({ email, avatarUrl }: { email: string | null; avatarUrl?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  if (!email) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
        <img
          src={avatarUrl ?? `https://ui-avatars.com/api/?name=${email}&background=6366f1&color=fff&size=28`}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      </div>
      <button
        onClick={handleLogout}
        className="rounded bg-zinc-800 px-3 py-1 text-sm text-white hover:bg-zinc-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
