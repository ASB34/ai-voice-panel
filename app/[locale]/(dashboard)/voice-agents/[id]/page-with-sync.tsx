'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import type { VoiceAgent, Conversation, ConversationMessage, AgentMetric } from '@/lib/db/schema';

// Available voices and languages
const AVAILABLE_VOICES = [
  // Turkish voices
  { id: 'jbJMQWv1eS4YjQ6PCcn6', name: 'Gülsu (Turkish)' },
  { id: 'xyqF3vGMQlPk3e7yA4DI', name: 'Ahu (Turkish)' },
  { id: 'TASY7VCrU29rEMoYFTGG', name: 'Hürrem (Turkish)' },
  
  // English voices
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (English)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (English)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (English)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (English)' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (English)' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (English)' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (English)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (English)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (English)' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Emily (English)' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (English)' },
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
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success?: boolean;
    message?: string;
    updatedFields?: string[];
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAgentDetails();
  }, [id]);

  useEffect(() => {
    if (agent?.elevenLabsAgentId) {
      setElevenLabsAgentId(agent.elevenLabsAgentId);
    }
  }, [agent]);

  const loadAgentDetails = async () => {
    try {
      const response = await fetch(`/api/voice-agents/${id}`);
      if (!response.ok) throw new Error('Failed to load agent details');
      const data = await response.json();
      setAgent(data);
    } catch (error) {
      console.error('Error loading agent details:', error);
      toast.error('Failed to load agent details');
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
        elevenLabsAgentId: elevenLabsAgentId || null,
      };

      const response = await fetch(`/api/voice-agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update agent');

      toast.success('Agent updated successfully');
      loadAgentDetails();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAgent = async () => {
    if (!elevenLabsAgentId.trim()) {
      toast.error('Lütfen bir Sunucu Agent ID girin');
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
        toast.success('Agent ID geçerli!');
      } else {
        toast.error(result.message || 'Geçersiz Agent ID');
      }
    } catch (error) {
      console.error('Error validating agent:', error);
      toast.error('Agent ID doğrulanamadı');
      setValidationResult({
        valid: false,
        message: 'Agent ID doğrulanamadı'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSyncAgent = async () => {
    if (!elevenLabsAgentId.trim()) {
      toast.error('Lütfen bir Sunucu Agent ID girin');
      return;
    }

    if (validationResult && !validationResult.valid) {
      toast.error('Lütfen önce Agent ID\'yi doğrulayın');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

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
      setSyncResult(result);

      if (result.success) {
        toast.success(result.message);
        loadAgentDetails(); // Reload agent data to show updated values
      } else {
        toast.error(result.message || 'Agent senkronize edilemedi');
      }
    } catch (error) {
      console.error('Error syncing agent:', error);
      toast.error('Agent senkronize edilemedi');
      setSyncResult({
        success: false,
        message: 'Agent senkronize edilemedi'
      });
    } finally {
      setIsSyncing(false);
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
          <TabsTrigger value="elevenlabs">Sunucu Sync</TabsTrigger>
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
                    <Label htmlFor="voice">Voice</Label>
                    <Select name="voice" defaultValue={agent.voice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_VOICES.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select name="language" defaultValue={agent.language}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_LANGUAGES.map((language) => (
                          <SelectItem key={language.id} value={language.id}>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select name="model" defaultValue={agent.model}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={agent.description || ''}
                    placeholder="Brief description of your agent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    defaultValue={agent.systemPrompt || ''}
                    placeholder="Define your agent's behavior and personality"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customEndpoint">Custom Endpoint (Optional)</Label>
                    <Input
                      id="customEndpoint"
                      name="customEndpoint"
                      defaultValue={agent.customEndpoint || ''}
                      placeholder="https://api.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customCredentials">Custom Credentials (Optional)</Label>
                    <Input
                      id="customCredentials"
                      name="customCredentials"
                      type="password"
                      defaultValue={agent.customCredentials || ''}
                      placeholder="API Key or Token"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="knowledgeBase">Knowledge Base (Optional)</Label>
                  <Textarea
                    id="knowledgeBase"
                    name="knowledgeBase"
                    defaultValue={agent.knowledgeBase || ''}
                    placeholder="Additional context and knowledge for your agent"
                    className="min-h-[80px]"
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Agent'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elevenlabs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sunucu Entegrasyonu</CardTitle>
              <CardDescription>
                Ses sunucunuzdaki agent ile bağlantı kurun ve senkronize edin. Sunucu verileri yerel ayarları geçersiz kılar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elevenLabsAgentId">Sunucu Agent ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="elevenLabsAgentId"
                      value={elevenLabsAgentId}
                      onChange={(e) => {
                        setElevenLabsAgentId(e.target.value);
                        setValidationResult(null); // Reset validation when input changes
                        setSyncResult(null); // Reset sync result when input changes
                      }}
                      placeholder="agent_01xxxxxxxxxxxxxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateAgent}
                      disabled={isValidating || !elevenLabsAgentId.trim()}
                    >
                      {isValidating ? 'Doğrulanıyor...' : 'Doğrula'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ses sunucunuzdaki agent ID'sini girerek bağlantı kurun ve verileri senkronize edin.
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
                      <Badge variant={validationResult.valid ? 'default' : 'destructive'}>
                        {validationResult.valid ? '✓ Geçerli' : '✗ Geçersiz'}
                      </Badge>
                      <span className="text-sm">{validationResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Sync Button */}
                {validationResult?.valid && (
                  <div className="space-y-4">
                    <Button
                      type="button"
                      onClick={handleSyncAgent}
                      disabled={isSyncing}
                      className="w-full"
                    >
                      {isSyncing ? 'Senkronize ediliyor...' : '🔄 Sunucudan Senkronize Et'}
                    </Button>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Senkronizasyon sırasında neler olur?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Agent adı sunucudan güncellenecek</li>
                        <li>• Ses ID'si sunucu TTS ayarlarından senkronize edilecek</li>
                        <li>• Sistem prompt'u sunucu agent prompt'undan güncellenecek</li>
                        <li>• Dil ayarı senkronize edilecek</li>
                        <li>• AI model en yakın eşdeğerine eşlenecek</li>
                        <li>• Sunucu verileri yerel ayarlara öncelik verecek</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Sync Result */}
                {syncResult && (
                  <div className={`p-4 rounded-lg border ${
                    syncResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={syncResult.success ? 'default' : 'destructive'}>
                          {syncResult.success ? '✓ Başarılı' : '✗ Başarısız'}
                        </Badge>
                        <span className="text-sm font-medium">{syncResult.message}</span>
                      </div>
                      {syncResult.success && syncResult.updatedFields && syncResult.updatedFields.length > 0 && (
                        <div className="text-sm">
                          <p className="font-medium">Güncellenen alanlar:</p>
                          <ul className="list-disc list-inside ml-2">
                            {syncResult.updatedFields.map((field) => (
                              <li key={field}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current ElevenLabs Connection Status */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Bağlantı Durumu</h4>
                  {agent.elevenLabsAgentId ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        Bağlı
                      </Badge>
                      <span className="text-sm">Agent ID: {agent.elevenLabsAgentId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Badge variant="outline">Bağlı Değil</Badge>
                      <span className="text-sm">Sunucu agent'ı bağlı değil</span>
                    </div>
                  )}
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
                          {conversation.messages && conversation.messages.map((message) => (
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
