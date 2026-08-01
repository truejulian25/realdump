import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function POST() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .single();

  if (profile?.role === "creator") {
    return NextResponse.json({ ok: true });
  }

  if (profile?.verification_status !== "approved") {
    return NextResponse.json({ error: "No estás verificado" }, { status: 403 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: verification } = await admin
    .from("creator_verifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (verification) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.ROLE_ACTIVATED,
      actorId: user.id,
    });
  }

  return NextResponse.json({ ok: true });
}
