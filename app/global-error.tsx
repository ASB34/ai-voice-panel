'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Bir Hata Oluştu
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left text-sm bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer font-medium mb-2">
                    Teknik Detaylar
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs">
                    {error.message}
                    {error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button onClick={reset} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  Ana Sayfaya Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
