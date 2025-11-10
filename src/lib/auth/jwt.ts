/**
 * JWT Authentication utilities for OSA API Gateway
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Validate JWT_SECRET is properly configured
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Warn about potentially weak secrets
  const weakSecrets = [
    'fallback-secret-for-development-only-change-in-production',
    'your-jwt-secret-key',
    'secret',
    'password',
    'development'
  ];

  if (weakSecrets.includes(secret.toLowerCase())) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Weak JWT_SECRET detected in production environment');
    }
    console.warn('⚠️  Warning: Using weak JWT_SECRET. Generate a strong secret for production.');
  }

  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJWTSecret();

const JWT_ISSUER = 'osa-api-gateway';
const JWT_AUDIENCE = 'osa-services';

export interface OSAJWTPayload extends JWTPayload {
  sub: string; // user ID
  aud: string; // audience
  iss: string; // issuer
  exp: number; // expiration
  iat: number; // issued at
  role?: 'user' | 'service' | 'admin';
  permissions?: string[];
  service?: string; // for service-to-service auth
}

export async function generateJWT(
  userId: string,
  options: {
    role?: 'user' | 'service' | 'admin';
    permissions?: string[];
    service?: string;
    expiresIn?: string; // e.g., '1h', '7d'
  } = {}
): Promise<string> {
  const {
    role = 'user',
    permissions = [],
    service,
    expiresIn = '24h'
  } = options;

  const now = Math.floor(Date.now() / 1000);
  const expiration = now + parseExpiration(expiresIn);

  const payload: OSAJWTPayload = {
    sub: userId,
    aud: JWT_AUDIENCE,
    iss: JWT_ISSUER,
    exp: expiration,
    iat: now,
    role,
    permissions
  };

  if (service) {
    payload.service = service;
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiration)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(userId)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<OSAJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    return payload as OSAJWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function generateServiceToken(serviceName: string): Promise<string> {
  return generateJWT(`service:${serviceName}`, {
    role: 'service',
    service: serviceName,
    permissions: ['service:communicate'],
    expiresIn: '1h'
  });
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function hasPermission(payload: OSAJWTPayload, requiredPermission: string): boolean {
  if (!payload.permissions) return false;
  return payload.permissions.includes(requiredPermission) || payload.permissions.includes('*');
}

export function isServiceToken(payload: OSAJWTPayload): boolean {
  return payload.role === 'service' && !!payload.service;
}

function parseExpiration(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    case 'w': return value * 7 * 24 * 60 * 60;
    default: return 24 * 60 * 60; // Default to 24 hours
  }
}

// Middleware helper for Next.js API routes
export function withJWTAuth(
  handler: (req: any, res: any, payload: OSAJWTPayload) => Promise<any>,
  options: {
    requiredRole?: 'user' | 'service' | 'admin';
    requiredPermissions?: string[];
  } = {}
) {
  return async (req: any, res: any) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const payload = await verifyJWT(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check role requirement
      if (options.requiredRole && payload.role !== options.requiredRole) {
        return res.status(403).json({ error: `Required role: ${options.requiredRole}` });
      }

      // Check permission requirements
      if (options.requiredPermissions) {
        const hasAllPermissions = options.requiredPermissions.every(permission =>
          hasPermission(payload, permission)
        );
        if (!hasAllPermissions) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      return handler(req, res, payload);
    } catch (error) {
      console.error('JWT authentication error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}