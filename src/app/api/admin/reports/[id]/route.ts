import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteVideo } from "@/lib/delete-video";

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

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body ?? {};

  const validActions = [
    "resolved",
    "dismissed",
    "needs_info",
    "delete_video",
    "deactivate_user",
  ];

  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const { data: report } = await admin
    .from("reports")
    .select("id, video_id, reported_user_id, reporter_id")
    .eq("id", id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (action === "resolved" || action === "dismissed" || action === "needs_info") {
    if (action === "resolved") {
      const note = typeof body?.note === "string" ? body.note.trim() : "";
      if (!note) {
        return NextResponse.json({ error: "Escribe la medida tomada" }, { status: 400 });
      }

      const { error } = await admin
        .from("reports")
        .update({ status: "reviewed", updated_at: now })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: "Error al actualizar el reporte" }, { status: 500 });
      }

      await insertNotification(admin, report.reporter_id, "reportReviewed", {
        reportId: id,
        note,
      });

      return NextResponse.json({ success: true });
    }

    const status = action === "dismissed" ? "dismissed" : "needs_info";
    const type = action === "dismissed" ? "reportDismissed" : "reportNeedsInfo";

    const { error } = await admin
      .from("reports")
      .update({ status, updated_at: now })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Error al actualizar el reporte" }, { status: 500 });
    }

    await insertNotification(admin, report.reporter_id, type, { reportId: id });

    return NextResponse.json({ success: true });
  }

  const { data: video } = report.video_id
    ? await admin
        .from("videos")
        .select("id, user_id, mux_asset_id, title")
        .eq("id", report.video_id)
        .single()
    : { data: null as null };

  if (action === "delete_video") {
    if (!video) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
    }

    const result = await deleteVideo(video.id, video.mux_asset_id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await insertNotification(admin, report.reporter_id, "reportVideoDeleted", {
      reportId: id,
      videoId: video.id,
    });
    await insertNotification(admin, video.user_id, "videoRemoved", {
      reportId: id,
      videoId: video.id,
      title: video.title ?? "",
    });

    const { error } = await admin
      .from("reports")
      .update({ status: "reviewed", updated_at: now })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Error al actualizar el reporte" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const targetUserId = report.video_id ? video?.user_id : report.reported_user_id;

  if (!targetUserId) {
    return NextResponse.json({ error: "Reporte sin usuario objetivo" }, { status: 400 });
  }

  const { error: deactivateError } = await admin
    .from("profiles")
    .update({ deactivated_at: now })
    .eq("id", targetUserId);

  if (deactivateError) {
    return NextResponse.json({ error: "Error al desactivar la cuenta" }, { status: 500 });
  }

  await insertNotification(admin, report.reporter_id, "reportAccountSuspended", {
    reportId: id,
    videoId: report.video_id ?? undefined,
  });
  await insertNotification(admin, targetUserId, "accountSuspended", {
    reportId: id,
    videoId: report.video_id ?? undefined,
  });

  await admin.from("reports").update({ status: "reviewed", updated_at: now }).eq("id", id);

  return NextResponse.json({ success: true });
}
