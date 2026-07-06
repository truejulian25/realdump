import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 });
  }

  await admin.auth.admin.signOut(user.id);

  return NextResponse.json({ ok: true });
}
