import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { video_id, profile_id, reason, description } = await req.json();

  const hasVideoTarget = typeof video_id === "string" && video_id.trim() !== "";
  const hasProfileTarget = typeof profile_id === "string" && profile_id.trim() !== "";

  if (hasVideoTarget === hasProfileTarget) {
    return Response.json(
      { error: "Debe indicarse exactamente un target (video_id o profile_id)" },
      { status: 400 },
    );
  }

  if ((hasVideoTarget && !reason) || !description?.trim()) {
    return Response.json({ error: "reason y description son requeridos" }, { status: 400 });
  }

  const videoReasons = [
    "Aparezco en este video y no autoricé su publicación",
    "Contenido violento",
    "Spam o engaño",
    "Otro",
  ];

  const profileReasons = [
    "Perfil falso o suplantación de identidad",
    "Spam o engaño",
    "Contenido inapropiado",
    "Otro",
  ];

  const validReasons = hasVideoTarget ? videoReasons : profileReasons;

  if (hasVideoTarget && !validReasons.includes(reason)) {
    return Response.json({ error: "Motivo de reporte inválido" }, { status: 400 });
  }

  const finalReason =
    hasProfileTarget && (typeof reason !== "string" || reason.trim() === "")
      ? "Otro"
      : reason;

  if (hasProfileTarget && !validReasons.includes(finalReason)) {
    return Response.json({ error: "Motivo de reporte inválido" }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    video_id: hasVideoTarget ? video_id : null,
    reported_user_id: hasProfileTarget ? profile_id.trim() : null,
    reporter_id: user.id,
    reason: finalReason,
    description: description.trim(),
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
