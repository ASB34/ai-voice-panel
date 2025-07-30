const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function createSubscriptionTables() {
  try {
    // Create subscription_plans table
    await sql`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "description" text,
        "monthly_price" integer NOT NULL,
        "yearly_price" integer,
        "stripe_product_id" text,
        "stripe_price_id" text,
        "max_voice_agents" integer DEFAULT 1 NOT NULL,
        "max_phone_numbers" integer DEFAULT 1 NOT NULL,
        "max_minutes_per_month" integer DEFAULT 100 NOT NULL,
        "max_conversations_per_month" integer DEFAULT 100 NOT NULL,
        "max_custom_voices" integer DEFAULT 0 NOT NULL,
        "has_advanced_analytics" boolean DEFAULT false,
        "has_custom_branding" boolean DEFAULT false,
        "has_priority_support" boolean DEFAULT false,
        "has_api_access" boolean DEFAULT false,
        "has_webhooks" boolean DEFAULT false,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "subscription_plans_stripe_product_id_unique" UNIQUE("stripe_product_id"),
        CONSTRAINT "subscription_plans_stripe_price_id_unique" UNIQUE("stripe_price_id")
      );
    `;

    // Add plan_id to teams table
    await sql`
      ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "plan_id" integer REFERENCES "subscription_plans"("id");
    `;
    
    await sql`
      ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "current_period_start" timestamp;
    `;
    
    await sql`
      ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp;
    `;
    
    await sql`
      ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false;
    `;

    // Create usage_records table
    await sql`
      CREATE TABLE IF NOT EXISTS "usage_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "agent_id" uuid REFERENCES "voice_agents"("id"),
        "phone_number_id" uuid REFERENCES "phone_numbers"("id"),
        "usage_type" varchar(50) NOT NULL,
        "quantity" integer DEFAULT 1 NOT NULL,
        "unit" varchar(20) NOT NULL,
        "elevenlabs_usage_id" text,
        "elevenlabs_cost" integer,
        "metadata" text,
        "recorded_at" timestamp DEFAULT now() NOT NULL,
        "billing_period_start" timestamp NOT NULL,
        "billing_period_end" timestamp NOT NULL
      );
    `;

    // Create team_usage_summary table
    await sql`
      CREATE TABLE IF NOT EXISTS "team_usage_summary" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "billing_period_start" timestamp NOT NULL,
        "billing_period_end" timestamp NOT NULL,
        "total_conversations" integer DEFAULT 0 NOT NULL,
        "total_minutes" integer DEFAULT 0 NOT NULL,
        "total_characters" integer DEFAULT 0 NOT NULL,
        "total_voice_generations" integer DEFAULT 0 NOT NULL,
        "active_voice_agents" integer DEFAULT 0 NOT NULL,
        "active_phone_numbers" integer DEFAULT 0 NOT NULL,
        "custom_voices" integer DEFAULT 0 NOT NULL,
        "total_elevenlabs_cost" integer DEFAULT 0 NOT NULL,
        "last_updated" timestamp DEFAULT now() NOT NULL
      );
    `;

    // Create billing_events table
    await sql`
      CREATE TABLE IF NOT EXISTS "billing_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "event_type" varchar(50) NOT NULL,
        "stripe_event_id" text,
        "data" text,
        "processed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "billing_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
      );
    `;

    console.log('✅ Subscription tables created successfully');

    // Insert default subscription plans
    const plans = [
      {
        name: 'starter',
        display_name: 'Starter Plan',
        description: 'Perfect for individuals getting started with AI voice agents',
        monthly_price: 2900, // $29.00
        yearly_price: 29000, // $290.00 (2 months free)
        max_voice_agents: 1,
        max_phone_numbers: 1,
        max_minutes_per_month: 500,
        max_conversations_per_month: 100,
        max_custom_voices: 0,
        has_advanced_analytics: false,
        has_custom_branding: false,
        has_priority_support: false,
        has_api_access: false,
        has_webhooks: false,
      },
      {
        name: 'professional',
        display_name: 'Professional Plan',
        description: 'For businesses that need multiple agents and advanced features',
        monthly_price: 9900, // $99.00
        yearly_price: 99000, // $990.00 (2 months free)
        max_voice_agents: 5,
        max_phone_numbers: 5,
        max_minutes_per_month: 2000,
        max_conversations_per_month: 500,
        max_custom_voices: 3,
        has_advanced_analytics: true,
        has_custom_branding: true,
        has_priority_support: true,
        has_api_access: true,
        has_webhooks: false,
      },
      {
        name: 'enterprise',
        display_name: 'Enterprise Plan',
        description: 'For large organizations with unlimited needs',
        monthly_price: 29900, // $299.00
        yearly_price: 299000, // $2990.00 (2 months free)
        max_voice_agents: -1, // unlimited
        max_phone_numbers: -1, // unlimited
        max_minutes_per_month: -1, // unlimited
        max_conversations_per_month: -1, // unlimited
        max_custom_voices: -1, // unlimited
        has_advanced_analytics: true,
        has_custom_branding: true,
        has_priority_support: true,
        has_api_access: true,
        has_webhooks: true,
      },
      {
        name: 'free',
        display_name: 'Free Trial',
        description: 'Try our platform with limited features',
        monthly_price: 0,
        yearly_price: 0,
        max_voice_agents: 1,
        max_phone_numbers: 0,
        max_minutes_per_month: 50,
        max_conversations_per_month: 10,
        max_custom_voices: 0,
        has_advanced_analytics: false,
        has_custom_branding: false,
        has_priority_support: false,
        has_api_access: false,
        has_webhooks: false,
      }
    ];

    for (const plan of plans) {
      // Check if plan exists first
      const existingPlan = await sql`
        SELECT id FROM "subscription_plans" WHERE name = ${plan.name};
      `;
      
      if (existingPlan.length === 0) {
        await sql`
          INSERT INTO "subscription_plans" (
            name, display_name, description, monthly_price, yearly_price,
            max_voice_agents, max_phone_numbers, max_minutes_per_month,
            max_conversations_per_month, max_custom_voices, has_advanced_analytics,
            has_custom_branding, has_priority_support, has_api_access, has_webhooks
          ) VALUES (
            ${plan.name}, ${plan.display_name}, ${plan.description}, 
            ${plan.monthly_price}, ${plan.yearly_price}, ${plan.max_voice_agents},
            ${plan.max_phone_numbers}, ${plan.max_minutes_per_month},
            ${plan.max_conversations_per_month}, ${plan.max_custom_voices},
            ${plan.has_advanced_analytics}, ${plan.has_custom_branding},
            ${plan.has_priority_support}, ${plan.has_api_access}, ${plan.has_webhooks}
          );
        `;
      }
    }

    console.log('✅ Default subscription plans created');

    // Set all existing teams to free plan
    await sql`
      UPDATE "teams" 
      SET plan_id = (SELECT id FROM "subscription_plans" WHERE name = 'free')
      WHERE plan_id IS NULL;
    `;

    console.log('✅ Existing teams assigned to free plan');

    // Test query
    const allPlans = await sql`
      SELECT * FROM "subscription_plans" ORDER BY monthly_price;
    `;
    
    console.log('📊 Available subscription plans:');
    allPlans.forEach(plan => {
      console.log(`- ${plan.display_name}: $${plan.monthly_price/100}/month`);
    });
    
  } catch (error) {
    console.error('❌ Error creating subscription tables:', error);
  } finally {
    await sql.end();
  }
}

createSubscriptionTables();
