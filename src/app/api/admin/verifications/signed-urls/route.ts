import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERIFICATION_STORAGE_BUCKET } from "@/lib/verification";

export async function POST(req: Request) {
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

  const { id } = await req.json().catch(() => ({}));
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const { data: verification } = await admin
    .from("creator_verifications")
    .select("document_url, selfie_url, holding_document_url")
    .eq("id", id)
    .single();

  if (!verification) {
    return NextResponse.json({ error: "Verificación no encontrada" }, { status: 404 });
  }

  const bucket = admin.storage.from(VERIFICATION_STORAGE_BUCKET);
  const sign = async (path: string | null) => {
    if (!path) return null;
    const { data } = await bucket.createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const [documentUrl, selfieUrl, holdingUrl] = await Promise.all([
    sign(verification.document_url),
    sign(verification.selfie_url),
    sign(verification.holding_document_url),
  ]);

  return NextResponse.json({ documentUrl, selfieUrl, holdingUrl });
}
