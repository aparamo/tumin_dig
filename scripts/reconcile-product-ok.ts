import { db } from "../src/db";
import { users, products } from "../src/db/schema";
import { eq, and, count } from "drizzle-orm";

async function main() {
  const allUsers = await db
    .select({ id: users.id, name: users.name, productOk: users.productOk })
    .from(users);
  let fixed = 0;

  for (const user of allUsers) {
    const [{ val }] = await db
      .select({ val: count() })
      .from(products)
      .where(and(eq(products.sellerId, user.id), eq(products.status, "ACTIVO")));

    const shouldBeOk = Number(val) > 0;
    if (user.productOk !== shouldBeOk) {
      await db.update(users).set({ productOk: shouldBeOk }).where(eq(users.id, user.id));
      console.log(`✓ ${user.name} (${user.id}): productOk ${user.productOk} → ${shouldBeOk}`);
      fixed++;
    }
  }
  console.log(`\nReconciliación completa. ${fixed} usuario(s) corregido(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
