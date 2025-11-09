/**
 * Rate Limiter for OSA API Gateway
 *
 * Implements sliding window rate limiting with configurable limits per user/service
 */

import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (req: NextRequest) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[]; // Timestamps of requests for sliding window
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Rate limit exceeded',
      ...config
    };

    // Start cleanup process to remove expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.store.get(key);

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        requests: []
      };
      this.store.set(key, entry);
    }

    // Clean up old requests outside the sliding window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    entry.count = entry.requests.length;

    // Update reset time if needed
    if (now >= entry.resetTime) {
      entry.resetTime = now + this.config.windowMs;
    }

    const allowed = entry.count < this.config.maxRequests;

    if (allowed) {
      // Add current request to the sliding window
      entry.requests.push(now);
      entry.count = entry.requests.length;
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  // Record successful request (for skipSuccessfulRequests feature)
  recordSuccess(request: NextRequest): void {
    if (this.config.skipSuccessfulRequests) {
      this.removeLastRequest(request);
    }
  }

  // Record failed request (for skipFailedRequests feature)
  recordFailure(request: NextRequest): void {
    if (this.config.skipFailedRequests) {
      this.removeLastRequest(request);
    }
  }

  private removeLastRequest(request: NextRequest): void {
    const key = this.config.keyGenerator(request);
    const entry = this.store.get(key);

    if (entry && entry.requests.length > 0) {
      entry.requests.pop(); // Remove the last request
      entry.count = entry.requests.length;
    }
  }

  // Clean up expired entries to prevent memory leaks
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, entry] of this.store.entries()) {
      // Clean up old requests
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
      entry.count = entry.requests.length;

      // Remove entries with no recent requests
      if (entry.requests.length === 0 && now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  // Get current statistics
  getStats(): {
    totalKeys: number;
    totalRequests: number;
    memoryUsage: number;
  } {
    let totalRequests = 0;
    for (const entry of this.store.values()) {
      totalRequests += entry.count;
    }

    return {
      totalKeys: this.store.size,
      totalRequests,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  // Reset rate limit for a specific key
  reset(request: NextRequest): void {
    const key = this.config.keyGenerator(request);
    this.store.delete(key);
  }

  // Reset all rate limits
  resetAll(): void {
    this.store.clear();
  }

  // Destroy rate limiter and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Predefined rate limit configurations for different service tiers
export const RATE_LIMIT_TIERS = {
  // Free tier - very limited
  FREE: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => req.ip || 'anonymous'
  },

  // Basic tier - moderate limits
  BASIC: {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
    keyGenerator: (req: NextRequest) => {
      const apiKey = req.headers.get('x-api-key');
      return apiKey || req.ip || 'anonymous';
    }
  },

  // Premium tier - high limits
  PREMIUM: {
    windowMs: 60000, // 1 minute
    maxRequests: 300,
    keyGenerator: (req: NextRequest) => {
      const apiKey = req.headers.get('x-api-key');
      return apiKey || req.ip || 'anonymous';
    }
  },

  // Service-to-service - very high limits
  SERVICE: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000,
    keyGenerator: (req: NextRequest) => {
      const serviceHeader = req.headers.get('x-service-name');
      return serviceHeader || 'unknown-service';
    }
  }
} as const;

// Service-specific rate limiters
export const createServiceRateLimiter = (serviceName: string): RateLimiter => {
  const serviceConfigs: Record<string, RateLimitConfig> = {
    'orchestration': {
      windowMs: 300000, // 5 minutes - longer window for heavy operations
      maxRequests: 10,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    },
    'intake': {
      windowMs: 60000, // 1 minute
      maxRequests: 30,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    },
    'recommendations': {
      windowMs: 60000, // 1 minute
      maxRequests: 50,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    },
    'knowledge': {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // Higher limit for search operations
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    },
    'preferences': {
      windowMs: 60000, // 1 minute
      maxRequests: 20,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    },
    'analytics': {
      windowMs: 60000, // 1 minute
      maxRequests: 40,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.ip || 'anonymous';
      }
    }
  };

  const config = serviceConfigs[serviceName] || RATE_LIMIT_TIERS.BASIC;
  return new RateLimiter(config);
};

// Middleware factory for Next.js API routes
export function withRateLimit(config: RateLimitConfig) {
  const rateLimiter = new RateLimiter(config);

  return function(handler: (req: any, res: any) => Promise<any>) {
    return async function(req: any, res: any) {
      const request = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });

      const result = await rateLimiter.checkLimit(request);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter.toString());
        }

        return res.status(429).json({
          error: config.message || 'Rate limit exceeded',
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        });
      }

      try {
        const response = await handler(req, res);

        // Record successful request if configured
        if (!res.statusCode || res.statusCode < 400) {
          rateLimiter.recordSuccess(request);
        } else {
          rateLimiter.recordFailure(request);
        }

        return response;
      } catch (error) {
        rateLimiter.recordFailure(request);
        throw error;
      }
    };
  };
}

// Global rate limiter instances for different use cases
export const globalRateLimiter = new RateLimiter(RATE_LIMIT_TIERS.BASIC);
export const serviceRateLimiter = new RateLimiter(RATE_LIMIT_TIERS.SERVICE);