# 🚀 Vercel Deployment Guide

## Adım 1: GitHub'a Yükleme

### GitHub Repository Oluşturma:
1. GitHub.com'a git
2. "New Repository" tıkla
3. Repository name: `ai-voice-panel`
4. Public/Private seç
5. "Create repository" tıkla

### Projeyi GitHub'a Push:
```bash
# Terminal'de projenizde:
git remote add origin https://github.com/YOUR_USERNAME/ai-voice-panel.git
git branch -M main
git push -u origin main
```

## Adım 2: Vercel'e Deploy

### Vercel Setup:
1. [vercel.com](https://vercel.com)'a git
2. "Sign up" → GitHub ile giriş yap
3. "Import Project" tıkla
4. GitHub repository'nizi seç
5. "Import" tıkla

### Auto Deploy:
- Vercel otomatik build edip deploy edecek
- Domain verilecek: `your-project.vercel.app`

## Adım 3: Environment Variables

Vercel Dashboard'da:
1. Project → Settings → Environment Variables
2. Şu değişkenleri ekle:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_... (veya sk_test_...)
STRIPE_PUBLISHABLE_KEY=pk_live_... (veya pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
ELEVENLABS_API_KEY=your-elevenlabs-api-key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

## Adım 4: Database Setup

### Ücretsiz PostgreSQL:
**Supabase (Önerilen):**
1. [supabase.com](https://supabase.com) → Sign up
2. "New Project" → Database oluştur
3. Settings → Database → Connection string kopyala
4. Vercel'e DATABASE_URL olarak ekle

**Alternatifler:**
- Neon.tech (ücretsiz)
- PlanetScale (ücretsiz)
- Railway.app (ücretsiz)

## Adım 5: İlk Kurulum

Deploy tamamlandıktan sonra:
1. `https://your-project.vercel.app/setup` adresi
2. Database URL'ini gir
3. API key'lerini gir
4. Admin kullanıcı oluştur
5. "Install" tıkla → Otomatik setup!

## 🎯 Deployment Sonucu

### URL'ler:
- **Ana Uygulama**: `https://your-project.vercel.app/en`
- **Setup Sayfası**: `https://your-project.vercel.app/setup`
- **Admin Panel**: `https://your-project.vercel.app/admin`
- **Health Check**: `https://your-project.vercel.app/api/health`

### Özellikler:
✅ Otomatik SSL sertifikası
✅ Global CDN
✅ Otomatik scaling
✅ Git-based deployment
✅ Preview deployments
✅ Analytics

## 📋 Checklist

- [ ] GitHub repository oluşturuldu
- [ ] Vercel'e import edildi
- [ ] Environment variables eklendi
- [ ] Database hazırlandı
- [ ] İlk deployment başarılı
- [ ] Setup sayfası çalışıyor
- [ ] Admin panel erişilebilir

## 🔧 Troubleshooting

**Build Error:**
- Environment variables kontrolü
- Database bağlantısı kontrolü

**404 Error:**
- Vercel routing otomatik
- Next.js App Router kullanılıyor

**Database Connection:**
- DATABASE_URL format kontrolü
- Database server'ı açık mı?

## 💡 İpuçları

- Vercel ücretsiz planı günlük ihtiyaçlar için yeterli
- Git push'larınız otomatik deploy oluşturur
- Preview URL'leri ile test edebilirsiniz
- Custom domain ekleyebilirsiniz
