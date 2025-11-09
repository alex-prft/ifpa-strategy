// Webhook Events Database Operations
// Handles all CRUD operations for webhook event tracking and status monitoring

import { createSupabaseAdmin, handleDatabaseError } from './supabase-client';
import type { Database } from '@/lib/types/database';

const supabase = createSupabaseAdmin();

export interface WebhookEvent {
  id?: string;
  event_type: string;
  workflow_id: string;
  workflow_name?: string;
  agent_id?: string;
  agent_name?: string;
  session_id?: string;
  received_at?: string;
  payload?: any;
  success?: boolean;
  error_message?: string;
  processing_time_ms?: number;
  source_ip?: string;
  user_agent?: string;
}

export interface WebhookEventQuery {
  event_type?: string;
  workflow_id?: string;
  session_id?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export class WebhookEventOperations {
  /**
   * Store a new webhook event
   */
  async storeWebhookEvent(event: WebhookEvent): Promise<string> {
    try {
      const eventData: Database['public']['Tables']['opal_webhook_events']['Insert'] = {
        event_type: event.event_type,
        workflow_id: event.workflow_id,
        workflow_name: event.workflow_name,
        agent_id: event.agent_id,
        agent_name: event.agent_name,
        session_id: event.session_id,
        received_at: event.received_at || new Date().toISOString(),
        payload: event.payload,
        success: event.success ?? true,
        error_message: event.error_message,
        processing_time_ms: event.processing_time_ms,
        source_ip: event.source_ip,
        user_agent: event.user_agent,
      };

      const { data, error } = await supabase
        .from('opal_webhook_events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to store webhook event:', error);
      // Return mock ID for resilience
      return `mock-webhook-${Date.now()}`;
    }
  }

  /**
   * Get webhook events with filtering
   */
  async getWebhookEvents(query: WebhookEventQuery = {}): Promise<WebhookEvent[]> {
    try {
      let queryBuilder = supabase
        .from('opal_webhook_events')
        .select('*')
        .order('received_at', { ascending: false });

      // Apply filters
      if (query.event_type) {
        queryBuilder = queryBuilder.eq('event_type', query.event_type);
      }

      if (query.workflow_id) {
        queryBuilder = queryBuilder.eq('workflow_id', query.workflow_id);
      }

      if (query.session_id) {
        queryBuilder = queryBuilder.eq('session_id', query.session_id);
      }

      if (query.success !== undefined) {
        queryBuilder = queryBuilder.eq('success', query.success);
      }

      if (query.start_date) {
        queryBuilder = queryBuilder.gte('received_at', query.start_date);
      }

      if (query.end_date) {
        queryBuilder = queryBuilder.lte('received_at', query.end_date);
      }

      // Apply pagination
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch webhook events:', error);
      return [];
    }
  }

  /**
   * Get the latest webhook event for a session
   */
  async getLatestWebhookForSession(sessionId: string): Promise<WebhookEvent | null> {
    try {
      const { data, error } = await supabase
        .from('opal_webhook_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      console.error('Failed to fetch latest webhook for session:', error);
      return null;
    }
  }

  /**
   * Get webhook statistics for monitoring
   */
  async getWebhookStats(hours: number = 24): Promise<{
    total_events: number;
    success_rate: number;
    failed_events: number;
    avg_processing_time: number;
    event_types: Record<string, number>;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Get total events and success/failure counts
      const { data: events, error } = await supabase
        .from('opal_webhook_events')
        .select('success, processing_time_ms, event_type')
        .gte('received_at', since);

      if (error) throw error;

      const total_events = events?.length || 0;
      const successful_events = events?.filter(e => e.success).length || 0;
      const failed_events = total_events - successful_events;
      const success_rate = total_events > 0 ? (successful_events / total_events) * 100 : 0;

      // Calculate average processing time
      const processingTimes = events?.filter(e => e.processing_time_ms).map(e => e.processing_time_ms) || [];
      const avg_processing_time = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Count event types
      const event_types: Record<string, number> = {};
      events?.forEach(event => {
        event_types[event.event_type] = (event_types[event.event_type] || 0) + 1;
      });

      return {
        total_events,
        success_rate,
        failed_events,
        avg_processing_time,
        event_types
      };
    } catch (error) {
      console.error('Failed to fetch webhook stats:', error);
      return {
        total_events: 0,
        success_rate: 100,
        failed_events: 0,
        avg_processing_time: 0,
        event_types: {}
      };
    }
  }

  /**
   * Get latest webhook status for dashboard
   */
  async getWebhookStatus(): Promise<{
    last_webhook_received: string | null;
    webhook_health: 'healthy' | 'warning' | 'error';
    recent_failures: number;
    connection_status: 'connected' | 'disconnected' | 'error';
  }> {
    try {
      // Get the most recent webhook
      const { data: latest } = await supabase
        .from('opal_webhook_events')
        .select('received_at, success')
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent failures (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentEvents } = await supabase
        .from('opal_webhook_events')
        .select('success')
        .gte('received_at', oneHourAgo);

      const recent_failures = recentEvents?.filter(e => !e.success).length || 0;
      const total_recent = recentEvents?.length || 0;

      // Determine health status
      let webhook_health: 'healthy' | 'warning' | 'error' = 'healthy';
      let connection_status: 'connected' | 'disconnected' | 'error' = 'connected';

      if (!latest) {
        webhook_health = 'error';
        connection_status = 'disconnected';
      } else {
        const lastReceived = new Date(latest.received_at);
        const hoursSinceLastWebhook = (Date.now() - lastReceived.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastWebhook > 24) {
          webhook_health = 'error';
          connection_status = 'disconnected';
        } else if (hoursSinceLastWebhook > 2 || (total_recent > 0 && recent_failures / total_recent > 0.5)) {
          webhook_health = 'warning';
          connection_status = 'error';
        }
      }

      return {
        last_webhook_received: latest?.received_at || null,
        webhook_health,
        recent_failures,
        connection_status
      };
    } catch (error) {
      console.error('Failed to get webhook status:', error);
      return {
        last_webhook_received: null,
        webhook_health: 'error',
        recent_failures: 0,
        connection_status: 'disconnected'
      };
    }
  }

  /**
   * Clean up old webhook events (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('opal_webhook_events')
        .delete()
        .lt('received_at', cutoffDate)
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} webhook events older than ${retentionDays} days`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old webhook events:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const webhookEventOperations = new WebhookEventOperations();