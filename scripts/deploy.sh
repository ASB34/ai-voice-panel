#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting production deployment..."

# Environment check
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Copy .env.production.example to .env and configure."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Type check
echo "🔍 Running type check..."
npm run type-check

# Build application
echo "🏗️ Building application..."
npm run build

# Database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

# Seed database (if needed)
echo "🌱 Seeding database..."
npm run db:seed

# Sync Stripe plans
echo "💳 Syncing Stripe plans..."
npm run stripe:sync

echo "✅ Production deployment completed!"
echo ""
echo "Next steps:"
echo "1. Start the application: npm start"
echo "2. Create admin user: npm run admin:create"
echo "3. Test application: https://yourdomain.com/api/health"
echo ""
echo "Monitor logs for any issues."
