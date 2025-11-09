/**
 * OSA Event Schemas - Versioned Event Definitions
 *
 * All events follow the pattern: {service}.{entity}.{action}@{version}
 * Each event includes timestamp, correlation IDs, and metadata for tracing
 */

// Base event interface
export interface BaseEvent {
  event_type: string;
  timestamp: string;
  event_id: string;
  correlation_id: string;
  causation_id?: string;
  version: number;
}

// Event metadata for tracing and debugging
export interface EventMetadata {
  session_id: string;
  user_id?: string;
  source: string;
  trace_id?: string;
  span_id?: string;
}

// ===============================
// 1. INTAKE EVENTS
// ===============================

export interface IntakeSubmittedEvent extends BaseEvent {
  event_type: "intake.submitted@1";
  intake_id: string;
  user_id: string;
  context: {
    business_objectives: string[];
    technical_constraints: Record<string, any>;
    timeline: string;
    budget_range: string;
    industry: string;
    company_size: string;
    optimization_goals: string[];
  };
  metadata: EventMetadata & {
    form_version: string;
    submission_source: "dashboard" | "api" | "import";
  };
}

export interface IntakeValidatedEvent extends BaseEvent {
  event_type: "intake.validated@1";
  intake_id: string;
  validation_status: "passed" | "failed" | "warning";
  validation_results: {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  metadata: EventMetadata;
}

// Additional Strategy Intake Service Events
export interface FormSubmittedEvent extends BaseEvent {
  event_type: "intake.form.submitted@1";
  submission_id: string;
  session_id: string;
  form_data: Record<string, any>;
  client_context: Record<string, any>;
  validation_passed: boolean;
  metadata: EventMetadata & {
    form_size_bytes: number;
    validation_duration_ms: number;
    enrichment_fields_added: number;
  };
}

export interface ClientContextEnrichedEvent extends BaseEvent {
  event_type: "intake.context.enriched@1";
  submission_id: string;
  session_id: string;
  original_context: Record<string, any>;
  enriched_context: Record<string, any>;
  enrichment_source: string;
  metadata: EventMetadata & {
    enrichment_fields: string[];
    confidence_score: number;
  };
}

export interface ValidationCompletedEvent extends BaseEvent {
  event_type: "intake.validation.completed@1";
  submission_id: string;
  validation_passed: boolean;
  validation_errors: string[];
  rules_evaluated: number;
  metadata: EventMetadata & {
    validation_duration_ms: number;
    validation_version: string;
  };
}

// ===============================
// 2. ORCHESTRATION EVENTS
// ===============================

export interface WorkflowTriggeredEvent extends BaseEvent {
  event_type: "orchestration.workflow.triggered@1";
  workflow_id: string;
  trigger_source: "force_sync" | "scheduled" | "api" | "webhook";
  agents_scheduled: string[];
  intake_id?: string;
  priority: "low" | "normal" | "high";
  metadata: EventMetadata & {
    estimated_duration_ms: number;
    retry_count: number;
  };
}

export interface AgentStartedEvent extends BaseEvent {
  event_type: "orchestration.agent.started@1";
  workflow_id: string;
  agent_id: string;
  agent_name: string;
  agent_config: Record<string, any>;
  metadata: EventMetadata & {
    queue_wait_time_ms: number;
    dependency_agents: string[];
  };
}

export interface AgentCompletedEvent extends BaseEvent {
  event_type: "orchestration.agent.completed@1";
  workflow_id: string;
  agent_id: string;
  agent_name: string;
  success: boolean;
  results: Record<string, any>;
  execution_time_ms: number;
  metadata: EventMetadata & {
    error_message?: string;
    retry_count: number;
    output_size_bytes: number;
  };
}

export interface WorkflowCompletedEvent extends BaseEvent {
  event_type: "orchestration.workflow.completed@1";
  workflow_id: string;
  success: boolean;
  agent_results: AgentResult[];
  total_execution_time_ms: number;
  metadata: EventMetadata & {
    failed_agents: string[];
    success_rate: number;
    total_agents: number;
  };
}

export interface WorkflowFailedEvent extends BaseEvent {
  event_type: "orchestration.workflow.failed@1";
  workflow_id: string;
  failure_reason: string;
  failed_at_stage: string;
  partial_results: AgentResult[];
  metadata: EventMetadata & {
    error_code: string;
    retry_scheduled: boolean;
    fallback_triggered: boolean;
  };
}

// ===============================
// 3. KNOWLEDGE EVENTS
// ===============================

export interface KnowledgeUpsertedEvent extends BaseEvent {
  event_type: "knowledge.upserted@1";
  knowledge_id: string;
  content_type: "agent_result" | "user_feedback" | "external_data" | "recommendation" | "insight";
  source: string;
  content_hash: string;
  tags: string[];
  metadata: EventMetadata & {
    workflow_id?: string;
    relevance_score?: number;
    content_size_bytes: number;
    embedding_model?: string;
  };
}

export interface KnowledgeRetrievedEvent extends BaseEvent {
  event_type: "knowledge.retrieved@1";
  query: string;
  query_type: "semantic" | "keyword" | "hybrid";
  results_count: number;
  avg_relevance_score: number;
  metadata: EventMetadata & {
    response_time_ms: number;
    cache_hit: boolean;
    search_method: string;
  };
}

export interface KnowledgeIndexedEvent extends BaseEvent {
  event_type: "knowledge.indexed@1";
  knowledge_id: string;
  indexing_method: "vector" | "keyword" | "graph";
  index_stats: {
    dimensions?: number;
    tokens?: number;
    relationships?: number;
  };
  metadata: EventMetadata & {
    indexing_time_ms: number;
    model_version?: string;
  };
}

// ===============================
// 4. RECOMMENDATION EVENTS
// ===============================

export interface RecommendationsGeneratedEvent extends BaseEvent {
  event_type: "recommendations.generated@1";
  recommendation_set_id: string;
  workflow_id: string;
  intake_id: string;
  recommendations: Recommendation[];
  avg_confidence_score: number;
  metadata: EventMetadata & {
    generation_time_ms: number;
    fallback_mode: boolean;
    model_version: string;
    total_recommendations: number;
  };
}

export interface RecommendationFeedbackEvent extends BaseEvent {
  event_type: "recommendations.feedback@1";
  recommendation_id: string;
  recommendation_set_id: string;
  feedback_type: "like" | "dislike" | "implemented" | "not_applicable";
  feedback_details?: string;
  metadata: EventMetadata & {
    feedback_time_ms: number;
    previous_feedback?: string;
  };
}

// ===============================
// 5. PREFERENCES EVENTS
// ===============================

export interface PreferencesUpdatedEvent extends BaseEvent {
  event_type: "preferences.updated@1";
  user_id: string;
  preference_category: "strategic" | "policy" | "display" | "notification";
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata: EventMetadata & {
    change_source: "user_action" | "learning_algorithm" | "admin_override";
    validation_passed: boolean;
  };
}

export interface PolicyViolationEvent extends BaseEvent {
  event_type: "preferences.policy.violation@1";
  user_id: string;
  policy_type: "budget" | "risk" | "compliance" | "security";
  violation_details: {
    rule_id: string;
    rule_description: string;
    attempted_action: string;
    severity: "low" | "medium" | "high" | "critical";
  };
  metadata: EventMetadata & {
    action_blocked: boolean;
    override_available: boolean;
  };
}

// ===============================
// 6. SYSTEM HEALTH EVENTS
// ===============================

export interface ServiceHealthEvent extends BaseEvent {
  event_type: "system.service.health@1";
  service_name: string;
  health_status: "healthy" | "degraded" | "down" | "recovering";
  health_checks: {
    name: string;
    status: "pass" | "fail" | "warn";
    response_time_ms?: number;
    error_message?: string;
  }[];
  metadata: EventMetadata & {
    check_interval_ms: number;
    previous_status: string;
  };
}

export interface CircuitBreakerEvent extends BaseEvent {
  event_type: "system.circuit_breaker@1";
  service_name: string;
  circuit_name: string;
  state: "closed" | "open" | "half_open";
  failure_count: number;
  failure_threshold: number;
  metadata: EventMetadata & {
    error_rate: number;
    response_time_p95: number;
    next_retry_at?: string;
  };
}

// ===============================
// 7. UX DESIGN EVENTS
// ===============================

export interface ComponentLibraryUpdatedEvent extends BaseEvent {
  event_type: "ux_design.components.updated@1";
  library_version: string;
  updated_components: string[];
  accessibility_score: number;
  metadata: EventMetadata & {
    update_type: "major" | "minor" | "patch";
    backward_compatible: boolean;
    performance_impact: number;
  };
}

export interface VisualizationCreatedEvent extends BaseEvent {
  event_type: "ux_design.visualization.created@1";
  visualization_id: string;
  chart_type: string;
  data_source_size: number;
  accessibility_compliant: boolean;
  metadata: EventMetadata & {
    creation_time_ms: number;
    interactive: boolean;
    responsive: boolean;
    performance_optimized: boolean;
  };
}

export interface ThemeUpdatedEvent extends BaseEvent {
  event_type: "ux_design.theme.updated@1";
  theme_name: string;
  theme_version: string;
  accessibility_compliance: "A" | "AA" | "AAA";
  metadata: EventMetadata & {
    color_contrast_passed: boolean;
    custom_theme: boolean;
    performance_impact: "low" | "medium" | "high";
  };
}

export interface AccessibilityAuditCompletedEvent extends BaseEvent {
  event_type: "ux_design.accessibility.audit_completed@1";
  audit_id: string;
  page_url: string;
  compliance_level: "A" | "AA" | "AAA";
  issues_found: number;
  score: number; // 0-100
  metadata: EventMetadata & {
    audit_duration_ms: number;
    automated_tests: number;
    manual_review_required: number;
  };
}

// ===============================
// 8. ANALYTICS EVENTS
// ===============================

export interface AnalyticsQueryEvent extends BaseEvent {
  event_type: "analytics.query.executed@1";
  query_id: string;
  query: string;
  query_type: "natural_language" | "structured" | "visualization";
  results_count: number;
  metadata: EventMetadata & {
    execution_time_ms: number;
    cache_hit: boolean;
    complexity_score: number;
  };
}

// ===============================
// HELPER TYPES
// ===============================

export interface AgentResult {
  agent_id: string;
  agent_name: string;
  success: boolean;
  results: Record<string, any>;
  execution_time_ms: number;
  error_message?: string;
}

export interface Recommendation {
  id: string;
  type: "strategic" | "tactical" | "technical";
  title: string;
  description: string;
  confidence_score: number;
  evidence_links: string[];
  implementation_effort: "low" | "medium" | "high";
  expected_impact: {
    metric: string;
    estimated_change: string;
    timeframe: string;
  }[];
  tags: string[];
}

// ===============================
// EVENT UNION TYPE
// ===============================

export type OSAEvent =
  | IntakeSubmittedEvent
  | IntakeValidatedEvent
  | WorkflowTriggeredEvent
  | AgentStartedEvent
  | AgentCompletedEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | KnowledgeUpsertedEvent
  | KnowledgeRetrievedEvent
  | KnowledgeIndexedEvent
  | RecommendationsGeneratedEvent
  | RecommendationFeedbackEvent
  | PreferencesUpdatedEvent
  | PolicyViolationEvent
  | ComponentLibraryUpdatedEvent
  | VisualizationCreatedEvent
  | ThemeUpdatedEvent
  | AccessibilityAuditCompletedEvent
  | ServiceHealthEvent
  | CircuitBreakerEvent
  | AnalyticsQueryEvent;

// ===============================
// EVENT VALIDATION
// ===============================

export function validateEvent(event: Partial<OSAEvent>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event.event_type) errors.push("event_type is required");
  if (!event.timestamp) errors.push("timestamp is required");
  if (!event.event_id) errors.push("event_id is required");
  if (!event.correlation_id) errors.push("correlation_id is required");

  // Validate timestamp format
  if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
    errors.push("timestamp must be a valid ISO date string");
  }

  // Validate event_type format
  if (event.event_type && !event.event_type.match(/^[a-z]+\.[a-z_]+@\d+$/)) {
    errors.push("event_type must follow pattern: service.action@version");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ===============================
// EVENT METADATA HELPERS
// ===============================

export function createEventMetadata(
  sessionId: string,
  userId?: string,
  source: string = "system",
  additionalMeta: Record<string, any> = {}
): EventMetadata {
  return {
    session_id: sessionId,
    user_id: userId,
    source,
    trace_id: generateTraceId(),
    ...additionalMeta
  };
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}