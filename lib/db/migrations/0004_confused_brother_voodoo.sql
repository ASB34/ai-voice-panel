CREATE TABLE "adminUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"name" varchar(100),
	"isSuperAdmin" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastLogin" timestamp,
	CONSTRAINT "adminUsers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "phone_numbers" (
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
ALTER TABLE "voice_agents" ADD COLUMN "first_message" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "temperature" integer DEFAULT 70;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "max_tokens" integer DEFAULT 512;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "model_id" varchar(50) DEFAULT 'eleven_multilingual_v2';--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "voice_settings" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "response_format" varchar(50) DEFAULT 'mp3';--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "enable_ssml_parsing" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "optimize_streaming" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "stability" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "similarity_boost" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "style" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "use_speaker_boost" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_assigned_agent_id_voice_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE no action ON UPDATE no action;