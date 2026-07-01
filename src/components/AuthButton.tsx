"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton({ email }: { email: string | null }) {
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
    <div className="flex items-center gap-4">
      <span className="text-sm text-zinc-400">{email}</span>
      <button
        onClick={handleLogout}
        className="rounded bg-zinc-800 px-3 py-1 text-sm text-white hover:bg-zinc-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
