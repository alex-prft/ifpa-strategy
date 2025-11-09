import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse } from '@/lib/types';
import { OSAWorkflowInput, OSAWorkflowOutput } from '@/lib/types/maturity';
import { opalDataStore } from '@/lib/opal/supabase-data-store';

/**
 * OSA Workflow API - Triggers Opal Workflow and waits for webhook response
 * New Flow: OSA Form → Trigger Opal → Wait for Webhook → Redirect to Results
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'osa-workflow');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    // Parse request body
    const workflowInput: OSAWorkflowInput = await request.json();

    // Validate required fields
    if (!workflowInput.client_name || !workflowInput.business_objectives || !workflowInput.recipients) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Missing required fields: client_name, business_objectives, and recipients are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('Starting OSA workflow for client:', workflowInput.client_name);

    // TODO: REMOVED DAILY LIMIT - Workflows can now be triggered without restriction
    // Original daily limit check was here (5 per day), removed as requested
    const forceSync = request.headers.get('x-force-sync') === 'true';
    console.log('📊 Daily rate limiting: DISABLED - allowing unlimited workflow submissions');

    try {
      // Generate session ID for tracking this user's request
      const sessionId = `osa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Step 1: Trigger Opal Workflow using new polling approach
      const opalResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/opal/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          workflow_name: 'get_opal',
          input_data: workflowInput,
          trigger_source: forceSync ? 'admin_force_sync' : 'osa_form',
          metadata: {
            session_id: sessionId,
            client_id: workflowInput.client_name,
            project_id: 'osa-assessment',
            user_id: 'osa-user',
            triggered_at: new Date().toISOString()
          }
        })
      });

      if (!opalResponse.ok) {
        throw new Error(`Failed to trigger Opal workflow: ${opalResponse.status}`);
      }

      const opalResult = await opalResponse.json();
      console.log('Opal workflow triggered successfully:', {
        workflow_id: opalResult.workflow_id,
        session_id: sessionId
      });

      // Step 2: Create workflow record in data store
      const workflow = await opalDataStore.createWorkflow(
        opalResult.workflow_id,
        workflowInput,
        sessionId
      );

      // NOTE: Rate limiting disabled - unlimited workflow submissions allowed

      // Step 3: Return loading state response with polling info
      const response: OSAWorkflowOutput = {
        workflow_id: opalResult.workflow_id,
        session_id: sessionId,
        status: 'triggered',
        message: 'Opal workflow triggered successfully. Polling for results...',
        estimated_completion: opalResult.estimated_completion || new Date(Date.now() + 300000).toISOString(),
        polling_url: opalResult.polling_url,
        execution_id: opalResult.execution_id,
        loading_state: {
          current_step: 'Triggering Opal agents...',
          progress_percentage: 10,
          expected_agents: [],
          completed_agents: []
        }
      };

      const processingTime = Date.now() - startTime;

      console.log('OSA workflow triggered:', {
        client: workflowInput.client_name,
        workflow_id: opalResult.workflow_id,
        session_id: sessionId,
        processing_time: processingTime
      });

      return NextResponse.json<APIResponse<OSAWorkflowOutput>>({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }, {
        status: 202, // Accepted - processing in background
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Client-Name': workflowInput.client_name,
          'X-Workflow-ID': opalResult.workflow_id,
          'X-Session-ID': sessionId
        }
      });

    } catch (workflowError) {
      console.error('OSA workflow trigger error:', workflowError);

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Failed to trigger Opal workflow: ${workflowError}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('OSA Workflow API error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in OSA workflow',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Check workflow status endpoint - used for polling and getting results
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflow_id');
    const sessionId = searchParams.get('session_id');
    const clientName = searchParams.get('client_name');
    const useCached = searchParams.get('use_cached') === 'true';

    if (workflowId) {
      // Get specific workflow by ID
      const workflow = await opalDataStore.getWorkflow(workflowId);
      if (!workflow) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'Workflow not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      return NextResponse.json<APIResponse<any>>({
        success: true,
        data: {
          workflow_id: workflow.workflow_id,
          status: workflow.status,
          started_at: workflow.started_at,
          completed_at: workflow.completed_at,
          results: workflow.results,
          input_data: workflow.input_data
        },
        timestamp: new Date().toISOString()
      });

    } else if (sessionId) {
      // Get workflow by session ID
      const workflow = await opalDataStore.getWorkflowBySessionId(sessionId);
      if (!workflow) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'No workflow found for session',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      return NextResponse.json<APIResponse<any>>({
        success: true,
        data: {
          workflow_id: workflow.workflow_id,
          status: workflow.status,
          started_at: workflow.started_at,
          completed_at: workflow.completed_at,
          results: workflow.results,
          input_data: workflow.input_data
        },
        timestamp: new Date().toISOString()
      });

    } else if (clientName && useCached) {
      // Get latest completed workflow for client (graceful degradation)
      console.log(`🔄 [API] Retrieving cached data for client: ${clientName}`);

      const cachedWorkflow = await opalDataStore.getLatestCompletedWorkflowForClient(clientName);
      if (!cachedWorkflow) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: `No completed workflows found for client: ${clientName}`,
          message: 'No cached results available for this client',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      console.log(`✅ [API] Returning cached workflow: ${cachedWorkflow.workflow_id}`);

      return NextResponse.json<APIResponse<any>>({
        success: true,
        data: {
          workflow_id: cachedWorkflow.workflow_id,
          status: cachedWorkflow.status,
          started_at: cachedWorkflow.started_at,
          completed_at: cachedWorkflow.completed_at,
          results: cachedWorkflow.results,
          input_data: cachedWorkflow.input_data,
          isFromCache: true,
          cacheSource: 'latest_completed_workflow'
        },
        message: `Retrieved cached results from ${cachedWorkflow.completed_at}`,
        timestamp: new Date().toISOString()
      });

    } else {
      // Return general OSA workflow status and info
      const latestWorkflow = await opalDataStore.getLatestWorkflow();
      // TODO: REMOVED DAILY LIMIT CHECK - Always allow new workflows

      return NextResponse.json({
        workflow_name: 'get_opal',
        description: 'OSA Workflow with Opal integration',
        version: '2.0.0',
        status: 'healthy',
        daily_limit_reached: false, // Always false - unlimited workflows
        unlimited_mode: true, // Indicate unlimited submissions are enabled
        latest_workflow: latestWorkflow ? {
          workflow_id: latestWorkflow.workflow_id,
          status: latestWorkflow.status,
          started_at: latestWorkflow.started_at,
          client_name: latestWorkflow.input_data.client_name
        } : null,
        supported_agents: [],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('OSA workflow status error:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Failed to get workflow status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

