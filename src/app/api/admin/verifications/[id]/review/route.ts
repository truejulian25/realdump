import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logVerificationEvent, VERIFICATION_EVENTS } from "@/lib/verification";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, denialReason, verifiedDob } = body ?? {};

  if (!["approved", "denied"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const { data: verification } = await admin
    .from("creator_verifications")
    .select("user_id, status, declared_dob")
    .eq("id", id)
    .single();

  if (!verification || verification.status !== "submitted") {
    return NextResponse.json({ error: "Verificación no encontrada o ya procesada" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: action,
    reviewed_by: user.id,
    reviewed_at: now,
    updated_at: now,
  };

  if (action === "denied") {
    if (!denialReason || typeof denialReason !== "string") {
      return NextResponse.json({ error: "Motivo de denegación requerido" }, { status: 400 });
    }
    update.denial_reason = denialReason;
  } else {
    update.verified_dob = verifiedDob || verification.declared_dob;
  }

  const { error } = await admin
    .from("creator_verifications")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "approved") {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: "creator",
        verification_status: "approved",
        verified_at: now,
        verified_dob: update.verified_dob,
      })
      .eq("id", verification.user_id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  } else {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: "viewer",
        verification_status: "denied",
      })
      .eq("id", verification.user_id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  await logVerificationEvent({
    verificationId: id,
    event: action === "approved" ? VERIFICATION_EVENTS.APPROVED : VERIFICATION_EVENTS.DENIED,
    actorId: user.id,
    metadata:
      action === "denied"
        ? { denialReason }
        : { verifiedDob: update.verified_dob },
  });

  return NextResponse.json({ ok: true });
}
