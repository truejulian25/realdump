import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: verification } = await supabase
    .from("creator_verifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: "No hay verificación en curso" }, { status: 404 });
  }

  const missing: string[] = [];
  if (!verification.document_type) missing.push("document_type");
  if (!verification.declared_dob) missing.push("declared_dob");
  if (!verification.document_url) missing.push("document_url");
  if (!verification.selfie_url) missing.push("selfie_url");
  if (!verification.holding_document_url) missing.push("holding_document_url");

  if (missing.length > 0) {
    return NextResponse.json({ error: "Faltan pasos por completar", missing }, { status: 400 });
  }

  const consentAt = new Date().toISOString();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const { error: updateError } = await admin
    .from("creator_verifications")
    .update({
      status: "submitted",
      submitted_at: consentAt,
      consent_biometric_at: consentAt,
      consent_data_at: consentAt,
      consent_ip: ip,
      content_declaration_at: consentAt,
      updated_at: consentAt,
    })
    .eq("id", verification.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({ verification_status: "pending" })
    .eq("id", user.id);

  await logVerificationEvent({
    verificationId: verification.id,
    event: VERIFICATION_EVENTS.CONSENT_ACCEPTED,
    actorId: user.id,
    metadata: { ip },
  });
  await logVerificationEvent({
    verificationId: verification.id,
    event: VERIFICATION_EVENTS.CONTENT_DECLARATION,
    actorId: user.id,
    metadata: { ip },
  });
  await logVerificationEvent({
    verificationId: verification.id,
    event: VERIFICATION_EVENTS.SUBMITTED,
    actorId: user.id,
  });

  return NextResponse.json({ ok: true });
}
