import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const client = new ElevenLabsClientWrapper({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    // Test basic connection by getting voices
    const voices = await client.getVoices();
    
    return NextResponse.json({
      success: true,
      message: 'ElevenLabs connection successful',
      voicesCount: voices.length,
      voices: voices.slice(0, 5).map(v => ({ name: v.name, voice_id: v.voice_id }))
    });
  } catch (error: any) {
    console.error('ElevenLabs test error:', error);
    return NextResponse.json(
      { 
        error: 'ElevenLabs connection failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}