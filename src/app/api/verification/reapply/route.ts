import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: verification } = await supabase
    .from("creator_verifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "denied")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: "No hay verificación denegada" }, { status: 404 });
  }

  const { error } = await supabase
    .from("creator_verifications")
    .update({
      status: "draft",
      reviewed_by: null,
      reviewed_at: null,
      verified_dob: null,
      denial_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", verification.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ role: "pending", verification_status: "pending" })
    .eq("id", user.id);

  await logVerificationEvent({
    verificationId: verification.id,
    event: VERIFICATION_EVENTS.RESTARTED,
    actorId: user.id,
  });

  return NextResponse.json({ ok: true });
}
