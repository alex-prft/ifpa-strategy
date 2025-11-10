import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// GET general webhook statistics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    // Get webhook statistics
    const stats = await webhookEventOperations.getWebhookStats(hours);

    // Get webhook status
    const status = await webhookEventOperations.getWebhookStatus();

    // Get recent events for agent status mapping
    const recentEvents = await webhookEventOperations.getWebhookEvents({
      limit: 50,
      start_date: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    });

    // Map agent statuses based on recent webhook events
    const agentStatuses: {[key: string]: 'unknown' | 'success' | 'failed'} = {
      integration_health: 'unknown',
      content_review: 'unknown',
      geo_audit: 'unknown',
      audience_suggester: 'unknown',
      experiment_blueprinter: 'unknown',
      personalization_idea_generator: 'unknown',
      customer_journey: 'unknown',
      roadmap_generator: 'unknown',
      cmp_organizer: 'unknown'
    };

    // Update agent statuses based on recent webhook events
    recentEvents.forEach(event => {
      if (event.agent_id && agentStatuses.hasOwnProperty(event.agent_id)) {
        agentStatuses[event.agent_id] = event.success ? 'success' : 'failed';
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        total_received: stats.total_events,
        successful: Math.round(stats.total_events * (stats.success_rate / 100)),
        failed: stats.failed_events,
        last_24h: stats.total_events
      },
      status: {
        system_status: status.webhook_health,
        connection_status: status.connection_status,
        last_webhook_received: status.last_webhook_received,
        recent_failures: status.recent_failures
      },
      agentStatuses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook stats API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhook statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}