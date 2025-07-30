# Call Crafter AI - Voice Panel 🎙️

Comprehensive SaaS platform for managing AI voice agents with subscription billing, admin panel, and Stripe integration.

## 🚀 Features

### Core Features
- **Multi-language Support** (English/Turkish)
- **AI Voice Agents** management with ElevenLabs integration
- **Phone Number** management and integration
- **Real-time Conversations** tracking
- **Advanced Analytics** and usage monitoring

### Billing & Subscriptions
- **Stripe Integration** with multiple subscription plans
- **Usage-based Billing** with limits and tracking
- **Admin Dashboard** for plan management
- **Automated Invoicing** and payment processing

### Admin Panel
- **User Management** with role-based access
- **Subscription Management** with plan changes
- **Usage Analytics** and monitoring
- **System Settings** and configuration

### Security
- **JWT Authentication** with secure sessions
- **Role-based Authorization** (owner, admin, member)
- **Password Hashing** with bcrypt
- **CSRF Protection** and security headers

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe with webhooks
- **Authentication**: Custom JWT implementation
- **Styling**: Tailwind CSS with Shadcn/UI
- **Language**: TypeScript
- **Deployment**: Production-ready build

## 📦 Installation

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-voice-panel
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
npm run db:migrate
npm run db:seed
```

5. **Stripe setup**
```bash
npm run stripe:sync
```

6. **Start development**
```bash
npm run dev
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application
BASE_URL=https://yourdomain.com
AUTH_SECRET=your-super-secure-jwt-secret

# ElevenLabs (optional)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Subscription Plans

The system supports multiple subscription plans with configurable:
- Voice agent limits
- Phone number limits
- Monthly conversation limits
- Usage minutes per month
- Feature access (API, analytics, priority support)

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user info

### Voice Agents
- `GET /api/voice-agents` - List voice agents
- `POST /api/voice-agents` - Create voice agent
- `PUT /api/voice-agents/[id]` - Update voice agent
- `DELETE /api/voice-agents/[id]` - Delete voice agent

### Billing
- `GET /api/billing/plans` - List subscription plans
- `GET /api/billing/usage` - Get current usage
- `POST /api/stripe/create-checkout` - Create Stripe checkout

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/[id]` - Update user (admin only)
- `GET /api/admin/stats` - System statistics (admin only)

## 🔐 Security Features

- **JWT-based Authentication** with secure sessions
- **Role-based Access Control** (RBAC)
- **Password Security** with bcrypt hashing
- **CSRF Protection** via security headers
- **Input Validation** with Zod schemas
- **SQL Injection Prevention** via Drizzle ORM

## 📈 Production Features

- **Optimized Build** with Next.js static generation
- **Security Headers** for HTTPS environments
- **Error Boundaries** for graceful error handling
- **Health Check** endpoint (`/api/health`) for monitoring
- **Database Connection** pooling
- **Console Log** filtering for production

## 🚀 Getting Started

### Testing Payments
Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date and CVC

### Default Admin User
After running `npm run db:seed`:
- **Email**: `admin@test.com`
- **Password**: `admin123`

### Production Deployment
1. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Set up Stripe webhooks
3. Configure environment variables
4. Run production build: `npm run production:build`
5. Start server: `npm start`

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run production:setup` - Complete production setup
- `npm run stripe:sync` - Sync subscription plans with Stripe
- `npm run admin:create` - Create admin user
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 📊 Monitoring

- **Health Check**: `/api/health`
- **Admin Dashboard**: `/admin`
- **Usage Analytics**: Real-time usage tracking
- **Error Logging**: Structured application logs

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
