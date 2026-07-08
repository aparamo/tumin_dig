CREATE TYPE "public"."admin_action" AS ENUM('FREEZE', 'UNFREEZE', 'VERIFY_IDENTITY', 'VERIFY_JOB', 'REJECT_JOB', 'APPROVE_AD', 'REJECT_AD', 'CREATE_SMART_AD', 'DELETE_SMART_AD', 'UPDATE_ROLE', 'DEACTIVATE_PRODUCT', 'CLAIM_AUDIT_REWARD');--> statement-breakpoint
CREATE TABLE "TUMIN_admin_actions_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"target_user_id" text,
	"target_product_id" uuid,
	"target_ad_id" uuid,
	"action" "admin_action" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_smart_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"image_url" text,
	"link_url" text,
	"target_region" text,
	"target_state" text,
	"active_from" timestamp DEFAULT now() NOT NULL,
	"active_until" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TUMIN_admin_actions_log" ADD CONSTRAINT "TUMIN_admin_actions_log_actor_id_TUMIN_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_admin_actions_log" ADD CONSTRAINT "TUMIN_admin_actions_log_target_user_id_TUMIN_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_admin_actions_log" ADD CONSTRAINT "TUMIN_admin_actions_log_target_product_id_TUMIN_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_admin_actions_log" ADD CONSTRAINT "TUMIN_admin_actions_log_target_ad_id_TUMIN_ads_id_fk" FOREIGN KEY ("target_ad_id") REFERENCES "public"."TUMIN_ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_smart_ads" ADD CONSTRAINT "TUMIN_smart_ads_created_by_TUMIN_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;