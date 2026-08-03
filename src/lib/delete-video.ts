import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAsset } from "@/lib/mux";

export async function deleteVideo(videoId: string, muxAssetId: string | null) {
  if (muxAssetId) {
    try {
      await deleteAsset(muxAssetId);
    } catch {
      console.warn("No se pudo eliminar el asset de Mux, continuando...");
    }
  }

  const admin = createAdminClient();

  const tables = ["likes", "comments", "saved_videos", "reports"] as const;
  for (const table of tables) {
    const { error: delError } = await admin.from(table).delete().eq("video_id", videoId);
    if (delError) {
      console.error(`Error deleting from ${table}:`, delError);
    }
  }

  const { error: deleteError } = await admin.from("videos").delete().eq("id", videoId);

  if (deleteError) {
    return { ok: false as const, error: "Error al eliminar el video" };
  }

  return { ok: true as const };
}
