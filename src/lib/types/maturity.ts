// PMG Maturity Plan Types - 4 Phase Framework
// Crawl → Walk → Run → Fly

export type MaturityPhase = 'crawl' | 'walk' | 'run' | 'fly';

export interface MaturityPhaseDetails {
  phase: MaturityPhase;
  title: string;
  description: string;
  duration_months: number;

  // Core Components
  experience_types: ExperienceType[];
  segmentation: SegmentationApproach;
  customer_data: CustomerDataRequirements;
  audience_examples: AudienceExample[];
  sample_use_cases: UseCaseExample[];

  // Maturity Indicators
  kpi_focus: string[];
  technology_requirements: TechnologyRequirement[];
  organizational_capabilities: string[];
  success_metrics: SuccessMetric[];

  // Transition Criteria
  readiness_checklist: string[];
  graduation_criteria: string[];
}

export interface ExperienceType {
  category: 'content' | 'product' | 'journey' | 'channel' | 'timing';
  name: string;
  description: string;
  complexity_level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  implementation_effort: 'low' | 'medium' | 'high';
  business_impact: 'low' | 'medium' | 'high';
}

export interface SegmentationApproach {
  strategy: string;
  data_sources: DataSource[];
  segment_count: number;
  refresh_frequency: 'real-time' | 'daily' | 'weekly' | 'monthly';
  automation_level: 'manual' | 'semi-automated' | 'fully-automated';
}

export interface DataSource {
  name: string;
  type: 'first-party' | 'second-party' | 'third-party';
  integration_status: 'in-odp' | 'not-in-odp' | 'planned';
  data_quality_score: number; // 1-5
  availability: 'real-time' | 'batch' | 'on-demand';
}

export interface CustomerDataRequirements {
  odp_integrations: ODPIntegration[];
  non_odp_sources: NonODPSource[];
  data_completeness_target: number; // percentage
  identity_resolution_accuracy: number; // percentage
  privacy_compliance: string[];
}

export interface ODPIntegration {
  platform: string;
  integration_type: 'native' | 'api' | 'file-upload';
  data_types: string[];
  sync_frequency: string;
  implementation_complexity: 'low' | 'medium' | 'high';
}

export interface NonODPSource {
  source_name: string;
  data_type: string;
  integration_method: string;
  migration_priority: 'high' | 'medium' | 'low';
  estimated_effort: string;
}

export interface AudienceExample {
  name: string;
  description: string;
  size_estimate: string;
  targeting_criteria: string[];
  business_value: string;
  activation_channels: string[];
}

export interface UseCaseExample {
  title: string;
  description: string;
  category: 'content' | 'product' | 'journey' | 'experience';
  complexity: 'simple' | 'moderate' | 'complex';
  expected_lift: string;
  implementation_time: string;
  required_capabilities: string[];
}

export interface TechnologyRequirement {
  component: string;
  requirement: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  current_state: 'missing' | 'partial' | 'complete';
  implementation_effort: string;
}

export interface SuccessMetric {
  category: 'conversion' | 'engagement' | 'revenue' | 'efficiency';
  metric_name: string;
  target_value: string;
  measurement_method: string;
  reporting_frequency: string;
}

export interface MaturityPlan {
  // Meta Information
  plan_id: string;
  client_name: string;
  assessment_date: string;
  current_phase: MaturityPhase;
  target_phase: MaturityPhase;

  // Overall Assessment
  overall_maturity_score: number; // 1-5
  maturity_rationale: string;
  strategic_priorities: string[];

  // Phase Details
  phases: MaturityPhaseDetails[];

  // Implementation Roadmap
  roadmap: {
    phase_1_immediate: RoadmapItem[];
    phase_2_short_term: RoadmapItem[];
    phase_3_medium_term: RoadmapItem[];
    phase_4_long_term: RoadmapItem[];
  };

  // Risk & Governance
  risks_and_assumptions: string[];
  governance_requirements: string[];
  privacy_considerations: string[];

  // Resource Planning
  budget_estimates: BudgetEstimate[];
  resource_requirements: ResourceRequirement[];
  vendor_recommendations: VendorRecommendation[];
}

export interface RoadmapItem {
  phase: MaturityPhase;
  milestone: string;
  description: string;
  timeline: string;
  dependencies: string[];
  success_criteria: string[];
  owner: string;
}

export interface BudgetEstimate {
  category: 'technology' | 'resources' | 'external' | 'training';
  phase: MaturityPhase;
  item: string;
  cost_range: string;
  confidence_level: 'low' | 'medium' | 'high';
}

export interface ResourceRequirement {
  role: string;
  phase: MaturityPhase;
  fte_requirement: number;
  skills_needed: string[];
  hiring_vs_training: 'hire' | 'train' | 'both';
}

export interface VendorRecommendation {
  category: string;
  vendor_name: string;
  use_case: string;
  integration_complexity: 'low' | 'medium' | 'high';
  estimated_cost: string;
}

// PMG Workflow Input/Output Types
export interface PMGWorkflowInput {
  client_name: string;
  industry: string;
  company_size: 'small' | 'medium' | 'large' | 'enterprise';
  current_capabilities: string[];
  business_objectives: string[];
  additional_marketing_technology: string[];
  timeline_preference: '6-months' | '12-months' | '18-months' | '24-months';
  budget_range: 'under-100k' | '100k-500k' | '500k-1m' | 'over-1m';
  recipients: string[];
}

export interface PMGWorkflowOutput {
  maturity_plan: MaturityPlan;
  executive_summary: string;
  next_steps: string[];
  cmp_campaign_id?: string;
  notification_status: 'success' | 'failed';
}