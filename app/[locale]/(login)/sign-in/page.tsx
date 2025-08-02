'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const t = useTranslations('auth');
  
  let redirect, priceId, inviteId;
  try {
    const searchParams = useSearchParams();
    redirect = searchParams?.get('redirect') || '';
    priceId = searchParams?.get('priceId') || '';
    inviteId = searchParams?.get('inviteId') || '';
  } catch (error) {
    console.error('Error getting search params:', error);
    redirect = '';
    priceId = '';
    inviteId = '';
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('welcomeBack')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Testing with useSearchParams
          </p>
          {redirect && <p className="text-xs text-gray-500">Redirect: {redirect}</p>}
        </div>
        <form className="mt-8 space-y-6">
          <input type="hidden" name="redirect" value={redirect} />
          <input type="hidden" name="priceId" value={priceId} />
          <input type="hidden" name="inviteId" value={inviteId} />
          
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('email')}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('password')}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t('signIn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
