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
import { 
  Phone, 
  PhoneCall, 
  Trash2, 
  Search, 
  Filter, 
  Plus,
  User,
  Globe,
  Hash,
  UserCheck,
  UserX
} from 'lucide-react';

interface PhoneNumber {
  id: string;
  phoneNumberId: string;
  phoneNumber: string;
  country: string;
  areaCode?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt?: string;
}

interface AvailablePhoneNumber {
  phoneNumberId: string;
  phoneNumber: string;
  country: string;
  areaCode?: string;
  monthlyPrice: number;
  currency: string;
}

interface UserAgent {
  id: string;
  name: string;
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
  
  // Simple phone number input
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  const t = useTranslations('phoneNumbers');
  const tCommon = useTranslations('common');

  const fetchPhoneNumbers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phone-numbers');
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }

      const data = await response.json();
      setPhoneNumbers(data.phoneNumbers || []);
    } catch (error: any) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Telefon numaraları alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAgents = async () => {
    try {
      const response = await fetch('/api/voice-agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      console.log('🎯 User agents fetched:', data);
      // API directly returns array, not wrapped in 'agents' property
      setUserAgents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      setUserAgents([]);
    }
  };

  const addPhoneNumber = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error('Telefon numarası zorunludur');
      return;
    }

    try {
      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: newPhoneNumber.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Phone number add error:', data);
        
        // Debug bilgilerini logla
        if (data.debug) {
          console.log('🔍 Debug info:', data.debug);
          if (data.debug.sampleFormats) {
            console.log('📋 Sample system formats:', data.debug.sampleFormats);
          }
        }
        
        // Kullanıcıya anlamlı hata mesajı göster
        const errorMessage = data.error || data.message || 'Telefon numarası eklenemedi';
        throw new Error(errorMessage);
      }

      toast.success(data.message || 'Telefon numarası başarıyla eklendi!');
      fetchPhoneNumbers();
      setIsAddDialogOpen(false);
      setNewPhoneNumber('');
    } catch (error: any) {
      console.error('Error adding phone number:', error);
      toast.error('Numara eklenemedi: ' + error.message);
    }
  };

  const deletePhoneNumber = async (phoneNumberId: string) => {
    if (!confirm('Bu telefon numarasını panelınızdan kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete phone number');
      }

      toast.success(data.message || 'Telefon numarası başarıyla kaldırıldı!');
      fetchPhoneNumbers();
    } catch (error: any) {
      console.error('Error deleting phone number:', error);
      toast.error('Numara kaldırılamadı: ' + error.message);
    }
  };

  const assignAgentToNumber = async (phoneNumberId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign agent');
      }

      toast.success(data.message || 'Agent başarıyla güncellendi!');
      fetchPhoneNumbers();
      setIsAssignDialogOpen(false);
      setSelectedPhoneNumber(null);
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      toast.error('Agent atanamadı: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      active: 'default',
      inactive: 'secondary',
      pending: 'destructive',
    };
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const formatPhoneNumber = (number: string) => {
    // Format phone number for display
    return number.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
  };

  useEffect(() => {
    fetchPhoneNumbers();
    fetchUserAgents();
  }, []);

  // Filter phone numbers based on search term
  const filteredPhoneNumbers = phoneNumbers.filter(number =>
    number.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (number.assignedAgentName && number.assignedAgentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telefon Numaraları</h1>
          <p className="text-muted-foreground">
            Telefon numaralarınızı yönetin ve agentlara atayın
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Numara Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Telefon Numarası Ekle</DialogTitle>
                <DialogDescription>
                  Sistemde kayıtlı olan telefon numaranızı panele ekleyin
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefon Numarası *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+12125551234 (ABD) veya +905551234567 (TR)"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Bu numara sistemde kayıtlı olmalı ve başka bir agent tarafından kullanılmamalıdır.
                  </p>
                  <p className="text-xs text-gray-500">
                    Format örnekleri: +12125551234 (ABD), +905551234567 (Türkiye), +441234567890 (İngiltere)
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={addPhoneNumber}>
                    Numara Ekle
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <UserNav />
        </div>
      </div>

      {/* Filters for owned numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Arama</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Telefon numarası veya agent adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers List */}
      <div className="grid gap-4">
        {filteredPhoneNumbers.map((phoneNumber) => (
          <Card key={phoneNumber.phoneNumberId} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-lg">{formatPhoneNumber(phoneNumber.phoneNumber)}</span>
                    </div>
                    {getStatusBadge(phoneNumber.status)}
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{phoneNumber.country}</span>
                    </div>
                    {phoneNumber.areaCode && (
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        <span>{phoneNumber.areaCode}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {phoneNumber.assignedAgentId ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">{phoneNumber.assignedAgentName || 'Atanmış Agent'}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-600">Agent atanmamış</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPhoneNumber(phoneNumber);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {phoneNumber.assignedAgentId ? 'Agent Değiştir' : 'Agent Ata'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePhoneNumber(phoneNumber.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </Button>
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

      {/* Empty State */}
      {!isLoading && filteredPhoneNumbers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Henüz telefon numaranız yok</h3>
              <p className="text-muted-foreground">Sistemde kayıtlı telefon numaralarınızı panele ekleyerek başlayın</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                İlk Numaranızı Ekleyin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Agent Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Ata</DialogTitle>
            <DialogDescription>
              {selectedPhoneNumber && `${formatPhoneNumber(selectedPhoneNumber.phoneNumber)} numarasına agent atayın`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent">Agent Seç</Label>
              <Select 
                onValueChange={(agentId) => {
                  if (selectedPhoneNumber) {
                    assignAgentToNumber(selectedPhoneNumber.id, agentId);
                  }
                }}
              >
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Agent seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Agent atamasını kaldır</SelectItem>
                  {userAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
