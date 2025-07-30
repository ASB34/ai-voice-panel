'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Users, Phone, MessageSquare, Mic, Crown, Star, Clock } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  maxVoiceAgents: number;
  maxPhoneNumbers: number;
  maxMinutesPerMonth: number;
  maxConversationsPerMonth: number;
  maxCustomVoices: number;
  hasAdvancedAnalytics: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  hasWebhooks: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
}

interface UsageLimit {
  type: string;
  current: number;
  limit: number;
  unit: string;
  isUnlimited: boolean;
  isExceeded: boolean;
}

interface CurrentPlan {
  plan: SubscriptionPlan | null;
  limits: UsageLimit[];
  currentPeriod: { start: string; end: string } | null;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
    loadCurrentUsage();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadCurrentUsage = async () => {
    try {
      const response = await fetch('/api/billing/usage');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data);
      }
    } catch (error) {
      console.error('Failed to load current usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.monthlyPrice === 0) return 'Ücretsiz';
    
    const price = isYearly && plan.yearlyPrice 
      ? plan.yearlyPrice / 12 / 100 
      : plan.monthlyPrice / 100;
    
    return `$${price.toFixed(0)}`;
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    if (!plan.yearlyPrice || plan.monthlyPrice === 0) return null;
    
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = ((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100;
    
    return Math.round(savings);
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Sınırsız';
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Star className="h-6 w-6" />;
      case 'starter': return <Zap className="h-6 w-6" />;
      case 'professional': return <Users className="h-6 w-6" />;
      case 'enterprise': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free': return 'border-gray-200';
      case 'starter': return 'border-blue-200';
      case 'professional': return 'border-purple-200 ring-2 ring-purple-500';
      case 'enterprise': return 'border-yellow-200';
      default: return 'border-gray-200';
    }
  };

  const getRemainingDays = () => {
    if (!currentPlan?.currentPeriod) return null;
    
    const endDate = new Date(currentPlan.currentPeriod.end);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    try {
      console.log('Selected plan:', plan);
      
      // Stripe checkout için API çağrısı
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId || plan.id, // Stripe price ID kullan
          planId: plan.id,
          billingPeriod: isYearly ? 'yearly' : 'monthly'
        }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        // Stripe checkout sayfasına yönlendir
        window.location.href = url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ödeme oturumu oluşturulamadı');
      }
      
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Paket seçiminde bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const remainingDays = getRemainingDays();

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Ses Agent'ı Paketleri
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          İhtiyacınıza uygun paketi seçin ve AI ses agent'larınızı yönetmeye başlayın
        </p>
        
        {/* Current Plan Info */}
        {currentPlan?.plan && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Mevcut Paketiniz: {currentPlan.plan.displayName}
            </h3>
            
            {remainingDays !== null && (
              <div className="flex items-center justify-center mb-4 text-sm text-blue-700">
                <Clock className="h-4 w-4 mr-2" />
                <span>Paket {remainingDays} gün sonra yenilenecek</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {currentPlan.limits.map((limit) => (
                <div key={limit.type} className="text-center p-3 bg-white rounded-lg border">
                  <div className={`font-bold text-lg ${limit.isExceeded ? 'text-red-600' : 'text-green-600'}`}>
                    {limit.current}
                    <span className="text-gray-500">
                      /{limit.isUnlimited ? '∞' : limit.limit}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 capitalize mt-1">
                    {limit.type.replace('_', ' ').replace('phone number purchase', 'Telefon No')}
                  </div>
                  {limit.isExceeded && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Limit Aşıldı
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <span className={`mr-3 ${!isYearly ? 'font-semibold' : 'text-gray-500'}`}>
            Aylık
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`ml-3 ${isYearly ? 'font-semibold' : 'text-gray-500'}`}>
            Yıllık
          </span>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              2 Ay Bedava!
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.plan?.id === plan.id;
          const isPopular = plan.name === 'professional';
          const savings = getYearlySavings(plan);
          
          return (
            <Card key={plan.id} className={`relative ${getPlanColor(plan.name)} ${isPopular ? 'scale-105 shadow-lg' : ''}`}>
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    En Popüler
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 text-blue-600">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                <p className="text-gray-600 text-sm">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-600">/ay</span>
                  )}
                  
                  {isYearly && savings && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      %{savings} tasarruf
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Users className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">
                      {formatLimit(plan.maxVoiceAgents)} Ses Agent'ı
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    <Phone className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">
                      {formatLimit(plan.maxPhoneNumbers)} Telefon Numarası
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm">
                      {formatLimit(plan.maxConversationsPerMonth)} Konuşma/Ay
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-sm">
                      {formatLimit(plan.maxMinutesPerMonth)} Dakika/Ay
                    </span>
                  </li>
                  
                  {plan.maxCustomVoices > 0 && (
                    <li className="flex items-center">
                      <Mic className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm">
                        {formatLimit(plan.maxCustomVoices)} Özel Ses
                      </span>
                    </li>
                  )}
                  
                  {plan.hasAdvancedAnalytics ? (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Gelişmiş Analitik</span>
                    </li>
                  ) : (
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">Gelişmiş Analitik</span>
                    </li>
                  )}
                  
                  {plan.hasApiAccess ? (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">API Erişimi</span>
                    </li>
                  ) : (
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">API Erişimi</span>
                    </li>
                  )}
                  
                  {plan.hasPrioritySupport ? (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Öncelikli Destek</span>
                    </li>
                  ) : (
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">Öncelikli Destek</span>
                    </li>
                  )}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                  disabled={isCurrentPlan}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrentPlan ? 'Mevcut Paket' : 'Paketi Seç'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Features Comparison */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Tüm Paketlerde Dahil
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-lg">
            <div className="text-blue-600 mb-4">
              <MessageSquare className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">7/24 Ses Agent'ları</h3>
            <p className="text-gray-600 text-sm">
              Kesintisiz çalışan AI ses agent'ları ile müşterilerinize 7/24 hizmet
            </p>
          </div>
          
          <div className="p-6 bg-purple-50 rounded-lg">
            <div className="text-purple-600 mb-4">
              <Phone className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">Telefon Entegrasyonu</h3>
            <p className="text-gray-600 text-sm">
              Gelişmiş Crafters Group Altyapısı ile yüksek kaliteli telefon görüşmeleri
            </p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-lg">
            <div className="text-green-600 mb-4">
              <Zap className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">Kolay Kurulum</h3>
            <p className="text-gray-600 text-sm">
              Dakikalar içinde agent'ınızı oluşturun ve kullanmaya başlayın
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
