import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteVideo } from "@/lib/delete-video";

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

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = adminProfile?.is_admin === true;

  if (video.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "No tienes permiso para eliminar este video" }, { status: 403 });
  }

  const result = await deleteVideo(id, video.mux_asset_id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
