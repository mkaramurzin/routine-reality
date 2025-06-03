DO $$ BEGIN
 CREATE TYPE "public"."wellness_category" AS ENUM('overall_health', 'brainy', 'body', 'money', 'personal_growth', 'body_maintenance', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "active_tasks" ADD COLUMN "wellness_categories" wellness_category[] DEFAULT  NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "wellness_categories" wellness_category[] DEFAULT  NOT NULL;--> statement-breakpoint
ALTER TABLE "task_history" ADD COLUMN "wellness_categories" wellness_category[] DEFAULT  NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "wellness_categories" wellness_category[] DEFAULT  NOT NULL;--> statement-breakpoint
ALTER TABLE "unmarked_tasks" ADD COLUMN "wellness_categories" wellness_category[] DEFAULT  NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" text DEFAULT 'English';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "productivity_goal" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" DROP COLUMN IF EXISTS "paused_stage_progress";