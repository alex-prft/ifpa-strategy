import { NextRequest } from 'next/server';
import { getAPISecretKey } from './config';

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  source?: string;
}

/**
 * Validate Bearer token for tool endpoints
 * Supports both fixed API secret and future OAuth integration
 */
export function validateBearerToken(request: NextRequest): AuthValidationResult {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return {
        isValid: false,
        error: 'Missing Authorization header'
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Invalid Authorization header format. Expected: Bearer <token>'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        isValid: false,
        error: 'Missing bearer token'
      };
    }

    // For now, validate against fixed API secret key
    // In production, this could be extended to validate JWT tokens or OAuth
    const apiSecretKey = getAPISecretKey();

    if (token !== apiSecretKey) {
      return {
        isValid: false,
        error: 'Invalid bearer token'
      };
    }

    return {
      isValid: true,
      source: 'api_secret'
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Authentication validation failed'
    };
  }
}

/**
 * Middleware function for Next.js API routes
 * Usage: const authResult = requireAuthentication(request);
 */
export function requireAuthentication(request: NextRequest): AuthValidationResult {
  return validateBearerToken(request);
}

/**
 * Generate audit log entry for authentication attempts
 */
export function createAuthAuditLog(
  request: NextRequest,
  result: AuthValidationResult,
  endpoint: string
) {
  const clientIP = request.ip ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return {
    timestamp: new Date().toISOString(),
    endpoint,
    client_ip: clientIP,
    user_agent: request.headers.get('user-agent') || 'unknown',
    auth_result: result.isValid ? 'success' : 'failure',
    auth_error: result.error || null,
    auth_source: result.source || null
  };
}

/**
 * Create standard error response for authentication failures
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return {
    success: false,
    error: error,
    timestamp: new Date().toISOString()
  };
}