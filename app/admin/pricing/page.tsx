'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, DollarSign, Edit, Plus, Save, Trash } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxVoiceAgents: number;
  maxPhoneNumbers: number;
  maxConversationsPerMonth: number;
  maxMinutesPerMonth: number;
  maxCustomVoices: number;
  hasAdvancedAnalytics: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
}

export default function PricingManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/pricing', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      
      console.log('Fetch plans response:', data);
      
      if (data.success) {
        setPlans(data.plans);
      } else {
        console.error('Failed to fetch plans:', data.error);
        alert('Planlar yüklenemedi: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('Planlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    // Convert cents to dollars for display
    setFormData({
      ...plan,
      monthlyPrice: plan.monthlyPrice / 100,
      yearlyPrice: plan.yearlyPrice / 100,
    });
    setIsCreateMode(false);
  };

  const handleCreate = () => {
    console.log('=== HANDLE CREATE CLICKED ===');
    setEditingPlan(null);
    const initialData = {
      name: '',
      displayName: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxVoiceAgents: -1,
      maxPhoneNumbers: -1,
      maxConversationsPerMonth: -1,
      maxMinutesPerMonth: -1,
      maxCustomVoices: 0,
      hasAdvancedAnalytics: false,
      hasApiAccess: false,
      hasPrioritySupport: false,
      isActive: true
    };
    console.log('Setting initial form data:', initialData);
    setFormData(initialData);
    setIsCreateMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert dollar amounts to cents for database storage
      const processedData = {
        ...formData,
        monthlyPrice: formData.monthlyPrice ? Math.round(formData.monthlyPrice * 100) : 0,
        yearlyPrice: formData.yearlyPrice ? Math.round(formData.yearlyPrice * 100) : 0,
      };

      const url = '/api/admin/pricing';
      const method = isCreateMode ? 'POST' : 'PUT';
      
      const payload = isCreateMode 
        ? processedData 
        : { planId: editingPlan?.id, updates: processedData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchPlans();
        setEditingPlan(null);
        setIsCreateMode(false);
        setFormData({});
      } else {
        console.error('Failed to save plan:', data.error);
        alert('Plan kaydedilemedi: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Plan kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/pricing?planId=${planId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchPlans();
      } else {
        console.error('Failed to delete plan:', data.error);
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Sınırsız' : value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fiyatlandırma Yönetimi</h1>
          <p className="text-gray-600 mt-2">Subscription planlarını yönetin</p>
        </div>
        
        <Dialog open={isCreateMode || !!editingPlan} onOpenChange={(open) => {
          if (!open) {
            setIsCreateMode(false);
            setEditingPlan(null);
            setFormData({});
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Plan Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCreateMode ? 'Yeni Plan Oluştur' : 'Planı Düzenle'}
              </DialogTitle>
            </DialogHeader>
            
            <PlanForm 
              key={isCreateMode ? 'create' : editingPlan?.id || 'edit'}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              saving={saving}
              isCreateMode={isCreateMode}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
                  <span className="text-sm text-gray-600">/ay</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Yıllık: {formatPrice(plan.yearlyPrice)}</span>
                  <Badge variant="secondary">
                    %{Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)} İndirim
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Ses Agent'ı:</span>
                  <span className="font-medium">{formatLimit(plan.maxVoiceAgents)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Telefon No:</span>
                  <span className="font-medium">{formatLimit(plan.maxPhoneNumbers)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Konuşma/Ay:</span>
                  <span className="font-medium">{formatLimit(plan.maxConversationsPerMonth)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Dakika/Ay:</span>
                  <span className="font-medium">{formatLimit(plan.maxMinutesPerMonth)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Özel Ses:</span>
                  <span className="font-medium">{formatLimit(plan.maxCustomVoices)}</span>
                </div>
                
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Gelişmiş Analitik:</span>
                    <Badge variant={plan.hasAdvancedAnalytics ? 'default' : 'secondary'}>
                      {plan.hasAdvancedAnalytics ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>API Erişimi:</span>
                    <Badge variant={plan.hasApiAccess ? 'default' : 'secondary'}>
                      {plan.hasApiAccess ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Öncelikli Destek:</span>
                    <Badge variant={plan.hasPrioritySupport ? 'default' : 'secondary'}>
                      {plan.hasPrioritySupport ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!plan.isActive && (
                <div className="mt-4 p-2 bg-red-50 rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-600 text-sm">Bu plan aktif değil</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlanForm({ 
  formData, 
  setFormData, 
  onSave, 
  saving, 
  isCreateMode 
}: {
  formData: Partial<SubscriptionPlan>;
  setFormData: (data: Partial<SubscriptionPlan>) => void;
  onSave: () => void;
  saving: boolean;
  isCreateMode: boolean;
}) {
  const handleInputChange = (field: string, value: any) => {
    console.log('=== INPUT CHANGE ===');
    console.log('Field:', field);
    console.log('Value:', value);
    console.log('Current formData before change:', formData);
    
    const newData = { ...formData, [field]: value };
    console.log('New formData after change:', newData);
    setFormData(newData);
  };

  const calculateYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
          <TabsTrigger value="limits">Limitler</TabsTrigger>
          <TabsTrigger value="features">Özellikler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Adı (sistem)</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="starter, professional, vb."
              />
            </div>
            
            <div>
              <Label htmlFor="displayName">Görünen Ad</Label>
              <Input
                id="displayName"
                value={formData.displayName || ''}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Starter, Professional, vb."
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Plan açıklaması..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyPrice">Aylık Fiyat ($)</Label>
              <input
                id="monthlyPrice"
                type="number"
                step="1"
                min="0"
                max="99999"
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  console.log('=== MONTHLY PRICE INPUT CHANGE ===');
                  console.log('Raw input value:', e.target.value);
                  console.log('Parsed value:', value);
                  setFormData({...formData, monthlyPrice: value});
                }}
                placeholder="899"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Dolar cinsinden fiyat girin (örn: 899)</p>
            </div>
            
            <div>
              <Label htmlFor="yearlyPrice">Yıllık Fiyat ($)</Label>
              <Input
                id="yearlyPrice"
                type="number"
                step="1"
                min="0"
                max="99999"
                value={formData.yearlyPrice || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const yearlyPrice = value === '' ? 0 : parseFloat(value) || 0;
                  handleInputChange('yearlyPrice', yearlyPrice);
                }}
                placeholder="Otomatik hesaplanır"
                className="text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Boş bırakılırsa aylık fiyatın %20 indirimi</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="limits" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxVoiceAgents">Maks. Ses Agent'ı</Label>
              <Input
                id="maxVoiceAgents"
                type="number"
                value={formData.maxVoiceAgents || -1}
                onChange={(e) => handleInputChange('maxVoiceAgents', parseInt(e.target.value) || -1)}
                placeholder="-1 (sınırsız)"
              />
            </div>
            
            <div>
              <Label htmlFor="maxPhoneNumbers">Maks. Telefon No</Label>
              <Input
                id="maxPhoneNumbers"
                type="number"
                value={formData.maxPhoneNumbers || -1}
                onChange={(e) => handleInputChange('maxPhoneNumbers', parseInt(e.target.value) || -1)}
                placeholder="-1 (sınırsız)"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxConversationsPerMonth">Maks. Konuşma/Ay</Label>
              <Input
                id="maxConversationsPerMonth"
                type="number"
                value={formData.maxConversationsPerMonth || -1}
                onChange={(e) => handleInputChange('maxConversationsPerMonth', parseInt(e.target.value) || -1)}
                placeholder="-1 (sınırsız)"
              />
            </div>
            
            <div>
              <Label htmlFor="maxMinutesPerMonth">Maks. Dakika/Ay</Label>
              <Input
                id="maxMinutesPerMonth"
                type="number"
                value={formData.maxMinutesPerMonth || -1}
                onChange={(e) => handleInputChange('maxMinutesPerMonth', parseInt(e.target.value) || -1)}
                placeholder="-1 (sınırsız)"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="maxCustomVoices">Maks. Özel Ses</Label>
            <Input
              id="maxCustomVoices"
              type="number"
              value={formData.maxCustomVoices || 0}
              onChange={(e) => handleInputChange('maxCustomVoices', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasAdvancedAnalytics">Gelişmiş Analitik</Label>
              <Switch
                id="hasAdvancedAnalytics"
                checked={formData.hasAdvancedAnalytics || false}
                onCheckedChange={(checked) => handleInputChange('hasAdvancedAnalytics', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="hasApiAccess">API Erişimi</Label>
              <Switch
                id="hasApiAccess"
                checked={formData.hasApiAccess || false}
                onCheckedChange={(checked) => handleInputChange('hasApiAccess', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="hasPrioritySupport">Öncelikli Destek</Label>
              <Switch
                id="hasPrioritySupport"
                checked={formData.hasPrioritySupport || false}
                onCheckedChange={(checked) => handleInputChange('hasPrioritySupport', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Aktif</Label>
              <Switch
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            'Kaydediliyor...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isCreateMode ? 'Oluştur' : 'Güncelle'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
