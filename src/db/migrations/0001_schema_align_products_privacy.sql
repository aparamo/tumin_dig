ALTER TABLE "TUMIN_products" ALTER COLUMN "description" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "TUMIN_products" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_products" ADD COLUMN "show_in_profile" boolean DEFAULT true NOT NULL;