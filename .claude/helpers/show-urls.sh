#!/bin/bash
# show-urls.sh - Display project URLs for Claude Code responses
# Usage: .claude/helpers/show-urls.sh [environment]
# Environment: development (default), staging, production, all

set -e

# Default to showing all environments
SHOW_ENV="${1:-all}"

# Read project configuration
if [ ! -f ".project.json" ]; then
    echo "⚠️  .project.json not found - cannot display URLs"
    exit 1
fi

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo "⚠️  jq not installed - install with: brew install jq"
    exit 1
fi

# Extract URLs from .project.json
DEV_URL=$(jq -r '.deployment.environments.development.url' .project.json 2>/dev/null || echo "")
STAGING_URL=$(jq -r '.deployment.environments.staging.url' .project.json 2>/dev/null || echo "")
PROD_URL=$(jq -r '.deployment.environments.production.url' .project.json 2>/dev/null || echo "")

# Replace ${PORT} with actual port
if [ -n "$PORT" ]; then
    DEV_URL="${DEV_URL//\$\{PORT:-3000\}/$PORT}"
else
    DEV_URL="${DEV_URL//\$\{PORT:-3000\}/3000}"
fi

# Replace CONDUCTOR_PORT if available
if [ -n "$CONDUCTOR_PORT" ]; then
    DEV_URL="${DEV_URL//3000/$CONDUCTOR_PORT}"
fi

echo ""
echo "🔗 Project URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case $SHOW_ENV in
    development|dev|local)
        echo "   Localhost:   $DEV_URL"
        ;;
    staging|stage)
        echo "   Staging:     $STAGING_URL"
        ;;
    production|prod)
        echo "   Production:  $PROD_URL"
        ;;
    all|*)
        echo "   Localhost:   $DEV_URL"
        echo "   Staging:     $STAGING_URL"
        echo "   Production:  $PROD_URL"
        ;;
esac

echo ""
echo "Click any URL to open in browser →"
echo ""
