CREATE TYPE "public"."job_vote_stance" AS ENUM('ACUERDO', 'DESACUERDO');--> statement-breakpoint
CREATE TYPE "public"."job_dispute_status" AS ENUM('ABIERTA', 'RESUELTA');--> statement-breakpoint
ALTER TYPE "public"."admin_action" ADD VALUE IF NOT EXISTS 'FLAG_JOB_DISPUTE';--> statement-breakpoint
ALTER TYPE "public"."admin_action" ADD VALUE IF NOT EXISTS 'RESOLVE_JOB_DISPUTE';--> statement-breakpoint
CREATE TABLE "TUMIN_job_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"stance" "job_vote_stance" NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_votes_job_voter_uid" UNIQUE("job_id","voter_id")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_job_votes" ADD CONSTRAINT "TUMIN_job_votes_job_id_TUMIN_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."TUMIN_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_job_votes" ADD CONSTRAINT "TUMIN_job_votes_voter_id_TUMIN_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_votes_job_idx" ON "TUMIN_job_votes" ("job_id");--> statement-breakpoint
CREATE TABLE "TUMIN_job_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "job_dispute_status" DEFAULT 'ABIERTA' NOT NULL,
	"opened_by_id" text NOT NULL,
	"resolved_by_id" text,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "job_disputes_job_uid" UNIQUE("job_id")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_job_disputes" ADD CONSTRAINT "TUMIN_job_disputes_job_id_TUMIN_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."TUMIN_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_job_disputes" ADD CONSTRAINT "TUMIN_job_disputes_opened_by_id_TUMIN_users_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_job_disputes" ADD CONSTRAINT "TUMIN_job_disputes_resolved_by_id_TUMIN_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "TUMIN_job_dispute_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"coordinator_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp,
	CONSTRAINT "job_dispute_flags_dispute_coord_uid" UNIQUE("dispute_id","coordinator_id")
);
--> statement-breakpoint
ALTER TABLE "TUMIN_job_dispute_flags" ADD CONSTRAINT "TUMIN_job_dispute_flags_dispute_id_TUMIN_job_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."TUMIN_job_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_job_dispute_flags" ADD CONSTRAINT "TUMIN_job_dispute_flags_coordinator_id_TUMIN_users_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "TUMIN_job_dispute_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TUMIN_job_dispute_messages" ADD CONSTRAINT "TUMIN_job_dispute_messages_dispute_id_TUMIN_job_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."TUMIN_job_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TUMIN_job_dispute_messages" ADD CONSTRAINT "TUMIN_job_dispute_messages_author_id_TUMIN_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."TUMIN_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_dispute_messages_dispute_created_idx" ON "TUMIN_job_dispute_messages" ("dispute_id", "created_at");
