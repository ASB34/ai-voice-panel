import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/voice-agents/elevenlabs - List all ElevenLabs agents
export const GET = async (req: Request) => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      console.log('No session cookie found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user) {
      console.log('Invalid session token');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('User authenticated:', session.user);

    if (!process.env.ELEVENLABS_API_KEY) {
      console.log('ElevenLabs API key not configured');
      return new NextResponse('ElevenLabs API key not configured', { status: 500 });
    }

    console.log('Fetching ElevenLabs agents...');
    
    try {
      const client = new ElevenLabsClientWrapper({
        apiKey: process.env.ELEVENLABS_API_KEY
      });

      console.log('ElevenLabs client created, calling listAgents...');
      const agents = await client.listAgents();
      
      console.log('ElevenLabs agents retrieved:', {
        count: agents.length,
        agents: agents.map(agent => ({
          agent_id: agent.agent_id,
          name: agent.name,
          created_at: agent.created_at_unix_secs
        }))
      });

      return NextResponse.json({
        success: true,
        count: agents.length,
        agents: agents
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (elevenLabsError: any) {
      console.error('ElevenLabs API Error:', elevenLabsError);
      console.error('Error details:', {
        message: elevenLabsError.message,
        statusCode: elevenLabsError.statusCode,
        body: elevenLabsError.body
      });
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch ElevenLabs agents',
        details: {
          message: elevenLabsError.message,
          statusCode: elevenLabsError.statusCode,
          body: elevenLabsError.body
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to fetch ElevenLabs agents:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// OPTIONS request handler for CORS
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
