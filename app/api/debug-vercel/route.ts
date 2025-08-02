import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development or with special query parameter
  const isDev = process.env.NODE_ENV === 'development';
  const hasDebugKey = request.nextUrl.searchParams.get('debug') === 'true';
  
  if (!isDev && !hasDebugKey) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET',
      AUTH_SECRET: process.env.AUTH_SECRET ? 'SET' : 'NOT SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
      BASE_URL: process.env.BASE_URL,
    };

    // Test database connection if available
    let dbStatus = 'NOT CONFIGURED';
    let dbError = null;
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      try {
        const { db } = await import('@/lib/db/drizzle');
        await db.execute('SELECT 1');
        dbStatus = 'CONNECTED';
      } catch (error) {
        dbStatus = 'ERROR';
        dbError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      timestamp: new Date().toISOString(),
      runtime: process.env.VERCEL_REGION || 'local',
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
