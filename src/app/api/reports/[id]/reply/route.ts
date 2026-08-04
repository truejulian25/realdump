import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const reply = typeof body?.reply === "string" ? body.reply.trim() : "";

  if (!reply) {
    return NextResponse.json({ error: "Escribe tu respuesta" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: report } = await admin
    .from("reports")
    .select("id, reporter_id")
    .eq("id", id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  if (report.reporter_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: updated, error } = await admin
    .from("reports")
    .update({
      reporter_reply: reply,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, status, reporter_reply, updated_at")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Error al enviar la respuesta" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
