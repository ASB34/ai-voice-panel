import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Test signin attempt for:', email);

    // Check user exists
    const userWithTeam = await db
      .select({
        user: users,
        team: teams
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(users.email, email))
      .limit(1);

    console.log('User query result:', userWithTeam);

    if (userWithTeam.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { email, foundUsers: userWithTeam.length }
      }, { status: 401 });
    }

    const { user: foundUser, team: foundTeam } = userWithTeam[0];

    console.log('Found user:', { id: foundUser.id, email: foundUser.email });

    // Check password
    const isPasswordValid = await comparePasswords(password, foundUser.passwordHash);
    
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        debug: { email, passwordValid: isPasswordValid }
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name
      },
      team: foundTeam ? {
        id: foundTeam.id,
        name: foundTeam.name
      } : null
    });

  } catch (error) {
    console.error('Test signin error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
