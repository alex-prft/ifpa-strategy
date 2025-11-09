import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebhookEvent {
  id: string;
  event_type: string;
  workflow_id: string;
  workflow_name?: string;
  agent_id?: string;
  agent_name?: string;
  success: boolean;
  error_message?: string;
  received_at: string;
  processing_time_ms?: number;
}

export interface WebhookStreamData {
  type: 'webhook_event' | 'connection' | 'heartbeat' | 'error';
  event?: WebhookEvent;
  message?: string;
  timestamp: string;
}

export interface UseWebhookStreamOptions {
  sessionId?: string;
  workflowId?: string;
  enabled?: boolean;
  onEvent?: (event: WebhookEvent) => void;
  onError?: (error: string) => void;
}

export interface WebhookStreamState {
  connected: boolean;
  events: WebhookEvent[];
  lastEvent: WebhookEvent | null;
  error: string | null;
  connectionCount: number;
}

export function useWebhookStream(options: UseWebhookStreamOptions) {
  const {
    sessionId,
    workflowId,
    enabled = true,
    onEvent,
    onError
  } = options;

  const [state, setState] = useState<WebhookStreamState>({
    connected: false,
    events: [],
    lastEvent: null,
    error: null,
    connectionCount: 0
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || (!sessionId && !workflowId)) {
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL parameters
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (workflowId) params.append('workflow_id', workflowId);

    const url = `/api/webhook-events/stream?${params.toString()}`;

    console.log('🔌 Connecting to webhook stream:', url);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Webhook stream connected');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          connected: true,
          error: null,
          connectionCount: prev.connectionCount + 1
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data: WebhookStreamData = JSON.parse(event.data);

          console.log('📨 Webhook stream message:', data.type);

          switch (data.type) {
            case 'webhook_event':
              if (data.event) {
                setState(prev => ({
                  ...prev,
                  events: [data.event!, ...prev.events].slice(0, 50), // Keep last 50 events
                  lastEvent: data.event!
                }));
                onEvent?.(data.event);
              }
              break;

            case 'connection':
              console.log('🔗 Stream connection established:', data.message);
              break;

            case 'heartbeat':
              // Keep connection alive
              break;

            case 'error':
              console.error('❌ Stream error:', data.message);
              setState(prev => ({
                ...prev,
                error: data.message || 'Unknown stream error'
              }));
              onError?.(data.message || 'Unknown stream error');
              break;

            default:
              console.log('Unknown stream message type:', data.type);
          }
        } catch (parseError) {
          console.error('Failed to parse stream message:', parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error('❌ Webhook stream error:', event);
        setState(prev => ({
          ...prev,
          connected: false,
          error: 'Connection error'
        }));

        // Implement exponential backoff for reconnection
        const maxReconnectAttempts = 5;
        const baseDelay = 1000;

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 second delay
          );

          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setState(prev => ({
            ...prev,
            error: 'Max reconnection attempts reached'
          }));
          onError?.('Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('Failed to create webhook stream:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create stream'
      }));
      onError?.(error instanceof Error ? error.message : 'Failed to create stream');
    }
  }, [sessionId, workflowId, enabled, onEvent, onError]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting webhook stream');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false
    }));
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);

  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: [],
      lastEvent: null
    }));
  }, []);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && (sessionId || workflowId)) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, sessionId, workflowId, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    clearEvents
  };
}