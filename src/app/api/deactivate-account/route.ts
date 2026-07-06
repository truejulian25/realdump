import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReactivationEmail } from "@/lib/email";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Error al desactivar la cuenta" }, { status: 500 });
  }

  const { error: tokenError } = await admin
    .from("reactivation_tokens")
    .insert({ user_id: user.id, token, expires_at: expiresAt });

  if (tokenError) {
    return NextResponse.json({ error: "Error al generar token" }, { status: 500 });
  }

  try {
    await sendReactivationEmail(user.email!, token);
  } catch {
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }

  await admin.auth.admin.signOut(user.id);

  return NextResponse.json({ ok: true });
}
