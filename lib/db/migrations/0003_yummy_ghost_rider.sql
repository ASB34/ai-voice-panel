ALTER TABLE "voice_agents" ADD COLUMN "elevenlabs_agent_id" text;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD COLUMN "is_active" boolean DEFAULT true;