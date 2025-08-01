// This script helps debug the admin login issue by checking environment variables
// and database connection in production

export async function GET() {
  try {
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'MISSING',
      ADMIN_SECRET: process.env.ADMIN_SECRET ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    console.log('🔍 Environment Variables Check:', envCheck);

    // Try to connect to database
    let dbStatus = 'UNKNOWN';
    let dbError = null;
    let adminCount = 0;

    try {
      const { db } = await import('@/lib/db/drizzle');
      const { adminUsers } = await import('@/lib/db/schema');
      
      // Check if database is accessible
      const admins = await db.select().from(adminUsers).limit(1);
      adminCount = admins.length;
      dbStatus = 'CONNECTED';
      
      console.log('🗃️ Database connection successful');
      console.log('👥 Admin users found:', adminCount);
      
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error instanceof Error ? error.message : String(error);
      console.error('💥 Database connection failed:', error);
    }

    return Response.json({
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError,
        adminCount: adminCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    return Response.json(
      { error: 'Debug check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
