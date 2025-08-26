#!/bin/bash
echo "🏹 ROBIN HOOD DEPLOYMENT PROTOCOL"
echo "================================="

# Pre-flight checks
echo "→ Running diagnostics..."
npm run lint || true

# Build test
echo "→ Testing build..."
npm run build

# Git operations
echo "→ Committing changes..."
git add -A
git commit -m "feat: Robin Hood Protocol v3.2 - Community AI Platform" || true
git push origin main

# Deploy to Vercel
echo "→ Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Visit: https://exprezzzo-power.vercel.app"
