CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "voice_agents" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" varchar(100) NOT NULL,
  "customer_id" integer NOT NULL REFERENCES users(id),
  "voice" varchar(50) NOT NULL,
  "language" varchar(50) NOT NULL,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX "voice_agents_customer_id_idx" ON "voice_agents" ("customer_id");
