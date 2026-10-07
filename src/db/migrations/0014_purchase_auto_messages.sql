DO $$ BEGIN
  CREATE TYPE "public"."auto_message_type" AS ENUM('PURCHASE', 'TRANSFER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "auto_message_purchase" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "auto_message_transfer" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD COLUMN IF NOT EXISTS "product_id" uuid;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD COLUMN IF NOT EXISTS "product_snapshot" jsonb;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "TUMIN_transactions_product_id_TUMIN_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_from_product_idx" ON "TUMIN_transactions" ("from_id", "product_id", "created_at");--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN IF NOT EXISTS "is_automated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN IF NOT EXISTS "automated_type" "auto_message_type";--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
