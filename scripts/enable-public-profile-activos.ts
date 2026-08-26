/**
 * One-shot: set public_profile = true for all ACTIVO members
 * (excludes technical SISTEMA/SYSTEM/GENERAL adscripción regions).
 *
 * Run: bun run scripts/enable-public-profile-activos.ts
 */
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { and, eq, sql } from "drizzle-orm";

async function main() {
  const updated = await db
    .update(users)
    .set({ publicProfile: true })
    .where(
      and(
        eq(users.status, "ACTIVO"),
        sql`UPPER(TRIM(${users.region})) NOT IN ('SISTEMA', 'SYSTEM', 'GENERAL')`,
        eq(users.publicProfile, false)
      )
    )
    .returning({ id: users.id, name: users.name });

  console.log(`public_profile → true para ${updated.length} usuario(s) ACTIVO(s).`);
  for (const u of updated.slice(0, 50)) {
    console.log(`  ✓ ${u.name} (${u.id})`);
  }
  if (updated.length > 50) {
    console.log(`  … y ${updated.length - 50} más`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
