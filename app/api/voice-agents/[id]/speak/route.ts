import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';

export const runtime = 'nodejs';

// POST /api/voice-agents/[id]/speak - Convert text to speech
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const json = await req.json();
    const { text, voice_id } = json;

    if (!text || !voice_id) {
      return NextResponse.json({ error: 'Missing required fields: text and voice_id' }, { status: 400 });
    }

    console.log('Text-to-speech request:', { text: text.substring(0, 50) + '...', voice_id });

    const client = new ElevenLabsClientWrapper({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });
    
    const result = await client.textToSpeech({
      text,
      voice_id,
    });

    if (!result.audio) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    }

    // Convert ArrayBuffer to Base64
    const buffer = Buffer.from(result.audio);
    const base64Audio = buffer.toString('base64');

    console.log('Text-to-speech successful, audio size:', buffer.length, 'bytes');

    return NextResponse.json({
      audio: base64Audio,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
