import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, activityLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug signin endpoint called');
    
    // Test database connection
    const connectionTest = await db.execute('SELECT 1 as test');
    console.log('Connection test:', connectionTest);

    // Check all tables exist
    const tablesResult = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables = tablesResult.map((row: any) => row.table_name);
    console.log('Available tables:', tables);

    // Test user lookup
    const testEmail = 'test@example.com';
    console.log('Looking up user:', testEmail);
    
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    console.log('User lookup result:', userResult);

    if (userResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No test user found',
        tables,
        connectionTest
      });
    }

    const user = userResult[0];
    console.log('Found user:', { id: user.id, email: user.email, role: user.role });

    // Test password verification
    const testPassword = 'password123';
    console.log('Testing password verification...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password valid:', isPasswordValid);

    // Test team membership lookup
    console.log('Looking up team membership for user:', user.id);
    const teamMembershipResult = await db
      .select({
        teamId: teamMembers.teamId,
        teamName: teams.name,
        role: teamMembers.role
      })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    console.log('Team membership result:', teamMembershipResult);

    // Test activity log insertion
    console.log('Testing activity log insertion...');
    try {
      const activityResult = await db.insert(activityLogs).values({
        userId: user.id,
        teamId: teamMembershipResult[0]?.teamId || 1, // Default to team 1 if no membership
        action: 'test_signin',
        timestamp: new Date()
      }).returning();
      console.log('Activity log created:', activityResult);
    } catch (activityError) {
      console.error('Activity log error:', activityError);
      return NextResponse.json({
        success: false,
        error: 'Activity log insertion failed',
        activityError: activityError instanceof Error ? activityError.message : 'Unknown error',
        tables,
        user: { id: user.id, email: user.email },
        teamMembership: teamMembershipResult
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All signin components working',
      tables,
      user: { id: user.id, email: user.email, role: user.role },
      teamMembership: teamMembershipResult,
      passwordValid: isPasswordValid
    });

  } catch (error) {
    console.error('Debug signin error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
