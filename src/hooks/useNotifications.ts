import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("failed to fetch notifications");
  }
  return res.json();
}

export function useNotifications(enabled = true) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled,
  });
}

export function useUnreadCount(enabled = true) {
  const { data } = useNotifications(enabled);
  return data?.unreadCount ?? 0;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return async (ids?: string[]) => {
    const res = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      throw new Error("failed to mark notifications read");
    }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}
