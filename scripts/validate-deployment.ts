#!/usr/bin/env npx tsx

/**
 * Deployment Validation Script
 * Validates GitHub and Vercel integration readiness
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

interface DeploymentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  required: boolean;
}

class DeploymentValidator {
  private checks: DeploymentCheck[] = [];
  private errors: number = 0;
  private warnings: number = 0;

  private addCheck(name: string, status: 'pass' | 'fail' | 'warning' | 'skip', message: string, required: boolean = false): void {
    this.checks.push({ name, status, message, required });
    if (status === 'fail') this.errors++;
    if (status === 'warning') this.warnings++;
  }

  /**
   * Execute a shell command and return the result
   */
  private async execCommand(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode || 0 });
      });

      child.on('error', (error) => {
        resolve({ stdout: '', stderr: error.message, exitCode: 1 });
      });
    });
  }

  /**
   * Check if we're in a Git repository
   */
  private async validateGitRepository(): Promise<void> {
    console.log('🔍 Validating Git repository...');

    const result = await this.execCommand('git', ['status']);

    if (result.exitCode === 0) {
      this.addCheck('Git Repository', 'pass', 'Project is in a Git repository');

      // Check if there are uncommitted changes
      if (result.stdout.includes('nothing to commit')) {
        this.addCheck('Git Status', 'pass', 'Working directory is clean');
      } else if (result.stdout.includes('Changes not staged') || result.stdout.includes('Changes to be committed')) {
        this.addCheck('Git Status', 'warning', 'Uncommitted changes detected');
      }

      // Check remote repository
      const remoteResult = await this.execCommand('git', ['remote', '-v']);
      if (remoteResult.exitCode === 0 && remoteResult.stdout.includes('github.com')) {
        this.addCheck('GitHub Remote', 'pass', 'GitHub remote repository configured');
      } else if (remoteResult.exitCode === 0) {
        this.addCheck('GitHub Remote', 'warning', 'Remote repository exists but not GitHub');
      } else {
        this.addCheck('GitHub Remote', 'fail', 'No remote repository configured', true);
      }
    } else {
      this.addCheck('Git Repository', 'fail', 'Not in a Git repository', true);
    }
  }

  /**
   * Validate GitHub Actions workflow
   */
  private async validateGitHubActions(): Promise<void> {
    console.log('🔍 Validating GitHub Actions...');

    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');

    if (fs.existsSync(workflowsDir)) {
      this.addCheck('GitHub Actions Directory', 'pass', 'Workflows directory exists');

      const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

      if (workflowFiles.length > 0) {
        this.addCheck('GitHub Workflows', 'pass', `${workflowFiles.length} workflow(s) configured`);

        // Check for security validation workflow
        const securityWorkflow = workflowFiles.find(f => f.includes('security'));
        if (securityWorkflow) {
          this.addCheck('Security Workflow', 'pass', `Security validation workflow: ${securityWorkflow}`);
        } else {
          this.addCheck('Security Workflow', 'warning', 'No security validation workflow found');
        }
      } else {
        this.addCheck('GitHub Workflows', 'warning', 'No workflow files found');
      }
    } else {
      this.addCheck('GitHub Actions Directory', 'warning', 'No GitHub Actions workflows configured');
    }
  }

  /**
   * Validate Vercel configuration
   */
  private async validateVercelConfiguration(): Promise<void> {
    console.log('🔍 Validating Vercel configuration...');

    // Check for vercel.json
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      this.addCheck('Vercel Config', 'pass', 'vercel.json configuration file exists');

      try {
        const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
        if (config.framework) {
          this.addCheck('Vercel Framework', 'pass', `Framework configured: ${config.framework}`);
        }
      } catch (error) {
        this.addCheck('Vercel Config Syntax', 'fail', 'vercel.json has syntax errors', true);
      }
    } else {
      this.addCheck('Vercel Config', 'skip', 'No vercel.json (using defaults)');
    }

    // Check for .vercel directory (indicates previous deployment)
    const vercelDir = path.join(process.cwd(), '.vercel');
    if (fs.existsSync(vercelDir)) {
      this.addCheck('Vercel Integration', 'pass', 'Project linked to Vercel');
    } else {
      this.addCheck('Vercel Integration', 'warning', 'Project not yet linked to Vercel');
    }

    // Check Vercel CLI availability
    const vercelCliResult = await this.execCommand('npx', ['vercel', '--version']);
    if (vercelCliResult.exitCode === 0) {
      this.addCheck('Vercel CLI', 'pass', `Vercel CLI available: ${vercelCliResult.stdout}`);
    } else {
      this.addCheck('Vercel CLI', 'warning', 'Vercel CLI not available');
    }
  }

  /**
   * Validate build configuration
   */
  private async validateBuildConfiguration(): Promise<void> {
    console.log('🔍 Validating build configuration...');

    // Check package.json scripts
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        // Check required scripts
        const requiredScripts = ['build', 'start'];
        for (const script of requiredScripts) {
          if (scripts[script]) {
            this.addCheck(`Build Script: ${script}`, 'pass', `Script configured: ${scripts[script]}`);
          } else {
            this.addCheck(`Build Script: ${script}`, 'fail', `Required script missing: ${script}`, true);
          }
        }

        // Check for validation scripts
        const validationScripts = Object.keys(scripts).filter(s => s.includes('validate'));
        if (validationScripts.length > 0) {
          this.addCheck('Validation Scripts', 'pass', `Validation scripts: ${validationScripts.join(', ')}`);
        } else {
          this.addCheck('Validation Scripts', 'warning', 'No validation scripts configured');
        }
      } catch (error) {
        this.addCheck('Package JSON', 'fail', 'package.json has syntax errors', true);
      }
    } else {
      this.addCheck('Package JSON', 'fail', 'package.json not found', true);
    }

    // Test build process
    console.log('🔧 Testing build process...');
    const buildResult = await this.execCommand('npm', ['run', 'build']);
    if (buildResult.exitCode === 0) {
      this.addCheck('Build Process', 'pass', 'Production build successful');

      // Check build output
      const buildDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(buildDir)) {
        this.addCheck('Build Output', 'pass', 'Build artifacts generated');
      } else {
        this.addCheck('Build Output', 'fail', 'Build artifacts not found', true);
      }
    } else {
      this.addCheck('Build Process', 'fail', `Build failed: ${buildResult.stderr}`, true);
    }
  }

  /**
   * Validate environment configuration for deployment
   */
  private async validateEnvironmentForDeployment(): Promise<void> {
    console.log('🔍 Validating environment for deployment...');

    // Check for environment template
    const envExamplePath = path.join(process.cwd(), '.env.local.example');
    if (fs.existsSync(envExamplePath)) {
      this.addCheck('Environment Template', 'pass', 'Environment template exists');
    } else {
      this.addCheck('Environment Template', 'fail', 'Environment template missing', true);
    }

    // Check for production environment file (should NOT exist in repo)
    const envProdPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envProdPath)) {
      this.addCheck('Production Env Security', 'fail', 'Production environment file in repository - SECURITY RISK!', true);
    } else {
      this.addCheck('Production Env Security', 'pass', 'Production environment file not in repository');
    }

    // Check .gitignore for environment files
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      if (gitignoreContent.includes('.env')) {
        this.addCheck('Environment Security', 'pass', 'Environment files properly ignored by Git');
      } else {
        this.addCheck('Environment Security', 'fail', 'Environment files not ignored by Git - SECURITY RISK!', true);
      }
    }

    // Run security validation
    console.log('🛡️ Running security validation...');
    const securityResult = await this.execCommand('npm', ['run', 'validate:security']);
    if (securityResult.exitCode === 0) {
      this.addCheck('Security Validation', 'pass', 'All security checks passed');
    } else {
      this.addCheck('Security Validation', 'fail', 'Security validation failed - check logs', true);
    }
  }

  /**
   * Validate TypeScript configuration
   */
  private async validateTypeScript(): Promise<void> {
    console.log('🔍 Validating TypeScript configuration...');

    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      this.addCheck('TypeScript Config', 'pass', 'TypeScript configuration exists');

      // Test TypeScript compilation
      const tscResult = await this.execCommand('npx', ['tsc', '--noEmit']);
      if (tscResult.exitCode === 0) {
        this.addCheck('TypeScript Compilation', 'pass', 'No TypeScript errors');
      } else {
        this.addCheck('TypeScript Compilation', 'fail', 'TypeScript compilation errors detected', true);
      }
    } else {
      this.addCheck('TypeScript Config', 'warning', 'No TypeScript configuration');
    }
  }

  /**
   * Check deployment readiness
   */
  private async validateDeploymentReadiness(): Promise<void> {
    console.log('🔍 Validating deployment readiness...');

    // Check Node.js version
    const nodeResult = await this.execCommand('node', ['--version']);
    if (nodeResult.exitCode === 0) {
      const nodeVersion = nodeResult.stdout;
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

      if (majorVersion >= 18) {
        this.addCheck('Node.js Version', 'pass', `Node.js ${nodeVersion} (compatible)`);
      } else {
        this.addCheck('Node.js Version', 'warning', `Node.js ${nodeVersion} (consider upgrading to v18+)`);
      }
    } else {
      this.addCheck('Node.js Version', 'fail', 'Node.js not available', true);
    }

    // Check npm version
    const npmResult = await this.execCommand('npm', ['--version']);
    if (npmResult.exitCode === 0) {
      this.addCheck('NPM Version', 'pass', `NPM ${npmResult.stdout}`);
    } else {
      this.addCheck('NPM Version', 'fail', 'NPM not available', true);
    }

    // Check for package-lock.json
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      this.addCheck('Dependency Lock', 'pass', 'package-lock.json exists');
    } else {
      this.addCheck('Dependency Lock', 'warning', 'No package-lock.json - consider running npm install');
    }
  }

  /**
   * Run all deployment validations
   */
  public async validate(): Promise<boolean> {
    console.log('🚀 Starting deployment validation...\n');

    try {
      await this.validateGitRepository();
      await this.validateGitHubActions();
      await this.validateVercelConfiguration();
      await this.validateBuildConfiguration();
      await this.validateEnvironmentForDeployment();
      await this.validateTypeScript();
      await this.validateDeploymentReadiness();
    } catch (error) {
      console.error('❌ Validation error:', error);
      this.addCheck('Validation Process', 'fail', `Validation process failed: ${error}`, true);
    }

    this.printResults();
    return this.errors === 0;
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n🚀 Deployment Validation Results:');
    console.log('=====================================\n');

    const totalChecks = this.checks.length;
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const skippedCount = this.checks.filter(c => c.status === 'skip').length;

    console.log(`📊 Summary: ${passed}/${totalChecks - skippedCount} checks passed (${skippedCount} skipped)`);
    console.log(`❌ Errors: ${this.errors}`);
    console.log(`⚠️ Warnings: ${this.warnings}\n`);

    // Group checks by status
    const criticalFailures = this.checks.filter(c => c.status === 'fail' && c.required);
    const failures = this.checks.filter(c => c.status === 'fail' && !c.required);
    const warnings = this.checks.filter(c => c.status === 'warning');
    const passes = this.checks.filter(c => c.status === 'pass');
    const skippedChecks = this.checks.filter(c => c.status === 'skip');

    // Print critical failures
    if (criticalFailures.length > 0) {
      console.log('🚨 Critical Deployment Issues:');
      criticalFailures.forEach(check => {
        console.log(`  ❌ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print other failures
    if (failures.length > 0) {
      console.log('❌ Deployment Issues:');
      failures.forEach(check => {
        console.log(`  ❌ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log('⚠️ Deployment Warnings:');
      warnings.forEach(check => {
        console.log(`  ⚠️ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print passed checks summary
    if (passes.length > 0) {
      console.log(`✅ ${passes.length} deployment checks passed successfully\n`);
    }

    // Print skipped checks
    if (skippedChecks.length > 0) {
      console.log('⏭️ Skipped checks:');
      skippedChecks.forEach(check => {
        console.log(`  ⏭️ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Final status
    if (this.errors === 0) {
      console.log('🎉 Deployment validation PASSED - Ready to deploy!');
      console.log('\n🚀 Next steps:');
      console.log('  1. Commit and push your changes to GitHub');
      console.log('  2. Deploy to Vercel: npx vercel --prod');
      console.log('  3. Verify deployment with: npm run validate:opal:prod');
    } else {
      console.log('🚫 Deployment validation FAILED - Fix issues before deployment!');
      if (criticalFailures.length > 0) {
        console.log('⚠️ CRITICAL ISSUES must be resolved before deployment!');
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new DeploymentValidator();

  try {
    const success = await validator.validate();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Deployment validation script failed:', error);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error in deployment validation:', error);
    process.exit(1);
  });
}

export { DeploymentValidator };