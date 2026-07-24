import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnvVar(key: string): string {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k === key) return v;
  }
  throw new Error(`Missing env var: ${key}`);
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page++,
      perPage: 1000,
    });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email === email) return u.id;
    }
    hasMore = users.length === 1000;
  }
  return null;
}

async function main() {
  const supabaseUrl = loadEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = loadEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "testuser_02@test.com";
  console.log(`Buscando ${email}...`);

  const userId = await findUserByEmail(supabase, email);
  if (!userId) {
    console.error(`Usuario ${email} no encontrado`);
    process.exit(1);
  }
  console.log(`Encontrado: ${userId}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", userId);

  if (profileError) {
    console.error("Error al actualizar rol:", profileError.message);
    process.exit(1);
  }
  console.log("Rol actualizado a creator");

  const videos = [
    { file: "public/videos/IMG_5144.MOV", title: "IMG_5144", description: "Video de prueba 1" },
    { file: "public/videos/video1.mp4", title: "video1", description: "Video de prueba 2" },
  ];

  for (const v of videos) {
    const filePath = path.resolve(process.cwd(), v.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${v.file}`);
      continue;
    }

    const { error: insertError } = await supabase.from("videos").insert({
      user_id: userId,
      title: v.title,
      description: v.description,
      video_url: `/videos/${path.basename(v.file)}`,
      hashtags: ["prueba"],
      mux_playback_id: null,
      mux_asset_id: null,
    });

    if (insertError) {
      console.error(`Error al insertar ${v.title}: ${insertError.message}`);
    } else {
      console.log(`Video insertado: ${v.title}`);
    }
  }

  console.log("\nListo!");
}

main().catch((err) => {
  console.error("\nError:", err);
  process.exit(1);
});