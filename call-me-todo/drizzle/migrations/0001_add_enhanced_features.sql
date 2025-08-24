-- Enhanced features migration for existing database
-- This adds new columns and tables to existing schema

-- Create enums (these will be skipped if they exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
        CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'energy_level') THEN
        CREATE TYPE "public"."energy_level" AS ENUM('low', 'medium', 'high');
    END IF;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT NOW(),
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Add foreign key for projects
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_profiles_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;

-- Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority "priority" DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS energy_level "energy_level";

-- Add foreign key constraints for tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" 
FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" 
FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "projects_user_id_archived_idx" ON "projects" USING btree ("user_id","is_archived");
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks" USING btree ("priority");
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks" USING btree ("due_date");
CREATE INDEX IF NOT EXISTS "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");