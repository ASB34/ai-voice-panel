import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Environment variables'ları kontrol et
    const authSecret = process.env.AUTH_SECRET;
    const adminSecret = process.env.ADMIN_SECRET;
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    return NextResponse.json({
      success: true,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAuthSecret: !!authSecret,
        hasAdminSecret: !!adminSecret,
        hasDatabaseUrl: !!databaseUrl,
        vercel: !!process.env.VERCEL,
        authSecretLength: authSecret?.length || 0,
        databaseUrlPrefix: databaseUrl?.substring(0, 20) || 'missing'
      }
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
