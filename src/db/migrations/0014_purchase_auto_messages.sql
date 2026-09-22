CREATE TYPE "public"."auto_message_type" AS ENUM('PURCHASE', 'TRANSFER');--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "auto_message_purchase" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "auto_message_transfer" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD COLUMN "product_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "TUMIN_transactions_product_id_TUMIN_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_from_product_idx" ON "TUMIN_transactions" ("from_id", "product_id", "created_at");--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN "is_automated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN "automated_type" "auto_message_type";--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD COLUMN "metadata" jsonb;
