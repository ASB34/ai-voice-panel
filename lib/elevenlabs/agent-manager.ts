import { db } from '@/lib/db/drizzle';
import { voiceAgents, users } from '@/lib/db/schema';
import { eq, and, like } from 'drizzle-orm';
import { ElevenLabsClientWrapper } from './client';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

// Retry wrapper for ElevenLabs API calls
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // If it's a 500 error and we have retries left, try again
      if (error.statusCode === 500 && attempt < retries) {
        const delay = RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
        console.log(`${operationName} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors or no retries left, throw immediately
      throw error;
    }
  }
  
  throw lastError!;
}

// Generate agent name with counter if needed
export async function generateAgentName(userId: number): Promise<string> {
  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error('User not found');
  }

  let baseName = user.name || user.email.split('@')[0];
  
  // Clean the base name - remove special characters and numbers
  baseName = baseName.replace(/[^a-zA-Z\s]/g, '').trim();
  
  // If baseName is empty after cleaning, use a default
  if (!baseName) {
    baseName = 'Agent';
  }

  // Check how many agents this user already has
  const existingAgents = await db.query.voiceAgents.findMany({
    where: eq(voiceAgents.customerId, userId)
  });

  if (existingAgents.length === 0) {
    return baseName;
  } else {
    return `${baseName} ${existingAgents.length + 1}`;
  }
}

// Create ElevenLabs agent and sync with local database
export async function createElevenLabsAgent(localAgentId: string): Promise<string> {
  const localAgent = await db.query.voiceAgents.findFirst({
    where: eq(voiceAgents.id, localAgentId),
    with: {
      customer: true
    }
  });

  if (!localAgent) {
    throw new Error('Local agent not found');
  }

  // Generate agent name
  const agentName = await generateAgentName(localAgent.customerId);

  // Get ElevenLabs client
  const client = new ElevenLabsClientWrapper({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  // Get available voices to verify the voice_id
  try {
    const voicesResponse: any = await client.getVoices();
    const voices = voicesResponse.voices || voicesResponse; // Handle response structure
    console.log('Available voice IDs:', voices.map((v: any) => v.voice_id || v.voiceId));
  } catch (error) {
    console.error('Failed to get voices:', error);
  }

  // Use the voice from local agent since we confirmed Gülsu is available
  let voiceId = localAgent.voice;
  
  console.log('Using voice ID:', voiceId);

  // Create agent in ElevenLabs
  const config = {
    name: agentName,
    voice_id: voiceId,
    conversation_config: {
      agent: {
        prompt: localAgent.systemPrompt || `You are ${agentName}, a helpful AI assistant.`,
        first_message: `Hello! I'm ${agentName}. How can I help you today?`,
        language: localAgent.language?.split('-')[0] || 'en'
      }
    }
  };

  console.log('Final agent config:', JSON.stringify(config, null, 2));

  try {
    const elevenLabsAgent = await withRetry(
      () => client.createAgent(config),
      'ElevenLabs agent creation'
    );

    // Update local agent with ElevenLabs agent ID
    await db
      .update(voiceAgents)
      .set({
        elevenLabsAgentId: elevenLabsAgent.agent_id,
        updatedAt: new Date()
      })
      .where(eq(voiceAgents.id, localAgentId));

    return elevenLabsAgent.agent_id;
  } catch (error: any) {
    console.error('Failed to create ElevenLabs agent after retries:', error);
    
    // If it's a server error (500), skip ElevenLabs agent creation for now
    if (error.statusCode === 500) {
      console.warn('ElevenLabs ConvAI is experiencing server issues. Skipping agent creation for now.');
      
      // Update local agent to indicate ElevenLabs creation was skipped
      await db
        .update(voiceAgents)
        .set({
          elevenLabsAgentId: null, // Keep null to indicate no ElevenLabs agent
          updatedAt: new Date()
        })
        .where(eq(voiceAgents.id, localAgentId));
      
      // Return a placeholder ID to indicate local-only agent
      return 'LOCAL_ONLY_' + localAgentId;
    }
    
    // For other errors, throw them
    throw error;
  }
}

// Sync local agent updates to ElevenLabs
export async function syncAgentToElevenLabs(localAgentId: string): Promise<void> {
  const localAgent = await db.query.voiceAgents.findFirst({
    where: eq(voiceAgents.id, localAgentId)
  });

  if (!localAgent || !localAgent.elevenLabsAgentId) {
    throw new Error('Agent not found or not linked to ElevenLabs');
  }

  const client = new ElevenLabsClientWrapper({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  // Update ElevenLabs agent
  await withRetry(
    () => client.updateAgent(localAgent.elevenLabsAgentId!, {
      name: localAgent.name,
      voice_id: localAgent.voice,
      conversation_config: {
        agent: {
          prompt: localAgent.systemPrompt || `You are a helpful AI assistant named ${localAgent.name}. You are professional, friendly, and knowledgeable.`,
          first_message: localAgent.description || `Hello! I'm ${localAgent.name}, your AI assistant. How can I help you today?`,
          language: localAgent.language || 'en'
        }
      }
    }),
    'ElevenLabs agent sync'
  );
}

// Delete ElevenLabs agent
export async function deleteElevenLabsAgent(localAgentId: string): Promise<void> {
  const localAgent = await db.query.voiceAgents.findFirst({
    where: eq(voiceAgents.id, localAgentId)
  });

  if (!localAgent || !localAgent.elevenLabsAgentId) {
    return; // Nothing to delete
  }

  const client = new ElevenLabsClientWrapper({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  try {
    await client.deleteAgent(localAgent.elevenLabsAgentId);
  } catch (error) {
    console.error('Failed to delete ElevenLabs agent:', error);
    // Continue with local deletion even if ElevenLabs deletion fails
  }
}

// Create agent for new subscription
export async function createAgentForNewSubscription(userId: number): Promise<string> {
  // Generate agent name
  const agentName = await generateAgentName(userId);

  // Get user details for default settings
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Create local agent first
  const [localAgent] = await db
    .insert(voiceAgents)
    .values({
      name: agentName,
      customerId: userId,
      voice: 'jbJMQWv1eS4YjQ6PCcn6', // Default to Gülsu voice
      language: 'tr-TR', // Default to Turkish
      description: `${agentName} AI assistant - ready to help!`,
      systemPrompt: `You are ${agentName}, a helpful AI assistant. You are professional, friendly, and knowledgeable. Always be helpful and respond in a natural, conversational way.`,
      isActive: true
    })
    .returning();

  // Create ElevenLabs agent
  const elevenLabsAgentId = await createElevenLabsAgent(localAgent.id);

  return localAgent.id;
}
