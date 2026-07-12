import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!admin?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { requestId, action } = await req.json();

  if (!requestId || !["approved", "denied"].includes(action)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: roleRequest } = await supabase
    .from("role_requests")
    .select("user_id, status")
    .eq("id", requestId)
    .single();

  if (!roleRequest || roleRequest.status !== "pending") {
    return NextResponse.json({ error: "Solicitud no encontrada o ya procesada" }, { status: 404 });
  }

  const newRole = action === "approved" ? "creator" : "viewer";

  const { error: updateError } = await supabase
    .from("role_requests")
    .update({
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: "Error al actualizar solicitud" }, { status: 500 });
  }

  await supabase.from("profiles").update({ role: newRole }).eq("id", roleRequest.user_id);

  return NextResponse.json({ ok: true });
}
