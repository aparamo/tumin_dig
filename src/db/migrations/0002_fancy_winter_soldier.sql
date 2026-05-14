ALTER TABLE "TUMIN_users" ALTER COLUMN "public_profile" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ALTER COLUMN "show_phone" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "TUMIN_transactions_idempotency_key_unique" UNIQUE("idempotency_key");