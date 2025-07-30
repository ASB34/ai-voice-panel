CREATE TABLE IF NOT EXISTS "phone_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"phone_number_id" text,
	"assigned_agent_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"provider" varchar(50),
	"country" varchar(3),
	"area_code" varchar(10),
	"label" varchar(100),
	"system_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_assigned_agent_id_voice_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_numbers_user_id_idx" ON "phone_numbers" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_numbers_phone_number_idx" ON "phone_numbers" ("phone_number");
