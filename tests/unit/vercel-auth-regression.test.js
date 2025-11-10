/**
 * Vercel Authorization Regression Tests
 *
 * These tests specifically target the recurring Vercel authorization issues
 * to ensure they are permanently resolved and don't reoccur.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Vercel Authorization Regression Tests', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('Authorization Configuration Prevention', () => {
    test('should prevent missing VERCEL_TOKEN issues', () => {
      // Check that deployment scripts handle missing token gracefully
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      expect(fs.existsSync(deployScript)).toBe(true);

      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script checks for VERCEL_TOKEN existence
      expect(scriptContent).toMatch(/\$\{VERCEL_TOKEN[:-]/);
      expect(scriptContent).toContain('VERCEL_TOKEN environment variable');

      // Test that script provides fallback options
      expect(scriptContent).toContain('check_vercel_token');
      expect(scriptContent).toContain('setup_vercel_auth');

      // Test that script gives clear instructions when token is missing
      expect(scriptContent).toContain('VERCEL_TOKEN Setup Instructions');
      expect(scriptContent).toContain('https://vercel.com/account/tokens');
    });

    test('should prevent interactive authentication prompts in CI', () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/production-deployment.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);

      const workflowContent = fs.readFileSync(workflowPath, 'utf8');

      // Test that CI workflow uses token from secrets
      expect(workflowContent).toContain('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}');

      // Test that workflow validates token existence
      expect(workflowContent).toContain('if [ -z "$VERCEL_TOKEN" ]');
      expect(workflowContent).toContain('VERCEL_TOKEN secret not configured');
    });

    test('should prevent recurring token expiration issues', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script validates token before use
      expect(scriptContent).toContain('npx vercel teams ls');
      expect(scriptContent).toContain('invalid or expired');

      // Test that script provides guidance for token renewal
      expect(scriptContent).toContain('Create a new token');
    });
  });

  describe('Project Linking Validation', () => {
    test('should validate Vercel project is properly linked', () => {
      const projectConfigPath = path.join(projectRoot, '.vercel/project.json');
      expect(fs.existsSync(projectConfigPath)).toBe(true);

      const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));

      // Validate project configuration exists and has correct format
      expect(projectConfig.projectId).toBeDefined();
      expect(projectConfig.projectId).toMatch(/^prj_[A-Za-z0-9]+$/);
      expect(projectConfig.orgId).toBeDefined();
      expect(projectConfig.orgId).toMatch(/^team_[A-Za-z0-9]+$/);
      expect(projectConfig.projectName).toBe('ifpa-strategy');

      // Validate project matches expected repository
      expect(projectConfig.projectName).toBe('ifpa-strategy');
    });

    test('should prevent project unlinking issues', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

      // Test that .vercel directory is ignored to prevent accidental commits
      expect(gitignoreContent).toContain('.vercel');
    });

    test('should validate project ID consistency', () => {
      const projectConfigPath = path.join(projectRoot, '.vercel/project.json');
      const workflowPath = path.join(projectRoot, '.github/workflows/production-deployment.yml');

      if (fs.existsSync(projectConfigPath) && fs.existsSync(workflowPath)) {
        const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');

        // Test that workflow references project configuration
        expect(workflowContent).toContain('VERCEL_PROJECT_ID');
        expect(workflowContent).toContain('VERCEL_ORG_ID');
      }
    });
  });

  describe('Environment-Specific Authorization', () => {
    test('should handle different environments correctly', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script detects CI environment
      expect(scriptContent).toContain('CI:-false');
      expect(scriptContent).toContain('Interactive authentication');

      // Test different behavior for CI vs local
      expect(scriptContent).toContain('if [[ "${CI:-false}" == "false" ]]');
    });

    test('should prevent local development token leakage', () => {
      const envFiles = [
        '.env.local',
        '.env.local.example',
        '.env.production'
      ].map(f => path.join(projectRoot, f)).filter(fs.existsSync);

      envFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');

        // Test that real tokens are not committed
        expect(content).not.toMatch(/VERCEL_TOKEN=vcel_[A-Za-z0-9]+/);

        if (filePath.includes('example')) {
          // Example files should have placeholder values
          expect(content).toContain('your-') || expect(content).toContain('generate-');
        }
      });
    });
  });

  describe('Deployment Command Validation', () => {
    test('should use consistent Vercel deployment commands', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script uses proper deployment flags
      expect(scriptContent).toContain('npx vercel --prod --yes');

      // Test that token is properly passed to command
      expect(scriptContent).toContain('VERCEL_TOKEN="${VERCEL_TOKEN}"');
    });

    test('should prevent scope and team configuration issues', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script validates team/org access
      expect(scriptContent).toContain('npx vercel teams ls');
    });

    test('should handle deployment command failures gracefully', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test error handling for deployment failures
      expect(scriptContent).toContain('Vercel deployment failed');
      expect(scriptContent).toContain('error_exit');
      expect(scriptContent).toContain('cleanup_on_error');
    });
  });

  describe('Token Security and Management', () => {
    test('should prevent token exposure in logs', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that tokens are not logged
      expect(scriptContent).not.toMatch(/echo.*\$VERCEL_TOKEN/);
      expect(scriptContent).not.toMatch(/log.*\$VERCEL_TOKEN/);

      // Test that logging functions exist for other information
      expect(scriptContent).toContain('log "INFO"');
      expect(scriptContent).toContain('LOG_FILE');
    });

    test('should validate token format and requirements', () => {
      // This test would validate token format in a real environment
      // For now, we test that validation logic exists
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      expect(scriptContent).toContain('VERCEL_TOKEN is valid');
      expect(scriptContent).toContain('check_vercel_token');
    });

    test('should provide secure token storage guidance', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script provides security guidance
      expect(scriptContent).toContain('~/.bashrc');
      expect(scriptContent).toContain('~/.zshrc');
      expect(scriptContent).toContain('repository secret');
    });
  });

  describe('Regression Prevention Mechanisms', () => {
    test('should have clear documentation for authorization setup', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that comprehensive setup instructions exist
      expect(scriptContent).toContain('VERCEL_TOKEN Setup Instructions');
      expect(scriptContent).toContain('Go to https://vercel.com/account/tokens');
      expect(scriptContent).toContain('Create a new token');
      expect(scriptContent).toContain('export VERCEL_TOKEN');
      expect(scriptContent).toContain('GitHub Actions');
    });

    test('should validate all required secrets are documented', () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/production-deployment.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');

      const requiredSecrets = [
        'VERCEL_TOKEN',
        'VERCEL_ORG_ID',
        'VERCEL_PROJECT_ID',
        'OPAL_WEBHOOK_AUTH_KEY',
        'JWT_SECRET',
        'API_SECRET_KEY'
      ];

      requiredSecrets.forEach(secret => {
        expect(workflowContent).toContain(`secrets.${secret}`);
      });
    });

    test('should have automated testing for deployment configuration', () => {
      // This test validates that we have tests to prevent regressions
      const testFiles = [
        'tests/unit/deployment-validation.test.js',
        'tests/unit/vercel-auth-regression.test.js'
      ].map(f => path.join(projectRoot, f));

      testFiles.forEach(testFile => {
        expect(fs.existsSync(testFile)).toBe(true);
      });

      // Validate package.json has test scripts
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts['test:unit']).toBeDefined();
    });
  });

  describe('Production URL and Endpoint Validation', () => {
    test('should prevent production URL configuration errors', () => {
      const files = [
        'scripts/deploy-production-unified.sh',
        '.github/workflows/production-deployment.yml'
      ];

      files.forEach(filePath => {
        const fullPath = path.join(projectRoot, filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).toContain('https://ifpa-strategy.vercel.app');
        }
      });
    });

    test('should validate GitHub repository URL consistency', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      expect(scriptContent).toContain('https://github.com/alex-prft/ifpa-strategy');
    });

    test('should prevent localhost configuration in production', () => {
      const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
      const scriptContent = fs.readFileSync(deployScript, 'utf8');

      // Test that script detects and fixes localhost URLs
      expect(scriptContent).toContain('localhost');
      expect(scriptContent).toContain('Updated NEXT_PUBLIC_BASE_URL to production URL');
    });
  });
});

describe('Authorization Error Recovery Tests', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  test('should provide recovery instructions for common auth failures', () => {
    const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
    const scriptContent = fs.readFileSync(deployScript, 'utf8');

    // Test recovery instructions for various failure scenarios
    expect(scriptContent).toContain('To fix recurring authorization issues');
    expect(scriptContent).toContain('Create a new token');
    expect(scriptContent).toContain('Add it as a repository secret');
  });

  test('should handle token expiration gracefully', () => {
    const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
    const scriptContent = fs.readFileSync(deployScript, 'utf8');

    // Test that expired tokens are detected
    expect(scriptContent).toContain('invalid or expired');
    expect(scriptContent).toContain('Test token validity');
  });

  test('should provide alternative authentication methods', () => {
    const deployScript = path.join(projectRoot, 'scripts/deploy-production-unified.sh');
    const scriptContent = fs.readFileSync(deployScript, 'utf8');

    // Test fallback to interactive auth
    expect(scriptContent).toContain('authenticate interactively');
    expect(scriptContent).toContain('npx vercel login');
    expect(scriptContent).toContain('Interactive authentication successful');
  });
});