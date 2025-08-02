import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/db/drizzle';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const connectionTest = await client`SELECT 1 as test`;
    
    // Check which tables exist
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    // Create missing tables if needed
    const createTablesResult = await createMissingTables();

    // Check if users table exists and its structure
    let usersTableStructure = null;
    try {
      usersTableStructure = await client`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
    } catch (e) {
      usersTableStructure = 'Table does not exist';
    }

    // Try to count users
    let userCount = null;
    try {
      const userCountResult = await client`SELECT COUNT(*) as count FROM users`;
      userCount = userCountResult[0].count;
    } catch (e) {
      userCount = 'Cannot count - table might not exist';
    }

    return NextResponse.json({
      success: true,
      connectionTest,
      tables: tables.map(t => t.table_name),
      createTablesResult,
      usersTableStructure,
      userCount,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
        dbUrlPrefix: (process.env.POSTGRES_URL || process.env.DATABASE_URL)?.substring(0, 30) || 'missing'
      }
    });

  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

async function createMissingTables() {
  try {
    // Create activity_logs table
    await client`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45)
      )
    `;

    // Create invitations table
    await client`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
      )
    `;

    return { success: true, message: 'Missing tables created' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
