/**
 * Orchestration Service - OPAL Workflow Management
 *
 * Handles OPAL webhooks, agent orchestration, retries, partial results, and status events.
 * Serves as the primary data ingestion pipeline for Optimizely data within the OSA ecosystem.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { publishEvent, subscribeToEvents } from '@/lib/events/event-bus';
import { createServiceCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import {
  generateEventId,
  generateCorrelationId,
  createEventMetadata,
  type WorkflowTriggeredEvent,
  type AgentCompletedEvent,
  type WorkflowCompletedEvent
} from '@/lib/events/schemas';
import { supabase } from '@/lib/supabase';

const logger = createServiceLogger('orchestration-service');
const opalCircuitBreaker = createServiceCircuitBreaker('opal', 'external');
const dbCircuitBreaker = createServiceCircuitBreaker('orchestration-db', 'database');

// OPAL Agent Configuration
const OPAL_AGENTS = {
  content_review: {
    name: 'Content Review Agent',
    description: 'Analyzes experiment content and variations',
    timeout: 120000, // 2 minutes
    dependencies: []
  },
  geo_audit: {
    name: 'Geographic Audit Agent',
    description: 'Evaluates geographic performance distribution',
    timeout: 90000, // 1.5 minutes
    dependencies: []
  },
  audience_suggester: {
    name: 'Audience Suggester Agent',
    description: 'Analyzes audience segment performance',
    timeout: 120000, // 2 minutes
    dependencies: ['content_review']
  },
  experiment_blueprinter: {
    name: 'Experiment Blueprinter Agent',
    description: 'Creates detailed experiment plans',
    timeout: 150000, // 2.5 minutes
    dependencies: ['content_review', 'geo_audit']
  },
  personalization_idea_generator: {
    name: 'Personalization Idea Generator',
    description: 'Generates personalization strategies',
    timeout: 120000, // 2 minutes
    dependencies: ['audience_suggester']
  }
} as const;

// Service Health Check
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/health')) {
    return handleHealthCheck();
  }

  if (pathname.endsWith('/status')) {
    return handleStatusCheck(request);
  }

  if (pathname.endsWith('/workflows')) {
    return handleListWorkflows(request);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// Trigger New Workflow
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'system';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      trigger_source = 'api',
      intake_id,
      priority = 'normal',
      agents = Object.keys(OPAL_AGENTS),
      execution_data
    } = body;

    // Validate request
    if (!execution_data) {
      return NextResponse.json(
        { error: 'execution_data is required' },
        { status: 400 }
      );
    }

    // Create workflow
    const workflowId = generateEventId();
    const sessionId = execution_data.session_id || generateCorrelationId();

    logger.info('Creating new workflow', {
      workflowId,
      sessionId,
      triggerSource: trigger_source,
      agentCount: agents.length
    });

    // Store workflow in database
    await dbCircuitBreaker.execute(async () => {
      const { error } = await supabase
        .from('opal_workflow_executions')
        .insert({
          id: workflowId,
          session_id: sessionId,
          trigger_source,
          status: 'pending',
          agents_scheduled: agents,
          execution_data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    });

    // Publish workflow triggered event
    await publishEvent({
      event_type: 'orchestration.workflow.triggered@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      workflow_id: workflowId,
      trigger_source,
      agents_scheduled: agents,
      intake_id,
      priority,
      metadata: createEventMetadata(sessionId, userId, 'orchestration-service', {
        estimated_duration_ms: estimateWorkflowDuration(agents),
        retry_count: 0
      })
    } as WorkflowTriggeredEvent);

    // Start workflow execution asynchronously
    executeWorkflowAsync(workflowId, agents, execution_data, sessionId, correlationId, userId);

    return NextResponse.json({
      workflow_id: workflowId,
      session_id: sessionId,
      status: 'triggered',
      agents_scheduled: agents,
      estimated_duration_ms: estimateWorkflowDuration(agents),
      message: 'Workflow triggered successfully'
    });

  } catch (error) {
    logger.error('Failed to trigger workflow', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to trigger workflow', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update Workflow Status (for OPAL webhook callbacks)
export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();

  logger.setContext({ correlationId, requestId });

  try {
    const body = await request.json();
    const { workflow_id, agent_id, status, results, error_message } = body;

    if (!workflow_id) {
      return NextResponse.json(
        { error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    logger.info('Updating workflow status', {
      workflowId: workflow_id,
      agentId: agent_id,
      status
    });

    // Update agent status in database
    await dbCircuitBreaker.execute(async () => {
      if (agent_id) {
        // Update specific agent
        const { error } = await supabase
          .from('opal_agent_executions')
          .upsert({
            workflow_id,
            agent_id,
            agent_name: OPAL_AGENTS[agent_id as keyof typeof OPAL_AGENTS]?.name || agent_id,
            status,
            results: results || {},
            error_message,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Publish agent completed event
        await publishEvent({
          event_type: 'orchestration.agent.completed@1',
          event_id: generateEventId(),
          correlation_id: correlationId,
          timestamp: new Date().toISOString(),
          version: 1,
          workflow_id,
          agent_id,
          agent_name: OPAL_AGENTS[agent_id as keyof typeof OPAL_AGENTS]?.name || agent_id,
          success: status === 'completed',
          results: results || {},
          execution_time_ms: 0, // Would be calculated from start time
          metadata: createEventMetadata('system', undefined, 'orchestration-service', {
            error_message,
            retry_count: 0,
            output_size_bytes: JSON.stringify(results || {}).length
          })
        } as AgentCompletedEvent);

      } else {
        // Update overall workflow
        const { error } = await supabase
          .from('opal_workflow_executions')
          .update({
            status,
            error_message,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflow_id);

        if (error) throw error;

        if (status === 'completed' || status === 'failed') {
          // Get all agent results
          const { data: agents, error: agentsError } = await supabase
            .from('opal_agent_executions')
            .select('*')
            .eq('workflow_id', workflow_id);

          if (agentsError) throw agentsError;

          // Publish workflow completed event
          await publishEvent({
            event_type: 'orchestration.workflow.completed@1',
            event_id: generateEventId(),
            correlation_id: correlationId,
            timestamp: new Date().toISOString(),
            version: 1,
            workflow_id,
            success: status === 'completed',
            agent_results: agents?.map(agent => ({
              agent_id: agent.agent_id,
              agent_name: agent.agent_name,
              success: agent.status === 'completed',
              results: agent.results || {},
              execution_time_ms: 0, // Would be calculated
              error_message: agent.error_message
            })) || [],
            total_execution_time_ms: 0, // Would be calculated
            metadata: createEventMetadata('system', undefined, 'orchestration-service', {
              failed_agents: agents?.filter(a => a.status === 'failed').map(a => a.agent_id) || [],
              success_rate: agents ? agents.filter(a => a.status === 'completed').length / agents.length : 0,
              total_agents: agents?.length || 0
            })
          } as WorkflowCompletedEvent);
        }
      }
    });

    return NextResponse.json({
      workflow_id,
      status: 'updated',
      message: 'Workflow status updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update workflow status', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to update workflow status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(): Promise<NextResponse> {
  try {
    // Check database connection
    const { error: dbError } = await supabase
      .from('opal_workflow_executions')
      .select('id')
      .limit(1);

    // Check OPAL API connection (mock for now)
    const opalHealthy = true; // Would make actual health check to OPAL

    const isHealthy = !dbError && opalHealthy;

    return NextResponse.json({
      service: 'orchestration-service',
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        database: dbError ? 'fail' : 'pass',
        opal_api: opalHealthy ? 'pass' : 'fail'
      },
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      service: 'orchestration-service',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleStatusCheck(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflow_id');
  const sessionId = url.searchParams.get('session_id');

  try {
    let query = supabase.from('opal_workflow_executions').select(`
      *,
      opal_agent_executions(*)
    `);

    if (workflowId) {
      query = query.eq('id', workflowId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      // Get recent workflows
      query = query.order('created_at', { ascending: false }).limit(10);
    }

    const { data: workflows, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      workflows: workflows || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get workflow status', { workflowId, sessionId }, error as Error);

    return NextResponse.json(
      { error: 'Failed to get workflow status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleListWorkflows(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const status = url.searchParams.get('status');

  try {
    let query = supabase
      .from('opal_workflow_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: workflows, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      workflows: workflows || [],
      count: workflows?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to list workflows', {}, error as Error);

    return NextResponse.json(
      { error: 'Failed to list workflows', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function executeWorkflowAsync(
  workflowId: string,
  agents: string[],
  executionData: any,
  sessionId: string,
  correlationId: string,
  userId: string
): Promise<void> {
  try {
    logger.info('Starting workflow execution', { workflowId, agentCount: agents.length });

    // Update workflow status to running
    await dbCircuitBreaker.execute(async () => {
      await supabase
        .from('opal_workflow_executions')
        .update({
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    });

    // Execute agents in parallel (simplified version - real implementation would handle dependencies)
    const agentPromises = agents.map(agentId =>
      executeAgent(workflowId, agentId, executionData, sessionId, correlationId)
    );

    const results = await Promise.allSettled(agentPromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    // Update final workflow status
    const finalStatus = failureCount === 0 ? 'completed' : (successCount > 0 ? 'partially_completed' : 'failed');

    await dbCircuitBreaker.execute(async () => {
      await supabase
        .from('opal_workflow_executions')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    });

    logger.info('Workflow execution completed', {
      workflowId,
      finalStatus,
      successCount,
      failureCount
    });

  } catch (error) {
    logger.error('Workflow execution failed', { workflowId }, error as Error);

    // Mark workflow as failed
    await dbCircuitBreaker.execute(async () => {
      await supabase
        .from('opal_workflow_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    });
  }
}

async function executeAgent(
  workflowId: string,
  agentId: string,
  executionData: any,
  sessionId: string,
  correlationId: string
): Promise<void> {
  const agentConfig = OPAL_AGENTS[agentId as keyof typeof OPAL_AGENTS];
  if (!agentConfig) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  logger.info('Starting agent execution', { workflowId, agentId, agentName: agentConfig.name });

  try {
    // Create agent execution record
    await dbCircuitBreaker.execute(async () => {
      await supabase
        .from('opal_agent_executions')
        .insert({
          workflow_id: workflowId,
          agent_id: agentId,
          agent_name: agentConfig.name,
          status: 'running',
          started_at: new Date().toISOString()
        });
    });

    // Mock agent execution (in real implementation, this would call OPAL API)
    await opalCircuitBreaker.execute(async () => {
      // Simulate agent processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));

      // Mock results
      const mockResults = {
        agent_id: agentId,
        insights: [`Mock insight from ${agentConfig.name}`, 'Additional analysis results'],
        recommendations: [`Recommendation from ${agentConfig.name}`],
        metadata: {
          processed_at: new Date().toISOString(),
          execution_time_ms: Math.floor(Math.random() * 5000 + 2000),
          confidence_score: Math.random() * 0.3 + 0.7 // 0.7-1.0
        }
      };

      // Update agent status
      await supabase
        .from('opal_agent_executions')
        .update({
          status: 'completed',
          results: mockResults,
          completed_at: new Date().toISOString()
        })
        .eq('workflow_id', workflowId)
        .eq('agent_id', agentId);

      // Publish agent completed event
      await publishEvent({
        event_type: 'orchestration.agent.completed@1',
        event_id: generateEventId(),
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        version: 1,
        workflow_id: workflowId,
        agent_id: agentId,
        agent_name: agentConfig.name,
        success: true,
        results: mockResults,
        execution_time_ms: mockResults.metadata.execution_time_ms,
        metadata: createEventMetadata(sessionId, 'system', 'orchestration-service', {
          retry_count: 0,
          output_size_bytes: JSON.stringify(mockResults).length
        })
      } as AgentCompletedEvent);
    });

    logger.info('Agent execution completed', { workflowId, agentId });

  } catch (error) {
    logger.error('Agent execution failed', { workflowId, agentId }, error as Error);

    // Update agent status to failed
    await dbCircuitBreaker.execute(async () => {
      await supabase
        .from('opal_agent_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString()
        })
        .eq('workflow_id', workflowId)
        .eq('agent_id', agentId);
    });

    throw error;
  }
}

function estimateWorkflowDuration(agents: string[]): number {
  // Estimate based on agent timeouts and parallel execution
  const maxTimeout = Math.max(...agents.map(agentId =>
    OPAL_AGENTS[agentId as keyof typeof OPAL_AGENTS]?.timeout || 120000
  ));

  // Add buffer for coordination overhead
  return maxTimeout + 30000; // Add 30 seconds buffer
}