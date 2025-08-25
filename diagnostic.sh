#!/bin/bash

echo "🔍 EXPREZZZO POWER DIAGNOSTIC REPORT"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://exprezzzo-power.vercel.app"

# Function to test endpoint
test_endpoint() {
    local path=$1
    local method=${2:-GET}
    local data=$3
    
    echo -n "Testing $method $path... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$path" \
                   -H "Content-Type: application/json" \
                   -d "$data")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ OK ($response)${NC}"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${RED}✗ NOT FOUND ($response)${NC}"
        return 1
    elif [ "$response" = "500" ] || [ "$response" = "503" ]; then
        echo -e "${RED}✗ SERVER ERROR ($response)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ RESPONSE: $response${NC}"
        return 1
    fi
}

# Test Pages
echo "📄 TESTING PAGES"
echo "----------------"
test_endpoint "/"
test_endpoint "/dashboard"
test_endpoint "/playground"
test_endpoint "/login"
test_endpoint "/signup"
echo ""

# Test API Endpoints
echo "🔌 TESTING API ENDPOINTS"
echo "------------------------"
test_endpoint "/api/health"
test_endpoint "/api/analytics/metrics"
test_endpoint "/api/analytics/export?format=json"
test_endpoint "/api/chat" "POST" '{"messages":[{"role":"user","content":"test"}]}'
test_endpoint "/api/orchestrate" "POST" '{"model":"gpt-3.5-turbo","messages":[]}'
test_endpoint "/api/projects" "GET"
test_endpoint "/api/sessions" "GET"
echo ""

# Test File Upload
echo "📁 TESTING FILE OPERATIONS"
echo "--------------------------"
echo "Creating test file..."
echo "Test content" > /tmp/test.txt
echo -n "Testing file upload... "
upload_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/files/upload" \
                  -F "file=@/tmp/test.txt")
if [ "$upload_response" = "200" ]; then
    echo -e "${GREEN}✓ Upload OK${NC}"
else
    echo -e "${RED}✗ Upload Failed ($upload_response)${NC}"
fi
rm /tmp/test.txt
echo ""

# Check Static Assets
echo "🎨 TESTING STATIC ASSETS"
echo "------------------------"
test_endpoint "/manifest.json"
test_endpoint "/favicon.ico"
echo ""

# Performance Check
echo "⚡ PERFORMANCE METRICS"
echo "----------------------"
echo -n "Homepage load time: "
time_taken=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/")
echo "${time_taken}s"

echo -n "API response time: "
api_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/health")
echo "${api_time}s"
echo ""

# Summary
echo "📊 SUMMARY"
echo "----------"
echo "Deployment URL: $BASE_URL"
echo "Timestamp: $(date)"
echo ""

# Check if main features are working
features_ok=true
if ! test_endpoint "/" > /dev/null 2>&1; then features_ok=false; fi
if ! test_endpoint "/api/health" > /dev/null 2>&1; then features_ok=false; fi
if ! test_endpoint "/api/analytics/metrics" > /dev/null 2>&1; then features_ok=false; fi

if [ "$features_ok" = true ]; then
    echo -e "${GREEN}✅ CORE FEATURES: OPERATIONAL${NC}"
else
    echo -e "${RED}❌ CORE FEATURES: ISSUES DETECTED${NC}"
fi
