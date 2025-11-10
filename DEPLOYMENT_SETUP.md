# Deployment Setup Guide - Vercel Authorization Fix

This document provides comprehensive instructions to permanently resolve the recurring Vercel authorization issues and establish a robust deployment process.

## 🎯 Problem Summary

The recurring authorization requests during production deployments were caused by:

1. **Missing VERCEL_TOKEN**: The deployment scripts relied on environment variables that weren't persistently configured
2. **No CI/CD Automation**: Manual deployment process prone to authentication issues
3. **Inconsistent Token Management**: No centralized token validation and fallback mechanisms

## 🔧 Solution Implementation

### 1. Unified Deployment Script

A new robust deployment script has been created: `scripts/deploy-production-unified.sh`

**Key Features:**
- ✅ Automatic token validation and fallback mechanisms
- ✅ Clear setup instructions when authentication fails
- ✅ Support for both local and CI/CD deployments
- ✅ Comprehensive error handling and rollback capabilities
- ✅ Environment-specific configuration management

### 2. GitHub Actions Workflow

A new automated deployment workflow: `.github/workflows/production-deployment.yml`

**Key Features:**
- ✅ Automated deployment on push to main branch
- ✅ Manual deployment trigger with options
- ✅ Comprehensive validation and testing
- ✅ Proper secret management
- ✅ Post-deployment validation

### 3. Comprehensive Testing Suite

Regression prevention tests in `tests/unit/`:
- `deployment-validation.test.js` - General deployment configuration validation
- `vercel-auth-regression.test.js` - Specific authorization issue prevention

## 🚀 Setup Instructions

### Step 1: Configure Vercel Token

#### Option A: Personal Token (Recommended for Local Development)

1. **Generate Token:**
   ```bash
   # Go to https://vercel.com/account/tokens
   # Create a new token with deployment permissions
   ```

2. **Set Environment Variable:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc for persistence
   export VERCEL_TOKEN='your_token_here'

   # Or set for current session only
   export VERCEL_TOKEN='your_token_here'
   ```

3. **Verify Token:**
   ```bash
   # Test token validity
   VERCEL_TOKEN='your_token_here' npx vercel teams ls
   ```

#### Option B: GitHub Actions (Required for Automated Deployment)

1. **Add Repository Secrets:**
   - Go to https://github.com/alex-prft/ifpa-strategy/settings/secrets/actions
   - Add the following secrets:

   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=team_GyTWB82YcSZaeOVOLVauznnQ
   VERCEL_PROJECT_ID=prj_A8dWFB6KZr5PEmloWc7pOPn67bWr

   # Production Environment Variables
   OPAL_WEBHOOK_AUTH_KEY=your_production_webhook_key
   OPAL_WEBHOOK_HMAC_SECRET=your_production_hmac_secret
   JWT_SECRET=your_production_jwt_secret
   API_SECRET_KEY=your_production_api_secret
   NEXT_PUBLIC_API_SECRET_KEY=your_production_public_api_secret

   # Database Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ```

### Step 2: Production Environment Configuration

1. **Create Production Environment File:**
   ```bash
   cp .env.local.example .env.production
   ```

2. **Configure Production Values:**
   ```bash
   # Edit .env.production with production-specific values
   NODE_ENV=production
   NEXT_PUBLIC_BASE_URL=https://ifpa-strategy.vercel.app
   NEXT_PUBLIC_APP_URL=https://ifpa-strategy.vercel.app

   # Add all required production environment variables
   ```

### Step 3: Verify Configuration

1. **Run Configuration Tests:**
   ```bash
   # Run deployment validation tests
   npm run test:unit tests/unit/deployment-validation.test.js
   npm run test:unit tests/unit/vercel-auth-regression.test.js
   ```

2. **Validate Authentication:**
   ```bash
   # Test local authentication setup
   ./scripts/deploy-production-unified.sh --validate-only
   ```

## 🔄 Deployment Options

### Option 1: Automated GitHub Actions (Recommended)

**Trigger Deployment:**
```bash
# Push to main branch (automatic)
git push origin main

# Or use manual trigger
# Go to: https://github.com/alex-prft/ifpa-strategy/actions/workflows/production-deployment.yml
# Click "Run workflow"
```

**Features:**
- ✅ Automatic deployment on main branch pushes
- ✅ Comprehensive validation and testing
- ✅ Post-deployment verification
- ✅ Detailed deployment summaries
- ✅ No manual authorization required

### Option 2: Local Deployment Script

**Run Deployment:**
```bash
# Set token and deploy
export VERCEL_TOKEN='your_token_here'
./scripts/deploy-production-unified.sh
```

**Features:**
- ✅ Interactive authentication fallback
- ✅ Comprehensive pre-deployment validation
- ✅ Real-time deployment logging
- ✅ Post-deployment verification

### Option 3: Legacy Scripts (Not Recommended)

The old deployment scripts (`deploy-prod.sh`, `deploy-production.sh`) are still available but not recommended. Use the unified script instead.

## 🛡️ Error Prevention Mechanisms

### 1. Token Validation
- Automatic token validity checking before deployment
- Clear error messages with setup instructions
- Fallback to interactive authentication when possible

### 2. Environment Configuration
- Automatic environment variable validation
- Production URL detection and correction
- Security checks for hardcoded secrets

### 3. Project Linking
- Verification of Vercel project configuration
- Consistent project ID and organization validation
- Automatic detection of linking issues

### 4. Regression Testing
- Comprehensive test suite to prevent recurring issues
- Automated validation of deployment configuration
- Security tests for token and secret management

## 📊 Monitoring and Validation

### Post-Deployment Endpoints

The following endpoints are automatically tested after deployment:

- **Health Check**: `https://ifpa-strategy.vercel.app/api/health`
- **OPAL Tools**: `https://ifpa-strategy.vercel.app/api/opal/enhanced-tools`
- **Webhook Endpoint**: `https://ifpa-strategy.vercel.app/api/webhooks/opal-workflow`
- **Engine Dashboard**: `https://ifpa-strategy.vercel.app/engine`
- **Results Page**: `https://ifpa-strategy.vercel.app/engine/results`

### Monitoring Commands

```bash
# Check deployment status
npx vercel ls

# View deployment logs
npx vercel logs https://ifpa-strategy.vercel.app

# Test production endpoints
curl -I https://ifpa-strategy.vercel.app/api/health
curl -I https://ifpa-strategy.vercel.app/api/opal/enhanced-tools
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "VERCEL_TOKEN not set" Error

**Solution:**
```bash
# Set the token in your environment
export VERCEL_TOKEN='your_token_here'

# Or add to your shell configuration
echo 'export VERCEL_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

#### 2. "Token is invalid or expired" Error

**Solution:**
1. Generate a new token at https://vercel.com/account/tokens
2. Update your environment variable or GitHub secret
3. Verify the token has deployment permissions

#### 3. "Project not linked" Error

**Solution:**
```bash
# Re-link the project
npx vercel link

# Or verify existing configuration
cat .vercel/project.json
```

#### 4. GitHub Actions Deployment Fails

**Solution:**
1. Check repository secrets are configured correctly
2. Verify VERCEL_ORG_ID and VERCEL_PROJECT_ID match your project
3. Ensure all required environment secrets are added

#### 5. Environment Variable Issues

**Solution:**
```bash
# Validate environment configuration
node scripts/setup-env.js --validate

# Check for missing variables
./scripts/deploy-production-unified.sh --validate-only
```

### Getting Help

If you continue experiencing authorization issues:

1. **Check the deployment logs:** `logs/deployment-*.log`
2. **Review the test results:** Run the regression tests
3. **Verify all secrets:** Ensure GitHub secrets are properly configured
4. **Test token validity:** Use `npx vercel whoami` to test authentication

## 🔄 Migration from Old Process

### If Currently Using Old Deployment Scripts:

1. **Set up VERCEL_TOKEN** (see Step 1 above)
2. **Configure GitHub secrets** (see Step 1B above)
3. **Test new deployment script:**
   ```bash
   ./scripts/deploy-production-unified.sh --validate-only
   ```
4. **Use new deployment process** going forward

### Benefits of New Process:

- ✅ **No more recurring authorization requests**
- ✅ **Automated CI/CD deployment**
- ✅ **Comprehensive error handling and rollback**
- ✅ **Built-in security validation**
- ✅ **Detailed logging and monitoring**
- ✅ **Regression prevention through testing**

## 📝 Maintenance

### Regular Tasks:

1. **Monthly**: Verify VERCEL_TOKEN is still valid
2. **Quarterly**: Review and update GitHub secrets
3. **As needed**: Run regression tests when modifying deployment configuration
4. **Before releases**: Verify all tests pass

### Updating Secrets:

```bash
# Test current token validity
npx vercel teams ls

# If expired, generate new token and update:
# 1. Local environment variable
# 2. GitHub repository secrets
# 3. Any team documentation
```

---

## 🎉 Success Criteria

✅ **No manual authorization prompts during deployment**
✅ **Automated deployment on push to main**
✅ **Comprehensive error handling and recovery**
✅ **Full test coverage preventing regressions**
✅ **Clear documentation and troubleshooting guides**

The recurring Vercel authorization issues should now be permanently resolved! 🚀