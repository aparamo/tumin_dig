-- Safe incremental migration for existing Postgres databases (outside Drizzle journal).
-- Use when la base ya existía antes de `drizzle-kit migrate` o tiene columnas parciales.
-- Idempotent: safe to re-run. PostgreSQL 11+ for ADD COLUMN IF NOT EXISTS.
-- From tumin-app: psql "$DATABASE_URL" -f src/db/manual/safe_additions_existing_postgres.sql
-- Note: product "description" is nullable in app schema; forms still require it on create/edit.

-- TUMIN_users: privacy / public profile columns
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "public_name" text;
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "public_profile" boolean DEFAULT true NOT NULL;
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "show_phone" boolean DEFAULT true NOT NULL;
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "show_email" boolean DEFAULT false NOT NULL;
ALTER TABLE "TUMIN_users" ADD COLUMN IF NOT EXISTS "show_region" boolean DEFAULT true NOT NULL;

-- TUMIN_products: descriptions + visibility in bazar/public profile
ALTER TABLE "TUMIN_products" ADD COLUMN IF NOT EXISTS "description" text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TUMIN_products'
      AND column_name = 'description'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "TUMIN_products" ALTER COLUMN "description" DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE "TUMIN_products" ADD COLUMN IF NOT EXISTS "extra_info" text;
ALTER TABLE "TUMIN_products" ADD COLUMN IF NOT EXISTS "show_in_profile" boolean DEFAULT true NOT NULL;

-- Product comments (skip if table already exists)
CREATE TABLE IF NOT EXISTS "TUMIN_product_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- FKs for comments (only add if missing — avoids errors on re-run)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'TUMIN_product_comments_product_id_TUMIN_products_id_fk'
	) THEN
		ALTER TABLE "TUMIN_product_comments"
			ADD CONSTRAINT "TUMIN_product_comments_product_id_TUMIN_products_id_fk"
			FOREIGN KEY ("product_id") REFERENCES "public"."TUMIN_products"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'TUMIN_product_comments_author_id_TUMIN_users_id_fk'
	) THEN
		ALTER TABLE "TUMIN_product_comments"
			ADD CONSTRAINT "TUMIN_product_comments_author_id_TUMIN_users_id_fk"
			FOREIGN KEY ("author_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
