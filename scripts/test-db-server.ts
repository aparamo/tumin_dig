/**
 * Local PGlite socket server for Playwright E2E.
 * Exposes Postgres wire protocol on 127.0.0.1:5433 so Next.js can use a normal DATABASE_URL.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(root, "src/db/migrations");
const PORT = Number(process.env.TEST_DB_PORT ?? 5433);

async function main() {
  console.log("[test-db-server] starting PGlite…");
  const pg = await PGlite.create();
  const db = drizzle(pg);
  await migrate(db, { migrationsFolder });

  // Seed roles used by Playwright storageState + flows
  const nipHash = await bcrypt.hash("1234", 4);
  await pg.exec(`
    INSERT INTO "TUMIN_users" (id, name, phone, email, nip, region, role, status, is_verified, product_ok, public_profile, residence_country, residence_state)
    VALUES
      ('e2e_socio', 'E2E Socio', '9610000001', 'socio@e2e.local', '${nipHash}', 'Túmin Totonacapan', 'SOCIO', 'ACTIVO', true, true, true, 'México', 'Veracruz'),
      ('e2e_coord_local', 'E2E Coord Local', '9610000002', 'local@e2e.local', '${nipHash}', 'Túmin Totonacapan', 'COORDINADOR_LOCAL', 'ACTIVO', true, false, true, 'México', 'Veracruz'),
      ('e2e_coord', 'E2E Coord', '9610000003', 'coord@e2e.local', '${nipHash}', 'Túmin Totonacapan', 'COORDINADOR', 'ACTIVO', true, false, true, 'México', 'Veracruz'),
      ('e2e_seller', 'E2E Seller', '9610000004', 'seller@e2e.local', '${nipHash}', 'Túmin Totonacapan', 'SOCIO', 'ACTIVO', true, true, true, 'México', 'Veracruz'),
      ('e2e_freeze_target', 'E2E Freeze Target', '9610000005', 'freeze@e2e.local', '${nipHash}', 'Túmin Totonacapan', 'SOCIO', 'ACTIVO', true, true, true, 'México', 'Veracruz')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO "TUMIN_users" (id, name, phone, nip, region, role, status, is_verified, public_profile)
    VALUES ('SYSTEM', 'Sistema Tumin', 'SYSTEM_INTERNAL', '${nipHash}', 'SISTEMA', 'SOCIO', 'CONGELADO', false, false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO "TUMIN_products" (seller_id, name, price_mxn, price_tumin, categories, region, status, show_in_profile)
    VALUES
      ('e2e_seller', 'Producto E2E', 90, 10, '["Alimentos"]'::jsonb, 'Túmin Totonacapan', 'ACTIVO', true),
      ('e2e_freeze_target', 'Producto Congelar E2E', 90, 10, '["Alimentos"]'::jsonb, 'Túmin Totonacapan', 'ACTIVO', true);

    INSERT INTO "TUMIN_transactions" (from_id, to_id, amount, concept, type)
    VALUES ('SYSTEM', 'e2e_socio', 500, 'E2E seed', 'BONO');
  `);

  const server = new PGLiteSocketServer({
    db: pg,
    port: PORT,
    host: "127.0.0.1",
    // Next.dev opens several postgres-js connections (RSC + route handlers).
    // The class default is 1 and extra clients are dropped → /api/auth/session hangs.
    maxConnections: Number(process.env.TEST_DB_MAX_CONNECTIONS ?? 20),
  });
  await server.start();
  console.log(`[test-db-server] listening on 127.0.0.1:${PORT}`);

  const shutdown = async () => {
    console.log("[test-db-server] shutting down…");
    await server.stop();
    await pg.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
