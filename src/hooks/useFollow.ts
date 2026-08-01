import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsFollowing(targetUserId: string | undefined) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refetch = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    if (!user || !targetUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const isNetworkError = (err: unknown) => {
      const e = err as { code?: string; message?: string };
      return e?.code === "FETCH_ERROR" || /failed to fetch|networkerror/i.test(e?.message ?? "");
    };
    const fetchFollowState = async () => {
      let lastError: { code?: string; message?: string } | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
        if (!error) return { data, error: null };
        lastError = error;
        if (cancelled || !isNetworkError(error) || attempt === 2) break;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
      return { data: null, error: lastError };
    };
    const check = async () => {
      try {
        const { data, error: err } = await fetchFollowState();
        if (!cancelled) {
          if (err) throw new Error(err.message || "Error de permisos en follows");
          setIsFollowing(!!data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("useIsFollowing error:", e);
          setError(e instanceof Error ? e.message : "Error al verificar follow");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, targetUserId, supabase, refreshTick]);

  return { isFollowing, loading, error, refetch };
}

export function useFollowerCount(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const { count: c, error: err } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId);
        if (!cancelled) {
          if (err) throw new Error(err.message || "Error de permisos en follows");
          setCount(c ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("useFollowerCount error:", e);
        }
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [userId, supabase]);

  return count;
}

export function useFollowingCount(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const { count: c, error: err } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId);
        if (!cancelled) {
          if (err) throw new Error(err.message || "Error de permisos en follows");
          setCount(c ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("useFollowingCount error:", e);
        }
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [userId, supabase]);

  return count;
}

export function useFollowToggle(targetUserId: string | undefined) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const { isFollowing: serverFollowing, loading, refetch } = useIsFollowing(targetUserId);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevTarget, setPrevTarget] = useState(targetUserId);
  if (prevTarget !== targetUserId) {
    setPrevTarget(targetUserId);
    setFollowing(null);
  }

  const isFollowing = following ?? serverFollowing;

  const toggle = useCallback(async () => {
    if (!user || !targetUserId || toggling) return;
    setToggling(true);
    setError(null);
    const wasFollowing = following ?? serverFollowing;
    try {
      if (wasFollowing) {
        const { error: err } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (err) throw new Error(err.message || "Error de permisos en follows");
      } else {
        const { error: err } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });
        if (err && err.code !== "23505") {
          throw new Error(err.message || "Error de permisos en follows");
        }
      }
      setFollowing(!wasFollowing);
      refetch();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al cambiar follow";
      console.error("useFollowToggle error:", e);
      setError(message);
    } finally {
      setToggling(false);
    }
  }, [user, targetUserId, toggling, following, serverFollowing, supabase, refetch]);

  return { isFollowing, loading, toggling, error, toggle };
}
