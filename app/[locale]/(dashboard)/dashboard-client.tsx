'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Mic, Headphones, Bot, Crown, Zap } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface UserData {
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
  team: {
    id: number;
    name: string;
    planName: string;
  };
  subscription: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
  } | null;
  role?: string;
}

export function DashboardClient() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Client-side only data fetching
    if (typeof window === 'undefined') return;
    
    async function fetchUserData() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'premium':
        return <Crown className="h-4 w-4" />;
      case 'pro':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Call Crafter AI</h2>
        {!loading && userData?.subscription && (
          <Badge variant="outline" className={`${getPlanColor(userData.subscription.displayName)} flex items-center gap-1`}>
            {getPlanIcon(userData.subscription.displayName)}
            {userData.subscription.displayName} Plan
          </Badge>
        )}
      </div>

      {!loading && userData && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Welcome back, {userData.user.name}!</CardTitle>
            <CardDescription>
              {userData.subscription 
                ? `You're currently on the ${userData.subscription.displayName} plan`
                : "You don't have an active subscription"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account</p>
                <p className="text-lg font-semibold">{userData.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team</p>
                <p className="text-lg font-semibold">{userData.team?.name || 'No team'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {userData.subscription?.displayName || 'Free'}
                  </p>
                  {userData.subscription && (
                    <Badge variant="secondary" className="text-xs">
                      ${(userData.subscription.monthlyPrice / 100).toFixed(0)}/mo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load your information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('welcome')}</CardTitle>
            <CardDescription>
              Your all-in-one solution for AI-powered voice communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Call Crafter AI helps you create and manage AI voice agents for seamless communication.
              Get started by creating your first voice agent or exploring our features.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href={`/${locale}/voice-agents`}>
                <Button>
                  Voice Agents
                </Button>
              </Link>
              <Link href={`/${locale}/pricing`}>
                <Button variant="outline">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">AI-Powered Agents</h3>
                  <p className="text-sm text-muted-foreground">Create intelligent voice agents that understand context</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Multiple Languages</h3>
                  <p className="text-sm text-muted-foreground">Support for various languages and accents</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Processing</h3>
                  <p className="text-sm text-muted-foreground">Natural voice interactions with minimal latency</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Create an Agent</h3>
                <p className="text-sm text-muted-foreground">Define your voice agent's personality and capabilities</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Configure Settings</h3>
                <p className="text-sm text-muted-foreground">Choose voice, language, and behavior settings</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Test and Deploy</h3>
                <p className="text-sm text-muted-foreground">Test your agent and deploy it to production</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. Monitor Performance</h3>
                <p className="text-sm text-muted-foreground">Track usage and improve your agent over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
