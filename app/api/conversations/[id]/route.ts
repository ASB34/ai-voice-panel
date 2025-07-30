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

    // Get conversation details from ElevenLabs
    console.log('🔍 API route called for conversation ID:', conversationId);
    const conversation = await client.getConversation(conversationId);
    
    console.log('📡 ElevenLabs API response:', JSON.stringify(conversation, null, 2));
    console.log('📡 Response keys:', Object.keys(conversation || {}));
    console.log('📡 Response type:', typeof conversation);
    console.log('📡 Response constructor:', conversation?.constructor?.name);

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation details', details: error.message },
      { status: 500 }
    );
  }
}
