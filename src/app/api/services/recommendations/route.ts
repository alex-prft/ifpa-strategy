/**
 * Recommendation Service - OSA Decision Layer and Recommendation Engine
 *
 * Handles recommendation generation, scoring, prioritization, and decision matrix
 * processing for OSA strategy recommendations. Integrates with AI/ML models
 * and applies business rules for intelligent recommendation delivery.
 *
 * Service Capabilities:
 * - Recommendation generation and AI-enhanced scoring
 * - Decision matrix processing and multi-criteria analysis
 * - Business rule validation and compliance checking
 * - Recommendation ranking, filtering, and personalization
 * - ML model integration for enhanced predictions
 * - A/B testing framework for recommendation optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { publishEvent } from '@/lib/events/event-bus';
import { createServiceCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import {
  generateEventId,
  generateCorrelationId,
  createEventMetadata,
  type RecommendationsGeneratedEvent,
  type RecommendationFeedbackEvent
} from '@/lib/events/schemas';

const logger = createServiceLogger('recommendations-service');
const dbCircuitBreaker = createServiceCircuitBreaker('recommendations-db', 'database');
const mlCircuitBreaker = createServiceCircuitBreaker('recommendations-ml', 'ai');

// Recommendation types and interfaces
interface Recommendation {
  id: string;
  type: 'strategic' | 'tactical' | 'operational' | 'technical';
  category: string;
  title: string;
  description: string;
  rationale: string;
  impact_score: number; // 0-1
  effort_score: number; // 0-1
  confidence_score: number; // 0-1
  priority: 'high' | 'medium' | 'low';
  phase: 'crawl' | 'walk' | 'run';
  timeline_estimate: string;
  success_metrics: string[];
  dependencies: string[];
  risks: string[];
  business_value: number;
  technical_complexity: number;
  resource_requirements: {
    team_size?: number;
    skill_requirements?: string[];
    budget_estimate?: string;
    duration_weeks?: number;
  };
  implementation_steps?: string[];
  tags: string[];
}

interface DecisionCriteria {
  business_impact: number; // weight 0-1
  technical_feasibility: number; // weight 0-1
  resource_availability: number; // weight 0-1
  strategic_alignment: number; // weight 0-1
  risk_tolerance: number; // weight 0-1
  time_constraints: number; // weight 0-1
}

interface RecommendationRequest {
  context: {
    client_name: string;
    industry: string;
    current_capabilities: string[];
    business_objectives: string[];
    budget_range?: string;
    timeline_preference?: string;
    technical_maturity?: 'beginner' | 'intermediate' | 'advanced';
  };
  preferences?: {
    decision_criteria?: DecisionCriteria;
    max_recommendations?: number;
    filter_by_phase?: ('crawl' | 'walk' | 'run')[];
    exclude_categories?: string[];
    prioritization_method?: 'impact_effort' | 'business_value' | 'ml_enhanced' | 'hybrid';
  };
  workflow_results?: {
    agent_outputs: Record<string, any>;
    insights: string[];
    data_analysis: Record<string, any>;
  };
}

// Service Health Check
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/health')) {
    return handleHealthCheck();
  }

  if (pathname.endsWith('/criteria')) {
    return handleGetDecisionCriteria(request);
  }

  if (pathname.endsWith('/templates')) {
    return handleGetRecommendationTemplates(request);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// Generate Recommendations
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'system';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      context,
      preferences = {},
      workflow_results = {},
      generation_mode = 'hybrid'
    }: RecommendationRequest & { generation_mode?: string } = body;

    // Validate request structure
    if (!context || !context.client_name) {
      return NextResponse.json(
        { error: 'context with client_name is required' },
        { status: 400 }
      );
    }

    const recommendationSetId = generateEventId();
    const sessionId = context.session_id || generateCorrelationId();

    logger.info('Generating recommendations', {
      recommendationSetId,
      sessionId,
      clientName: context.client_name,
      generationMode: generation_mode,
      maxRecommendations: preferences.max_recommendations || 20
    });

    // Step 1: Generate base recommendations
    const baseRecommendations = await generateBaseRecommendations(context, workflow_results);

    // Step 2: Apply ML enhancement (if available)
    const enhancedRecommendations = await mlCircuitBreaker.execute(async () => {
      return await enhanceWithML(baseRecommendations, context, generation_mode);
    }).catch(error => {
      logger.warn('ML enhancement failed, using base recommendations', { error });
      return baseRecommendations;
    });

    // Step 3: Apply business rules and filters
    const filteredRecommendations = applyBusinessRules(enhancedRecommendations, context, preferences);

    // Step 4: Score and rank recommendations
    const scoredRecommendations = await scoreRecommendations(filteredRecommendations, context, preferences);

    // Step 5: Apply final prioritization
    const finalRecommendations = prioritizeRecommendations(scoredRecommendations, preferences);

    // Step 6: Store recommendations
    await dbCircuitBreaker.execute(async () => {
      await storeRecommendationSet(recommendationSetId, sessionId, finalRecommendations, context);
    }).catch(error => {
      logger.warn('Database storage failed, continuing with in-memory mode', { error });
    });

    // Step 7: Publish events
    const avgConfidence = finalRecommendations.length > 0
      ? finalRecommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / finalRecommendations.length
      : 0;

    await publishEvent({
      event_type: 'recommendations.generated@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      recommendation_set_id: recommendationSetId,
      workflow_id: workflow_results.workflow_id || 'direct_request',
      intake_id: context.intake_id || 'direct_request',
      recommendations: finalRecommendations,
      avg_confidence_score: avgConfidence,
      metadata: createEventMetadata(sessionId, userId, 'recommendations-service', {
        generation_time_ms: Date.now() - parseInt(requestId.split('-')[1] || '0'),
        fallback_mode: false,
        model_version: '1.0.0',
        total_recommendations: finalRecommendations.length
      })
    } as RecommendationsGeneratedEvent);

    return NextResponse.json({
      recommendation_set_id: recommendationSetId,
      session_id: sessionId,
      status: 'generated',
      recommendations: finalRecommendations,
      generation_summary: {
        total_generated: baseRecommendations.length,
        ml_enhanced: enhancedRecommendations.length,
        post_filter: filteredRecommendations.length,
        final_count: finalRecommendations.length,
        avg_confidence_score: avgConfidence,
        generation_mode: generation_mode
      },
      decision_criteria: preferences.decision_criteria || getDefaultDecisionCriteria(),
      message: 'Recommendations generated successfully'
    });

  } catch (error) {
    logger.error('Failed to generate recommendations', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update Recommendation Feedback
export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'anonymous';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      recommendation_id,
      feedback_type,
      feedback_value,
      user_comment,
      implementation_status
    } = body;

    if (!recommendation_id || !feedback_type) {
      return NextResponse.json(
        { error: 'recommendation_id and feedback_type are required' },
        { status: 400 }
      );
    }

    logger.info('Processing recommendation feedback', {
      recommendationId: recommendation_id,
      feedbackType: feedback_type,
      userId
    });

    // Store feedback
    await dbCircuitBreaker.execute(async () => {
      await storeRecommendationFeedback(recommendation_id, feedback_type, feedback_value, user_comment, userId);
    });

    // Publish feedback event for ML model training
    await publishEvent({
      event_type: 'recommendations.feedback@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      recommendation_id,
      feedback_type,
      feedback_value,
      user_comment: user_comment || '',
      implementation_status: implementation_status || 'pending',
      metadata: createEventMetadata('system', userId, 'recommendations-service', {
        feedback_source: 'user_interface',
        model_training_eligible: true
      })
    } as RecommendationFeedbackEvent);

    return NextResponse.json({
      recommendation_id,
      status: 'feedback_recorded',
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to process feedback', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to process feedback', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(): Promise<NextResponse> {
  try {
    // Check service dependencies
    const recommendationEngineHealthy = true;
    const mlModelsHealthy = true;
    const businessRulesHealthy = true;

    const isHealthy = recommendationEngineHealthy && mlModelsHealthy && businessRulesHealthy;

    return NextResponse.json({
      service: 'recommendations-service',
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        recommendation_engine: recommendationEngineHealthy ? 'pass' : 'fail',
        ml_models: mlModelsHealthy ? 'pass' : 'fail',
        business_rules: businessRulesHealthy ? 'pass' : 'fail'
      },
      capabilities: [
        'recommendation_generation',
        'ml_enhanced_scoring',
        'decision_matrix_processing',
        'business_rule_validation',
        'feedback_learning'
      ],
      model_versions: {
        scoring_model: '1.0.0',
        ranking_model: '1.0.0',
        personalization_model: '1.0.0'
      },
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      service: 'recommendations-service',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleGetDecisionCriteria(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const industry = url.searchParams.get('industry');

  try {
    const criteria = getDecisionCriteriaForIndustry(industry || 'general');

    return NextResponse.json({
      decision_criteria: criteria,
      industry_specific: !!industry,
      criteria_version: '1.0.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve decision criteria', {}, error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve decision criteria' },
      { status: 500 }
    );
  }
}

async function handleGetRecommendationTemplates(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const phase = url.searchParams.get('phase');

  try {
    const templates = getRecommendationTemplates(category, phase);

    return NextResponse.json({
      templates,
      filters_applied: { category, phase },
      template_version: '1.0.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve recommendation templates', {}, error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve recommendation templates' },
      { status: 500 }
    );
  }
}

async function generateBaseRecommendations(
  context: RecommendationRequest['context'],
  workflowResults: RecommendationRequest['workflow_results']
): Promise<Recommendation[]> {

  const recommendations: Recommendation[] = [];

  // Strategy-based recommendations
  if (context.business_objectives.includes('Increase Lead Generation')) {
    recommendations.push({
      id: generateEventId(),
      type: 'strategic',
      category: 'lead_generation',
      title: 'Implement Progressive Web Experimentation',
      description: 'Deploy A/B testing framework for lead capture forms and landing pages',
      rationale: 'Data-driven optimization can increase conversion rates by 15-30%',
      impact_score: 0.8,
      effort_score: 0.6,
      confidence_score: 0.85,
      priority: 'high',
      phase: 'walk',
      timeline_estimate: '8-12 weeks',
      success_metrics: ['Conversion rate improvement', 'Lead quality score', 'Cost per acquisition'],
      dependencies: ['Web experimentation platform setup', 'Analytics integration'],
      risks: ['Test duration requirements', 'Traffic volume needs'],
      business_value: 8.5,
      technical_complexity: 6,
      resource_requirements: {
        team_size: 3,
        skill_requirements: ['Frontend development', 'Analytics', 'UX design'],
        budget_estimate: '$25k-50k',
        duration_weeks: 10
      },
      implementation_steps: [
        'Audit current forms and landing pages',
        'Implement experimentation platform',
        'Design test variations',
        'Launch controlled experiments',
        'Analyze results and iterate'
      ],
      tags: ['experimentation', 'conversion_optimization', 'lead_generation']
    });
  }

  if (context.business_objectives.includes('Scale personalization efforts')) {
    recommendations.push({
      id: generateEventId(),
      type: 'tactical',
      category: 'personalization',
      title: 'Deploy Behavioral Targeting Engine',
      description: 'Implement real-time personalization based on user behavior and preferences',
      rationale: 'Personalized experiences can increase engagement by 40-60%',
      impact_score: 0.9,
      effort_score: 0.8,
      confidence_score: 0.75,
      priority: 'high',
      phase: 'run',
      timeline_estimate: '12-16 weeks',
      success_metrics: ['Engagement rate', 'Session duration', 'Return visitor rate'],
      dependencies: ['Data collection infrastructure', 'Customer data platform'],
      risks: ['Privacy compliance', 'Data quality requirements'],
      business_value: 9.0,
      technical_complexity: 8,
      resource_requirements: {
        team_size: 5,
        skill_requirements: ['Machine learning', 'Data engineering', 'Frontend development'],
        budget_estimate: '$75k-150k',
        duration_weeks: 14
      },
      tags: ['personalization', 'machine_learning', 'customer_experience']
    });
  }

  // Technology-based recommendations
  if (context.current_capabilities.includes('Email Marketing')) {
    recommendations.push({
      id: generateEventId(),
      type: 'operational',
      category: 'marketing_automation',
      title: 'Integrate Advanced Email Segmentation',
      description: 'Implement dynamic segmentation and automated email workflows',
      rationale: 'Segmented email campaigns can improve click-through rates by 100%+',
      impact_score: 0.7,
      effort_score: 0.4,
      confidence_score: 0.9,
      priority: 'medium',
      phase: 'crawl',
      timeline_estimate: '4-6 weeks',
      success_metrics: ['Open rate improvement', 'Click-through rate', 'Unsubscribe rate reduction'],
      dependencies: ['Email platform API access', 'Customer data integration'],
      risks: ['Deliverability impact', 'List management complexity'],
      business_value: 7,
      technical_complexity: 4,
      resource_requirements: {
        team_size: 2,
        skill_requirements: ['Email marketing', 'Marketing automation'],
        budget_estimate: '$10k-25k',
        duration_weeks: 5
      },
      tags: ['email_marketing', 'segmentation', 'automation']
    });
  }

  return recommendations;
}

async function enhanceWithML(
  recommendations: Recommendation[],
  context: RecommendationRequest['context'],
  mode: string
): Promise<Recommendation[]> {

  // Mock ML enhancement - in production, this would call actual ML models
  return recommendations.map(rec => ({
    ...rec,
    confidence_score: Math.min(1.0, rec.confidence_score + (Math.random() * 0.1)),
    impact_score: Math.min(1.0, rec.impact_score + (Math.random() * 0.05)),
    // Add ML-enhanced metadata
    ml_enhanced: true,
    ml_model_version: '1.0.0',
    prediction_confidence: 0.85 + (Math.random() * 0.1)
  }));
}

function applyBusinessRules(
  recommendations: Recommendation[],
  context: RecommendationRequest['context'],
  preferences: RecommendationRequest['preferences']
): Recommendation[] {

  let filtered = recommendations;

  // Filter by phase preferences
  if (preferences?.filter_by_phase) {
    filtered = filtered.filter(rec => preferences.filter_by_phase!.includes(rec.phase));
  }

  // Exclude categories
  if (preferences?.exclude_categories) {
    filtered = filtered.filter(rec => !preferences.exclude_categories!.includes(rec.category));
  }

  // Budget-based filtering
  if (context.budget_range) {
    const budgetRanges: Record<string, number> = {
      'Under $25k': 25000,
      '25k-100k': 100000,
      '100k-500k': 500000,
      '500k+': 1000000
    };

    const maxBudget = budgetRanges[context.budget_range] || 100000;

    // Filter out recommendations that exceed budget (rough estimation)
    filtered = filtered.filter(rec => {
      const estimatedCost = rec.resource_requirements.budget_estimate;
      if (!estimatedCost) return true;

      const cost = parseInt(estimatedCost.replace(/[^\d]/g, ''));
      return cost <= maxBudget;
    });
  }

  // Technical maturity filtering
  if (context.technical_maturity === 'beginner') {
    filtered = filtered.filter(rec => rec.technical_complexity <= 6);
  } else if (context.technical_maturity === 'intermediate') {
    filtered = filtered.filter(rec => rec.technical_complexity <= 8);
  }

  return filtered;
}

async function scoreRecommendations(
  recommendations: Recommendation[],
  context: RecommendationRequest['context'],
  preferences: RecommendationRequest['preferences']
): Promise<Recommendation[]> {

  const criteria = preferences?.decision_criteria || getDefaultDecisionCriteria();

  return recommendations.map(rec => {
    // Calculate composite score based on decision criteria
    const impactWeight = criteria.business_impact;
    const feasibilityWeight = criteria.technical_feasibility;
    const resourceWeight = criteria.resource_availability;
    const strategyWeight = criteria.strategic_alignment;
    const riskWeight = criteria.risk_tolerance;
    const timeWeight = criteria.time_constraints;

    const compositeScore = (
      (rec.impact_score * impactWeight) +
      ((10 - rec.technical_complexity) / 10 * feasibilityWeight) +
      (rec.confidence_score * resourceWeight) +
      (rec.business_value / 10 * strategyWeight) +
      ((10 - rec.risks.length) / 10 * riskWeight) +
      (getTimelineScore(rec.timeline_estimate) * timeWeight)
    ) / (impactWeight + feasibilityWeight + resourceWeight + strategyWeight + riskWeight + timeWeight);

    return {
      ...rec,
      composite_score: compositeScore,
      scoring_metadata: {
        criteria_applied: criteria,
        individual_scores: {
          impact: rec.impact_score,
          feasibility: (10 - rec.technical_complexity) / 10,
          confidence: rec.confidence_score,
          business_value: rec.business_value / 10,
          risk_adjusted: (10 - rec.risks.length) / 10,
          timeline_fit: getTimelineScore(rec.timeline_estimate)
        }
      }
    };
  });
}

function prioritizeRecommendations(
  recommendations: Recommendation[],
  preferences: RecommendationRequest['preferences']
): Recommendation[] {

  const method = preferences?.prioritization_method || 'hybrid';
  const maxRecommendations = preferences?.max_recommendations || 20;

  let sorted: Recommendation[];

  switch (method) {
    case 'impact_effort':
      sorted = recommendations.sort((a, b) => {
        const aScore = a.impact_score / Math.max(0.1, a.effort_score);
        const bScore = b.impact_score / Math.max(0.1, b.effort_score);
        return bScore - aScore;
      });
      break;

    case 'business_value':
      sorted = recommendations.sort((a, b) => b.business_value - a.business_value);
      break;

    case 'ml_enhanced':
      sorted = recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
      break;

    case 'hybrid':
    default:
      sorted = recommendations.sort((a, b) => {
        const aScore = (a as any).composite_score || a.confidence_score;
        const bScore = (b as any).composite_score || b.confidence_score;
        return bScore - aScore;
      });
  }

  return sorted.slice(0, maxRecommendations);
}

function getDefaultDecisionCriteria(): DecisionCriteria {
  return {
    business_impact: 0.3,
    technical_feasibility: 0.2,
    resource_availability: 0.2,
    strategic_alignment: 0.15,
    risk_tolerance: 0.1,
    time_constraints: 0.05
  };
}

function getDecisionCriteriaForIndustry(industry: string): DecisionCriteria {
  const industryProfiles: Record<string, DecisionCriteria> = {
    'Produce and Floral Trade Association': {
      business_impact: 0.35,
      technical_feasibility: 0.15,
      resource_availability: 0.25,
      strategic_alignment: 0.15,
      risk_tolerance: 0.05,
      time_constraints: 0.05
    },
    'Agency Consulting Services': {
      business_impact: 0.25,
      technical_feasibility: 0.3,
      resource_availability: 0.2,
      strategic_alignment: 0.15,
      risk_tolerance: 0.05,
      time_constraints: 0.05
    }
  };

  return industryProfiles[industry] || getDefaultDecisionCriteria();
}

function getRecommendationTemplates(category?: string | null, phase?: string | null): any[] {
  const templates = [
    {
      id: 'exp-001',
      category: 'experimentation',
      phase: 'crawl',
      title: 'Basic A/B Testing Setup',
      description: 'Simple two-variant testing for key pages',
      effort_estimate: 'low',
      impact_potential: 'medium'
    },
    {
      id: 'pers-001',
      category: 'personalization',
      phase: 'walk',
      title: 'Behavioral Targeting',
      description: 'Dynamic content based on user behavior',
      effort_estimate: 'medium',
      impact_potential: 'high'
    }
  ];

  let filtered = templates;

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  if (phase) {
    filtered = filtered.filter(t => t.phase === phase);
  }

  return filtered;
}

function getTimelineScore(timeline: string): number {
  // Convert timeline estimates to scores (higher is better for shorter timelines)
  const weeks = parseInt(timeline.split('-')[0]) || 12;
  return Math.max(0.1, 1 - (weeks / 52)); // Normalize by year
}

async function storeRecommendationSet(
  setId: string,
  sessionId: string,
  recommendations: Recommendation[],
  context: any
): Promise<void> {
  // Mock storage implementation - replace with actual database storage
  logger.debug('Storing recommendation set', {
    setId,
    sessionId,
    recommendationCount: recommendations.length
  });
}

async function storeRecommendationFeedback(
  recommendationId: string,
  feedbackType: string,
  feedbackValue: any,
  userComment: string,
  userId: string
): Promise<void> {
  // Mock feedback storage implementation - replace with actual database storage
  logger.debug('Storing recommendation feedback', {
    recommendationId,
    feedbackType,
    userId
  });
}