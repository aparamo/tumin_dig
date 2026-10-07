-- 0011 was recorded in drizzle.__drizzle_migrations but the CHECK is absent on this database.
-- Re-assert it. Existing rows were verified to satisfy the predicate before applying.
DO $$ BEGIN
  ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "chk_tumin_system_ledger" CHECK (
    (
      "type" = 'TRANSFERENCIA'
      AND "from_id" NOT IN ('SYSTEM', 'SISTEMA')
      AND "to_id" NOT IN ('SYSTEM', 'SISTEMA')
    )
    OR
    (
      "type" IN ('BONO', 'MINADO', 'PAGO_TRABAJO')
      AND "from_id" IN ('SYSTEM', 'SISTEMA')
    )
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
