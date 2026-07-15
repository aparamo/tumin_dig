CREATE TABLE "TUMIN_invite_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TUMIN_invite_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_ads" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "TUMIN_ads" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "TUMIN_ads" ADD COLUMN "requested_until" timestamp;--> statement-breakpoint
ALTER TABLE "TUMIN_invite_tokens" ADD CONSTRAINT "TUMIN_invite_tokens_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_ads" ADD CONSTRAINT "TUMIN_ads_product_id_TUMIN_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE no action ON UPDATE no action;