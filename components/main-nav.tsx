'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const items = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
    },
    {
      title: t('voiceAgents'),
      href: `/${locale}/voice-agents`,
    },
    {
      title: t('conversations'),
      href: `/${locale}/conversations`,
    },
    {
      title: t('phoneNumbers'),
      href: `/${locale}/phone-numbers`,
    },
    {
      title: t('pricing'),
      href: `/${locale}/pricing`,
    },
  ];

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
