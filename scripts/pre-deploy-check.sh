#!/bin/bash

# Pre-deployment validation script
# This script checks for common issues before deploying to production

echo "🚀 Starting pre-deployment validation..."

# Check for Node.js version
NODE_VERSION=$(node -v)
echo "📦 Node.js version: $NODE_VERSION"

# Check for package.json
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  exit 1
fi

echo "✅ package.json found"

# Install dependencies
echo "📥 Installing dependencies..."
npm install --silent

# TypeScript compilation check
echo "🔍 Checking TypeScript compilation..."
if ! npx tsc --noEmit; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo "✅ TypeScript compilation successful"

# Linting check
echo "🧹 Running ESLint..."
if ! npm run lint; then
  echo "❌ ESLint failed"
  exit 1
fi

echo "✅ ESLint passed"

# Build check
echo "🏗️ Testing production build..."
if ! npm run build; then
  echo "❌ Production build failed"
  exit 1
fi

echo "✅ Production build successful"

# Check for common Tailwind issues
echo "🎨 Checking for Tailwind CSS issues..."
if grep -r "bg-background\|text-foreground\|border-border\|ring-offset-background" src/ --exclude-dir=node_modules; then
  echo "⚠️ Warning: Found potential Tailwind CSS custom property issues"
  echo "These may cause build failures in production"
fi

# Check for any TODO or FIXME comments
echo "📝 Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ --exclude-dir=node_modules | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "⚠️ Found $TODO_COUNT TODO/FIXME comments in codebase"
  grep -r "TODO\|FIXME" src/ --exclude-dir=node_modules
fi

# Check bundle size
echo "📊 Analyzing bundle size..."
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
echo "📦 Build size: $BUILD_SIZE"

echo ""
echo "✅ All pre-deployment checks passed!"
echo "🚀 Ready for production deployment"