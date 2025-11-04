// Core Types for Opal Personalization System

export interface UserIdentifier {
  email_hash?: string;
  sf_contact_id?: string;
  opti_user_id?: string;
  zaius_id?: string;
}

export interface ResolvedIdentifier {
  id: string;
  id_type: 'email_hash' | 'sf_contact_id' | 'opti_user_id' | 'zaius_id';
  confidence: number;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  logic: string;
  coverage?: number;
  attributes: Record<string, any>;
}

export interface PersonalizationIdea {
  id: string;
  audience_name: string;
  placement: string;
  message_offer: string;
  recs_topic?: string;
  recs_section?: string;
  fallback: string;
  primary_kpi: string;
  secondary_kpis: string[];
  instrumentation: 'web_rule' | 'feature_flag';
  dependencies: string[];
  estimated_impact?: string;
}

export interface ExperimentBlueprint {
  name: string;
  hypothesis: string;
  platform: 'web' | 'feature';
  targeting: {
    audience: string;
    odp_rt_audience?: string;
    conditions: string[];
  };
  variants: Array<{
    name: string;
    description: string;
    traffic_allocation: number;
  }>;
  metrics: {
    primary: string;
    secondary: string[];
    guardrails: string[];
  };
  mde: number;
  runtime_assumptions: string[];
  rollout_criteria: string[];
  kill_criteria: string[];
  implementation_checklist: string[];
  reporting_plan: string;
}

export interface PersonalizationPlan {
  maturity_score: number;
  maturity_rationale: string;
  audience_portfolio: AudienceSegment[];
  ideas: PersonalizationIdea[];
  experiment_specs: ExperimentBlueprint[];
  roadmap_30_60_90: {
    "30_days": string[];
    "60_days": string[];
    "90_days": string[];
  };
  analytics_plan: string;
  risks_assumptions: string[];
  privacy_notes: string[];
}

// Tool Response Types
export interface AudienceToolResponse {
  id: string;
  id_type: string;
  segments: string[];
  attributes: Record<string, any>;
  coverage_estimates?: Record<string, number>;
}

export interface ContentToolResponse {
  recommendations: Array<{
    title: string;
    url: string;
    topics: string[];
    sections: string[];
    confidence?: number;
  }>;
}

export interface ExperimentsToolResponse {
  items: Array<{
    name: string;
    url_scope: string;
    winner: string | null;
    notes: string;
    date: string;
    kpi: string;
    audience?: string;
  }>;
}

export interface CMPToolResponse {
  campaign_url: string;
  campaign_id: string;
  brief_id: string;
  status: 'success' | 'error';
  message?: string;
}

export interface NotifyToolResponse {
  status: 'success' | 'error';
  message_id?: string;
  message?: string;
}

// Opal Tool Discovery Types
export interface ToolDiscovery {
  toolId: string;
  name: string;
  description: string;
  version: string;
  endpoints: {
    [key: string]: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      path: string;
      description: string;
      schema: any;
    };
  };
}

// API Request/Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface WorkflowInput {
  kpi_target: string;
  channel: 'web' | 'app' | 'email';
  region?: string;
  timing?: string;
  recipients?: string[];
}

// Configuration Types
export interface OptimizelyConfig {
  odp: {
    api_key: string;
    project_id: string;
    base_url: string;
  };
  experimentation: {
    api_key: string;
    project_id: string;
    base_url: string;
  };
  content_recs: {
    api_key: string;
    account_id: string;
    base_url: string;
  };
  cmp: {
    api_key: string;
    workspace_id: string;
    base_url: string;
  };
}

export interface MSGraphConfig {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  sender_email: string;
}

export interface SendGridConfig {
  api_key: string;
  sender_email: string;
  sender_name?: string;
}