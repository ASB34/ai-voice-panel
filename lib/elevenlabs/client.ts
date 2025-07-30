import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { AgentConfig, ConversationHistory, ElevenLabsConfig } from './types';

// Create a singleton instance
let client: ElevenLabsClient | null = null;

export function getElevenLabsClient(config?: ElevenLabsConfig): ElevenLabsClient {
  // Build sırasında API key gerekli değil, runtime'da kontrol et
  const apiKey = config?.apiKey || process.env.ELEVENLABS_API_KEY;
  
  if (!client && apiKey) {
    client = new ElevenLabsClient({ apiKey });
  }
  
  if (!client) {
    // Build sırasında placeholder client oluştur
    if (!apiKey && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
      throw new Error('ElevenLabs API key is required for production. Please set ELEVENLABS_API_KEY environment variable.');
    }
    
    // Development için placeholder
    client = new ElevenLabsClient({ apiKey: apiKey || 'placeholder-key-for-build' });
  }
  
  return client;
}

// Helper functions to maintain compatibility with our existing code
export class ElevenLabsClientWrapper {
  private client: ElevenLabsClient;

  constructor(config: ElevenLabsConfig) {
    // Build sırasında API key kontrolü yapma
    const apiKey = config.apiKey || process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
      throw new Error('ElevenLabs API key is required for production');
    }
    
    this.client = new ElevenLabsClient({ 
      apiKey: apiKey || 'placeholder-key-for-build' 
    });
  }

  // Create a new conversational agent using the official SDK
  async createAgent(config: {
    name: string;
    voice_id: string;
    conversation_config: {
      agent: {
        prompt: string;
        first_message: string;
        language?: string;
      };
    };
  }): Promise<{ agent_id: string }> {
    console.log('Creating agent with config:', JSON.stringify(config, null, 2));
    
    try {
      // Prepare the data according to SDK expectations
      const createData = {
        name: config.name,
        voiceId: config.voice_id,
        conversationConfig: {
          agent: {
            prompt: config.conversation_config.agent.prompt,
            firstMessage: config.conversation_config.agent.first_message,
            language: config.conversation_config.agent.language || 'en'
          }
        }
      };
      
      console.log('SDK create data:', JSON.stringify(createData, null, 2));
      
      const result = await this.client.conversationalAi.agents.create(createData);
      
      console.log('SDK result:', JSON.stringify(result, null, 2));
      return { agent_id: result.agentId };
    } catch (error: any) {
      console.error('ElevenLabs SDK Error:', error);
      if (error?.body) {
        console.error('Error body:', error.body);
      }
      if (error?.statusCode) {
        console.error('Status code:', error.statusCode);
      }
      throw error;
    }
  }

  // Get available voices
  async getVoices(): Promise<any[]> {
    console.log('Getting available voices...');
    const voices = await this.client.voices.getAll();
    console.log('Available voices:', voices);
    return voices.voices || [];
  }

  // Text to speech conversion
  async textToSpeech(options: {
    text: string;
    voice_id: string;
    model_id?: string;
    voice_settings?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  }): Promise<{ audio: ArrayBuffer; metadata?: any }> {
    const { text, voice_id, model_id = 'eleven_multilingual_v2', voice_settings } = options;

    const audio = await this.client.textToSpeech.convert(voice_id, {
      text,
      modelId: model_id,
      voiceSettings: voice_settings || {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
    });

    // Convert the audio stream to ArrayBuffer
    const reader = audio.getReader();
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return { audio: result.buffer };
  }

  // Get agent details with complete configuration
  async getAgent(agentId: string): Promise<any> {
    try {
      const agent = await this.client.conversationalAi.agents.get(agentId);
      console.log('Full agent data from ElevenLabs:', JSON.stringify(agent, null, 2));
      return agent;
    } catch (error) {
      console.error('Error getting agent details:', error);
      throw error;
    }
  }

  // Update agent configuration
  async updateAgent(agentId: string, config: {
    name?: string;
    voice_id?: string;
    conversation_config?: {
      agent?: {
        prompt?: string;
        first_message?: string;
        language?: string;
      };
    };
  }): Promise<any> {
    const updateData: any = {};
    if (config.name) updateData.name = config.name;
    if (config.voice_id) updateData.voiceId = config.voice_id;
    if (config.conversation_config?.agent) {
      updateData.conversationConfig = {
        agent: {
          prompt: config.conversation_config.agent.prompt,
          firstMessage: config.conversation_config.agent.first_message,
          language: config.conversation_config.agent.language
        }
      };
    }

    return await this.client.conversationalAi.agents.update(agentId, updateData);
  }

  // Delete agent
  async deleteAgent(agentId: string): Promise<void> {
    await this.client.conversationalAi.agents.delete(agentId);
  }

  // List all agents
  async listAgents(): Promise<any[]> {
    try {
      const result = await this.client.conversationalAi.agents.list();
      return result.agents || [];
    } catch (error) {
      console.error('Error listing agents:', error);
      return [];
    }
  }

  // Initialize a new conversation with an agent
  async startConversation(agentId: string): Promise<ConversationHistory> {
    // This method may not be available in current SDK version
    throw new Error('Conversation creation not available in current SDK version');
  }

  // Send a message to the agent
  async sendMessage(conversationId: string, message: string): Promise<void> {
    // This method may not be available in current SDK version
    throw new Error('Message sending not available in current SDK version');
  }

  // Get conversation history
  async getConversationHistory(conversationId: string): Promise<ConversationHistory> {
    // This method may not be available in current SDK version
    throw new Error('Conversation history not available in current SDK version');
  }

  // End a conversation
  async endConversation(conversationId: string): Promise<void> {
    // This method may not be available in current SDK version
    throw new Error('Conversation deletion not available in current SDK version');
  }

  // List conversations
  async listConversations(options?: {
    agentId?: string;
    cursor?: string;
    callSuccessful?: 'success' | 'failure' | 'unknown';
    callStartBeforeUnix?: number;
    callStartAfterUnix?: number;
    userId?: string;
    pageSize?: number;
  }): Promise<{
    conversations: any[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    try {
      const result = await this.client.conversationalAi.conversations.list({
        agentId: options?.agentId,
        cursor: options?.cursor,
        callSuccessful: options?.callSuccessful,
        callStartBeforeUnix: options?.callStartBeforeUnix,
        callStartAfterUnix: options?.callStartAfterUnix,
        pageSize: options?.pageSize || 30,
      });
      
      return {
        conversations: result.conversations || [],
        hasMore: result.hasMore || false,
        nextCursor: result.nextCursor,
      };
    } catch (error) {
      console.error('Error listing conversations:', error);
      return {
        conversations: [],
        hasMore: false,
      };
    }
  }

  // Get conversation details
  async getConversation(conversationId: string): Promise<any> {
    try {
      return await this.client.conversationalAi.conversations.get(conversationId);
    } catch (error) {
      console.error('Error getting conversation details:', error);
      throw error;
    }
  }

  // Get conversation audio
  async getConversationAudio(conversationId: string): Promise<ArrayBuffer> {
    try {
      // Using direct API call since SDK might not support this
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get conversation audio: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error getting conversation audio:', error);
      throw error;
    }
  }

  // Get agent metrics
  async getAgentMetrics(agentId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    // This might not be available in the SDK, keeping for compatibility
    throw new Error('Agent metrics not available in current SDK version');
  }

  // Update agent configuration (legacy method)
  async updateAgentConfig(agentId: string, config: Partial<AgentConfig>): Promise<void> {
    // Convert to new format and call updateAgent
    const newConfig: any = {};
    if (config.name) newConfig.name = config.name;
    // Note: voice_id mapping removed due to type incompatibility
    
    await this.updateAgent(agentId, newConfig);
  }

  // Phone Numbers Management
  // List all phone numbers available in ElevenLabs (system-wide)
  async listAllPhoneNumbers(): Promise<any[]> {
    try {
      // Get all available phone numbers in the system
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers`, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list phone numbers: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.phone_numbers || [];
    } catch (error) {
      console.error('Error listing phone numbers:', error);
      return [];
    }
  }

  // Check if a phone number exists in ElevenLabs and is available
  async checkPhoneNumberAvailability(phoneNumber: string): Promise<{
    exists: boolean;
    available: boolean;
    phoneNumberId?: string;
    assignedAgent?: any;
    phoneNumberData?: any;
  }> {
    try {
      const allNumbers = await this.listAllPhoneNumbers();
      const foundNumber = allNumbers.find(num => 
        num.phoneNumber === phoneNumber || num.phone_number === phoneNumber
      );
      
      if (!foundNumber) {
        return { exists: false, available: false };
      }
      
      // Numara mevcut, agent ataması var mı kontrol et
      const hasAssignment = foundNumber.assignedAgent || foundNumber.assigned_agent;
      
      return {
        exists: true,
        available: !hasAssignment, // Agent atanmamışsa available
        phoneNumberId: foundNumber.phoneNumberId || foundNumber.phone_number_id,
        assignedAgent: hasAssignment,
        phoneNumberData: foundNumber
      };
    } catch (error) {
      console.error('Error checking phone number availability:', error);
      return { exists: false, available: false };
    }
  }

  // Assign agent to phone number
  async assignAgentToPhoneNumber(phoneNumberId: string, agentId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          agent_id: agentId 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to assign agent to phone number: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error assigning agent to phone number:', error);
      throw error;
    }
  }

  // Remove agent assignment from phone number
  async unassignAgentFromPhoneNumber(phoneNumberId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          agent_id: null 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to unassign agent from phone number: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error unassigning agent from phone number:', error);
      throw error;
    }
  }

  // Get phone number details
  async getPhoneNumber(phoneNumberId: string): Promise<any> {
    try {
      return await this.client.conversationalAi.phoneNumbers.get(phoneNumberId);
    } catch (error) {
      console.error('Error getting phone number details:', error);
      throw error;
    }
  }
}
