import { desc, eq, and, isNull, like, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, activityLogs, voiceAgents, phoneNumbers, subscriptionPlans, usageRecords, teamUsageSummary } from '@/lib/db/schema';

// Get all users with pagination and search
export async function getAllUsers(page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit;
  
  const whereClause = search 
    ? and(
        isNull(users.deletedAt),
        like(users.email, `%${search}%`)
      )
    : isNull(users.deletedAt);

  const [usersData, totalCount] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        teamId: teamMembers.teamId,
        teamName: teams.name,
        teamRole: teamMembers.role,
        // Subscription info
        planId: teams.planId,
        subscriptionStatus: teams.subscriptionStatus,
        currentPeriodEnd: teams.currentPeriodEnd,
        planName: subscriptionPlans.displayName,
        planMonthlyPrice: subscriptionPlans.monthlyPrice,
        planYearlyPrice: subscriptionPlans.yearlyPrice,
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .leftJoin(subscriptionPlans, eq(teams.planId, subscriptionPlans.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)
      .then(result => result[0]?.count || 0)
  ]);

  // Get usage data for each user
  const usersWithUsage = await Promise.all(
    usersData.map(async (user) => {
      if (!user.teamId) return user;

      // Get current period usage
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usage = await db
        .select({
          conversations: teamUsageSummary.totalConversations,
          phoneNumbers: teamUsageSummary.activePhoneNumbers,
          minutes: teamUsageSummary.totalMinutes,
          elevenlabsCost: teamUsageSummary.totalElevenLabsCost,
        })
        .from(teamUsageSummary)
        .where(
          and(
            eq(teamUsageSummary.teamId, user.teamId),
            eq(teamUsageSummary.billingPeriodStart, startOfMonth)
          )
        )
        .limit(1);

      return {
        ...user,
        subscription: user.planId ? {
          planName: user.planName || 'Unknown',
          status: user.subscriptionStatus || 'inactive',
          amount: user.planMonthlyPrice || 0,
          billingPeriod: 'monthly',
          currentPeriodEnd: user.currentPeriodEnd || new Date(),
        } : undefined,
        usage: usage[0] || {
          conversations: 0,
          phoneNumbers: 0,
          minutes: 0,
          elevenlabsCost: 0,
        }
      };
    })
  );

  return {
    users: usersWithUsage,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  };
}

// Get all teams with their members
export async function getAllTeams(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const [teamsData, totalCount] = await Promise.all([
    db.query.teams.findMany({
      limit,
      offset,
      orderBy: [desc(teams.createdAt)],
      with: {
        teamMembers: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    }),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .then(result => result[0]?.count || 0)
  ]);

  return {
    teams: teamsData,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  };
}

// Get user details by ID
export async function getUserById(userId: number) {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
    with: {
      teamMembers: {
        with: {
          team: true
        }
      }
    }
  });

  if (!user) return null;

  // Get user's voice agents count
  const agentsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(voiceAgents)
    .where(eq(voiceAgents.customerId, userId))
    .then(result => result[0]?.count || 0);

  return {
    ...user,
    agentsCount
  };
}

// Get recent activity logs
export async function getRecentActivity(limit = 50) {
  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
      userEmail: users.email,
      teamName: teams.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .leftJoin(teams, eq(activityLogs.teamId, teams.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Get system stats
export async function getSystemStats() {
  const [
    totalUsers,
    totalTeams,
    totalAgents,
    totalPhoneNumbers,
    activeSubscriptions
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt))
      .then(result => result[0]?.count || 0),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .then(result => result[0]?.count || 0),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(voiceAgents)
      .then(result => result[0]?.count || 0),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(phoneNumbers)
      .then(result => result[0]?.count || 0),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(eq(teams.subscriptionStatus, 'active'))
      .then(result => result[0]?.count || 0)
  ]);

  return {
    totalUsers,
    totalTeams,
    totalAgents,
    totalPhoneNumbers,
    activeSubscriptions
  };
}

export async function getActivityLogs(
  page: number = 1,
  limit: number = 20,
  actionFilter?: string
) {
  const offset = (page - 1) * limit;
  
  const whereConditions = actionFilter 
    ? [eq(activityLogs.action, actionFilter)]
    : [];

  const [activities, totalCount] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        description: activityLogs.action, // Use action as description for now
        createdAt: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userAgent: sql<string>`''`, // Empty string for now
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .then(result => result[0].count)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    activities,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
