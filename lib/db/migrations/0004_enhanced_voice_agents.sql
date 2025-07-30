-- Enhanced voice agents fields for ElevenLabs sync
ALTER TABLE "voice_agents" ADD COLUMN "first_message" text;
ALTER TABLE "voice_agents" ADD COLUMN "temperature" integer DEFAULT 70;
ALTER TABLE "voice_agents" ADD COLUMN "max_tokens" integer DEFAULT 512;
ALTER TABLE "voice_agents" ADD COLUMN "model_id" varchar(50) DEFAULT 'eleven_multilingual_v2';
ALTER TABLE "voice_agents" ADD COLUMN "voice_settings" text;
ALTER TABLE "voice_agents" ADD COLUMN "response_format" varchar(50) DEFAULT 'mp3';
ALTER TABLE "voice_agents" ADD COLUMN "enable_ssml_parsing" boolean DEFAULT false;
ALTER TABLE "voice_agents" ADD COLUMN "optimize_streaming" boolean DEFAULT true;
ALTER TABLE "voice_agents" ADD COLUMN "stability" integer DEFAULT 50;
ALTER TABLE "voice_agents" ADD COLUMN "similarity_boost" integer DEFAULT 50;
ALTER TABLE "voice_agents" ADD COLUMN "style" integer DEFAULT 0;
ALTER TABLE "voice_agents" ADD COLUMN "use_speaker_boost" boolean DEFAULT true;
