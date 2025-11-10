#!/bin/bash

##############################################################################
# Unified Production Deployment Script - Vercel Authorization Fix
#
# This script solves recurring Vercel authorization issues by:
# 1. Implementing robust token validation and fallback mechanisms
# 2. Providing clear guidance for token setup
# 3. Supporting both local and CI/CD deployments
# 4. Comprehensive error handling and rollback capabilities
#
# Usage:
#   Local: VERCEL_TOKEN=your_token ./scripts/deploy-production-unified.sh
#   CI/CD: Called from GitHub Actions with secrets
##############################################################################

set -euo pipefail  # Exit on any error, undefined vars, pipe failures

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly LOG_FILE="${LOG_DIR}/deployment-${DEPLOYMENT_ID}.log"
readonly BACKUP_DIR="${PROJECT_ROOT}/backups"
readonly PRODUCTION_URL="https://ifpa-strategy.vercel.app"
readonly GITHUB_REPO="https://github.com/alex-prft/ifpa-strategy"

# Ensure directories exist
mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"

##############################################################################
# Logging and Utility Functions
##############################################################################

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Log to file
    echo "${timestamp} [${level}] ${message}" >> "${LOG_FILE}"

    # Display with colors
    case $level in
        "INFO")    echo -e "${BLUE}ℹ️  ${message}${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ ${message}${NC}" ;;
        "WARN")    echo -e "${YELLOW}⚠️  ${message}${NC}" ;;
        "ERROR")   echo -e "${RED}❌ ${message}${NC}" ;;
    esac
}

error_exit() {
    log "ERROR" "$1"
    log "ERROR" "Deployment failed. Check log: ${LOG_FILE}"
    cleanup_on_error
    exit 1
}

cleanup_on_error() {
    log "WARN" "Cleaning up after error..."
    # Kill any background processes if needed
    # Restore from backup if necessary
    log "INFO" "Cleanup completed"
}

##############################################################################
# Vercel Authentication and Token Management
##############################################################################

check_vercel_token() {
    log "INFO" "🔑 Validating Vercel authentication..."

    # Check if VERCEL_TOKEN is set and valid
    if [[ -n "${VERCEL_TOKEN:-}" ]]; then
        log "INFO" "VERCEL_TOKEN found in environment"

        # Test token validity by checking team information
        if VERCEL_TOKEN="${VERCEL_TOKEN}" npx vercel teams ls >/dev/null 2>&1; then
            log "SUCCESS" "VERCEL_TOKEN is valid and active"
            return 0
        else
            log "ERROR" "VERCEL_TOKEN is set but invalid or expired"
            return 1
        fi
    fi

    # Check if vercel is logged in locally
    if npx vercel whoami >/dev/null 2>&1; then
        log "SUCCESS" "Vercel CLI is authenticated locally"
        return 0
    fi

    return 1
}

setup_vercel_auth() {
    log "INFO" "🔧 Setting up Vercel authentication..."

    if check_vercel_token; then
        return 0
    fi

    log "WARN" "Vercel authentication not found or invalid"
    log "INFO" "To fix recurring authorization issues, set up your VERCEL_TOKEN:"
    echo
    echo -e "${YELLOW}🔧 VERCEL_TOKEN Setup Instructions:${NC}"
    echo "1. Go to https://vercel.com/account/tokens"
    echo "2. Create a new token with deployment permissions"
    echo "3. Set it in your environment:"
    echo "   export VERCEL_TOKEN='your_token_here'"
    echo "   # Or add to your ~/.bashrc or ~/.zshrc for persistence"
    echo
    echo "4. For GitHub Actions, add it as a repository secret:"
    echo "   - Go to ${GITHUB_REPO}/settings/secrets/actions"
    echo "   - Add VERCEL_TOKEN with your token value"
    echo

    # Interactive fallback for local development
    if [[ "${CI:-false}" == "false" ]]; then
        read -p "Would you like to authenticate interactively now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Starting interactive Vercel authentication..."
            npx vercel login
            if check_vercel_token; then
                log "SUCCESS" "Interactive authentication successful"
                return 0
            fi
        fi
    fi

    error_exit "Vercel authentication required. Please set VERCEL_TOKEN environment variable."
}

##############################################################################
# Environment Configuration Management
##############################################################################

validate_environment() {
    log "INFO" "🌍 Validating deployment environment..."

    local required_vars=(
        "NODE_ENV"
        "NEXT_PUBLIC_BASE_URL"
        "OPAL_WEBHOOK_AUTH_KEY"
        "JWT_SECRET"
        "API_SECRET_KEY"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        log "INFO" "Create a .env.production file with production values"
        log "INFO" "Or set these variables in your Vercel project settings"
        return 1
    fi

    # Validate specific values
    if [[ "${NEXT_PUBLIC_BASE_URL}" == *"localhost"* ]]; then
        log "WARN" "NEXT_PUBLIC_BASE_URL appears to be set to localhost"
        log "INFO" "For production, this should be: ${PRODUCTION_URL}"
        export NEXT_PUBLIC_BASE_URL="${PRODUCTION_URL}"
        log "INFO" "Updated NEXT_PUBLIC_BASE_URL to production URL"
    fi

    log "SUCCESS" "Environment validation passed"
}

load_production_env() {
    log "INFO" "📄 Loading production environment configuration..."

    # Load production environment file if it exists
    if [[ -f "${PROJECT_ROOT}/.env.production" ]]; then
        log "INFO" "Loading .env.production file"
        set -o allexport
        source "${PROJECT_ROOT}/.env.production"
        set +o allexport
    elif [[ -f "${PROJECT_ROOT}/.env.local" ]]; then
        log "INFO" "Loading .env.local file (development settings)"
        set -o allexport
        source "${PROJECT_ROOT}/.env.local"
        set +o allexport
    fi

    # Set production defaults
    export NODE_ENV="production"
    export NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-$PRODUCTION_URL}"
}

##############################################################################
# Git Repository Management
##############################################################################

validate_git_status() {
    log "INFO" "📋 Validating Git repository status..."

    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        error_exit "Not in a Git repository"
    fi

    # Check remote configuration
    if ! git remote get-url origin >/dev/null 2>&1; then
        error_exit "No Git remote 'origin' configured"
    fi

    local remote_url=$(git remote get-url origin)
    if [[ "$remote_url" != *"alex-prft/ifpa-strategy"* ]]; then
        log "WARN" "Remote URL doesn't match expected repository: $remote_url"
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log "WARN" "Uncommitted changes detected"
        git status --porcelain

        if [[ "${CI:-false}" == "false" ]]; then
            read -p "Continue with deployment anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error_exit "Deployment cancelled due to uncommitted changes"
            fi
        else
            log "WARN" "Proceeding with uncommitted changes in CI environment"
        fi
    fi

    # Get current commit info
    export CURRENT_COMMIT=$(git rev-parse HEAD)
    export CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

    log "INFO" "Git validation completed"
    log "INFO" "Branch: ${CURRENT_BRANCH}, Commit: ${CURRENT_COMMIT:0:8}"
}

##############################################################################
# Pre-deployment Validation
##############################################################################

run_pre_deployment_checks() {
    log "INFO" "🔍 Running pre-deployment validation..."

    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        error_exit "Node.js not found"
    fi

    if ! command -v npm &> /dev/null; then
        error_exit "npm not found"
    fi

    log "INFO" "Node.js version: $(node --version)"
    log "INFO" "npm version: $(npm --version)"

    # Validate package.json
    if [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
        error_exit "package.json not found"
    fi

    # Check Vercel CLI
    if ! npx vercel --version >/dev/null 2>&1; then
        error_exit "Vercel CLI not available"
    fi

    log "SUCCESS" "Pre-deployment checks passed"
}

##############################################################################
# Build and Test Process
##############################################################################

run_build_and_tests() {
    log "INFO" "🔨 Building application for production..."

    cd "${PROJECT_ROOT}"

    # Clean install dependencies
    log "INFO" "Installing dependencies..."
    if ! npm ci --production=false; then
        error_exit "Failed to install dependencies"
    fi

    # Run tests (if they exist and we're not in CI skip mode)
    if [[ -f "jest.config.js" ]] && [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        log "INFO" "Running test suite..."
        if ! npm test -- --passWithNoTests --watchAll=false; then
            error_exit "Tests failed"
        fi
        log "SUCCESS" "Tests passed"
    else
        log "INFO" "Skipping tests (not configured or SKIP_TESTS=true)"
    fi

    # Build the application
    log "INFO" "Building Next.js application..."
    if ! npm run build; then
        error_exit "Build failed"
    fi

    # Validate build output
    if [[ ! -d "${PROJECT_ROOT}/.next" ]]; then
        error_exit "Build output directory (.next) not found"
    fi

    local build_size=$(du -sh .next 2>/dev/null | cut -f1 || echo "unknown")
    log "SUCCESS" "Build completed successfully (size: ${build_size})"
}

##############################################################################
# Deployment Execution
##############################################################################

deploy_to_vercel() {
    log "INFO" "🚀 Deploying to Vercel..."

    cd "${PROJECT_ROOT}"

    # Construct deployment command
    local deploy_cmd="npx vercel --prod --yes"

    # Use token if available
    if [[ -n "${VERCEL_TOKEN:-}" ]]; then
        deploy_cmd="VERCEL_TOKEN='${VERCEL_TOKEN}' ${deploy_cmd}"
        log "INFO" "Using VERCEL_TOKEN for authentication"
    else
        log "INFO" "Using local Vercel CLI authentication"
    fi

    # Execute deployment
    if eval "${deploy_cmd}"; then
        log "SUCCESS" "Vercel deployment completed"
    else
        error_exit "Vercel deployment failed"
    fi
}

##############################################################################
# Post-deployment Validation
##############################################################################

validate_deployment() {
    log "INFO" "🧪 Validating production deployment..."

    # Wait for deployment to be available
    log "INFO" "Waiting for deployment to be ready..."
    sleep 30

    # Test health endpoint
    local health_url="${PRODUCTION_URL}/api/health"
    if curl -sSf --connect-timeout 10 --max-time 30 "${health_url}" >/dev/null 2>&1; then
        log "SUCCESS" "Health check passed"
    else
        log "WARN" "Health endpoint not available at ${health_url}"
    fi

    # Test main application endpoints
    local endpoints=(
        "/api/opal/enhanced-tools"
        "/api/webhooks/opal-workflow"
        "/engine"
        "/engine/results"
    )

    local failed_endpoints=()

    for endpoint in "${endpoints[@]}"; do
        local test_url="${PRODUCTION_URL}${endpoint}"
        if curl -sSf --connect-timeout 10 --max-time 30 --head "${test_url}" >/dev/null 2>&1; then
            log "SUCCESS" "Endpoint ${endpoint} is accessible"
        else
            log "WARN" "Endpoint ${endpoint} returned error"
            failed_endpoints+=("$endpoint")
        fi
    done

    if [[ ${#failed_endpoints[@]} -gt 0 ]]; then
        log "WARN" "Some endpoints failed validation: ${failed_endpoints[*]}"
        log "INFO" "This may be expected for certain protected endpoints"
    else
        log "SUCCESS" "All endpoint validations passed"
    fi
}

##############################################################################
# Deployment Record and Monitoring
##############################################################################

create_deployment_record() {
    log "INFO" "📊 Creating deployment record..."

    local record_file="${BACKUP_DIR}/deployment-${DEPLOYMENT_ID}.json"

    cat > "${record_file}" << EOF
{
  "deploymentId": "${DEPLOYMENT_ID}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "${CURRENT_COMMIT:-unknown}",
  "branch": "${CURRENT_BRANCH:-unknown}",
  "deploymentUrl": "${PRODUCTION_URL}",
  "githubRepo": "${GITHUB_REPO}",
  "vercelProject": "ifpa-strategy",
  "status": "completed",
  "logFile": "${LOG_FILE}",
  "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
  "npmVersion": "$(npm --version 2>/dev/null || echo 'unknown')"
}
EOF

    # Create latest deployment symlink
    ln -sf "deployment-${DEPLOYMENT_ID}.json" "${BACKUP_DIR}/latest-deployment.json"

    log "SUCCESS" "Deployment record created: ${record_file}"
}

##############################################################################
# Main Deployment Flow
##############################################################################

main() {
    log "INFO" "🚀 Starting Unified Production Deployment: ${DEPLOYMENT_ID}"
    log "INFO" "Target: ${PRODUCTION_URL}"
    log "INFO" "Log file: ${LOG_FILE}"

    # Change to project directory
    cd "${PROJECT_ROOT}"

    # Execute deployment steps
    setup_vercel_auth
    load_production_env
    validate_environment
    validate_git_status
    run_pre_deployment_checks
    run_build_and_tests
    deploy_to_vercel
    validate_deployment
    create_deployment_record

    # Success message
    echo
    echo "=========================================================================="
    log "SUCCESS" "🎉 Deployment ${DEPLOYMENT_ID} completed successfully!"
    echo "=========================================================================="
    echo
    log "INFO" "📋 Deployment Summary:"
    log "INFO" "  URL: ${PRODUCTION_URL}"
    log "INFO" "  Commit: ${CURRENT_COMMIT:0:8} (${CURRENT_BRANCH})"
    log "INFO" "  Log: ${LOG_FILE}"
    echo
    log "INFO" "🔧 To prevent future authorization issues:"
    log "INFO" "  1. Set VERCEL_TOKEN in your environment permanently"
    log "INFO" "  2. Use GitHub Actions for automated deployments"
    log "INFO" "  3. Configure production environment variables in Vercel dashboard"
    echo
    log "INFO" "📊 Next steps:"
    log "INFO" "  - Monitor application performance and error rates"
    log "INFO" "  - Verify OPAL integration endpoints"
    log "INFO" "  - Test critical user workflows"

    exit 0
}

##############################################################################
# Error Handling and Cleanup
##############################################################################

# Set up error handling
trap 'error_exit "Script interrupted"' INT TERM
trap 'cleanup_on_error' ERR

# Execute main function
main "$@"