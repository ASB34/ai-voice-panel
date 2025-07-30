'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VoiceAgent, Conversation, ConversationMessage, AgentMetric } from '@/lib/db/schema';

// Available voices and languages (aynı page.tsx'teki gibi)
const AVAILABLE_VOICES = [
  // Turkish voices
  { id: 'jbJMQWv1eS4YjQ6PCcn6', name: 'Gülsu (Turkish)', language: 'tr' },
  { id: 'xyqF3vGMQlPk3e7yA4DI', name: 'Ahu (Turkish)', language: 'tr' },
  { id: 'TASY7VCrU29rEMoYFTGG', name: 'Hürrem (Turkish)', language: 'tr' },
  
  // English voices
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (English)', language: 'en' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (English)', language: 'en' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (English)', language: 'en' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (English)', language: 'en' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (English)', language: 'en' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (English)', language: 'en' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (English)', language: 'en' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (English)', language: 'en' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (English)', language: 'en' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Emily (English)', language: 'en' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (English)', language: 'en' },
];

const AVAILABLE_LANGUAGES = [
  { id: 'tr-TR', name: 'Türkçe' },
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es-ES', name: 'Spanish (Spain)' },
  { id: 'fr-FR', name: 'French (France)' },
  { id: 'de-DE', name: 'German' },
  { id: 'it-IT', name: 'Italian' },
  { id: 'pt-PT', name: 'Portuguese' },
  { id: 'nl-NL', name: 'Dutch' },
  { id: 'pl-PL', name: 'Polish' },
];

const AVAILABLE_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
];

type AgentDetails = VoiceAgent & {
  conversations: (Conversation & {
    messages: ConversationMessage[];
  })[];
  metrics: AgentMetric[];
};

export default function VoiceAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('voiceAgents');
  const tSync = useTranslations('serverSync');
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
    agentData?: any;
  } | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAgentDetails();
  }, [id]);

  const loadAgentDetails = async () => {
    try {
      const response = await fetch(`/api/voice-agents/${id}`);
      if (!response.ok) throw new Error('Failed to load agent details');
      const data = await response.json();
      setAgent(data);
      setElevenLabsAgentId(data.elevenLabsAgentId || '');
    } catch (error) {
      console.error('Error loading agent details:', error);
      toast.error('Failed to load agent details');
    }
  };

  const handleValidateAgent = async () => {
    if (!elevenLabsAgentId.trim()) {
      toast.error(tSync('enterAgentId'));
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch(`/api/voice-agents/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          elevenLabsAgentId: elevenLabsAgentId.trim(),
        }),
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.valid) {
        toast.success(tSync('validId'));
      } else {
        toast.error(result.message || tSync('invalidId'));
      }
    } catch (error) {
      console.error('Error validating agent:', error);
      toast.error(tSync('invalidId'));
      setValidationResult({
        valid: false,
        message: tSync('invalidId')
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSyncAgent = async () => {
    if (!validationResult?.valid) {
      toast.error(tSync('validateFirst'));
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch(`/api/voice-agents/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          elevenLabsAgentId: elevenLabsAgentId.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(tSync('syncSuccess'));
        await loadAgentDetails(); // Reload agent data
      } else {
        toast.error(result.message || tSync('syncError'));
      }
    } catch (error) {
      console.error('Error syncing agent:', error);
      toast.error(tSync('syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get('name'),
        voice: formData.get('voice'),
        language: formData.get('language'),
        description: formData.get('description'),
        systemPrompt: formData.get('systemPrompt'),
        model: formData.get('model'),
        customEndpoint: formData.get('customEndpoint'),
        customCredentials: formData.get('customCredentials'),
        knowledgeBase: formData.get('knowledgeBase'),
        elevenLabsAgentId: formData.get('elevenLabsAgentId'),
        // New ElevenLabs fields
        firstMessage: formData.get('firstMessage'),
        temperature: formData.get('temperature') ? parseFloat(formData.get('temperature') as string) : null,
        maxTokens: formData.get('maxTokens') ? parseInt(formData.get('maxTokens') as string) : null,
        stability: formData.get('stability') ? parseFloat(formData.get('stability') as string) : null,
        similarityBoost: formData.get('similarityBoost') ? parseFloat(formData.get('similarityBoost') as string) : null,
        style: formData.get('style') ? parseFloat(formData.get('style') as string) : null,
        modelId: formData.get('modelId'),
      };

      const response = await fetch(`/api/voice-agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update agent');

      toast.success(t('agentUpdated'));
      await loadAgentDetails();

      // Auto-sync to ElevenLabs if enabled and agent is connected
      if (autoSyncEnabled && agent?.elevenLabsAgentId && validationResult?.valid) {
        console.log('Auto-syncing to ElevenLabs...');
        try {
          const syncResponse = await fetch(`/api/voice-agents/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'pushToServer',
              elevenLabsAgentId: agent.elevenLabsAgentId,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            if (syncResult.success) {
              toast.success(t('autoSyncSuccess'));
            }
          }
        } catch (syncError) {
          console.error('Auto-sync failed:', syncError);
          toast.warning(t('autoSyncFailed'));
        }
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) return <div>Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <p className="text-muted-foreground">
            Configure your agent and view its performance
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="sync">{tSync('title')}</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>
                Configure your agent's behavior and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={agent.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elevenLabsAgentId">Sunucu Agent ID</Label>
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <Input
                          id="elevenLabsAgentId"
                          name="elevenLabsAgentId"
                          defaultValue={agent.elevenLabsAgentId || ''}
                          placeholder="agent_xxxxxxxxxxxxxxxxxxxx"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            const input = document.getElementById('elevenLabsAgentId') as HTMLInputElement;
                            const agentId = input.value.trim();
                            
                            if (!agentId) {
                              toast.error('Please enter a Server Agent ID');
                              return;
                            }

                            try {
                              const response = await fetch('/api/voice-agents/elevenlabs', {
                                method: 'GET',
                              });

                              if (!response.ok) {
                                throw new Error('Failed to fetch Server agents');
                              }

                              const data = await response.json();
                              const foundAgent = data.agents?.find((a: any) => a.agentId === agentId);

                              if (foundAgent) {
                                toast.success(`✅ Valid Server agent found: "${foundAgent.name}"`);
                              } else {
                                toast.error('❌ Sunucu agent bu ID ile bulunamadı');
                              }
                            } catch (error) {
                              console.error('Error validating Server agent:', error);
                              toast.error('Sunucu agent ID doğrulanamadı');
                            }
                          }}
                        >
                          Doğrula
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mevcut bir Sunucu ConvAI agent'ına manuel olarak bağlanın. ID'nin var olup olmadığını kontrol etmek için "Doğrula" tıklayın.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select name="model" defaultValue={agent.model}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voice">Voice</Label>
                    <div className="flex gap-2">
                      <Select name="voice" defaultValue={agent.voice}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_VOICES.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isTestingVoice}
                        onClick={async () => {
                          setIsTestingVoice(true);
                          try {
                            // Get the currently selected voice from the select element
                            const voiceSelect = document.querySelector('select[name="voice"]') as HTMLSelectElement;
                            const selectedVoice = voiceSelect?.value || agent.voice;
                            
                            if (!selectedVoice) {
                              toast.error('Please select a voice first');
                              return;
                            }

                            // Find the selected voice info to determine language
                            const selectedVoiceInfo = AVAILABLE_VOICES.find(v => v.id === selectedVoice);
                            const voiceLanguage = selectedVoiceInfo?.language || 'en';
                            
                            // Test messages in different languages
                            const testMessages = {
                              'tr': 'Merhaba! Ben sizin yapay zeka ses asistanınızım. Size nasıl yardımcı olabilirim?',
                              'en': 'Hello! I am your AI voice assistant. How can I help you today?'
                            };
                            
                            const testText = testMessages[voiceLanguage as keyof typeof testMessages] || testMessages.en;
                            
                            console.log('Testing voice:', {
                              id: selectedVoice,
                              name: selectedVoiceInfo?.name,
                              language: voiceLanguage,
                              testText: testText.substring(0, 30) + '...'
                            });
                            
                            const response = await fetch(`/api/voice-agents/${id}/speak`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                text: testText,
                                voice_id: selectedVoice,
                              }),
                            });

                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              console.error('Voice test failed:', errorData);
                              throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                            }

                            const data = await response.json();
                            console.log('Voice test response:', data);
                            
                            if (data.audio) {
                              const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
                              await audio.play();
                              const languageName = voiceLanguage === 'tr' ? 'Turkish' : 'English';
                              toast.success(`Voice test successful! (${languageName})`);
                            } else {
                              throw new Error('No audio data received from server');
                            }
                          } catch (error) {
                            console.error('Error testing voice:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            toast.error(`Failed to test voice: ${errorMessage}`);
                          } finally {
                            setIsTestingVoice(false);
                          }
                        }}
                      >
                        {isTestingVoice ? 'Testing...' : 'Test Voice'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select name="language" defaultValue={agent.language}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={agent.description || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    defaultValue={agent.systemPrompt || ''}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">First Message</Label>
                  <Textarea
                    id="firstMessage"
                    name="firstMessage"
                    defaultValue={agent.firstMessage || ''}
                    placeholder="The first message your agent will say..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      name="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      defaultValue={agent.temperature ? (agent.temperature / 100).toString() : '0.7'}
                      placeholder="0.7"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness (0.0 = focused, 2.0 = creative)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      name="maxTokens"
                      type="number"
                      min="1"
                      max="4000"
                      defaultValue={agent.maxTokens?.toString() || '1000'}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum response length
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Voice Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stability">Stability</Label>
                      <Input
                        id="stability"
                        name="stability"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue={agent.stability ? (agent.stability / 100).toString() : '0.5'}
                        placeholder="0.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Voice consistency
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="similarityBoost">Similarity Boost</Label>
                      <Input
                        id="similarityBoost"
                        name="similarityBoost"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue={agent.similarityBoost ? (agent.similarityBoost / 100).toString() : '0.8'}
                        placeholder="0.8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Voice similarity
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">Style</Label>
                      <Input
                        id="style"
                        name="style"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue={agent.style ? (agent.style / 100).toString() : '0.0'}
                        placeholder="0.0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Voice style intensity
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelId">TTS Model</Label>
                  <Select name="modelId" defaultValue={agent.modelId || 'eleven_turbo_v2_5'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select TTS model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eleven_turbo_v2_5">Turbo v2.5 (Fast)</SelectItem>
                      <SelectItem value="eleven_multilingual_v2">Multilingual v2</SelectItem>
                      <SelectItem value="eleven_monolingual_v1">Monolingual v1</SelectItem>
                      <SelectItem value="eleven_turbo_v2">Turbo v2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="knowledgeBase">Knowledge Base</Label>
                  <Textarea
                    id="knowledgeBase"
                    name="knowledgeBase"
                    defaultValue={agent.knowledgeBase || ''}
                    placeholder="Add specific knowledge for your agent..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Context and information your agent should know
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customEndpoint">Custom API Endpoint (Optional)</Label>
                  <Input
                    id="customEndpoint"
                    name="customEndpoint"
                    defaultValue={agent.customEndpoint || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCredentials">Custom API Credentials (Optional)</Label>
                  <Input
                    id="customCredentials"
                    name="customCredentials"
                    type="password"
                    defaultValue={agent.customCredentials || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="knowledgeBase">Knowledge Base</Label>
                  <Textarea
                    id="knowledgeBase"
                    name="knowledgeBase"
                    defaultValue={agent.knowledgeBase || ''}
                    rows={4}
                  />
                </div>

                {/* Auto-sync setting */}
                {agent.elevenLabsAgentId && (
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="autoSync" className="text-sm font-medium text-blue-800">
                      {t('autoSyncDescription')}
                    </Label>
                    <span className="text-xs text-blue-600">
                      (Agent connected to: {agent.elevenLabsAgentId})
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="autoSync" className="text-sm">
                      {tSync('autoSyncToServer')}
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>

                  {agent.elevenLabsAgentId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          const response = await fetch('/api/voice-agents/elevenlabs', {
                            method: 'GET',
                          });

                          if (!response.ok) {
                            throw new Error('Failed to fetch Server agents');
                          }

                          const data = await response.json();
                          const serverAgent = data.agents?.find((a: any) => a.agentId === agent.elevenLabsAgentId);

                          if (serverAgent) {
                            toast.success(`✅ Sunucu agent bulundu: "${serverAgent.name}"`);
                            console.log('Server agent details:', serverAgent);
                            
                            // Optionally auto-fill some data from Server
                            // This would require another API call to get detailed agent info
                          } else {
                            toast.error('❌ Sunucu agent bulunamadı');
                          }
                        } catch (error) {
                          console.error('Error syncing from Server:', error);
                          toast.error('Sunucudan senkronizasyon başarısız');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      🔄 Sunucudan Senkronize Et
                    </Button>
                  )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tSync('title')}</CardTitle>
              <CardDescription>
                {tSync('description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent ID Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elevenLabsAgentId">{tSync('agentId')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="elevenLabsAgentId"
                      value={elevenLabsAgentId}
                      onChange={(e) => {
                        setElevenLabsAgentId(e.target.value);
                        setValidationResult(null); // Reset validation when ID changes
                      }}
                      placeholder="agent_xxxxxxxxxxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateAgent}
                      disabled={isValidating || !elevenLabsAgentId.trim()}
                    >
                      {isValidating ? tSync('validating') : tSync('validate')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tSync('agentIdHelper')}
                  </p>
                </div>

                {/* Validation Result */}
                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.valid 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>{validationResult.valid ? '✅' : '❌'}</span>
                      <span className="font-medium">
                        {validationResult.valid ? tSync('validId') : tSync('invalidId')}
                      </span>
                    </div>
                    {validationResult.message && (
                      <p className="mt-1 text-sm">{validationResult.message}</p>
                    )}
                    {validationResult.valid && validationResult.agentData && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <strong>{tSync('agentName')}:</strong> {validationResult.agentData.name}
                        </p>
                        <p className="text-sm">
                          <strong>{tSync('agentVoice')}:</strong> {validationResult.agentData.voice?.name || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <strong>{tSync('agentLanguage')}:</strong> {validationResult.agentData.language || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sync Button */}
                {validationResult?.valid && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSyncAgent}
                      disabled={isSyncing}
                      className="flex-1"
                    >
                      {isSyncing ? tSync('syncing') : tSync('syncNow')}
                    </Button>
                  </div>
                )}

                {/* Current Status */}
                <div className="space-y-2">
                  <Label>{tSync('currentStatus')}</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{tSync('localAgent')}:</span>
                        <p className="text-muted-foreground">{agent?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">{tSync('serverAgent')}:</span>
                        <p className="text-muted-foreground">
                          {agent?.elevenLabsAgentId ? `${agent.elevenLabsAgentId}` : tSync('notConnected')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sync Information */}
                <div className="space-y-2">
                  <Label>{tSync('syncInfo.title')}</Label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• {tSync('syncInfo.agentName')}</li>
                      <li>• {tSync('syncInfo.voiceId')}</li>
                      <li>• {tSync('syncInfo.systemPrompt')}</li>
                      <li>• {tSync('syncInfo.firstMessage')}</li>
                      <li>• {tSync('syncInfo.language')}</li>
                      <li>• {tSync('syncInfo.model')}</li>
                      <li>• {tSync('syncInfo.temperature')}</li>
                      <li>• {tSync('syncInfo.maxTokens')}</li>
                      <li>• {tSync('syncInfo.voiceSettings')}</li>
                      <li>• {tSync('syncInfo.ttsModel')}</li>
                    </ul>
                    <p className="mt-3 text-sm font-medium text-blue-700">
                      ⚠️ {tSync('syncInfo.priority')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                View and analyze recent conversations with this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!agent.conversations || agent.conversations.length === 0 ? (
                <p className="text-muted-foreground">No conversations yet</p>
              ) : (
                <div className="space-y-4">
                  {agent.conversations.map((conversation) => (
                    <Card key={conversation.id}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Conversation {new Date(conversation.startedAt).toLocaleString()}
                        </CardTitle>
                        <CardDescription>
                          Duration: {conversation.duration} seconds • 
                          Status: {conversation.status}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {conversation.messages && conversation.messages.map((message, index) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`rounded-lg p-3 max-w-[80%] ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{message.content}</p>
                                {message.audioUrl && (
                                  <audio
                                    controls
                                    src={message.audioUrl}
                                    className="mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                View your agent's performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!agent.metrics || agent.metrics.length === 0 ? (
                <p className="text-muted-foreground">No metrics available yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Conversations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {agent.metrics?.[0]?.totalConversations || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Average Duration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {agent.metrics?.[0]?.averageConversationLength || 0}s
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Success Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {agent.metrics?.[0]?.successRate || 0}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Duration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.round((agent.metrics?.[0]?.totalDuration || 0) / 60)} mins
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
