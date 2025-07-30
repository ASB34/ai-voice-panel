import { NextResponse } from 'next/server';

export function checkDatabaseConnection() {
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json(
      { error: 'Database not configured. Please set POSTGRES_URL or DATABASE_URL environment variable.' },
      { status: 500 }
    );
  }
  
  return null; // Bağlantı var, devam et
}
