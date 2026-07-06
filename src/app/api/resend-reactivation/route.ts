import { NextResponse } from "next/server";
import { sendReactivationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email, userId } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .not("deactivated_at", "is", null)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    resolvedUserId = profiles[0].id;
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("reactivation_tokens")
    .insert({ user_id: resolvedUserId, token, expires_at: expiresAt });

  try {
    await sendReactivationEmail(email, token);
  } catch {
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
