CREATE TYPE "public"."contact_channel" AS ENUM('whatsapp', 'phone', 'sms', 'telegram', 'signal', 'mastodon', 'facebook', 'instagram', 'meet', 'zoom', 'jitsi', 'other');--> statement-breakpoint
ALTER TABLE "TUMIN_users" ADD COLUMN "show_contact_methods" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "TUMIN_contact_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"value" text NOT NULL,
	"label" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TUMIN_contact_methods" ADD CONSTRAINT "TUMIN_contact_methods_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_methods_user_channel_uid" ON "TUMIN_contact_methods" ("user_id", "channel") WHERE "channel" <> 'other';--> statement-breakpoint
CREATE TABLE "TUMIN_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_user_pair_uid" UNIQUE("user_a_id","user_b_id")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_conversations" ADD CONSTRAINT "TUMIN_conversations_user_a_id_TUMIN_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_conversations" ADD CONSTRAINT "TUMIN_conversations_user_b_id_TUMIN_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "TUMIN_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD CONSTRAINT "TUMIN_messages_conversation_id_TUMIN_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."TUMIN_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_messages" ADD CONSTRAINT "TUMIN_messages_sender_id_TUMIN_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "TUMIN_messages" ("conversation_id", "created_at");--> statement-breakpoint
-- Seed WhatsApp contact method + enable global gate for users who had public phone
INSERT INTO "TUMIN_contact_methods" ("user_id", "channel", "value", "is_enabled", "is_public", "sort_order")
SELECT u."id", 'whatsapp'::"contact_channel", u."phone", true, true, 0
FROM "TUMIN_users" u
WHERE u."show_phone" = true
  AND NOT EXISTS (
    SELECT 1 FROM "TUMIN_contact_methods" cm
    WHERE cm."user_id" = u."id" AND cm."channel" = 'whatsapp'
  );
--> statement-breakpoint
UPDATE "TUMIN_users"
SET "show_contact_methods" = true
WHERE "show_phone" = true;
