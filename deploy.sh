#!/bin/bash
echo "🚀 Deploying Exprezzzo Power"
echo "Commit: $1"

git add .
git commit -m "$1"
git push origin main

echo "⏰ Waiting for Vercel..."
sleep 90

node verify-deployment.js
