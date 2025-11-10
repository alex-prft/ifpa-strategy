#!/usr/bin/env npx tsx

/**
 * Security Validation Script for CI/CD Pipeline
 * Validates all security configurations before deployment
 */

import { validateEnvironmentConfig, printEnvironmentStatus } from '../src/lib/config/env-config';
import { ValidationSchemas } from '../src/lib/validation/input-sanitizer';
import { getSecurityHeaders } from '../src/lib/validation/input-sanitizer';
import { rateLimiters } from '../src/lib/security/rate-limiting';
import fs from 'fs';
import path from 'path';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

class SecurityValidator {
  private checks: SecurityCheck[] = [];
  private errors: number = 0;
  private warnings: number = 0;

  private addCheck(name: string, status: 'pass' | 'fail' | 'warning', message: string, critical: boolean = false): void {
    this.checks.push({ name, status, message, critical });
    if (status === 'fail') this.errors++;
    if (status === 'warning') this.warnings++;
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironment(): void {
    console.log('🔍 Validating environment configuration...');

    try {
      const validation = validateEnvironmentConfig();

      if (validation.valid) {
        this.addCheck('Environment Configuration', 'pass', 'All required environment variables are properly configured');
      } else {
        this.addCheck('Environment Configuration', 'fail', `${validation.errors.length} environment errors found`, true);
        validation.errors.forEach(error => {
          this.addCheck('Environment Error', 'fail', error, true);
        });
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          this.addCheck('Environment Warning', 'warning', warning);
        });
      }
    } catch (error) {
      this.addCheck('Environment Configuration', 'fail', `Environment validation failed: ${error}`, true);
    }
  }

  /**
   * Validate security headers configuration
   */
  private validateSecurityHeaders(): void {
    console.log('🔍 Validating security headers...');

    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const headers = getSecurityHeaders(isDevelopment);

      // Check required security headers
      const requiredHeaders = [
        'X-XSS-Protection',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Content-Security-Policy'
      ];

      for (const header of requiredHeaders) {
        if (headers[header]) {
          this.addCheck(`Security Header: ${header}`, 'pass', `Configured: ${headers[header]}`);
        } else {
          this.addCheck(`Security Header: ${header}`, 'fail', 'Missing required security header', true);
        }
      }

      // Check HSTS in production
      if (!isDevelopment) {
        if (headers['Strict-Transport-Security']) {
          this.addCheck('HSTS Configuration', 'pass', 'HTTPS enforcement enabled in production');
        } else {
          this.addCheck('HSTS Configuration', 'fail', 'HSTS not configured for production', true);
        }
      }

      // Validate CSP configuration
      const csp = headers['Content-Security-Policy'];
      if (csp) {
        if (csp.includes("'unsafe-eval'") && !isDevelopment) {
          this.addCheck('CSP Configuration', 'fail', "unsafe-eval detected in production CSP", true);
        } else if (csp.includes("object-src 'none'")) {
          this.addCheck('CSP Configuration', 'pass', 'CSP properly configured with object-src none');
        } else {
          this.addCheck('CSP Configuration', 'warning', 'CSP may need object-src restriction');
        }
      }
    } catch (error) {
      this.addCheck('Security Headers', 'fail', `Security headers validation failed: ${error}`, true);
    }
  }

  /**
   * Validate rate limiting configuration
   */
  private validateRateLimiting(): void {
    console.log('🔍 Validating rate limiting configuration...');

    try {
      const limiterTypes = ['general', 'auth', 'webhook', 'compute'] as const;

      for (const type of limiterTypes) {
        const limiter = rateLimiters[type];
        if (limiter) {
          // Check that auth endpoints have stricter limits
          if (type === 'auth' && limiter.config.maxRequests <= 10) {
            this.addCheck(`Rate Limit: ${type}`, 'pass', `Secure limit: ${limiter.config.maxRequests} requests per window`);
          } else if (type === 'auth') {
            this.addCheck(`Rate Limit: ${type}`, 'warning', `Auth rate limit may be too permissive: ${limiter.config.maxRequests}`);
          } else {
            this.addCheck(`Rate Limit: ${type}`, 'pass', `Configured: ${limiter.config.maxRequests} requests per ${limiter.config.windowMs}ms`);
          }
        } else {
          this.addCheck(`Rate Limit: ${type}`, 'fail', 'Rate limiter not configured', true);
        }
      }
    } catch (error) {
      this.addCheck('Rate Limiting', 'fail', `Rate limiting validation failed: ${error}`, true);
    }
  }

  /**
   * Validate input validation schemas
   */
  private validateInputSchemas(): void {
    console.log('🔍 Validating input validation schemas...');

    try {
      // Test critical schemas with sample data
      const testData = {
        email: 'test@example.com',
        text: 'Sample text input',
        apiKey: 'valid_api_key_123',
        sessionId: 'session_abc123'
      };

      for (const [schemaName, schema] of Object.entries(ValidationSchemas)) {
        if (typeof schema.safeParse === 'function') {
          // Test with valid data if available
          const testValue = testData[schemaName as keyof typeof testData];
          if (testValue) {
            const result = schema.safeParse(testValue);
            if (result.success) {
              this.addCheck(`Input Schema: ${schemaName}`, 'pass', 'Schema validation working correctly');
            } else {
              this.addCheck(`Input Schema: ${schemaName}`, 'fail', `Schema validation failed: ${result.error.message}`, true);
            }
          } else {
            this.addCheck(`Input Schema: ${schemaName}`, 'pass', 'Schema defined and available');
          }
        }
      }
    } catch (error) {
      this.addCheck('Input Validation', 'fail', `Input validation schemas check failed: ${error}`, true);
    }
  }

  /**
   * Validate Next.js configuration security
   */
  private validateNextConfig(): void {
    console.log('🔍 Validating Next.js configuration...');

    try {
      const configPath = path.join(process.cwd(), 'next.config.js');

      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');

        // Check for security headers
        if (configContent.includes('X-Frame-Options')) {
          this.addCheck('Next.js Security Headers', 'pass', 'Security headers configured in Next.js config');
        } else {
          this.addCheck('Next.js Security Headers', 'warning', 'Security headers may not be configured in Next.js');
        }

        // Check for dangerous CORS configuration
        if (configContent.includes("'*'") && configContent.includes('Access-Control-Allow-Origin')) {
          this.addCheck('CORS Configuration', 'fail', 'Dangerous wildcard CORS detected', true);
        } else if (configContent.includes('Access-Control-Allow-Origin')) {
          this.addCheck('CORS Configuration', 'pass', 'CORS configuration appears secure');
        }

        // Check for CSP configuration
        if (configContent.includes('Content-Security-Policy')) {
          this.addCheck('CSP in Next.js', 'pass', 'Content Security Policy configured');
        } else {
          this.addCheck('CSP in Next.js', 'warning', 'CSP may not be configured in Next.js config');
        }
      } else {
        this.addCheck('Next.js Configuration', 'warning', 'next.config.js not found');
      }
    } catch (error) {
      this.addCheck('Next.js Configuration', 'fail', `Next.js config validation failed: ${error}`);
    }
  }

  /**
   * Validate JWT and authentication security
   */
  private validateAuthentication(): void {
    console.log('🔍 Validating authentication security...');

    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        this.addCheck('JWT Secret', 'fail', 'JWT_SECRET environment variable not set', true);
        return;
      }

      if (jwtSecret.length < 32) {
        this.addCheck('JWT Secret Length', 'fail', 'JWT_SECRET too short (minimum 32 characters)', true);
      } else {
        this.addCheck('JWT Secret Length', 'pass', 'JWT_SECRET meets minimum length requirement');
      }

      // Check for weak secrets
      const weakSecrets = ['secret', 'password', 'development', 'test', '12345', 'fallback'];
      const isWeak = weakSecrets.some(weak => jwtSecret.toLowerCase().includes(weak));

      if (isWeak) {
        if (process.env.NODE_ENV === 'production') {
          this.addCheck('JWT Secret Strength', 'fail', 'Weak JWT secret detected in production', true);
        } else {
          this.addCheck('JWT Secret Strength', 'warning', 'Weak JWT secret detected (acceptable in development)');
        }
      } else {
        this.addCheck('JWT Secret Strength', 'pass', 'JWT secret appears strong');
      }

      // Check webhook auth keys
      const webhookAuth = process.env.OPAL_WEBHOOK_AUTH_KEY;
      if (webhookAuth && webhookAuth.length >= 32) {
        this.addCheck('Webhook Authentication', 'pass', 'Webhook auth key properly configured');
      } else {
        this.addCheck('Webhook Authentication', 'fail', 'Webhook auth key missing or too short', true);
      }
    } catch (error) {
      this.addCheck('Authentication', 'fail', `Authentication validation failed: ${error}`, true);
    }
  }

  /**
   * Check for common security files and configurations
   */
  private validateSecurityFiles(): void {
    console.log('🔍 Validating security file configuration...');

    const securityFiles = [
      { path: '.env.local.example', required: true, description: 'Environment variable template' },
      { path: '.gitignore', required: true, description: 'Git ignore configuration' },
      { path: 'src/lib/security/rate-limiting.ts', required: true, description: 'Rate limiting implementation' },
      { path: 'src/lib/validation/input-sanitizer.ts', required: true, description: 'Input validation system' },
      { path: 'src/lib/config/env-config.ts', required: true, description: 'Environment configuration' }
    ];

    for (const file of securityFiles) {
      const filePath = path.join(process.cwd(), file.path);
      if (fs.existsSync(filePath)) {
        this.addCheck(`Security File: ${file.path}`, 'pass', `${file.description} exists`);

        // Check .gitignore for sensitive files
        if (file.path === '.gitignore') {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.includes('.env*') || (content.includes('.env.local') && content.includes('.env.production'))) {
            this.addCheck('Git Ignore Security', 'pass', 'Environment files properly ignored');
          } else {
            this.addCheck('Git Ignore Security', 'fail', 'Environment files may not be properly ignored', true);
          }
        }
      } else if (file.required) {
        this.addCheck(`Security File: ${file.path}`, 'fail', `Required security file missing: ${file.description}`, true);
      } else {
        this.addCheck(`Security File: ${file.path}`, 'warning', `Optional security file missing: ${file.description}`);
      }
    }
  }

  /**
   * Run all security validations
   */
  public async validate(): Promise<boolean> {
    console.log('🛡️ Starting comprehensive security validation...\n');

    // Run all validation checks
    this.validateEnvironment();
    this.validateSecurityHeaders();
    this.validateRateLimiting();
    this.validateInputSchemas();
    this.validateNextConfig();
    this.validateAuthentication();
    this.validateSecurityFiles();

    // Print results
    this.printResults();

    // Return success status
    return this.errors === 0;
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n🛡️ Security Validation Results:');
    console.log('=====================================\n');

    // Summary
    const totalChecks = this.checks.length;
    const passed = this.checks.filter(c => c.status === 'pass').length;
    console.log(`📊 Summary: ${passed}/${totalChecks} checks passed`);
    console.log(`❌ Errors: ${this.errors}`);
    console.log(`⚠️ Warnings: ${this.warnings}\n`);

    // Group checks by status
    const criticalFailures = this.checks.filter(c => c.status === 'fail' && c.critical);
    const failures = this.checks.filter(c => c.status === 'fail' && !c.critical);
    const warnings = this.checks.filter(c => c.status === 'warning');
    const passes = this.checks.filter(c => c.status === 'pass');

    // Print critical failures first
    if (criticalFailures.length > 0) {
      console.log('🚨 Critical Security Issues:');
      criticalFailures.forEach(check => {
        console.log(`  ❌ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print other failures
    if (failures.length > 0) {
      console.log('❌ Security Issues:');
      failures.forEach(check => {
        console.log(`  ❌ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log('⚠️ Security Warnings:');
      warnings.forEach(check => {
        console.log(`  ⚠️ ${check.name}: ${check.message}`);
      });
      console.log();
    }

    // Print summary of passed checks
    if (passes.length > 0) {
      console.log(`✅ ${passes.length} security checks passed successfully\n`);
    }

    // Final status
    if (this.errors === 0) {
      console.log('🎉 Security validation PASSED - Ready for deployment!');
    } else {
      console.log('🚫 Security validation FAILED - Fix issues before deployment!');
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
  const validator = new SecurityValidator();

  try {
    const success = await validator.validate();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Security validation script failed:', error);
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error in security validation:', error);
    process.exit(1);
  });
}

export { SecurityValidator };