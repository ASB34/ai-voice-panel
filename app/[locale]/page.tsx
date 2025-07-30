'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mic, 
  Bot, 
  Globe, 
  Zap, 
  BarChart3, 
  Puzzle, 
  Play, 
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  MessageSquare,
  Headphones
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';

// Header Component
function Header() {
  const locale = useLocale();
  const t = useTranslations('auth');
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground">
              <Mic className="h-4 w-4" />
            </div>
            <span className="font-bold text-xl">Call Crafter AI</span>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href={`/${locale}/sign-in`}>
            <Button variant="ghost" className="text-sm font-medium">
              {t('signIn')}
            </Button>
          </Link>
          <Link href={`/${locale}/sign-up`}>
            <Button className="text-sm font-medium">
              {t('signUp')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// Hero Section
function HeroSection() {
  const t = useTranslations('landing.hero');
  const locale = useLocale();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 pb-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold mb-6">
            <Star className="h-3 w-3 mr-1" />
            {t('trustedBy')}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            {t('title')}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href={`/${locale}/sign-up`}>
              <Button size="lg" className="text-lg px-8 py-3">
                {t('cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              <Play className="mr-2 h-5 w-5" />
              {t('watchDemo')}
            </Button>
          </div>
          
          {/* Demo Video/Image Placeholder */}
          <div className="relative mx-auto max-w-3xl">
            <div className="rounded-xl bg-gray-900 p-2 shadow-2xl">
              <div className="aspect-video rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium">Interactive Demo</p>
                  <p className="text-sm opacity-75">See Call Crafter AI in action</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const t = useTranslations('landing.features');
  
  const features = [
    {
      icon: Bot,
      title: t('aiPowered.title'),
      description: t('aiPowered.description'),
      color: 'bg-blue-500'
    },
    {
      icon: Globe,
      title: t('multiLanguage.title'),
      description: t('multiLanguage.description'),
      color: 'bg-green-500'
    },
    {
      icon: Zap,
      title: t('realTime.title'),
      description: t('realTime.description'),
      color: 'bg-yellow-500'
    },
    {
      icon: Puzzle,
      title: t('customizable.title'),
      description: t('customizable.description'),
      color: 'bg-purple-500'
    },
    {
      icon: BarChart3,
      title: t('analytics.title'),
      description: t('analytics.description'),
      color: 'bg-red-500'
    },
    {
      icon: MessageSquare,
      title: t('integration.title'),
      description: t('integration.description'),
      color: 'bg-indigo-500'
    }
  ];
  
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-3 rounded-lg ${feature.color} text-white mb-4 mx-auto`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  
  const steps = [
    {
      number: '01',
      title: t('step1.title'),
      description: t('step1.description'),
      icon: Bot
    },
    {
      number: '02',
      title: t('step2.title'),
      description: t('step2.description'),
      icon: Users
    },
    {
      number: '03',
      title: t('step3.title'),
      description: t('step3.description'),
      icon: BarChart3
    }
  ];
  
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                  {step.number}
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <step.icon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full">
                  <ArrowRight className="h-6 w-6 text-gray-300 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const t = useTranslations('landing.cta');
  const locale = useLocale();
  
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t('title')}
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/${locale}/sign-up`}>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              {t('button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
            {t('contact')}
          </Button>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const locale = useLocale();
  
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="h-6 w-6" />
              <span className="font-bold text-xl">Call Crafter AI</span>
            </div>
            <p className="text-gray-400">
              AI-powered voice communication for the future.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={`/${locale}/voice-agents`} className="hover:text-white">Voice Agents</Link></li>
              <li><Link href={`/${locale}/pricing`} className="hover:text-white">Pricing</Link></li>
              <li><a href="#" className="hover:text-white">Features</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Call Crafter AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LocaleHomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
