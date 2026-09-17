-- Civil-day mining: persist Mexico calendar date + one claim per user per day.
-- Historical `date` timestamps were written by Node as UTC wall-clock (naive).

ALTER TABLE "TUMIN_daily_mining" RENAME COLUMN "date" TO "claimed_at";
--> statement-breakpoint
ALTER TABLE "TUMIN_daily_mining" ADD COLUMN "mined_on" date;
--> statement-breakpoint
-- Interpret naive claimed_at as UTC, then take the America/Mexico_City civil date.
UPDATE "TUMIN_daily_mining"
SET "mined_on" = (
  ("claimed_at" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City'
)::date;
--> statement-breakpoint
ALTER TABLE "TUMIN_daily_mining" ALTER COLUMN "claimed_at" TYPE timestamptz USING "claimed_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
-- Keep the newest claim per (user_id, mined_on); drop older duplicates. Ledger MINADO rows are left untouched.
DELETE FROM "TUMIN_daily_mining" AS d
WHERE d.id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, mined_on
        ORDER BY claimed_at DESC, streak DESC
      ) AS rn
    FROM "TUMIN_daily_mining"
  ) ranked
  WHERE rn > 1
);
--> statement-breakpoint
ALTER TABLE "TUMIN_daily_mining" ALTER COLUMN "mined_on" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "TUMIN_daily_mining" ADD CONSTRAINT "daily_mining_user_day" UNIQUE ("user_id", "mined_on");
