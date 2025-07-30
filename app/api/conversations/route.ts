import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { voiceAgents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session);

    // Get user's agents from database
    const userAgents = await db
      .select()
      .from(voiceAgents)
      .where(eq(voiceAgents.customerId, session.user.id));

    if (userAgents.length === 0) {
      return NextResponse.json({ conversations: [], hasMore: false });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const cursor = searchParams.get('cursor');
    const callSuccessful = searchParams.get('callSuccessful');
    const callStartBeforeUnix = searchParams.get('callStartBeforeUnix');
    const callStartAfterUnix = searchParams.get('callStartAfterUnix');
    const pageSize = searchParams.get('pageSize');

    // Initialize ElevenLabs client
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    const client = new ElevenLabsClientWrapper({ apiKey: elevenlabsApiKey });

    // Get conversations for all user agents or specific agent
    let allConversations: any[] = [];
    const agentsToQuery = agentId && agentId !== 'all' 
      ? userAgents.filter(agent => agent.elevenLabsAgentId === agentId)
      : userAgents;

    for (const agent of agentsToQuery) {
      if (!agent.elevenLabsAgentId) continue;
      
      try {
        // Build options for each agent
        const options: any = {
          agentId: agent.elevenLabsAgentId,
          pageSize: parseInt(pageSize || '50'),
        };
        if (cursor) options.cursor = cursor;
        if (callSuccessful && callSuccessful !== 'all') options.callSuccessful = callSuccessful;
        if (callStartBeforeUnix) options.callStartBeforeUnix = parseInt(callStartBeforeUnix);
        if (callStartAfterUnix) options.callStartAfterUnix = parseInt(callStartAfterUnix);

        // Get conversations from ElevenLabs for this agent
        const result = await client.listConversations(options);
        
        console.log('ElevenLabs API result for agent', agent.name, ':', result);
        if (result.conversations && result.conversations.length > 0) {
          console.log('First conversation from ElevenLabs:', result.conversations[0]);
          console.log('Conversation keys:', Object.keys(result.conversations[0]));
        }
        
        // Add agent info to each conversation and map field names
        const conversationsWithAgent = result.conversations.map((conv: any) => ({
          // Map ElevenLabs camelCase to our expected format
          conversation_id: conv.conversationId,
          agent_id: conv.agentId || agent.elevenLabsAgentId,
          agent_name: conv.agentName || agent.name,
          start_time_unix_secs: conv.startTimeUnixSecs,
          call_duration_secs: conv.callDurationSecs,
          message_count: conv.messageCount,
          status: conv.status,
          call_successful: conv.callSuccessful,
          
          // Keep original fields for compatibility
          ...conv,
        }));
        
        allConversations.push(...conversationsWithAgent);
      } catch (error) {
        console.error(`Error fetching conversations for agent ${agent.name}:`, error);
        // Continue with other agents even if one fails
      }
    }

    // Sort by start time (newest first)
    allConversations.sort((a, b) => b.start_time_unix_secs - a.start_time_unix_secs);

    // Apply pagination
    const limit = parseInt(pageSize || '20');
    const paginatedConversations = allConversations.slice(0, limit);
    const hasMore = allConversations.length > limit;

    return NextResponse.json({
      conversations: paginatedConversations,
      hasMore,
      userAgents: userAgents.map(agent => ({
        id: agent.elevenLabsAgentId,
        name: agent.name,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 }
    );
  }
}
