import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'tr'];

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is valid, fallback to 'en' if not
  const validLocale = locale && locales.includes(locale) ? locale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});
