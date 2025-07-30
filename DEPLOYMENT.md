# Production Deployment Guide

## 🚀 Hosting Sunucusuna Yükleme Rehberi

### 1. **Sunucu Gereksinimleri**
- Node.js 18.17+ 
- PostgreSQL 14+
- SSL sertifikası (HTTPS)
- En az 1GB RAM

### 2. **Environment Variables**
`.env.production.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.production.example .env
```

**Önemli değişkenler:**
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Live Stripe secret key  
- `BASE_URL`: Sitenizin HTTPS URL'i
- `AUTH_SECRET`: Güvenli random string (32+ karakter)

### 3. **Veritabanı Kurulumu**

```bash
# Dependencies install
npm install

# Database migrate
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. **Stripe Konfigürasyonu**

```bash
# Stripe planlarını senkronize et
node scripts/sync-stripe-plans.js
```

**Stripe Webhook:**
- Stripe Dashboard'da webhook endpoint ekleyin: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`

### 5. **Build ve Deploy**

```bash
# Production build
npm run build

# Start production server
npm start
```

### 6. **İlk Admin Kullanıcısı**

```bash
# Admin kullanıcı oluştur
node scripts/create-admin.js
```

### 7. **SSL ve Domain**
- Domain'i sunucunuza yönlendirin
- SSL sertifikası kurun (Let's Encrypt önerisi)
- `BASE_URL`'i HTTPS ile güncelleyin

### 8. **Güvenlik Kontrolleri**
- [ ] `.env` dosyası güvenli lokasyonda
- [ ] Stripe webhook secret doğru
- [ ] HTTPS aktif
- [ ] Admin şifresi güçlü
- [ ] Database connection secure

### 9. **Test Listesi**
- [ ] Ana sayfa yükleniyor
- [ ] Kullanıcı kaydı çalışıyor
- [ ] Stripe ödeme çalışıyor
- [ ] Admin panel erişimi
- [ ] Plan değiştirme çalışıyor

### 10. **Monitoring**
- Application logs: `pm2 logs` (PM2 kullanıyorsanız)
- Database connection
- Stripe webhook deliveries
- Error tracking (Sentry vs.)

---

## 🔧 Production Optimizasyonları

### Performance
- Static assets CDN kullanımı
- Database connection pooling
- Redis cache (isteğe bağlı)

### Security  
- Rate limiting
- CSRF protection
- Helmet.js kullanımı
- Regular security updates

### Monitoring
- Health check endpoint: `/api/health`
- Database monitoring
- Application performance monitoring
