import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const SYSTEM_USER_ID = "SYSTEM";

type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function ensureSystemUser(tx?: Tx) {
  const executor = tx ?? db;
  const existing = await executor
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, SYSTEM_USER_ID))
    .limit(1);

  if (existing.length > 0) return;

  const secret = process.env.SYSTEM_NIP_SECRET ?? "rotate-me-immediately";
  await executor.insert(users).values({
    id: SYSTEM_USER_ID,
    name: "Sistema Tumin",
    phone: "SYSTEM_INTERNAL",
    nip: await bcrypt.hash(secret, 10),
    region: "SISTEMA",
    status: "CONGELADO",
    role: "COORDINADOR",
  });
}
