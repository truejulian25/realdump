import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { videoId } = await req.json();

  if (!videoId || typeof videoId !== "string") {
    return NextResponse.json({ error: "videoId requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("video_views").insert({
    video_id: videoId,
    viewer_id: user?.id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Error al registrar vista" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}