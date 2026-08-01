import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "creator") {
    return NextResponse.json({ error: "Ya eres creador" }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("creator_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["draft", "submitted", "in_review"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ verification: existing });
  }

  const { data: approvedVerification } = await supabase
    .from("creator_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approvedVerification) {
    return NextResponse.json({ verification: approvedVerification });
  }

  const { data: verification, error } = await supabase
    .from("creator_verifications")
    .insert({ user_id: user.id, status: "draft" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "pending", verification_status: "pending" })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "No se pudo actualizar tu perfil: " + profileError.message },
      { status: 500 }
    );
  }

  await logVerificationEvent({
    verificationId: verification.id,
    event: VERIFICATION_EVENTS.STARTED,
    actorId: user.id,
  });

  return NextResponse.json({ verification });
}
