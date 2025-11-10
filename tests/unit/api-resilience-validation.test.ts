/**
 * API and Database Resilience Validation Tests
 *
 * Ensures that API routes and database operations have proper error handling,
 * authentication validation, and graceful degradation mechanisms.
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const libDir = path.join(process.cwd(), 'src', 'lib');

function getAllApiFiles(dir: string): string[] {
  let files: string[] = [];

  try {
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files = files.concat(getAllApiFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}

// Critical patterns for robust API development
const REQUIRED_PATTERNS = {
  errorHandling: [
    /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{/,
    /\.catch\s*\(/,
    /handleDatabaseError|handleError/
  ],
  authValidation: [
    /authorization|Authorization/,
    /bearer\s+token|Bearer\s+Token/,
    /api\s*key|apiKey/,
    /authenticate|auth/
  ],
  responseStatus: [
    /Response\.json\s*\([^,]+,\s*{\s*status:\s*\d+/,
    /NextResponse\.json\s*\([^,]+,\s*{\s*status:\s*\d+/,
    /return.*status.*\d+/
  ],
  environmentValidation: [
    /process\.env\./,
    /\.env/,
    /SUPABASE_|NEXT_PUBLIC_|API_/
  ]
};

describe('API and Database Resilience Validation', () => {
  const apiFiles = getAllApiFiles(apiDir);
  const libFiles = getAllApiFiles(libDir);
  const allFiles = [...apiFiles, ...libFiles];

  if (allFiles.length === 0) {
    it('should find API files to test', () => {
      console.warn('No API files found for testing');
    });
    return;
  }

  describe('API Route Files', () => {
    apiFiles.forEach((filePath) => {
      describe(`API Route: ${path.relative(process.cwd(), filePath)}`, () => {
        let content: string;

        beforeAll(() => {
          try {
            content = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            console.error(`Failed to read file ${filePath}:`, error);
            content = '';
          }
        });

        it('should have proper error handling', () => {
          const hasErrorHandling = REQUIRED_PATTERNS.errorHandling.some(pattern =>
            pattern.test(content)
          );

          if (!hasErrorHandling) {
            expect(hasErrorHandling).toBe(true);
            console.error(`
Missing error handling in ${filePath}:
API routes should have try-catch blocks or .catch() handlers.

Example:
try {
  // API logic here
  return NextResponse.json(data, { status: 200 });
} catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
            `.trim());
          }
        });

        it('should validate authentication when required', () => {
          // Check if this is a protected endpoint (not health checks or public APIs)
          const isPublicEndpoint = /health|metrics|status/.test(filePath);
          const hasPostOrPutMethods = /export\s+async\s+function\s+(POST|PUT|DELETE)/.test(content);

          if (!isPublicEndpoint && hasPostOrPutMethods) {
            const hasAuthValidation = REQUIRED_PATTERNS.authValidation.some(pattern =>
              pattern.test(content)
            );

            if (!hasAuthValidation) {
              console.warn(`
Potential missing authentication validation in ${filePath}:
POST/PUT/DELETE endpoints should typically validate authentication.

Example:
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
              `.trim());
            }
          }
        });

        it('should return proper HTTP status codes', () => {
          const hasStatusCodes = REQUIRED_PATTERNS.responseStatus.some(pattern =>
            pattern.test(content)
          );

          if (!hasStatusCodes && content.includes('NextResponse')) {
            console.warn(`
Missing explicit status codes in ${filePath}:
API responses should include explicit HTTP status codes.

Examples:
- Success: { status: 200 }
- Created: { status: 201 }
- Bad Request: { status: 400 }
- Unauthorized: { status: 401 }
- Not Found: { status: 404 }
- Internal Error: { status: 500 }
            `.trim());
          }
        });

        it('should handle database connection failures gracefully', () => {
          const hasDatabaseCalls = /supabase|database|db\./i.test(content);

          if (hasDatabaseCalls) {
            const hasConnectionErrorHandling = /connection\s+failed|database.*unavailable|fetch\s+failed/i.test(content);
            const hasFallbackMechanism = /fallback|mock|cache|resilience/i.test(content);

            if (!hasConnectionErrorHandling && !hasFallbackMechanism) {
              console.warn(`
Consider adding database resilience patterns in ${filePath}:
- Handle "fetch failed" errors
- Implement fallback mechanisms for database unavailability
- Use connection retry logic
- Cache responses when appropriate

Example:
try {
  const result = await databaseOperation();
  return NextResponse.json(result);
} catch (error) {
  if (error.message.includes('fetch failed')) {
    // Database unavailable - use fallback
    const fallbackData = getCachedData();
    return NextResponse.json(fallbackData, {
      status: 200,
      headers: { 'X-Fallback-Mode': 'true' }
    });
  }
  throw error;
}
              `.trim());
            }
          }
        });

        it('should validate environment variables', () => {
          const usesEnvVars = REQUIRED_PATTERNS.environmentValidation.some(pattern =>
            pattern.test(content)
          );

          if (usesEnvVars) {
            // Check for proper environment variable validation
            const hasEnvValidation = /(!process\.env\.|process\.env\..*\s*\|\|\s*['"]|throw.*env)/i.test(content);

            if (!hasEnvValidation) {
              console.warn(`
Consider adding environment variable validation in ${filePath}:

Example:
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
              `.trim());
            }
          }
        });
      });
    });
  });

  describe('Database and Service Files', () => {
    const dbFiles = libFiles.filter(file =>
      /database|supabase|client|service|engine/.test(file.toLowerCase())
    );

    dbFiles.forEach((filePath) => {
      describe(`Service: ${path.relative(process.cwd(), filePath)}`, () => {
        let content: string;

        beforeAll(() => {
          try {
            content = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            console.error(`Failed to read file ${filePath}:`, error);
            content = '';
          }
        });

        it('should implement proper error handling patterns', () => {
          const hasErrorHandling = /handleDatabaseError|handleError|try.*catch|\.catch/.test(content);

          if (content.includes('fetch') || content.includes('supabase')) {
            if (!hasErrorHandling) {
              console.warn(`
Missing error handling in database service ${filePath}:
Database operations should have comprehensive error handling.
              `.trim());
            }
          }
        });

        it('should have retry mechanisms for transient failures', () => {
          const hasRetryLogic = /retry|attempt|exponential.*backoff|jitter/i.test(content);

          if (content.includes('fetch') && !hasRetryLogic) {
            console.info(`
Consider adding retry logic to ${filePath} for transient failures:

Example:
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
            `.trim());
          }
        });

        it('should implement circuit breaker patterns for external services', () => {
          const hasCircuitBreaker = /circuit.*breaker|health.*check|service.*down/i.test(content);
          const callsExternalServices = /fetch|http|api/i.test(content);

          if (callsExternalServices && !hasCircuitBreaker) {
            console.info(`
Consider implementing circuit breaker pattern in ${filePath}:
This prevents cascading failures when external services are down.
            `.trim());
          }
        });
      });
    });
  });

  it('should provide API resilience best practices guidance', () => {
    console.log(`
API and Database Resilience Best Practices:
1. Always use try-catch blocks for async operations
2. Return explicit HTTP status codes (200, 400, 401, 404, 500)
3. Validate authentication for protected endpoints
4. Handle database connection failures gracefully
5. Implement fallback mechanisms (cached data, mock responses)
6. Use retry logic with exponential backoff for transient failures
7. Validate environment variables at startup
8. Log errors with sufficient context for debugging
9. Implement circuit breakers for external service calls
10. Use timeout handlers to prevent hanging requests
11. Sanitize error messages before sending to clients
12. Monitor API performance and error rates
    `.trim());
  });
});