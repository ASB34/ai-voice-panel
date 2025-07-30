# AI Voice Panel - Hosting Seçenekleri

## 🔍 Hosting Türünüzü Belirleyin

### ✅ Node.js Destekli Hosting
Eğer hosting'iniz şunları destekliyorsa:
- Node.js 18+
- npm/yarn komutları
- Package.json çalıştırma

**Hosting Örnekleri:**
- Vercel (vercel.com) - ÜCRETSİZ
- Netlify (netlify.com) - ÜCRETSİZ  
- Railway (railway.app) - ÜCRETSİZ
- Heroku (heroku.com)
- DigitalOcean App Platform
- AWS Amplify
- Node.js destekli VPS/VDS

### ❌ Sadece PHP/HTML Hosting
Eğer hosting'iniz sadece şunları destekliyorsa:
- PHP
- HTML/CSS/JS
- cPanel
- Node.js desteği YOK

## 🚀 Çözüm 1: Node.js Hosting (ÖNERİLEN)

### Adım 1: Ücretsiz Node.js Hosting
1. **Vercel**: vercel.com'a git
2. GitHub ile bağlan
3. Repository'yi import et
4. Otomatik deploy!

### Adım 2: Manuel Kurulum
```bash
# Hosting'de terminal varsa
npm install
npm run build
npm start
```

### Adım 3: Environment Variables
Hosting panelinde ekle:
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
ELEVENLABS_API_KEY=...
JWT_SECRET=...
```

## 🔧 Çözüm 2: PHP Hosting için Static Export

### Adım 1: Static Build
```bash
# Local bilgisayarınızda
npm run build:static
```

### Adım 2: Upload
- `out/` klasörünü hosting'e yükle
- İçindeki tüm dosyaları public_html'e kopyala

### Adım 3: Sınırlamalar
❌ API routes çalışmaz
❌ Database bağlantısı olmaz  
❌ Dynamic features olmaz
✅ Sadece frontend görünür

## 💡 Tavsiye

**En Kolay Çözüm:**
1. Vercel.com'a üye ol (ücretsiz)
2. GitHub'a projeyi yükle
3. Vercel'e import et
4. `/setup` sayfasından konfigüre et
5. Hazır! 🎉

**Mevcut Hosting'i Kullanmak İstiyorsanız:**
1. cPanel'de "Node.js" var mı kontrol edin
2. Varsa normal yükleme yapın
3. Yoksa static export kullanın (limited features)

## 🔗 Test

Kurulum sonrası test edin:
- Ana sayfa: `https://sitename.com/`
- Setup: `https://sitename.com/setup`
- Admin: `https://sitename.com/admin`
- Health: `https://sitename.com/api/health`

## ❓ Hangi Hosting?

Hosting ismini/türünü söylerseniz daha spesifik yardım verebilirim!
