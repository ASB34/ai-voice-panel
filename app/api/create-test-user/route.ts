import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Test user bilgileri
    const email = "test@callcrafter.com";
    const password = "password123";
    const name = "Test User";

    // Şifreyi hash'le
    const passwordHash = await hashPassword(password);

    // Önce team oluştur
    const [team] = await db.insert(teams).values({
      name: "Test Team"
    }).returning();

    // User'ı oluştur
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: 'owner'
    }).returning();

    // Team member olarak ekle
    await db.insert(teamMembers).values({
      userId: user.id,
      teamId: team.id,
      role: 'owner'
    });

    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      team: {
        id: team.id,
        name: team.name
      },
      credentials: {
        email,
        password
      }
    });

  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
