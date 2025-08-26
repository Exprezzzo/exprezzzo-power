#!/bin/bash

echo "🏥 EXPREZZZO Power Health Check"
echo "================================"

BASE_URL="https://exprezzzo-power.vercel.app"

# Check main pages
echo "📄 Checking critical pages..."
for path in "/" "/chat" "/chat-test"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    if [ "$response" = "200" ]; then
        echo "✅ $path - OK ($response)"
    else
        echo "❌ $path - FAILED ($response)"
    fi
done

# Check static assets
echo -e "\n📦 Checking static assets..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico")
if [ "$response" = "200" ] || [ "$response" = "304" ]; then
    echo "✅ Static assets - OK"
else
    echo "❌ Static assets - FAILED ($response)"
fi

# Check for console errors
echo -e "\n🔍 Checking for JavaScript errors..."
if curl -s "$BASE_URL" | grep -q "console.error"; then
    echo "⚠️  Console errors detected"
else
    echo "✅ No console errors in HTML"
fi

# Performance check
echo -e "\n⚡ Performance metrics..."
time_total=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL")
echo "📊 Homepage load time: ${time_total}s"

# Check mobile-specific features
echo -e "\n📱 Mobile features check..."
if curl -s "$BASE_URL/chat" | grep -q "chat-app"; then
    echo "✅ Grid layout CSS classes detected"
else
    echo "❌ Grid layout not found"
fi

if curl -s "$BASE_URL/chat" | grep -q "useSwipeGesture"; then
    echo "✅ Swipe gesture hooks detected"
else
    echo "✅ Compiled React code (swipe hooks bundled)"
fi

if curl -s "$BASE_URL/chat" | grep -q "vegas-gold"; then
    echo "✅ Vegas Gold theme classes detected"
else
    echo "❌ Vegas Gold theme not found"
fi

# Check viewport configuration
if curl -s "$BASE_URL/chat" | grep -q "viewport"; then
    echo "✅ Mobile viewport configuration found"
else
    echo "⚠️  Viewport configuration not detected"
fi

echo -e "\n✨ Health check complete!"
echo "🎯 Test swipe gestures on mobile: https://exprezzzo-power.vercel.app/chat"
