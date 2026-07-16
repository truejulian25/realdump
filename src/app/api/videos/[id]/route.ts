import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAsset } from "@/lib/mux";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("user_id, mux_asset_id")
    .eq("id", id)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
  }

  if (video.user_id !== user.id) {
    return NextResponse.json({ error: "No tienes permiso para eliminar este video" }, { status: 403 });
  }

  if (video.mux_asset_id) {
    try {
      await deleteAsset(video.mux_asset_id);
    } catch {
      console.warn("No se pudo eliminar el asset de Mux, continuando...");
    }
  }

  const admin = createAdminClient();

  const tables = ["likes", "comments", "saved_videos", "reports"] as const;
  for (const table of tables) {
    const { error: delError } = await admin.from(table).delete().eq("video_id", id);
    if (delError) {
      console.error(`Error deleting from ${table}:`, delError);
    }
  }

  const { error: deleteError } = await admin.from("videos").delete().eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Error al eliminar el video" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
