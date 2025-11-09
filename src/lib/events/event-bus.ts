/**
 * OSA Event Bus - Supabase Realtime + Custom Event Router
 *
 * Provides asynchronous event publishing and subscription for decoupled service communication
 * Built on Supabase Realtime with custom routing and schema validation
 */

import { supabase } from '@/lib/supabase';
import {
  OSAEvent,
  validateEvent,
  generateEventId,
  generateCorrelationId,
  createEventMetadata
} from './schemas';

// Event storage interface for Supabase
interface StoredEvent {
  id: string;
  event_type: string;
  event_data: OSAEvent;
  published_at: string;
  processed: boolean;
  retry_count: number;
  dead_letter: boolean;
  correlation_id: string;
  causation_id?: string;
  trace_id?: string;
}

// Event subscription callback type
type EventCallback<T extends OSAEvent = OSAEvent> = (event: T) => void | Promise<void>;

// Event subscription options
interface SubscriptionOptions {
  filter?: {
    event_types?: string[];
    service?: string;
    user_id?: string;
    session_id?: string;
  };
  max_retries?: number;
  retry_delay_ms?: number;
  dead_letter_threshold?: number;
}

// Circuit breaker for event processing
interface CircuitBreaker {
  state: 'closed' | 'open' | 'half_open';
  failure_count: number;
  failure_threshold: number;
  timeout_ms: number;
  last_failure_time?: number;
}

export class OSAEventBus {
  private subscriptions: Map<string, EventCallback[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryQueues: Map<string, StoredEvent[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeEventBus();
  }

  /**
   * Initialize the event bus with Supabase Realtime subscriptions
   */
  private async initializeEventBus(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Subscribe to event_stream table for real-time events
      const channel = supabase
        .channel('osa-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'osa_event_stream'
          },
          (payload) => this.handleRealtimeEvent(payload.new as StoredEvent)
        )
        .subscribe();

      // Start retry processor
      this.startRetryProcessor();

      this.isInitialized = true;
      console.log('🚀 [EventBus] Initialized with Supabase Realtime');
    } catch (error) {
      console.error('❌ [EventBus] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Publish an event to the event bus
   */
  async publish<T extends OSAEvent>(event: T): Promise<void> {
    try {
      // Validate event schema
      const validation = validateEvent(event);
      if (!validation.valid) {
        throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      }

      // Ensure required fields
      if (!event.event_id) {
        (event as any).event_id = generateEventId();
      }
      if (!event.correlation_id) {
        (event as any).correlation_id = generateCorrelationId();
      }
      if (!event.timestamp) {
        (event as any).timestamp = new Date().toISOString();
      }

      // Store event in Supabase
      const storedEvent: Partial<StoredEvent> = {
        id: event.event_id,
        event_type: event.event_type,
        event_data: event,
        published_at: new Date().toISOString(),
        processed: false,
        retry_count: 0,
        dead_letter: false,
        correlation_id: event.correlation_id,
        causation_id: event.causation_id,
        trace_id: event.metadata?.trace_id
      };

      const { error } = await supabase
        .from('osa_event_stream')
        .insert([storedEvent]);

      if (error) {
        throw error;
      }

      console.log(`✅ [EventBus] Published event: ${event.event_type}`, {
        eventId: event.event_id,
        correlationId: event.correlation_id
      });

    } catch (error) {
      console.error(`❌ [EventBus] Failed to publish event: ${event.event_type}`, error);

      // Emit circuit breaker event if needed
      await this.handlePublishFailure(event.event_type, error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to events by type or pattern
   */
  subscribe<T extends OSAEvent = OSAEvent>(
    eventTypePattern: string,
    callback: EventCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = `${eventTypePattern}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (!this.subscriptions.has(eventTypePattern)) {
      this.subscriptions.set(eventTypePattern, []);
    }

    this.subscriptions.get(eventTypePattern)!.push(callback as EventCallback);

    console.log(`📡 [EventBus] Subscribed to: ${eventTypePattern}`, { subscriptionId });

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(eventTypePattern);
      if (callbacks) {
        const index = callbacks.indexOf(callback as EventCallback);
        if (index > -1) {
          callbacks.splice(index, 1);
          console.log(`📡 [EventBus] Unsubscribed from: ${eventTypePattern}`, { subscriptionId });
        }
      }
    };
  }

  /**
   * Handle real-time event from Supabase
   */
  private async handleRealtimeEvent(storedEvent: StoredEvent): Promise<void> {
    try {
      const event = storedEvent.event_data;
      const eventType = event.event_type;

      // Find matching subscriptions
      const matchingPatterns = Array.from(this.subscriptions.keys()).filter(pattern =>
        this.eventMatches(eventType, pattern)
      );

      // Process each matching subscription
      for (const pattern of matchingPatterns) {
        const callbacks = this.subscriptions.get(pattern) || [];

        for (const callback of callbacks) {
          await this.processEventCallback(callback, event, storedEvent.id);
        }
      }

      // Mark event as processed
      await this.markEventProcessed(storedEvent.id);

    } catch (error) {
      console.error('❌ [EventBus] Error processing realtime event:', error);
      await this.handleEventProcessingFailure(storedEvent);
    }
  }

  /**
   * Process individual event callback with error handling
   */
  private async processEventCallback(
    callback: EventCallback,
    event: OSAEvent,
    eventId: string
  ): Promise<void> {
    const callbackName = callback.name || 'anonymous';

    try {
      await callback(event);
      console.log(`✅ [EventBus] Processed event: ${event.event_type} -> ${callbackName}`);
    } catch (error) {
      console.error(`❌ [EventBus] Callback failed: ${event.event_type} -> ${callbackName}`, error);

      // Add to retry queue
      await this.scheduleRetry(eventId, error as Error);
    }
  }

  /**
   * Check if event type matches subscription pattern
   */
  private eventMatches(eventType: string, pattern: string): boolean {
    // Exact match
    if (eventType === pattern) return true;

    // Wildcard patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(eventType);
    }

    // Service level matching (e.g., "orchestration.*" matches "orchestration.workflow.triggered@1")
    if (pattern.endsWith('.*')) {
      const servicePrefix = pattern.slice(0, -2);
      return eventType.startsWith(servicePrefix + '.');
    }

    return false;
  }

  /**
   * Mark event as successfully processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    try {
      await supabase
        .from('osa_event_stream')
        .update({ processed: true, retry_count: 0 })
        .eq('id', eventId);
    } catch (error) {
      console.error('❌ [EventBus] Failed to mark event as processed:', error);
    }
  }

  /**
   * Handle event processing failure and schedule retry
   */
  private async handleEventProcessingFailure(storedEvent: StoredEvent): Promise<void> {
    const maxRetries = 3;
    const retryCount = storedEvent.retry_count + 1;

    if (retryCount >= maxRetries) {
      // Move to dead letter queue
      await this.moveToDeadLetterQueue(storedEvent);
      return;
    }

    // Schedule retry with exponential backoff
    const retryDelayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s

    setTimeout(async () => {
      try {
        await supabase
          .from('osa_event_stream')
          .update({ retry_count: retryCount })
          .eq('id', storedEvent.id);

        // Re-trigger event processing
        await this.handleRealtimeEvent({ ...storedEvent, retry_count: retryCount });
      } catch (error) {
        console.error('❌ [EventBus] Retry failed:', error);
      }
    }, retryDelayMs);
  }

  /**
   * Move failed event to dead letter queue
   */
  private async moveToDeadLetterQueue(storedEvent: StoredEvent): Promise<void> {
    try {
      await supabase
        .from('osa_event_stream')
        .update({
          dead_letter: true,
          processed: true
        })
        .eq('id', storedEvent.id);

      console.warn(`⚠️ [EventBus] Event moved to dead letter queue: ${storedEvent.event_type}`, {
        eventId: storedEvent.id,
        retryCount: storedEvent.retry_count
      });

      // Emit dead letter event for monitoring
      await this.publish({
        event_type: 'system.event.dead_letter@1',
        event_id: generateEventId(),
        correlation_id: storedEvent.correlation_id,
        timestamp: new Date().toISOString(),
        version: 1,
        original_event_id: storedEvent.id,
        original_event_type: storedEvent.event_type,
        failure_reason: 'max_retries_exceeded',
        metadata: createEventMetadata('system', undefined, 'event-bus')
      } as any);

    } catch (error) {
      console.error('❌ [EventBus] Failed to move event to dead letter queue:', error);
    }
  }

  /**
   * Handle publish failure and circuit breaker logic
   */
  private async handlePublishFailure(eventType: string, error: Error): Promise<void> {
    const service = eventType.split('.')[0];
    let circuitBreaker = this.circuitBreakers.get(service);

    if (!circuitBreaker) {
      circuitBreaker = {
        state: 'closed',
        failure_count: 0,
        failure_threshold: 5,
        timeout_ms: 60000 // 1 minute
      };
      this.circuitBreakers.set(service, circuitBreaker);
    }

    circuitBreaker.failure_count++;
    circuitBreaker.last_failure_time = Date.now();

    if (circuitBreaker.failure_count >= circuitBreaker.failure_threshold) {
      circuitBreaker.state = 'open';

      console.warn(`🔌 [EventBus] Circuit breaker opened for service: ${service}`, {
        failureCount: circuitBreaker.failure_count,
        threshold: circuitBreaker.failure_threshold
      });

      // Schedule circuit breaker recovery
      setTimeout(() => {
        if (circuitBreaker) {
          circuitBreaker.state = 'half_open';
          circuitBreaker.failure_count = 0;
        }
      }, circuitBreaker.timeout_ms);
    }
  }

  /**
   * Schedule event retry
   */
  private async scheduleRetry(eventId: string, error: Error): Promise<void> {
    // Implementation would depend on specific retry strategy
    console.log(`🔄 [EventBus] Scheduling retry for event: ${eventId}`, error.message);
  }

  /**
   * Start retry processor for failed events
   */
  private startRetryProcessor(): void {
    setInterval(async () => {
      try {
        // Query for events that need retry
        const { data: events, error } = await supabase
          .from('osa_event_stream')
          .select('*')
          .eq('processed', false)
          .eq('dead_letter', false)
          .lt('retry_count', 3)
          .order('published_at', { ascending: true })
          .limit(10);

        if (error) throw error;

        for (const event of events || []) {
          await this.handleRealtimeEvent(event);
        }
      } catch (error) {
        console.error('❌ [EventBus] Retry processor error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get event bus statistics
   */
  async getStats(): Promise<{
    total_events: number;
    processed_events: number;
    failed_events: number;
    dead_letter_events: number;
    active_subscriptions: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('osa_event_stream')
        .select('processed, dead_letter, retry_count');

      if (error) throw error;

      const stats = {
        total_events: data?.length || 0,
        processed_events: data?.filter(e => e.processed && !e.dead_letter).length || 0,
        failed_events: data?.filter(e => !e.processed && e.retry_count > 0).length || 0,
        dead_letter_events: data?.filter(e => e.dead_letter).length || 0,
        active_subscriptions: Array.from(this.subscriptions.values()).reduce((sum, callbacks) => sum + callbacks.length, 0)
      };

      return stats;
    } catch (error) {
      console.error('❌ [EventBus] Failed to get stats:', error);
      return {
        total_events: 0,
        processed_events: 0,
        failed_events: 0,
        dead_letter_events: 0,
        active_subscriptions: 0
      };
    }
  }

  /**
   * Shutdown event bus gracefully
   */
  async shutdown(): Promise<void> {
    this.subscriptions.clear();
    this.circuitBreakers.clear();
    this.retryQueues.clear();
    this.isInitialized = false;
    console.log('🛑 [EventBus] Shutdown completed');
  }
}

// Global event bus instance
export const eventBus = new OSAEventBus();

// Convenience functions
export const publishEvent = <T extends OSAEvent>(event: T) => eventBus.publish(event);
export const subscribeToEvents = <T extends OSAEvent = OSAEvent>(
  pattern: string,
  callback: EventCallback<T>,
  options?: SubscriptionOptions
) => eventBus.subscribe(pattern, callback, options);

// Export types
export type { EventCallback, SubscriptionOptions, CircuitBreaker };