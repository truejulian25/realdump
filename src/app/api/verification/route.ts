import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: verification } = await supabase
    .from("creator_verifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ verification: null, events: [] });
  }

  const { data: events } = await supabase
    .from("verification_events")
    .select("*")
    .eq("verification_id", verification.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ verification, events: events ?? [] });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { documentType, declaredDob, documentUrl, selfieUrl, holdingDocumentUrl } = body ?? {};

  const { data: verification } = await supabase
    .from("creator_verifications")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["draft", "denied"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: "No hay verificación en curso" }, { status: 404 });
  }

  const dob = typeof declaredDob === "string" ? declaredDob.slice(0, 10) : undefined;

  const updates: Record<string, unknown> = {};
  if (typeof documentType === "string" && documentType) updates.document_type = documentType;
  if (typeof dob === "string" && dob) updates.declared_dob = dob;
  if (typeof documentUrl === "string" && documentUrl) updates.document_url = documentUrl;
  if (typeof selfieUrl === "string" && selfieUrl) updates.selfie_url = selfieUrl;
  if (typeof holdingDocumentUrl === "string" && holdingDocumentUrl) updates.holding_document_url = holdingDocumentUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ verification });
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("creator_verifications")
    .update(updates)
    .eq("id", verification.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (documentType && documentType !== verification.document_type) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.DOCUMENT_TYPE,
      actorId: user.id,
      metadata: { documentType },
    });
  }
  if (dob && dob !== verification.declared_dob) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.DOB_DECLARED,
      actorId: user.id,
      metadata: { declaredDob: dob },
    });
  }
  if (documentUrl && documentUrl !== verification.document_url) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.DOCUMENT_UPLOADED,
      actorId: user.id,
      metadata: { path: documentUrl },
    });
  }
  if (selfieUrl && selfieUrl !== verification.selfie_url) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.SELFIE_UPLOADED,
      actorId: user.id,
      metadata: { path: selfieUrl },
    });
  }
  if (holdingDocumentUrl && holdingDocumentUrl !== verification.holding_document_url) {
    await logVerificationEvent({
      verificationId: verification.id,
      event: VERIFICATION_EVENTS.HOLDING_UPLOADED,
      actorId: user.id,
      metadata: { path: holdingDocumentUrl },
    });
  }

  return NextResponse.json({ verification: updated });
}
