/**
 * Deployment Process Validation Tests
 *
 * These tests validate the deployment configuration and process to prevent
 * recurring Vercel authorization issues and ensure deployment readiness.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Deployment Process Validation', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('Configuration Validation', () => {
    test('should have required package.json scripts', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Validate deployment scripts exist
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts['deploy:prod']).toBeDefined();

      // Validate pre-deployment scripts exist
      expect(packageJson.scripts['pre-deploy']).toBeDefined();
      expect(packageJson.scripts['validate:security']).toBeDefined();
      expect(packageJson.scripts['validate:deployment']).toBeDefined();
    });

    test('should have proper Vercel configuration', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      expect(fs.existsSync(vercelConfigPath)).toBe(true);

      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

      // Validate framework configuration
      expect(vercelConfig.framework).toBe('nextjs');
      expect(vercelConfig.buildCommand).toBe('npm run build');
      expect(vercelConfig.outputDirectory).toBe('.next');

      // Validate CORS headers for API routes
      expect(vercelConfig.headers).toBeDefined();
      expect(Array.isArray(vercelConfig.headers)).toBe(true);

      const apiHeaders = vercelConfig.headers.find(h => h.source === '/api/(.*)');
      expect(apiHeaders).toBeDefined();
      expect(apiHeaders.headers).toBeDefined();
    });

    test('should have Vercel project configuration', () => {
      const vercelProjectPath = path.join(projectRoot, '.vercel/project.json');
      expect(fs.existsSync(vercelProjectPath)).toBe(true);

      const projectConfig = JSON.parse(fs.readFileSync(vercelProjectPath, 'utf8'));

      // Validate project is linked
      expect(projectConfig.projectId).toBeDefined();
      expect(projectConfig.orgId).toBeDefined();
      expect(projectConfig.projectName).toBe('ifpa-strategy');

      // Validate project ID format
      expect(projectConfig.projectId).toMatch(/^prj_[A-Za-z0-9]+$/);
      expect(projectConfig.orgId).toMatch(/^team_[A-Za-z0-9]+$/);
    });

    test('should have environment configuration template', () => {
      const envExamplePath = path.join(projectRoot, '.env.local.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const envExample = fs.readFileSync(envExamplePath, 'utf8');

      // Validate required environment variables are documented
      const requiredVars = [
        'VERCEL_TOKEN',
        'NEXT_PUBLIC_BASE_URL',
        'OPAL_WEBHOOK_AUTH_KEY',
        'JWT_SECRET',
        'API_SECRET_KEY'
      ];

      requiredVars.forEach(varName => {
        expect(envExample).toContain(varName);
      });
    });
  });

  describe('Deployment Scripts Validation', () => {
    test('should have unified deployment script with correct permissions', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      expect(fs.existsSync(deployScript)).toBe(true);

      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Validate script has proper shebang
      expect(scriptContent).toMatch(/^#!/bin/bash/);

      // Validate error handling
      expect(scriptContent).toContain('set -euo pipefail');

      // Validate authentication handling
      expect(scriptContent).toContain('check_vercel_token');
      expect(scriptContent).toContain('setup_vercel_auth');

      // Validate environment configuration
      expect(scriptContent).toContain('validate_environment');
      expect(scriptContent).toContain('load_production_env');

      // Check file permissions (should be executable)
      const stats = fs.statSync(deployScript);
      const isExecutable = (stats.mode & parseInt('100', 8)) !== 0;
      expect(isExecutable).toBe(true);
    });

    test('should validate GitHub Actions workflow configuration', () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/production-deployment.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);

      const workflowContent = fs.readFileSync(workflowPath, 'utf8');

      // Validate workflow triggers
      expect(workflowContent).toContain('on:');
      expect(workflowContent).toContain('push:');
      expect(workflowContent).toContain('branches: [ main ]');
      expect(workflowContent).toContain('workflow_dispatch:');

      // Validate concurrency control
      expect(workflowContent).toContain('concurrency:');
      expect(workflowContent).toContain('group: production-deployment');

      // Validate jobs structure
      expect(workflowContent).toContain('jobs:');
      expect(workflowContent).toContain('validate:');
      expect(workflowContent).toContain('deploy:');

      // Validate environment configuration
      expect(workflowContent).toContain('environment:');
      expect(workflowContent).toContain('name: production');
      expect(workflowContent).toContain('url: https://ifpa-strategy.vercel.app');

      // Validate secrets usage
      expect(workflowContent).toContain('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}');
      expect(workflowContent).toContain('VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}');
      expect(workflowContent).toContain('VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}');
    });
  });

  describe('Environment Variables Validation', () => {
    test('should validate required environment variables are defined', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_BASE_URL',
        'OPAL_WEBHOOK_AUTH_KEY',
        'JWT_SECRET',
        'API_SECRET_KEY'
      ];

      // Check if environment variables are at least referenced in config files
      const envLocalPath = path.join(projectRoot, '.env.local');
      const envExamplePath = path.join(projectRoot, '.env.local.example');

      let envContent = '';
      if (fs.existsSync(envLocalPath)) {
        envContent += fs.readFileSync(envLocalPath, 'utf8');
      }
      if (fs.existsSync(envExamplePath)) {
        envContent += fs.readFileSync(envExamplePath, 'utf8');
      }

      requiredEnvVars.forEach(varName => {
        expect(envContent).toContain(varName);
      });
    });

    test('should validate environment variable format and security', () => {
      const envExamplePath = path.join(projectRoot, '.env.local.example');
      if (fs.existsSync(envExamplePath)) {
        const envContent = fs.readFileSync(envExamplePath, 'utf8');

        // Check that example doesn't contain real secrets
        expect(envContent).not.toContain('sk_live_');
        expect(envContent).not.toContain('pk_live_');
        expect(envContent).not.toMatch(/[A-Za-z0-9]{32,}/); // Long random strings

        // Check that placeholders are used
        expect(envContent).toContain('your-');
        expect(envContent).toContain('generate-');
      }
    });

    test('should validate production URL configuration', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check production validation script references correct URL
      if (packageJson.scripts['validate:opal:prod']) {
        expect(packageJson.scripts['validate:opal:prod']).toContain('https://ifpa-strategy.vercel.app');
      }
    });
  });

  describe('Authentication Prevention Tests', () => {
    test('should prevent common authentication failures', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script validates token before use
      expect(scriptContent).toContain('check_vercel_token');
      expect(scriptContent).toContain('VERCEL_TOKEN');

      // Test fallback mechanisms
      expect(scriptContent).toContain('npx vercel whoami');
      expect(scriptContent).toContain('Interactive authentication');

      // Test error messages provide guidance
      expect(scriptContent).toContain('VERCEL_TOKEN Setup Instructions');
      expect(scriptContent).toContain('https://vercel.com/account/tokens');
    });

    test('should have token validation logic', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test token validity check
      expect(scriptContent).toContain('npx vercel teams ls');
      expect(scriptContent).toContain('VERCEL_TOKEN is valid and active');
      expect(scriptContent).toContain('invalid or expired');
    });

    test('should provide clear setup instructions', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test setup instructions are present
      expect(scriptContent).toContain('export VERCEL_TOKEN');
      expect(scriptContent).toContain('repository secret');
      expect(scriptContent).toContain('GitHub Actions');
    });
  });

  describe('Build and Test Integration', () => {
    test('should validate build configuration', () => {
      const nextConfigPath = path.join(projectRoot, 'next.config.js');
      expect(fs.existsSync(nextConfigPath) || fs.existsSync(path.join(projectRoot, 'next.config.ts'))).toBe(true);
    });

    test('should have test configuration', () => {
      const jestConfigPath = path.join(projectRoot, 'jest.config.js');
      const vitestConfigPath = path.join(projectRoot, 'vitest.config.ts');

      // At least one test configuration should exist
      expect(fs.existsSync(jestConfigPath) || fs.existsSync(vitestConfigPath)).toBe(true);
    });

    test('should validate TypeScript configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions).toBeDefined();
    });
  });

  describe('Deployment Process Error Prevention', () => {
    test('should handle git repository validation', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test git validation functions
      expect(scriptContent).toContain('validate_git_status');
      expect(scriptContent).toContain('git rev-parse --git-dir');
      expect(scriptContent).toContain('git remote get-url origin');
      expect(scriptContent).toContain('git diff-index --quiet HEAD');
    });

    test('should validate pre-deployment checks', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test pre-deployment validation
      expect(scriptContent).toContain('run_pre_deployment_checks');
      expect(scriptContent).toContain('command -v node');
      expect(scriptContent).toContain('command -v npm');
      expect(scriptContent).toContain('npx vercel --version');
    });

    test('should have rollback and error handling', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test error handling
      expect(scriptContent).toContain('error_exit');
      expect(scriptContent).toContain('cleanup_on_error');
      expect(scriptContent).toContain('trap');
    });
  });

  describe('Post-Deployment Validation', () => {
    test('should validate production endpoint configuration', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test production URL configuration
      expect(scriptContent).toContain('https://ifpa-strategy.vercel.app');
      expect(scriptContent).toContain('/api/health');
      expect(scriptContent).toContain('/api/opal/enhanced-tools');
      expect(scriptContent).toContain('/engine');
      expect(scriptContent).toContain('/engine/results');
    });

    test('should have deployment monitoring and logging', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test logging functionality
      expect(scriptContent).toContain('LOG_FILE');
      expect(scriptContent).toContain('create_deployment_record');
      expect(scriptContent).toContain('deployment-record');
    });
  });
});

describe('Deployment Security Tests', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  test('should not expose sensitive data in configuration files', () => {
    const configFiles = [
      'vercel.json',
      'next.config.js',
      'next.config.ts',
      'package.json'
    ].map(f => path.join(projectRoot, f)).filter(fs.existsSync);

    const sensitivePatterns = [
      /sk_live_[A-Za-z0-9]+/,      // Stripe live keys
      /pk_live_[A-Za-z0-9]+/,      // Stripe publishable keys
      /[A-Za-z0-9]{40,}/,          // Long API keys
      /password\s*[:=]\s*['"]\w+/, // Hardcoded passwords
      /secret\s*[:=]\s*['"]\w+/,   // Hardcoded secrets
    ];

    configFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      sensitivePatterns.forEach(pattern => {
        expect(content).not.toMatch(pattern);
      });
    });
  });

  test('should have proper gitignore configuration', () => {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    // Validate sensitive files are ignored
    const requiredIgnores = [
      '.env.local',
      '.env.production',
      '.vercel',
      'node_modules',
      '.next'
    ];

    requiredIgnores.forEach(ignore => {
      expect(gitignoreContent).toContain(ignore);
    });
  });

  test('should validate webhook security configuration', () => {
    const envExamplePath = path.join(projectRoot, '.env.local.example');
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');

      // Check webhook security variables are documented
      expect(envContent).toContain('OPAL_WEBHOOK_AUTH_KEY');
      expect(envContent).toContain('OPAL_WEBHOOK_HMAC_SECRET');

      // Check security recommendations
      expect(envContent).toContain('openssl rand -hex 32');
    }
  });
});