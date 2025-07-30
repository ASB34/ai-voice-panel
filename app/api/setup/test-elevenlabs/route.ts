import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { elevenLabsApiKey } = await request.json();
    
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key is required' }, { status: 400 });
    }
    
    // Test ElevenLabs API connection
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const user = await response.json();
      
      return NextResponse.json({ 
        success: true,
        userId: user.subscription?.tier || 'free'
      });
    } catch (error: any) {
      console.error('ElevenLabs connection test failed:', error);
      return NextResponse.json({ 
        error: 'ElevenLabs connection failed',
        details: error?.message || 'Unknown error'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('ElevenLabs test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
