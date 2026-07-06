import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: row, error: findError } = await admin
    .from("reactivation_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .is("used_at", null)
    .single();

  if (findError || !row) {
    return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 400 });
  }

  await admin
    .from("profiles")
    .update({ deactivated_at: null })
    .eq("id", row.user_id);

  await admin
    .from("reactivation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.json({ ok: true });
}
