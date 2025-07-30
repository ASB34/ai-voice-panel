CREATE TABLE IF NOT EXISTS "adminUsers" (
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

-- Insert first admin user (password: admin123)
INSERT INTO "adminUsers" ("email", "passwordHash", "name", "isSuperAdmin", "isActive")
VALUES (
  'ahmedsaidbulut@gmail.com',
  '$2b$12$LQv3c1yqBwEHxl6iZhK5.uHvf8L8Kgz5z8N8QjYz5B1K3A2V6X8QG',
  'Ahmed Said Bulut',
  true,
  true
);
