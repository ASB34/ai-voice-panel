import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = id;

    // Initialize ElevenLabs client
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    const client = new ElevenLabsClientWrapper({ apiKey: elevenlabsApiKey });

    // Get conversation audio from ElevenLabs
    const audioBuffer = await client.getConversationAudio(conversationId);

    // Return audio as a binary response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="conversation-${conversationId}.mp3"`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching conversation audio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation audio', details: error.message },
      { status: 500 }
    );
  }
}
