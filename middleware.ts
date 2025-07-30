import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'tr'],
  defaultLocale: 'en'
});

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow setup routes without locale prefix
  if (pathname.startsWith('/setup') || pathname.startsWith('/api/setup')) {
    return NextResponse.next();
  }
  
  // Admin routes are protected by client-side layout authentication
  // No server-side middleware auth needed to avoid Edge Runtime issues
  
  // Handle the intl middleware first
  const response = intlMiddleware(request);
  
  // Extract locale from pathname and set it in a cookie for server actions
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  
  if (localeMatch) {
    const locale = localeMatch[1];
    const responseWithCookie = response || NextResponse.next();
    responseWithCookie.cookies.set('locale', locale);
    return responseWithCookie;
  }
  
  return response;
}

export const config = {
  matcher: ['/', '/(tr|en)/:path*', '/setup/:path*']
};
