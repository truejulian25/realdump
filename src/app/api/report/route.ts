import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { video_id, reason, description } = await req.json();

  if (!video_id || !reason || !description?.trim()) {
    return Response.json({ error: "video_id, reason y description son requeridos" }, { status: 400 });
  }

  const validReasons = [
    "Aparezco en este video y no autoricé su publicación",
    "Contenido violento",
    "Spam o engaño",
    "Otro",
  ];

  if (!validReasons.includes(reason)) {
    return Response.json({ error: "Motivo de reporte inválido" }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    video_id,
    reporter_id: user.id,
    reason,
    description: description.trim(),
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
