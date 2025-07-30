'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VoiceAgent } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

// Available voices and languages
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

export default function VoiceAgentsPage() {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Import specific states
  const [serverAgentId, setServerAgentId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message: string;
    preview?: {
      name: string;
      language: string;
      voiceId: string;
    };
  } | null>(null);
  
  const t = useTranslations('voiceAgents');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    loadAgents();
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('manual');
      setServerAgentId('');
      setValidationStatus(null);
    }
  }, [isOpen]);

  // Load voice agents
  const loadAgents = async () => {
    try {
      const response = await fetch('/api/voice-agents', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error('Failed to load voice agents');
      }
      
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error loading voice agents:', error);
      toast.error('Failed to load voice agents');
    }
  };

  // Create new agent (manual)
  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name'),
      voice: formData.get('voice'),
      language: formData.get('language'),
      description: formData.get('description'),
    };

    try {
      const response = await fetch('/api/voice-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create voice agent');

      toast.success(t('agentCreated'));

      setIsOpen(false);
      router.refresh();
      loadAgents();
    } catch (error) {
      console.error('Error creating voice agent:', error);
      toast.error('Failed to create voice agent');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate Server Agent ID
  const handleValidateAgentId = async () => {
    if (!serverAgentId.trim()) {
      toast.error(t('importAgent.enterAgentId'));
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    try {
      const response = await fetch(`/api/voice-agents/import?agentId=${encodeURIComponent(serverAgentId)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setValidationStatus({
          valid: true,
          message: data.message,
          preview: data.preview,
        });
        toast.success(t('importAgent.validId'));
      } else {
        setValidationStatus({
          valid: false,
          message: data.message || t('importAgent.invalidId'),
        });
        toast.error(data.message || t('importAgent.invalidId'));
      }
    } catch (error) {
      console.error('Error validating agent ID:', error);
      setValidationStatus({
        valid: false,
        message: t('importAgent.invalidId'),
      });
      toast.error(t('importAgent.invalidId'));
    } finally {
      setIsValidating(false);
    }
  };

  // Import agent from Server
  const handleImportAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validationStatus?.valid) {
      toast.error('Please validate the Agent ID first');
      return;
    }

    setIsImporting(true);

    const formData = new FormData(event.currentTarget);
    const description = formData.get('importDescription');

    try {
      const response = await fetch('/api/voice-agents/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elevenLabsAgentId: serverAgentId,
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('importAgent.importSuccess'));
        setIsOpen(false);
        
        // Reset import form
        setServerAgentId('');
        setValidationStatus(null);
        setActiveTab('manual');

        router.refresh();
        loadAgents();

        // Navigate to the newly created agent
        if (data.agentId) {
          router.push(`/${locale}/voice-agents/${data.agentId}`);
        }
      } else {
        toast.error(data.error || t('importAgent.importFailed'));
      }
    } catch (error) {
      console.error('Error importing agent:', error);
      toast.error(t('importAgent.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  // Delete agent
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/voice-agents?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete voice agent');

      toast.success(t('agentDeleted'));

      loadAgents();
    } catch (error) {
      console.error('Error deleting voice agent:', error);
      toast.error('Failed to delete voice agent');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>{t('createNew')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('createNew')}</DialogTitle>
                <DialogDescription>
                  {t('subtitle')}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">
                    {t('createTabs.manual')}
                  </TabsTrigger>
                  <TabsTrigger value="import">
                    {t('createTabs.import')}
                  </TabsTrigger>
                </TabsList>

                {/* Manual Creation Tab */}
                <TabsContent value="manual" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {t('createTabs.manualDescription')}
                  </div>
                  <form onSubmit={handleCreate}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="voice">{t('voice')}</Label>
                        <Select name="voice" required>
                          <SelectTrigger>
                            <SelectValue placeholder={`${tCommon('search')} ${t('voice').toLowerCase()}`} />
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
                      <div className="grid gap-2">
                        <Label htmlFor="language">{t('language')}</Label>
                        <Select name="language" required>
                          <SelectTrigger>
                            <SelectValue placeholder={`${tCommon('search')} ${t('language').toLowerCase()}`} />
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
                      <div className="grid gap-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Textarea id="description" name="description" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                      >
                        {t('cancel')}
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? `${t('create')}...` : t('create')}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>

                {/* Import from Server Tab */}
                <TabsContent value="import" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {t('createTabs.importDescription')}
                  </div>
                  
                  {/* Agent ID Validation */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid gap-2">
                      <Label htmlFor="serverAgentId">
                        {t('importAgent.agentId')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="serverAgentId"
                          placeholder={t('importAgent.agentIdPlaceholder')}
                          value={serverAgentId}
                          onChange={(e) => {
                            setServerAgentId(e.target.value);
                            setValidationStatus(null);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidateAgentId}
                          disabled={isValidating || !serverAgentId.trim()}
                        >
                          {isValidating ? t('importAgent.validating') : t('importAgent.validate')}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('importAgent.agentIdDescription')}
                      </div>
                    </div>

                    {/* Validation Status */}
                    {validationStatus && (
                      <div className="space-y-2">
                        <Badge 
                          variant={validationStatus.valid ? "default" : "destructive"}
                          className="mb-2"
                        >
                          {validationStatus.valid ? t('importAgent.validId') : t('importAgent.invalidId')}
                        </Badge>
                        
                        {validationStatus.valid && validationStatus.preview && (
                          <div className="bg-muted p-3 rounded-md text-sm">
                            <div className="font-medium mb-2">Preview:</div>
                            <div className="space-y-1">
                              <div><strong>Name:</strong> {validationStatus.preview.name}</div>
                              <div><strong>Language:</strong> {validationStatus.preview.language}</div>
                              <div><strong>Voice ID:</strong> {validationStatus.preview.voiceId}</div>
                            </div>
                          </div>
                        )}
                        
                        {!validationStatus.valid && (
                          <div className="text-sm text-destructive">
                            {validationStatus.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Import Form */}
                  {validationStatus?.valid && (
                    <form onSubmit={handleImportAgent}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="importDescription">{t('description')} (Optional)</Label>
                          <Textarea 
                            id="importDescription" 
                            name="importDescription"
                            placeholder="Add a custom description for the imported agent..." 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsOpen(false)}
                        >
                          {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={isImporting}>
                          {isImporting ? t('importAgent.importing') : t('importAgent.import')}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{agent.name}</span>
                <div className="flex flex-col gap-1">
                  {agent.elevenLabsAgentId && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {t('active')}
                    </span>
                  )}
                  {!agent.elevenLabsAgentId && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {t('localOnly')}
                    </span>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                {agent.voice} • {agent.language}
                {agent.elevenLabsAgentId && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('serverId')}: {agent.elevenLabsAgentId}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {agent.description || t('noAgents')}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/voice-agents/${agent.id}`)}
              >
                {t('edit')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(agent.id)}
              >
                {t('delete')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium">{t('noAgents')}</h3>
          <p className="text-sm text-muted-foreground mt-2">{t('createFirst')}</p>
        </div>
      )}
    </div>
  );
}
