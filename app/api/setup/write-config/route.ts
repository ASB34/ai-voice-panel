import { NextResponse, NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    const requiredFields = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'ELEVENLABS_API_KEY',
      'JWT_SECRET'
    ];
    
    // Validate required fields
    for (const field of requiredFields) {
      if (!config[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Create .env content
    const envContent = `# Database
DATABASE_URL="${config.DATABASE_URL}"

# Authentication
JWT_SECRET="${config.JWT_SECRET}"

# Stripe Configuration
STRIPE_SECRET_KEY="${config.STRIPE_SECRET_KEY}"
STRIPE_PUBLISHABLE_KEY="${config.STRIPE_PUBLISHABLE_KEY}"
STRIPE_WEBHOOK_SECRET="${config.STRIPE_WEBHOOK_SECRET}"

# ElevenLabs Configuration
ELEVENLABS_API_KEY="${config.ELEVENLABS_API_KEY}"

# Application URLs
NEXT_PUBLIC_APP_URL="${config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}"

# Email Configuration (Optional)
${config.SMTP_HOST ? `SMTP_HOST="${config.SMTP_HOST}"` : '# SMTP_HOST=""'}
${config.SMTP_PORT ? `SMTP_PORT="${config.SMTP_PORT}"` : '# SMTP_PORT="587"'}
${config.SMTP_USER ? `SMTP_USER="${config.SMTP_USER}"` : '# SMTP_USER=""'}
${config.SMTP_PASS ? `SMTP_PASS="${config.SMTP_PASS}"` : '# SMTP_PASS=""'}
${config.FROM_EMAIL ? `FROM_EMAIL="${config.FROM_EMAIL}"` : '# FROM_EMAIL=""'}

# Setup completed
SETUP_COMPLETED="true"
`;
    
    // Write .env file
    const envPath = join(process.cwd(), '.env');
    await writeFile(envPath, envContent, 'utf8');
    
    return NextResponse.json({ 
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error: any) {
    console.error('Configuration write error:', error);
    return NextResponse.json({ 
      error: 'Failed to save configuration',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
