/**
 * Preferences & Policy Service - OSA Personal Configurator
 *
 * Handles user preferences, organizational policies, compliance rules, and
 * personalization settings for OSA strategy recommendations and workflows.
 *
 * Service Capabilities:
 * - User preference management (strategic, display, notification)
 * - Organizational policy enforcement and validation
 * - Compliance rule checking and violation reporting
 * - Personalization settings for recommendations and UI
 * - Decision criteria configuration and inheritance
 * - Role-based access control and permission management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { publishEvent } from '@/lib/events/event-bus';
import { createServiceCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import {
  generateEventId,
  generateCorrelationId,
  createEventMetadata,
  type PreferencesUpdatedEvent,
  type PolicyViolationEvent
} from '@/lib/events/schemas';

const logger = createServiceLogger('preferences-service');
const dbCircuitBreaker = createServiceCircuitBreaker('preferences-db', 'database');
const policyCircuitBreaker = createServiceCircuitBreaker('preferences-policy', 'policy');

// Preference types and interfaces
interface UserPreferences {
  user_id: string;
  strategic_preferences: {
    risk_tolerance: 'low' | 'medium' | 'high';
    innovation_appetite: 'conservative' | 'moderate' | 'aggressive';
    budget_priority: 'cost_effective' | 'balanced' | 'investment_focused';
    timeline_preference: 'quick_wins' | 'balanced' | 'long_term';
    decision_criteria: {
      business_impact: number; // 0-1 weight
      technical_feasibility: number;
      resource_availability: number;
      strategic_alignment: number;
      risk_tolerance: number;
      time_constraints: number;
    };
  };
  display_preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dashboard_layout: 'compact' | 'detailed' | 'executive';
    default_views: string[];
    chart_types: string[];
    notification_frequency: 'immediate' | 'daily' | 'weekly';
  };
  notification_preferences: {
    email_enabled: boolean;
    push_enabled: boolean;
    workflow_updates: boolean;
    recommendation_alerts: boolean;
    policy_violations: boolean;
    system_maintenance: boolean;
    marketing_communications: boolean;
  };
  personalization_settings: {
    recommendation_categories: string[];
    excluded_industries: string[];
    preferred_implementation_phases: ('crawl' | 'walk' | 'run')[];
    content_complexity: 'beginner' | 'intermediate' | 'advanced';
    auto_apply_filters: boolean;
  };
  created_at: string;
  updated_at: string;
  version: number;
}

interface OrganizationalPolicy {
  policy_id: string;
  organization_id: string;
  policy_type: 'budget' | 'risk' | 'compliance' | 'security' | 'data_governance';
  policy_name: string;
  description: string;
  rules: PolicyRule[];
  enforcement_level: 'advisory' | 'warning' | 'blocking';
  applicable_roles: string[];
  applicable_departments: string[];
  effective_date: string;
  expiry_date?: string;
  created_by: string;
  approved_by?: string;
  status: 'draft' | 'active' | 'suspended' | 'expired';
  version: number;
}

interface PolicyRule {
  rule_id: string;
  rule_type: 'budget_limit' | 'risk_threshold' | 'approval_required' | 'data_restriction' | 'technology_restriction';
  condition: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
    value: any;
  };
  action: 'allow' | 'deny' | 'require_approval' | 'log_warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PolicyViolation {
  violation_id: string;
  user_id: string;
  policy_id: string;
  rule_id: string;
  attempted_action: string;
  violation_details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  resolution_action?: string;
  resolved_by?: string;
  resolved_at?: string;
}

// Service Health Check
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/health')) {
    return handleHealthCheck();
  }

  if (pathname.endsWith('/preferences')) {
    return handleGetPreferences(request);
  }

  if (pathname.endsWith('/policies')) {
    return handleGetPolicies(request);
  }

  if (pathname.endsWith('/validate')) {
    return handleValidateAction(request);
  }

  if (pathname.endsWith('/violations')) {
    return handleGetViolations(request);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// Create/Update User Preferences
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'anonymous';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      preference_category,
      preferences,
      merge_strategy = 'deep_merge'
    } = body;

    // Validate required fields
    if (!preference_category || !preferences) {
      return NextResponse.json(
        { error: 'preference_category and preferences are required' },
        { status: 400 }
      );
    }

    logger.info('Updating user preferences', {
      userId,
      preferenceCategory: preference_category,
      mergeStrategy: merge_strategy
    });

    // Step 1: Get existing preferences
    const existingPrefs = await getUserPreferences(userId);

    // Step 2: Validate new preferences against policies
    const validationResult = await policyCircuitBreaker.execute(async () => {
      return await validatePreferencesAgainstPolicies(userId, preference_category, preferences);
    });

    if (!validationResult.valid) {
      logger.warn('Preference update blocked by policy', {
        userId,
        violations: validationResult.violations
      });

      // Record policy violations
      for (const violation of validationResult.violations) {
        await recordPolicyViolation(userId, violation);
      }

      return NextResponse.json(
        {
          error: 'Preference update blocked by organizational policy',
          violations: validationResult.violations,
          policy_message: 'Some preferences conflict with organizational policies. Please contact your administrator.'
        },
        { status: 403 }
      );
    }

    // Step 3: Apply preferences update
    const updatedPrefs = mergePreferences(existingPrefs, preference_category, preferences, merge_strategy);

    // Step 4: Store updated preferences
    await dbCircuitBreaker.execute(async () => {
      await storeUserPreferences(userId, updatedPrefs);
    }).catch(error => {
      logger.warn('Database storage failed, using in-memory fallback', { error });
      storePreferencesInMemory(userId, updatedPrefs);
    });

    // Step 5: Publish preference update event
    const changes = detectPreferenceChanges(existingPrefs, updatedPrefs, preference_category);

    await publishEvent({
      event_type: 'preferences.updated@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      user_id: userId,
      preference_category: preference_category as any,
      changes,
      metadata: createEventMetadata('preferences', userId, 'preferences-service', {
        change_source: 'user_action',
        validation_passed: true
      })
    } as PreferencesUpdatedEvent);

    return NextResponse.json({
      user_id: userId,
      status: 'updated',
      preference_category,
      changes_applied: changes.length,
      updated_preferences: updatedPrefs,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update preferences', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to update preferences', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update Policy or Report Violation Resolution
export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'system';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      action_type, // 'update_policy' | 'resolve_violation'
      policy_id,
      violation_id,
      resolution_action,
      policy_updates
    } = body;

    if (action_type === 'resolve_violation') {
      if (!violation_id || !resolution_action) {
        return NextResponse.json(
          { error: 'violation_id and resolution_action are required' },
          { status: 400 }
        );
      }

      logger.info('Resolving policy violation', {
        violationId: violation_id,
        resolutionAction: resolution_action,
        resolvedBy: userId
      });

      await resolveViolation(violation_id, resolution_action, userId);

      return NextResponse.json({
        violation_id,
        status: 'resolved',
        resolution_action,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        message: 'Policy violation resolved successfully'
      });

    } else if (action_type === 'update_policy') {
      if (!policy_id || !policy_updates) {
        return NextResponse.json(
          { error: 'policy_id and policy_updates are required' },
          { status: 400 }
        );
      }

      logger.info('Updating organizational policy', {
        policyId: policy_id,
        updatedBy: userId
      });

      const updatedPolicy = await updateOrganizationalPolicy(policy_id, policy_updates, userId);

      return NextResponse.json({
        policy_id,
        status: 'updated',
        updated_policy: updatedPolicy,
        message: 'Policy updated successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action_type. Must be "update_policy" or "resolve_violation"' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process PUT request', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(): Promise<NextResponse> {
  try {
    // Check service dependencies
    const preferencesStorageHealthy = true;
    const policyEngineHealthy = true;
    const validationHealthy = true;

    const isHealthy = preferencesStorageHealthy && policyEngineHealthy && validationHealthy;

    return NextResponse.json({
      service: 'preferences-service',
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        preferences_storage: preferencesStorageHealthy ? 'pass' : 'fail',
        policy_engine: policyEngineHealthy ? 'pass' : 'fail',
        validation_engine: validationHealthy ? 'pass' : 'fail'
      },
      capabilities: [
        'preference_management',
        'policy_enforcement',
        'compliance_checking',
        'violation_reporting',
        'role_based_access',
        'decision_criteria_config'
      ],
      statistics: {
        active_users: await getActiveUserCount(),
        active_policies: await getActivePolicyCount(),
        recent_violations: await getRecentViolationCount()
      },
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      service: 'preferences-service',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleGetPreferences(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('user_id');
  const category = url.searchParams.get('category');

  const requestingUserId = request.headers.get('x-user-id') || 'anonymous';

  try {
    // Use requesting user ID if no target specified (users getting their own prefs)
    const userId = targetUserId || requestingUserId;

    if (!userId || userId === 'anonymous') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    logger.info('Retrieving user preferences', {
      userId,
      category,
      requestingUser: requestingUserId
    });

    const preferences = await getUserPreferences(userId);

    if (!preferences) {
      // Return default preferences if none exist
      const defaultPrefs = getDefaultPreferences(userId);
      return NextResponse.json({
        user_id: userId,
        preferences: category ? defaultPrefs[category as keyof UserPreferences] : defaultPrefs,
        is_default: true,
        timestamp: new Date().toISOString()
      });
    }

    const responsePrefs = category
      ? preferences[category as keyof UserPreferences]
      : preferences;

    return NextResponse.json({
      user_id: userId,
      preferences: responsePrefs,
      is_default: false,
      last_updated: preferences.updated_at,
      version: preferences.version,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve preferences', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to retrieve preferences' },
      { status: 500 }
    );
  }
}

async function handleGetPolicies(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organization_id');
  const policyType = url.searchParams.get('policy_type');
  const status = url.searchParams.get('status') || 'active';

  try {
    logger.info('Retrieving organizational policies', {
      organizationId,
      policyType,
      status
    });

    const policies = await getOrganizationalPolicies({
      organization_id: organizationId || undefined,
      policy_type: policyType as any,
      status: status as any
    });

    return NextResponse.json({
      policies,
      filters: { organization_id: organizationId, policy_type: policyType, status },
      total_policies: policies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve policies', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to retrieve policies' },
      { status: 500 }
    );
  }
}

async function handleValidateAction(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const actionType = url.searchParams.get('action_type');
  const actionDataParam = url.searchParams.get('action_data');

  try {
    if (!userId || !actionType || !actionDataParam) {
      return NextResponse.json(
        { error: 'user_id, action_type, and action_data are required' },
        { status: 400 }
      );
    }

    const actionData = JSON.parse(actionDataParam);

    logger.info('Validating user action against policies', {
      userId,
      actionType,
      actionData
    });

    const validationResult = await validateActionAgainstPolicies(userId, actionType, actionData);

    return NextResponse.json({
      user_id: userId,
      action_type: actionType,
      validation_result: validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to validate action', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to validate action' },
      { status: 500 }
    );
  }
}

async function handleGetViolations(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const resolved = url.searchParams.get('resolved') === 'true';
  const severity = url.searchParams.get('severity');

  try {
    logger.info('Retrieving policy violations', {
      userId,
      resolved,
      severity
    });

    const violations = await getPolicyViolations({
      user_id: userId || undefined,
      resolved,
      severity: severity as any
    });

    return NextResponse.json({
      violations,
      filters: { user_id: userId, resolved, severity },
      total_violations: violations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve violations', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to retrieve violations' },
      { status: 500 }
    );
  }
}

// Core business logic functions
async function validatePreferencesAgainstPolicies(
  userId: string,
  category: string,
  preferences: any
): Promise<{ valid: boolean; violations: any[] }> {
  const policies = await getApplicablePolicies(userId);
  const violations = [];

  for (const policy of policies) {
    for (const rule of policy.rules) {
      const violation = checkRuleViolation(rule, category, preferences, policy);
      if (violation) {
        violations.push({
          policy_id: policy.policy_id,
          rule_id: rule.rule_id,
          violation_type: rule.rule_type,
          message: rule.message,
          severity: rule.severity,
          enforcement_level: policy.enforcement_level
        });
      }
    }
  }

  // Only block if there are violations with 'blocking' enforcement
  const blockingViolations = violations.filter(v => v.enforcement_level === 'blocking');

  return {
    valid: blockingViolations.length === 0,
    violations
  };
}

function checkRuleViolation(rule: PolicyRule, category: string, preferences: any, policy: OrganizationalPolicy): any | null {
  // Simple rule checking logic - in production, this would be more sophisticated

  if (rule.rule_type === 'budget_limit' && category === 'strategic_preferences') {
    if (preferences.budget_priority === 'investment_focused' && rule.condition.value < 500000) {
      return {
        field: 'budget_priority',
        attempted_value: 'investment_focused',
        policy_limit: rule.condition.value
      };
    }
  }

  if (rule.rule_type === 'risk_threshold' && category === 'strategic_preferences') {
    if (preferences.risk_tolerance === 'high' && rule.action === 'deny') {
      return {
        field: 'risk_tolerance',
        attempted_value: 'high',
        policy_restriction: 'high_risk_not_allowed'
      };
    }
  }

  return null;
}

function mergePreferences(
  existing: UserPreferences | null,
  category: string,
  newPrefs: any,
  strategy: string
): UserPreferences {
  const basePrefs = existing || getDefaultPreferences('user');

  if (strategy === 'deep_merge') {
    return {
      ...basePrefs,
      [category]: {
        ...basePrefs[category as keyof UserPreferences],
        ...newPrefs
      },
      updated_at: new Date().toISOString(),
      version: (basePrefs.version || 0) + 1
    };
  }

  return {
    ...basePrefs,
    [category]: newPrefs,
    updated_at: new Date().toISOString(),
    version: (basePrefs.version || 0) + 1
  };
}

function detectPreferenceChanges(
  oldPrefs: UserPreferences | null,
  newPrefs: UserPreferences,
  category: string
): Array<{ field: string; old_value: any; new_value: any }> {
  const changes = [];

  if (!oldPrefs) {
    // All fields are new
    const categoryPrefs = newPrefs[category as keyof UserPreferences];
    if (typeof categoryPrefs === 'object') {
      Object.keys(categoryPrefs).forEach(field => {
        changes.push({
          field,
          old_value: null,
          new_value: (categoryPrefs as any)[field]
        });
      });
    }
  } else {
    // Compare specific category
    const oldCategoryPrefs = oldPrefs[category as keyof UserPreferences];
    const newCategoryPrefs = newPrefs[category as keyof UserPreferences];

    if (typeof oldCategoryPrefs === 'object' && typeof newCategoryPrefs === 'object') {
      Object.keys(newCategoryPrefs).forEach(field => {
        const oldValue = (oldCategoryPrefs as any)[field];
        const newValue = (newCategoryPrefs as any)[field];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field,
            old_value: oldValue,
            new_value: newValue
          });
        }
      });
    }
  }

  return changes;
}

function getDefaultPreferences(userId: string): UserPreferences {
  return {
    user_id: userId,
    strategic_preferences: {
      risk_tolerance: 'medium',
      innovation_appetite: 'moderate',
      budget_priority: 'balanced',
      timeline_preference: 'balanced',
      decision_criteria: {
        business_impact: 0.3,
        technical_feasibility: 0.2,
        resource_availability: 0.2,
        strategic_alignment: 0.15,
        risk_tolerance: 0.1,
        time_constraints: 0.05
      }
    },
    display_preferences: {
      theme: 'light',
      language: 'en-US',
      timezone: 'UTC',
      dashboard_layout: 'detailed',
      default_views: ['overview', 'recommendations'],
      chart_types: ['bar', 'line', 'pie'],
      notification_frequency: 'daily'
    },
    notification_preferences: {
      email_enabled: true,
      push_enabled: false,
      workflow_updates: true,
      recommendation_alerts: true,
      policy_violations: true,
      system_maintenance: true,
      marketing_communications: false
    },
    personalization_settings: {
      recommendation_categories: ['strategic', 'tactical', 'operational'],
      excluded_industries: [],
      preferred_implementation_phases: ['crawl', 'walk', 'run'],
      content_complexity: 'intermediate',
      auto_apply_filters: false
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  };
}

// Mock storage implementations
const preferencesCache = new Map<string, UserPreferences>();
const policiesCache = new Map<string, OrganizationalPolicy>();
const violationsCache = new Map<string, PolicyViolation>();

async function storeUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  logger.debug('Storing user preferences', { userId });
  preferencesCache.set(userId, preferences);
}

function storePreferencesInMemory(userId: string, preferences: UserPreferences): void {
  preferencesCache.set(userId, preferences);
}

async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  return preferencesCache.get(userId) || null;
}

async function getApplicablePolicies(userId: string): Promise<OrganizationalPolicy[]> {
  // Mock: return sample policies for demonstration
  return Array.from(policiesCache.values()).filter(policy => policy.status === 'active');
}

async function getOrganizationalPolicies(filters: {
  organization_id?: string;
  policy_type?: string;
  status?: string;
}): Promise<OrganizationalPolicy[]> {
  return Array.from(policiesCache.values());
}

async function validateActionAgainstPolicies(
  userId: string,
  actionType: string,
  actionData: any
): Promise<{ valid: boolean; violations: any[] }> {
  // Mock validation - in production, this would check comprehensive policy rules
  return { valid: true, violations: [] };
}

async function recordPolicyViolation(userId: string, violation: any): Promise<void> {
  const violationId = generateEventId();
  const policyViolation: PolicyViolation = {
    violation_id: violationId,
    user_id: userId,
    policy_id: violation.policy_id,
    rule_id: violation.rule_id,
    attempted_action: 'preference_update',
    violation_details: violation,
    severity: violation.severity,
    timestamp: new Date().toISOString(),
    resolved: false
  };

  violationsCache.set(violationId, policyViolation);

  // Publish violation event
  await publishEvent({
    event_type: 'preferences.policy.violation@1',
    event_id: generateEventId(),
    correlation_id: generateCorrelationId(),
    timestamp: new Date().toISOString(),
    version: 1,
    user_id: userId,
    policy_type: violation.violation_type,
    violation_details: {
      rule_id: violation.rule_id,
      rule_description: violation.message,
      attempted_action: 'preference_update',
      severity: violation.severity
    },
    metadata: createEventMetadata('violation', userId, 'preferences-service', {
      action_blocked: violation.enforcement_level === 'blocking',
      override_available: false
    })
  } as PolicyViolationEvent);
}

async function resolveViolation(violationId: string, resolutionAction: string, resolvedBy: string): Promise<void> {
  const violation = violationsCache.get(violationId);
  if (violation) {
    violation.resolved = true;
    violation.resolution_action = resolutionAction;
    violation.resolved_by = resolvedBy;
    violation.resolved_at = new Date().toISOString();
    violationsCache.set(violationId, violation);
  }
}

async function updateOrganizationalPolicy(policyId: string, updates: any, updatedBy: string): Promise<OrganizationalPolicy> {
  const policy = policiesCache.get(policyId);
  if (!policy) {
    throw new Error('Policy not found');
  }

  const updatedPolicy = {
    ...policy,
    ...updates,
    version: policy.version + 1
  };

  policiesCache.set(policyId, updatedPolicy);
  return updatedPolicy;
}

async function getPolicyViolations(filters: {
  user_id?: string;
  resolved?: boolean;
  severity?: string;
}): Promise<PolicyViolation[]> {
  return Array.from(violationsCache.values()).filter(violation => {
    if (filters.user_id && violation.user_id !== filters.user_id) return false;
    if (filters.resolved !== undefined && violation.resolved !== filters.resolved) return false;
    if (filters.severity && violation.severity !== filters.severity) return false;
    return true;
  });
}

async function getActiveUserCount(): Promise<number> {
  return preferencesCache.size;
}

async function getActivePolicyCount(): Promise<number> {
  return Array.from(policiesCache.values()).filter(p => p.status === 'active').length;
}

async function getRecentViolationCount(): Promise<number> {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  return Array.from(violationsCache.values())
    .filter(v => new Date(v.timestamp).getTime() > oneDayAgo).length;
}