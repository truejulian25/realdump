"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Profile, RoleRequest } from "@/types";

export default function AdminCreatorsPage() {
  const { profile, loading } = useAuth();
  const supabase = createClient();
  const [requests, setRequests] = useState<(RoleRequest & { profile: Profile | null })[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchRequests();
    }
  }, [profile?.is_admin]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("role_requests")
      .select("*, profile:profiles!role_requests_user_id_fkey(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (data) setRequests(data as any);
  };

  const handleAction = async (requestId: string, action: "approved" | "denied") => {
    setProcessing(requestId);
    await fetch("/api/admin/role-request", {
      method: "POST",
      body: JSON.stringify({ requestId, action }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-14">
        <p className="text-zinc-500">No tienes acceso a esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-14 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-lg font-bold text-white mb-6">Solicitudes de creadores</h1>

        {requests.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay solicitudes pendientes.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {req.profile?.display_name ?? req.profile?.username ?? "Usuario"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    @{req.profile?.username ?? "—"} &middot;{" "}
                    {new Date(req.created_at).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.id, "approved")}
                    disabled={processing === req.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "denied")}
                    disabled={processing === req.id}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    Denegar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
