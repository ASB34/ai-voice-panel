'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
import { useTranslations } from 'next-intl';
import { Play, Download, Search, Filter, Calendar, Clock, User, Pause, Volume2 } from 'lucide-react';

interface Conversation {
  agentId: string;
  agentName: string;
  conversationId: string; // API uses camelCase
  startTimeUnixSecs: number; // API uses camelCase
  callDurationSecs: number; // API uses camelCase
  messageCount: number;
  status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed';
  callSuccessful: 'success' | 'failure' | 'unknown';
  
  // Legacy field mappings for compatibility
  agent_id?: string;
  agent_name?: string;
  conversation_id?: string;
  id?: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
  message_count?: number;
  call_successful?: 'success' | 'failure' | 'unknown';
}

interface UserAgent {
  id: string;
  name: string;
}

interface ConversationDetails {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: Array<{
    role: 'user' | 'agent';
    time_in_call_secs: number;
    message: string;
  }>;
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
  };
  has_audio: boolean;
  has_user_audio: boolean;
  has_response_audio: boolean;
  user_id?: string;
  // Ek alanlar API'den gelebilir
  call_duration_secs?: number;
  start_time_unix_secs?: number;
  
  // API camelCase alanları (fallback için)
  agentId?: string;
  conversationId?: string;
  hasAudio?: boolean;
  hasUserAudio?: boolean;
  hasResponseAudio?: boolean;
  userId?: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Filters
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successFilter, setSuccessFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const t = useTranslations('conversations');
  const tCommon = useTranslations('common');

  // Helper function to get conversation ID (handles both 'id' and 'conversation_id' fields)
  const getConversationId = (conversation: Conversation): string => {
    // API returns 'conversationId' (camelCase), but our API maps it to 'conversation_id'
    const id = conversation.conversation_id || conversation.conversationId || conversation.id || '';
    if (!id) {
      console.warn('Conversation object missing ID field:', conversation);
      console.warn('Available fields:', Object.keys(conversation));
    }
    console.log('getConversationId result:', id, 'from conversation:', {
      conversationId: conversation.conversationId,
      conversation_id: conversation.conversation_id,
      id: conversation.id
    });
    return id;
  };

  // Helper functions to get field values safely
  const getAgentName = (conversation: Conversation): string => {
    return conversation.agent_name || conversation.agentName || '';
  };

  const getStartTime = (conversation: Conversation): number => {
    return conversation.start_time_unix_secs || conversation.startTimeUnixSecs || 0;
  };

  const getCallDuration = (conversation: Conversation): number => {
    return conversation.call_duration_secs || conversation.callDurationSecs || 0;
  };

  const getCallSuccessful = (conversation: Conversation): string => {
    return conversation.call_successful || conversation.callSuccessful || 'unknown';
  };

  const getMessageCount = (conversation: Conversation): number => {
    return conversation.message_count || conversation.messageCount || 0;
  };

  const fetchConversations = async (cursor?: string, reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      if (agentFilter && agentFilter !== 'all') params.append('agentId', agentFilter);
      if (successFilter && successFilter !== 'all') params.append('callSuccessful', successFilter);
      params.append('pageSize', '20');

      const response = await fetch(`/api/conversations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      
      // Debug: Log the actual data structure
      console.log('API Response data:', data);
      if (data.conversations && data.conversations.length > 0) {
        console.log('First conversation:', data.conversations[0]);
        console.log('Conversation keys:', Object.keys(data.conversations[0]));
        console.log('Conversation ID fields check:', {
          conversation_id: data.conversations[0].conversation_id,
          id: data.conversations[0].id,
          conversationId: data.conversations[0].conversationId
        });
      } else {
        console.log('No conversations found in response');
      }
      
      if (reset) {
        setConversations(data.conversations);
      } else {
        setConversations(prev => [...prev, ...data.conversations]);
      }
      
      setUserAgents(data.userAgents || []);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error(t('fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversationDetails = async (conversationId: string) => {
    console.log('🔍 fetchConversationDetails called with ID:', conversationId);
    console.log('🔍 Browser test log - function started');
    
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID provided:', conversationId);
      return;
    }
    
    setIsDetailLoading(true);
    try {
      console.log('📡 Fetching conversation details from API...');
      const response = await fetch(`/api/conversations/${conversationId}`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 API Error:', response.status, errorText);
        throw new Error(`Failed to fetch conversation details: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Received conversation details:', data);
      console.log('📦 Data keys:', Object.keys(data));
      console.log('📦 Metadata:', data.metadata);
      
      // API response'u bizim interface formatına çevirelim
      const normalizedData = {
        agent_id: data.agentId || data.agent_id || '',
        conversation_id: data.conversationId || data.conversation_id || '',
        status: data.status || '',
        transcript: data.transcript || [],
        metadata: {
          start_time_unix_secs: data.metadata?.startTimeUnixSecs || data.metadata?.start_time_unix_secs || 0,
          call_duration_secs: data.metadata?.callDurationSecs || data.metadata?.call_duration_secs || 0
        },
        has_audio: data.hasAudio || data.has_audio || false,
        has_user_audio: data.hasUserAudio || data.has_user_audio || false,
        has_response_audio: data.hasResponseAudio || data.has_response_audio || false,
        user_id: data.userId || data.user_id,
        // Ek fallback alanlar
        call_duration_secs: data.metadata?.callDurationSecs || data.metadata?.call_duration_secs || 0,
        start_time_unix_secs: data.metadata?.startTimeUnixSecs || data.metadata?.start_time_unix_secs || 0
      };
      
      console.log('📦 Normalized data:', normalizedData);
      
      if (normalizedData && (normalizedData.agent_id || normalizedData.conversation_id)) {
        setSelectedConversation(normalizedData);
        setIsOpen(true);
        console.log('✅ Details loaded and dialog opened');
      } else {
        console.error('🚨 Invalid response data:', data);
      }
    } catch (error: any) {
      console.error('🚨 Error fetching conversation details:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const downloadAudio = async (conversationId: string) => {
    console.log('💾 downloadAudio called with ID:', conversationId);
    
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID for audio download:', conversationId);
      return;
    }
    
    try {
      console.log('📡 Fetching audio for download...');
      const response = await fetch(`/api/conversations/${conversationId}/audio`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Download error:', response.status, errorText);
        throw new Error(`Failed to download audio: ${response.status}`);
      }
      
      console.log('💾 Creating download blob...');
      const blob = await response.blob();
      console.log('💾 Blob size:', blob.size, 'type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `conversation-${conversationId}.mp3`;
      document.body.appendChild(a);
      
      console.log('⬇️ Triggering download...');
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Download completed');
    } catch (error: any) {
      console.error('🚨 Error downloading audio:', error);
    }
  };

  const playAudio = async (conversationId: string) => {
    console.log('🎵 playAudio called with ID:', conversationId);
    console.log('🎵 Browser test log - function started');
    
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID for audio playback:', conversationId);
      return;
    }
    
    try {
      // Eğer ses çalıyorsa, durdur
      if (isPlayingAudio && currentAudio) {
        console.log('🛑 Stopping current audio');
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setIsPlayingAudio(false);
        setAudioUrl(null);
        return;
      }

      console.log('📡 Fetching audio from API...');
      const response = await fetch(`/api/conversations/${conversationId}/audio`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      console.log('💾 Creating blob...');
      const blob = await response.blob();
      console.log('💾 Blob size:', blob.size, 'type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔗 Created URL:', url);
      
      setAudioUrl(url);
      setIsPlayingAudio(true);
      console.log('✅ Audio ready to play');
      
      // Auto play
      const audio = new Audio(url);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        console.log('🔚 Audio ended');
        setIsPlayingAudio(false);
        setAudioUrl(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = (e) => {
        console.error('🚨 Audio error:', e);
        setIsPlayingAudio(false);
        setAudioUrl(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
      };
      audio.play().then(() => {
        console.log('▶️ Audio started playing');
      }).catch(err => {
        console.error('🚨 Play error:', err);
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      });
      
    } catch (error: any) {
      console.error('🚨 Error playing audio:', error);
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      done: 'default',
      'in-progress': 'secondary',
      failed: 'destructive',
      initiated: 'outline',
      processing: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getSuccessBadge = (success: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      success: 'default',
      failure: 'destructive',
      unknown: 'secondary',
    };
    const colors: { [key: string]: string } = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge variant={variants[success] || 'secondary'} className={colors[success]}>
        {success}
      </Badge>
    );
  };

  useEffect(() => {
    fetchConversations(undefined, true);
  }, [agentFilter, successFilter]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv =>
    getAgentName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <UserNav />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('search')}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent">{t('agent')}</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger id="agent">
                  <SelectValue placeholder={t('selectAgent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('all')}</SelectItem>
                  {userAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('all')}</SelectItem>
                  <SelectItem value="done">{t('statusDone')}</SelectItem>
                  <SelectItem value="in-progress">{t('statusInProgress')}</SelectItem>
                  <SelectItem value="failed">{t('statusFailed')}</SelectItem>
                  <SelectItem value="initiated">{t('statusInitiated')}</SelectItem>
                  <SelectItem value="processing">{t('statusProcessing')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="success">{t('callResult')}</Label>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger id="success">
                  <SelectValue placeholder={t('selectResult')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('all')}</SelectItem>
                  <SelectItem value="success">{t('resultSuccess')}</SelectItem>
                  <SelectItem value="failure">{t('resultFailure')}</SelectItem>
                  <SelectItem value="unknown">{t('resultUnknown')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="grid gap-4">
        {filteredConversations.map((conversation) => (
          <Card key={getConversationId(conversation)} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getAgentName(conversation)}</span>
                    </div>
                    {getStatusBadge(conversation.status)}
                    {getSuccessBadge(getCallSuccessful(conversation))}
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(getStartTime(conversation))}</span>
                      <span>{formatTime(getStartTime(conversation))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(getCallDuration(conversation))}</span>
                    </div>
                    <div>
                      {t('messages')}: {getMessageCount(conversation)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getConversationId(conversation) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const convId = getConversationId(conversation);
                          console.log('🎵 Play button clicked for conversation:', convId);
                          playAudio(convId);
                        }}
                        disabled={!getConversationId(conversation)}
                      >
                        {isPlayingAudio ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Durdur
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            {t('playAudio')}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('💾 Download button clicked for conversation:', getConversationId(conversation));
                          downloadAudio(getConversationId(conversation));
                        }}
                        disabled={!getConversationId(conversation)}
                      >
                        <Download className="h-4 w-4" />
                        {t('download')}
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const convId = getConversationId(conversation);
                          console.log('🔍 Details button clicked for conversation:', convId);
                          fetchConversationDetails(convId);
                        }}
                        disabled={isDetailLoading || !getConversationId(conversation)}
                      >
                        {isDetailLoading ? 'Yükleniyor...' : t('viewDetails')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button onClick={() => fetchConversations(nextCursor)} variant="outline">
            {t('loadMore')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredConversations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t('noConversations')}</h3>
              <p className="text-muted-foreground">{t('noConversationsDescription')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Details Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('conversationDetails')}</DialogTitle>
            <DialogDescription>
              {selectedConversation && `${t('conversationWith')} ${selectedConversation.agent_id || 'Unknown Agent'}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="space-y-4">
              {/* Audio Player */}
              {audioUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      {t('audioPlayer')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <audio
                      controls
                      src={audioUrl}
                      className="w-full"
                      onEnded={() => {
                        setIsPlayingAudio(false);
                        setAudioUrl(null);
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Conversation Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('conversationInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('status')}</Label>
                      <div className="mt-1">{getStatusBadge(selectedConversation.status)}</div>
                    </div>
                    <div>
                      <Label>{t('duration')}</Label>
                      <div className="mt-1">
                        {formatDuration(
                          selectedConversation.metadata?.call_duration_secs || 
                          selectedConversation.call_duration_secs || 
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>{t('startTime')}</Label>
                      <div className="mt-1">
                        {formatDate(
                          selectedConversation.metadata?.start_time_unix_secs || 
                          selectedConversation.start_time_unix_secs || 
                          0
                        )} {formatTime(
                          selectedConversation.metadata?.start_time_unix_secs || 
                          selectedConversation.start_time_unix_secs || 
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>{t('audioAvailable')}</Label>
                      <div className="mt-1">
                        <Badge variant={selectedConversation.has_audio ? 'default' : 'secondary'}>
                          {selectedConversation.has_audio ? tCommon('yes') : tCommon('no')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Conversation ID</Label>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {selectedConversation.conversation_id}
                      </div>
                    </div>
                    <div>
                      <Label>Agent ID</Label>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {selectedConversation.agent_id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transcript */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('transcript')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConversation.transcript && selectedConversation.transcript.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedConversation.transcript.map((entry, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            entry.role === 'user'
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'bg-green-50 border-l-4 border-green-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={entry.role === 'user' ? 'default' : 'secondary'}>
                              {entry.role === 'user' ? t('user') : t('agent')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(entry.time_in_call_secs)}
                            </span>
                          </div>
                          <p className="text-sm">{entry.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('noTranscript')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}