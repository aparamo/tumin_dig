CREATE TYPE "public"."password_reset_channel" AS ENUM('EMAIL');--> statement-breakpoint
CREATE TABLE "TUMIN_password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"channel" "password_reset_channel" NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TUMIN_password_resets" ADD CONSTRAINT "TUMIN_password_resets_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;