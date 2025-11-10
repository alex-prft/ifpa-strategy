/**
 * Rate Limiting Middleware for API Protection
 * Implements multiple rate limiting strategies to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanup();
  }

  private cleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default: use IP address and user agent for fingerprinting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    return `${ip}:${userAgent.slice(0, 50)}`;
  }

  public async isAllowed(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const key = this.getKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create rate limit entry
    let entry = this.store[key];

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.store[key] = entry;
    }

    // Increment counter
    entry.count++;

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      totalHits: entry.count
    };
  }
}

// Predefined rate limiters for different endpoint types
export const rateLimiters = {
  // General API endpoints
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),

  // Authentication endpoints (more restrictive)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
      return `auth:${ip}`;
    }
  }),

  // Webhook endpoints
  webhook: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
      return `webhook:${ip}`;
    }
  }),

  // Heavy computation endpoints
  compute: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
      return `compute:${ip}`;
    }
  })
};

/**
 * Rate limiting middleware factory
 */
export function withRateLimit(
  limiterType: keyof typeof rateLimiters = 'general',
  options: {
    onLimitReached?: (req: NextRequest) => NextResponse;
    skipIf?: (req: NextRequest) => boolean;
  } = {}
) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    // Skip rate limiting if condition is met
    if (options.skipIf && options.skipIf(req)) {
      return handler(req);
    }

    const limiter = rateLimiters[limiterType];
    const result = await limiter.isAllowed(req);

    // Set rate limit headers
    const response = result.allowed
      ? await handler(req)
      : options.onLimitReached
        ? options.onLimitReached(req)
        : NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            },
            { status: 429 }
          );

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimiters[limiterType].config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
    }

    return response;
  };
}

/**
 * IP-based blocking for suspicious activity
 */
class IPBlocklist {
  private blockedIPs: Map<string, { until: number; reason: string }> = new Map();

  public blockIP(ip: string, durationMs: number = 24 * 60 * 60 * 1000, reason: string = 'Suspicious activity'): void {
    this.blockedIPs.set(ip, {
      until: Date.now() + durationMs,
      reason
    });
  }

  public isBlocked(ip: string): { blocked: boolean; reason?: string; until?: number } {
    const entry = this.blockedIPs.get(ip);
    if (!entry) return { blocked: false };

    if (entry.until < Date.now()) {
      this.blockedIPs.delete(ip);
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: entry.reason,
      until: entry.until
    };
  }

  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }
}

export const ipBlocklist = new IPBlocklist();

/**
 * Middleware for IP blocking
 */
export function withIPBlocklist() {
  return async function ipBlockMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
    const blockStatus = ipBlocklist.isBlocked(ip);

    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          error: 'IP address blocked',
          reason: blockStatus.reason,
          unblockTime: blockStatus.until
        },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * Advanced threat detection
 */
export class ThreatDetector {
  private suspiciousActivity: Map<string, number[]> = new Map();

  public recordRequest(ip: string, endpoint: string, statusCode: number): void {
    const key = `${ip}:${endpoint}`;
    const timestamps = this.suspiciousActivity.get(key) || [];

    // Add current timestamp
    timestamps.push(Date.now());

    // Keep only last 100 requests
    if (timestamps.length > 100) {
      timestamps.shift();
    }

    this.suspiciousActivity.set(key, timestamps);

    // Check for suspicious patterns
    this.detectThreats(ip, timestamps, statusCode);
  }

  private detectThreats(ip: string, timestamps: number[], statusCode: number): void {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;

    // Pattern 1: Too many requests in short time
    const recentRequests = timestamps.filter(t => now - t < oneMinute);
    if (recentRequests.length > 30) {
      ipBlocklist.blockIP(ip, 60 * 60 * 1000, 'Excessive requests detected');
      console.warn(`🚫 IP ${ip} blocked for excessive requests: ${recentRequests.length}/min`);
    }

    // Pattern 2: High error rate
    const errorRequests = timestamps.filter(t => now - t < fiveMinutes);
    if (errorRequests.length > 20 && statusCode >= 400) {
      ipBlocklist.blockIP(ip, 30 * 60 * 1000, 'High error rate detected');
      console.warn(`🚫 IP ${ip} blocked for high error rate`);
    }
  }
}

export const threatDetector = new ThreatDetector();

/**
 * Comprehensive security middleware that combines rate limiting, IP blocking, and threat detection
 */
export function withSecurityMiddleware(
  options: {
    rateLimitType?: keyof typeof rateLimiters;
    enableThreatDetection?: boolean;
    enableIPBlocking?: boolean;
    skipIf?: (req: NextRequest) => boolean;
  } = {}
) {
  const {
    rateLimitType = 'general',
    enableThreatDetection = true,
    enableIPBlocking = true,
    skipIf
  } = options;

  return async function securityMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    // Skip security if condition is met (e.g., for internal services)
    if (skipIf && skipIf(req)) {
      return handler(req);
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';

    // 1. Check IP blocklist
    if (enableIPBlocking) {
      const ipBlockMiddleware = withIPBlocklist();
      const blockResult = await ipBlockMiddleware(req, (req) => Promise.resolve(NextResponse.next()));
      if (blockResult.status === 403) {
        return blockResult;
      }
    }

    // 2. Apply rate limiting
    const rateLimitMiddleware = withRateLimit(rateLimitType, { skipIf });
    let response: NextResponse;

    try {
      response = await rateLimitMiddleware(req, handler);
    } catch (error) {
      console.error('Security middleware error:', error);
      response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // 3. Record request for threat detection
    if (enableThreatDetection) {
      threatDetector.recordRequest(ip, req.nextUrl.pathname, response.status);
    }

    return response;
  };
}