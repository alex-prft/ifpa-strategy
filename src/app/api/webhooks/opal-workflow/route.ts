import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OPALAgentClient } from '@/lib/integrations/opal-agent-client';
import { OSAWorkflowInput } from '@/lib/types/maturity';
import { opalDataStore, OpalAgentResult } from '@/lib/opal/supabase-data-store';
import { validateWebhookAuth, validateWebhookConfig } from '@/lib/security/webhook-auth';
import { opalApiWithRetry, fetchWithRetry } from '@/lib/utils/retry';
import { withCircuitBreaker, CircuitBreakerConfigs } from '@/lib/utils/circuit-breaker';
import { webhookEventOperations } from '@/lib/database/webhook-events';

interface OpalWebhookPayload {
  event_type: 'workflow.completed' | 'workflow.failed' | 'workflow.triggered' | 'agent.completed';
  workflow_id: string;
  workflow_name: string;
  timestamp: string;

  // For agent completion events
  agent_id?: string;
  agent_name?: string;
  agent_output?: any;
  agent_success?: boolean;
  agent_error?: string;
  execution_time_ms?: number;

  // For workflow completion events
  data?: {
    audience_data?: any;
    experiment_data?: any;
    content_data?: any;
    personalization_data?: any;
    campaign_data?: any;
  };
  trigger_source?: 'schedule' | 'api' | 'event' | 'manual';
  metadata?: {
    client_id?: string;
    project_id?: string;
    environment?: string;
    user_id?: string;
    session_id?: string;
  };
}

interface OpalWorkflowTriggerRequest {
  workflow_name: string;
  input_data: OSAWorkflowInput;
  trigger_source?: string;
  metadata?: {
    client_id?: string;
    project_id?: string;
    user_id?: string;
  };
}

// Validate webhook configuration on startup
const webhookConfig = validateWebhookConfig();
if (!webhookConfig.valid) {
  console.error('⚠️ Webhook security configuration errors:', webhookConfig.errors);
  if (webhookConfig.warnings.length > 0) {
    console.warn('⚠️ Webhook security warnings:', webhookConfig.warnings);
  }
}

// POST: Receive webhook from Optimizely Opal
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookEventId: string | null = null;

  try {
    console.log('🔄 OPAL Workflow webhook received');

    const body = await request.text();

    // Validate webhook authentication using secure module
    const authToken = process.env.OPAL_WEBHOOK_AUTH_KEY;
    const hmacSecret = process.env.OPAL_WEBHOOK_HMAC_SECRET;
    const allowedIPs = process.env.OPAL_ALLOWED_IPS?.split(',').map(ip => ip.trim());

    if (!authToken) {
      console.error('❌ Webhook authentication not configured - OPAL_WEBHOOK_AUTH_KEY missing');

      // Store failed webhook event
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'webhook.authentication_error',
        workflow_id: 'unknown',
        received_at: new Date().toISOString(),
        payload: { error: 'Missing auth token' },
        success: false,
        error_message: 'OPAL_WEBHOOK_AUTH_KEY missing',
        processing_time_ms: Date.now() - startTime,
        source_ip: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || undefined
      });

      return NextResponse.json(
        {
          error: 'Webhook authentication not configured',
          message: 'OPAL_WEBHOOK_AUTH_KEY environment variable is required'
        },
        { status: 500 }
      );
    }

    const authResult = validateWebhookAuth(
      {
        headers: request.headers,
        body,
        ip: request.ip
      },
      {
        authToken,
        hmacSecret,
        allowedIPs,
        maxAge: 300 // 5 minutes
      }
    );

    if (!authResult.valid) {
      console.error('❌ Webhook authentication failed:', {
        error: authResult.error,
        method: authResult.details?.method,
        ip: request.ip || 'unknown'
      });

      // Store failed webhook event
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'webhook.authentication_failed',
        workflow_id: 'unknown',
        received_at: new Date().toISOString(),
        payload: { error: authResult.error },
        success: false,
        error_message: authResult.error,
        processing_time_ms: Date.now() - startTime,
        source_ip: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || undefined
      });

      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: authResult.error
        },
        { status: 401 }
      );
    }

    console.log('✅ Webhook authentication successful:', {
      method: authResult.details?.method,
      ip: request.ip || 'unknown'
    });

    let payload: OpalWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON payload:', error);

      // Store failed webhook event
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'webhook.parse_error',
        workflow_id: 'unknown',
        received_at: new Date().toISOString(),
        payload: { raw_body: body },
        success: false,
        error_message: error instanceof Error ? error.message : 'JSON parse failed',
        processing_time_ms: Date.now() - startTime,
        source_ip: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || undefined
      });

      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('Opal webhook payload:', {
      event_type: payload.event_type,
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      trigger_source: payload.trigger_source
    });

    // Store successful webhook event reception
    webhookEventId = await webhookEventOperations.storeWebhookEvent({
      event_type: payload.event_type,
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      session_id: payload.metadata?.session_id,
      received_at: payload.timestamp,
      payload: payload,
      success: true,
      processing_time_ms: Date.now() - startTime,
      source_ip: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || undefined
    });

    // Initialize Opal Agent Client
    const opalClient = new OPALAgentClient();

    // Process different event types
    switch (payload.event_type) {
      case 'workflow.completed':
        await handleWorkflowCompleted(payload, opalClient, webhookEventId);
        break;

      case 'workflow.failed':
        await handleWorkflowFailed(payload, opalClient, webhookEventId);
        break;

      case 'workflow.triggered':
        await handleWorkflowTriggered(payload, opalClient, webhookEventId);
        break;

      case 'agent.completed':
        await handleAgentCompleted(payload, opalClient, webhookEventId);
        break;

      default:
        console.log(`Unhandled event type: ${payload.event_type}`);
        // Update webhook event with warning about unhandled event type
        await webhookEventOperations.storeWebhookEvent({
          event_type: `${payload.event_type}.unhandled`,
          workflow_id: payload.workflow_id,
          workflow_name: payload.workflow_name,
          received_at: new Date().toISOString(),
          payload: payload,
          success: true,
          error_message: `Unhandled event type: ${payload.event_type}`,
          processing_time_ms: Date.now() - startTime,
          source_ip: request.ip || 'unknown',
          user_agent: request.headers.get('user-agent') || undefined
        });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${payload.event_type} event`,
      workflow_id: payload.workflow_id,
      webhook_event_id: webhookEventId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Opal Workflow webhook error:', error);

    // Store failed webhook event if we have enough info
    if (webhookEventId) {
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'webhook.processing_error',
        workflow_id: 'unknown',
        received_at: new Date().toISOString(),
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
        source_ip: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || undefined
      });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Trigger Opal workflow from the engine
export async function PUT(request: NextRequest) {
  try {
    console.log('Triggering Opal Workflow from engine');

    const triggerRequest: OpalWorkflowTriggerRequest = await request.json();

    // Validate required fields
    if (!triggerRequest.workflow_name || !triggerRequest.input_data) {
      return NextResponse.json(
        { error: 'Missing required fields: workflow_name, input_data' },
        { status: 400 }
      );
    }

    // Initialize Opal Agent Client
    const opalClient = new OPALAgentClient();

    // Trigger the workflow
    const workflowResult = await triggerOpalWorkflow(triggerRequest, opalClient);

    console.log('Opal Workflow triggered successfully:', {
      workflow_name: triggerRequest.workflow_name,
      workflow_id: workflowResult.workflow_id
    });

    return NextResponse.json({
      success: true,
      message: 'Opal Workflow triggered successfully',
      workflow_id: workflowResult.workflow_id,
      workflow_name: triggerRequest.workflow_name,
      trigger_source: triggerRequest.trigger_source || 'api',
      timestamp: new Date().toISOString(),
      data: workflowResult
    });

  } catch (error) {
    console.error('Opal Workflow trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger Opal Workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleWorkflowCompleted(payload: OpalWebhookPayload, opalClient: OPALAgentClient, webhookEventId?: string) {
  console.log(`Workflow completed: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Update workflow status in our data store
    opalDataStore.updateWorkflowStatus(payload.workflow_id, 'completed');

    console.log('Workflow marked as completed in data store:', {
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name
    });

    // Store workflow results if provided
    if (payload.data) {
      // Process and store data from different agents if structured properly
      console.log('Processing workflow completion data:', Object.keys(payload.data));
    }

    // Send notification about completion
    if (payload.metadata?.client_id) {
      try {
        await opalClient.sendNotification({
          to: ['workflow-notifications@ifpa.org'],
          plan_title: `Opal Workflow Completed: ${payload.workflow_name}`,
          cmp_url: '#',
          plan_summary: `The workflow "${payload.workflow_name}" has completed successfully. All agent results are now available.`,
          sender_name: 'Opal System'
        });
      } catch (notificationError) {
        console.error('Failed to send workflow completion notification:', notificationError);

        // Log notification failure as separate event
        await webhookEventOperations.storeWebhookEvent({
          event_type: 'workflow.notification_failed',
          workflow_id: payload.workflow_id,
          workflow_name: payload.workflow_name,
          received_at: new Date().toISOString(),
          payload: { notification_error: notificationError instanceof Error ? notificationError.message : 'Unknown error' },
          success: false,
          error_message: `Notification failed: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
        });
      }
    }

    // Check if all agents have completed for this workflow
    const workflow = opalDataStore.getWorkflow(payload.workflow_id);
    if (workflow) {
      const completedAgents = Object.keys(workflow.results).filter(key => workflow.results[key]?.success);

      console.log('Workflow completion check:', {
        completed: completedAgents.length,
        completedAgents
      });

      if (completedAgents.length > 0) {
        console.log(`${completedAgents.length} agents completed successfully!`);
        // The user could be redirected to results at this point if we implement SSE or WebSocket notifications

        // Log successful completion processing
        await webhookEventOperations.storeWebhookEvent({
          event_type: 'workflow.completion_processed',
          workflow_id: payload.workflow_id,
          workflow_name: payload.workflow_name,
          received_at: new Date().toISOString(),
          payload: { completed_agents: completedAgents.length, agent_list: completedAgents },
          success: true
        });
      }
    }

  } catch (error) {
    console.error('Error handling workflow completion:', error);

    // Log processing error
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'workflow.completion_error',
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      received_at: new Date().toISOString(),
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleWorkflowFailed(payload: OpalWebhookPayload, opalClient: OPALAgentClient, webhookEventId?: string) {
  console.error(`Workflow failed: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Update workflow status in our data store
    opalDataStore.updateWorkflowStatus(payload.workflow_id, 'failed');

    // Log failure details
    const failureData = {
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      failed_at: payload.timestamp,
      error_data: payload.data,
      metadata: payload.metadata
    };

    console.error('Workflow failure details:', failureData);

    // Store detailed failure event
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'workflow.failure_processed',
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      received_at: new Date().toISOString(),
      payload: failureData,
      success: true // Successfully processed the failure event
    });

    // Send failure notification
    if (payload.metadata?.client_id) {
      try {
        await opalClient.sendNotification({
          to: ['workflow-alerts@ifpa.org'],
          plan_title: `Opal Workflow Failed: ${payload.workflow_name}`,
          cmp_url: '#',
          plan_summary: `The workflow "${payload.workflow_name}" has failed. Please check the logs for details and try again.`,
          sender_name: 'Opal System'
        });

        // Log successful notification
        await webhookEventOperations.storeWebhookEvent({
          event_type: 'workflow.failure_notification_sent',
          workflow_id: payload.workflow_id,
          workflow_name: payload.workflow_name,
          received_at: new Date().toISOString(),
          payload: { notification_sent: true },
          success: true
        });
      } catch (notificationError) {
        console.error('Failed to send workflow failure notification:', notificationError);

        // Log notification failure
        await webhookEventOperations.storeWebhookEvent({
          event_type: 'workflow.failure_notification_failed',
          workflow_id: payload.workflow_id,
          workflow_name: payload.workflow_name,
          received_at: new Date().toISOString(),
          payload: { notification_error: notificationError instanceof Error ? notificationError.message : 'Unknown error' },
          success: false,
          error_message: `Notification failed: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
        });
      }
    }
  } catch (error) {
    console.error('Error handling workflow failure:', error);

    // Log processing error
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'workflow.failure_processing_error',
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      received_at: new Date().toISOString(),
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleWorkflowTriggered(payload: OpalWebhookPayload, opalClient: OPALAgentClient, webhookEventId?: string) {
  console.log(`Workflow triggered: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Update workflow status in our data store
    opalDataStore.updateWorkflowStatus(payload.workflow_id, 'running');

    // Log trigger event
    const triggerData = {
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      triggered_at: payload.timestamp,
      trigger_source: payload.trigger_source,
      metadata: payload.metadata
    };

    console.log('Workflow trigger event:', triggerData);

    // Store trigger processing event
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'workflow.trigger_processed',
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      received_at: new Date().toISOString(),
      payload: triggerData,
      success: true
    });

    // Optionally pull initial data or set up monitoring
    if (payload.trigger_source === 'schedule') {
      console.log('Scheduled workflow triggered, setting up monitoring...');

      // Log scheduled trigger
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'workflow.scheduled_trigger',
        workflow_id: payload.workflow_id,
        workflow_name: payload.workflow_name,
        received_at: new Date().toISOString(),
        payload: { trigger_source: 'schedule', monitoring_setup: true },
        success: true
      });
    }
  } catch (error) {
    console.error('Error handling workflow trigger:', error);

    // Log processing error
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'workflow.trigger_processing_error',
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      received_at: new Date().toISOString(),
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleAgentCompleted(payload: OpalWebhookPayload, opalClient: OPALAgentClient, webhookEventId?: string) {
  console.log(`Agent completed: ${payload.agent_name} (${payload.agent_id}) for workflow ${payload.workflow_id}`);

  try {
    // Validate required agent fields
    if (!payload.agent_id || !payload.agent_name) {
      console.error('Invalid agent completion payload: missing agent_id or agent_name');

      // Log validation error
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'agent.validation_error',
        workflow_id: payload.workflow_id,
        agent_id: payload.agent_id,
        agent_name: payload.agent_name,
        received_at: new Date().toISOString(),
        payload: { validation_error: 'missing agent_id or agent_name' },
        success: false,
        error_message: 'Invalid agent completion payload: missing agent_id or agent_name'
      });
      return;
    }

    // Create agent result object
    const agentResult: OpalAgentResult = {
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      output: payload.agent_output,
      success: payload.agent_success ?? false,
      error: payload.agent_error,
      execution_time_ms: payload.execution_time_ms ?? 0,
      timestamp: payload.timestamp
    };

    // Add agent result to workflow in data store
    opalDataStore.addAgentResult(payload.workflow_id, payload.agent_id, agentResult);

    console.log('Agent result stored:', {
      workflow_id: payload.workflow_id,
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      success: agentResult.success
    });

    // Store agent completion processing event
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'agent.completion_processed',
      workflow_id: payload.workflow_id,
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      received_at: new Date().toISOString(),
      payload: {
        agent_result: agentResult,
        processing_success: true
      },
      success: true
    });

    // Check if agents have completed
    const workflow = opalDataStore.getWorkflow(payload.workflow_id);
    if (workflow) {
      const completedAgents = Object.keys(workflow.results).filter(key => workflow.results[key]?.success);

      console.log('Agent completion progress:', {
        workflow_id: payload.workflow_id,
        completed: completedAgents.length,
        completedAgents,
        latestAgent: payload.agent_name
      });

      // Store progress update
      await webhookEventOperations.storeWebhookEvent({
        event_type: 'agent.progress_update',
        workflow_id: payload.workflow_id,
        agent_id: payload.agent_id,
        agent_name: payload.agent_name,
        received_at: new Date().toISOString(),
        payload: {
          completed_agents_count: completedAgents.length,
          completed_agents: completedAgents,
          latest_agent: payload.agent_name
        },
        success: true
      });

      // For now, just log completion progress
      if (completedAgents.length > 0) {
        console.log(`${completedAgents.length} agents completed for workflow ${payload.workflow_id}`);

        // Here we could trigger a user notification or redirect
        // For now, they'll get the data when they poll or refresh
      }
    }

  } catch (error) {
    console.error('Error handling agent completion:', error);

    // Log processing error
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'agent.completion_processing_error',
      workflow_id: payload.workflow_id,
      agent_id: payload.agent_id,
      agent_name: payload.agent_name,
      received_at: new Date().toISOString(),
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


async function triggerOpalWorkflow(
  triggerRequest: OpalWorkflowTriggerRequest,
  opalClient: OPALAgentClient
): Promise<any> {
  try {
    // Prepare workflow payload for Opal API
    const workflowPayload = {
      workflow_name: triggerRequest.workflow_name,
      input_data: triggerRequest.input_data,
      trigger_source: triggerRequest.trigger_source || 'api',
      metadata: {
        ...triggerRequest.metadata,
        triggered_at: new Date().toISOString(),
        engine_version: '1.0.0'
      }
    };

    // Check if we have Opal API credentials
    const opalApiUrl = process.env.OPAL_API_URL || process.env.NEXT_PUBLIC_OPAL_API_URL;
    const opalApiToken = process.env.OPAL_API_TOKEN;
    const opalWorkflowId = process.env.OPAL_WORKFLOW_ID || '3a620654-64e6-4e90-8c78-326dd4c81fac';
    const opalWebhookUrl = 'https://webhook.opal.optimizely.com/webhooks/89019f3c31de4caca435e995d9089813/825e1edf-fd07-460e-a123-aab99ed78c2b';

    if (!opalApiUrl || !opalApiToken) {
      console.log('Opal API credentials not found, running in simulation mode');
      console.log('Missing credentials:', {
        opalApiUrl: opalApiUrl ? 'present' : 'missing',
        opalApiToken: opalApiToken ? 'present' : 'missing',
        workflowId: opalWorkflowId
      });

      // Return simulated response when credentials are missing
      const simulatedWorkflowId = `sim-opal-wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Trigger simulated agent responses after a delay
      setTimeout(async () => {
        await simulateOpalAgentResponses(simulatedWorkflowId, triggerRequest.input_data);
      }, 2000);

      return {
        workflow_id: simulatedWorkflowId,
        status: 'triggered',
        message: 'Workflow triggered successfully (simulation mode)',
        estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
        simulation_mode: true
      };
    }

    // Real Opal API call with retry mechanism
    console.log('🚀 Making OPAL API call with retry:', {
      url: `${opalApiUrl}/workflows/${opalWorkflowId}/trigger`,
      workflow_name: triggerRequest.workflow_name
    });

    const opalResponse = await withCircuitBreaker(
      'OPAL_API',
      async () => {
        return opalApiWithRetry(async () => {
          return fetchWithRetry(`${opalApiUrl}/workflows/${opalWorkflowId}/trigger`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${opalApiToken}`,
              'Content-Type': 'application/json',
              'X-Webhook-URL': `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`
            },
            body: JSON.stringify({
              input: workflowPayload.input_data,
              metadata: workflowPayload.metadata,
              webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`
            })
          }, {
            maxAttempts: 3,
            onRetry: (error, attempt, delay) => {
              console.warn(`⚠️ OPAL API attempt ${attempt} failed: ${error.message}, retrying in ${delay}ms`);
            }
          });
        }, {
          operationName: `OPAL workflow trigger (${triggerRequest.workflow_name})`
        });
      },
      {
        name: 'OPAL_API',
        ...CircuitBreakerConfigs.OPAL_API,
        onStateChange: (state) => {
          console.log(`🔄 OPAL API circuit breaker state changed to: ${state}`);
        }
      }
    );

    if (!opalResponse.ok) {
      throw new Error(`Opal API error: ${opalResponse.status} - ${opalResponse.statusText}`);
    }

    const opalResult = await opalResponse.json();

    console.log('Opal Workflow triggered successfully:', {
      workflow_id: opalResult.workflow_id || opalResult.id,
      status: opalResult.status,
      opal_response: opalResult
    });

    return {
      workflow_id: opalResult.workflow_id || opalResult.id,
      status: 'triggered',
      message: 'Real Opal workflow triggered successfully',
      estimated_completion: opalResult.estimated_completion || new Date(Date.now() + 300000).toISOString(),
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
      opal_data: opalResult
    };

  } catch (error) {
    console.error('Error triggering Opal Workflow:', error);

    // Fallback to simulation mode on error
    console.log('Falling back to simulation mode due to error');
    const fallbackWorkflowId = `fallback-opal-wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Trigger simulated agent responses after a delay
    setTimeout(async () => {
      await simulateOpalAgentResponses(fallbackWorkflowId, triggerRequest.input_data);
    }, 2000);

    return {
      workflow_id: fallbackWorkflowId,
      status: 'triggered',
      message: 'Workflow triggered in fallback simulation mode',
      estimated_completion: new Date(Date.now() + 300000).toISOString(),
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
      simulation_mode: true,
      fallback_reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Simulate Opal agent responses for demo/fallback mode
async function simulateOpalAgentResponses(workflowId: string, inputData: any) {
  console.log('Simulating Opal agent responses for workflow:', workflowId);

  const agents = [
    'content_review',
    'geo_audit',
    'audience_suggester',
    'experiment_blueprinter',
    'personalization_idea_generator'
  ];

  // Simulate each agent completing with a delay
  for (let i = 0; i < agents.length; i++) {
    const agentId = agents[i];
    const delay = (i + 1) * 3000; // 3s, 6s, 9s, 12s, 15s

    setTimeout(() => {
      const agentResult: OpalAgentResult = {
        agent_id: agentId,
        agent_name: agentId,
        output: generateSimulatedAgentOutput(agentId, inputData),
        success: true,
        execution_time_ms: Math.floor(Math.random() * 5000) + 2000, // 2-7 seconds
        timestamp: new Date().toISOString()
      };

      // Add agent result to workflow
      opalDataStore.addAgentResult(workflowId, agentId, agentResult);

      console.log(`Simulated agent completed: ${agentId} for workflow ${workflowId}`);

      // Check if all agents are complete
      const workflow = opalDataStore.getWorkflow(workflowId);
      if (workflow) {
        const completedAgents = Object.keys(workflow.results).filter(key =>
          workflow.results[key]?.success
        );

        if (completedAgents.length === agents.length) {
          opalDataStore.updateWorkflowStatus(workflowId, 'completed');
          console.log('All simulated agents completed! Workflow is now complete.');
        }
      }
    }, delay);
  }
}

function generateSimulatedAgentOutput(agentId: string, inputData: any): string {
  const clientName = inputData.client_name || 'IFPA Client';
  const businessObjectives = inputData.business_objectives || 'Improve personalization and member engagement';

  switch (agentId) {
    case 'content_review':
      return `# Content Review Analysis for ${clientName}

## Executive Summary
Comprehensive content audit reveals significant opportunities for personalization enhancement across digital touchpoints.

## Key Findings
- **Content Quality Score**: 78/100
- **Personalization Readiness**: Medium-High
- **SEO Optimization**: 85% complete
- **Accessibility Compliance**: 92% WCAG compliant

## Recommendations
1. Implement dynamic content blocks for member-specific messaging
2. Optimize product recommendation algorithms
3. Enhance category-based content personalization
4. Develop seasonal campaign content strategy

## Content Roadmap
**Phase 1 (0-3 months)**: Foundation setup and basic personalization
**Phase 2 (3-6 months)**: Advanced segmentation and dynamic content
**Phase 3 (6-12 months)**: AI-driven content optimization

## Technical Implementation
- Content Management System integration required
- API endpoints for real-time content delivery
- A/B testing framework for content optimization
- Performance monitoring and analytics setup`;

    case 'geo_audit':
      return `# Geographic Optimization Audit for ${clientName}

## Overall GEO Score: 82/100

## AI Citation Readiness: HIGH
Your content is well-structured for AI search visibility with proper schema markup and semantic organization.

## Technical Analysis
### Schema Markup Status
- **Present**: Yes ✓
- **Types Found**: Organization, LocalBusiness, Product, FAQ
- **Validation Errors**: 2 minor issues

### Performance Metrics
- **Page Load Speed**: 2.1s average
- **Mobile Performance**: 89/100
- **Core Web Vitals**: Passing all thresholds

## Quick Wins
1. Fix schema validation errors in product markup
2. Optimize image compression for 15% faster loading
3. Implement lazy loading for below-fold content
4. Add location-specific landing pages

## Geographic Personalization Opportunities
- **Regional Content Variations**: 5 key markets identified
- **Local SEO Optimization**: 78% complete
- **Multi-language Support**: Spanish market opportunity

## Implementation Priority
**High**: Schema markup fixes, image optimization
**Medium**: Regional content creation, local SEO
**Low**: Multi-language expansion planning`;

    case 'audience_suggester':
      return `# Audience Segmentation Strategy for ${clientName}

## Target Audience Analysis
Based on your business objectives: "${businessObjectives}"

## Recommended Audience Segments

### Segment 1: Premium Produce Buyers
- **Boolean Logic**: (purchase_history.category = "organic" OR purchase_history.category = "premium") AND avg_order_value > 75
- **Estimated Coverage**: 12-15% of member base
- **Rationale**: High-value customers with preference for quality products
- **Key Characteristics**: Health-conscious, willing to pay premium, regular buyers

### Segment 2: Bulk Commercial Buyers
- **Boolean Logic**: member_type = "commercial" AND monthly_volume > 500
- **Estimated Coverage**: 8-10% of member base
- **Rationale**: Restaurant/foodservice operators with consistent large orders
- **Key Characteristics**: Price-sensitive, volume-focused, predictable ordering

### Segment 3: Seasonal Campaign Responders
- **Boolean Logic**: email_engagement.campaign_clicks > 3 AND last_purchase_days < 30
- **Estimated Coverage**: 22-25% of member base
- **Rationale**: Highly engaged members responsive to marketing campaigns
- **Key Characteristics**: Marketing-responsive, seasonal buyers, email engaged

### Segment 4: New Member Onboarding
- **Boolean Logic**: registration_date > 90_days_ago AND purchase_count < 3
- **Estimated Coverage**: 15-18% of member base
- **Rationale**: Recent members needing nurturing and education
- **Key Characteristics**: Recently joined, low purchase history, needs guidance

## Implementation Recommendations
- **Primary KPI**: Conversion Rate improvement
- **Channel Focus**: Email campaigns and website personalization
- **Geographic Scope**: US and Canada markets
- **Testing Strategy**: Progressive rollout with A/B testing

## Risk Mitigation
- **Data Freshness**: Weekly audience refresh recommended
- **Audience Overlap**: Monitor for segment cannibalization
- **Privacy Compliance**: Ensure GDPR/CCPA adherence`;

    case 'experiment_blueprinter':
      return `# Experimentation Blueprint for ${clientName}

## Experiment Portfolio Strategy
Comprehensive testing program designed to optimize personalization effectiveness.

## Experiment 1: Personalized Homepage Hero
**Hypothesis**: Showing category-specific hero images based on purchase history will increase engagement by 15%
**Platform**: Web Experimentation
**Targeting**: All authenticated members with purchase history
**Traffic Allocation**: 50/50 split
**Primary Metric**: Homepage engagement rate
**Secondary Metrics**: Category page visits, session duration
**Sample Size**: 15,000 visitors needed
**Runtime**: 3-4 weeks
**Recommended MDE**: 8% relative improvement

## Experiment 2: Dynamic Product Recommendations
**Hypothesis**: AI-powered product suggestions will outperform static featured products by 20%
**Platform**: Web Experimentation
**Targeting**: Members browsing product categories
**Traffic Allocation**: 60% control, 40% treatment
**Primary Metric**: Add-to-cart rate
**Secondary Metrics**: Revenue per visitor, recommendation click-through
**Sample Size**: 12,000 product page views
**Runtime**: 2-3 weeks
**Recommended MDE**: 12% relative improvement

## Experiment 3: Email Personalization Engine
**Hypothesis**: Personalized subject lines and content will improve email performance by 25%
**Platform**: Email Marketing Platform
**Targeting**: Active email subscribers (last 90 days)
**Traffic Allocation**: 70% control, 30% treatment
**Primary Metric**: Email open rate
**Secondary Metrics**: Click-through rate, conversion rate
**Sample Size**: 25,000 email sends
**Runtime**: 4 weeks
**Recommended MDE**: 10% relative improvement

## Implementation Guidelines
- **Launch Sequence**: Start with homepage experiment, then products, then email
- **Success Criteria**: Statistical significance + business impact validation
- **Risk Management**: Automated experiment stopping rules at -5% performance
- **Measurement Framework**: Attribution modeling with 7-day lookback window`;

    case 'personalization_idea_generator':
      return `# Personalization Implementation Strategy for ${clientName}

## Personalization Opportunities Matrix

### Opportunity 1: Member Dashboard Personalization
**Placement**: Post-login member dashboard
**Message**: "Welcome back, [Name]! Based on your recent orders, here are this week's fresh picks"
**Content Recommendations**:
- **Section**: Featured Products Widget
- **Topic**: Recent category preferences + seasonal items
- **Rationale**: Leverage purchase history and seasonal availability
**Fallback**: Generic featured products carousel
**Primary KPI**: Dashboard engagement rate
**Secondary Metrics**: Product page visits, order frequency
**Dependencies**: Member purchase history API, product catalog integration

### Opportunity 2: Category Page Optimization
**Placement**: Product category landing pages
**Message**: Dynamic category descriptions based on member type and season
**Content Recommendations**:
- **Section**: Category header and filters
- **Topic**: Member-specific product emphasis (organic, bulk, seasonal)
- **Rationale**: Different member types have distinct product preferences
**Fallback**: Standard category page layout
**Primary KPI**: Category conversion rate
**Secondary Metrics**: Filter usage, product discovery
**Dependencies**: Member segmentation system, inventory management

### Opportunity 3: Email Campaign Personalization
**Placement**: Weekly newsletter and promotional emails
**Message**: Personalized product recommendations and offers
**Content Recommendations**:
- **Section**: Product spotlight and special offers
- **Topic**: Purchase behavior + seasonal trends + inventory levels
- **Rationale**: Email is primary communication channel with high engagement
**Fallback**: Broadcast email with general promotions
**Primary KPI**: Email click-through rate
**Secondary Metrics**: Email-driven revenue, member retention
**Dependencies**: Email platform integration, purchase data sync

### Opportunity 4: Search Results Enhancement
**Placement**: Site search results pages
**Message**: "Results tailored for you" with personalized product ranking
**Content Recommendations**:
- **Section**: Search results ordering and filters
- **Topic**: Search query + purchase history + member preferences
- **Rationale**: Search is high-intent behavior requiring relevant results
**Fallback**: Standard relevance-based search results
**Primary KPI**: Search conversion rate
**Secondary Metrics**: Search refinement rate, zero-result rate
**Dependencies**: Search platform upgrade, recommendation engine

## Target Audience Analysis
**Primary Audience**: Engaged IFPA members with 3+ months membership
**Segment Focus**: Commercial buyers and premium produce enthusiasts
**Personalization Maturity**: Currently in "Walk" phase, advancing toward "Run"

## Implementation Roadmap
**Week 1-2**: Dashboard personalization setup
**Week 3-4**: Category page optimization
**Week 5-6**: Email personalization pilot
**Week 7-8**: Search enhancement deployment
**Week 9-12**: Performance optimization and expansion`;

    default:
      return `# Agent Output for ${agentId}

## Analysis Results
Generated personalization recommendations and insights for ${clientName} based on business objectives.

## Key Findings
- Comprehensive analysis completed successfully
- Multiple optimization opportunities identified
- Strategic recommendations developed
- Implementation roadmap created

## Next Steps
1. Review recommendations with stakeholders
2. Prioritize implementation based on business impact
3. Begin technical integration planning
4. Set up measurement and tracking systems

*This is a simulated response generated for demonstration purposes.*`;
  }
}

// GET: Get webhook status and configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflow_id = searchParams.get('workflow_id');

    if (workflow_id) {
      // Return status for specific workflow
      return NextResponse.json({
        workflow_id,
        status: 'active',
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
        supported_events: [
          'workflow.completed',
          'workflow.failed',
          'workflow.triggered',
          'agent.completed'
        ],
        last_ping: new Date().toISOString()
      });
    }

    // Return general webhook configuration
    return NextResponse.json({
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
      supported_events: [
        'workflow.completed',
        'workflow.failed',
        'workflow.triggered',
        'agent.completed'
      ],
      authentication: {
        method: 'bearer_token',
        header: 'Authorization',
        format: 'Bearer {token}',
        token_validation: 'matches_configured_auth_key'
      },
      status: 'active',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook status error:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook status' },
      { status: 500 }
    );
  }
}