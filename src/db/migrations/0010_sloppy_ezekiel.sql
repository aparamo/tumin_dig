CREATE TABLE "TUMIN_saved_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"contact_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_contacts_owner_contact_uid" UNIQUE("owner_id","contact_user_id")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_products" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "TUMIN_saved_contacts" ADD CONSTRAINT "TUMIN_saved_contacts_owner_id_TUMIN_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_saved_contacts" ADD CONSTRAINT "TUMIN_saved_contacts_contact_user_id_TUMIN_users_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;