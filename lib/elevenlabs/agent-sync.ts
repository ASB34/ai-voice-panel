import { ElevenLabsClientWrapper } from './client';
import { db } from '../db/drizzle';
import { voiceAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ElevenLabsAgentData {
  agentId: string;
  name: string;
  conversationConfig: {
    agent: {
      first_message: string;
      language: string;
      prompt: {
        prompt: string;
        llm: string;
        temperature: number;
        max_tokens?: number;
      };
    };
    tts: {
      voiceId: string;
      modelId: string;
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
    asr?: {
      quality?: string;
      language?: string;
    };
    conversation?: {
      max_duration_seconds?: number;
      time_out_seconds?: number;
    };
  };
  platform_settings?: {
    widget_config?: any;
  };
}

export class AgentSyncService {
  private client: ElevenLabsClientWrapper;

  constructor(apiKey: string) {
    this.client = new ElevenLabsClientWrapper({ apiKey });
  }

  /**
   * Fetch agent data from ElevenLabs API with enhanced details
   */
  async fetchElevenLabsAgent(agentId: string): Promise<ElevenLabsAgentData | null> {
    try {
      const agentData = await this.client.getAgent(agentId);
      
      if (!agentData || !agentData.agentId) {
        throw new Error('Invalid agent data received from ElevenLabs');
      }

      return {
        agentId: agentData.agentId,
        name: agentData.name,
        conversationConfig: {
          agent: {
            first_message: agentData.conversationConfig?.agent?.first_message || '',
            language: agentData.conversationConfig?.agent?.language || 'en',
            prompt: {
              prompt: agentData.conversationConfig?.agent?.prompt?.prompt || '',
              llm: agentData.conversationConfig?.agent?.prompt?.llm || 'gpt-3.5-turbo',
              temperature: agentData.conversationConfig?.agent?.prompt?.temperature || 0.7,
              max_tokens: agentData.conversationConfig?.agent?.prompt?.max_tokens || 512,
            },
          },
          tts: {
            voiceId: agentData.conversationConfig?.tts?.voiceId || '',
            modelId: agentData.conversationConfig?.tts?.modelId || 'eleven_multilingual_v2',
            stability: agentData.conversationConfig?.tts?.stability || 0.5,
            similarity_boost: agentData.conversationConfig?.tts?.similarity_boost || 0.5,
            style: agentData.conversationConfig?.tts?.style || 0.0,
            use_speaker_boost: agentData.conversationConfig?.tts?.use_speaker_boost || true,
          },
          asr: agentData.conversationConfig?.asr || {},
          conversation: agentData.conversationConfig?.conversation || {},
        },
        platform_settings: agentData.platform_settings || {},
      };
    } catch (error) {
      console.error('Error fetching ElevenLabs agent:', error);
      return null;
    }
  }

  /**
   * Validate if an ElevenLabs agent ID exists and is accessible
   */
  async validateAgentId(agentId: string): Promise<boolean> {
    const agentData = await this.fetchElevenLabsAgent(agentId);
    return agentData !== null;
  }

  /**
   * Sync agent data from ElevenLabs to our database with enhanced details
   * ElevenLabs data takes priority over local data
   */
  async syncAgentFromElevenLabs(
    localAgentId: string,
    elevenLabsAgentId: string,
    customerId: number
  ): Promise<{ success: boolean; message: string; updatedFields?: string[] }> {
    try {
      // Fetch data from ElevenLabs
      const elevenLabsData = await this.fetchElevenLabsAgent(elevenLabsAgentId);
      
      if (!elevenLabsData) {
        return {
          success: false,
          message: 'Sunucudan agent verileri alınamadı. Lütfen Agent ID\'yi kontrol edin.',
        };
      }

      // Get current local agent data
      const [localAgent] = await db
        .select()
        .from(voiceAgents)
        .where(eq(voiceAgents.id, localAgentId))
        .limit(1);

      if (!localAgent) {
        return {
          success: false,
          message: 'Yerel agent bulunamadı.',
        };
      }

      // Prepare update data - ElevenLabs data takes priority
      const updatedFields: string[] = [];
      const updateData: any = {
        elevenLabsAgentId: elevenLabsAgentId,
        updatedAt: new Date(),
      };

      // Compare and update fields where ElevenLabs data differs
      if (localAgent.name !== elevenLabsData.name) {
        updateData.name = elevenLabsData.name;
        updatedFields.push('name');
      }

      if (localAgent.voice !== elevenLabsData.conversationConfig.tts.voiceId) {
        updateData.voice = elevenLabsData.conversationConfig.tts.voiceId;
        updatedFields.push('voice');
      }

      if (localAgent.systemPrompt !== elevenLabsData.conversationConfig.agent.prompt.prompt) {
        updateData.systemPrompt = elevenLabsData.conversationConfig.agent.prompt.prompt;
        updatedFields.push('systemPrompt');
      }

      // Enhanced sync fields
      if (localAgent.firstMessage !== elevenLabsData.conversationConfig.agent.first_message) {
        updateData.firstMessage = elevenLabsData.conversationConfig.agent.first_message;
        updatedFields.push('firstMessage');
      }

      // Convert temperature from 0-1 range to 0-100 range for our database
      const tempValue = Math.round((elevenLabsData.conversationConfig.agent.prompt.temperature || 0.7) * 100);
      if (localAgent.temperature !== tempValue) {
        updateData.temperature = tempValue;
        updatedFields.push('temperature');
      }

      if (localAgent.maxTokens !== (elevenLabsData.conversationConfig.agent.prompt.max_tokens || 512)) {
        updateData.maxTokens = elevenLabsData.conversationConfig.agent.prompt.max_tokens || 512;
        updatedFields.push('maxTokens');
      }

      if (localAgent.modelId !== elevenLabsData.conversationConfig.tts.modelId) {
        updateData.modelId = elevenLabsData.conversationConfig.tts.modelId;
        updatedFields.push('modelId');
      }

      // Voice settings sync
      const stabilityValue = Math.round((elevenLabsData.conversationConfig.tts.stability || 0.5) * 100);
      if (localAgent.stability !== stabilityValue) {
        updateData.stability = stabilityValue;
        updatedFields.push('stability');
      }

      const similarityValue = Math.round((elevenLabsData.conversationConfig.tts.similarity_boost || 0.5) * 100);
      if (localAgent.similarityBoost !== similarityValue) {
        updateData.similarityBoost = similarityValue;
        updatedFields.push('similarityBoost');
      }

      const styleValue = Math.round((elevenLabsData.conversationConfig.tts.style || 0.0) * 100);
      if (localAgent.style !== styleValue) {
        updateData.style = styleValue;
        updatedFields.push('style');
      }

      if (localAgent.useSpeakerBoost !== (elevenLabsData.conversationConfig.tts.use_speaker_boost !== false)) {
        updateData.useSpeakerBoost = elevenLabsData.conversationConfig.tts.use_speaker_boost !== false;
        updatedFields.push('useSpeakerBoost');
      }

      // Store voice settings as JSON
      const voiceSettings = {
        stability: elevenLabsData.conversationConfig.tts.stability,
        similarity_boost: elevenLabsData.conversationConfig.tts.similarity_boost,
        style: elevenLabsData.conversationConfig.tts.style,
        use_speaker_boost: elevenLabsData.conversationConfig.tts.use_speaker_boost,
      };
      const voiceSettingsStr = JSON.stringify(voiceSettings);
      if (localAgent.voiceSettings !== voiceSettingsStr) {
        updateData.voiceSettings = voiceSettingsStr;
        updatedFields.push('voiceSettings');
      }

      // Map ElevenLabs language code to our format
      const mappedLanguage = this.mapLanguageCode(elevenLabsData.conversationConfig.agent.language);
      if (localAgent.language !== mappedLanguage) {
        updateData.language = mappedLanguage;
        updatedFields.push('language');
      }

      // Map ElevenLabs LLM to our format
      const mappedModel = this.mapLLMModel(elevenLabsData.conversationConfig.agent.prompt.llm);
      if (localAgent.model !== mappedModel) {
        updateData.model = mappedModel;
        updatedFields.push('model');
      }

      // Update the database
      await db
        .update(voiceAgents)
        .set(updateData)
        .where(eq(voiceAgents.id, localAgentId));

        return {
          success: true,
          message: updatedFields.length > 0 
            ? `Agent başarıyla senkronize edildi. Güncellenen alanlar: ${updatedFields.join(', ')}`
            : 'Agent zaten senkronize. Değişiklik yapılmadı.',
          updatedFields,
        };    } catch (error) {
      console.error('Error syncing agent:', error);
      return {
        success: false,
        message: 'Agent senkronize edilirken hata oluştu.',
      };
    }
  }

  /**
   * Push local agent data to ElevenLabs (reverse sync)
   * Local data takes priority and overwrites server data
   */
  async pushAgentToElevenLabs(
    localAgentId: string,
    elevenLabsAgentId: string,
    customerId: number
  ): Promise<{ success: boolean; message: string; updatedFields?: string[] }> {
    try {
      // Get current local agent data
      const [localAgent] = await db
        .select()
        .from(voiceAgents)
        .where(eq(voiceAgents.id, localAgentId))
        .limit(1);

      if (!localAgent) {
        return {
          success: false,
          message: 'Yerel agent bulunamadı.',
        };
      }

      // Prepare ElevenLabs update data
      const updateConfig = {
        name: localAgent.name,
        voice_id: localAgent.voice,
        conversation_config: {
          agent: {
            prompt: localAgent.systemPrompt || '',
            first_message: localAgent.firstMessage || 'Hello! How can I help you today?',
            language: this.mapLanguageCodeToElevenLabs(localAgent.language),
          },
        },
      };

      // Update agent in ElevenLabs
      await this.client.updateAgent(elevenLabsAgentId, updateConfig);

      return {
        success: true,
        message: 'Yerel veriler başarıyla sunucuya gönderildi.',
        updatedFields: ['name', 'voice', 'systemPrompt', 'firstMessage', 'language'],
      };

    } catch (error) {
      console.error('Error pushing agent to ElevenLabs:', error);
      return {
        success: false,
        message: 'Yerel veriler sunucuya gönderilirken hata oluştu.',
      };
    }
  }

  /**
   * Create a new local agent from ElevenLabs agent data
   */
  async createAgentFromElevenLabs(
    elevenLabsAgentId: string,
    customerId: number,
    description?: string
  ): Promise<{ success: boolean; message: string; agentId?: string }> {
    try {
      // Fetch data from ElevenLabs
      const elevenLabsData = await this.fetchElevenLabsAgent(elevenLabsAgentId);
      
      if (!elevenLabsData) {
        return {
          success: false,
          message: 'Sunucudan agent verileri alınamadı. Lütfen Agent ID\'yi kontrol edin.',
        };
      }

      // Check if agent already exists with this ElevenLabs ID
      const [existingAgent] = await db
        .select()
        .from(voiceAgents)
        .where(eq(voiceAgents.elevenLabsAgentId, elevenLabsAgentId))
        .limit(1);

      if (existingAgent) {
        return {
          success: false,
          message: 'Bu Sunucu Agent ID\'si ile zaten bir agent mevcut.',
        };
      }

      // Create new agent with enhanced fields
      const [newAgent] = await db
        .insert(voiceAgents)
        .values({
          name: elevenLabsData.name,
          customerId,
          voice: elevenLabsData.conversationConfig.tts.voiceId,
          language: this.mapLanguageCode(elevenLabsData.conversationConfig.agent.language),
          description: description || `Sunucudan içe aktarıldı: ${elevenLabsData.name}`,
          systemPrompt: elevenLabsData.conversationConfig.agent.prompt.prompt,
          model: this.mapLLMModel(elevenLabsData.conversationConfig.agent.prompt.llm),
          elevenLabsAgentId: elevenLabsAgentId,
          isActive: true,
          // Enhanced fields from ElevenLabs
          firstMessage: elevenLabsData.conversationConfig.agent.first_message,
          temperature: Math.round((elevenLabsData.conversationConfig.agent.prompt.temperature || 0.7) * 100),
          maxTokens: elevenLabsData.conversationConfig.agent.prompt.max_tokens || 512,
          modelId: elevenLabsData.conversationConfig.tts.modelId,
          stability: Math.round((elevenLabsData.conversationConfig.tts.stability || 0.5) * 100),
          similarityBoost: Math.round((elevenLabsData.conversationConfig.tts.similarity_boost || 0.5) * 100),
          style: Math.round((elevenLabsData.conversationConfig.tts.style || 0.0) * 100),
          useSpeakerBoost: elevenLabsData.conversationConfig.tts.use_speaker_boost !== false,
          voiceSettings: JSON.stringify({
            stability: elevenLabsData.conversationConfig.tts.stability,
            similarity_boost: elevenLabsData.conversationConfig.tts.similarity_boost,
            style: elevenLabsData.conversationConfig.tts.style,
            use_speaker_boost: elevenLabsData.conversationConfig.tts.use_speaker_boost,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: `"${elevenLabsData.name}" adlı agent sunucu verilerinden başarıyla oluşturuldu.`,
        agentId: newAgent.id,
      };

    } catch (error) {
      console.error('Error creating agent from ElevenLabs:', error);
      return {
        success: false,
        message: 'Agent oluşturulurken hata oluştu.',
      };
    }
  }

  /**
   * Map ElevenLabs language codes to our format
   */
  private mapLanguageCode(elevenLabsLang: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'tr': 'tr-TR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
    };

    return languageMap[elevenLabsLang] || 'en-US';
  }

  /**
   * Map ElevenLabs LLM models to our format
   */
  private mapLLMModel(elevenLabsModel: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4': 'gpt-4',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gemini-2.5-flash': 'gpt-4-turbo', // Map to closest equivalent
      'claude-3-sonnet': 'gpt-4',
      'claude-3-haiku': 'gpt-3.5-turbo',
    };

    return modelMap[elevenLabsModel] || 'gpt-3.5-turbo';
  }

  /**
   * Map our language codes to ElevenLabs format (reverse mapping)
   */
  private mapLanguageCodeToElevenLabs(ourLang: string): string {
    const languageMap: Record<string, string> = {
      'en-US': 'en',
      'tr-TR': 'tr',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'it-IT': 'it',
      'pt-BR': 'pt',
      'ru-RU': 'ru',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh',
      'ar-SA': 'ar',
      'hi-IN': 'hi',
    };

    return languageMap[ourLang] || 'en';
  }

  /**
   * Get all available ElevenLabs agents for the user
   */
  async listElevenLabsAgents(): Promise<Array<{ agentId: string; name: string; createdAt: number }>> {
    try {
      const agents = await this.client.listAgents();
      return agents.map(agent => ({
        agentId: agent.agentId,
        name: agent.name,
        createdAt: agent.createdAtUnixSecs || 0,
      }));
    } catch (error) {
      console.error('Error listing ElevenLabs agents:', error);
      return [];
    }
  }
}

export default AgentSyncService;
