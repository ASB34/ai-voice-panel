# AI Voice Panel - Hosting Deployment Guide

## 📁 Upload to Hosting

**Root klasörü hosting'e yükleyin:**
```
ai-voice-panel/
```

## 🔧 Hosting Requirements

### Node.js Hosting (Vercel, Netlify, Railway, etc.)
- Node.js 18+ 
- PostgreSQL database
- Environment variables support

### Geleneksel Linux Hosting
- Node.js 18+
- PM2 or similar process manager
- PostgreSQL access
- SSH access (optional, web setup available)

## 🌐 Setup Methods

### Method 1: Web Setup (No Terminal Required)
1. Upload all files to hosting
2. Visit: `https://yoursite.com/setup`
3. Fill configuration form
4. Click "Install" - automatic setup!

### Method 2: Traditional Setup (Terminal)
1. Upload files
2. Run: `npm install`
3. Run: `npm run build`
4. Set environment variables
5. Run: `npm run production:setup`
6. Start: `npm start`

## 📋 Required Environment Variables

Create these in hosting panel OR use web setup:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication  
JWT_SECRET="your-jwt-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ElevenLabs
ELEVENLABS_API_KEY="your-elevenlabs-key"

# App URL
NEXT_PUBLIC_APP_URL="https://yoursite.com"
```

## 🎯 After Upload

1. **With Web Setup**: Visit `/setup` and configure
2. **With Terminal**: Run setup commands
3. **Access admin**: Visit `/admin` with created admin account
4. **Start using**: Main app at `/en` or `/tr`

## 🔗 Important URLs

- Main App: `https://yoursite.com/en`
- Setup Wizard: `https://yoursite.com/setup`  
- Admin Panel: `https://yoursite.com/admin`
- Health Check: `https://yoursite.com/api/health`

## 🚀 Production Features

✅ Automatic database setup
✅ Migration handling  
✅ Default pricing plans
✅ Admin user creation
✅ Stripe integration
✅ ElevenLabs integration
✅ Multi-language support
✅ Security headers
✅ Error handling
✅ Performance optimization
