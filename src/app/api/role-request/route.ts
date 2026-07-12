import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("role_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya tienes una solicitud pendiente" }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("role_requests").insert({
    user_id: user.id,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
  }

  await supabase.from("profiles").update({ role: "pending" }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
