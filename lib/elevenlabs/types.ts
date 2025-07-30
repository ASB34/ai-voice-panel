export interface ConversationHistory {
  id: string;
  agentId: string;
  messages: ConversationMessage[];
  startedAt: Date;
  endedAt?: Date;
  duration: number; // in seconds
  status: 'active' | 'completed' | 'failed';
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  voice: string;
  language: string;
  model: LLMModel;
  systemPrompt: string;
  knowledgeBase?: string;
  customEndpoint?: string;
  customCredentials?: Record<string, string>;
}

export type LLMModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-sonnet-4'
  | 'claude-3.5-sonnet'
  | 'claude-3.0-haiku'
  | 'custom';

export interface AgentMetrics {
  id: string;
  agentId: string;
  totalConversations: number;
  totalDuration: number;
  averageConversationLength: number;
  successRate: number;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
}

export interface ElevenLabsConfig {
  apiKey: string;
  organizationId?: string;
}
