CREATE TYPE "public"."account_tier" AS ENUM('NORMAL', 'PAGO', 'PATROCINADOR', 'FINANCIADOR');--> statement-breakpoint
CREATE TYPE "public"."ad_status" AS ENUM('PENDIENTE', 'ACTIVO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('PENDIENTE', 'PAGADO', 'RECHAZADO');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'VIDEO', 'LINK');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('ACTIVO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('TRANSFERENCIA', 'BONO', 'MINADO', 'PAGO_TRABAJO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SOCIO', 'COORDINADOR_LOCAL', 'COORDINADOR', 'COORDINADOR_GENERAL');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVO', 'CONGELADO');--> statement-breakpoint
CREATE TABLE "TUMIN_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"image_url" text NOT NULL,
	"status" "ad_status" DEFAULT 'PENDIENTE' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_daily_mining" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"streak" integer NOT NULL,
	"amount" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"verifier_id" text,
	"description" text NOT NULL,
	"minutes" integer NOT NULL,
	"amount" double precision NOT NULL,
	"status" "job_status" DEFAULT 'PENDIENTE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"type" "media_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_product_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"extra_info" text,
	"price_mxn" double precision NOT NULL,
	"price_tumin" double precision NOT NULL,
	"categories" jsonb NOT NULL,
	"region" text NOT NULL,
	"status" "product_status" DEFAULT 'ACTIVO' NOT NULL,
	"image_url" text,
	"img_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voter_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"stars" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"concept" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TUMIN_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"nip" text NOT NULL,
	"region" text NOT NULL,
	"role" "user_role" DEFAULT 'SOCIO' NOT NULL,
	"referrer_id" text,
	"status" "user_status" DEFAULT 'ACTIVO' NOT NULL,
	"account_tier" "account_tier" DEFAULT 'NORMAL' NOT NULL,
	"avatar_url" text,
	"public_name" text,
	"bio" text,
	"public_profile" boolean DEFAULT true NOT NULL,
	"show_phone" boolean DEFAULT true NOT NULL,
	"show_email" boolean DEFAULT false NOT NULL,
	"show_region" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"duplicator_bonus" double precision DEFAULT 0 NOT NULL,
	"first_sale_ok" boolean DEFAULT false NOT NULL,
	"product_ok" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TUMIN_users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "TUMIN_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_ads" ADD CONSTRAINT "TUMIN_ads_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_daily_mining" ADD CONSTRAINT "TUMIN_daily_mining_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_jobs" ADD CONSTRAINT "TUMIN_jobs_requester_id_TUMIN_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_jobs" ADD CONSTRAINT "TUMIN_jobs_verifier_id_TUMIN_users_id_fk" FOREIGN KEY ("verifier_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_media" ADD CONSTRAINT "TUMIN_media_user_id_TUMIN_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_product_comments" ADD CONSTRAINT "TUMIN_product_comments_product_id_TUMIN_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_product_comments" ADD CONSTRAINT "TUMIN_product_comments_author_id_TUMIN_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_products" ADD CONSTRAINT "TUMIN_products_seller_id_TUMIN_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_ratings" ADD CONSTRAINT "TUMIN_ratings_voter_id_TUMIN_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_ratings" ADD CONSTRAINT "TUMIN_ratings_seller_id_TUMIN_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "TUMIN_transactions_from_id_TUMIN_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_transactions" ADD CONSTRAINT "TUMIN_transactions_to_id_TUMIN_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;