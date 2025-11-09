/**
 * OSA API Gateway - Centralized request routing and middleware
 *
 * Handles authentication, rate limiting, request routing, circuit breakers,
 * and request/response transformation for all OSA microservices
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, generateJWT } from '@/lib/auth/jwt';
import { RateLimiter } from '@/lib/middleware/rate-limiter';
import { CircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { requestLogger, Logger } from '@/lib/logging/logger';
import { publishEvent } from '@/lib/events/event-bus';
import { createEventMetadata, generateEventId, generateCorrelationId } from '@/lib/events/schemas';

// Service registry for routing requests to appropriate handlers
const SERVICE_REGISTRY = {
  'orchestration': {
    baseUrl: '/api/services/orchestration',
    timeout: 120000, // 2 minutes for workflow operations
    circuitBreaker: new CircuitBreaker('orchestration', { threshold: 5, timeout: 60000 })
  },
  'intake': {
    baseUrl: '/api/services/intake',
    timeout: 30000,
    circuitBreaker: new CircuitBreaker('intake', { threshold: 3, timeout: 30000 })
  },
  'recommendations': {
    baseUrl: '/api/services/recommendations',
    timeout: 60000,
    circuitBreaker: new CircuitBreaker('recommendations', { threshold: 5, timeout: 120000 })
  },
  'knowledge': {
    baseUrl: '/api/services/knowledge',
    timeout: 30000,
    circuitBreaker: new CircuitBreaker('knowledge', { threshold: 5, timeout: 60000 })
  },
  'preferences': {
    baseUrl: '/api/services/preferences',
    timeout: 15000,
    circuitBreaker: new CircuitBreaker('preferences', { threshold: 3, timeout: 30000 })
  },
  'analytics': {
    baseUrl: '/api/services/analytics',
    timeout: 45000,
    circuitBreaker: new CircuitBreaker('analytics', { threshold: 5, timeout: 90000 })
  },
  'ux-design': {
    baseUrl: '/api/services/ux-design',
    timeout: 20000, // 20 seconds for UI components and visualizations
    circuitBreaker: new CircuitBreaker('ux-design', { threshold: 3, timeout: 30000 })
  }
} as const;

// Rate limiting configuration
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // per window
  keyGenerator: (req: NextRequest) => {
    // Use API key or IP address for rate limiting
    const apiKey = req.headers.get('x-api-key');
    return apiKey || req.ip || 'anonymous';
  }
});

const logger = new Logger('api-gateway');

// Gateway request context
interface GatewayContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  service: string;
  startTime: number;
  authenticated: boolean;
}

export async function GET(request: NextRequest) {
  return handleGatewayRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleGatewayRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleGatewayRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleGatewayRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return handleGatewayRequest(request, 'PATCH');
}

async function handleGatewayRequest(request: NextRequest, method: string): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateEventId();
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();

  // Extract service from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const serviceIndex = pathParts.indexOf('gateway') + 1;
  const serviceName = pathParts[serviceIndex];

  if (!serviceName || !(serviceName in SERVICE_REGISTRY)) {
    return NextResponse.json(
      { error: 'Service not found', available_services: Object.keys(SERVICE_REGISTRY) },
      { status: 404 }
    );
  }

  const context: GatewayContext = {
    requestId,
    correlationId,
    service: serviceName,
    startTime,
    authenticated: false
  };

  try {
    logger.info('Gateway request started', {
      requestId,
      correlationId,
      method,
      service: serviceName,
      path: url.pathname,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip
    });

    // 1. Rate Limiting
    const rateLimitResult = await rateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      await logGatewayEvent(context, 'rate_limited', { limit: rateLimitResult.limit });
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          resetTime: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // 2. Authentication
    const authResult = await authenticateRequest(request);
    context.authenticated = authResult.authenticated;
    context.userId = authResult.userId;

    if (!authResult.authenticated && requiresAuthentication(serviceName, url.pathname)) {
      await logGatewayEvent(context, 'authentication_failed', { reason: authResult.error });
      return NextResponse.json(
        { error: 'Authentication required', details: authResult.error },
        { status: 401 }
      );
    }

    // 3. Circuit Breaker Check
    const service = SERVICE_REGISTRY[serviceName as keyof typeof SERVICE_REGISTRY];
    const circuitBreakerState = service.circuitBreaker.getState();

    if (circuitBreakerState === 'open') {
      await logGatewayEvent(context, 'circuit_breaker_open', { service: serviceName });
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          service: serviceName,
          message: 'Circuit breaker is open due to repeated failures'
        },
        { status: 503 }
      );
    }

    // 4. Request Transformation and Routing
    const transformedRequest = await transformRequest(request, context);
    const targetUrl = buildTargetUrl(service.baseUrl, url.pathname, url.search);

    // 5. Forward Request to Service
    const response = await forwardRequest(transformedRequest, targetUrl, service, context);

    // 6. Response Transformation
    const transformedResponse = await transformResponse(response, context);

    // 7. Success Logging and Metrics
    await logGatewayEvent(context, 'request_completed', {
      statusCode: response.status,
      responseTime: Date.now() - startTime
    });

    return transformedResponse;

  } catch (error) {
    // Error handling and circuit breaker triggering
    const service = SERVICE_REGISTRY[serviceName as keyof typeof SERVICE_REGISTRY];
    service.circuitBreaker.recordFailure();

    logger.error('Gateway request failed', {
      requestId,
      correlationId,
      service: serviceName,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime
    });

    await logGatewayEvent(context, 'request_failed', {
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime
    });

    return NextResponse.json(
      {
        error: 'Internal gateway error',
        requestId,
        message: 'The request could not be processed'
      },
      { status: 500 }
    );
  }
}

async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Check for API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      // In production, validate against a proper API key store
      if (apiKey === process.env.OSA_API_KEY || apiKey === process.env.NEXT_PUBLIC_API_SECRET_KEY) {
        return { authenticated: true, userId: 'api-user' };
      }
    }

    // Check for JWT token authentication
    const authorization = request.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.substring(7);
      const decoded = await verifyJWT(token);
      if (decoded) {
        return { authenticated: true, userId: decoded.sub };
      }
    }

    // Check for session-based authentication (for dashboard requests)
    const sessionToken = request.cookies.get('osa-session')?.value;
    if (sessionToken) {
      // Validate session token
      const decoded = await verifyJWT(sessionToken);
      if (decoded) {
        return { authenticated: true, userId: decoded.sub };
      }
    }

    return { authenticated: false, error: 'No valid authentication provided' };
  } catch (error) {
    return {
      authenticated: false,
      error: `Authentication error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function requiresAuthentication(service: string, path: string): boolean {
  // Health checks and public endpoints don't require authentication
  const publicPaths = ['/health', '/status', '/metrics', '/docs'];
  if (publicPaths.some(p => path.includes(p))) {
    return false;
  }

  // All other service endpoints require authentication
  return true;
}

async function transformRequest(request: NextRequest, context: GatewayContext): Promise<NextRequest> {
  // Clone the request and add gateway headers
  const headers = new Headers(request.headers);

  // Add tracing headers
  headers.set('x-request-id', context.requestId);
  headers.set('x-correlation-id', context.correlationId);
  headers.set('x-gateway-timestamp', Date.now().toString());

  if (context.userId) {
    headers.set('x-user-id', context.userId);
  }

  // Add service context
  headers.set('x-service-target', context.service);

  // Create new request with transformed headers
  return new NextRequest(request.url, {
    method: request.method,
    headers,
    body: request.body
  });
}

function buildTargetUrl(baseUrl: string, originalPath: string, search: string): string {
  // Extract the service-specific path
  const pathParts = originalPath.split('/');
  const gatewayIndex = pathParts.indexOf('gateway');
  const servicePath = pathParts.slice(gatewayIndex + 2).join('/'); // Skip 'gateway' and service name

  return `${baseUrl}/${servicePath}${search}`;
}

async function forwardRequest(
  request: NextRequest,
  targetUrl: string,
  service: typeof SERVICE_REGISTRY[keyof typeof SERVICE_REGISTRY],
  context: GatewayContext
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), service.timeout);

  try {
    // Build the full internal URL
    const baseUrl = request.nextUrl.origin;
    const fullTargetUrl = `${baseUrl}${targetUrl}`;

    logger.debug('Forwarding request', {
      requestId: context.requestId,
      targetUrl: fullTargetUrl,
      service: context.service
    });

    const response = await fetch(fullTargetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Record success for circuit breaker
    service.circuitBreaker.recordSuccess();

    return response;

  } catch (error) {
    clearTimeout(timeoutId);

    // Record failure for circuit breaker
    service.circuitBreaker.recordFailure();

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Service timeout after ${service.timeout}ms`);
    }

    throw error;
  }
}

async function transformResponse(response: Response, context: GatewayContext): Promise<NextResponse> {
  try {
    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    let responseBody;

    try {
      responseBody = await response.json();
    } catch {
      // If not JSON, return as text
      responseBody = await response.text();
    }

    // Add gateway headers to response
    const headers = new Headers(response.headers);
    headers.set('x-gateway-request-id', context.requestId);
    headers.set('x-gateway-correlation-id', context.correlationId);
    headers.set('x-gateway-service', context.service);
    headers.set('x-gateway-response-time', (Date.now() - context.startTime).toString());

    // Add CORS headers if needed
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-correlation-id');

    return NextResponse.json(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

  } catch (error) {
    logger.error('Response transformation failed', {
      requestId: context.requestId,
      service: context.service,
      error: error instanceof Error ? error.message : String(error)
    });

    // Return the original response if transformation fails
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
}

async function logGatewayEvent(
  context: GatewayContext,
  eventType: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await publishEvent({
      event_type: `gateway.${eventType}@1`,
      event_id: generateEventId(),
      correlation_id: context.correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      service_name: context.service,
      request_id: context.requestId,
      user_id: context.userId,
      response_time_ms: Date.now() - context.startTime,
      details,
      metadata: createEventMetadata(
        context.correlationId,
        context.userId,
        'api-gateway'
      )
    } as any);
  } catch (error) {
    logger.error('Failed to publish gateway event', {
      requestId: context.requestId,
      eventType,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Health check endpoint for the gateway itself
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-correlation-id',
      'Access-Control-Max-Age': '86400'
    }
  });
}