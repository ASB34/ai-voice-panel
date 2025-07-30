import { NextResponse, NextRequest } from 'next/server';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    const { databaseUrl } = await request.json();
    
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database URL is required' }, { status: 400 });
    }
    
    try {
      // First test basic connection
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      
      // Then run Drizzle migrations
      const migrationClient = postgres(databaseUrl, { max: 1 });
      const db = drizzle(migrationClient);
      
      // Run all migrations
      await migrate(db, { 
        migrationsFolder: './lib/db/migrations' 
      });
      
      // Close migration client
      await migrationClient.end();
      
      return NextResponse.json({ 
        success: true,
        message: 'Database setup and migrations completed successfully'
      });
    } catch (dbError: any) {
      console.error('Database setup error:', dbError);
      return NextResponse.json({ 
        error: 'Database setup failed',
        details: dbError?.message || 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Setup database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
