import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { ids } = body ?? {};

  const admin = createAdminClient();

  let query = admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (Array.isArray(ids) && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: "Error al marcar las notificaciones" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
