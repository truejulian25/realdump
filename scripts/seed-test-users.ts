import { createClient } from "@supabase/supabase-js";
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

async function batchUpsert<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: T[],
  batchSize = 500
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch as any, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) {
      throw new Error(`[${table}] batch ${i}-${i + batch.length}: ${error.message}`);
    }
    process.stdout.write(`\r  ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
  }
  console.log();
}

async function batchInsert<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: T[],
  batchSize = 500
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch as any);
    if (error) {
      throw new Error(`[${table}] batch ${i}-${i + batch.length}: ${error.message}`);
    }
    process.stdout.write(`\r  ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
  }
  console.log();
}

async function findExistingAuthUsers(
  supabase: ReturnType<typeof createClient>,
  emails: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
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
      if (u.email && emails.includes(u.email)) {
        map.set(u.email, u.id);
      }
    }
    hasMore = users.length === 1000;
  }
  return map;
}

async function main() {
  console.log(" Seed: 50 usuarios de prueba\n");

  const supabaseUrl = loadEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = loadEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const USER_COUNT = 50;
  const FILLER_COUNT = 3500;
  const FOLLOW_MIN = 200;
  const FOLLOW_MAX = 3500;
  const PASSWORD = "129800";
  const CONCURRENCY = 5;

  // ── 1. Auth users (test) ────────────────────────────────
  console.log("1. Creando usuarios auth (test)...");
  const testEmails = Array.from(
    { length: USER_COUNT },
    (_, i) => `testuser_${String(i + 1).padStart(2, "0")}@test.com`
  );
  const existingTest = await findExistingAuthUsers(supabase, testEmails);
  console.log(`   ${existingTest.size} / ${USER_COUNT} ya existen`);

  const testUserIds: string[] = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const email = testEmails[i];
    if (existingTest.has(email)) {
      testUserIds.push(existingTest.get(email)!);
      continue;
    }
    const padded = String(i + 1).padStart(2, "0");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: `testuser_${padded}`, role: "viewer" },
    });
    if (error) {
      console.error(`  ✗ ${email}: ${error.message}`);
    } else {
      testUserIds.push(data.user.id);
      console.log(`  ✓ ${email}`);
    }
    await sleep(300);
  }
  console.log(`   Total: ${testUserIds.length} usuarios test\n`);
  if (testUserIds.length === 0) {
    console.error("No se crearon usuarios test. Abortando.");
    process.exit(1);
  }

  // ── 2. Auth users (filler) ──────────────────────────────
  console.log("2. Creando usuarios auth (filler)...");
  const fillerEmails = Array.from(
    { length: FILLER_COUNT },
    (_, i) => `filler_${String(i + 1).padStart(5, "0")}@test.com`
  );
  const existingFiller = await findExistingAuthUsers(supabase, fillerEmails);
  console.log(`   ${existingFiller.size} / ${FILLER_COUNT} ya existen`);

  const fillerUserIds: string[] = [];
  const toCreate = fillerEmails.filter((e) => !existingFiller.has(e));

  for (let i = 0; i < toCreate.length; i += CONCURRENCY) {
    const batch = toCreate.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((email, j) => {
        const idx = fillerEmails.indexOf(email);
        const padded = String(idx + 1).padStart(5, "0");
        return supabase.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { username: `filler_${padded}`, role: "viewer" },
        });
      })
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value.data?.user) {
        fillerUserIds.push(r.value.data.user.id);
      } else if (r.status === "rejected") {
        const email = batch[j];
        if (r.reason?.message?.includes("already exists")) {
          // should not happen since we filtered existing, but just in case
        } else {
          console.error(`  ✗ ${email}: ${r.reason}`);
        }
      }
    }
    if ((i / CONCURRENCY) % 20 === 0) {
      process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, toCreate.length)} / ${toCreate.length}`);
    }
    await sleep(150);
  }
  console.log(`\r  ${fillerUserIds.length + existingFiller.size} / ${FILLER_COUNT} usuarios filler`);

  const allFillerIds = [
    ...fillerUserIds,
    ...fillerEmails.filter((e) => existingFiller.has(e)).map((e) => existingFiller.get(e)!),
  ];
  console.log();

  // ── 3. Profiles ─────────────────────────────────────────
  console.log("3. Creando profiles...");

  const allIds = [...testUserIds, ...allFillerIds];
  const { data: allUsersData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 10000,
  });
  const emailById = new Map(
    (allUsersData?.users ?? [])
      .filter((u) => u.email && allIds.includes(u.id))
      .map((u) => [u.id, u.email!])
  );

  const profileRows = allIds.map((id) => {
    const email = emailById.get(id) ?? "";
    const username = email.replace(/@test\.com$/, "");
    const displayName = username
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { id, username, display_name: displayName, role: "viewer" as const, is_admin: false };
  });

  console.log(`   Insertando/actualizando ${profileRows.length} profiles...`);
  await batchUpsert(supabase, "profiles", profileRows, 500);

  // ── 4. Follows ──────────────────────────────────────────
  console.log("\n4. Creando follows...");
  const followRows: { follower_id: string; following_id: string }[] = [];
  const userStats: { email: string; following: number; followers: number }[] = [];

  for (let i = 0; i < testUserIds.length; i++) {
    const padded = String(i + 1).padStart(2, "0");
    const email = `testuser_${padded}@test.com`;
    const followingCount = randomInt(FOLLOW_MIN, FOLLOW_MAX);
    const followersCount = randomInt(FOLLOW_MIN, FOLLOW_MAX);

    for (const fid of shuffleAndPick(allFillerIds, followingCount)) {
      followRows.push({ follower_id: testUserIds[i], following_id: fid });
    }
    for (const fid of shuffleAndPick(allFillerIds, followersCount)) {
      followRows.push({ follower_id: fid, following_id: testUserIds[i] });
    }

    userStats.push({ email, following: followingCount, followers: followersCount });
  }

  console.log(`   Insertando ${followRows.length.toLocaleString()} registros...`);
  await batchInsert(supabase, "follows", followRows, 1000);

  // ── Summary ─────────────────────────────────────────────
  console.log("\n" + "".repeat(55));
  console.log("  SEED COMPLETADO");
  console.log("".repeat(55));
  console.log(`  Usuarios test:     ${testUserIds.length}`);
  console.log(`  Usuarios filler:   ${allFillerIds.length}`);
  console.log(`  Follows insertados: ${followRows.length.toLocaleString()}`);
  console.log(`  Contrasena:        ${PASSWORD}`);
  console.log("".repeat(55));
  console.log("  Email                            Siguiendo  Seguidores");
  console.log("  " + "".repeat(46));
  for (const u of userStats) {
    console.log(
      `  ${u.email.padEnd(32)} ${String(u.following).padStart(8)}  ${String(u.followers).padStart(8)}`
    );
  }
  console.log("".repeat(55) + "\n");
}

main().catch((err) => {
  console.error("\n Error:", err);
  process.exit(1);
});
