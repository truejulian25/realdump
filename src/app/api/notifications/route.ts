import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: unread } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .is("read_at", null);

  const { data: notifications, error } = await admin
    .from("notifications")
    .select("id, type, data, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Error al cargar las notificaciones" }, { status: 500 });
  }

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount: unread?.length ?? 0,
  });
}
