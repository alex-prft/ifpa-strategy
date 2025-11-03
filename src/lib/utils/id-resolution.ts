import { UserIdentifier, ResolvedIdentifier } from '../types';

/**
 * ID Priority Resolution according to Cross-System ID Policy
 * Priority: email_hash (primary) → sf_contact_id → opti_user_id → zaius_id
 */
export function resolveIdentifier(ids: UserIdentifier): ResolvedIdentifier | null {
  // Priority order as defined in the specification
  const priorityOrder: (keyof UserIdentifier)[] = [
    'email_hash',
    'sf_contact_id',
    'opti_user_id',
    'zaius_id'
  ];

  for (const idType of priorityOrder) {
    const idValue = ids[idType];
    if (idValue && idValue.trim() !== '') {
      return {
        id: idValue.trim(),
        id_type: idType,
        confidence: getConfidenceScore(idType)
      };
    }
  }

  return null;
}

/**
 * Get confidence score based on ID type (higher = more reliable for joins)
 */
function getConfidenceScore(idType: keyof UserIdentifier): number {
  const confidenceMap: Record<keyof UserIdentifier, number> = {
    email_hash: 1.0,      // Highest priority - primary identifier
    sf_contact_id: 0.9,   // High confidence - stable Salesforce ID
    opti_user_id: 0.8,    // Good confidence - Optimizely tracking
    zaius_id: 0.7         // Lower confidence - legacy system
  };

  return confidenceMap[idType] || 0.5;
}

/**
 * Validate that email hash meets security requirements
 * - Must be properly hashed (no plaintext emails)
 * - Should be SHA-256 format (64 hex characters)
 */
export function validateEmailHash(emailHash: string): boolean {
  // Check if it looks like a proper hash (64 hex characters for SHA-256)
  const sha256Regex = /^[a-fA-F0-9]{64}$/;

  // Additional check - should not contain @ symbol or common email patterns
  const containsEmailPattern = /@/.test(emailHash) || /\.(com|net|org|edu)/.test(emailHash);

  return sha256Regex.test(emailHash) && !containsEmailPattern;
}

/**
 * Sanitize identifier input to prevent injection attacks
 */
export function sanitizeIdentifier(identifier: string): string {
  // Remove potentially dangerous characters but keep alphanumeric, hyphens, underscores
  return identifier.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Create a standardized identifier object from various input formats
 */
export function createIdentifierObject(input: string | UserIdentifier): UserIdentifier {
  if (typeof input === 'string') {
    // Try to guess the identifier type based on format
    const sanitized = sanitizeIdentifier(input);

    if (validateEmailHash(sanitized)) {
      return { email_hash: sanitized };
    } else if (sanitized.startsWith('003') && sanitized.length === 18) {
      // Salesforce Contact ID pattern
      return { sf_contact_id: sanitized };
    } else if (sanitized.length > 20) {
      // Likely an Optimizely user ID
      return { opti_user_id: sanitized };
    } else {
      // Default to zaius_id for shorter IDs
      return { zaius_id: sanitized };
    }
  }

  // Return the object as-is if already in correct format
  return input;
}

/**
 * Generate a tracking context object for audit logs
 */
export function createTrackingContext(resolvedId: ResolvedIdentifier, operation: string) {
  return {
    timestamp: new Date().toISOString(),
    resolved_id: resolvedId.id,
    id_type: resolvedId.id_type,
    confidence: resolvedId.confidence,
    operation,
    // Note: Never log the actual ID value for privacy
    logged_id_hash: Buffer.from(resolvedId.id).toString('base64').substring(0, 8) + '...'
  };
}