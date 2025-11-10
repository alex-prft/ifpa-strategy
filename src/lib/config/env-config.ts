/**
 * Environment Configuration Management
 * Validates and provides type-safe access to environment variables
 */

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  poolMin: number;
  poolMax: number;
  timeoutSeconds: number;
}

export interface OPALConfig {
  webhookAuthKey: string;
  webhookHmacSecret?: string;
  allowedIPs?: string[];
  apiUrl?: string;
  apiToken?: string;
  workflowId?: string;
}

export interface OptimizelyConfig {
  odp: {
    apiKey: string;
    projectId: string;
    baseUrl: string;
  };
  experimentation: {
    apiKey: string;
    projectId: string;
    baseUrl: string;
  };
  contentRecs: {
    apiKey: string;
    accountId: string;
    baseUrl: string;
  };
  cmp: {
    apiKey: string;
    workspaceId: string;
    baseUrl: string;
  };
}

export interface AppConfig {
  nodeEnv: string;
  appUrl: string;
  baseUrl: string;
  apiSecretKey: string;
  logLevel: string;
  enableRequestLogging: boolean;
}

export interface EnvironmentConfig {
  app: AppConfig;
  database: DatabaseConfig;
  opal: OPALConfig;
  optimizely: OptimizelyConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'OPAL_WEBHOOK_AUTH_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'API_SECRET_KEY',
  'JWT_SECRET'
] as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = [
  'OPAL_WEBHOOK_HMAC_SECRET',
  'OPAL_ALLOWED_IPS',
  'OPAL_API_URL',
  'OPAL_API_TOKEN',
  'OPAL_WORKFLOW_ID',
  'ODP_API_KEY',
  'EXPERIMENTATION_API_KEY',
  'CONTENT_RECS_API_KEY',
  'CMP_API_KEY',
  'DB_POOL_MIN',
  'DB_POOL_MAX',
  'DB_TIMEOUT_SECONDS',
  'LOG_LEVEL',
  'ENABLE_REQUEST_LOGGING'
] as const;

/**
 * Validates that all required environment variables are present and properly formatted
 */
export function validateEnvironmentConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missingRequired.push(envVar);
      errors.push(`Required environment variable ${envVar} is missing or empty`);
    }
  }

  // Check optional variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missingOptional.push(envVar);
    }
  }

  // Validate specific variable formats and requirements
  validateSpecificVariables(errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingOptional
  };
}

/**
 * Validates specific environment variables for format and security
 */
function validateSpecificVariables(errors: string[], warnings: string[]): void {
  // Validate webhook auth key
  const webhookAuthKey = process.env.OPAL_WEBHOOK_AUTH_KEY;
  if (webhookAuthKey) {
    if (webhookAuthKey.length < 32) {
      errors.push('OPAL_WEBHOOK_AUTH_KEY must be at least 32 characters for security');
    }
    if (webhookAuthKey === 'generate-64-char-random-token-for-bearer-auth') {
      errors.push('OPAL_WEBHOOK_AUTH_KEY is using example value - generate a real token');
    }
  }

  // Validate HMAC secret
  const hmacSecret = process.env.OPAL_WEBHOOK_HMAC_SECRET;
  if (hmacSecret) {
    if (hmacSecret.length < 32) {
      warnings.push('OPAL_WEBHOOK_HMAC_SECRET should be at least 32 characters for security');
    }
    if (hmacSecret === 'generate-64-char-random-token-for-hmac-verification') {
      errors.push('OPAL_WEBHOOK_HMAC_SECRET is using example value - generate a real token');
    }
  } else {
    warnings.push('OPAL_WEBHOOK_HMAC_SECRET not set - HMAC verification will be unavailable');
  }

  // Validate API secret key
  const apiSecret = process.env.API_SECRET_KEY;
  if (apiSecret) {
    if (apiSecret.length < 16) {
      errors.push('API_SECRET_KEY must be at least 16 characters');
    }
    if (apiSecret === 'your-secret-key-for-tool-authentication') {
      errors.push('API_SECRET_KEY is using example value - set a real secret');
    }
  }

  // Validate JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters for security');
    }
    const weakJwtSecrets = [
      'your-jwt-secret-key-minimum-32-characters-required',
      'fallback-secret-for-development-only-change-in-production',
      'secret',
      'password',
      'development'
    ];
    if (weakJwtSecrets.includes(jwtSecret.toLowerCase())) {
      if (process.env.NODE_ENV === 'production') {
        errors.push('JWT_SECRET is using weak/example value in production - generate a strong secret');
      } else {
        warnings.push('JWT_SECRET is using weak/example value - generate a strong secret for production');
      }
    }
  }

  // Validate URLs
  validateUrls(errors, warnings);

  // Validate numeric values
  validateNumericValues(errors, warnings);

  // Check for development/example values in production
  if (process.env.NODE_ENV === 'production') {
    checkProductionValues(errors, warnings);
  }
}

/**
 * Validates URL format for various endpoints
 */
function validateUrls(errors: string[], warnings: string[]): void {
  const urlVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_BASE_URL',
    'SUPABASE_URL',
    'OPAL_API_URL',
    'ODP_BASE_URL',
    'EXPERIMENTATION_BASE_URL',
    'CONTENT_RECS_BASE_URL',
    'CMP_BASE_URL'
  ];

  for (const urlVar of urlVars) {
    const url = process.env[urlVar];
    if (url) {
      try {
        new URL(url);
      } catch {
        errors.push(`${urlVar} is not a valid URL: ${url}`);
      }

      // Warn about localhost in production
      if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
        warnings.push(`${urlVar} contains localhost in production environment`);
      }
    }
  }
}

/**
 * Validates numeric configuration values
 */
function validateNumericValues(errors: string[], warnings: string[]): void {
  const numericVars = [
    { name: 'DB_POOL_MIN', min: 1, max: 50 },
    { name: 'DB_POOL_MAX', min: 1, max: 100 },
    { name: 'DB_TIMEOUT_SECONDS', min: 5, max: 300 }
  ];

  for (const { name, min, max } of numericVars) {
    const value = process.env[name];
    if (value) {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        errors.push(`${name} must be a valid number: ${value}`);
      } else if (num < min || num > max) {
        warnings.push(`${name} should be between ${min} and ${max}, got ${num}`);
      }
    }
  }

  // Validate pool min < pool max
  const poolMin = parseInt(process.env.DB_POOL_MIN || '2', 10);
  const poolMax = parseInt(process.env.DB_POOL_MAX || '10', 10);
  if (!isNaN(poolMin) && !isNaN(poolMax) && poolMin >= poolMax) {
    errors.push('DB_POOL_MIN must be less than DB_POOL_MAX');
  }
}

/**
 * Checks for development/example values that should not be used in production
 */
function checkProductionValues(errors: string[], warnings: string[]): void {
  const exampleValues = [
    { name: 'ODP_API_KEY', example: 'your-odp-api-key' },
    { name: 'EXPERIMENTATION_API_KEY', example: 'your-experimentation-api-key' },
    { name: 'CONTENT_RECS_API_KEY', example: 'your-content-recs-api-key' },
    { name: 'CMP_API_KEY', example: 'your-cmp-api-key' },
    { name: 'OPAL_API_TOKEN', example: 'your-opal-api-token' }
  ];

  for (const { name, example } of exampleValues) {
    const value = process.env[name];
    if (value === example) {
      errors.push(`${name} is using example value in production - set real API key`);
    }
  }
}

/**
 * Gets validated environment configuration
 * Throws an error if required variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const validation = validateEnvironmentConfig();

  if (!validation.valid) {
    console.error('❌ Environment configuration validation failed:');
    validation.errors.forEach(error => console.error(`  • ${error}`));
    throw new Error('Invalid environment configuration. Check required environment variables.');
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  return {
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      apiSecretKey: process.env.API_SECRET_KEY!,
      logLevel: process.env.LOG_LEVEL || 'info',
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
    },
    database: {
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
      poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
      timeoutSeconds: parseInt(process.env.DB_TIMEOUT_SECONDS || '30', 10)
    },
    opal: {
      webhookAuthKey: process.env.OPAL_WEBHOOK_AUTH_KEY!,
      webhookHmacSecret: process.env.OPAL_WEBHOOK_HMAC_SECRET,
      allowedIPs: process.env.OPAL_ALLOWED_IPS?.split(',').map(ip => ip.trim()),
      apiUrl: process.env.OPAL_API_URL,
      apiToken: process.env.OPAL_API_TOKEN,
      workflowId: process.env.OPAL_WORKFLOW_ID
    },
    optimizely: {
      odp: {
        apiKey: process.env.ODP_API_KEY || '',
        projectId: process.env.ODP_PROJECT_ID || '',
        baseUrl: process.env.ODP_BASE_URL || 'https://function.zaius.com/twilio_segment'
      },
      experimentation: {
        apiKey: process.env.EXPERIMENTATION_API_KEY || '',
        projectId: process.env.EXPERIMENTATION_PROJECT_ID || '',
        baseUrl: process.env.EXPERIMENTATION_BASE_URL || 'https://api.optimizely.com/v2'
      },
      contentRecs: {
        apiKey: process.env.CONTENT_RECS_API_KEY || '',
        accountId: process.env.CONTENT_RECS_ACCOUNT_ID || '',
        baseUrl: process.env.CONTENT_RECS_BASE_URL || 'https://api.idio.co'
      },
      cmp: {
        apiKey: process.env.CMP_API_KEY || '',
        workspaceId: process.env.CMP_WORKSPACE_ID || '',
        baseUrl: process.env.CMP_BASE_URL || 'https://api.optimizely.com/v2'
      }
    }
  };
}

/**
 * Generates secure tokens for development setup
 */
export function generateSecureTokens(): {
  webhookAuthKey: string;
  hmacSecret: string;
  apiSecretKey: string;
} {
  const crypto = require('crypto');

  return {
    webhookAuthKey: crypto.randomBytes(32).toString('hex'),
    hmacSecret: crypto.randomBytes(32).toString('hex'),
    apiSecretKey: crypto.randomBytes(24).toString('hex')
  };
}

/**
 * Prints environment configuration status for debugging
 */
export function printEnvironmentStatus(): void {
  const validation = validateEnvironmentConfig();

  console.log('🔧 Environment Configuration Status:');
  console.log(`  • Valid: ${validation.valid ? '✅' : '❌'}`);
  console.log(`  • Errors: ${validation.errors.length}`);
  console.log(`  • Warnings: ${validation.warnings.length}`);
  console.log(`  • Missing Required: ${validation.missingRequired.length}`);
  console.log(`  • Missing Optional: ${validation.missingOptional.length}`);

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    validation.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  if (validation.missingRequired.length > 0) {
    console.log('\n🚨 Missing Required Variables:');
    validation.missingRequired.forEach(var_ => console.log(`  • ${var_}`));
  }
}