'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import Link from 'next/link';
import { Mic, Headphones, Bot } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('welcome')}</CardTitle>
            <CardDescription>
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href={`/${locale}/voice-agents`}>
                <Button>
                  {t('voiceAgentsButton')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('features')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('smartConversations')}</h3>
                  <p className="text-sm text-muted-foreground">{t('smartConversationsDesc')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('multiLanguage')}</h3>
                  <p className="text-sm text-muted-foreground">{t('multiLanguageDesc')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('realTimeProcessing')}</h3>
                  <p className="text-sm text-muted-foreground">{t('realTimeProcessingDesc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('gettingStarted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('step1')}</h3>
                <p className="text-sm text-muted-foreground">{t('step1Desc')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('step2')}</h3>
                <p className="text-sm text-muted-foreground">{t('step2Desc')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('step3')}</h3>
                <p className="text-sm text-muted-foreground">{t('step3Desc')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('step4')}</h3>
                <p className="text-sm text-muted-foreground">{t('step4Desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}