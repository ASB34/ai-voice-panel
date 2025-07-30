'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Database, 
  Key, 
  User, 
  Settings,
  Loader2,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  error?: string;
}

interface SetupConfig {
  // Database
  databaseUrl: string;
  
  // Stripe
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  
  // Application
  baseUrl: string;
  authSecret: string;
  
  // Admin User
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  
  // Optional
  elevenlabsApiKey: string;
}

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [config, setConfig] = useState<SetupConfig>({
    databaseUrl: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    baseUrl: '',
    authSecret: '',
    adminEmail: '',
    adminPassword: '',
    adminName: '',
    elevenlabsApiKey: ''
  });

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'database',
      title: 'Veritabanı Bağlantısı',
      description: 'PostgreSQL bağlantı ayarları',
      completed: false
    },
    {
      id: 'stripe',
      title: 'Stripe Entegrasyonu',
      description: 'Ödeme sistemi yapılandırması',
      completed: false
    },
    {
      id: 'app-config',
      title: 'Uygulama Ayarları',
      description: 'Temel uygulama yapılandırması',
      completed: false
    },
    {
      id: 'admin-user',
      title: 'Admin Kullanıcısı',
      description: 'İlk admin kullanıcısı oluşturma',
      completed: false
    },
    {
      id: 'finalize',
      title: 'Kurulum Tamamlama',
      description: 'Son ayarlar ve test',
      completed: false
    }
  ]);

  useEffect(() => {
    // Check if setup is already completed
    checkSetupStatus();
    
    // Auto-generate auth secret if empty
    if (!config.authSecret) {
      const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setConfig(prev => ({ ...prev, authSecret: randomSecret }));
    }
    
    // Auto-detect base URL
    if (typeof window !== 'undefined' && !config.baseUrl) {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      setConfig(prev => ({ ...prev, baseUrl }));
    }
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isSetupComplete) {
          setSetupComplete(true);
        }
      }
    } catch (error) {
      console.log('Setup status check failed - this is normal for fresh install');
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/setup/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: config.databaseUrl })
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const testStripeConnection = async () => {
    try {
      const response = await fetch('/api/setup/test-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stripeSecretKey: config.stripeSecretKey 
        })
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const runInstallation = async () => {
    setIsInstalling(true);
    
    try {
      // Step 1: Database setup
      await updateStepStatus('database', 'running');
      const dbResponse = await fetch('/api/setup/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: config.databaseUrl })
      });
      
      if (!dbResponse.ok) {
        throw new Error('Database setup failed');
      }
      await updateStepStatus('database', 'completed');
      
      // Step 2: Stripe setup
      await updateStepStatus('stripe', 'running');
      const stripeResponse = await fetch('/api/setup/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSecretKey: config.stripeSecretKey,
          stripeWebhookSecret: config.stripeWebhookSecret
        })
      });
      
      if (!stripeResponse.ok) {
        throw new Error('Stripe setup failed');
      }
      await updateStepStatus('stripe', 'completed');
      
      // Step 3: App config
      await updateStepStatus('app-config', 'running');
      const configResponse = await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          authSecret: config.authSecret,
          elevenlabsApiKey: config.elevenlabsApiKey
        })
      });
      
      if (!configResponse.ok) {
        throw new Error('App configuration failed');
      }
      await updateStepStatus('app-config', 'completed');
      
      // Step 4: Admin user
      await updateStepStatus('admin-user', 'running');
      const adminResponse = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.adminEmail,
          password: config.adminPassword,
          name: config.adminName
        })
      });
      
      if (!adminResponse.ok) {
        throw new Error('Admin user creation failed');
      }
      await updateStepStatus('admin-user', 'completed');
      
      // Step 5: Finalize
      await updateStepStatus('finalize', 'running');
      const finalizeResponse = await fetch('/api/setup/finalize', {
        method: 'POST'
      });
      
      if (!finalizeResponse.ok) {
        throw new Error('Setup finalization failed');
      }
      await updateStepStatus('finalize', 'completed');
      
      setSetupComplete(true);
      
    } catch (error) {
      console.error('Installation failed:', error);
      // Mark current step as failed
      const currentStepId = steps.find(step => !step.completed)?.id;
      if (currentStepId) {
        await updateStepStatus(currentStepId, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const updateStepStatus = async (stepId: string, status: 'running' | 'completed' | 'error', error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed: status === 'completed', error: status === 'error' ? error : undefined }
        : step
    ));
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const generateEnvFile = () => {
    const envContent = `# Generated by Setup Wizard
DATABASE_URL=${config.databaseUrl}
POSTGRES_URL=${config.databaseUrl}

# Stripe
STRIPE_SECRET_KEY=${config.stripeSecretKey}
STRIPE_WEBHOOK_SECRET=${config.stripeWebhookSecret}

# Application
BASE_URL=${config.baseUrl}
AUTH_SECRET=${config.authSecret}
NODE_ENV=production

# ElevenLabs (Optional)
${config.elevenlabsApiKey ? `ELEVENLABS_API_KEY=${config.elevenlabsApiKey}` : '# ELEVENLABS_API_KEY=your_key_here'}

# Admin User (for reference only)
# Initial admin user: ${config.adminEmail}
`;

    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Kurulum Tamamlandı! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Call Crafter AI başarıyla kuruldu ve kullanıma hazır!
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Admin Panel</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Kullanıcıları ve paketleri yönetin
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/admin'}
                >
                  Admin Panel'e Git
                </Button>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Dashboard</h3>
                <p className="text-sm text-green-700 mb-3">
                  Uygulamayı kullanmaya başlayın
                </p>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard'a Git
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Güvenlik:</strong> Bu kurulum sayfası artık devre dışı bırakıldı. 
                Eğer yeniden kurulum yapmanız gerekirse, sunucunuzu sıfırlayın.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Call Crafter AI Kurulum Sihirbazı
          </h1>
          <p className="text-gray-600">
            Uygulamanızı birkaç dakikada kurmaya hazırlanın
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kurulum Adımları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed 
                          ? 'bg-green-100 text-green-800' 
                          : step.error
                          ? 'bg-red-100 text-red-800'
                          : currentStep === index
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : step.error ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{step.title}</h3>
                        <p className="text-xs text-gray-500">{step.description}</p>
                        {step.error && (
                          <p className="text-xs text-red-600 mt-1">{step.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentStep === 0 && <Database className="h-5 w-5" />}
                  {currentStep === 1 && <Key className="h-5 w-5" />}
                  {currentStep === 2 && <Settings className="h-5 w-5" />}
                  {currentStep === 3 && <User className="h-5 w-5" />}
                  <span>{steps[currentStep]?.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="databaseUrl">PostgreSQL Bağlantı URL'i</Label>
                      <Input
                        id="databaseUrl"
                        type="text"
                        placeholder="postgresql://username:password@localhost:5432/database"
                        value={config.databaseUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, databaseUrl: e.target.value }))}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Hosting sağlayıcınızdan aldığınız PostgreSQL bağlantı URL'ini girin
                      </p>
                    </div>
                    
                    <Button 
                      onClick={async () => {
                        const isValid = await testDatabaseConnection();
                        if (isValid) {
                          setCurrentStep(1);
                        } else {
                          alert('Veritabanı bağlantısı test edilemedi. Lütfen URL\'yi kontrol edin.');
                        }
                      }}
                      disabled={!config.databaseUrl}
                    >
                      Bağlantıyı Test Et ve Devam Et
                    </Button>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                      <Input
                        id="stripeSecretKey"
                        type="password"
                        placeholder="sk_test_... veya sk_live_..."
                        value={config.stripeSecretKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
                      <Input
                        id="stripeWebhookSecret"
                        type="password"
                        placeholder="whsec_..."
                        value={config.stripeWebhookSecret}
                        onChange={(e) => setConfig(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Stripe Dashboard'dan webhook endpoint'i oluşturduktan sonra alacağınız secret
                      </p>
                    </div>
                    
                    <Button 
                      onClick={async () => {
                        const isValid = await testStripeConnection();
                        if (isValid) {
                          setCurrentStep(2);
                        } else {
                          alert('Stripe bağlantısı test edilemedi. Lütfen anahtarları kontrol edin.');
                        }
                      }}
                      disabled={!config.stripeSecretKey || !config.stripeWebhookSecret}
                    >
                      Stripe'ı Test Et ve Devam Et
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="baseUrl">Site URL'i</Label>
                      <Input
                        id="baseUrl"
                        type="url"
                        placeholder="https://yourdomain.com"
                        value={config.baseUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="authSecret">Güvenlik Anahtarı (JWT Secret)</Label>
                      <Input
                        id="authSecret"
                        type="text"
                        value={config.authSecret}
                        onChange={(e) => setConfig(prev => ({ ...prev, authSecret: e.target.value }))}
                        readOnly
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Otomatik oluşturuldu - değiştirmeniz önerilmez
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="elevenlabsApiKey">ElevenLabs API Key (İsteğe bağlı)</Label>
                      <Input
                        id="elevenlabsApiKey"
                        type="password"
                        placeholder="11labs API anahtarınız"
                        value={config.elevenlabsApiKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, elevenlabsApiKey: e.target.value }))}
                      />
                    </div>
                    
                    <Button onClick={() => setCurrentStep(3)}>
                      Devam Et
                    </Button>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="adminName">Admin Adı</Label>
                      <Input
                        id="adminName"
                        type="text"
                        placeholder="Admin Kullanıcı"
                        value={config.adminName}
                        onChange={(e) => setConfig(prev => ({ ...prev, adminName: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="adminEmail">Admin E-posta</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@yourdomain.com"
                        value={config.adminEmail}
                        onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="adminPassword">Admin Şifresi</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="Güçlü bir şifre oluşturun"
                        value={config.adminPassword}
                        onChange={(e) => setConfig(prev => ({ ...prev, adminPassword: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={runInstallation}
                        disabled={!config.adminEmail || !config.adminPassword || !config.adminName || isInstalling}
                        className="flex-1"
                      >
                        {isInstalling ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Kuruluyor...
                          </>
                        ) : (
                          'Kurulumu Başlat'
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={generateEnvFile}
                        disabled={isInstalling}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        .env İndir
                      </Button>
                    </div>
                  </div>
                )}

                {isInstalling && (
                  <div className="mt-6">
                    <div className="space-y-3">
                      {steps.map((step) => (
                        <div key={step.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {step.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : step.error ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            step.completed ? 'text-green-700' : step.error ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
