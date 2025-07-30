import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { voiceAgents } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// OPTIONS request handler for CORS
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// GET /api/voice-agents - List all voice agents
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

    console.log('Attempting to find agents for user:', session.user.id);
    
    try {
      const agents = await db.query.voiceAgents.findMany({
        where: eq(voiceAgents.customerId, session.user.id),
      });

      console.log('Found agents:', agents);

      if (!agents) {
        console.log('No agents found, returning empty array');
        return NextResponse.json([], {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }

      return NextResponse.json(agents, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      throw dbError; // This will be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Failed to fetch voice agents:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/voice-agents - Create a new voice agent
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
    const { name, voice, language, description, systemPrompt } = json;

    if (!name || !voice || !language) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create local agent first
    const [agent] = await db
      .insert(voiceAgents)
      .values({
        name,
        customerId: session.user.id,
        voice,
        language,
        description,
        systemPrompt: systemPrompt || `You are ${name}, a helpful AI assistant. You are professional, friendly, and knowledgeable.`,
        isActive: true,
      })
      .returning();

    // Try to create ElevenLabs agent (only if API key is available)
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const { createElevenLabsAgent } = await import('@/lib/elevenlabs/agent-manager');
        const elevenLabsAgentId = await createElevenLabsAgent(agent.id);
        console.log('ElevenLabs agent created:', elevenLabsAgentId);
      } catch (error: any) {
        console.error('Failed to create ElevenLabs agent:', error);
        
        // If it's a server error, log it but don't fail the request
        if (error.statusCode === 500) {
          console.warn('ElevenLabs ConvAI is experiencing server issues. Agent created locally only.');
        }
        // Continue even if ElevenLabs agent creation fails
      }
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Failed to create voice agent:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/voice-agents - Delete a voice agent
export const DELETE = async (request: Request) => {
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
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing agent ID', { status: 400 });
    }

    // Verify ownership
    const existingAgent = await db.query.voiceAgents.findFirst({
      where: eq(voiceAgents.id, id),
    });

    if (!existingAgent || existingAgent.customerId !== session.user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Delete from ElevenLabs if linked
    if (existingAgent.elevenLabsAgentId && process.env.ELEVENLABS_API_KEY) {
      try {
        const { deleteElevenLabsAgent } = await import('@/lib/elevenlabs/agent-manager');
        await deleteElevenLabsAgent(id);
      } catch (error) {
        console.error('Failed to delete ElevenLabs agent:', error);
        // Continue with local deletion even if ElevenLabs deletion fails
      }
    }

    await db.delete(voiceAgents).where(eq(voiceAgents.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete voice agent:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
