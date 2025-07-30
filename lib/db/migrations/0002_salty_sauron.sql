CREATE TABLE "agent_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"total_conversations" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"average_conversation_length" integer DEFAULT 0 NOT NULL,
	"success_rate" integer DEFAULT 0 NOT NULL,
	"period" varchar(20) NOT NULL,
	"date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"audio_url" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "system_prompt" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "model" varchar(50) DEFAULT 'gpt-3.5-turbo' NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "custom_endpoint" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "custom_credentials" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "knowledge_base" text;--> statement-breakpoint
ALTER TABLE "agent_metrics" ADD CONSTRAINT "agent_metrics_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE no action ON UPDATE no action;