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

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const videoId = typeof body?.videoId === "string" ? body.videoId : "";
  const rawIds = Array.isArray(body?.userIds) ? body.userIds : [];

  if (!videoId) {
    return NextResponse.json({ error: "videoId requerido" }, { status: 400 });
  }

  const userIds = [
    ...new Set((rawIds as unknown[]).filter((x): x is string => typeof x === "string")),
  ];

  const { data: video } = await admin
    .from("videos")
    .select("id, user_id, title")
    .eq("id", videoId)
    .single();

  if (!video) {
    return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
  }

  if (video.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const ownerName = ownerProfile?.display_name || ownerProfile?.username || "";

  let validTargets: { id: string; username: string; display_name: string | null }[] = [];

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, display_name, role, deactivated_at, deleted_at")
      .in("id", userIds);

    if (!profiles) {
      return NextResponse.json({ error: "Creadores no encontrados" }, { status: 400 });
    }

    validTargets = profiles.filter(
      (p) => p.role === "creator" && p.id !== user.id && !p.deactivated_at && !p.deleted_at,
    );

    if (validTargets.length !== userIds.length) {
      return NextResponse.json({ error: "Solo puedes etiquetar creadores" }, { status: 400 });
    }
  }

  const { data: existing } = await admin
    .from("video_tags")
    .select("id")
    .eq("video_id", videoId);

  for (const tag of existing ?? []) {
    await admin.from("video_tags").delete().eq("id", tag.id);
  }

  const targetIds = validTargets.map((t) => t.id);

  for (const target of validTargets) {
    const { data: inserted } = await admin
      .from("video_tags")
      .insert({ video_id: videoId, user_id: target.id, status: "pending" })
      .select("id")
      .single();

    await insertNotification(admin, target.id, "videoTag", {
      videoTagId: inserted?.id,
      videoId,
      videoTitle: video.title ?? "",
      tagger: ownerName,
    });
  }

  return NextResponse.json({ ok: true, tagged: targetIds });
}