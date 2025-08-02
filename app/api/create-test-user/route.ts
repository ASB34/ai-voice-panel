import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db/drizzle';
import { hashPassword } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Test user bilgileri
    const email = "test@callcrafter.com";
    const password = "password123";
    const name = "Test User";

    // Şifreyi hash'le
    const passwordHash = await hashPassword(password);
    
    const client = getClient();

    // Önce team oluştur
    const teamResult = await client`
      INSERT INTO teams (name) 
      VALUES ('Test Team') 
      RETURNING id, name
    `;
    const team = teamResult[0];

    // User'ı oluştur
    const userResult = await client`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES (${email}, ${passwordHash}, ${name}, 'owner') 
      RETURNING id, email, name
    `;
    const user = userResult[0];

    // Team member olarak ekle
    await client`
      INSERT INTO team_members (user_id, team_id, role) 
      VALUES (${user.id}, ${team.id}, 'owner')
    `;

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
