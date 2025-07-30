import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { voiceAgents, conversations, conversationMessages, agentMetrics } from '@/lib/db/schema';
import { AgentSyncService } from '@/lib/elevenlabs/agent-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/voice-agents/[id] - Get voice agent details with conversations and metrics
export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    const { id } = await params;

    // Get agent details with conversations
    const agent = await db.query.voiceAgents.findFirst({
      where: eq(voiceAgents.id, id),
      with: {
        conversations: {
          with: {
            messages: true
          },
          orderBy: (conversations, { desc }) => [desc(conversations.startedAt)],
          limit: 10
        },
        metrics: {
          orderBy: (metrics, { desc }) => [desc(metrics.date)],
          limit: 30
        }
      }
    });

    if (!agent || agent.customerId !== session.user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Failed to fetch voice agent details:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/voice-agents/[id] - Update voice agent settings
export const PUT = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    const { id } = await params;

    // Verify ownership
    const existingAgent = await db.query.voiceAgents.findFirst({
      where: eq(voiceAgents.id, id),
    });

    if (!existingAgent || existingAgent.customerId !== session.user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    const json = await req.json();
    const { 
      name, 
      voice, 
      language, 
      description, 
      systemPrompt, 
      model, 
      customEndpoint, 
      customCredentials, 
      knowledgeBase,
      elevenLabsAgentId,
      // New ElevenLabs fields
      firstMessage,
      temperature,
      maxTokens,
      stability,
      similarityBoost,
      style,
      modelId
    } = json;

    const updatedAgent = await db
      .update(voiceAgents)
      .set({
        name: name ?? existingAgent.name,
        voice: voice ?? existingAgent.voice,
        language: language ?? existingAgent.language,
        description: description ?? existingAgent.description,
        systemPrompt: systemPrompt ?? existingAgent.systemPrompt,
        model: model ?? existingAgent.model,
        customEndpoint: customEndpoint ?? existingAgent.customEndpoint,
        customCredentials: customCredentials ?? existingAgent.customCredentials,
        knowledgeBase: knowledgeBase ?? existingAgent.knowledgeBase,
        elevenLabsAgentId: elevenLabsAgentId ?? existingAgent.elevenLabsAgentId,
        // New ElevenLabs fields
        firstMessage: firstMessage ?? existingAgent.firstMessage,
        temperature: temperature !== null ? Math.round(temperature * 100) : existingAgent.temperature, // Convert 0-2 to 0-200
        maxTokens: maxTokens ?? existingAgent.maxTokens,
        stability: stability !== null ? Math.round(stability * 100) : existingAgent.stability, // Convert 0-1 to 0-100
        similarityBoost: similarityBoost !== null ? Math.round(similarityBoost * 100) : existingAgent.similarityBoost, // Convert 0-1 to 0-100
        style: style !== null ? Math.round(style * 100) : existingAgent.style, // Convert 0-1 to 0-100
        modelId: modelId ?? existingAgent.modelId,
        updatedAt: new Date(),
      })
      .where(eq(voiceAgents.id, id))
      .returning();

    // Note: Manual ElevenLabs sync removed for performance
    // Use the dedicated Server Sync tab for ElevenLabs synchronization

    return NextResponse.json(updatedAgent[0]);
  } catch (error) {
    console.error('Failed to update voice agent:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/voice-agents/[id] - ElevenLabs agent validation and sync
export const POST = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    const { id } = await params;

    // Verify ownership
    const existingAgent = await db.query.voiceAgents.findFirst({
      where: eq(voiceAgents.id, id),
    });

    if (!existingAgent || existingAgent.customerId !== session.user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    const json = await req.json();
    const { action, elevenLabsAgentId } = json;

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Sunucu API anahtarı yapılandırılmamış' }, { status: 500 });
    }

    const syncService = new AgentSyncService(apiKey);

    switch (action) {
      case 'validate':
        const isValid = await syncService.validateAgentId(elevenLabsAgentId);
        return NextResponse.json({ 
          valid: isValid,
          message: isValid ? 'Agent ID geçerli' : 'Geçersiz Agent ID veya erişilebilir değil'
        });

      case 'sync':
        const syncResult = await syncService.syncAgentFromElevenLabs(
          id,
          elevenLabsAgentId,
          session.user.id
        );
        return NextResponse.json(syncResult);

      case 'pushToServer':
        const pushResult = await syncService.pushAgentToElevenLabs(
          id,
          elevenLabsAgentId,
          session.user.id
        );
        return NextResponse.json(pushResult);

      default:
        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in agent sync operation:', error);
    return NextResponse.json({ error: 'Senkronizasyon işlemi başarısız' }, { status: 500 });
  }
}
