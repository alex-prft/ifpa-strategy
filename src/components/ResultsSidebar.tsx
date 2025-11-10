'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Activity,
  X
} from 'lucide-react';

// Navigation areas configuration
const navigationAreas = [
  {
    id: 'strategy-plans',
    title: 'Strategy Plans',
    icon: Target,
    color: 'blue',
    url: '/engine/results/strategy'
  },
  {
    id: 'dxp-tools',
    title: 'Optimizely DXP Tools',
    icon: Settings,
    color: 'purple',
    url: '/engine/results/dxptools'
  },
  {
    id: 'analytics-insights',
    title: 'Analytics Insights',
    icon: BarChart3,
    color: 'green',
    url: '/engine/results/insights'
  },
  {
    id: 'experience-optimization',
    title: 'Experience Optimization',
    icon: TrendingUp,
    color: 'orange',
    url: '/engine/results/optimization'
  }
];

// Agent status type
type AgentStatus = 'default' | 'active' | 'error';

// Mock agent status function - in production this would connect to real agent monitoring
function getAgentStatus(agentId: string): AgentStatus {
  // Realistic states - most agents are not connected/sending data yet
  const statusMap: Record<string, AgentStatus> = {
    'roadmap_generator': 'default',
    'integration_health': 'default',
    'personalization_idea_generator': 'default',
    'cmp_organizer': 'default',
    'experiment_blueprinter': 'default',
    'customer_journey': 'default',
    'audience_suggester': 'default',
    'geo_audit': 'default',
    'content_review': 'default'
  };

  return statusMap[agentId] || 'default';
}

// Agent Status Bubble Component
interface AgentStatusBubbleProps {
  agentId: string;
  agentName: string;
  status: AgentStatus;
}

function AgentStatusBubble({ agentId, agentName, status }: AgentStatusBubbleProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      className={`w-3 h-3 rounded-full ${getStatusColor(status)} cursor-pointer hover:scale-110 transition-transform`}
      title={agentName}
    />
  );
}

// Helper functions
const calculateDataFreshness = (lastReceived: Date | null): 'fresh' | 'stale' | 'old' => {
  if (!lastReceived) return 'old';
  const now = new Date();
  const timeDiff = now.getTime() - lastReceived.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  if (hoursDiff < 1) return 'fresh';
  if (hoursDiff < 24) return 'stale';
  return 'old';
};

const getDataFreshnessColor = (freshness: 'fresh' | 'stale' | 'old') => {
  switch (freshness) {
    case 'fresh': return 'text-green-600';
    case 'stale': return 'text-yellow-600';
    case 'old': return 'text-red-600';
  }
};

interface ResultsSidebarProps {
  currentPage?: 'strategy' | 'dxptools' | 'insights' | 'optimization';
}

export default function ResultsSidebar({ currentPage }: ResultsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Webhook status tracking states
  const [lastWebhookReceived, setLastWebhookReceived] = useState<Date | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [workflowStatus, setWorkflowStatus] = useState<'success' | 'failed' | 'pending' | null>('success');

  // Determine active area based on current path
  const getActiveAreaFromPath = (path: string) => {
    if (path.includes('/strategy')) return 'strategy-plans';
    if (path.includes('/dxptools')) return 'dxp-tools';
    if (path.includes('/insights')) return 'analytics-insights';
    if (path.includes('/optimization')) return 'experience-optimization';
    return '';
  };

  const activeArea = getActiveAreaFromPath(pathname);

  // Check if we're on the main TTYD page (exact match)
  const isTTYDActive = pathname === '/engine/results';

  return (
    <div id="sidebar-nav" className="w-80 bg-white border-r shadow-sm">
      {/* Header */}
      <div id="sidebar-header" className="p-6 border-b">
        <Link href="/engine/results" className="block">
          <div id="branding" className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer">
            <div className="rounded-lg">
              <Image
                src="/images/gradient-orb.png"
                alt="Opal AI"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">Opal AI</h1>
              <p className="text-sm text-muted-foreground">Strategy Assistant</p>
            </div>
          </div>
        </Link>
      </div>

      {/* TTYD (Talk To Your Data) Link */}
      <div className="p-4 border-b border-gray-200">
        <Link
          href="/engine/results"
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border ${
            isTTYDActive
              ? 'bg-blue-50 text-blue-700 border-blue-200 border-l-4 border-l-blue-600'
              : 'text-gray-700 hover:bg-gray-50 border-gray-200'
          }`}
        >
          <MessageSquare className={`h-5 w-5 ${isTTYDActive ? 'text-blue-600' : ''}`} />
          <div className="flex-1 text-left">
            <div className="font-medium">Talk To Your Data</div>
            <div className={`text-xs ${isTTYDActive ? 'text-blue-600' : 'text-muted-foreground'}`}>
              Interactive data exploration
            </div>
          </div>
          {isTTYDActive ? (
            <ArrowRight className="h-4 w-4 text-blue-600" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </Link>
      </div>

      {/* Navigation Areas */}
      <div id="nav-areas" className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Results Dashboard
        </h2>
        <nav className="space-y-2">
          {navigationAreas.map((area) => {
            const Icon = area.icon;
            const isActive = activeArea === area.id;

            return (
              <button
                key={area.id}
                onClick={() => router.push(area.url)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">{area.title}</span>
                {isActive && <ArrowRight className="h-4 w-4 ml-auto text-blue-600" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Recent Data Accordion */}
      <div className="p-4">
        <Accordion id="recent-data" type="single" collapsible defaultValue="recent-data" className="bg-slate-50 rounded-lg">
          <AccordionItem value="recent-data" className="border-none">
            <AccordionTrigger className="p-3 pb-2 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Activity className={`h-4 w-4 ${
                    webhookStatus === 'connected' ? 'text-green-600' :
                    webhookStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <span className="text-sm font-medium text-gray-800">Recent Data</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4">
                  <span className={getDataFreshnessColor(calculateDataFreshness(lastWebhookReceived))}>
                    {calculateDataFreshness(lastWebhookReceived) === 'fresh' ? '●' :
                     calculateDataFreshness(lastWebhookReceived) === 'stale' ? '◐' : '○'}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3">
                {/* OPAL Workflow Status */}
                <div className="flex items-center gap-2 text-xs">
                  <span>Opal Workflow:</span>
                  {/* Workflow time - show current time or last webhook time */}
                  <span className="text-muted-foreground">
                    {lastWebhookReceived
                      ? `${lastWebhookReceived.toLocaleDateString()} ${lastWebhookReceived.toLocaleTimeString()}`
                      : `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
                    }
                  </span>
                  {workflowStatus === 'success' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : workflowStatus === 'failed' ? (
                    <X className="h-3 w-3 text-red-600" />
                  ) : workflowStatus === 'pending' ? (
                    <Clock className="h-3 w-3 text-yellow-600 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                </div>

                {/* Agent Status Bubbles */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">OPAL Agents:</div>
                  <div className="flex items-center gap-1.5">
                    <AgentStatusBubble
                      agentId="roadmap_generator"
                      agentName="Roadmap Generator"
                      status={getAgentStatus('roadmap_generator')}
                    />
                    <AgentStatusBubble
                      agentId="integration_health"
                      agentName="Integration Health"
                      status={getAgentStatus('integration_health')}
                    />
                    <AgentStatusBubble
                      agentId="personalization_idea_generator"
                      agentName="Personalization Idea Generator"
                      status={getAgentStatus('personalization_idea_generator')}
                    />
                    <AgentStatusBubble
                      agentId="cmp_organizer"
                      agentName="CMP Organizer"
                      status={getAgentStatus('cmp_organizer')}
                    />
                    <AgentStatusBubble
                      agentId="experiment_blueprinter"
                      agentName="Experiment Blueprinter"
                      status={getAgentStatus('experiment_blueprinter')}
                    />
                    <AgentStatusBubble
                      agentId="customer_journey"
                      agentName="Customer Journey"
                      status={getAgentStatus('customer_journey')}
                    />
                    <AgentStatusBubble
                      agentId="audience_suggester"
                      agentName="Audience Suggester"
                      status={getAgentStatus('audience_suggester')}
                    />
                    <AgentStatusBubble
                      agentId="geo_audit"
                      agentName="Geo Audit"
                      status={getAgentStatus('geo_audit')}
                    />
                    <AgentStatusBubble
                      agentId="content_review"
                      agentName="Content Review"
                      status={getAgentStatus('content_review')}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}