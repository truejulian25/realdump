import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { profileId } = await req.json();

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profileId requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("profile_views").insert({
    profile_id: profileId,
    viewer_id: user?.id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Error al registrar vista" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}