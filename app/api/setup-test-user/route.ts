import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    console.log('Setup test user endpoint called');
    
    // First check if test user exists
    const testEmail = 'test@example.com';
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    let userId: number;

    if (existingUser.length === 0) {
      // Create test user
      const passwordHash = await bcrypt.hash('password123', 12);
      const [newUser] = await db.insert(users).values({
        email: testEmail,
        passwordHash,
        name: 'Test User',
        role: 'owner'
      }).returning();
      userId = newUser.id;
      console.log('Created new user:', userId);
    } else {
      userId = existingUser[0].id;
      console.log('Using existing user:', userId);
    }

    // Check if test team exists
    const testTeamName = 'Test Team';
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, testTeamName))
      .limit(1);

    let teamId: number;

    if (existingTeam.length === 0) {
      // Create test team
      const [newTeam] = await db.insert(teams).values({
        name: testTeamName
      }).returning();
      teamId = newTeam.id;
      console.log('Created new team:', teamId);
    } else {
      teamId = existingTeam[0].id;
      console.log('Using existing team:', teamId);
    }

    // Check if team membership exists
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
      .limit(1);

    if (existingMembership.length === 0) {
      // Create team membership
      await db.insert(teamMembers).values({
        userId,
        teamId,
        role: 'owner'
      });
      console.log('Created team membership for user:', userId, 'team:', teamId);
    } else {
      console.log('Team membership already exists');
    }

    // Verify the setup
    const userWithTeam = await db
      .select({
        user: users,
        team: teams,
        membership: teamMembers
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(users.email, testEmail))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Test user setup complete',
      setup: userWithTeam[0]
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
