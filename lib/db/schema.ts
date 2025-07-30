import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  planId: integer('plan_id').references(() => subscriptionPlans.id),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  plan: one(subscriptionPlans, {
    fields: [teams.planId],
    references: [subscriptionPlans.id],
  }),
  usageRecords: many(usageRecords),
  usageSummary: many(teamUsageSummary),
  billingEvents: many(billingEvents),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export const voiceAgents = pgTable('voice_agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => users.id),
  voice: varchar('voice', { length: 50 }).notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt'),
  model: varchar('model', { length: 50 }).notNull().default('gpt-3.5-turbo'),
  customEndpoint: text('custom_endpoint'),
  customCredentials: text('custom_credentials'),
  knowledgeBase: text('knowledge_base'),
  elevenLabsAgentId: text('elevenlabs_agent_id'), // ElevenLabs agent ID
  isActive: boolean('is_active').default(true), // Agent active/inactive status
  // Enhanced ElevenLabs sync fields
  firstMessage: text('first_message'), // Agent's first message
  temperature: integer('temperature').default(70), // LLM temperature (0-100)
  maxTokens: integer('max_tokens').default(512), // Maximum response tokens
  modelId: varchar('model_id', { length: 50 }).default('eleven_multilingual_v2'), // TTS model
  voiceSettings: text('voice_settings'), // JSON string for voice settings
  responseFormat: varchar('response_format', { length: 50 }).default('mp3'), // Audio format
  enableSsmlParsing: boolean('enable_ssml_parsing').default(false), // SSML parsing
  optimizeStreaming: boolean('optimize_streaming').default(true), // Streaming optimization
  stability: integer('stability').default(50), // Voice stability (0-100)
  similarityBoost: integer('similarity_boost').default(50), // Voice similarity boost (0-100)
  style: integer('style').default(0), // Voice style (0-100)
  useSpeakerBoost: boolean('use_speaker_boost').default(true), // Speaker boost
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => voiceAgents.id),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
});

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id),
  role: varchar('role', { length: 10 }).notNull(),
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const agentMetrics = pgTable('agent_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => voiceAgents.id),
  totalConversations: integer('total_conversations').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0),
  averageConversationLength: integer('average_conversation_length').notNull().default(0),
  successRate: integer('success_rate').notNull().default(0),
  period: varchar('period', { length: 20 }).notNull(),
  date: timestamp('date').notNull(),
});

export const voiceAgentsRelations = relations(voiceAgents, ({ one, many }) => ({
  customer: one(users, {
    fields: [voiceAgents.customerId],
    references: [users.id],
  }),
  conversations: many(conversations),
  metrics: many(agentMetrics),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  agent: one(voiceAgents, {
    fields: [conversations.agentId],
    references: [voiceAgents.id],
  }),
  messages: many(conversationMessages),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
}));

export const agentMetricsRelations = relations(agentMetrics, ({ one }) => ({
  agent: one(voiceAgents, {
    fields: [agentMetrics.agentId],
    references: [voiceAgents.id],
  }),
}));

export type VoiceAgent = typeof voiceAgents.$inferSelect;
export type NewVoiceAgent = typeof voiceAgents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
export type AgentMetric = typeof agentMetrics.$inferSelect;
export type NewAgentMetric = typeof agentMetrics.$inferInsert;

// Admin Users Table
export const adminUsers = pgTable('adminUsers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  isSuperAdmin: boolean('isSuperAdmin').default(false).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  lastLogin: timestamp('lastLogin'),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

// Phone Numbers Table
export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  phoneNumberId: text('phone_number_id'), // ElevenLabs ID
  assignedAgentId: uuid('assigned_agent_id').references(() => voiceAgents.id),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  provider: varchar('provider', { length: 50 }),
  country: varchar('country', { length: 3 }),
  areaCode: varchar('area_code', { length: 10 }),
  label: varchar('label', { length: 100 }),
  systemData: text('system_data'), // JSON string for additional data from ElevenLabs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const phoneNumbersRelations = relations(phoneNumbers, ({ one }) => ({
  user: one(users, {
    fields: [phoneNumbers.userId],
    references: [users.id],
  }),
  assignedAgent: one(voiceAgents, {
    fields: [phoneNumbers.assignedAgentId],
    references: [voiceAgents.id],
  }),
}));

export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type NewPhoneNumber = typeof phoneNumbers.$inferInsert;

// Subscription Plans Table
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  monthlyPrice: integer('monthly_price').notNull(), // in cents
  yearlyPrice: integer('yearly_price'), // in cents
  stripeProductId: text('stripe_product_id').unique(),
  stripePriceId: text('stripe_price_id').unique(),
  // Limits
  maxVoiceAgents: integer('max_voice_agents').notNull().default(1),
  maxPhoneNumbers: integer('max_phone_numbers').notNull().default(1),
  maxMinutesPerMonth: integer('max_minutes_per_month').notNull().default(100), // minutes
  maxConversationsPerMonth: integer('max_conversations_per_month').notNull().default(100),
  maxCustomVoices: integer('max_custom_voices').notNull().default(0),
  // Features
  hasAdvancedAnalytics: boolean('has_advanced_analytics').default(false),
  hasCustomBranding: boolean('has_custom_branding').default(false),
  hasPrioritySupport: boolean('has_priority_support').default(false),
  hasApiAccess: boolean('has_api_access').default(false),
  hasWebhooks: boolean('has_webhooks').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Usage Tracking Table
export const usageRecords = pgTable('usage_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  agentId: uuid('agent_id').references(() => voiceAgents.id),
  phoneNumberId: uuid('phone_number_id').references(() => phoneNumbers.id),
  // Usage types
  usageType: varchar('usage_type', { length: 50 }).notNull(), // 'conversation', 'tts_generation', 'voice_clone', etc.
  quantity: integer('quantity').notNull().default(1), // minutes, requests, characters, etc.
  unit: varchar('unit', { length: 20 }).notNull(), // 'minutes', 'characters', 'requests'
  // ElevenLabs specific data
  elevenLabsUsageId: text('elevenlabs_usage_id'), // ElevenLabs tracking ID
  elevenLabsCost: integer('elevenlabs_cost'), // cost in ElevenLabs credits
  // Metadata
  metadata: text('metadata'), // JSON string for additional data
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  // Billing period
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
});

// Team Usage Summary (for quick lookups)
export const teamUsageSummary = pgTable('team_usage_summary', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
  // Current usage
  totalConversations: integer('total_conversations').notNull().default(0),
  totalMinutes: integer('total_minutes').notNull().default(0),
  totalCharacters: integer('total_characters').notNull().default(0),
  totalVoiceGenerations: integer('total_voice_generations').notNull().default(0),
  // Current counts
  activeVoiceAgents: integer('active_voice_agents').notNull().default(0),
  activePhoneNumbers: integer('active_phone_numbers').notNull().default(0),
  customVoices: integer('custom_voices').notNull().default(0),
  // ElevenLabs costs
  totalElevenLabsCost: integer('total_elevenlabs_cost').notNull().default(0),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

// Billing Events Table
export const billingEvents = pgTable('billing_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'subscription_created', 'payment_succeeded', 'usage_limit_exceeded', etc.
  stripeEventId: text('stripe_event_id').unique(),
  data: text('data'), // JSON string for event data
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  teams: many(teams),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  team: one(teams, {
    fields: [usageRecords.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [usageRecords.userId],
    references: [users.id],
  }),
  agent: one(voiceAgents, {
    fields: [usageRecords.agentId],
    references: [voiceAgents.id],
  }),
  phoneNumber: one(phoneNumbers, {
    fields: [usageRecords.phoneNumberId],
    references: [phoneNumbers.id],
  }),
}));

export const teamUsageSummaryRelations = relations(teamUsageSummary, ({ one }) => ({
  team: one(teams, {
    fields: [teamUsageSummary.teamId],
    references: [teams.id],
  }),
}));

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  team: one(teams, {
    fields: [billingEvents.teamId],
    references: [teams.id],
  }),
}));

// Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type TeamUsageSummary = typeof teamUsageSummary.$inferSelect;
export type NewTeamUsageSummary = typeof teamUsageSummary.$inferInsert;
export type BillingEvent = typeof billingEvents.$inferSelect;
export type NewBillingEvent = typeof billingEvents.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  CREATE_VOICE_AGENT = 'CREATE_VOICE_AGENT',
  UPDATE_VOICE_AGENT = 'UPDATE_VOICE_AGENT',
  DELETE_VOICE_AGENT = 'DELETE_VOICE_AGENT',
}
