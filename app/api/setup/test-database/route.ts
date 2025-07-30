import { NextResponse, NextRequest } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { databaseUrl } = await request.json();
    
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database URL is required' }, { status: 400 });
    }
    
    // Test database connection
    const client = new Client({ connectionString: databaseUrl });
    
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error?.message || 'Unknown error'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
