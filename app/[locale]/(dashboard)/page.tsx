import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Mic, Headphones, Bot, Crown, Zap } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { DashboardClient } from './dashboard-client';

export default function HomePage() {
  return <DashboardClient />;
}
