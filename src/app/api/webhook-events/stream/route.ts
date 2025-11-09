import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// SSE endpoint for real-time webhook status updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const workflowId = searchParams.get('workflow_id');

  if (!sessionId && !workflowId) {
    return NextResponse.json(
      { error: 'Either session_id or workflow_id is required' },
      { status: 400 }
    );
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialData = `data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to webhook events stream',
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // Set up polling interval for new webhook events
      const pollInterval = setInterval(async () => {
        try {
          // Get recent webhook events for this session/workflow
          const query: any = {
            limit: 10,
            start_date: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
          };

          if (sessionId) {
            query.session_id = sessionId;
          }
          if (workflowId) {
            query.workflow_id = workflowId;
          }

          const events = await webhookEventOperations.getWebhookEvents(query);

          if (events.length > 0) {
            // Send the latest events
            for (const event of events) {
              const eventData = `data: ${JSON.stringify({
                type: 'webhook_event',
                event: {
                  id: event.id,
                  event_type: event.event_type,
                  workflow_id: event.workflow_id,
                  workflow_name: event.workflow_name,
                  agent_id: event.agent_id,
                  agent_name: event.agent_name,
                  success: event.success,
                  error_message: event.error_message,
                  received_at: event.received_at,
                  processing_time_ms: event.processing_time_ms
                },
                timestamp: new Date().toISOString()
              })}\n\n`;
              controller.enqueue(encoder.encode(eventData));
            }
          }

          // Send periodic heartbeat
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));

        } catch (error) {
          console.error('SSE polling error:', error);

          // Send error message to client
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// GET webhook events for dashboard display
export async function POST(request: NextRequest) {
  try {
    const { session_id, workflow_id, limit = 20, event_types } = await request.json();

    if (!session_id && !workflow_id) {
      return NextResponse.json(
        { error: 'Either session_id or workflow_id is required' },
        { status: 400 }
      );
    }

    // Build query parameters
    const query: any = {
      limit: Math.min(limit, 100), // Cap at 100 events
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
    };

    if (session_id) {
      query.session_id = session_id;
    }
    if (workflow_id) {
      query.workflow_id = workflow_id;
    }

    // Get webhook events
    const events = await webhookEventOperations.getWebhookEvents(query);

    // Get webhook statistics
    const stats = await webhookEventOperations.getWebhookStats(24);

    // Get webhook status
    const status = await webhookEventOperations.getWebhookStatus();

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        event_type: event.event_type,
        workflow_id: event.workflow_id,
        workflow_name: event.workflow_name,
        agent_id: event.agent_id,
        agent_name: event.agent_name,
        success: event.success,
        error_message: event.error_message,
        received_at: event.received_at,
        processing_time_ms: event.processing_time_ms
      })),
      stats,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook events API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhook events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}