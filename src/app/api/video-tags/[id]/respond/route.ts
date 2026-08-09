import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

function insertNotification(
  admin: AdminClient,
  userId: string,
  type: string,
  data: Record<string, unknown> = {},
) {
  return admin.from("notifications").insert({ user_id: userId, type, data });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action !== "approved" && action !== "rejected") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const { data: tag, error: tagError } = await admin
    .from("video_tags")
    .select("id, video_id, user_id, status")
    .eq("id", id)
    .single();

  if (tagError || !tag) {
    return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
  }

  if (tag.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (tag.status !== "pending") {
    return NextResponse.json({ error: "Etiqueta ya respondida" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("video_tags")
    .update({ status: action, responded_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Error al actualizar la etiqueta" }, { status: 500 });
  }

  const { data: video } = await admin
    .from("videos")
    .select("id, user_id, title")
    .eq("id", tag.video_id)
    .single();

  const { data: responder } = await admin
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  if (video) {
    await insertNotification(admin, video.user_id, action === "approved" ? "videoTagAccepted" : "videoTagRejected", {
      videoId: video.id,
      videoTitle: video.title ?? "",
      name: responder?.display_name || responder?.username || "",
    });
  }

  return NextResponse.json({ ok: true });
}