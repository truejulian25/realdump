import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("reports")
    .select(`
      *,
      video:videos(id, title, thumbnail_url, video_url, mux_playback_id, user_id, profiles(username, display_name, avatar_url, deactivated_at)),
      reported:profiles!reports_reported_user_id_fkey(username, display_name, avatar_url, deactivated_at),
      reporter:profiles!reports_reporter_id_fkey(username, display_name, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error al cargar los reportes" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
