'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Activity,
  Zap
} from 'lucide-react';
import { useWebhookStream, WebhookEvent } from '@/lib/hooks/useWebhookStream';

interface WebhookStatusIndicatorProps {
  sessionId?: string;
  workflowId?: string;
  enabled?: boolean;
  variant?: 'compact' | 'detailed' | 'inline';
  showEvents?: boolean;
  maxEvents?: number;
  onEventReceived?: (event: WebhookEvent) => void;
  className?: string;
}

export function WebhookStatusIndicator({
  sessionId,
  workflowId,
  enabled = true,
  variant = 'compact',
  showEvents = true,
  maxEvents = 5,
  onEventReceived,
  className = ''
}: WebhookStatusIndicatorProps) {
  const webhookStream = useWebhookStream({
    sessionId,
    workflowId,
    enabled,
    onEvent: (event) => {
      onEventReceived?.(event);
    }
  });

  const getConnectionIcon = () => {
    if (webhookStream.connected) {
      return <Wifi className="h-4 w-4 text-green-600" />;
    } else if (webhookStream.error) {
      return <WifiOff className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getConnectionStatus = () => {
    if (webhookStream.connected) {
      return { label: 'Connected', variant: 'default' as const };
    } else if (webhookStream.error) {
      return { label: 'Error', variant: 'destructive' as const };
    } else {
      return { label: 'Disconnected', variant: 'secondary' as const };
    }
  };

  const getLastEventBadge = () => {
    if (!webhookStream.lastEvent) return null;

    const timeDiff = Date.now() - new Date(webhookStream.lastEvent.received_at).getTime();
    const isRecent = timeDiff < 30000; // Within 30 seconds

    return (
      <Badge
        variant={webhookStream.lastEvent.success ? 'default' : 'destructive'}
        className={`text-xs ${isRecent ? 'animate-pulse' : ''}`}
      >
        {webhookStream.lastEvent.event_type}
      </Badge>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getConnectionIcon()}
        <Badge variant={getConnectionStatus().variant}>
          {getConnectionStatus().label}
        </Badge>
        {webhookStream.lastEvent && (
          <span className="text-xs text-gray-500">
            {new Date(webhookStream.lastEvent.received_at).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Webhook Status</span>
                  <Badge variant={getConnectionStatus().variant} className="text-xs">
                    {getConnectionStatus().label}
                  </Badge>
                </div>
                {webhookStream.lastEvent && (
                  <div className="flex items-center space-x-2 mt-1">
                    {getLastEventBadge()}
                    <span className="text-xs text-gray-500">
                      {new Date(webhookStream.lastEvent.received_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {webhookStream.connected && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <Activity className="h-3 w-3" />
                  <span>Live</span>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={webhookStream.reconnect}
                className="h-6 w-6 p-0"
                title="Reconnect"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {webhookStream.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {webhookStream.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <h3 className="font-medium">Webhook Status</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getConnectionStatus().variant}>
                {getConnectionStatus().label}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={webhookStream.reconnect}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reconnect
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{webhookStream.events.length}</div>
              <div className="text-xs text-gray-500">Events</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{webhookStream.connectionCount}</div>
              <div className="text-xs text-gray-500">Connections</div>
            </div>
            <div>
              <div className="flex items-center justify-center">
                {webhookStream.connected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>

          {/* Last Event */}
          {webhookStream.lastEvent && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Last Event</span>
                <span className="text-xs text-gray-500">
                  {new Date(webhookStream.lastEvent.received_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getLastEventBadge()}
                {webhookStream.lastEvent.agent_name && (
                  <span className="text-xs text-gray-500">
                    {webhookStream.lastEvent.agent_name}
                  </span>
                )}
              </div>
              {webhookStream.lastEvent.error_message && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {webhookStream.lastEvent.error_message}
                </div>
              )}
            </div>
          )}

          {/* Recent Events */}
          {showEvents && webhookStream.events.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Recent Events</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={webhookStream.clearEvents}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {webhookStream.events.slice(0, maxEvents).map((event, index) => (
                  <div key={`${event.id}-${index}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={event.success ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {event.event_type}
                      </Badge>
                      {event.agent_name && (
                        <span className="text-gray-500">{event.agent_name}</span>
                      )}
                    </div>
                    <span className="text-gray-400">
                      {new Date(event.received_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {webhookStream.error && (
            <div className="border-t pt-3">
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <div className="font-medium mb-1">Connection Error:</div>
                {webhookStream.error}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WebhookStatusIndicator;