import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { AgentSyncService } from '@/lib/elevenlabs/agent-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/voice-agents/import - Import agent from ElevenLabs
export const POST = async (request: Request) => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { elevenLabsAgentId, description } = json;

    if (!elevenLabsAgentId) {
      return new NextResponse('Missing Server Agent ID', { status: 400 });
    }

    // Validate ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      return new NextResponse('Voice server API key not configured', { status: 500 });
    }

    // Initialize sync service
    const syncService = new AgentSyncService(process.env.ELEVENLABS_API_KEY);

    // Import agent from ElevenLabs
    const result = await syncService.createAgentFromElevenLabs(
      elevenLabsAgentId,
      session.user.id,
      description
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      agentId: result.agentId,
    });

  } catch (error) {
    console.error('Failed to import agent from voice server:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

// GET /api/voice-agents/import - Validate ElevenLabs Agent ID
export const GET = async (request: Request) => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const elevenLabsAgentId = searchParams.get('agentId');

    if (!elevenLabsAgentId) {
      return new NextResponse('Missing Server Agent ID', { status: 400 });
    }

    // Validate ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      return new NextResponse('Voice server API key not configured', { status: 500 });
    }

    // Initialize sync service
    const syncService = new AgentSyncService(process.env.ELEVENLABS_API_KEY);

    // Validate agent ID
    const isValid = await syncService.validateAgentId(elevenLabsAgentId);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, message: 'Invalid Agent ID or not accessible' },
        { status: 404 }
      );
    }

    // Fetch agent details for preview
    const agentData = await syncService.fetchElevenLabsAgent(elevenLabsAgentId);

    return NextResponse.json({
      valid: true,
      message: 'Agent found and ready to import',
      preview: {
        name: agentData?.name || 'Unknown',
        language: agentData?.conversationConfig?.agent?.language || 'en',
        voiceId: agentData?.conversationConfig?.tts?.voiceId || 'Unknown',
      }
    });

  } catch (error) {
    console.error('Failed to validate Server Agent ID:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};
