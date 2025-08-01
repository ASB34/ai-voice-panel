export async function GET() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET', 
    'ADMIN_SECRET',
    'STRIPE_SECRET_KEY',
    'ELEVENLABS_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  const setVars = requiredEnvVars.filter(varName => process.env[varName]);

  return Response.json({
    message: 'Environment Variables Status',
    missing: missingVars,
    set: setVars,
    recommendations: {
      DATABASE_URL: 'PostgreSQL connection string from your database provider',
      AUTH_SECRET: 'Random secret key for JWT tokens (openssl rand -base64 32)',
      ADMIN_SECRET: 'Random secret key for admin authentication',
      STRIPE_SECRET_KEY: 'Stripe secret key for payments (sk_...)',
      ELEVENLABS_API_KEY: 'ElevenLabs API key for voice synthesis'
    },
    vercelInstructions: [
      '1. Go to https://vercel.com/dashboard',
      '2. Select your ai-voice-panel project',
      '3. Go to Settings > Environment Variables',
      '4. Add the missing environment variables',
      '5. Redeploy the application'
    ]
  });
}
