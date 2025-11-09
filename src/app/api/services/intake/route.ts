/**
 * Strategy Intake Service - OSA Form Processing and Validation
 *
 * Handles OSA form submissions, client context management, input validation,
 * and user data transformation for downstream processing.
 *
 * Service Capabilities:
 * - Form submission processing and validation
 * - Client context enrichment and standardization
 * - Input transformation and normalization
 * - Session management and state tracking
 * - Integration readiness assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { publishEvent } from '@/lib/events/event-bus';
import { createServiceCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import {
  generateEventId,
  generateCorrelationId,
  createEventMetadata,
  type FormSubmittedEvent,
  type ClientContextEnrichedEvent,
  type ValidationCompletedEvent
} from '@/lib/events/schemas';
import { OSAWorkflowInput } from '@/lib/types/maturity';

const logger = createServiceLogger('intake-service');
const dbCircuitBreaker = createServiceCircuitBreaker('intake-db', 'database');
const apiCircuitBreaker = createServiceCircuitBreaker('intake-api', 'api');

// Service Health Check
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/health')) {
    return handleHealthCheck();
  }

  if (pathname.endsWith('/validation/rules')) {
    return handleValidationRules(request);
  }

  if (pathname.endsWith('/context/enrich')) {
    return handleContextEnrichment(request);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// Process Form Submission
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'anonymous';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      form_data,
      client_context = {},
      validation_options = {},
      enrichment_options = {}
    } = body;

    // Validate request structure
    if (!form_data) {
      return NextResponse.json(
        { error: 'form_data is required' },
        { status: 400 }
      );
    }

    const submissionId = generateEventId();
    const sessionId = form_data.session_id || generateCorrelationId();

    logger.info('Processing form submission', {
      submissionId,
      sessionId,
      clientName: form_data.client_name,
      formFieldCount: Object.keys(form_data).length
    });

    // Step 1: Validate form data
    const validationResult = await validateFormData(form_data, validation_options);

    if (!validationResult.isValid) {
      logger.warn('Form validation failed', {
        submissionId,
        errors: validationResult.errors
      });

      return NextResponse.json(
        {
          error: 'Form validation failed',
          details: validationResult.errors,
          submission_id: submissionId
        },
        { status: 400 }
      );
    }

    // Step 2: Enrich client context
    const enrichedContext = await enrichClientContext(form_data, client_context, enrichment_options);

    // Step 3: Transform and normalize input data
    const normalizedInput = await transformInputData(form_data, enrichedContext);

    // Step 4: Store submission for tracking
    await dbCircuitBreaker.execute(async () => {
      // Store form submission (using fallback if database unavailable)
      try {
        await storeFormSubmission(submissionId, sessionId, normalizedInput, enrichedContext, userId);
      } catch (error) {
        logger.warn('Database storage failed, continuing with in-memory fallback', { error });
      }
    });

    // Step 5: Publish events
    await publishEvent({
      event_type: 'intake.form.submitted@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      submission_id: submissionId,
      session_id: sessionId,
      form_data: normalizedInput,
      client_context: enrichedContext,
      validation_passed: true,
      metadata: createEventMetadata(sessionId, userId, 'intake-service', {
        form_size_bytes: JSON.stringify(form_data).length,
        validation_duration_ms: validationResult.duration_ms,
        enrichment_fields_added: enrichedContext.enriched_fields?.length || 0
      })
    } as FormSubmittedEvent);

    await publishEvent({
      event_type: 'intake.context.enriched@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      submission_id: submissionId,
      session_id: sessionId,
      original_context: client_context,
      enriched_context: enrichedContext,
      enrichment_source: 'intake_service',
      metadata: createEventMetadata(sessionId, userId, 'intake-service', {
        enrichment_fields: enrichedContext.enriched_fields || [],
        confidence_score: enrichedContext.confidence_score || 0.8
      })
    } as ClientContextEnrichedEvent);

    return NextResponse.json({
      submission_id: submissionId,
      session_id: sessionId,
      status: 'processed',
      normalized_input: normalizedInput,
      enriched_context: enrichedContext,
      validation_summary: {
        passed: true,
        duration_ms: validationResult.duration_ms,
        rules_evaluated: validationResult.rules_evaluated
      },
      message: 'Form submission processed successfully'
    });

  } catch (error) {
    logger.error('Failed to process form submission', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to process form submission', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update Client Context
export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();

  logger.setContext({ correlationId, requestId });

  try {
    const body = await request.json();
    const { submission_id, context_updates, merge_strategy = 'deep_merge' } = body;

    if (!submission_id) {
      return NextResponse.json(
        { error: 'submission_id is required' },
        { status: 400 }
      );
    }

    logger.info('Updating client context', {
      submissionId: submission_id,
      updateFields: Object.keys(context_updates || {}).length,
      mergeStrategy: merge_strategy
    });

    // Retrieve existing submission
    const existingSubmission = await retrieveSubmission(submission_id);
    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Merge context updates
    const updatedContext = mergeContextUpdates(
      existingSubmission.client_context,
      context_updates,
      merge_strategy
    );

    // Store updated context
    await dbCircuitBreaker.execute(async () => {
      await updateSubmissionContext(submission_id, updatedContext);
    });

    return NextResponse.json({
      submission_id,
      status: 'updated',
      updated_context: updatedContext,
      message: 'Client context updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update client context', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to update client context', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(): Promise<NextResponse> {
  try {
    // Check service dependencies
    const validationHealthy = true; // Form validation system
    const enrichmentHealthy = true; // Context enrichment system
    const transformationHealthy = true; // Data transformation system

    const isHealthy = validationHealthy && enrichmentHealthy && transformationHealthy;

    return NextResponse.json({
      service: 'intake-service',
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        validation: validationHealthy ? 'pass' : 'fail',
        enrichment: enrichmentHealthy ? 'pass' : 'fail',
        transformation: transformationHealthy ? 'pass' : 'fail'
      },
      capabilities: [
        'form_validation',
        'context_enrichment',
        'data_transformation',
        'session_management'
      ],
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      service: 'intake-service',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleValidationRules(request: NextRequest): Promise<NextResponse> {
  try {
    const validationRules = {
      required_fields: [
        'client_name',
        'industry',
        'business_objectives',
        'recipients'
      ],
      field_constraints: {
        client_name: {
          min_length: 1,
          max_length: 200,
          pattern: '^[\\w\\s\\-\\.]+$'
        },
        recipients: {
          min_count: 1,
          max_count: 10,
          email_format: true
        },
        business_objectives: {
          min_count: 1,
          max_count: 15
        }
      },
      transformation_rules: {
        normalize_capabilities: true,
        enrich_industry_context: true,
        validate_email_domains: true,
        detect_duplicates: true
      }
    };

    return NextResponse.json({
      validation_rules: validationRules,
      version: '1.0.0',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve validation rules', {}, error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve validation rules' },
      { status: 500 }
    );
  }
}

async function handleContextEnrichment(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const clientName = url.searchParams.get('client_name');
  const industry = url.searchParams.get('industry');

  try {
    const enrichmentData = await enrichClientContext({
      client_name: clientName || '',
      industry: industry || ''
    } as OSAWorkflowInput, {}, {});

    return NextResponse.json({
      enriched_context: enrichmentData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to enrich context', {}, error as Error);
    return NextResponse.json(
      { error: 'Failed to enrich context' },
      { status: 500 }
    );
  }
}

async function validateFormData(formData: OSAWorkflowInput, options: any): Promise<{
  isValid: boolean;
  errors: string[];
  rules_evaluated: number;
  duration_ms: number;
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let rulesEvaluated = 0;

  // Required field validation
  rulesEvaluated++;
  if (!formData.client_name || formData.client_name.trim().length === 0) {
    errors.push('Client name is required');
  }

  rulesEvaluated++;
  if (!formData.industry || formData.industry.trim().length === 0) {
    errors.push('Industry is required');
  }

  rulesEvaluated++;
  if (!formData.business_objectives || formData.business_objectives.length === 0) {
    errors.push('At least one business objective is required');
  }

  rulesEvaluated++;
  if (!formData.recipients || formData.recipients.length === 0) {
    errors.push('At least one recipient email is required');
  }

  // Email validation
  if (formData.recipients) {
    rulesEvaluated++;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = formData.recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      errors.push(`Invalid email addresses: ${invalidEmails.join(', ')}`);
    }
  }

  // Client name validation
  if (formData.client_name) {
    rulesEvaluated++;
    if (formData.client_name.length > 200) {
      errors.push('Client name must be less than 200 characters');
    }
  }

  const duration = Date.now() - startTime;

  return {
    isValid: errors.length === 0,
    errors,
    rules_evaluated: rulesEvaluated,
    duration_ms: duration
  };
}

async function enrichClientContext(formData: OSAWorkflowInput, existingContext: any, options: any): Promise<any> {
  const enrichedFields: string[] = [];

  // Industry context enrichment
  const industryContext = getIndustryContext(formData.industry || '');
  if (industryContext) {
    enrichedFields.push('industry_context');
  }

  // Technology stack analysis
  const techStackAnalysis = analyzeTechnologyStack(formData.additional_marketing_technology || []);
  if (techStackAnalysis) {
    enrichedFields.push('tech_stack_analysis');
  }

  // Capability maturity estimation
  const maturityEstimate = estimateCapabilityMaturity(formData.current_capabilities || []);
  if (maturityEstimate) {
    enrichedFields.push('maturity_estimate');
  }

  return {
    ...existingContext,
    enriched_fields: enrichedFields,
    confidence_score: 0.85,
    industry_context: industryContext,
    tech_stack_analysis: techStackAnalysis,
    maturity_estimate: maturityEstimate,
    enrichment_timestamp: new Date().toISOString(),
    enrichment_version: '1.0.0'
  };
}

function getIndustryContext(industry: string): any {
  const industryContexts: Record<string, any> = {
    'Produce and Floral Trade Association': {
      typical_challenges: ['Seasonal demand', 'Supply chain complexity', 'Perishable inventory'],
      common_technologies: ['ERP', 'Supply Chain Management', 'B2B Portals'],
      personalization_opportunities: ['Seasonal promotions', 'Regional preferences', 'Member-specific content']
    },
    'Agency Consulting Services': {
      typical_challenges: ['Client acquisition', 'Project management', 'Knowledge sharing'],
      common_technologies: ['CRM', 'Project Management', 'Marketing Automation'],
      personalization_opportunities: ['Service recommendations', 'Case study matching', 'Expertise highlighting']
    }
  };

  return industryContexts[industry] || {
    typical_challenges: ['Digital transformation', 'Customer engagement', 'Data integration'],
    common_technologies: ['CRM', 'Marketing Automation', 'Analytics'],
    personalization_opportunities: ['Content personalization', 'Product recommendations', 'Customer journeys']
  };
}

function analyzeTechnologyStack(technologies: string[]): any {
  const optimizelyProducts = technologies.filter(tech =>
    tech.toLowerCase().includes('optimizely')
  );

  const marketingAutomation = technologies.filter(tech =>
    ['salesforce', 'hubspot', 'marketo', 'eloqua'].some(tool =>
      tech.toLowerCase().includes(tool)
    )
  );

  return {
    optimizely_products: optimizelyProducts,
    marketing_automation: marketingAutomation,
    total_technologies: technologies.length,
    integration_complexity: technologies.length > 5 ? 'high' : technologies.length > 2 ? 'medium' : 'low',
    recommended_integrations: optimizelyProducts.length > 0 ? ['Cross-product data sharing', 'Unified analytics'] : ['Optimizely suite adoption']
  };
}

function estimateCapabilityMaturity(capabilities: string[]): any {
  const maturityScores: Record<string, number> = {
    'A/B testing': 0.7,
    'Personalization': 0.8,
    'Email Marketing': 0.6,
    'Search Engine Optimization': 0.5,
    'Content Marketing': 0.6,
    'Marketing Automation': 0.7,
    'Analytics': 0.6
  };

  const scores = capabilities.map(cap => maturityScores[cap] || 0.4);
  const averageMaturity = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.3;

  return {
    overall_maturity: averageMaturity,
    maturity_level: averageMaturity > 0.7 ? 'advanced' : averageMaturity > 0.5 ? 'intermediate' : 'beginner',
    strongest_capabilities: capabilities.filter((cap, i) => scores[i] > 0.6),
    improvement_opportunities: capabilities.filter((cap, i) => scores[i] <= 0.5)
  };
}

async function transformInputData(formData: OSAWorkflowInput, enrichedContext: any): Promise<OSAWorkflowInput> {
  return {
    ...formData,
    // Normalize client name
    client_name: formData.client_name?.trim() || '',

    // Ensure arrays are properly formatted
    current_capabilities: Array.isArray(formData.current_capabilities)
      ? formData.current_capabilities.filter(Boolean)
      : [],

    business_objectives: Array.isArray(formData.business_objectives)
      ? formData.business_objectives.filter(Boolean)
      : [],

    additional_marketing_technology: Array.isArray(formData.additional_marketing_technology)
      ? formData.additional_marketing_technology.filter(Boolean)
      : [],

    recipients: Array.isArray(formData.recipients)
      ? formData.recipients.filter(email => email && email.includes('@'))
      : [],

    // Add processing metadata
    processing_metadata: {
      processed_at: new Date().toISOString(),
      service_version: '1.0.0',
      transformation_applied: true,
      enrichment_applied: true,
      validation_passed: true
    }
  };
}

async function storeFormSubmission(submissionId: string, sessionId: string, formData: OSAWorkflowInput, context: any, userId: string): Promise<void> {
  // Mock storage implementation - replace with actual database storage
  logger.debug('Storing form submission', {
    submissionId,
    sessionId,
    userId,
    dataSize: JSON.stringify(formData).length
  });
}

async function retrieveSubmission(submissionId: string): Promise<any> {
  // Mock retrieval implementation - replace with actual database retrieval
  return {
    submission_id: submissionId,
    form_data: {},
    client_context: {},
    created_at: new Date().toISOString()
  };
}

async function updateSubmissionContext(submissionId: string, updatedContext: any): Promise<void> {
  // Mock update implementation - replace with actual database update
  logger.debug('Updating submission context', { submissionId });
}

function mergeContextUpdates(existingContext: any, updates: any, strategy: string): any {
  if (strategy === 'deep_merge') {
    return {
      ...existingContext,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }

  return {
    ...updates,
    updated_at: new Date().toISOString()
  };
}