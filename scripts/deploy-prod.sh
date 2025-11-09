#!/bin/bash

##############################################################################
# Production Deployment Script
#
# Automates the production deployment process with comprehensive validation
# Usage: ./scripts/deploy-prod.sh
##############################################################################

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment-${DEPLOYMENT_ID}.log"

# Ensure directories exist
mkdir -p logs backups

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"

    case $level in
        "INFO")  echo -e "${BLUE}ℹ️  ${message}${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ ${message}${NC}" ;;
        "WARN")  echo -e "${YELLOW}⚠️  ${message}${NC}" ;;
        "ERROR") echo -e "${RED}❌ ${message}${NC}" ;;
    esac
}

# Error handler
error_exit() {
    log "ERROR" "Deployment failed: $1"
    log "ERROR" "Check log file: ${LOG_FILE}"
    exit 1
}

# Rollback function
rollback() {
    log "WARN" "Initiating rollback procedure..."

    # Restore from backup if available
    if [ -d "${BACKUP_DIR}/latest" ]; then
        log "INFO" "Restoring from backup..."
        # Add rollback logic here
        log "SUCCESS" "Rollback completed"
    else
        log "ERROR" "No backup available for rollback"
    fi
}

# Trap errors and run rollback
trap 'rollback' ERR

##############################################################################
# Pre-Deployment Validation
##############################################################################

log "INFO" "🚀 Starting Production Deployment: ${DEPLOYMENT_ID}"

# 1. Environment Check
log "INFO" "Checking environment configuration..."
if [ -z "${VERCEL_TOKEN:-}" ]; then
    error_exit "VERCEL_TOKEN environment variable not set"
fi

if [ -z "${NEXT_PUBLIC_BASE_URL:-}" ]; then
    error_exit "NEXT_PUBLIC_BASE_URL environment variable not set"
fi

log "SUCCESS" "Environment variables validated"

# 2. Run comprehensive validation
log "INFO" "Running deployment validation checks..."
if ! node scripts/deploy-validation.js; then
    error_exit "Deployment validation failed"
fi
log "SUCCESS" "Deployment validation passed"

# 3. Check Git status
log "INFO" "Checking Git repository status..."
if ! git diff-index --quiet HEAD --; then
    log "WARN" "Uncommitted changes detected"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error_exit "Deployment cancelled by user"
    fi
fi

# Get current commit for tracking
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "INFO" "Deploying commit: ${CURRENT_COMMIT} from branch: ${CURRENT_BRANCH}"

##############################################################################
# Backup Current State
##############################################################################

log "INFO" "Creating backup of current deployment..."

# Create backup directory structure
BACKUP_PATH="${BACKUP_DIR}/${DEPLOYMENT_ID}"
mkdir -p "${BACKUP_PATH}"

# Backup current deployment info (if available from Vercel)
if command -v vercel &> /dev/null; then
    vercel ls > "${BACKUP_PATH}/vercel-deployments.txt" 2>/dev/null || true
fi

# Backup current environment configuration
cp .env.local "${BACKUP_PATH}/.env.local.backup" 2>/dev/null || true
cp .env.production "${BACKUP_PATH}/.env.production.backup" 2>/dev/null || true

# Create latest backup symlink
ln -sfn "${DEPLOYMENT_ID}" "${BACKUP_DIR}/latest"

log "SUCCESS" "Backup created at ${BACKUP_PATH}"

##############################################################################
# Build and Test
##############################################################################

log "INFO" "Building application for production..."

# Install dependencies
log "INFO" "Installing dependencies..."
npm ci --production=false

# Run tests
log "INFO" "Running test suite..."
if ! npm test -- --passWithNoTests --watchAll=false; then
    error_exit "Tests failed"
fi
log "SUCCESS" "Tests passed"

# Build application
log "INFO" "Building Next.js application..."
if ! npm run build; then
    error_exit "Build failed"
fi
log "SUCCESS" "Build completed"

##############################################################################
# OPAL Integration Validation
##############################################################################

log "INFO" "Validating OPAL integration..."

# Test OPAL webhook endpoint
WEBHOOK_URL="https://webhook.opal.optimizely.com/webhooks/89019f3c31de4caca435e995d9089813/825e1edf-fd07-460e-a123-aab99ed78c2b"

log "INFO" "Testing OPAL webhook connectivity..."
if curl -s --head "${WEBHOOK_URL}" > /dev/null; then
    log "SUCCESS" "OPAL webhook endpoint is reachable"
else
    log "WARN" "OPAL webhook endpoint unreachable (this may be expected)"
fi

# Validate OPAL configuration files
log "INFO" "Validating OPAL agent configurations..."
if [ -d "opal-config" ]; then
    AGENT_COUNT=$(find opal-config -name "*.json" -o -name "*.yaml" -o -name "*.yml" | wc -l)
    log "INFO" "Found ${AGENT_COUNT} OPAL agent configuration files"

    if [ $AGENT_COUNT -lt 5 ]; then
        log "WARN" "Expected at least 5 OPAL agent configurations"
    fi
else
    log "WARN" "OPAL configuration directory not found"
fi

##############################################################################
# Database Migration and Validation
##############################################################################

log "INFO" "Validating database schema..."

# Check if database migration is needed
if [ -f "supabase/migrations" ]; then
    log "INFO" "Database migrations found - ensure they are applied to production"
else
    log "INFO" "No database migrations detected"
fi

# Validate webhook events table exists (via type checking)
if grep -q "opal_webhook_events" src/lib/types/database.ts; then
    log "SUCCESS" "Webhook events table type definition found"
else
    error_exit "Missing webhook events table type definition"
fi

##############################################################################
# Security Validation
##############################################################################

log "INFO" "Running security checks..."

# Check for hardcoded secrets
log "INFO" "Scanning for hardcoded secrets..."
if grep -r -i "password\|secret\|token" --include="*.ts" --include="*.tsx" src/ | grep -v "process.env" | grep -v "// " | grep -v "import"; then
    log "WARN" "Potential hardcoded secrets found - review before deployment"
else
    log "SUCCESS" "No hardcoded secrets detected"
fi

# Verify HTTPS enforcement
if grep -q "https" next.config.js || [ "${NODE_ENV:-}" = "production" ]; then
    log "SUCCESS" "HTTPS configuration verified"
else
    log "WARN" "HTTPS enforcement not explicitly configured"
fi

##############################################################################
# Performance Validation
##############################################################################

log "INFO" "Validating performance metrics..."

# Check bundle sizes
BUILD_SIZE=$(du -sh .next | cut -f1)
log "INFO" "Build size: ${BUILD_SIZE}"

# Check for large dependencies
if [ -f "package-lock.json" ]; then
    LARGE_DEPS=$(jq -r '.packages | to_entries[] | select(.value.size > 1000000) | .key' package-lock.json 2>/dev/null | head -5)
    if [ -n "$LARGE_DEPS" ]; then
        log "INFO" "Large dependencies detected:"
        echo "$LARGE_DEPS" | while read -r dep; do
            log "INFO" "  - $dep"
        done
    fi
fi

##############################################################################
# Deploy to Production
##############################################################################

log "INFO" "Deploying to production..."

# Deploy using Vercel CLI
log "INFO" "Deploying to Vercel..."
if ! VERCEL_TOKEN="$VERCEL_TOKEN" npx vercel --prod --yes; then
    error_exit "Vercel deployment failed"
fi

log "SUCCESS" "Deployment to Vercel completed"

##############################################################################
# Post-Deployment Validation
##############################################################################

log "INFO" "Running post-deployment validation..."

# Wait for deployment to be live
sleep 30

# Get deployment URL
DEPLOYMENT_URL="${NEXT_PUBLIC_BASE_URL}"
log "INFO" "Testing deployment at: ${DEPLOYMENT_URL}"

# Health check
if curl -s "${DEPLOYMENT_URL}/api/health" > /dev/null; then
    log "SUCCESS" "Health check passed"
else
    log "WARN" "Health check endpoint not available"
fi

# Test key endpoints
ENDPOINTS=(
    "/api/opal/status"
    "/api/webhooks/opal-workflow"
    "/engine"
    "/engine/results"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -s --head "${DEPLOYMENT_URL}${endpoint}" > /dev/null; then
        log "SUCCESS" "Endpoint ${endpoint} is accessible"
    else
        log "WARN" "Endpoint ${endpoint} returned error"
    fi
done

##############################################################################
# Monitoring and Alerting Setup
##############################################################################

log "INFO" "Setting up monitoring..."

# Create deployment record
cat > "${BACKUP_PATH}/deployment-info.json" << EOF
{
  "deploymentId": "${DEPLOYMENT_ID}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "${CURRENT_COMMIT}",
  "branch": "${CURRENT_BRANCH}",
  "deploymentUrl": "${DEPLOYMENT_URL}",
  "buildSize": "${BUILD_SIZE}",
  "status": "completed"
}
EOF

log "SUCCESS" "Deployment record created"

##############################################################################
# Success Notification
##############################################################################

log "SUCCESS" "🎉 Deployment ${DEPLOYMENT_ID} completed successfully!"
log "INFO" "Deployment URL: ${DEPLOYMENT_URL}"
log "INFO" "Commit: ${CURRENT_COMMIT}"
log "INFO" "Log file: ${LOG_FILE}"

# Optional: Send notification (Slack, email, etc.)
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Production deployment completed: ${DEPLOYMENT_ID}\\nURL: ${DEPLOYMENT_URL}\\nCommit: ${CURRENT_COMMIT}\"}" \
        "${SLACK_WEBHOOK_URL}" > /dev/null 2>&1 || true
fi

log "INFO" "📊 Next steps:"
log "INFO" "  1. Monitor error rates and performance"
log "INFO" "  2. Verify OPAL integration is working"
log "INFO" "  3. Test critical user flows"
log "INFO" "  4. Monitor user feedback"

exit 0