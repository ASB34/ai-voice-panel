#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: DATABASE_URL or POSTGRES_URL is required"
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "⚠️  Warning: AUTH_SECRET not set, using fallback"
fi

echo "✅ Environment variables checked"

# Run type check
echo "🔍 Running type check..."
pnpm run type-check

# Build the application
echo "🏗️  Building application..."
pnpm run build

echo "✅ Build completed successfully!"
