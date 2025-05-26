ALTER TABLE "routines" ADD COLUMN "routine_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "current_stage_progress" integer NOT NULL;