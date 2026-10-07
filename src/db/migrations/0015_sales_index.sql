CREATE INDEX IF NOT EXISTS "transactions_to_product_idx" ON "TUMIN_transactions" ("to_id", "product_id", "created_at");
