import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Check if .env file exists and has required keys
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const hasDatabase = envContent.includes('DATABASE_URL=') && !envContent.includes('DATABASE_URL=');
      const hasStripe = envContent.includes('STRIPE_SECRET_KEY=') && !envContent.includes('STRIPE_SECRET_KEY=');
      const hasAuth = envContent.includes('AUTH_SECRET=') && !envContent.includes('AUTH_SECRET=');
      
      if (hasDatabase && hasStripe && hasAuth) {
        return NextResponse.json({ isSetupComplete: true });
      }
    } catch (error) {
      // .env file doesn't exist
    }
    
    return NextResponse.json({ isSetupComplete: false });
  } catch (error) {
    return NextResponse.json({ isSetupComplete: false });
  }
}
