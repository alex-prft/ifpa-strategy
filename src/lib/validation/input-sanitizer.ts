/**
 * Comprehensive Input Validation and Sanitization
 * Protects against XSS, SQL injection, and other input-based attacks
 */

import { z } from 'zod';

/**
 * Input sanitization functions
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') return '';

    // Remove or escape dangerous SQL characters
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .replace(/xp_/gi, '') // Remove extended procedure calls
      .replace(/sp_/gi, '') // Remove stored procedure calls
      .trim();
  }

  /**
   * Sanitize file paths to prevent directory traversal
   */
  static sanitizeFilePath(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^[.\\/]+/, '') // Remove leading dots and slashes
      .trim();
  }

  /**
   * Sanitize command input to prevent injection
   */
  static sanitizeCommand(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[;&|`$(){}[\]\\]/g, '') // Remove shell metacharacters
      .replace(/\n|\r/g, '') // Remove newlines
      .trim();
  }

  /**
   * General text sanitization
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '');
  }

  /**
   * Sanitize URLs
   */
  static sanitizeURL(input: string): string {
    if (typeof input !== 'string') return '';

    try {
      const url = new URL(input);

      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:'];
      if (!allowedProtocols.includes(url.protocol)) {
        return '';
      }

      return url.toString();
    } catch {
      return '';
    }
  }
}

/**
 * Zod schemas for common input validation
 */

// Base schemas
const emailSchema = z.string()
  .min(1, 'Email is required')
  .max(254, 'Email too long')
  .email('Invalid email format')
  .transform(InputSanitizer.sanitizeEmail);

const urlSchema = z.string()
  .min(1, 'URL is required')
  .max(2000, 'URL too long')
  .url('Invalid URL format')
  .transform(InputSanitizer.sanitizeURL);

const textSchema = z.string()
  .max(10000, 'Text too long')
  .transform((val) => InputSanitizer.sanitizeText(val));

const shortTextSchema = z.string()
  .max(255, 'Text too long')
  .transform((val) => InputSanitizer.sanitizeText(val, 255));

export const ValidationSchemas = {
  // Basic types
  email: emailSchema,
  url: urlSchema,
  text: textSchema,
  shortText: shortTextSchema,

  // API-specific schemas
  apiKey: z.string()
    .min(10, 'API key too short')
    .max(500, 'API key too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid API key format'),

  sessionId: z.string()
    .min(10, 'Session ID too short')
    .max(100, 'Session ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid session ID format'),

  workflowId: z.string()
    .min(1, 'Workflow ID required')
    .max(100, 'Workflow ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid workflow ID format'),

  // OPAL-specific schemas
  opalRequest: z.object({
    client_name: z.string()
      .min(1, 'Client name required')
      .max(100, 'Client name too long')
      .transform(InputSanitizer.sanitizeText),

    workflow_type: z.enum(['priority_platforms', 'full_sync', 'targeted_sync']),

    update_rag: z.boolean().optional(),

    session_id: z.string()
      .optional()
      .transform((val) => val ? InputSanitizer.sanitizeCommand(val) : undefined),

    config: z.object({
      priority_level: z.enum(['high', 'medium', 'low']).optional(),
      timeout_minutes: z.number().min(1).max(60).optional(),
    }).optional(),
  }),

  webhookPayload: z.object({
    event_type: z.string()
      .min(1, 'Event type required')
      .max(50, 'Event type too long')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid event type format'),

    timestamp: z.string()
      .datetime('Invalid timestamp format'),

    data: z.record(z.any()).optional(),

    signature: z.string()
      .optional()
      .transform((val) => val ? InputSanitizer.sanitizeText(val, 500) : undefined),
  }),

  monitoringMetrics: z.object({
    timeframe: z.enum(['1h', '6h', '24h', '7d']).default('1h'),
    agent_id: z.string()
      .optional()
      .transform((val) => val ? InputSanitizer.sanitizeCommand(val) : undefined),
  }),

  // User input schemas
  userFeedback: z.object({
    type: z.enum(['bug', 'feature', 'improvement', 'other']),
    message: z.string()
      .min(10, 'Feedback must be at least 10 characters')
      .max(5000, 'Feedback too long')
      .transform(InputSanitizer.sanitizeHTML),

    email: emailSchema.optional(),

    rating: z.number()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5')
      .optional(),
  }),

  // File upload schemas
  fileUpload: z.object({
    filename: z.string()
      .min(1, 'Filename required')
      .max(255, 'Filename too long')
      .transform(InputSanitizer.sanitizeFilePath),

    mimetype: z.string()
      .min(1, 'MIME type required')
      .max(100, 'MIME type too long')
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/, 'Invalid MIME type'),

    size: z.number()
      .min(1, 'File must not be empty')
      .max(10 * 1024 * 1024, 'File too large (max 10MB)'), // 10MB limit
  }),
};

/**
 * Validation middleware factory
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return async function validateInput(
    input: unknown,
    options: {
      onValidationError?: (errors: z.ZodError) => any;
    } = {}
  ): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
    try {
      const validatedData = await schema.parseAsync(input);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (options.onValidationError) {
          options.onValidationError(error);
        }
        return { success: false, errors: error };
      }
      throw error; // Re-throw non-validation errors
    }
  };
}

/**
 * Content Security Policy helpers
 */
export class CSPHelper {
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static buildCSP(options: {
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    nonce?: string;
    isDevelopment?: boolean;
  } = {}): string {
    const {
      scriptSrc = ["'self'"],
      styleSrc = ["'self'", "'unsafe-inline'"],
      imgSrc = ["'self'", "data:", "blob:"],
      connectSrc = ["'self'"],
      nonce,
      isDevelopment = false
    } = options;

    const directives: string[] = [
      `default-src 'self'`,
      `script-src ${nonce ? `'nonce-${nonce}' ` : ''}${scriptSrc.join(' ')}${isDevelopment ? " 'unsafe-eval'" : ''}`,
      `style-src ${styleSrc.join(' ')}`,
      `img-src ${imgSrc.join(' ')}`,
      `connect-src ${connectSrc.join(' ')}${isDevelopment ? ' ws: wss:' : ''}`,
      `font-src 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ];

    return directives.join('; ');
  }
}

/**
 * Security headers helper
 */
export function getSecurityHeaders(isDevelopment: boolean = false): Record<string, string> {
  return {
    // Prevent XSS attacks
    'X-XSS-Protection': '1; mode=block',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // HTTPS enforcement (only in production)
    ...(isDevelopment ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),

    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Content Security Policy
    'Content-Security-Policy': CSPHelper.buildCSP({ isDevelopment }),
  };
}

/**
 * Request validation utilities
 */
export class RequestValidator {
  /**
   * Validate request size
   */
  static validateRequestSize(contentLength: number | null, maxSize: number = 1024 * 1024): boolean {
    if (!contentLength) return true; // Let the server handle missing content-length
    return contentLength <= maxSize;
  }

  /**
   * Validate content type
   */
  static validateContentType(contentType: string | null, allowedTypes: string[]): boolean {
    if (!contentType) return false;

    const normalizedType = contentType.split(';')[0].trim().toLowerCase();
    return allowedTypes.some(type =>
      type === normalizedType ||
      (type.endsWith('/*') && normalizedType.startsWith(type.slice(0, -2)))
    );
  }

  /**
   * Validate request method
   */
  static validateMethod(method: string, allowedMethods: string[]): boolean {
    return allowedMethods.includes(method.toUpperCase());
  }

  /**
   * Validate request headers
   */
  static validateHeaders(headers: Headers, requiredHeaders: string[] = []): { valid: boolean; missing: string[] } {
    const missing = requiredHeaders.filter(header => !headers.has(header));
    return {
      valid: missing.length === 0,
      missing
    };
  }
}