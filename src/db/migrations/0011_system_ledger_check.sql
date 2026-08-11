-- Harden SYSTEM ledger rules at the database layer (defense in depth vs API bugs / direct SQL).
-- Historical issuer may be SYSTEM or SISTEMA (sheets migration); peer transfers must not involve them.

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
