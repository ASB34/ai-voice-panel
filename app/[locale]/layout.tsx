import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import '../globals.css';

// Import console override for production
import '@/lib/console-override';

const manrope = Manrope({ subsets: ['latin'] });

// This is important for static generation
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'tr' }];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  try {
    const { locale } = await params;
    const messages = await getMessages({ locale });

    return (
      <html
        lang={locale}
        className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      >
        <body className="min-h-[100dvh] bg-gray-50">
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Toaster />
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Error in LocaleLayout:', error);
    // Fallback
    return (
      <html lang="en">
        <body>
          <div>Error loading page</div>
        </body>
      </html>
    );
  }
}
