import { db } from '@/lib/db/drizzle';
import { 
  teams, 
  subscriptionPlans, 
  usageRecords, 
  teamUsageSummary,
  type Team,
  type SubscriptionPlan,
  type UsageRecord,
  type NewUsageRecord,
  type TeamUsageSummary,
  type NewTeamUsageSummary
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export type UsageType = 
  | 'conversation'
  | 'tts_generation' 
  | 'voice_clone'
  | 'phone_number_purchase'
  | 'api_request';

export type UsageUnit = 'minutes' | 'characters' | 'requests' | 'count';

export interface UsageLimit {
  type: UsageType;
  current: number;
  limit: number;
  unit: UsageUnit;
  isUnlimited: boolean;
  isExceeded: boolean;
}

export interface TeamWithPlan extends Team {
  plan?: SubscriptionPlan | null;
}

export class UsageService {
  
  /**
   * Get team with its subscription plan
   */
  static async getTeamWithPlan(teamId: number): Promise<TeamWithPlan | null> {
    const [team] = await db
      .select()
      .from(teams)
      .leftJoin(subscriptionPlans, eq(teams.planId, subscriptionPlans.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) return null;

    return {
      ...team.teams,
      plan: team.subscription_plans
    };
  }

  /**
   * Get current billing period dates
   */
  static getCurrentBillingPeriod(team: Team): { start: Date; end: Date } {
    const now = new Date();
    
    if (team.currentPeriodStart && team.currentPeriodEnd) {
      return {
        start: new Date(team.currentPeriodStart),
        end: new Date(team.currentPeriodEnd)
      };
    }

    // Default to monthly period starting from team creation
    const start = new Date(team.createdAt);
    start.setDate(1); // First day of the month
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setTime(end.getTime() - 1); // Last millisecond of the month

    return { start, end };
  }

  /**
   * Record usage for a team
   */
  static async recordUsage(params: {
    teamId: number;
    userId: number;
    usageType: UsageType;
    quantity: number;
    unit: UsageUnit;
    agentId?: string;
    phoneNumberId?: string;
    elevenLabsUsageId?: string;
    elevenLabsCost?: number;
    metadata?: any;
  }): Promise<UsageRecord> {
    const team = await this.getTeamWithPlan(params.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const { start, end } = this.getCurrentBillingPeriod(team);

    const usageRecord: NewUsageRecord = {
      teamId: params.teamId,
      userId: params.userId,
      usageType: params.usageType,
      quantity: params.quantity,
      unit: params.unit,
      agentId: params.agentId,
      phoneNumberId: params.phoneNumberId,
      elevenLabsUsageId: params.elevenLabsUsageId,
      elevenLabsCost: params.elevenLabsCost,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      billingPeriodStart: start,
      billingPeriodEnd: end,
    };

    const [record] = await db
      .insert(usageRecords)
      .values(usageRecord)
      .returning();

    // Update team usage summary
    await this.updateTeamUsageSummary(params.teamId, start, end);

    return record;
  }

  /**
   * Update team usage summary
   */
  static async updateTeamUsageSummary(
    teamId: number, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<void> {
    // Calculate current usage for the period
    const usageStats = await db
      .select({
        totalConversations: sql<number>`COUNT(CASE WHEN usage_type = 'conversation' THEN 1 END)`,
        totalMinutes: sql<number>`SUM(CASE WHEN usage_type = 'conversation' AND unit = 'minutes' THEN quantity ELSE 0 END)`,
        totalCharacters: sql<number>`SUM(CASE WHEN usage_type = 'tts_generation' AND unit = 'characters' THEN quantity ELSE 0 END)`,
        totalVoiceGenerations: sql<number>`COUNT(CASE WHEN usage_type = 'tts_generation' THEN 1 END)`,
        totalElevenLabsCost: sql<number>`SUM(COALESCE(elevenlabs_cost, 0))`,
      })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.teamId, teamId),
          gte(usageRecords.billingPeriodStart, periodStart),
          lte(usageRecords.billingPeriodEnd, periodEnd)
        )
      );

    const stats = usageStats[0] || {
      totalConversations: 0,
      totalMinutes: 0,
      totalCharacters: 0,
      totalVoiceGenerations: 0,
      totalElevenLabsCost: 0,
    };

    // Count current active resources
    const resourceCounts = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM voice_agents WHERE customer_id IN 
          (SELECT user_id FROM team_members WHERE team_id = ${teamId}) 
          AND is_active = true) as active_voice_agents,
        (SELECT COUNT(*) FROM phone_numbers WHERE user_id IN 
          (SELECT user_id FROM team_members WHERE team_id = ${teamId}) 
          AND status = 'active') as active_phone_numbers
    `);

    const counts = resourceCounts[0] || { active_voice_agents: 0, active_phone_numbers: 0 };

    // Upsert team usage summary
    const summaryData: NewTeamUsageSummary = {
      teamId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      totalConversations: Number(stats.totalConversations) || 0,
      totalMinutes: Number(stats.totalMinutes) || 0,
      totalCharacters: Number(stats.totalCharacters) || 0,
      totalVoiceGenerations: Number(stats.totalVoiceGenerations) || 0,
      activeVoiceAgents: Number(counts.active_voice_agents) || 0,
      activePhoneNumbers: Number(counts.active_phone_numbers) || 0,
      customVoices: 0, // TODO: Implement custom voice counting
      totalElevenLabsCost: Number(stats.totalElevenLabsCost) || 0,
    };

    // Check if summary exists for this period
    const [existingSummary] = await db
      .select()
      .from(teamUsageSummary)
      .where(
        and(
          eq(teamUsageSummary.teamId, teamId),
          eq(teamUsageSummary.billingPeriodStart, periodStart),
          eq(teamUsageSummary.billingPeriodEnd, periodEnd)
        )
      )
      .limit(1);

    if (existingSummary) {
      await db
        .update(teamUsageSummary)
        .set({
          ...summaryData,
          lastUpdated: new Date(),
        })
        .where(eq(teamUsageSummary.id, existingSummary.id));
    } else {
      await db.insert(teamUsageSummary).values(summaryData);
    }
  }

  /**
   * Check if team can perform an action based on limits
   */
  static async checkUsageLimit(
    teamId: number,
    usageType: UsageType,
    requestedQuantity: number = 1
  ): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
    const team = await this.getTeamWithPlan(teamId);
    if (!team?.plan) {
      return { allowed: false, reason: 'No subscription plan found' };
    }

    const { start, end } = this.getCurrentBillingPeriod(team);
    
    // Get current usage summary
    const [summary] = await db
      .select()
      .from(teamUsageSummary)
      .where(
        and(
          eq(teamUsageSummary.teamId, teamId),
          eq(teamUsageSummary.billingPeriodStart, start),
          eq(teamUsageSummary.billingPeriodEnd, end)
        )
      )
      .limit(1);

    const currentUsage = summary || {
      totalConversations: 0,
      totalMinutes: 0,
      activeVoiceAgents: 0,
      activePhoneNumbers: 0,
    };

    // Check limits based on usage type
    switch (usageType) {
      case 'conversation':
        const conversationLimit = team.plan.maxConversationsPerMonth;
        if (conversationLimit === -1) return { allowed: true }; // Unlimited
        
        const newConversationCount = currentUsage.totalConversations + requestedQuantity;
        if (newConversationCount > conversationLimit) {
          return {
            allowed: false,
            reason: `Conversation limit exceeded. Current: ${currentUsage.totalConversations}, Limit: ${conversationLimit}`,
            currentUsage: currentUsage.totalConversations,
            limit: conversationLimit
          };
        }
        break;

      case 'phone_number_purchase':
        const phoneLimit = team.plan.maxPhoneNumbers;
        if (phoneLimit === -1) return { allowed: true }; // Unlimited
        
        const newPhoneCount = currentUsage.activePhoneNumbers + requestedQuantity;
        if (newPhoneCount > phoneLimit) {
          return {
            allowed: false,
            reason: `Phone number limit exceeded. Current: ${currentUsage.activePhoneNumbers}, Limit: ${phoneLimit}`,
            currentUsage: currentUsage.activePhoneNumbers,
            limit: phoneLimit
          };
        }
        break;

      // Add more usage type checks as needed
    }

    return { allowed: true };
  }

  /**
   * Get team usage limits and current usage
   */
  static async getTeamUsageLimits(teamId: number): Promise<UsageLimit[]> {
    const team = await this.getTeamWithPlan(teamId);
    if (!team?.plan) {
      return [];
    }

    const { start, end } = this.getCurrentBillingPeriod(team);
    
    const [summary] = await db
      .select()
      .from(teamUsageSummary)
      .where(
        and(
          eq(teamUsageSummary.teamId, teamId),
          eq(teamUsageSummary.billingPeriodStart, start),
          eq(teamUsageSummary.billingPeriodEnd, end)
        )
      )
      .limit(1);

    const currentUsage = summary || {
      totalConversations: 0,
      totalMinutes: 0,
      activeVoiceAgents: 0,
      activePhoneNumbers: 0,
    };

    const limits: UsageLimit[] = [
      {
        type: 'conversation',
        current: currentUsage.totalConversations,
        limit: team.plan.maxConversationsPerMonth,
        unit: 'count',
        isUnlimited: team.plan.maxConversationsPerMonth === -1,
        isExceeded: team.plan.maxConversationsPerMonth !== -1 && 
                   currentUsage.totalConversations >= team.plan.maxConversationsPerMonth
      },
      {
        type: 'phone_number_purchase',
        current: currentUsage.activePhoneNumbers,
        limit: team.plan.maxPhoneNumbers,
        unit: 'count',
        isUnlimited: team.plan.maxPhoneNumbers === -1,
        isExceeded: team.plan.maxPhoneNumbers !== -1 && 
                   currentUsage.activePhoneNumbers >= team.plan.maxPhoneNumbers
      },
    ];

    return limits;
  }

  /**
   * Record ElevenLabs usage from their API
   */
  static async recordElevenLabsUsage(params: {
    teamId: number;
    userId: number;
    agentId?: string;
    phoneNumberId?: string;
    conversationId?: string;
    durationMinutes?: number;
    charactersUsed?: number;
    elevenLabsCreditsUsed?: number;
    elevenLabsUsageId?: string;
  }): Promise<UsageRecord[]> {
    const records: UsageRecord[] = [];

    // Record conversation if duration provided
    if (params.durationMinutes) {
      const conversationRecord = await this.recordUsage({
        teamId: params.teamId,
        userId: params.userId,
        usageType: 'conversation',
        quantity: params.durationMinutes,
        unit: 'minutes',
        agentId: params.agentId,
        phoneNumberId: params.phoneNumberId,
        elevenLabsUsageId: params.elevenLabsUsageId,
        elevenLabsCost: params.elevenLabsCreditsUsed,
        metadata: {
          conversationId: params.conversationId,
          source: 'elevenlabs_api'
        }
      });
      records.push(conversationRecord);
    }

    // Record TTS generation if characters provided
    if (params.charactersUsed) {
      const ttsRecord = await this.recordUsage({
        teamId: params.teamId,
        userId: params.userId,
        usageType: 'tts_generation',
        quantity: params.charactersUsed,
        unit: 'characters',
        agentId: params.agentId,
        phoneNumberId: params.phoneNumberId,
        elevenLabsUsageId: params.elevenLabsUsageId,
        elevenLabsCost: params.elevenLabsCreditsUsed,
        metadata: {
          conversationId: params.conversationId,
          source: 'elevenlabs_api'
        }
      });
      records.push(ttsRecord);
    }

    return records;
  }
}

export default UsageService;
