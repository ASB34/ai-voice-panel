CREATE TABLE IF NOT EXISTS "voice_agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "customer_id" integer NOT NULL,
  "voice" varchar(50) NOT NULL,
  "language" varchar(50) NOT NULL,
  "description" text,
  "system_prompt" text,
  "model" varchar(50) DEFAULT 'gpt-3.5-turbo' NOT NULL,
  "custom_endpoint" text,
  "custom_credentials" text,
  "knowledge_base" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" uuid NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  "duration" integer,
  "status" varchar(20) DEFAULT 'active' NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "role" varchar(10) NOT NULL,
  "content" text NOT NULL,
  "audio_url" text,
  "timestamp" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "agent_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" uuid NOT NULL,
  "total_conversations" integer DEFAULT 0 NOT NULL,
  "total_duration" integer DEFAULT 0 NOT NULL,
  "average_conversation_length" integer DEFAULT 0 NOT NULL,
  "success_rate" integer DEFAULT 0 NOT NULL,
  "period" varchar(20) NOT NULL,
  "date" timestamp NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "agent_metrics" ADD CONSTRAINT "agent_metrics_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
