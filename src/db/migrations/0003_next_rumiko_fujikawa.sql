ALTER TABLE "TUMIN_users" ADD COLUMN "enrollment_method" text DEFAULT 'REGION' NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "enrollment_method_other" text;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "residence_country" text;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "residence_state" text;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "residence_city" text;--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "residence_postal_code" text;