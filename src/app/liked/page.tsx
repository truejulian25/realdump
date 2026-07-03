"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function LikedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 pt-14 pb-20">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <p className="text-zinc-500">Tus videos favoritos aparecerán aquí</p>
      {user && (
        <p className="text-xs text-zinc-600">{user.email}</p>
      )}
    </div>
  );
}
