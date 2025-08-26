#!/bin/bash
# Robust Health Monitoring Script for EXPREZZZO Power
# Checks every 5 minutes, logs results with timestamps,
# highlights issues, and keeps a separate error log.

PROJECT_URL="https://exprezzzo-power.vercel.app/api/health"
LOG_FILE="health.log"
ERROR_LOG="health-errors.log"
CHECK_INTERVAL=300  # seconds (5 minutes)

# Colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

while true; do
  TIMESTAMP=$(date)
  echo "----- $TIMESTAMP -----" | tee -a "$LOG_FILE"

  # Run health check and capture output + HTTP status
  RESPONSE=$(curl -s -w "\n%{http_code}" "$PROJECT_URL")
  BODY=$(echo "$RESPONSE" | head -n -1)
  STATUS=$(echo "$RESPONSE" | tail -n1)

  # Default status message
  STATUS_MSG="${GREEN}PASS${NC}"

  # Check HTTP status and body
  if [[ "$STATUS" != "200" ]]; then
    STATUS_MSG="${RED}FAIL${NC} (HTTP $STATUS)"
    echo "[$TIMESTAMP] HTTP Status $STATUS" | tee -a "$ERROR_LOG"
  elif [[ "$BODY" != *"healthy"* ]]; then
    STATUS_MSG="${YELLOW}WARN${NC} (Unhealthy body)"
    echo "[$TIMESTAMP] Health endpoint returned unexpected body" | tee -a "$ERROR_LOG"
  fi

  # Print to console with color
  echo -e "Health Check: $STATUS_MSG" | tee -a "$LOG_FILE"
  echo "$BODY" | tee -a "$LOG_FILE"

  # If failure, also log response body to errors
  if [[ "$STATUS_MSG" =~ "FAIL" || "$STATUS_MSG" =~ "WARN" ]]; then
    echo "$BODY" >> "$ERROR_LOG"
    echo "" >> "$ERROR_LOG"
  fi

  echo "" | tee -a "$LOG_FILE"
  sleep "$CHECK_INTERVAL"
done
