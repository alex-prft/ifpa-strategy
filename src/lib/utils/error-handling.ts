/**
 * Comprehensive Error Handling and Logging Utility
 * Prevents recurrence of critical issues and provides detailed debugging information
 */

export interface ErrorContext {
  operation: string;
  component?: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  clientName?: string;
  workflowId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetail {
  code: string;
  message: string;
  context: ErrorContext;
  timestamp: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'rate_limiting' | 'database' | 'api' | 'validation' | 'system';
}

export class OSAError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly severity: ErrorDetail['severity'];
  public readonly category: ErrorDetail['category'];
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    severity: ErrorDetail['severity'] = 'medium',
    category: ErrorDetail['category'] = 'system'
  ) {
    super(message);
    this.name = 'OSAError';
    this.code = code;
    this.context = context;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ErrorDetail {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      severity: this.severity,
      category: this.category
    };
  }
}

/**
 * Enhanced error logging with structured data
 */
export function logError(error: Error, context: ErrorContext): void {
  const errorDetail: ErrorDetail = {
    code: error instanceof OSAError ? error.code : 'UNKNOWN_ERROR',
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    severity: error instanceof OSAError ? error.severity : 'medium',
    category: error instanceof OSAError ? error.category : 'system'
  };

  // Console logging with structured format
  console.error(`❌ [${errorDetail.category.toUpperCase()}] ${errorDetail.code}:`, {
    message: errorDetail.message,
    operation: context.operation,
    component: context.component,
    endpoint: context.endpoint,
    severity: errorDetail.severity,
    timestamp: errorDetail.timestamp,
    metadata: context.metadata
  });

  // Additional logging for critical errors
  if (errorDetail.severity === 'critical') {
    console.error('🚨 CRITICAL ERROR DETAILS:', {
      fullError: errorDetail,
      stackTrace: error.stack
    });
  }
}

/**
 * Rate limiting error handling
 */
export function createRateLimitError(context: ErrorContext): OSAError {
  return new OSAError(
    'Daily workflow limit reached (5 per day). Use cached data or contact admin for reset.',
    'RATE_LIMIT_EXCEEDED',
    context,
    'medium',
    'rate_limiting'
  );
}

/**
 * Authentication error handling
 */
export function createAuthError(reason: string, context: ErrorContext): OSAError {
  return new OSAError(
    `Authentication failed: ${reason}`,
    'AUTH_FAILED',
    context,
    'high',
    'authentication'
  );
}

/**
 * Database error handling
 */
export function createDatabaseError(operation: string, originalError: Error, context: ErrorContext): OSAError {
  return new OSAError(
    `Database ${operation} failed: ${originalError.message}`,
    'DATABASE_ERROR',
    context,
    'high',
    'database'
  );
}

/**
 * API error handling
 */
export function createAPIError(endpoint: string, status: number, message: string, context: ErrorContext): OSAError {
  return new OSAError(
    `API call to ${endpoint} failed (${status}): ${message}`,
    'API_ERROR',
    { ...context, endpoint },
    status >= 500 ? 'high' : 'medium',
    'api'
  );
}

/**
 * Validation error handling
 */
export function createValidationError(field: string, reason: string, context: ErrorContext): OSAError {
  return new OSAError(
    `Validation failed for ${field}: ${reason}`,
    'VALIDATION_ERROR',
    context,
    'low',
    'validation'
  );
}

/**
 * Graceful error handling with fallback mechanisms
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), context);

    // Try fallback if available
    if (fallback) {
      try {
        console.log(`🔄 [Recovery] Attempting fallback for ${context.operation}`);
        return await fallback();
      } catch (fallbackError) {
        logError(
          fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          { ...context, operation: `${context.operation}_fallback` }
        );
      }
    }

    // Re-throw original error
    throw error;
  }
}

/**
 * Input validation with detailed error reporting
 */
export function validateWorkflowInput(input: any, context: ErrorContext): void {
  if (!input.client_name || typeof input.client_name !== 'string') {
    throw createValidationError('client_name', 'Must be a non-empty string', context);
  }

  if (!input.business_objectives) {
    throw createValidationError('business_objectives', 'Business objectives are required', context);
  }

  if (!input.recipients || !Array.isArray(input.recipients) || input.recipients.length === 0) {
    throw createValidationError('recipients', 'At least one email recipient is required', context);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of input.recipients) {
    if (!emailRegex.test(email)) {
      throw createValidationError('recipients', `Invalid email format: ${email}`, context);
    }
  }
}

/**
 * Performance monitoring with error correlation
 */
export function monitorPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  const startTime = Date.now();

  return fn().then(
    (result) => {
      const duration = Date.now() - startTime;
      console.log(`⚡ [Performance] ${operation} completed in ${duration}ms`, {
        operation,
        duration,
        context: context.component || context.endpoint,
        success: true
      });
      return result;
    },
    (error) => {
      const duration = Date.now() - startTime;
      console.error(`⚡ [Performance] ${operation} failed after ${duration}ms`, {
        operation,
        duration,
        error: error.message,
        context: context.component || context.endpoint
      });
      throw error;
    }
  );
}

/**
 * Circuit breaker integration with error tracking
 */
export function shouldTriggerCircuitBreaker(error: Error): boolean {
  if (error instanceof OSAError) {
    // Trigger circuit breaker for high-severity errors
    return error.severity === 'high' || error.severity === 'critical';
  }

  // Default behavior for unknown errors
  return false;
}

/**
 * Retry strategy based on error type
 */
export function getRetryStrategy(error: Error): { shouldRetry: boolean; delayMs: number; maxAttempts: number } {
  if (error instanceof OSAError) {
    switch (error.category) {
      case 'rate_limiting':
        return { shouldRetry: false, delayMs: 0, maxAttempts: 1 };
      case 'authentication':
        return { shouldRetry: false, delayMs: 0, maxAttempts: 1 };
      case 'database':
        return { shouldRetry: true, delayMs: 1000, maxAttempts: 3 };
      case 'api':
        return { shouldRetry: true, delayMs: 2000, maxAttempts: 3 };
      case 'validation':
        return { shouldRetry: false, delayMs: 0, maxAttempts: 1 };
      default:
        return { shouldRetry: true, delayMs: 1000, maxAttempts: 2 };
    }
  }

  // Default retry strategy
  return { shouldRetry: true, delayMs: 1000, maxAttempts: 2 };
}