'use client';

import { useState, useEffect } from 'react';
import { agentStatusTracker, AgentStatus, AgentStatusInfo } from '@/lib/monitoring/agent-status-tracker';

interface RealTimeAgentStatusProps {
  className?: string;
}

// Enhanced Agent Status Bubble Component with Real-time Updates
interface AgentStatusBubbleProps {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  executionTime?: number;
  progress?: number;
}

function AgentStatusBubble({ agentId, agentName, status, executionTime, progress }: AgentStatusBubbleProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-400'; // Unknown/no recent activity
      case 'starting':
        return 'bg-blue-400 animate-pulse'; // Agent initializing
      case 'running':
        return 'bg-blue-500 animate-ping'; // Agent processing
      case 'completed':
        return 'bg-green-500'; // Successfully sent data to OSA
      case 'failed':
        return 'bg-red-500'; // Failed to send data to OSA
      case 'timeout':
        return 'bg-red-500'; // Failed due to timeout (red for failure)
      case 'retrying':
        return 'bg-yellow-500 animate-bounce'; // Attempting retry
      default:
        return 'bg-gray-400'; // Unknown status (grey)
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'timeout':
        return '⏱';
      case 'retrying':
        return '↻';
      case 'running':
        return '●';
      default:
        return '';
    }
  };

  const getStatusDescription = (status: AgentStatus, executionTime?: number, progress?: number) => {
    const formatTime = (ms?: number) => ms ? `${(ms / 1000).toFixed(1)}s` : '';
    const formatProgress = (p?: number) => p ? `${p}%` : '';

    switch (status) {
      case 'idle':
        return 'No recent OPAL to OSA sync activity';
      case 'starting':
        return 'OPAL agent initializing data sync...';
      case 'running':
        return `OPAL agent processing and syncing to OSA${progress ? ` (${formatProgress(progress)})` : ''}`;
      case 'completed':
        return `OPAL data successfully synced to OSA${executionTime ? ` in ${formatTime(executionTime)}` : ''}`;
      case 'failed':
        return 'OPAL to OSA sync failed - data not delivered';
      case 'timeout':
        return 'OPAL to OSA sync timed out - data delivery failed';
      case 'retrying':
        return 'OPAL agent retrying failed OSA sync';
      default:
        return 'OPAL to OSA sync status unknown';
    }
  };

  return (
    <div
      className={`relative w-3 h-3 rounded-full ${getStatusColor(status)} cursor-pointer hover:scale-125 transition-all duration-200 shadow-sm`}
      title={`${agentName}: ${getStatusDescription(status, executionTime, progress)}`}
    >
      {getStatusIcon(status) && (
        <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
          {getStatusIcon(status)}
        </span>
      )}
      {progress && status === 'running' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-white"
          style={{
            background: `conic-gradient(from 0deg, rgba(255,255,255,0.3) ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`
          }}
        />
      )}
    </div>
  );
}

export default function RealTimeAgentStatus({ className }: RealTimeAgentStatusProps) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatusInfo>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time status updates
  useEffect(() => {
    // Initial load
    const loadInitialStatuses = () => {
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);
      setLastUpdate(new Date());
    };

    loadInitialStatuses();

    // Subscribe to real-time updates
    const unsubscribe = agentStatusTracker.subscribe((updatedStatus: AgentStatusInfo) => {
      setAgentStatuses(prevStatuses => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(updatedStatus.agent_id, updatedStatus);
        return newStatuses;
      });
      setLastUpdate(new Date());
    });

    // Periodic refresh to ensure we have latest data
    const interval = setInterval(() => {
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);
    }, 5000); // Refresh every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Get OPAL agents in correct order
  const opalAgents = [
    'content_review',
    'geo_audit',
    'audience_suggester',
    'experiment_blueprinter',
    'personalization_idea_generator'
  ];

  // Local agent configuration to avoid accessing static property through instance
  const OPAL_AGENTS = {
    'content_review': {
      name: 'Content Review Agent',
      description: 'Analyzes experiment content and variations',
      estimated_runtime_ms: 45000,
      timeout_threshold_ms: 120000
    },
    'geo_audit': {
      name: 'Geographic Audit Agent',
      description: 'Evaluates geographic performance distribution',
      estimated_runtime_ms: 60000,
      timeout_threshold_ms: 180000
    },
    'audience_suggester': {
      name: 'Audience Suggester Agent',
      description: 'Analyzes audience segment performance',
      estimated_runtime_ms: 50000,
      timeout_threshold_ms: 150000
    },
    'experiment_blueprinter': {
      name: 'Experiment Blueprinter Agent',
      description: 'Creates detailed experiment plans',
      estimated_runtime_ms: 70000,
      timeout_threshold_ms: 200000
    },
    'personalization_idea_generator': {
      name: 'Personalization Idea Generator',
      description: 'Generates personalization strategies',
      estimated_runtime_ms: 55000,
      timeout_threshold_ms: 180000
    }
  };

  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
        <span>OPAL Agents:</span>
        <span className="text-[10px] text-gray-400">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {opalAgents.map(agentId => {
          const agentInfo = agentStatuses.get(agentId);
          const agentConfig = OPAL_AGENTS[agentId as keyof typeof OPAL_AGENTS];

          return (
            <AgentStatusBubble
              key={agentId}
              agentId={agentId}
              agentName={agentConfig?.name || agentId}
              status={agentInfo?.status || 'idle'}
              executionTime={agentInfo?.execution_time_ms}
              progress={agentInfo?.progress_percentage}
            />
          );
        })}
      </div>

      {/* Real-time status summary */}
      <div className="mt-2 text-xs text-gray-500">
        {(() => {
          const statusCounts = {
            idle: 0,
            starting: 0,
            running: 0,
            completed: 0,
            failed: 0,
            timeout: 0,
            retrying: 0
          };

          opalAgents.forEach(agentId => {
            const status = agentStatuses.get(agentId)?.status || 'idle';
            statusCounts[status]++;
          });

          const activeAgents = statusCounts.starting + statusCounts.running + statusCounts.retrying;
          const completedAgents = statusCounts.completed;
          const failedAgents = statusCounts.failed + statusCounts.timeout;

          if (activeAgents > 0) {
            return `${activeAgents} syncing, ${completedAgents} synced to OSA, ${failedAgents} sync failed`;
          } else if (completedAgents > 0) {
            return `${completedAgents} synced to OSA, ${failedAgents} sync failed`;
          } else {
            return 'No recent OPAL to OSA sync activity';
          }
        })()}
      </div>
    </div>
  );
}