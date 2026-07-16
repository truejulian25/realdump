import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsFollowing(targetUserId: string | undefined) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !targetUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const { data, error: err } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
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
  }, [user, targetUserId, supabase]);

  return { isFollowing, loading, error };
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
  const { isFollowing, loading } = useIsFollowing(targetUserId);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFollowingRef = useRef(isFollowing);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

  const toggle = useCallback(async () => {
    if (!user || !targetUserId || toggling) return;
    setToggling(true);
    setError(null);
    const wasFollowing = isFollowingRef.current;
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
        if (err) throw new Error(err.message || "Error de permisos en follows");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al cambiar follow";
      console.error("useFollowToggle error:", e);
      setError(message);
    } finally {
      setToggling(false);
    }
  }, [user, targetUserId, toggling, supabase]);

  return { isFollowing, loading, toggling, error, toggle };
}
