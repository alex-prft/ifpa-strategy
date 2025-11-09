'use client';

import { useState, useEffect } from 'react';

// Speech Recognition API declarations
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import ImpactEffortMatrix from './ImpactEffortMatrix';
import TimelineRoadmap from './TimelineRoadmap';
import AnalyticsContentDashboard from './AnalyticsContentDashboard';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { RecommendationEngine, UserContext, EnhancedRecommendation } from '@/lib/utils/recommendationEngine';
import {
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Filter,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Users,
  BookOpen,
  Eye,
  Zap,
  Database,
  MessageSquare,
  Mic,
  Lightbulb,
  Palette,
  Calendar,
  Map,
  ExternalLink,
  Star,
  Activity,
  Globe,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronRight,
  AlertTriangle,
  BarChart,
  Brain,
  Code,
  FileCheck,
  FileText,
  GitBranch,
  Heart,
  Layers,
  Lock,
  Network,
  Paintbrush,
  Rocket,
  Route,
  Shield,
  Smartphone,
  TrendingDown,
  Wrench,
  X
} from 'lucide-react';
import {
  getStatusColor,
  getScoreColor,
  getRiskColor,
  getImpactColor
} from '@/utils/dashboard-utilities';

interface StrategyDashboardProps {
  workflowResult: OSAWorkflowOutput;
}

// Define the navigation structure
const navigationAreas = [
  {
    id: 'strategy-plans',
    title: 'Strategy Plans',
    icon: Target,
    color: 'blue',
    tabs: [
      { id: 'osa', title: 'OSA', description: 'AI-powered insights, highlights, and recommendations' },
      { id: 'overview', title: 'Quick Wins', description: 'Maturity Assessment Summary + KPIs' },
      { id: 'personalization-maturity', title: 'Maturity', description: 'Phased tags + charts' },
      { id: 'phased-recommendations', title: 'Phases', description: 'Impact vs Effort matrix' },
      { id: 'example-roadmap', title: 'Roadmap', description: 'Timeline visualization' }
    ]
  },
  {
    id: 'dxp-tools',
    title: 'Optimizely DXP Tools',
    icon: Settings,
    color: 'purple',
    tabs: [
      { id: 'content-recommendations', title: 'Content Recs', description: 'Cards with priority scores' },
      { id: 'cms', title: 'CMS', description: 'Content Management insights' },
      { id: 'odp', title: 'ODP', description: 'Data Platform analytics' },
      { id: 'webx', title: 'WEBX', description: 'Web Experimentation tools' },
      { id: 'cmp', title: 'CMP', description: 'Campaign Management platform' }
    ]
  },
  {
    id: 'analytics-insights',
    title: 'Analytics Insights',
    icon: BarChart3,
    color: 'green',
    tabs: [
      { id: 'osa', title: 'OSA', description: 'AI-powered analytics insights and recommendations' },
      { id: 'content', title: 'Content', description: 'Performance charts' },
      { id: 'audiences', title: 'Audiences', description: 'Segmentation graphs' },
      { id: 'customer-experience', title: 'CX', description: 'Journey maps' },
      { id: 'other', title: 'Other', description: 'Miscellaneous metrics' }
    ]
  },
  {
    id: 'experience-optimization',
    title: 'Experience Optimization',
    icon: TrendingUp,
    color: 'orange',
    tabs: [
      { id: 'content-opt', title: 'Content', description: 'Content optimization strategies' },
      { id: 'experimentation', title: 'Experimentation', description: 'Testing frameworks' },
      { id: 'personalization', title: 'Personalization', description: 'Personalization engines' },
      { id: 'user-experience', title: 'UX', description: 'UX optimization' },
      { id: 'technology', title: 'Technology', description: 'Technical implementation' }
    ]
  }
];

// Phased implementation levels
const phaseConfig = {
  crawl: { label: 'Crawl', color: 'bg-gray-100 text-gray-800', priority: 1 },
  walk: { label: 'Walk', color: 'bg-blue-100 text-blue-800', priority: 2 },
  run: { label: 'Run', color: 'bg-green-100 text-green-800', priority: 3 },
  fly: { label: 'Fly', color: 'bg-purple-100 text-purple-800', priority: 4 }
};

// User roles for personalization
const userRoles = [
  { id: 'all', label: 'All Roles' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'ux', label: 'UX Designer' },
  { id: 'exec', label: 'Executive' },
  { id: 'developer', label: 'Developer' }
];

// Agent status type
type AgentStatus = 'default' | 'active' | 'error';

// Mock agent status function - in production this would connect to real agent monitoring
function getAgentStatus(agentId: string): AgentStatus {
  // Simulate different states for demonstration
  const statusMap: Record<string, AgentStatus> = {
    'roadmap_generator': 'active',
    'integration_health': 'active',
    'personalization_idea_generator': 'default',
    'cmp_organizer': 'error',
    'experiment_blueprinter': 'active',
    'customer_journey': 'default',
    'audience_suggester': 'default',
    'geo_audit': 'error',
    'content_review': 'active'
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

export default function StrategyDashboard({ workflowResult }: StrategyDashboardProps) {
  const [activeArea, setActiveArea] = useState('strategy-plans');
  const [activeTab, setActiveTab] = useState('osa');
  const [activeActionTab, setActiveActionTab] = useState('content');
  const [selectedRole, setSelectedRole] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [syncProgress, setSyncProgress] = useState(85);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showTTYD, setShowTTYD] = useState(true);

  // Webhook status tracking states
  const [lastWebhookReceived, setLastWebhookReceived] = useState<Date | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [workflowStatus, setWorkflowStatus] = useState<'success' | 'failed' | 'pending' | null>('success');
  const [dataFreshness, setDataFreshness] = useState<'fresh' | 'stale' | 'old'>('fresh');
  const [ttydQuestion, setTtydQuestion] = useState('');

  // Initialize analytics and recommendation systems
  const analytics = useAnalytics({
    userId: 'demo-user', // In production, get from auth context
    userRole: selectedRole === 'all' ? 'Marketing Manager' :
             selectedRole === 'marketing' ? 'Marketing Manager' :
             selectedRole === 'ux' ? 'UX Designer' :
             selectedRole === 'exec' ? 'Executive' :
             selectedRole === 'developer' ? 'Technical Lead' : 'Marketing Manager',
    enableTracking: true
  });

  const [recommendationEngine] = useState(() => new RecommendationEngine());
  const [recommendations, setRecommendations] = useState<EnhancedRecommendation[]>([]);

  // Generate personalized recommendations based on user context
  useEffect(() => {
    const userContext: UserContext = {
      role: selectedRole === 'all' ? 'Marketing Manager' :
            selectedRole === 'marketing' ? 'Marketing Manager' :
            selectedRole === 'ux' ? 'UX Designer' :
            selectedRole === 'exec' ? 'Executive' :
            selectedRole === 'developer' ? 'Technical Lead' : 'Marketing Manager',
      experienceLevel: 'intermediate', // In production, get from user profile
      currentFocus: [activeArea === 'strategy-plans' ? 'content' :
                     activeArea === 'dxp-tools' ? 'technology' :
                     activeArea === 'analytics-insights' ? 'experimentation' : 'ux'],
      pastActions: {
        acceptedRecommendations: [],
        dismissedRecommendations: [],
        implementedSolutions: []
      },
      constraints: {
        budget: 'medium',
        timeline: 'normal',
        teamSize: 'medium'
      },
      preferences: {
        riskTolerance: 'moderate',
        preferredApproach: 'incremental',
        focusArea: activeArea === 'strategy-plans' ? 'content' :
                  activeArea === 'dxp-tools' ? 'technology' :
                  activeArea === 'analytics-insights' ? 'experimentation' : 'ux'
      }
    };

    const newRecommendations = recommendationEngine.generateRecommendations(
      userContext,
      activeArea,
      activeTab
    );
    setRecommendations(newRecommendations);
  }, [activeArea, activeTab, selectedRole, recommendationEngine]);

  // Auto-update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      setSyncProgress(prev => Math.min(100, prev + Math.random() * 5));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAreaChange = (areaId: string) => {
    const previousArea = activeArea;
    setActiveArea(areaId);
    const area = navigationAreas.find(a => a.id === areaId);
    if (area && area.tabs.length > 0) {
      setActiveTab(area.tabs[0].id);
    }

    // Track area change analytics
    analytics.track({
      eventType: 'page_view',
      properties: {
        areaId: areaId,
        previousArea: previousArea,
        tabId: area?.tabs[0]?.id,
        userRole: selectedRole,
        actionTaken: 'area_navigation'
      }
    });
  };

  const handleTabChange = (tabId: string) => {
    const previousTab = activeTab;
    setActiveTab(tabId);

    // Track tab change analytics
    analytics.trackTabChange(activeArea, previousTab, tabId);
  };

  // Helper functions for webhook status
  const getDataFreshnessColor = (freshness: 'fresh' | 'stale' | 'old') => {
    switch (freshness) {
      case 'fresh': return 'text-green-600';
      case 'stale': return 'text-yellow-600';
      case 'old': return 'text-red-600';
    }
  };

  const getWorkflowStatusIcon = (status: 'success' | 'failed' | 'pending' | null) => {
    switch (status) {
      case 'success': return '✓';
      case 'failed': return '✗';
      case 'pending': return '⏳';
      default: return '—';
    }
  };

  const calculateDataFreshness = (lastReceived: Date | null): 'fresh' | 'stale' | 'old' => {
    if (!lastReceived) return 'old';
    const now = new Date();
    const hoursSince = (now.getTime() - lastReceived.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 1) return 'fresh';
    if (hoursSince < 24) return 'stale';
    return 'old';
  };

  const currentArea = navigationAreas.find(area => area.id === activeArea);

  return (
    <div id="strategy-dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div id="sidebar-nav" className="w-80 bg-white border-r shadow-sm">
          {/* Header */}
          <div id="sidebar-header" className="p-6 border-b">
            <div id="branding" className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Opal AI</h1>
                <p className="text-sm text-muted-foreground">Strategy Assistant</p>
              </div>
            </div>

            {/* Recent Data Accordion */}
            <Accordion type="single" collapsible defaultValue="recent-data" className="bg-slate-50 rounded-lg">
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

          {/* TTYD (Talk To Your Data) Link */}
          <div className="p-4 border-b border-gray-200">
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
              onClick={() => {
                console.log('Navigate to TTYD (Talk To Your Data)');
                setShowTTYD(true);
              }}
            >
              <MessageSquare className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Talk To Your Data</div>
                <div className="text-xs text-blue-600">Interactive data exploration</div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Areas */}
          <div id="nav-areas" className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Results Dashboard
            </h2>
            <nav className="space-y-2">
              {navigationAreas.map((area) => {
                const Icon = area.icon;
                const isActive = activeArea === area.id && !showTTYD;

                return (
                  <button
                    key={area.id}
                    onClick={() => handleAreaChange(area.id)}
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

          {/* Role Filter */}
          <div id="filters-section" className="border-b">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isFilterExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                <div className="space-y-2 pt-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">View for Role</span>
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Range</span>
                  </div>
                  <Select defaultValue="90days">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                      <SelectItem value="12months">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Export
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Accordion Sections */}
          <div id="sidebar-accordions" className="p-4 border-t mt-auto space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {/* Implementation Ready Accordion */}
              <AccordionItem value="implementation-ready">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    AI Assistant Status
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-900">87%</div>
                    <div className="text-xs text-green-700 mb-3">Strategy completion score</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Foundation</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>Tools Setup</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>Analytics</span>
                        <span>76%</span>
                      </div>
                      <Progress value={76} className="h-1" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Related Insights Accordion */}
              <AccordionItem value="related-insights">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    Related Insights
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>DXP Tool Readiness →</span>
                      <Badge variant="outline" className="text-xs">Tools</Badge>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>Analytics Setup →</span>
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>Optimization Plan →</span>
                      <Badge variant="outline" className="text-xs">Experience</Badge>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>Content Performance →</span>
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                      <span>Audience Insights →</span>
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Share with Team Accordion */}
              <AccordionItem value="share-team">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Share with Team
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <MessageSquare className="h-3 w-3" />
                      Send to Friend
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Download className="h-3 w-3" />
                            Print & Download
                          </div>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <Printer className="h-4 w-4" />
                          Print Report
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          Download Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          Download PowerPoint
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Main Content */}
        <div id="main-content" className="flex-1">
          {/* Header with Tabs - Hidden when TTYD is active */}
          {!showTTYD && (
            <div id="main-header" className="bg-white border-b shadow-sm sticky top-0 z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentArea?.title}</h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                {currentArea && (
                  <Tabs id="main-tabs" value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5 h-auto p-1 bg-gray-100">
                      {currentArea.tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        >
                          {tab.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
              </div>
            </div>
          )}


          {/* Content Area */}
          <div id="content-area" className="p-6">
            {showTTYD ? (
              <TTYDContent
                question={ttydQuestion}
                onQuestionChange={setTtydQuestion}
                onClose={() => setShowTTYD(false)}
              />
            ) : (
              <>
                <ActionTabContent
                  areaId={activeArea}
                  tabId={activeTab}
                  actionTabId={activeActionTab}
                  selectedRole={selectedRole}
                  workflowResult={workflowResult}
                  recommendations={recommendations}
                  analytics={analytics}
                />

                {/* Engine Actions and Summary */}
                <EngineActionsSummary
                  areaId={activeArea}
                  tabId={activeTab}
                  actionTabId={activeActionTab}
                />

                {/* Results Footer */}
                <ResultsFooter />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Action tab content component
interface ActionTabContentProps {
  areaId: string;
  tabId: string;
  actionTabId: string;
  selectedRole: string;
  workflowResult: OSAWorkflowOutput;
  recommendations: EnhancedRecommendation[];
  analytics: ReturnType<typeof useAnalytics>;
}

function ActionTabContent({ areaId, tabId, actionTabId, selectedRole, workflowResult, recommendations, analytics }: ActionTabContentProps) {
  // Handle different action tabs
  if (actionTabId === 'view-recommendations') {
    return (
      <RecommendationsContent
        areaId={areaId}
        tabId={tabId}
        selectedRole={selectedRole}
        recommendations={recommendations}
        analytics={analytics}
      />
    );
  }

  // Default content tab - show main area content
  if (actionTabId === 'content') {
    // Strategy Plans content
    if (areaId === 'strategy-plans') {
      if (tabId === 'osa') {
        return <OSAInsights workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'overview') {
        return <StrategyOverview workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'personalization-maturity') {
        return <MaturityAssessmentDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'phased-recommendations') {
        return <PhasesRoadmapDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'example-roadmap') {
        return <EnhancedRoadmapView workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
    }

    // Analytics Insights content
    if (areaId === 'analytics-insights') {
      if (tabId === 'osa') {
        return <AnalyticsOSAInsights workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'content') {
        return <AnalyticsContentDashboard />;
      }
      if (tabId === 'audiences') {
        return <AudiencesAnalyticsDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'customer-experience') {
        return <CXAnalyticsDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'data-governance' || tabId === 'governance' || tabId === 'other') {
        return <GovernanceAnalyticsDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
    }

    // Optimizely DXP Tools content
    if (areaId === 'dxp-tools') {
      if (tabId === 'content-recommendations') {
        return <ContentRecommendationsContent workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'cms') {
        return <CMSInsightsContent workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'odp') {
        return <ODPAnalyticsContent workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'webx') {
        return <WEBXExperimentationContent workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'cmp') {
        return <CMPCampaignContent workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
    }

    // Experience Optimization content
    if (areaId === 'experience-optimization') {
      if (tabId === 'content-opt') {
        return <ContentOptimizationDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'experimentation') {
        return <ExperimentationDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'personalization') {
        return <PersonalizationDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'user-experience') {
        return <UXOptimizationDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
      if (tabId === 'technology') {
        return <TechnologyOptimizationDashboard workflowResult={workflowResult} selectedRole={selectedRole} />;
      }
    }

    // Placeholder for other area content
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {tabId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Content
          </CardTitle>
          <CardDescription>
            Detailed insights and recommendations for {tabId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Content for {areaId} → {tabId} will be implemented here
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// Analytics OSA Insights component with analytics-focused KPI cards and insights
function AnalyticsOSAInsights({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="analytics-osa-insights" className="space-y-6">
      {/* Analytics KPI Summary Cards */}
      <div id="analytics-kpi-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Quality Score</p>
                <p className="text-2xl font-bold">94%</p>
                <Badge className={phaseConfig.fly.color}>
                  Excellent
                </Badge>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">23.4%</p>
                <Badge className={phaseConfig.run.color}>
                  Above Average
                </Badge>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">4.2%</p>
                <Badge className={phaseConfig.walk.color}>
                  Improving
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analytics ROI</p>
                <p className="text-2xl font-bold">285%</p>
                <Badge className={phaseConfig.fly.color}>
                  High Performance
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Data Intelligence
            </CardTitle>
            <CardDescription>Key discoveries from your analytics data analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { insight: "Peak engagement occurs during 2-4 PM daily", confidence: 96, type: "opportunity" },
                { insight: "Mobile users show 3x higher conversion", confidence: 91, type: "success" },
                { insight: "Cart abandonment spikes at checkout step 3", confidence: 88, type: "risk" },
                { insight: "Email campaigns drive highest lifetime value", confidence: 94, type: "success" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    item.type === 'success' ? 'bg-green-500' :
                    item.type === 'opportunity' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.insight}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Confidence: {item.confidence}%</span>
                      <Progress value={item.confidence} className="h-1 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Analytics Optimization
            </CardTitle>
            <CardDescription>Data-driven recommendations for better performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Implement real-time behavior tracking", impact: "High", effort: "Medium", timeline: "1-2 weeks" },
                { action: "Set up advanced segmentation models", impact: "High", effort: "Low", timeline: "3-5 days" },
                { action: "Deploy predictive analytics engine", impact: "Medium", effort: "High", timeline: "6-8 weeks" },
                { action: "Create automated reporting dashboards", impact: "Medium", effort: "Medium", timeline: "2-3 weeks" }
              ].map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium flex-1">{item.action}</p>
                    <Badge variant={item.impact === 'High' ? 'default' : 'secondary'} className="ml-2">
                      {item.impact}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Effort: {item.effort}</span>
                    <span>Timeline: {item.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Performance Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Content Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Page Views</span>
                <span className="font-medium">2.4M</span>
              </div>
              <Progress value={78} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Time on Page</span>
                <span className="font-medium">3:42m</span>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                +18% improvement this month
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Audience Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Users</span>
                <span className="font-medium">487K</span>
              </div>
              <Progress value={92} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Session Duration</span>
                <span className="font-medium">8:15m</span>
              </div>
              <Progress value={73} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                5 key segments identified
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Conversion Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-medium">4.2%</span>
              </div>
              <Progress value={42} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue per Visit</span>
                <span className="font-medium">$12.40</span>
              </div>
              <Progress value={68} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                Optimization potential: +25%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Strategic Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Analytics Strategic Highlights
          </CardTitle>
          <CardDescription>Key findings and opportunities from your analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900 mb-2">Data Foundation</h4>
              <p className="text-sm text-blue-700">Excellent data quality (94%) with comprehensive tracking across all touchpoints. Ready for advanced analytics implementation.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-medium text-green-900 mb-2">Performance Insights</h4>
              <p className="text-sm text-green-700">Mobile users show 3x higher conversion rates. Significant opportunity to optimize mobile experience further.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-medium text-orange-900 mb-2">Optimization Opportunities</h4>
              <p className="text-sm text-orange-700">Cart abandonment analysis reveals specific drop-off points. Targeted interventions could improve conversion by 25%.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-medium text-purple-900 mb-2">Revenue Impact</h4>
              <p className="text-sm text-purple-700">Analytics-driven optimizations project 285% ROI through improved targeting and personalization strategies.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comprehensive Audiences Analytics Dashboard with segment analysis and behavioral insights
function AudiencesAnalyticsDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  // Comprehensive audience segmentation and behavioral analytics data
  const audienceData = {
    overview: {
      totalVisitors: 47892,
      totalSessions: 68451,
      activeSegments: 12,
      topPerformingSegment: 'High-Value Prospects',
      segmentGrowth: '+15%',
      engagementRate: '67%'
    },
    segments: [
      {
        id: 'high-value-prospects',
        name: 'High-Value Prospects',
        size: 12847,
        percentage: 26.8,
        avgValue: '$2,340',
        conversionRate: 18.5,
        engagement: 'Very High',
        growthRate: '+22%',
        characteristics: ['Annual income >$75K', 'Multiple product interest', 'Mobile-first behavior'],
        behaviors: {
          avgSessionDuration: '4m 32s',
          pagesPerSession: 6.2,
          bounceRate: 22,
          preferredChannels: ['Email', 'Social Media', 'Direct']
        },
        recommendations: [
          'Implement premium content personalization',
          'Create VIP-level customer journey',
          'Deploy advanced retargeting campaigns'
        ]
      },
      {
        id: 'price-conscious-shoppers',
        name: 'Price-Conscious Shoppers',
        size: 15234,
        percentage: 31.8,
        avgValue: '$890',
        conversionRate: 12.3,
        engagement: 'High',
        growthRate: '+8%',
        characteristics: ['Frequent coupon usage', 'Comparison shopping behavior', 'Deal-seeking'],
        behaviors: {
          avgSessionDuration: '3m 18s',
          pagesPerSession: 4.8,
          bounceRate: 35,
          preferredChannels: ['Email', 'Organic Search', 'Affiliate']
        },
        recommendations: [
          'Dynamic pricing and promotional content',
          'Comparison tool optimization',
          'Scarcity and urgency messaging'
        ]
      },
      {
        id: 'research-oriented-users',
        name: 'Research-Oriented Users',
        size: 9876,
        percentage: 20.6,
        avgValue: '$1,250',
        conversionRate: 8.7,
        engagement: 'Medium',
        growthRate: '+5%',
        characteristics: ['Extended research cycles', 'Content consumption heavy', 'Technical interest'],
        behaviors: {
          avgSessionDuration: '6m 45s',
          pagesPerSession: 9.1,
          bounceRate: 18,
          preferredChannels: ['Organic Search', 'Content Marketing', 'Webinars']
        },
        recommendations: [
          'Educational content personalization',
          'Progressive profiling implementation',
          'Nurture campaign optimization'
        ]
      },
      {
        id: 'quick-decision-makers',
        name: 'Quick Decision Makers',
        size: 6234,
        percentage: 13.0,
        avgValue: '$1,670',
        conversionRate: 28.4,
        engagement: 'High',
        growthRate: '+18%',
        characteristics: ['Fast purchase decisions', 'Brand loyal', 'Mobile-heavy usage'],
        behaviors: {
          avgSessionDuration: '1m 52s',
          pagesPerSession: 2.1,
          bounceRate: 45,
          preferredChannels: ['Paid Search', 'Direct', 'Mobile Apps']
        },
        recommendations: [
          'Streamlined checkout optimization',
          'One-click purchase implementation',
          'Mobile-first experience enhancement'
        ]
      },
      {
        id: 'window-shoppers',
        name: 'Window Shoppers',
        size: 3701,
        percentage: 7.8,
        avgValue: '$420',
        conversionRate: 3.2,
        engagement: 'Low',
        growthRate: '-2%',
        characteristics: ['Low purchase intent', 'Browse-heavy behavior', 'Price sensitive'],
        behaviors: {
          avgSessionDuration: '2m 15s',
          pagesPerSession: 3.4,
          bounceRate: 68,
          preferredChannels: ['Social Media', 'Organic Search', 'Referral']
        },
        recommendations: [
          'Engagement optimization campaigns',
          'Social proof and testimonials',
          'Exit-intent conversion tactics'
        ]
      }
    ],
    behavioralTrends: {
      activityHeatmap: {
        hourly: [
          { hour: '6AM', activity: 15 }, { hour: '7AM', activity: 28 }, { hour: '8AM', activity: 45 },
          { hour: '9AM', activity: 72 }, { hour: '10AM', activity: 85 }, { hour: '11AM', activity: 78 },
          { hour: '12PM', activity: 92 }, { hour: '1PM', activity: 88 }, { hour: '2PM', activity: 76 },
          { hour: '3PM', activity: 82 }, { hour: '4PM', activity: 68 }, { hour: '5PM', activity: 54 },
          { hour: '6PM', activity: 48 }, { hour: '7PM', activity: 65 }, { hour: '8PM', activity: 78 },
          { hour: '9PM', activity: 85 }, { hour: '10PM', activity: 73 }, { hour: '11PM', activity: 42 }
        ],
        weekly: [
          { day: 'Mon', activity: 78 }, { day: 'Tue', activity: 85 }, { day: 'Wed', activity: 82 },
          { day: 'Thu', activity: 88 }, { day: 'Fri', activity: 76 }, { day: 'Sat', activity: 65 }, { day: 'Sun', activity: 58 }
        ]
      },
      trends: [
        {
          metric: 'Mobile Usage',
          current: 72,
          previous: 68,
          trend: 'up',
          change: '+5.9%',
          insight: 'Mobile-first behavior continues to dominate across all segments'
        },
        {
          metric: 'Video Engagement',
          current: 45,
          previous: 38,
          trend: 'up',
          change: '+18.4%',
          insight: 'Video content driving significantly higher engagement rates'
        },
        {
          metric: 'Social Commerce',
          current: 23,
          previous: 19,
          trend: 'up',
          change: '+21.1%',
          insight: 'Social media becoming primary discovery channel for younger segments'
        },
        {
          metric: 'Cross-Device Journey',
          current: 34,
          previous: 29,
          trend: 'up',
          change: '+17.2%',
          insight: 'Multi-device usage patterns indicate sophisticated customer journeys'
        }
      ]
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'Very High': return 'bg-green-100 text-green-800';
      case 'High': return 'bg-blue-100 text-blue-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  };

  return (
    <div id="audiences-analytics-dashboard" className="space-y-6">
      {/* Audience Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{audienceData.overview.totalVisitors.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Visitors</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{audienceData.overview.totalSessions.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{audienceData.overview.activeSegments}</div>
              <div className="text-sm text-gray-600">Active Segments</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{audienceData.overview.segmentGrowth}</div>
              <div className="text-sm text-gray-600">Segment Growth</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-indigo-600">{audienceData.overview.engagementRate}</div>
              <div className="text-sm text-gray-600">Engagement Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">Top Segment</div>
              <div className="text-xs text-blue-600 mt-1">{audienceData.overview.topPerformingSegment}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Segments Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top Audience Segments Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive breakdown of key audience segments with behavioral insights and personalization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {audienceData.segments.map((segment) => (
              <div key={segment.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Segment Overview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{segment.name}</h3>
                      <Badge className={getEngagementColor(segment.engagement)}>
                        {segment.engagement}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{segment.size.toLocaleString()}</div>
                        <div className="text-xs text-blue-700">Users ({segment.percentage}%)</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{segment.avgValue}</div>
                        <div className="text-xs text-green-700">Avg Value</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{segment.conversionRate}%</div>
                        <div className="text-xs text-purple-700">Conversion</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{segment.growthRate}</div>
                        <div className="text-xs text-orange-700">Growth Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Insights */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Behavioral Profile</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Session Duration:</span>
                        <span className="font-medium">{segment.behaviors.avgSessionDuration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pages/Session:</span>
                        <span className="font-medium">{segment.behaviors.pagesPerSession}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Bounce Rate:</span>
                        <span className="font-medium">{segment.behaviors.bounceRate}%</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Key Characteristics</div>
                      <div className="space-y-1">
                        {segment.characteristics.map((char, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Preferred Channels</div>
                      <div className="flex flex-wrap gap-1">
                        {segment.behaviors.preferredChannels.map((channel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Personalization Recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Personalization Strategy</h4>
                    <div className="space-y-3">
                      {segment.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <span className="text-sm text-blue-800">{rec}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Hourly Activity Heatmap
            </CardTitle>
            <CardDescription>
              User activity patterns throughout the day for optimization targeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2">
                {audienceData.behavioralTrends.activityHeatmap.hourly.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{item.hour}</div>
                    <div
                      className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                        item.activity >= 80 ? 'bg-red-500 text-white' :
                        item.activity >= 60 ? 'bg-orange-400 text-white' :
                        item.activity >= 40 ? 'bg-yellow-400 text-gray-900' :
                        item.activity >= 20 ? 'bg-green-400 text-gray-900' :
                        'bg-blue-200 text-gray-700'
                      }`}
                    >
                      {item.activity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>Low Activity</span>
                <span>Peak Hours: 12PM-2PM, 8PM-10PM</span>
                <span>High Activity</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Weekly Activity Patterns
            </CardTitle>
            <CardDescription>
              Day-of-week engagement trends and optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audienceData.behavioralTrends.activityHeatmap.weekly.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{item.day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${item.activity}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.activity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Trends Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Behavioral Trends & Insights
          </CardTitle>
          <CardDescription>
            Key behavioral shifts and emerging patterns across audience segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {audienceData.behavioralTrends.trends.map((trend, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{trend.metric}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>
                      {getTrendIcon(trend.trend)} {trend.change}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current</span>
                    <span className="font-medium">{trend.current}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Previous</span>
                    <span className="text-gray-500">{trend.previous}%</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                      💡 {trend.insight}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Strategic Recommendations */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <h4 className="font-medium text-blue-900 mb-3">Strategic Audience Optimization Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Implement mobile-first personalization for 72% mobile usage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Deploy video content strategy for +18% engagement boost</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Create peak-hour campaign targeting (12PM-2PM, 8PM-10PM)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Develop social commerce integration for younger segments</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Optimize cross-device journey experience for 34% users</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Launch segment-specific nurture campaigns for research-oriented users</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comprehensive CX Analytics Dashboard with Journey Map, Drop-Off Analysis, and UX Recommendations
function CXAnalyticsDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const cxData = {
    journeyOverview: {
      totalJourneys: 34782,
      averageJourneyTime: "14.2 minutes",
      completionRate: 68.4,
      touchpoints: 8.7,
      satisfactionScore: 7.8
    },

    journeyMap: {
      stages: [
        {
          name: "Awareness",
          visitors: 100000,
          conversionRate: 24.5,
          averageTime: "2.1 min",
          satisfaction: 8.2,
          dropOffRate: 15.2,
          keyTouchpoints: ["Search", "Social Media", "Referrals"],
          painPoints: ["Long load times", "Poor mobile experience"],
          opportunities: ["Improve page speed", "Enhanced mobile UX"]
        },
        {
          name: "Interest",
          visitors: 24500,
          conversionRate: 45.8,
          averageTime: "4.7 min",
          satisfaction: 7.9,
          dropOffRate: 22.1,
          keyTouchpoints: ["Product Pages", "Category Browse", "Search Results"],
          painPoints: ["Information overload", "Complex navigation"],
          opportunities: ["Simplify product discovery", "Better filtering"]
        },
        {
          name: "Consideration",
          visitors: 11221,
          conversionRate: 62.3,
          averageTime: "6.8 min",
          satisfaction: 7.6,
          dropOffRate: 18.4,
          keyTouchpoints: ["Product Details", "Reviews", "Comparisons"],
          painPoints: ["Missing information", "Trust indicators"],
          opportunities: ["Enhanced product content", "Social proof"]
        },
        {
          name: "Purchase",
          visitors: 6989,
          conversionRate: 78.2,
          averageTime: "3.4 min",
          satisfaction: 8.1,
          dropOffRate: 12.8,
          keyTouchpoints: ["Cart", "Checkout", "Payment"],
          painPoints: ["Checkout complexity", "Limited payment options"],
          opportunities: ["Streamline checkout", "Add payment methods"]
        },
        {
          name: "Retention",
          visitors: 5465,
          conversionRate: 34.7,
          averageTime: "8.2 min",
          satisfaction: 8.4,
          dropOffRate: 8.1,
          keyTouchpoints: ["Account", "Support", "Reorder"],
          painPoints: ["Account complexity", "Support accessibility"],
          opportunities: ["Improve self-service", "Proactive engagement"]
        }
      ]
    },

    conversionFunnel: {
      stages: [
        { name: "Homepage Visit", users: 100000, rate: 100, dropOff: 0 },
        { name: "Product Browse", users: 68500, rate: 68.5, dropOff: 31.5 },
        { name: "Product View", users: 45200, rate: 45.2, dropOff: 23.3 },
        { name: "Add to Cart", users: 28700, rate: 28.7, dropOff: 16.5 },
        { name: "Checkout Start", users: 19800, rate: 19.8, dropOff: 8.9 },
        { name: "Payment", users: 15400, rate: 15.4, dropOff: 4.4 },
        { name: "Purchase Complete", users: 12300, rate: 12.3, dropOff: 3.1 }
      ],

      criticalDropOffs: [
        {
          stage: "Homepage → Browse",
          dropOffRate: 31.5,
          impact: "High",
          reasons: ["Poor value proposition", "Unclear navigation", "Slow loading"],
          recommendations: ["A/B test hero messaging", "Simplify navigation", "Optimize page speed"]
        },
        {
          stage: "Browse → Product View",
          dropOffRate: 23.3,
          impact: "Medium",
          reasons: ["Poor product discovery", "Ineffective filtering", "Limited product info"],
          recommendations: ["Enhance search functionality", "Improve product thumbnails", "Add quick view"]
        },
        {
          stage: "Product View → Add to Cart",
          dropOffRate: 16.5,
          impact: "High",
          reasons: ["Pricing concerns", "Missing information", "Trust issues"],
          recommendations: ["Show value propositions", "Add customer reviews", "Display security badges"]
        }
      ]
    },

    uxRecommendations: {
      priority: [
        {
          title: "Mobile Checkout Optimization",
          impact: "High",
          effort: "Medium",
          expectedLift: "+18% conversion",
          confidence: 87,
          description: "Streamline mobile checkout flow to reduce cart abandonment",
          actions: [
            "Implement guest checkout option",
            "Reduce form fields by 40%",
            "Add mobile payment methods (Apple Pay, Google Pay)",
            "Optimize for one-handed mobile use"
          ],
          timeline: "4-6 weeks",
          roi: "$240K annual revenue impact"
        },
        {
          title: "Product Discovery Enhancement",
          impact: "High",
          effort: "High",
          expectedLift: "+24% engagement",
          confidence: 82,
          description: "Improve product findability and browsing experience",
          actions: [
            "Implement AI-powered search with typo tolerance",
            "Add visual search functionality",
            "Enhance filtering with smart suggestions",
            "Introduce personalized product recommendations"
          ],
          timeline: "8-10 weeks",
          roi: "$380K annual revenue impact"
        },
        {
          title: "Page Speed Optimization",
          impact: "Medium",
          effort: "Medium",
          expectedLift: "+12% retention",
          confidence: 94,
          description: "Reduce page load times across all key pages",
          actions: [
            "Implement lazy loading for images",
            "Optimize critical rendering path",
            "Compress and minify assets",
            "Leverage CDN for global performance"
          ],
          timeline: "3-4 weeks",
          roi: "$150K annual revenue impact"
        },
        {
          title: "Trust & Social Proof",
          impact: "Medium",
          effort: "Low",
          expectedLift: "+15% conversion",
          confidence: 79,
          description: "Build customer confidence through enhanced trust signals",
          actions: [
            "Display customer reviews prominently",
            "Add security badges and certifications",
            "Show real-time social proof (recent purchases)",
            "Implement customer testimonials"
          ],
          timeline: "2-3 weeks",
          roi: "$200K annual revenue impact"
        }
      ],

      quickWins: [
        {
          title: "Add Exit-Intent Popups",
          effort: "Low",
          timeline: "1 week",
          expectedLift: "+8% email capture",
          description: "Capture abandoning users with targeted offers"
        },
        {
          title: "Optimize CTA Buttons",
          effort: "Low",
          timeline: "1 week",
          expectedLift: "+5% clicks",
          description: "Improve button contrast, size, and placement"
        },
        {
          title: "Add Product Comparison Tool",
          effort: "Medium",
          timeline: "3 weeks",
          expectedLift: "+12% consideration",
          description: "Help users compare products side-by-side"
        }
      ]
    }
  };

  // Helper functions for data visualization
  const getFunnelColor = (rate: number) => {
    if (rate >= 20) return 'bg-green-500';
    if (rate >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div id="cx-analytics-dashboard" className="space-y-6">
      {/* CX Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{cxData.journeyOverview.totalJourneys.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Journeys</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cxData.journeyOverview.averageJourneyTime}</div>
              <div className="text-sm text-gray-600">Avg Journey Time</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{cxData.journeyOverview.completionRate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{cxData.journeyOverview.touchpoints}</div>
              <div className="text-sm text-gray-600">Avg Touchpoints</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{cxData.journeyOverview.satisfactionScore}/10</div>
              <div className="text-sm text-gray-600">Satisfaction Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            Customer Journey Map
          </CardTitle>
          <CardDescription>
            End-to-end customer journey analysis with conversion rates and optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Journey Flow Visualization */}
            <div className="relative">
              <div className="flex items-center justify-between space-x-4 overflow-x-auto pb-4">
                {cxData.journeyMap.stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-4 min-w-max">
                    <div className="flex flex-col items-center space-y-2">
                      {/* Stage Node */}
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-sm
                          ${stage.conversionRate >= 60 ? 'bg-green-500' :
                            stage.conversionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                          <div className="text-center">
                            <div className="text-lg">{stage.conversionRate}%</div>
                            <div className="text-xs">conversion</div>
                          </div>
                        </div>
                        {/* Satisfaction Badge */}
                        <div className="absolute -top-2 -right-2 bg-white border-2 border-blue-500 rounded-full px-1.5 py-0.5 text-xs font-medium">
                          ⭐ {stage.satisfaction}
                        </div>
                      </div>

                      {/* Stage Info */}
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{stage.name}</div>
                        <div className="text-sm text-gray-600">{stage.visitors.toLocaleString()} users</div>
                        <div className="text-xs text-gray-500">{stage.averageTime}</div>
                      </div>

                      {/* Drop-off indicator */}
                      {stage.dropOffRate > 20 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                          <div className="text-xs text-red-600 font-medium">⚠️ {stage.dropOffRate}% drop-off</div>
                        </div>
                      )}
                    </div>

                    {/* Arrow connector */}
                    {index < cxData.journeyMap.stages.length - 1 && (
                      <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {cxData.journeyMap.stages.map((stage, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{stage.name}</h4>
                        <Badge variant="outline" className={stage.dropOffRate > 20 ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}>
                          {stage.dropOffRate}% drop-off
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Touchpoints:</span>
                          <span className="font-medium">{stage.keyTouchpoints.slice(0, 2).join(', ')}</span>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1">Pain Points:</div>
                          <ul className="text-xs text-red-600 space-y-1">
                            {stage.painPoints.map((pain, i) => (
                              <li key={i}>• {pain}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1">Opportunities:</div>
                          <ul className="text-xs text-green-600 space-y-1">
                            {stage.opportunities.map((opp, i) => (
                              <li key={i}>• {opp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            Conversion Funnel & Drop-Off Analysis
          </CardTitle>
          <CardDescription>
            Identify critical drop-off points and optimization opportunities in the conversion funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Funnel Visualization */}
            <div className="space-y-3">
              {cxData.conversionFunnel.stages.map((stage, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{stage.name}</div>

                  {/* Funnel Bar */}
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full ${getFunnelColor(stage.rate)} flex items-center justify-between px-3 transition-all duration-500`}
                      style={{ width: `${stage.rate}%` }}
                    >
                      <span className="text-white text-sm font-medium">{stage.users.toLocaleString()}</span>
                      <span className="text-white text-sm font-medium">{stage.rate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Drop-off indicator */}
                  {stage.dropOff > 0 && (
                    <div className="w-16 text-right">
                      <div className="text-sm text-red-600 font-medium">-{stage.dropOff.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Critical Drop-off Points */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Critical Drop-Off Points</h4>
              <div className="space-y-4">
                {cxData.conversionFunnel.criticalDropOffs.map((dropOff, index) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{dropOff.stage}</h5>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getImpactColor(dropOff.impact)} border`}>
                              {dropOff.impact} Impact
                            </Badge>
                            <span className="text-lg font-bold text-red-600">{dropOff.dropOffRate}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Identified Reasons:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {dropOff.reasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {dropOff.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UX Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Priority UX Recommendations
            </CardTitle>
            <CardDescription>
              High-impact optimization opportunities ranked by expected ROI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cxData.uxRecommendations.priority.map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{rec.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">{rec.expectedLift}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className={`font-medium ${getImpactColor(rec.impact).split(' ')[0]}`}>
                            {rec.impact}
                          </div>
                          <div className="text-xs text-gray-500">Impact</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">{rec.effort}</div>
                          <div className="text-xs text-gray-500">Effort</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{rec.confidence}%</div>
                          <div className="text-xs text-gray-500">Confidence</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Timeline:</span>
                          <span className="font-medium">{rec.timeline}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Expected ROI:</span>
                          <span className="font-medium text-green-600">{rec.roi}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Action Items:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.actions.slice(0, 3).map((action, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                {i + 1}
                              </div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Quick Wins & Low-Effort Improvements
            </CardTitle>
            <CardDescription>
              Fast implementation opportunities for immediate impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cxData.uxRecommendations.quickWins.map((win, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">{win.title}</h5>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {win.expectedLift}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">{win.description}</p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {win.timeline}
                          </span>
                          <span className={`font-medium ${
                            win.effort === 'Low' ? 'text-green-600' :
                            win.effort === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {win.effort} effort
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Implementation Priority */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="font-medium text-blue-900 mb-2">Implementation Strategy</h6>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Start with quick wins for immediate ROI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Run A/B tests for major changes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Monitor impact with cohort analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Comprehensive Governance & Compliance Analytics Dashboard
function GovernanceAnalyticsDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const governanceData = {
    overview: {
      complianceScore: 87.3,
      dataGovernanceScore: 79.1,
      privacyRiskScore: 92.4,
      integrationHealthScore: 84.7,
      totalDataSources: 23,
      activeIntegrations: 18,
      privacyIncidents: 0,
      lastAuditDate: "2024-10-15"
    },

    dataGovernance: {
      dataQuality: {
        completeness: 94.2,
        accuracy: 89.7,
        consistency: 91.5,
        timeliness: 86.8,
        validity: 93.1
      },

      dataLineage: {
        trackedSources: 23,
        documentedFlows: 18,
        mappedTransformations: 156,
        lineageCoverage: 78.3
      },

      dataClassification: [
        { type: "Public", count: 45820, percentage: 34.2, riskLevel: "Low", controls: "Standard access controls" },
        { type: "Internal", count: 67340, percentage: 50.3, riskLevel: "Medium", controls: "Role-based access, audit logging" },
        { type: "Confidential", count: 18950, percentage: 14.1, riskLevel: "High", controls: "Encryption, strict access controls" },
        { type: "Restricted", count: 1890, percentage: 1.4, riskLevel: "Critical", controls: "Multi-factor auth, executive approval" }
      ],

      stewardship: {
        assignedStewards: 12,
        activeDataDomains: 8,
        stewardshipCoverage: 89.2,
        responseTime: "2.3 hours",
        issueResolutionRate: 94.6
      }
    },

    privacyRisk: {
      riskAssessment: {
        overallRisk: "Low",
        lastAssessment: "2024-10-20",
        identifiedRisks: 3,
        mitigatedRisks: 15,
        riskTrend: "Decreasing"
      },

      complianceFrameworks: [
        {
          name: "GDPR",
          status: "Compliant",
          lastAudit: "2024-09-15",
          score: 94.2,
          requirements: { total: 47, compliant: 45, inProgress: 2, nonCompliant: 0 },
          nextReview: "2024-12-15"
        },
        {
          name: "CCPA",
          status: "Compliant",
          lastAudit: "2024-08-22",
          score: 91.8,
          requirements: { total: 32, compliant: 30, inProgress: 2, nonCompliant: 0 },
          nextReview: "2024-11-22"
        },
        {
          name: "SOC 2",
          status: "In Progress",
          lastAudit: "2024-10-01",
          score: 87.5,
          requirements: { total: 64, compliant: 58, inProgress: 5, nonCompliant: 1 },
          nextReview: "2024-11-01"
        }
      ],

      consentManagement: {
        totalConsents: 245780,
        activeConsents: 198650,
        consentRate: 80.8,
        withdrawalRate: 2.3,
        updateRate: 12.1,
        averageConsentAge: "8.7 months"
      },

      dataSubjectRequests: {
        totalRequests: 47,
        accessRequests: 32,
        deletionRequests: 12,
        correctionRequests: 3,
        averageResponseTime: "2.8 days",
        completionRate: 100
      }
    },

    integrationHealth: {
      systemOverview: {
        totalSystems: 23,
        healthySystems: 18,
        warningSystems: 4,
        criticalSystems: 1,
        uptimeAverage: 99.7,
        meanResponseTime: "245ms"
      },

      integrationStatus: [
        {
          name: "Salesforce CRM",
          type: "Customer Data",
          status: "Healthy",
          uptime: 99.9,
          latency: "120ms",
          dataVolume: "2.3M records/day",
          lastSync: "2 minutes ago",
          issues: 0
        },
        {
          name: "Adobe Analytics",
          type: "Behavioral Data",
          status: "Healthy",
          uptime: 99.8,
          latency: "180ms",
          dataVolume: "850K events/day",
          lastSync: "5 minutes ago",
          issues: 0
        },
        {
          name: "Marketo",
          type: "Marketing Automation",
          status: "Warning",
          uptime: 98.2,
          latency: "320ms",
          dataVolume: "450K records/day",
          lastSync: "15 minutes ago",
          issues: 2
        },
        {
          name: "Legacy Database",
          type: "Historical Data",
          status: "Critical",
          uptime: 94.1,
          latency: "1.2s",
          dataVolume: "120K records/day",
          lastSync: "2 hours ago",
          issues: 5
        }
      ],

      dataFlow: {
        inboundVolume: "4.8M records/day",
        outboundVolume: "3.2M records/day",
        processingErrors: 0.03,
        dataLatency: "avg 4.2 minutes",
        peakThroughput: "12K records/minute"
      },

      systemDependencies: [
        {
          upstream: "Salesforce",
          downstream: ["Customer Data Platform", "Analytics Warehouse", "Personalization Engine"],
          criticality: "High",
          failoverReady: true
        },
        {
          upstream: "Adobe Analytics",
          downstream: ["Behavioral Analytics", "Recommendation Engine", "Attribution Platform"],
          criticality: "High",
          failoverReady: true
        },
        {
          upstream: "Legacy Database",
          downstream: ["Historical Reporting", "Compliance Archive"],
          criticality: "Medium",
          failoverReady: false
        }
      ]
    },

    recommendations: {
      priority: [
        {
          title: "Legacy System Migration",
          category: "Integration Health",
          impact: "High",
          urgency: "High",
          description: "Migrate legacy database system to modern cloud infrastructure",
          risks: ["System downtime", "Data integrity issues", "Performance degradation"],
          benefits: ["Improved reliability", "Better performance", "Reduced maintenance"],
          timeline: "12-16 weeks",
          effort: "High",
          roi: "320% over 3 years"
        },
        {
          title: "Enhanced Data Lineage Documentation",
          category: "Data Governance",
          impact: "Medium",
          urgency: "Medium",
          description: "Complete data lineage documentation for remaining 22% of data flows",
          risks: ["Compliance audit findings", "Data quality issues", "Impact analysis difficulties"],
          benefits: ["Full audit trail", "Better change management", "Improved troubleshooting"],
          timeline: "6-8 weeks",
          effort: "Medium",
          roi: "185% over 2 years"
        },
        {
          title: "Automated Privacy Impact Assessments",
          category: "Privacy Risk",
          impact: "Medium",
          urgency: "Low",
          description: "Implement automated PIA workflows for new data processing activities",
          risks: ["Manual oversight gaps", "Compliance delays", "Inconsistent assessments"],
          benefits: ["Proactive risk management", "Faster compliance", "Standardized process"],
          timeline: "4-6 weeks",
          effort: "Low",
          roi: "145% over 18 months"
        }
      ]
    }
  };


  return (
    <div id="governance-analytics-dashboard" className="space-y-6">
      {/* Governance Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(governanceData.overview.complianceScore)}`}>
                {governanceData.overview.complianceScore}%
              </div>
              <div className="text-sm text-gray-600">Compliance Score</div>
              <Badge className="mt-2" variant="outline">
                {governanceData.overview.complianceScore >= 90 ? 'Excellent' :
                 governanceData.overview.complianceScore >= 80 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(governanceData.overview.dataGovernanceScore)}`}>
                {governanceData.overview.dataGovernanceScore}%
              </div>
              <div className="text-sm text-gray-600">Data Governance</div>
              <div className="text-xs text-gray-500 mt-1">{governanceData.overview.totalDataSources} sources</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(governanceData.overview.privacyRiskScore)}`}>
                {governanceData.overview.privacyRiskScore}%
              </div>
              <div className="text-sm text-gray-600">Privacy Risk Score</div>
              <div className="text-xs text-gray-500 mt-1">{governanceData.overview.privacyIncidents} incidents</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(governanceData.overview.integrationHealthScore)}`}>
                {governanceData.overview.integrationHealthScore}%
              </div>
              <div className="text-sm text-gray-600">Integration Health</div>
              <div className="text-xs text-gray-500 mt-1">{governanceData.overview.activeIntegrations} active</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Governance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Data Governance & Quality
          </CardTitle>
          <CardDescription>
            Comprehensive data quality metrics, classification, and stewardship overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Quality Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Data Quality Dimensions</h4>
              <div className="space-y-3">
                {Object.entries(governanceData.dataGovernance.dataQuality).map(([dimension, score]) => (
                  <div key={dimension} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{dimension}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getScoreColor(score).includes('green') ? 'bg-green-500' :
                            getScoreColor(score).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Lineage Status */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Data Lineage Coverage</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tracked Sources:</span>
                    <span className="font-medium">{governanceData.dataGovernance.dataLineage.trackedSources}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documented Flows:</span>
                    <span className="font-medium">{governanceData.dataGovernance.dataLineage.documentedFlows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span className="font-medium text-blue-700">{governanceData.dataGovernance.dataLineage.lineageCoverage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Classification */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Data Classification Overview</h4>
              <div className="space-y-3">
                {governanceData.dataGovernance.dataClassification.map((classification, index) => (
                  <Card key={index} className="border-l-4 border-l-gray-300">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{classification.type}</span>
                          <Badge className={`${getRiskColor(classification.riskLevel)} border`}>
                            {classification.riskLevel} Risk
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{classification.count.toLocaleString()} records</span>
                          <span className="font-medium">{classification.percentage}%</span>
                        </div>

                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Controls:</strong> {classification.controls}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Stewardship Stats */}
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Data Stewardship</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-700">{governanceData.dataGovernance.stewardship.assignedStewards}</div>
                    <div className="text-xs text-green-600">Active Stewards</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-700">{governanceData.dataGovernance.stewardship.stewardshipCoverage}%</div>
                    <div className="text-xs text-green-600">Coverage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Risk & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Privacy Risk & Compliance Management
          </CardTitle>
          <CardDescription>
            Privacy framework compliance, consent management, and data subject request tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Compliance Frameworks */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Compliance Framework Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {governanceData.privacyRisk.complianceFrameworks.map((framework, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{framework.name}</h5>
                          <Badge className={`${getStatusColor(framework.status)} border`}>
                            {framework.status}
                          </Badge>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(framework.score)}`}>
                            {framework.score}%
                          </div>
                          <div className="text-xs text-gray-500">Compliance Score</div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">✓ Compliant:</span>
                            <span className="font-medium">{framework.requirements.compliant}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-600">⏳ In Progress:</span>
                            <span className="font-medium">{framework.requirements.inProgress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">✗ Non-Compliant:</span>
                            <span className="font-medium">{framework.requirements.nonCompliant}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                          Next Review: {framework.nextReview}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Consent & Data Subject Requests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consent Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {governanceData.privacyRisk.consentManagement.consentRate}%
                      </div>
                      <div className="text-sm text-gray-600">Active Consent Rate</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Consents:</span>
                        <span className="font-medium">{governanceData.privacyRisk.consentManagement.totalConsents.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Consents:</span>
                        <span className="font-medium text-green-600">{governanceData.privacyRisk.consentManagement.activeConsents.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withdrawal Rate:</span>
                        <span className="font-medium text-red-600">{governanceData.privacyRisk.consentManagement.withdrawalRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Age:</span>
                        <span className="font-medium">{governanceData.privacyRisk.consentManagement.averageConsentAge}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Subject Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {governanceData.privacyRisk.dataSubjectRequests.averageResponseTime}
                      </div>
                      <div className="text-sm text-gray-600">Avg Response Time</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-medium text-blue-600">{governanceData.privacyRisk.dataSubjectRequests.accessRequests}</div>
                        <div className="text-xs text-gray-500">Access</div>
                      </div>
                      <div>
                        <div className="font-medium text-red-600">{governanceData.privacyRisk.dataSubjectRequests.deletionRequests}</div>
                        <div className="text-xs text-gray-500">Deletion</div>
                      </div>
                      <div>
                        <div className="font-medium text-yellow-600">{governanceData.privacyRisk.dataSubjectRequests.correctionRequests}</div>
                        <div className="text-xs text-gray-500">Correction</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        {governanceData.privacyRisk.dataSubjectRequests.completionRate}% Completion Rate
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Integration Health & System Monitoring
          </CardTitle>
          <CardDescription>
            Real-time system health, integration status, and data flow monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{governanceData.integrationHealth.systemOverview.healthySystems}</div>
                <div className="text-sm text-green-700">Healthy Systems</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{governanceData.integrationHealth.systemOverview.warningSystems}</div>
                <div className="text-sm text-yellow-700">Warning Systems</div>
              </div>
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{governanceData.integrationHealth.systemOverview.criticalSystems}</div>
                <div className="text-sm text-red-700">Critical Systems</div>
              </div>
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{governanceData.integrationHealth.systemOverview.uptimeAverage}%</div>
                <div className="text-sm text-blue-700">Avg Uptime</div>
              </div>
            </div>

            {/* Integration Status Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Integration System Status</h4>
              <div className="space-y-3">
                {governanceData.integrationHealth.integrationStatus.map((integration, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="md:col-span-2">
                          <div className="font-medium text-gray-900">{integration.name}</div>
                          <div className="text-sm text-gray-600">{integration.type}</div>
                        </div>

                        <div className="text-center">
                          <Badge className={`${getStatusColor(integration.status)} border`}>
                            {integration.status}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">{integration.uptime}% uptime</div>
                        </div>

                        <div className="text-center">
                          <div className="font-medium text-gray-700">{integration.latency}</div>
                          <div className="text-xs text-gray-500">latency</div>
                        </div>

                        <div className="text-center">
                          <div className="font-medium text-gray-700">{integration.dataVolume}</div>
                          <div className="text-xs text-gray-500">data volume</div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-gray-600">{integration.lastSync}</div>
                          <div className="text-xs text-gray-500">last sync</div>
                          {integration.issues > 0 && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              {integration.issues} issues
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Data Flow Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Flow Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inbound Volume:</span>
                      <span className="font-medium text-green-600">{governanceData.integrationHealth.dataFlow.inboundVolume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outbound Volume:</span>
                      <span className="font-medium text-blue-600">{governanceData.integrationHealth.dataFlow.outboundVolume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Errors:</span>
                      <span className={`font-medium ${governanceData.integrationHealth.dataFlow.processingErrors < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                        {governanceData.integrationHealth.dataFlow.processingErrors}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Latency:</span>
                      <span className="font-medium text-gray-700">{governanceData.integrationHealth.dataFlow.dataLatency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Throughput:</span>
                      <span className="font-medium text-purple-600">{governanceData.integrationHealth.dataFlow.peakThroughput}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {governanceData.integrationHealth.systemDependencies.map((dep, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{dep.upstream}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={dep.criticality === 'High' ? 'border-red-300 text-red-600' : 'border-yellow-300 text-yellow-600'}>
                              {dep.criticality}
                            </Badge>
                            {dep.failoverReady && (
                              <Badge variant="outline" className="border-green-300 text-green-600 text-xs">
                                ✓ Failover
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>Downstream:</strong> {dep.downstream.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Priority Recommendations
          </CardTitle>
          <CardDescription>
            Strategic recommendations for governance, privacy, and integration improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {governanceData.recommendations.priority.map((rec, index) => (
              <Card key={index} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{rec.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {rec.category}
                        </Badge>
                      </div>
                      <div className="ml-4">
                        <Badge className={`${getImpactColor(rec.impact)} border mb-1`}>
                          {rec.impact} Impact
                        </Badge>
                        <div className="text-xs text-gray-500">ROI: {rec.roi}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">⚠️ Risks:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.risks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">✨ Benefits:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Timeline: <span className="font-medium">{rec.timeline}</span></span>
                      <span className="text-gray-600">Effort: <span className="font-medium">{rec.effort}</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comprehensive Content Optimization Dashboard with Freshness Analysis and Semantic Scoring
function ContentOptimizationDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const contentData = {
    overview: {
      totalContent: 2847,
      freshContent: 1523,
      staleContent: 984,
      outdatedContent: 340,
      avgFreshnessScore: 74.2,
      avgSemanticScore: 68.9,
      contentVelocity: "+12.3% this month"
    },

    freshness: {
      distribution: [
        { category: "Very Fresh (0-30 days)", count: 856, percentage: 30.1, color: "bg-green-500", performance: "+24% engagement" },
        { category: "Fresh (31-90 days)", count: 667, percentage: 23.4, color: "bg-lime-500", performance: "+18% engagement" },
        { category: "Moderate (91-180 days)", count: 724, percentage: 25.4, color: "bg-yellow-500", performance: "+8% engagement" },
        { category: "Stale (181-365 days)", count: 428, percentage: 15.0, color: "bg-orange-500", performance: "-12% engagement" },
        { category: "Outdated (365+ days)", count: 172, percentage: 6.1, color: "bg-red-500", performance: "-35% engagement" }
      ],

      contentHealth: {
        topPerforming: [
          { title: "Complete Guide to Digital Marketing Strategy", age: "23 days", views: 45200, engagement: 8.7, freshnessScore: 95 },
          { title: "2024 AI Tools for Content Creation", age: "12 days", views: 38700, engagement: 9.2, freshnessScore: 98 },
          { title: "Customer Experience Optimization Playbook", age: "67 days", views: 29300, engagement: 7.8, freshnessScore: 87 }
        ],

        underperforming: [
          { title: "Social Media Marketing Basics", age: "287 days", views: 2100, engagement: 2.1, freshnessScore: 23 },
          { title: "Email Marketing Best Practices", age: "445 days", views: 1800, engagement: 1.9, freshnessScore: 18 },
          { title: "SEO Fundamentals for Beginners", age: "523 days", views: 3200, engagement: 2.8, freshnessScore: 15 }
        ]
      }
    },

    semanticAnalysis: {
      topicClusters: [
        {
          topic: "Digital Marketing Strategy",
          contentCount: 487,
          avgScore: 82.4,
          engagement: "High",
          trend: "+15%",
          opportunities: ["Advanced automation tactics", "Cross-channel attribution", "Predictive analytics"]
        },
        {
          topic: "Customer Experience",
          contentCount: 356,
          avgScore: 78.9,
          engagement: "High",
          trend: "+22%",
          opportunities: ["Journey orchestration", "Real-time personalization", "Voice of customer analytics"]
        },
        {
          topic: "Content Marketing",
          contentCount: 423,
          avgScore: 71.2,
          engagement: "Medium",
          trend: "+8%",
          opportunities: ["Interactive content formats", "AI-powered content creation", "Content performance prediction"]
        },
        {
          topic: "SEO & Search Marketing",
          contentCount: 298,
          avgScore: 65.8,
          engagement: "Medium",
          trend: "-3%",
          opportunities: ["Core Web Vitals optimization", "Entity-based SEO", "Semantic search optimization"]
        },
        {
          topic: "Social Media Marketing",
          contentCount: 267,
          avgScore: 58.4,
          engagement: "Low",
          trend: "-12%",
          opportunities: ["Social commerce integration", "Influencer partnership strategies", "Community-driven content"]
        }
      ],

      contentGaps: [
        { gap: "AI-Powered Personalization", priority: "High", estimatedTraffic: "+45K monthly", competition: "Medium" },
        { gap: "Voice Search Optimization", priority: "High", estimatedTraffic: "+32K monthly", competition: "Low" },
        { gap: "Zero-Party Data Collection", priority: "Medium", estimatedTraffic: "+28K monthly", competition: "Medium" },
        { gap: "Headless CMS Implementation", priority: "Medium", estimatedTraffic: "+19K monthly", competition: "High" },
        { gap: "Progressive Web Apps", priority: "Low", estimatedTraffic: "+15K monthly", competition: "High" }
      ],

      semanticQuality: {
        excellentContent: 423,
        goodContent: 856,
        averageContent: 967,
        poorContent: 445,
        needsImprovement: 156
      }
    },

    updatePriorities: [
      {
        title: "Complete Guide to Email Marketing Automation",
        currentScore: 23,
        potentialScore: 87,
        priority: "Critical",
        effort: "Medium",
        estimatedImpact: "+285% engagement",
        reasons: [
          "Outdated automation workflows (18 months old)",
          "Missing GDPR compliance updates",
          "No AI/ML personalization examples",
          "Deprecated tool recommendations"
        ],
        recommendations: [
          "Update with latest automation platforms",
          "Add privacy-first data collection strategies",
          "Include AI-powered segmentation examples",
          "Refresh with 2024 case studies and statistics"
        ],
        timeline: "2-3 weeks",
        roi: "High - $45K estimated annual value"
      },
      {
        title: "Social Media Marketing Strategy Framework",
        currentScore: 34,
        potentialScore: 79,
        priority: "High",
        effort: "High",
        estimatedImpact: "+156% engagement",
        reasons: [
          "Missing TikTok and newer platform strategies",
          "Outdated algorithm insights",
          "No creator economy integration",
          "Limited video content guidance"
        ],
        recommendations: [
          "Add comprehensive short-form video strategy",
          "Include creator partnership frameworks",
          "Update with latest platform algorithm insights",
          "Add social commerce best practices"
        ],
        timeline: "3-4 weeks",
        roi: "High - $32K estimated annual value"
      },
      {
        title: "SEO Technical Optimization Checklist",
        currentScore: 41,
        potentialScore: 84,
        priority: "High",
        effort: "Low",
        estimatedImpact: "+124% engagement",
        reasons: [
          "Missing Core Web Vitals guidelines",
          "No mobile-first indexing updates",
          "Outdated structured data examples",
          "Limited page experience signals"
        ],
        recommendations: [
          "Add comprehensive Core Web Vitals section",
          "Update with mobile-first best practices",
          "Refresh structured data examples",
          "Include page experience optimization guide"
        ],
        timeline: "1-2 weeks",
        roi: "Medium - $28K estimated annual value"
      }
    ],

    contentRecommendations: {
      quickWins: [
        {
          action: "Update publication dates on evergreen content",
          effort: "Low",
          impact: "Medium",
          timeline: "1 week",
          expectedLift: "+15% freshness score"
        },
        {
          action: "Add FAQ sections to top-performing articles",
          effort: "Low",
          impact: "High",
          timeline: "2 weeks",
          expectedLift: "+25% engagement time"
        },
        {
          action: "Optimize meta descriptions for semantic search",
          effort: "Medium",
          impact: "High",
          timeline: "3 weeks",
          expectedLift: "+18% click-through rate"
        }
      ],

      strategicInitiatives: [
        {
          initiative: "AI-Enhanced Content Creation Workflow",
          description: "Implement AI tools for content ideation, creation, and optimization",
          timeline: "8-12 weeks",
          investment: "High",
          expectedROI: "300% over 12 months",
          keyComponents: ["AI content brief generator", "Automated SEO optimization", "Performance prediction models"]
        },
        {
          initiative: "Dynamic Content Personalization System",
          description: "Create adaptive content that personalizes based on user behavior and preferences",
          timeline: "6-10 weeks",
          investment: "Medium",
          expectedROI: "220% over 9 months",
          keyComponents: ["User behavior tracking", "Content variant testing", "Real-time personalization engine"]
        }
      ]
    }
  };

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'High': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div id="content-optimization-dashboard" className="space-y-6">
      {/* Content Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contentData.overview.totalContent.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Content Pieces</div>
              <div className="text-xs text-green-600 mt-1">{contentData.overview.contentVelocity}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(contentData.overview.avgFreshnessScore)}`}>
                {contentData.overview.avgFreshnessScore}%
              </div>
              <div className="text-sm text-gray-600">Avg Freshness Score</div>
              <div className="text-xs text-gray-500 mt-1">{contentData.overview.freshContent} fresh items</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(contentData.overview.avgSemanticScore)}`}>
                {contentData.overview.avgSemanticScore}%
              </div>
              <div className="text-sm text-gray-600">Avg Semantic Score</div>
              <div className="text-xs text-gray-500 mt-1">Content quality index</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{contentData.overview.outdatedContent}</div>
              <div className="text-sm text-gray-600">Outdated Content</div>
              <div className="text-xs text-red-500 mt-1">Needs immediate attention</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Freshness Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Content Freshness Analysis
          </CardTitle>
          <CardDescription>
            Content age distribution and performance correlation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Freshness Distribution */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Content Age Distribution</h4>
              <div className="space-y-3">
                {contentData.freshness.distribution.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{item.count} pieces ({item.percentage}%)</span>
                        <Badge variant="outline" className={item.performance.startsWith('+') ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}>
                          {item.performance}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`${item.color} h-4 rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${item.percentage}%` }}
                      >
                        <span className="text-xs text-white font-medium">{item.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-green-700">Top Performing Content</CardTitle>
                  <CardDescription>Fresh content driving highest engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentData.freshness.contentHealth.topPerforming.map((content, index) => (
                      <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50">
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 text-sm">{content.title}</h5>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Age:</span>
                                <span className="font-medium">{content.age}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Views:</span>
                                <span className="font-medium">{content.views.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Engagement:</span>
                                <span className="font-medium text-green-600">{content.engagement}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Freshness:</span>
                                <span className="font-medium text-green-600">{content.freshnessScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-red-700">Underperforming Content</CardTitle>
                  <CardDescription>Stale content requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentData.freshness.contentHealth.underperforming.map((content, index) => (
                      <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 text-sm">{content.title}</h5>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Age:</span>
                                <span className="font-medium text-red-600">{content.age}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Views:</span>
                                <span className="font-medium">{content.views.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Engagement:</span>
                                <span className="font-medium text-red-600">{content.engagement}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Freshness:</span>
                                <span className="font-medium text-red-600">{content.freshnessScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Content Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Semantic Content Analysis & Topic Clusters
          </CardTitle>
          <CardDescription>
            AI-powered content quality assessment and topic gap identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Topic Clusters */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Content Topic Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentData.semanticAnalysis.topicClusters.map((cluster, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{cluster.topic}</h5>
                          <Badge className={`${getEngagementColor(cluster.engagement)} border`}>
                            {cluster.engagement}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Content Count:</span>
                            <span className="font-medium">{cluster.contentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Score:</span>
                            <span className={`font-medium ${getScoreColor(cluster.avgScore)}`}>{cluster.avgScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trend:</span>
                            <span className={`font-medium ${cluster.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {cluster.trend}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Content Opportunities:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {cluster.opportunities.slice(0, 2).map((opp, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Lightbulb className="h-2.5 w-2.5 text-yellow-500 mt-1 flex-shrink-0" />
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Content Gaps Analysis */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Identified Content Gaps</h4>
              <div className="space-y-3">
                {contentData.semanticAnalysis.contentGaps.map((gap, index) => (
                  <Card key={index} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{gap.gap}</h5>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-gray-600">Est. Traffic:</span>
                              <span className="font-medium text-green-600">{gap.estimatedTraffic}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-600">Competition:</span>
                              <span className="font-medium">{gap.competition}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getPriorityColor(gap.priority)} border`}>
                          {gap.priority} Priority
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Content Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Priority Content Update Recommendations
          </CardTitle>
          <CardDescription>
            Content pieces with highest improvement potential and ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contentData.updatePriorities.map((content, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{content.title}</h5>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-sm">
                            <span className="text-gray-600">Current Score: </span>
                            <span className={`font-medium ${getScoreColor(content.currentScore)}`}>{content.currentScore}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Potential Score: </span>
                            <span className="font-medium text-green-600">{content.potentialScore}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Expected Impact: </span>
                            <span className="font-medium text-green-600">{content.estimatedImpact}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Badge className={`${getPriorityColor(content.priority)} border mb-2`}>
                          {content.priority}
                        </Badge>
                        <div className="text-xs text-gray-500 text-right">
                          <div>Timeline: {content.timeline}</div>
                          <div>Effort: {content.effort}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">🚨 Key Issues:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {content.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">✅ Recommendations:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {content.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900">Expected ROI</div>
                      <div className="text-sm text-blue-800">{content.roi}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Optimization Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Quick Wins & Immediate Actions
            </CardTitle>
            <CardDescription>
              Low-effort, high-impact content optimizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentData.contentRecommendations.quickWins.map((win, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">{win.action}</h5>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {win.expectedLift}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className={`font-medium ${win.effort === 'Low' ? 'text-green-600' :
                            win.effort === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {win.effort}
                          </div>
                          <div className="text-xs text-gray-500">Effort</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${win.impact === 'High' ? 'text-green-600' :
                            win.impact === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {win.impact}
                          </div>
                          <div className="text-xs text-gray-500">Impact</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{win.timeline}</div>
                          <div className="text-xs text-gray-500">Timeline</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Initiatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Strategic Content Initiatives
            </CardTitle>
            <CardDescription>
              Long-term content strategy and automation opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentData.contentRecommendations.strategicInitiatives.map((initiative, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{initiative.initiative}</h5>
                        <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timeline:</span>
                          <span className="font-medium">{initiative.timeline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment:</span>
                          <span className="font-medium">{initiative.investment}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-600">Expected ROI:</span>
                          <span className="font-medium text-green-600">{initiative.expectedROI}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Key Components:</div>
                        <div className="flex flex-wrap gap-2">
                          {initiative.keyComponents.map((component, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {component}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Comprehensive Experimentation Strategy Dashboard with A/B Testing Framework and Statistical Analysis
function ExperimentationDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const experimentationData = {
    overview: {
      activeExperiments: 23,
      completedExperiments: 187,
      winRate: 68.4,
      avgLiftDetected: 12.8,
      testVelocity: 4.2,
      statisticalPower: 89.6,
      monthlyVisitors: 245000
    },

    topExperiments: [
      {
        id: "EXP-2024-089",
        name: "Checkout Flow Simplification",
        status: "Running",
        hypothesis: "Reducing checkout steps from 5 to 3 will increase conversion rate by removing friction points",
        target: "Checkout conversion rate",
        expectedLift: "+18-25%",
        actualLift: null,
        confidence: 92,
        daysRunning: 12,
        totalDays: 21,
        visitors: 15420,
        conversions: 1847,
        conversionRate: 11.97,
        controlRate: 9.85,
        significance: 0.032,
        winner: "Variant A",
        category: "UX Optimization"
      },
      {
        id: "EXP-2024-087",
        name: "Product Page Social Proof Enhancement",
        status: "Completed",
        hypothesis: "Adding real-time purchase notifications and customer reviews will increase trust and conversions",
        target: "Product page conversion rate",
        expectedLift: "+12-18%",
        actualLift: "+16.3%",
        confidence: 97,
        daysRunning: 28,
        totalDays: 28,
        visitors: 28750,
        conversions: 4312,
        conversionRate: 15.0,
        controlRate: 12.9,
        significance: 0.003,
        winner: "Variant B",
        category: "Trust & Social Proof"
      },
      {
        id: "EXP-2024-085",
        name: "Homepage Hero Message Optimization",
        status: "Completed",
        hypothesis: "Value-focused messaging over feature-focused will improve engagement and sign-ups",
        target: "Homepage conversion rate",
        expectedLift: "+8-15%",
        actualLift: "+22.7%",
        confidence: 98,
        daysRunning: 35,
        totalDays: 35,
        visitors: 45200,
        conversions: 2940,
        conversionRate: 6.5,
        controlRate: 5.3,
        significance: 0.001,
        winner: "Variant A",
        category: "Messaging & Copy"
      }
    ],

    experimentBlueprints: [
      {
        category: "Conversion Rate Optimization",
        priority: "High",
        experiments: [
          {
            name: "Mobile Checkout Optimization",
            hypothesis: "Simplifying mobile checkout with one-tap payment options will reduce cart abandonment",
            targetMetric: "Mobile conversion rate",
            estimatedLift: "15-25%",
            testDuration: "3-4 weeks",
            trafficRequired: "12,000 visitors",
            effort: "Medium",
            successProbability: 78,
            prerequisites: ["Mobile analytics setup", "Payment gateway integration"],
            variants: [
              { name: "Control", description: "Current 4-step mobile checkout" },
              { name: "Variant A", description: "2-step checkout with guest option" },
              { name: "Variant B", description: "1-tap payment with saved preferences" }
            ]
          },
          {
            name: "Product Recommendation Algorithm Test",
            hypothesis: "AI-powered recommendations will outperform collaborative filtering for cross-selling",
            targetMetric: "Average order value",
            estimatedLift: "8-15%",
            testDuration: "5-6 weeks",
            trafficRequired: "20,000 sessions",
            effort: "High",
            successProbability: 65,
            prerequisites: ["AI model training", "Recommendation engine setup"],
            variants: [
              { name: "Control", description: "Current collaborative filtering" },
              { name: "Variant A", description: "AI-powered behavioral recommendations" },
              { name: "Variant B", description: "Hybrid AI + collaborative model" }
            ]
          }
        ]
      },
      {
        category: "User Experience",
        priority: "Medium",
        experiments: [
          {
            name: "Navigation Menu Restructure",
            hypothesis: "Task-based navigation will improve findability and reduce bounce rate",
            targetMetric: "Site engagement & bounce rate",
            estimatedLift: "10-18%",
            testDuration: "4-5 weeks",
            trafficRequired: "15,000 sessions",
            effort: "Medium",
            successProbability: 72,
            prerequisites: ["User journey analysis", "Navigation wireframes"],
            variants: [
              { name: "Control", description: "Current category-based navigation" },
              { name: "Variant A", description: "Task-based navigation structure" },
              { name: "Variant B", description: "Hybrid category + task navigation" }
            ]
          },
          {
            name: "Search Functionality Enhancement",
            hypothesis: "Auto-complete with visual suggestions will improve search success rate",
            targetMetric: "Search conversion rate",
            estimatedLift: "12-20%",
            testDuration: "3-4 weeks",
            trafficRequired: "8,000 searches",
            effort: "Low",
            successProbability: 84,
            prerequisites: ["Search analytics review", "Auto-complete setup"],
            variants: [
              { name: "Control", description: "Current text-based search" },
              { name: "Variant A", description: "Auto-complete with suggestions" },
              { name: "Variant B", description: "Visual search with image previews" }
            ]
          }
        ]
      }
    ],

    testingFramework: {
      methodology: {
        planningPhase: [
          "Hypothesis formulation with RICE prioritization",
          "Statistical power analysis and sample size calculation",
          "Success metrics definition with guardrail metrics",
          "Variant design and mockup creation"
        ],
        executionPhase: [
          "A/B test setup with proper randomization",
          "Quality assurance and preview testing",
          "Launch with monitoring dashboard setup",
          "Daily monitoring for anomalies and issues"
        ],
        analysisPhase: [
          "Statistical significance testing (Bayesian & Frequentist)",
          "Segmented analysis for different user cohorts",
          "Impact assessment on secondary metrics",
          "Business impact calculation and recommendation"
        ]
      },

      statisticalFramework: {
        significanceThreshold: 0.05,
        powerThreshold: 0.8,
        minimumDetectableEffect: "5%",
        confidenceLevel: 95,
        testDuration: {
          minimum: "1 week",
          typical: "2-4 weeks",
          maximum: "8 weeks"
        },
        sampleSizeCalculation: "Based on baseline conversion rate, MDE, and statistical power requirements"
      },

      qualityAssurance: {
        prelaunchChecklist: [
          "Randomization algorithm verification",
          "Cross-browser and device testing",
          "Analytics tracking validation",
          "Performance impact assessment"
        ],
        monitoringMetrics: [
          "Sample ratio mismatch (SRM) detection",
          "Novelty and primacy effects monitoring",
          "Technical implementation issues tracking",
          "User experience degradation alerts"
        ]
      }
    },

    performanceMetrics: {
      velocityMetrics: {
        testsLaunchedPerMonth: 8.5,
        avgTestDuration: 24,
        timeToInsight: 18,
        implementationSpeed: 5.2
      },

      impactMetrics: {
        totalLiftGenerated: "+$2.4M annually",
        avgLiftPerWinningTest: 14.6,
        cumulativeImpact: "+18.7% overall conversion",
        roiFromTesting: "450%"
      },

      learningMetrics: {
        hypothesesValidated: 127,
        surprisingFindings: 23,
        segmentInsights: 45,
        principlesEstablished: 18
      }
    },

    testPipeline: [
      {
        phase: "Research & Ideation",
        tests: 12,
        timeline: "Weeks 1-2",
        activities: ["User research analysis", "Competitor benchmarking", "Hypothesis generation", "RICE prioritization"]
      },
      {
        phase: "Design & Development",
        tests: 8,
        timeline: "Weeks 3-4",
        activities: ["Variant mockups", "Technical implementation", "QA testing", "Analytics setup"]
      },
      {
        phase: "Live Testing",
        tests: 6,
        timeline: "Weeks 5-8",
        activities: ["Test launch", "Daily monitoring", "Performance tracking", "Issue resolution"]
      },
      {
        phase: "Analysis & Implementation",
        tests: 4,
        timeline: "Weeks 9-10",
        activities: ["Statistical analysis", "Segmented insights", "Business impact assessment", "Winner implementation"]
      }
    ],

    recommendations: {
      immediate: [
        {
          title: "Increase Test Velocity",
          description: "Scale testing operations to reach 12+ tests per month",
          actions: ["Hire additional experimentation analyst", "Implement test automation tools", "Streamline approval process"],
          expectedImpact: "+40% more insights per quarter",
          timeline: "6-8 weeks",
          effort: "Medium"
        },
        {
          title: "Advanced Statistical Methods",
          description: "Implement Bayesian analysis and sequential testing",
          actions: ["Train team on Bayesian methods", "Implement sequential testing platform", "Create automated stopping rules"],
          expectedImpact: "25% faster time to insight",
          timeline: "4-6 weeks",
          effort: "High"
        }
      ],
      strategic: [
        {
          title: "Personalization Testing Framework",
          description: "Build capabilities for personalized experience testing",
          actions: ["Implement dynamic content system", "Create audience segmentation engine", "Build personalization testing tools"],
          expectedImpact: "2x improvement in test impact",
          timeline: "12-16 weeks",
          effort: "High"
        },
        {
          title: "Cross-Platform Experimentation",
          description: "Extend testing to email, mobile app, and other channels",
          actions: ["Integrate email testing platform", "Implement mobile A/B testing SDK", "Create unified experiment management"],
          expectedImpact: "3x broader optimization scope",
          timeline: "10-14 weeks",
          effort: "Very High"
        }
      ]
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Planned': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatSignificance = (significance: number) => {
    if (significance < 0.01) return 'p < 0.01 (Highly Significant)';
    if (significance < 0.05) return `p = ${significance.toFixed(3)} (Significant)`;
    return `p = ${significance.toFixed(3)} (Not Significant)`;
  };

  return (
    <div id="experimentation-dashboard" className="space-y-6">
      {/* Experimentation Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{experimentationData.overview.activeExperiments}</div>
              <div className="text-sm text-gray-600">Active Experiments</div>
              <div className="text-xs text-gray-500 mt-1">Test Velocity: {experimentationData.overview.testVelocity}/month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{experimentationData.overview.winRate}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-xs text-gray-500 mt-1">{experimentationData.overview.completedExperiments} completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">+{experimentationData.overview.avgLiftDetected}%</div>
              <div className="text-sm text-gray-600">Avg Lift Detected</div>
              <div className="text-xs text-gray-500 mt-1">Per winning test</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{experimentationData.overview.statisticalPower}%</div>
              <div className="text-sm text-gray-600">Statistical Power</div>
              <div className="text-xs text-gray-500 mt-1">{experimentationData.overview.monthlyVisitors.toLocaleString()} monthly visitors</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Experiments Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Top Performing Experiments
          </CardTitle>
          <CardDescription>
            Current and recently completed high-impact A/B tests with statistical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experimentationData.topExperiments.map((experiment, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-gray-900">{experiment.name}</h5>
                          <Badge className={`${getStatusColor(experiment.status)} border`}>
                            {experiment.status}
                          </Badge>
                          <Badge variant="outline">{experiment.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Hypothesis:</strong> {experiment.hypothesis}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Target:</strong> {experiment.target}
                        </p>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-600">ID: {experiment.id}</div>
                        <div className="text-xs text-gray-500">{experiment.daysRunning}/{experiment.totalDays} days</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">
                          {experiment.actualLift || experiment.expectedLift}
                        </div>
                        <div className="text-xs text-gray-600">
                          {experiment.actualLift ? 'Actual Lift' : 'Expected Lift'}
                        </div>
                      </div>

                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`font-medium ${getConfidenceColor(experiment.confidence)}`}>
                          {experiment.confidence}%
                        </div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>

                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">
                          {experiment.visitors.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Visitors</div>
                      </div>

                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">
                          {experiment.conversionRate}%
                        </div>
                        <div className="text-xs text-gray-600">
                          Conversion Rate ({experiment.controlRate}% control)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-gray-600">
                        {formatSignificance(experiment.significance)}
                      </div>
                      {experiment.winner && (
                        <div className="text-sm font-medium text-green-600">
                          Winner: {experiment.winner}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experiment Blueprints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Experiment Blueprints & Test Pipeline
          </CardTitle>
          <CardDescription>
            Ready-to-launch experiment designs with detailed implementation plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {experimentationData.experimentBlueprints.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <Badge className={`${getPriorityColor(category.priority)} border`}>
                    {category.priority} Priority
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {category.experiments.map((experiment, expIndex) => (
                    <Card key={expIndex} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-900">{experiment.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">{experiment.hypothesis}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Target:</span>
                              <span className="font-medium">{experiment.targetMetric}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expected Lift:</span>
                              <span className="font-medium text-green-600">{experiment.estimatedLift}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{experiment.testDuration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Traffic Required:</span>
                              <span className="font-medium">{experiment.trafficRequired}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-gray-600">Success Probability: </span>
                              <span className={`font-medium ${experiment.successProbability >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {experiment.successProbability}%
                              </span>
                            </div>
                            <Badge variant="outline" className={experiment.effort === 'High' ? 'border-red-300 text-red-600' :
                              experiment.effort === 'Medium' ? 'border-yellow-300 text-yellow-600' : 'border-green-300 text-green-600'}>
                              {experiment.effort} Effort
                            </Badge>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Test Variants:</div>
                            <div className="space-y-1">
                              {experiment.variants.map((variant, varIndex) => (
                                <div key={varIndex} className="flex items-start gap-2 text-xs">
                                  <div className="flex-shrink-0 w-16 font-medium text-gray-600">{variant.name}:</div>
                                  <div className="text-gray-600">{variant.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</div>
                            <div className="flex flex-wrap gap-1">
                              {experiment.prerequisites.map((prereq, preqIndex) => (
                                <Badge key={preqIndex} variant="outline" className="text-xs">
                                  {prereq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Framework & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Testing Framework & Methodology
            </CardTitle>
            <CardDescription>
              Systematic approach to experimentation with quality assurance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(experimentationData.testingFramework.methodology).map(([phase, activities], index) => (
                <div key={index}>
                  <h5 className="font-medium text-gray-900 mb-2 capitalize">
                    {phase.replace(/([A-Z])/g, ' $1').trim()}
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="font-medium text-blue-900 mb-2">Statistical Standards</h6>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• Significance Threshold: {experimentationData.testingFramework.statisticalFramework.significanceThreshold}</div>
                  <div>• Statistical Power: {experimentationData.testingFramework.statisticalFramework.powerThreshold}</div>
                  <div>• Confidence Level: {experimentationData.testingFramework.statisticalFramework.confidenceLevel}%</div>
                  <div>• Min Detectable Effect: {experimentationData.testingFramework.statisticalFramework.minimumDetectableEffect}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Performance Metrics & Impact
            </CardTitle>
            <CardDescription>
              Experimentation program performance and business impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Velocity Metrics</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tests/Month:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.velocityMetrics.testsLaunchedPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Duration:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.velocityMetrics.avgTestDuration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to Insight:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.velocityMetrics.timeToInsight} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Implementation:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.velocityMetrics.implementationSpeed} days</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Business Impact</h5>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">
                      {experimentationData.performanceMetrics.impactMetrics.totalLiftGenerated}
                    </div>
                    <div className="text-sm text-green-700">Total Annual Lift Generated</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Lift/Test:</span>
                      <span className="font-medium text-green-600">+{experimentationData.performanceMetrics.impactMetrics.avgLiftPerWinningTest}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Testing ROI:</span>
                      <span className="font-medium text-green-600">{experimentationData.performanceMetrics.impactMetrics.roiFromTesting}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Learning & Knowledge</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hypotheses Tested:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.learningMetrics.hypothesesValidated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Surprising Findings:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.learningMetrics.surprisingFindings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Segment Insights:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.learningMetrics.segmentInsights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principles:</span>
                    <span className="font-medium">{experimentationData.performanceMetrics.learningMetrics.principlesEstablished}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Pipeline & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-purple-600" />
              Current Test Pipeline
            </CardTitle>
            <CardDescription>
              Experiments in different phases of the testing lifecycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experimentationData.testPipeline.map((phase, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-purple-500' :
                      index === 2 ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {phase.tests}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{phase.phase}</div>
                      <div className="text-sm text-gray-600">{phase.timeline}</div>
                    </div>
                  </div>

                  <div className="ml-12 mt-2">
                    <div className="text-xs text-gray-600">
                      {phase.activities.join(' • ')}
                    </div>
                  </div>

                  {index < experimentationData.testPipeline.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Experimentation Recommendations
            </CardTitle>
            <CardDescription>
              Strategic improvements to accelerate testing impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Immediate Actions</h5>
                <div className="space-y-3">
                  {experimentationData.recommendations.immediate.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h6 className="font-medium text-gray-900 text-sm">{rec.title}</h6>
                          <p className="text-xs text-gray-600">{rec.description}</p>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Timeline: {rec.timeline}</span>
                            <Badge variant="outline" className={rec.effort === 'High' ? 'border-red-300 text-red-600' : 'border-yellow-300 text-yellow-600'}>
                              {rec.effort}
                            </Badge>
                          </div>

                          <div className="text-xs text-green-600 font-medium">
                            Expected: {rec.expectedImpact}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Strategic Initiatives</h5>
                <div className="space-y-3">
                  {experimentationData.recommendations.strategic.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h6 className="font-medium text-gray-900 text-sm">{rec.title}</h6>
                          <p className="text-xs text-gray-600">{rec.description}</p>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Timeline: {rec.timeline}</span>
                            <Badge variant="outline" className="border-red-300 text-red-600">
                              {rec.effort}
                            </Badge>
                          </div>

                          <div className="text-xs text-green-600 font-medium">
                            Expected: {rec.expectedImpact}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Comprehensive Personalization Strategy Dashboard with Dynamic Content Systems and AI-Powered Recommendation Engines
function PersonalizationDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const personalizationData = {
    overview: {
      activeSegments: 47,
      personalizedContent: 2847,
      aiRecommendations: 156,
      avgEngagementLift: 34.7,
      dynamicContentRules: 23,
      mlModelAccuracy: 87.4,
      realtimePersonalization: true,
      totalPersonalizedVisitors: 89643
    },

    recommendedTactics: [
      {
        id: "PT-001",
        name: "Behavioral Trigger Campaigns",
        category: "Email Personalization",
        priority: "High",
        effort: "Medium",
        expectedLift: "+28-35%",
        timeline: "3-4 weeks",
        description: "Implement dynamic email campaigns triggered by user behavior patterns and engagement history",
        implementation: {
          phase1: "Data collection and segmentation setup",
          phase2: "Campaign template creation and rule definition",
          phase3: "Testing and optimization rollout",
          phase4: "Full deployment and monitoring"
        },
        requirements: ["Email Platform", "Customer Data Platform", "Analytics Integration"],
        roi: "High (250%+)",
        confidence: 91,
        businessImpact: "Increase email conversion rates and customer retention through personalized messaging",
        keyMetrics: ["Open Rate", "Click Rate", "Conversion Rate", "Revenue per Email"]
      },
      {
        id: "PT-002",
        name: "Dynamic Product Recommendations",
        category: "E-commerce Personalization",
        priority: "High",
        effort: "High",
        expectedLift: "+22-30%",
        timeline: "6-8 weeks",
        description: "Machine learning-powered product recommendation engine based on browsing behavior, purchase history, and similar user patterns",
        implementation: {
          phase1: "ML model training and data pipeline setup",
          phase2: "Recommendation algorithm development",
          phase3: "A/B testing and algorithm optimization",
          phase4: "Production deployment and continuous learning"
        },
        requirements: ["ML Platform", "Product Catalog API", "Real-time Data Processing", "A/B Testing Framework"],
        roi: "Very High (300%+)",
        confidence: 87,
        businessImpact: "Boost average order value and cross-sell effectiveness through intelligent product suggestions",
        keyMetrics: ["Click-through Rate", "Add-to-Cart Rate", "Average Order Value", "Revenue per Visitor"]
      },
      {
        id: "PT-003",
        name: "Content Experience Optimization",
        category: "Website Personalization",
        priority: "Medium",
        effort: "Medium",
        expectedLift: "+18-25%",
        timeline: "4-5 weeks",
        description: "Personalize website content blocks, messaging, and CTAs based on visitor segment and journey stage",
        implementation: {
          phase1: "Visitor segmentation and journey mapping",
          phase2: "Content variation creation and rule setup",
          phase3: "Personalization engine integration",
          phase4: "Performance monitoring and optimization"
        },
        requirements: ["CMS Integration", "Personalization Engine", "Visitor Tracking", "Content Management"],
        roi: "Medium (150-200%)",
        confidence: 83,
        businessImpact: "Improve content relevance and user engagement through targeted messaging",
        keyMetrics: ["Time on Page", "Bounce Rate", "Conversion Rate", "Content Engagement Score"]
      }
    ],

    dynamicContent: {
      overview: {
        activeRules: 23,
        contentVariations: 156,
        segmentsTargeted: 12,
        avgPersonalizationLift: 24.8,
        realTimeUpdates: true,
        contentDeliverySpeed: "< 50ms"
      },
      contentSystems: [
        {
          system: "Hero Banner Personalization",
          status: "Active",
          rules: 8,
          variations: 24,
          performance: "+31% engagement",
          segments: ["First-time Visitors", "Returning Customers", "Premium Members", "Cart Abandoners"],
          lastUpdated: "2 hours ago",
          confidence: 94
        },
        {
          system: "Product Page Messaging",
          status: "Active",
          rules: 12,
          variations: 48,
          performance: "+18% conversion",
          segments: ["Price-sensitive", "Feature-focused", "Brand Loyalists", "Comparison Shoppers"],
          lastUpdated: "1 hour ago",
          confidence: 87
        },
        {
          system: "Checkout Flow Optimization",
          status: "Testing",
          rules: 3,
          variations: 12,
          performance: "+12% completion",
          segments: ["Mobile Users", "Desktop Users", "International Customers"],
          lastUpdated: "30 minutes ago",
          confidence: 76
        }
      ],
      contentPerformance: [
        { segment: "First-time Visitors", engagementLift: 42, conversionLift: 28, confidence: 91 },
        { segment: "Returning Customers", engagementLift: 18, conversionLift: 15, confidence: 94 },
        { segment: "Premium Members", engagementLift: 35, conversionLift: 22, confidence: 88 },
        { segment: "Cart Abandoners", engagementLift: 67, conversionLift: 45, confidence: 83 }
      ]
    },

    aiRecommendations: [
      {
        id: "AI-REC-001",
        type: "Optimization Opportunity",
        priority: "Critical",
        category: "Machine Learning Enhancement",
        recommendation: "Implement Real-time Collaborative Filtering",
        description: "Deploy advanced collaborative filtering algorithms to improve recommendation accuracy by analyzing user-item interactions in real-time",
        expectedImpact: "+15-22% recommendation accuracy",
        implementationEffort: "High",
        timeline: "8-12 weeks",
        confidence: 92,
        businessValue: "Significant increase in cross-sell revenue and customer satisfaction",
        technicalRequirements: ["Spark Streaming", "ML Pipeline", "Real-time Feature Store", "A/B Testing"],
        keyBenefits: [
          "Real-time adaptation to user preferences",
          "Improved cold-start problem handling",
          "Enhanced recommendation diversity",
          "Better long-tail product discovery"
        ],
        roi: "$1.2M annual impact"
      },
      {
        id: "AI-REC-002",
        type: "Personalization Strategy",
        priority: "High",
        category: "Content Optimization",
        recommendation: "Dynamic Content Generation with NLP",
        description: "Leverage natural language processing to automatically generate personalized content variations based on user preferences and behavior patterns",
        expectedImpact: "+25-35% content engagement",
        implementationEffort: "Medium",
        timeline: "6-8 weeks",
        confidence: 85,
        businessValue: "Scalable content personalization without manual content creation overhead",
        technicalRequirements: ["NLP Platform", "Content Management API", "Template Engine", "Performance Monitoring"],
        keyBenefits: [
          "Automated content variation creation",
          "Personalized messaging at scale",
          "Reduced content management overhead",
          "Improved content relevance scoring"
        ],
        roi: "$800K annual impact"
      },
      {
        id: "AI-REC-003",
        type: "Behavioral Insight",
        priority: "Medium",
        category: "Predictive Analytics",
        recommendation: "Customer Lifecycle Stage Prediction",
        description: "Implement predictive models to automatically identify customer lifecycle stages and trigger appropriate personalization strategies",
        expectedImpact: "+20-28% customer retention",
        implementationEffort: "Medium",
        timeline: "5-7 weeks",
        confidence: 78,
        businessValue: "Proactive customer engagement and churn prevention through predictive personalization",
        technicalRequirements: ["Predictive ML Models", "Customer Data Platform", "Automation Engine", "Analytics Dashboard"],
        keyBenefits: [
          "Proactive customer engagement",
          "Automated lifecycle marketing",
          "Improved customer retention",
          "Personalized journey optimization"
        ],
        roi: "$650K annual impact"
      }
    ],

    personalizationMetrics: {
      engagement: {
        personalizedVsGeneric: { personalized: 67.4, generic: 32.6, lift: "+106%" },
        timeOnSite: { personalized: "4:23", generic: "2:47", lift: "+58%" },
        pageViews: { personalized: 5.8, generic: 3.2, lift: "+81%" },
        bounceRate: { personalized: 28.4, generic: 45.7, improvement: "-38%" }
      },
      conversion: {
        overallConversion: { personalized: 8.7, generic: 4.2, lift: "+107%" },
        averageOrderValue: { personalized: 127.50, generic: 89.30, lift: "+43%" },
        customerLifetimeValue: { personalized: 847, generic: 523, lift: "+62%" },
        repeatPurchaseRate: { personalized: 34.2, generic: 18.7, lift: "+83%" }
      },
      technical: {
        modelAccuracy: 87.4,
        predictionLatency: "< 50ms",
        systemUptime: "99.97%",
        dataFreshness: "Real-time",
        recommendationCoverage: "94.3%",
        diversityScore: 0.76
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalization Overview KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Segments</p>
                <p className="text-2xl font-bold text-blue-600">{personalizationData.overview.activeSegments}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">+12% this month</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personalized Content</p>
                <p className="text-2xl font-bold text-green-600">{personalizationData.overview.personalizedContent.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">156 variations</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Engagement Lift</p>
                <p className="text-2xl font-bold text-purple-600">+{personalizationData.overview.avgEngagementLift}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">ML Accuracy: {personalizationData.overview.mlModelAccuracy}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Recommendations</p>
                <p className="text-2xl font-bold text-orange-600">{personalizationData.overview.aiRecommendations}</p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Real-time updates</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Personalization Tactics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Recommended Personalization Tactics
          </CardTitle>
          <CardDescription>
            Strategic personalization opportunities ranked by impact and feasibility for {selectedRole}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {personalizationData.recommendedTactics.map((tactic, index) => (
              <Card key={tactic.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`${tactic.priority === 'High' ? 'bg-red-100 text-red-800' : tactic.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {tactic.priority} Priority
                          </Badge>
                          <Badge variant="outline">{tactic.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{tactic.name}</h3>
                        <p className="text-gray-600">{tactic.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{tactic.expectedLift}</div>
                        <div className="text-sm text-gray-500">Expected Lift</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{tactic.timeline}</div>
                        <div className="text-sm text-gray-600">Timeline</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{tactic.effort}</div>
                        <div className="text-sm text-gray-600">Effort Level</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{tactic.roi}</div>
                        <div className="text-sm text-gray-600">Expected ROI</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{tactic.confidence}%</div>
                        <div className="text-sm text-gray-600">Confidence</div>
                      </div>
                    </div>

                    {/* Implementation Phases */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Implementation Roadmap</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {Object.entries(tactic.implementation).map(([phase, description], i) => (
                            <div key={phase} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <div className="flex-grow">
                                <div className="text-sm font-medium text-gray-900 capitalize">{phase.replace('phase', 'Phase ')}</div>
                                <div className="text-sm text-gray-600">{description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-1">Requirements</h5>
                            <div className="space-y-1">
                              {tactic.requirements.map((req, i) => (
                                <div key={i} className="text-sm text-gray-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {req}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-1">Key Metrics</h5>
                            <div className="flex flex-wrap gap-1">
                              {tactic.keyMetrics.map((metric, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{metric}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Content Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Dynamic Content Systems
          </CardTitle>
          <CardDescription>
            Real-time content optimization and personalization rule performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{personalizationData.dynamicContent.overview.activeRules}</div>
                <div className="text-sm text-gray-600">Active Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{personalizationData.dynamicContent.overview.contentVariations}</div>
                <div className="text-sm text-gray-600">Content Variations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+{personalizationData.dynamicContent.overview.avgPersonalizationLift}%</div>
                <div className="text-sm text-gray-600">Avg Personalization Lift</div>
              </div>
            </div>

            {/* Content Systems Status */}
            <div className="space-y-4">
              {personalizationData.dynamicContent.contentSystems.map((system, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{system.system}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={system.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {system.status}
                            </Badge>
                            <span className="text-sm text-gray-600">Updated {system.lastUpdated}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{system.performance}</div>
                          <div className="text-sm text-gray-500">Performance Impact</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rules:</span>
                          <span className="font-medium">{system.rules}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Variations:</span>
                          <span className="font-medium">{system.variations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{system.confidence}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Target Segments</div>
                        <div className="flex flex-wrap gap-2">
                          {system.segments.map((segment, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{segment}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance by Segment */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Content Performance by Segment</h3>
              <div className="space-y-3">
                {personalizationData.dynamicContent.contentPerformance.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{segment.segment}</div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Engagement: </span>
                        <span className="font-medium text-green-600">+{segment.engagementLift}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversion: </span>
                        <span className="font-medium text-blue-600">+{segment.conversionLift}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence: </span>
                        <span className="font-medium">{segment.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Strategic Recommendations
          </CardTitle>
          <CardDescription>
            Machine learning-driven insights and optimization opportunities for advanced personalization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {personalizationData.aiRecommendations.map((recommendation, index) => (
              <Card key={recommendation.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${recommendation.priority === 'Critical' ? 'bg-red-100 text-red-800' : recommendation.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {recommendation.priority}
                          </Badge>
                          <Badge variant="outline">{recommendation.category}</Badge>
                          <Badge variant="secondary">{recommendation.type}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{recommendation.recommendation}</h3>
                        <p className="text-gray-600">{recommendation.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">{recommendation.expectedImpact}</div>
                        <div className="text-sm text-gray-500">Expected Impact</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 p-4 bg-purple-50 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{recommendation.timeline}</div>
                        <div className="text-sm text-gray-600">Timeline</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{recommendation.implementationEffort}</div>
                        <div className="text-sm text-gray-600">Effort</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{recommendation.confidence}%</div>
                        <div className="text-sm text-gray-600">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{recommendation.roi}</div>
                        <div className="text-sm text-gray-600">ROI Impact</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Technical Requirements</h4>
                        <div className="space-y-2">
                          {recommendation.technicalRequirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-gray-700">{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Key Benefits</h4>
                        <div className="space-y-2">
                          {recommendation.keyBenefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-1">Business Value</div>
                      <div className="text-sm text-gray-700">{recommendation.businessValue}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalization Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              Engagement Impact
            </CardTitle>
            <CardDescription>Performance comparison: personalized vs generic content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Personalized Content Performance</span>
                  <span className="text-2xl font-bold text-green-600">{personalizationData.personalizationMetrics.engagement.personalizedVsGeneric.lift}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${personalizationData.personalizationMetrics.engagement.personalizedVsGeneric.personalized}%` }}></div>
                </div>
              </div>

              {Object.entries(personalizationData.personalizationMetrics.engagement).slice(1).map(([metric, data]) => (
                <div key={metric} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-gray-600">Personalized: {data.personalized} | Generic: {data.generic}</div>
                  </div>
                  <div className="text-lg font-bold text-green-600">{data.lift || data.improvement}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Conversion & Revenue Impact
            </CardTitle>
            <CardDescription>Business metrics showing personalization ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(personalizationData.personalizationMetrics.conversion).map(([metric, data]) => (
                <div key={metric} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-gray-600">
                      Personalized: {typeof data.personalized === 'number' && data.personalized > 100 ? `$${data.personalized}` : `${data.personalized}${typeof data.personalized === 'number' ? '%' : ''}`} |
                      Generic: {typeof data.generic === 'number' && data.generic > 100 ? `$${data.generic}` : `${data.generic}${typeof data.generic === 'number' ? '%' : ''}`}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">{data.lift}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Performance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Technical Performance & System Health
          </CardTitle>
          <CardDescription>Real-time system metrics and ML model performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Model Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Model Accuracy</span>
                  <span className="font-medium">{personalizationData.personalizationMetrics.technical.modelAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recommendation Coverage</span>
                  <span className="font-medium">{personalizationData.personalizationMetrics.technical.recommendationCoverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Diversity Score</span>
                  <span className="font-medium">{personalizationData.personalizationMetrics.technical.diversityScore}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">System Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prediction Latency</span>
                  <span className="font-medium text-green-600">{personalizationData.personalizationMetrics.technical.predictionLatency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System Uptime</span>
                  <span className="font-medium text-green-600">{personalizationData.personalizationMetrics.technical.systemUptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data Freshness</span>
                  <span className="font-medium text-green-600">{personalizationData.personalizationMetrics.technical.dataFreshness}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Status Indicators</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">ML Pipeline Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Real-time Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Model Retraining Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comprehensive UX Optimization Dashboard with Pain Point Analysis, Cross-Platform Performance, and Prioritized Fixes
function UXOptimizationDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const uxData = {
    overview: {
      totalIssues: 127,
      criticalIssues: 18,
      mobileConversionRate: 3.4,
      desktopConversionRate: 7.8,
      avgPageLoadTime: 3.2,
      userSatisfactionScore: 6.7,
      bounceRateImprovement: 12.4,
      totalUXScore: 68
    },

    painPoints: [
      {
        id: "UX-001",
        title: "Mobile Checkout Abandonment",
        category: "Mobile UX",
        severity: "Critical",
        frequency: "High",
        impactScore: 9.2,
        affectedUsers: 34567,
        conversionImpact: "-18.5%",
        description: "Users abandoning checkout process on mobile devices due to form complexity and payment flow friction",
        detailedAnalysis: {
          primaryCauses: [
            "Multi-step form with poor mobile optimization",
            "Guest checkout option not prominently displayed",
            "Payment method selection confusing on small screens",
            "Address autofill not working reliably"
          ],
          userFeedback: [
            "'Too many steps to complete purchase' - 43% of users",
            "'Form too small on mobile' - 38% of users",
            "'Could not find guest checkout option' - 29% of users"
          ],
          technicaFindings: {
            avgFormCompletionTime: "4.3 minutes (vs 2.1 on desktop)",
            errorRate: "23.4%",
            fieldAbandonmentPoints: ["Phone number (47%)", "Address line 2 (34%)", "Payment method (28%)"]
          }
        },
        recommendedActions: [
          {
            action: "Implement single-page checkout for mobile",
            effort: "High",
            timeline: "4-6 weeks",
            expectedImpact: "+12-18% conversion"
          },
          {
            action: "Add prominent guest checkout option",
            effort: "Low",
            timeline: "1-2 weeks",
            expectedImpact: "+6-9% conversion"
          },
          {
            action: "Improve mobile form UI/UX",
            effort: "Medium",
            timeline: "3-4 weeks",
            expectedImpact: "+8-12% conversion"
          }
        ]
      },
      {
        id: "UX-002",
        title: "Search Result Relevance",
        category: "Search Experience",
        severity: "High",
        frequency: "High",
        impactScore: 8.1,
        affectedUsers: 28934,
        conversionImpact: "-12.3%",
        description: "Users struggling to find relevant products through site search, leading to high bounce rates and low engagement",
        detailedAnalysis: {
          primaryCauses: [
            "Search algorithm not handling synonyms effectively",
            "Filtering options limited and not intuitive",
            "Search results not personalized based on user behavior",
            "No auto-suggestions or typo correction"
          ],
          userFeedback: [
            "'Could not find what I was looking for' - 56% of users",
            "'Search results not relevant' - 42% of users",
            "'Filtering is confusing' - 31% of users"
          ],
          technicaFindings: {
            searchSuccessRate: "34.2%",
            avgResultsClicked: 1.8,
            refinementRate: "67.3%"
          }
        },
        recommendedActions: [
          {
            action: "Implement AI-powered search with NLP",
            effort: "High",
            timeline: "6-8 weeks",
            expectedImpact: "+15-22% search conversion"
          },
          {
            action: "Add predictive search suggestions",
            effort: "Medium",
            timeline: "3-4 weeks",
            expectedImpact: "+8-12% search engagement"
          }
        ]
      },
      {
        id: "UX-003",
        title: "Navigation Complexity",
        category: "Information Architecture",
        severity: "Medium",
        frequency: "Medium",
        impactScore: 7.4,
        affectedUsers: 19823,
        conversionImpact: "-8.7%",
        description: "Deep navigation structure causing users to get lost and unable to find key product categories efficiently",
        detailedAnalysis: {
          primaryCauses: [
            "Menu structure too deep (5+ levels)",
            "Category naming not intuitive to users",
            "No breadcrumb navigation on mobile",
            "Key categories buried in submenus"
          ],
          userFeedback: [
            "'Hard to navigate to what I need' - 39% of users",
            "'Menu is confusing' - 33% of users",
            "'Too many clicks to get to products' - 28% of users"
          ],
          technicaFindings: {
            avgClicksToProduct: 4.7,
            menuAbandonmentRate: "23.1%",
            breadcrumbUsage: "12.4%"
          }
        },
        recommendedActions: [
          {
            action: "Redesign navigation to 3-level maximum",
            effort: "High",
            timeline: "5-7 weeks",
            expectedImpact: "+10-15% navigation success"
          },
          {
            action: "Add breadcrumb navigation everywhere",
            effort: "Low",
            timeline: "1-2 weeks",
            expectedImpact: "+4-6% user orientation"
          }
        ]
      }
    ],

    crossPlatformAnalysis: {
      performance: {
        mobile: {
          pageLoadTime: 4.1,
          firstContentfulPaint: 2.8,
          coreWebVitals: {
            lcp: 3.9,
            fid: 180,
            cls: 0.18
          },
          conversionRate: 3.4,
          bounceRate: 58.7,
          avgSessionDuration: "2:34",
          userSatisfactionScore: 5.9
        },
        desktop: {
          pageLoadTime: 2.2,
          firstContentfulPaint: 1.4,
          coreWebVitals: {
            lcp: 2.1,
            fid: 85,
            cls: 0.08
          },
          conversionRate: 7.8,
          bounceRate: 34.2,
          avgSessionDuration: "4:17",
          userSatisfactionScore: 7.6
        }
      },
      usabilityMetrics: {
        taskCompletionRate: { mobile: 67.3, desktop: 89.1 },
        errorFrequency: { mobile: 23.4, desktop: 8.7 },
        userEfficiency: { mobile: 42.1, desktop: 78.3 },
        learnability: { mobile: 56.7, desktop: 82.4 }
      },
      featureAdoptionRates: {
        search: { mobile: 34.2, desktop: 58.7 },
        filters: { mobile: 18.9, desktop: 42.3 },
        wishlist: { mobile: 12.4, desktop: 28.9 },
        comparison: { mobile: 6.7, desktop: 19.4 },
        reviews: { mobile: 23.1, desktop: 41.6 }
      }
    },

    topUXFixes: [
      {
        id: "FIX-001",
        title: "Mobile Checkout Optimization",
        priority: "Critical",
        category: "Conversion Optimization",
        estimatedImpact: "+$2.4M annual revenue",
        effort: "High",
        timeline: "6-8 weeks",
        confidence: 94,
        description: "Complete mobile checkout flow redesign with single-page process, autofill, and guest checkout prominence",
        businessValue: "Direct impact on mobile conversion rates which represent 67% of traffic but only 31% of conversions",
        technicalRequirements: [
          "Frontend checkout redesign",
          "Payment gateway integration updates",
          "Form validation improvements",
          "Mobile-specific UI components"
        ],
        successMetrics: [
          { metric: "Mobile Conversion Rate", target: "+15-20%", baseline: "3.4%" },
          { metric: "Checkout Abandonment", target: "-25%", baseline: "68.7%" },
          { metric: "Time to Complete Purchase", target: "-40%", baseline: "4.3 min" },
          { metric: "Customer Satisfaction", target: "+1.2 points", baseline: "5.9/10" }
        ],
        implementationPhases: [
          {
            phase: "Phase 1: Analysis & Design",
            duration: "2 weeks",
            deliverables: ["User research analysis", "Wireframes", "Technical specifications"]
          },
          {
            phase: "Phase 2: Development",
            duration: "3-4 weeks",
            deliverables: ["New checkout UI", "Backend integrations", "Testing framework"]
          },
          {
            phase: "Phase 3: Testing & Launch",
            duration: "1-2 weeks",
            deliverables: ["A/B test setup", "Performance validation", "Gradual rollout"]
          }
        ]
      },
      {
        id: "FIX-002",
        title: "Intelligent Search Enhancement",
        priority: "High",
        category: "Search & Discovery",
        estimatedImpact: "+$1.8M annual revenue",
        effort: "Medium-High",
        timeline: "4-6 weeks",
        confidence: 87,
        description: "AI-powered search with NLP, auto-suggestions, personalization, and improved result relevance",
        businessValue: "Search accounts for 32% of site traffic and improving search success rate drives significant conversion uplift",
        technicalRequirements: [
          "Search engine upgrade (Elasticsearch/Solr)",
          "NLP and ML model integration",
          "Personalization algorithm",
          "Auto-suggestion system"
        ],
        successMetrics: [
          { metric: "Search Success Rate", target: "+40%", baseline: "34.2%" },
          { metric: "Search-to-Purchase Rate", target: "+25%", baseline: "8.7%" },
          { metric: "Zero Results Rate", target: "-60%", baseline: "18.3%" },
          { metric: "Search Engagement", target: "+35%", baseline: "1.8 results clicked" }
        ],
        implementationPhases: [
          {
            phase: "Phase 1: Search Infrastructure",
            duration: "2 weeks",
            deliverables: ["Search engine setup", "Data indexing", "Basic relevance tuning"]
          },
          {
            phase: "Phase 2: AI Enhancement",
            duration: "2-3 weeks",
            deliverables: ["NLP integration", "ML model deployment", "Personalization logic"]
          },
          {
            phase: "Phase 3: UX Integration",
            duration: "1 week",
            deliverables: ["Auto-suggestions UI", "Search result redesign", "Performance optimization"]
          }
        ]
      },
      {
        id: "FIX-003",
        title: "Cross-Platform Performance Optimization",
        priority: "High",
        category: "Technical Performance",
        estimatedImpact: "+$1.2M annual revenue",
        effort: "Medium",
        timeline: "3-4 weeks",
        confidence: 91,
        description: "Comprehensive performance improvements focusing on Core Web Vitals and mobile experience optimization",
        businessValue: "Page speed directly correlates with conversion rates - 1 second improvement can increase conversions by 7%",
        technicalRequirements: [
          "Image optimization and lazy loading",
          "Code splitting and bundle optimization",
          "CDN configuration improvements",
          "Mobile-specific performance tuning"
        ],
        successMetrics: [
          { metric: "Mobile Page Load Time", target: "-35%", baseline: "4.1s" },
          { metric: "Core Web Vitals Score", target: "90+", baseline: "68" },
          { metric: "Mobile Bounce Rate", target: "-15%", baseline: "58.7%" },
          { metric: "Performance Budget Compliance", target: "100%", baseline: "67%" }
        ],
        implementationPhases: [
          {
            phase: "Phase 1: Audit & Optimization Plan",
            duration: "1 week",
            deliverables: ["Performance audit", "Optimization roadmap", "Baseline metrics"]
          },
          {
            phase: "Phase 2: Core Optimizations",
            duration: "2 weeks",
            deliverables: ["Image optimization", "Code splitting", "Bundle size reduction"]
          },
          {
            phase: "Phase 3: Mobile-Specific Improvements",
            duration: "1 week",
            deliverables: ["Mobile performance tuning", "Progressive loading", "Final validation"]
          }
        ]
      }
    ],

    quickWins: [
      {
        title: "Add Loading States Everywhere",
        impact: "Medium",
        effort: "Low",
        timeline: "1 week",
        expectedImprovement: "+8% perceived performance"
      },
      {
        title: "Implement Breadcrumb Navigation",
        impact: "Medium",
        effort: "Low",
        timeline: "1-2 weeks",
        expectedImprovement: "+12% navigation success"
      },
      {
        title: "Add Guest Checkout Prominence",
        impact: "High",
        effort: "Low",
        timeline: "3-5 days",
        expectedImprovement: "+6-9% mobile conversion"
      },
      {
        title: "Fix Form Field Tab Order",
        impact: "Medium",
        effort: "Very Low",
        timeline: "2-3 days",
        expectedImprovement: "+4% form completion"
      },
      {
        title: "Optimize Critical Images",
        impact: "Medium",
        effort: "Low",
        timeline: "1 week",
        expectedImprovement: "+15% page load speed"
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* UX Overview KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total UX Issues</p>
                <p className="text-2xl font-bold text-red-600">{uxData.overview.totalIssues}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">{uxData.overview.criticalIssues} Critical</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">UX Score</p>
                <p className="text-2xl font-bold text-yellow-600">{uxData.overview.totalUXScore}/100</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Needs Improvement</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mobile vs Desktop</p>
                <p className="text-2xl font-bold text-blue-600">{uxData.overview.mobileConversionRate}% vs {uxData.overview.desktopConversionRate}%</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">-56% mobile gap</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction Score</p>
                <p className="text-2xl font-bold text-purple-600">{uxData.overview.userSatisfactionScore}/10</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Below industry avg</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UX Pain Points Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Critical UX Pain Points Analysis
          </CardTitle>
          <CardDescription>
            Detailed analysis of major user experience issues impacting conversion and satisfaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {uxData.painPoints.map((painPoint, index) => (
              <Card key={painPoint.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Pain Point Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${painPoint.severity === 'Critical' ? 'bg-red-100 text-red-800' : painPoint.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {painPoint.severity}
                          </Badge>
                          <Badge variant="outline">{painPoint.category}</Badge>
                          <Badge variant="secondary">{painPoint.frequency} Frequency</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{painPoint.title}</h3>
                        <p className="text-gray-600">{painPoint.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-red-600">{painPoint.conversionImpact}</div>
                        <div className="text-sm text-gray-500">Impact on Conversions</div>
                        <div className="text-sm text-gray-600">{painPoint.affectedUsers.toLocaleString()} users affected</div>
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Primary Causes</h4>
                        <div className="space-y-2">
                          {painPoint.detailedAnalysis.primaryCauses.map((cause, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{cause}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">User Feedback</h4>
                        <div className="space-y-2">
                          {painPoint.detailedAnalysis.userFeedback.map((feedback, i) => (
                            <div key={i} className="text-sm">
                              <div className="text-gray-700 italic">"{feedback.split(' - ')[0]}"</div>
                              <div className="text-gray-500 font-medium">{feedback.split(' - ')[1]}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Technical Metrics</h4>
                        <div className="space-y-2">
                          {Object.entries(painPoint.detailedAnalysis.technicaFindings).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">{Array.isArray(value) ? `${value.length} issues` : value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Recommended Actions</h4>
                      <div className="space-y-3">
                        {painPoint.recommendedActions.map((action, i) => (
                          <Card key={i} className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">{action.action}</div>
                                  <div className="text-sm text-green-600 font-medium">{action.expectedImpact}</div>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="font-medium">{action.timeline}</div>
                                  <div className="text-gray-600">{action.effort} effort</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Platform Performance Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Mobile vs Desktop Performance
            </CardTitle>
            <CardDescription>Comprehensive cross-platform UX metrics comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  {Object.entries(uxData.crossPlatformAnalysis.performance.mobile).map(([key, mobileValue]) => {
                    const desktopValue = uxData.crossPlatformAnalysis.performance.desktop[key as keyof typeof uxData.crossPlatformAnalysis.performance.desktop];
                    if (typeof mobileValue === 'object') return null;

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium">Mobile vs Desktop</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-medium text-blue-900">{typeof mobileValue === 'string' ? mobileValue : mobileValue.toFixed(1)}</div>
                            <div className="text-blue-600">Mobile</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="font-medium text-gray-900">{typeof desktopValue === 'string' ? desktopValue : desktopValue.toFixed(1)}</div>
                            <div className="text-gray-600">Desktop</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Core Web Vitals */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Core Web Vitals</h4>
                <div className="space-y-3">
                  {Object.entries(uxData.crossPlatformAnalysis.performance.mobile.coreWebVitals).map(([metric, mobileValue]) => {
                    const desktopValue = uxData.crossPlatformAnalysis.performance.desktop.coreWebVitals[metric as keyof typeof uxData.crossPlatformAnalysis.performance.desktop.coreWebVitals];
                    return (
                      <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 uppercase">{metric}</div>
                          <div className="text-sm text-gray-600">{metric === 'lcp' ? 'Largest Contentful Paint' : metric === 'fid' ? 'First Input Delay' : 'Cumulative Layout Shift'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="font-medium text-blue-600">{mobileValue}</span>
                            <span className="text-gray-400 mx-1">vs</span>
                            <span className="font-medium text-gray-900">{desktopValue}</span>
                          </div>
                          <div className="text-xs text-gray-500">Mobile vs Desktop</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-green-600" />
              Feature Adoption Analysis
            </CardTitle>
            <CardDescription>Cross-platform feature usage and adoption rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Usability Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Usability Metrics</h4>
                <div className="space-y-3">
                  {Object.entries(uxData.crossPlatformAnalysis.usabilityMetrics).map(([metric, platforms]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{platforms.mobile}% vs {platforms.desktop}%</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${platforms.mobile}%` }}></div>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${platforms.desktop}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Adoption */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Feature Adoption Rates</h4>
                <div className="space-y-3">
                  {Object.entries(uxData.crossPlatformAnalysis.featureAdoptionRates).map(([feature, platforms]) => (
                    <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{feature}</div>
                        <div className="text-sm text-gray-600">Usage rate comparison</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">{platforms.mobile}%</span>
                          <span className="text-gray-400 mx-1">vs</span>
                          <span className="font-medium text-gray-900">{platforms.desktop}%</span>
                        </div>
                        <div className="text-xs text-gray-500">Mobile vs Desktop</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top UX Fixes Priority Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-green-600" />
            Top UX Fixes - Priority & Implementation Plan
          </CardTitle>
          <CardDescription>
            Prioritized UX improvements with detailed implementation roadmaps and expected ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {uxData.topUXFixes.map((fix, index) => (
              <Card key={fix.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Fix Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${fix.priority === 'Critical' ? 'bg-red-100 text-red-800' : fix.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {fix.priority} Priority
                          </Badge>
                          <Badge variant="outline">{fix.category}</Badge>
                          <Badge variant="secondary">{fix.effort} Effort</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{fix.title}</h3>
                        <p className="text-gray-600">{fix.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-green-600">{fix.estimatedImpact}</div>
                        <div className="text-sm text-gray-500">Est. Annual Impact</div>
                        <div className="text-sm font-medium">{fix.confidence}% Confidence</div>
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Success Metrics & Targets</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {fix.successMetrics.map((metric, i) => (
                          <div key={i} className="bg-green-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{metric.metric}</div>
                                <div className="text-sm text-gray-600">Baseline: {metric.baseline}</div>
                              </div>
                              <div className="text-lg font-bold text-green-600">{metric.target}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Implementation Phases */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Implementation Roadmap</h4>
                      <div className="space-y-4">
                        {fix.implementationPhases.map((phase, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{phase.phase}</div>
                                <div className="text-sm text-gray-600">{phase.duration}</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {phase.deliverables.map((deliverable, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">{deliverable}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Requirements */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Technical Requirements</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {fix.technicalRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-1">Business Value</div>
                      <div className="text-sm text-gray-700">{fix.businessValue}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick UX Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick UX Wins - Immediate Impact Opportunities
          </CardTitle>
          <CardDescription>
            Low-effort, high-impact UX improvements that can be implemented quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {uxData.quickWins.map((win, index) => (
              <Card key={index} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{win.title}</h3>
                      <Badge className={`${win.impact === 'High' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {win.impact} Impact
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Effort:</span>
                        <span className="font-medium">{win.effort}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timeline:</span>
                        <span className="font-medium">{win.timeline}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800">{win.expectedImprovement}</div>
                      <div className="text-xs text-yellow-700">Expected Improvement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comprehensive Technology Optimization Dashboard with Tech Stack Assessment, Integration Health, and Enhancement Recommendations
function TechnologyOptimizationDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  const technologyData = {
    overview: {
      techStackScore: 73,
      integrationHealth: 82,
      activeIntegrations: 24,
      criticalVulnerabilities: 3,
      systemUptime: 99.7,
      performanceScore: 78,
      securityScore: 85,
      scalabilityScore: 69
    },

    techStackReadiness: {
      coreInfrastructure: {
        score: 78,
        status: "Good",
        components: [
          {
            category: "Web Platform",
            technology: "Next.js 14",
            status: "Current",
            score: 85,
            recommendation: "Keep current",
            lastUpdated: "2024-03-15",
            vulnerabilities: 0,
            performance: "Excellent"
          },
          {
            category: "Database",
            technology: "PostgreSQL 15",
            status: "Current",
            score: 82,
            recommendation: "Monitor for v16 features",
            lastUpdated: "2024-02-20",
            vulnerabilities: 0,
            performance: "Good"
          },
          {
            category: "CDN & Hosting",
            technology: "Vercel + Cloudflare",
            status: "Current",
            score: 90,
            recommendation: "Optimize edge caching",
            lastUpdated: "2024-04-01",
            vulnerabilities: 0,
            performance: "Excellent"
          },
          {
            category: "Analytics",
            technology: "Google Analytics 4",
            status: "Outdated Config",
            score: 65,
            recommendation: "Update tracking implementation",
            lastUpdated: "2023-11-12",
            vulnerabilities: 1,
            performance: "Fair"
          }
        ]
      },
      dataStack: {
        score: 71,
        status: "Needs Attention",
        components: [
          {
            category: "Data Warehouse",
            technology: "BigQuery",
            status: "Current",
            score: 85,
            recommendation: "Implement data governance",
            lastUpdated: "2024-03-08",
            vulnerabilities: 0,
            performance: "Excellent"
          },
          {
            category: "ETL Pipeline",
            technology: "Airflow 2.8",
            status: "Current",
            score: 75,
            recommendation: "Add monitoring alerts",
            lastUpdated: "2024-01-22",
            vulnerabilities: 0,
            performance: "Good"
          },
          {
            category: "Real-time Processing",
            technology: "Apache Kafka",
            status: "Needs Update",
            score: 60,
            recommendation: "Upgrade to latest version",
            lastUpdated: "2023-09-15",
            vulnerabilities: 2,
            performance: "Fair"
          }
        ]
      },
      marketingTech: {
        score: 69,
        status: "Mixed",
        components: [
          {
            category: "Email Marketing",
            technology: "Salesforce Marketing Cloud",
            status: "Current",
            score: 88,
            recommendation: "Leverage Einstein features",
            lastUpdated: "2024-03-25",
            vulnerabilities: 0,
            performance: "Excellent"
          },
          {
            category: "CMS",
            technology: "Optimizely CMS",
            status: "Current",
            score: 75,
            recommendation: "Implement headless architecture",
            lastUpdated: "2024-02-14",
            vulnerabilities: 0,
            performance: "Good"
          },
          {
            category: "Personalization",
            technology: "Custom Solution",
            status: "Legacy",
            score: 45,
            recommendation: "Migrate to modern platform",
            lastUpdated: "2023-06-30",
            vulnerabilities: 1,
            performance: "Poor"
          }
        ]
      }
    },

    integrationHealth: {
      overallHealth: 82,
      criticalIntegrations: [
        {
          name: "Salesforce CRM → Marketing Automation",
          status: "Healthy",
          uptime: 99.8,
          latency: 145,
          throughput: 2450,
          errorRate: 0.2,
          lastIncident: "2024-02-18",
          healthScore: 95,
          dataFlow: "Bidirectional",
          criticalityLevel: "High"
        },
        {
          name: "E-commerce Platform → Analytics",
          status: "Warning",
          uptime: 98.2,
          latency: 320,
          throughput: 1820,
          errorRate: 1.8,
          lastIncident: "2024-04-02",
          healthScore: 78,
          dataFlow: "Unidirectional",
          criticalityLevel: "Critical"
        },
        {
          name: "Customer Data Platform → Personalization Engine",
          status: "Critical",
          uptime: 95.4,
          latency: 580,
          throughput: 980,
          errorRate: 4.6,
          lastIncident: "2024-04-08",
          healthScore: 62,
          dataFlow: "Real-time",
          criticalityLevel: "Critical"
        }
      ],
      integrationMetrics: {
        totalDataVolume: "2.4TB/day",
        avgProcessingTime: "2.3 seconds",
        successRate: 96.8,
        failureRecoveryTime: "4.2 minutes",
        monitoringCoverage: 89
      },
      commonIssues: [
        {
          issue: "Rate limit exceeded on API calls",
          frequency: "Weekly",
          impact: "Medium",
          affectedSystems: ["CRM", "Analytics"],
          resolution: "Implement request queuing and retry logic"
        },
        {
          issue: "Data schema mismatches during updates",
          frequency: "Monthly",
          impact: "High",
          affectedSystems: ["CDP", "Personalization"],
          resolution: "Establish schema versioning and validation"
        },
        {
          issue: "Authentication token expiration",
          frequency: "Daily",
          impact: "Low",
          affectedSystems: ["All external APIs"],
          resolution: "Implement automatic token refresh"
        }
      ]
    },

    techEnhancements: [
      {
        id: "TECH-001",
        title: "AI-Powered Personalization Platform Migration",
        category: "Platform Upgrade",
        priority: "Critical",
        businessValue: "+$3.2M annual revenue impact",
        technicalDebt: "High",
        effort: "High",
        timeline: "12-16 weeks",
        confidence: 89,
        description: "Migrate from legacy custom personalization solution to modern AI-driven platform with real-time decisioning capabilities",
        currentState: "Legacy custom solution with limited ML capabilities, high maintenance overhead, and scalability constraints",
        futureState: "Modern AI platform with real-time personalization, automated model training, and seamless integration capabilities",
        businessDrivers: [
          "Reduce personalization development time by 70%",
          "Increase conversion rates through advanced ML algorithms",
          "Enable real-time decision making at scale",
          "Reduce technical debt and maintenance costs"
        ],
        technicalRequirements: [
          {
            component: "AI/ML Platform",
            requirement: "Cloud-native ML platform (AWS SageMaker, Google AI Platform, or Azure ML)",
            effort: "High",
            dependencies: ["Data pipeline modernization", "Model training infrastructure"]
          },
          {
            component: "Real-time Decision Engine",
            requirement: "Sub-100ms response time decisioning system",
            effort: "Medium",
            dependencies: ["CDN integration", "Edge computing setup"]
          },
          {
            component: "Data Integration",
            requirement: "Real-time customer data ingestion and profile unification",
            effort: "High",
            dependencies: ["CDP enhancement", "Event streaming architecture"]
          }
        ],
        riskAssessment: {
          risks: [
            {
              risk: "Migration complexity and data loss",
              probability: "Medium",
              impact: "High",
              mitigation: "Parallel system operation with gradual cutover"
            },
            {
              risk: "Performance degradation during transition",
              probability: "Low",
              impact: "Medium",
              mitigation: "Extensive load testing and rollback procedures"
            }
          ],
          contingencyPlans: ["Rollback to legacy system", "Hybrid operation mode", "Phased regional rollout"]
        },
        implementationPhases: [
          {
            phase: "Phase 1: Platform Selection & Architecture Design",
            duration: "3-4 weeks",
            deliverables: ["Vendor evaluation", "System architecture", "Migration strategy"],
            effort: "Medium"
          },
          {
            phase: "Phase 2: Infrastructure Setup & Data Migration",
            duration: "4-5 weeks",
            deliverables: ["Platform deployment", "Data pipeline", "Initial model training"],
            effort: "High"
          },
          {
            phase: "Phase 3: Integration & Testing",
            duration: "3-4 weeks",
            deliverables: ["API integrations", "Performance testing", "Security validation"],
            effort: "High"
          },
          {
            phase: "Phase 4: Deployment & Optimization",
            duration: "2-3 weeks",
            deliverables: ["Production deployment", "Performance tuning", "Team training"],
            effort: "Medium"
          }
        ],
        successMetrics: [
          { metric: "Personalization Response Time", target: "< 100ms", baseline: "450ms" },
          { metric: "Model Accuracy", target: "> 85%", baseline: "67%" },
          { metric: "Development Velocity", target: "+70%", baseline: "Current speed" },
          { metric: "System Uptime", target: "> 99.9%", baseline: "97.8%" }
        ]
      },
      {
        id: "TECH-002",
        title: "Real-time Data Architecture Modernization",
        category: "Infrastructure Upgrade",
        priority: "High",
        businessValue: "+$1.8M operational efficiency",
        technicalDebt: "Medium",
        effort: "Medium-High",
        timeline: "8-12 weeks",
        confidence: 84,
        description: "Implement modern event-driven architecture for real-time data processing and customer journey orchestration",
        currentState: "Batch-heavy data processing with delayed insights and limited real-time capabilities",
        futureState: "Event-driven architecture enabling real-time insights, instant personalization, and automated customer journey management",
        businessDrivers: [
          "Enable real-time customer journey optimization",
          "Reduce data latency from hours to milliseconds",
          "Support instantaneous personalization decisions",
          "Improve customer experience through timely interventions"
        ],
        technicalRequirements: [
          {
            component: "Event Streaming Platform",
            requirement: "Apache Kafka or cloud-native equivalent with 99.9% uptime",
            effort: "Medium",
            dependencies: ["Message schema design", "Consumer application updates"]
          },
          {
            component: "Stream Processing Engine",
            requirement: "Apache Flink or cloud-native stream processing with auto-scaling",
            effort: "High",
            dependencies: ["Real-time ML model deployment", "State management"]
          }
        ],
        implementationPhases: [
          {
            phase: "Phase 1: Event Architecture Design",
            duration: "2-3 weeks",
            deliverables: ["Event schema design", "Architecture blueprint", "Migration plan"],
            effort: "Medium"
          },
          {
            phase: "Phase 2: Infrastructure Deployment",
            duration: "3-4 weeks",
            deliverables: ["Streaming platform setup", "Processing engines", "Monitoring systems"],
            effort: "High"
          },
          {
            phase: "Phase 3: Application Migration",
            duration: "3-4 weeks",
            deliverables: ["Event producers", "Stream processors", "Consumer applications"],
            effort: "High"
          },
          {
            phase: "Phase 4: Optimization & Scaling",
            duration: "1-2 weeks",
            deliverables: ["Performance tuning", "Auto-scaling setup", "Production validation"],
            effort: "Medium"
          }
        ]
      },
      {
        id: "TECH-003",
        title: "Headless Commerce Architecture Implementation",
        category: "Architecture Modernization",
        priority: "Medium",
        businessValue: "+$950K customer experience improvement",
        technicalDebt: "Low",
        effort: "Medium",
        timeline: "6-10 weeks",
        confidence: 91,
        description: "Transition to headless commerce architecture for improved performance, flexibility, and omnichannel experiences",
        currentState: "Monolithic e-commerce platform with tightly coupled frontend and backend systems",
        futureState: "Headless architecture enabling flexible frontend experiences, improved performance, and seamless omnichannel delivery",
        businessDrivers: [
          "Improve page load speeds by 40-60%",
          "Enable rapid frontend experimentation and optimization",
          "Support multiple channels from single backend",
          "Future-proof architecture for emerging touchpoints"
        ],
        implementationPhases: [
          {
            phase: "Phase 1: API Layer Development",
            duration: "2-3 weeks",
            deliverables: ["GraphQL API", "Authentication system", "Rate limiting"],
            effort: "Medium"
          },
          {
            phase: "Phase 2: Frontend Modernization",
            duration: "3-4 weeks",
            deliverables: ["Next.js application", "Component library", "Performance optimization"],
            effort: "High"
          },
          {
            phase: "Phase 3: Migration & Testing",
            duration: "2-3 weeks",
            deliverables: ["Gradual migration", "A/B testing", "Performance validation"],
            effort: "Medium"
          }
        ]
      }
    ],

    securityCompliance: {
      overallScore: 85,
      frameworks: ["SOC 2", "PCI DSS", "GDPR", "CCPA"],
      vulnerabilities: {
        critical: 3,
        high: 7,
        medium: 12,
        low: 23
      },
      complianceStatus: {
        dataPrivacy: "Compliant",
        paymentSecurity: "Compliant",
        accessControls: "Needs Attention",
        auditLogging: "Compliant"
      },
      recentAssessments: [
        {
          assessment: "Penetration Testing",
          date: "2024-03-15",
          score: 87,
          findings: "3 medium-risk vulnerabilities identified and remediated"
        },
        {
          assessment: "GDPR Compliance Audit",
          date: "2024-02-28",
          score: 94,
          findings: "Full compliance maintained with minor documentation updates needed"
        }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {/* Technology Overview KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tech Stack Score</p>
                <p className="text-2xl font-bold text-blue-600">{technologyData.overview.techStackScore}/100</p>
              </div>
              <Code className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Good overall health</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Integration Health</p>
                <p className="text-2xl font-bold text-green-600">{technologyData.overview.integrationHealth}%</p>
              </div>
              <Network className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">{technologyData.overview.activeIntegrations} active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-purple-600">{technologyData.overview.systemUptime}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Excellent reliability</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-orange-600">{technologyData.overview.securityScore}/100</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">{technologyData.overview.criticalVulnerabilities} critical issues</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack Readiness Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            Technology Stack Readiness Assessment
          </CardTitle>
          <CardDescription>
            Comprehensive evaluation of current technology infrastructure and modernization requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(technologyData.techStackReadiness).map(([stackName, stack]) => (
              <div key={stackName}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{stackName.replace(/([A-Z])/g, ' $1')}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`${stack.status === 'Good' ? 'bg-green-100 text-green-800' : stack.status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {stack.status}
                    </Badge>
                    <div className="text-xl font-bold text-blue-600">{stack.score}/100</div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {stack.components.map((component, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{component.category}</div>
                              <div className="text-sm text-gray-600">{component.technology}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${component.status === 'Current' ? 'bg-green-100 text-green-800' : component.status === 'Needs Update' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {component.status}
                              </Badge>
                              <div className="text-lg font-bold text-gray-900">{component.score}/100</div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Performance:</span>
                              <span className="font-medium">{component.performance}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Updated:</span>
                              <span className="font-medium">{component.lastUpdated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Vulnerabilities:</span>
                              <span className={`font-medium ${component.vulnerabilities > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {component.vulnerabilities}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-1">Recommendation</div>
                            <div className="text-sm text-blue-800">{component.recommendation}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Health Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-green-600" />
            Integration Health & Performance Monitoring
          </CardTitle>
          <CardDescription>
            Real-time monitoring and analysis of critical system integrations and data flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Integration Metrics */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{technologyData.integrationHealth.integrationMetrics.totalDataVolume}</div>
                <div className="text-sm text-gray-600">Daily Data Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{technologyData.integrationHealth.integrationMetrics.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{technologyData.integrationHealth.integrationMetrics.avgProcessingTime}</div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
              </div>
            </div>

            {/* Critical Integrations Status */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Critical Integration Status</h4>
              <div className="space-y-4">
                {technologyData.integrationHealth.criticalIntegrations.map((integration, index) => (
                  <Card key={index} className={`border-l-4 ${integration.status === 'Healthy' ? 'border-l-green-500' : integration.status === 'Warning' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{integration.name}</div>
                            <div className="text-sm text-gray-600">{integration.dataFlow} • {integration.criticalityLevel} Priority</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${integration.status === 'Healthy' ? 'bg-green-100 text-green-800' : integration.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {integration.status}
                            </Badge>
                            <div className="text-lg font-bold text-gray-900">{integration.healthScore}/100</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900">{integration.uptime}%</div>
                            <div className="text-gray-600">Uptime</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900">{integration.latency}ms</div>
                            <div className="text-gray-600">Latency</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900">{integration.throughput}</div>
                            <div className="text-gray-600">Throughput/hr</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900">{integration.errorRate}%</div>
                            <div className="text-gray-600">Error Rate</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          Last incident: {integration.lastIncident}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Common Integration Issues */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Common Issues & Resolutions</h4>
              <div className="space-y-3">
                {technologyData.integrationHealth.commonIssues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${issue.impact === 'High' ? 'text-red-500' : issue.impact === 'Medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{issue.issue}</div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${issue.impact === 'High' ? 'bg-red-100 text-red-800' : issue.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {issue.impact} Impact
                          </Badge>
                          <span className="text-sm text-gray-500">{issue.frequency}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Affected: {issue.affectedSystems.join(', ')}
                      </div>
                      <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                        <strong>Resolution:</strong> {issue.resolution}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Enhancement Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-purple-600" />
            Strategic Technology Enhancement Recommendations
          </CardTitle>
          <CardDescription>
            High-impact technology improvements with detailed implementation roadmaps and ROI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {technologyData.techEnhancements.map((enhancement, index) => (
              <Card key={enhancement.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Enhancement Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${enhancement.priority === 'Critical' ? 'bg-red-100 text-red-800' : enhancement.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {enhancement.priority} Priority
                          </Badge>
                          <Badge variant="outline">{enhancement.category}</Badge>
                          <Badge variant="secondary">{enhancement.effort} Effort</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{enhancement.title}</h3>
                        <p className="text-gray-600">{enhancement.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-green-600">{enhancement.businessValue}</div>
                        <div className="text-sm text-gray-500">Business Value</div>
                        <div className="text-sm font-medium">{enhancement.confidence}% Confidence</div>
                      </div>
                    </div>

                    {/* Current vs Future State */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Current State</h4>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{enhancement.currentState}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Future State</h4>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">{enhancement.futureState}</p>
                        </div>
                      </div>
                    </div>

                    {/* Business Drivers */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Business Drivers</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {enhancement.businessDrivers.map((driver, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700">{driver}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Implementation Phases */}
                    {enhancement.implementationPhases && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Implementation Roadmap</h4>
                        <div className="space-y-4">
                          {enhancement.implementationPhases.map((phase, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                                {i + 1}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-gray-900">{phase.phase}</div>
                                  <div className="text-sm text-gray-600">{phase.duration}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {phase.deliverables.map((deliverable, j) => (
                                    <Badge key={j} variant="outline" className="text-xs">{deliverable}</Badge>
                                  ))}
                                </div>
                                <div className="text-sm text-gray-600">Effort: {phase.effort}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success Metrics */}
                    {enhancement.successMetrics && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Success Metrics</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {enhancement.successMetrics.map((metric, i) => (
                            <div key={i} className="bg-purple-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">{metric.metric}</div>
                                  <div className="text-sm text-gray-600">Baseline: {metric.baseline}</div>
                                </div>
                                <div className="text-lg font-bold text-purple-600">{metric.target}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance Dashboard */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security & Compliance Status
            </CardTitle>
            <CardDescription>Current security posture and compliance framework status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Security Score */}
              <div className="text-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{technologyData.securityCompliance.overallScore}/100</div>
                <div className="text-sm text-gray-600">Overall Security Score</div>
              </div>

              {/* Vulnerability Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Vulnerability Assessment</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(technologyData.securityCompliance.vulnerabilities).map(([severity, count]) => (
                    <div key={severity} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-lg font-bold ${severity === 'critical' ? 'text-red-600' : severity === 'high' ? 'text-orange-600' : severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {count}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">{severity}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Status */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Compliance Framework Status</h4>
                <div className="space-y-3">
                  {Object.entries(technologyData.securityCompliance.complianceStatus).map(([framework, status]) => (
                    <div key={framework} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 capitalize">{framework.replace(/([A-Z])/g, ' $1')}</div>
                      <Badge className={`${status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Recent Security Assessments
            </CardTitle>
            <CardDescription>Latest security audits and compliance evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Supported Frameworks */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Compliance Frameworks</h4>
                <div className="flex flex-wrap gap-2">
                  {technologyData.securityCompliance.frameworks.map((framework, index) => (
                    <Badge key={index} variant="outline" className="text-sm">{framework}</Badge>
                  ))}
                </div>
              </div>

              {/* Recent Assessments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Assessment Results</h4>
                <div className="space-y-4">
                  {technologyData.securityCompliance.recentAssessments.map((assessment, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{assessment.assessment}</div>
                            <div className="text-lg font-bold text-blue-600">{assessment.score}/100</div>
                          </div>
                          <div className="text-sm text-gray-600">Conducted: {assessment.date}</div>
                          <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                            {assessment.findings}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// OSA Insights component with KPI cards and AI-powered summaries
function OSAInsights({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="osa-insights" className="space-y-6">
      {/* KPI Summary Cards */}
      <div id="kpi-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maturity Score</p>
                <p className="text-2xl font-bold">8.7/10</p>
                <Badge className={phaseConfig.run.color}>
                  {phaseConfig.run.label} Phase
                </Badge>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Readiness Score</p>
                <p className="text-2xl font-bold">92%</p>
                <Badge className={phaseConfig.fly.color}>
                  Implementation Ready
                </Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority Actions</p>
                <p className="text-2xl font-bold">12</p>
                <Badge className={phaseConfig.walk.color}>
                  Next 30 Days
                </Badge>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI Potential</p>
                <p className="text-2xl font-bold">347%</p>
                <Badge className={phaseConfig.fly.color}>
                  High Impact
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Top AI Insights
            </CardTitle>
            <CardDescription>Key discoveries from your personalization strategy analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { insight: "High content engagement potential detected", confidence: 94, type: "opportunity" },
                { insight: "Audience segmentation gaps identified", confidence: 87, type: "risk" },
                { insight: "Cross-platform optimization opportunity", confidence: 91, type: "opportunity" },
                { insight: "Data integration readiness confirmed", confidence: 96, type: "success" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    item.type === 'success' ? 'bg-green-500' :
                    item.type === 'opportunity' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.insight}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Confidence: {item.confidence}%</span>
                      <Progress value={item.confidence} className="h-1 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Priority Recommendations
            </CardTitle>
            <CardDescription>Immediate actions to accelerate your strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Implement audience-based content recommendations", impact: "High", effort: "Medium", timeline: "2-3 weeks" },
                { action: "Set up cross-channel behavior tracking", impact: "High", effort: "Low", timeline: "1 week" },
                { action: "Create dynamic email personalization", impact: "Medium", effort: "Medium", timeline: "3-4 weeks" },
                { action: "Deploy A/B testing framework", impact: "High", effort: "High", timeline: "4-6 weeks" }
              ].map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium flex-1">{item.action}</p>
                    <Badge variant={item.impact === 'High' ? 'default' : 'secondary'} className="ml-2">
                      {item.impact}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Effort: {item.effort}</span>
                    <span>Timeline: {item.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Content Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Engagement Rate</span>
                <span className="font-medium">23.4%</span>
              </div>
              <Progress value={23.4} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-medium">4.2%</span>
              </div>
              <Progress value={42} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                +12% improvement opportunity identified
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Segmentation Score</span>
                <span className="font-medium">8.1/10</span>
              </div>
              <Progress value={81} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Personalization Depth</span>
                <span className="font-medium">6.7/10</span>
              </div>
              <Progress value={67} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                3 new segments recommended
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Technical Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Quality</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Integration Score</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                All systems operational
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Strategic Highlights
          </CardTitle>
          <CardDescription>Key findings and strategic opportunities from your OSA analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900 mb-2">Personalization Maturity</h4>
              <p className="text-sm text-blue-700">Your organization is in the "Run" phase with strong foundational capabilities. Ready for advanced AI-driven personalization.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-medium text-green-900 mb-2">Data Integration</h4>
              <p className="text-sm text-green-700">Excellent data foundation detected. Your systems are well-positioned for real-time personalization engines.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-medium text-orange-900 mb-2">Quick Wins Identified</h4>
              <p className="text-sm text-orange-700">12 high-impact, low-effort improvements identified that could deliver 25-40% engagement lift within 30 days.</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-medium text-purple-900 mb-2">ROI Projection</h4>
              <p className="text-sm text-purple-700">Conservative estimates show 347% ROI potential through strategic personalization implementation.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Quick Wins component with Top 3 Quick Wins, Impact vs Effort Matrix, and Quick Win Details
function StrategyOverview({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  // Quick wins data based on opal-config maturity framework
  const quickWins = [
    {
      id: 'email-segmentation',
      title: 'Basic Email Segmentation',
      description: 'Implement simple demographic and firmographic segmentation for email campaigns to improve engagement rates.',
      impact: 8,
      effort: 3,
      timeline: '2-3 weeks',
      expectedLift: '+25% email engagement',
      confidence: 87,
      tools: ['Email Platform', 'ODP Basic Segments'],
      category: 'Content',
      roiEstimate: '$15k annual savings',
      phase: 'crawl'
    },
    {
      id: 'form-optimization',
      title: 'Lead Capture Form Optimization',
      description: 'Add progressive profiling to lead capture forms and optimize CTAs for different audience segments.',
      impact: 7,
      effort: 2,
      timeline: '1-2 weeks',
      expectedLift: '+35% form conversion',
      confidence: 92,
      tools: ['CMS', 'Optimizely Web'],
      category: 'UX',
      roiEstimate: '$22k annual value',
      phase: 'crawl'
    },
    {
      id: 'content-personalization',
      title: 'Static Content Personalization',
      description: 'Create 4-6 content variations for primary personas with basic greeting and content personalization.',
      impact: 6,
      effort: 4,
      timeline: '3-4 weeks',
      expectedLift: '+18% time on page',
      confidence: 78,
      tools: ['CMS', 'Content Templates'],
      category: 'Personalization',
      roiEstimate: '$8k annual impact',
      phase: 'crawl'
    }
  ];

  // Additional quick wins for the matrix
  const allQuickWins = [
    ...quickWins,
    { id: 'analytics-setup', title: 'Basic Analytics Setup', impact: 5, effort: 2, category: 'Analytics' },
    { id: 'ab-testing', title: 'Simple A/B Tests', impact: 7, effort: 3, category: 'Experimentation' },
    { id: 'social-proof', title: 'Social Proof Elements', impact: 4, effort: 1, category: 'UX' },
    { id: 'mobile-optimization', title: 'Mobile Form Optimization', impact: 8, effort: 5, category: 'UX' },
    { id: 'lead-scoring', title: 'Basic Lead Scoring', impact: 9, effort: 6, category: 'Analytics' },
    { id: 'retargeting', title: 'Email Retargeting Setup', impact: 6, effort: 3, category: 'Marketing' }
  ];

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (impact >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getEffortColor = (effort: number) => {
    if (effort <= 2) return 'bg-green-100 text-green-800 border-green-200';
    if (effort <= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div id="quick-wins-overview" className="space-y-6">
      {/* Top 3 Quick Wins Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Top 3 Quick Wins</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickWins.map((quickWin, index) => (
            <Card key={quickWin.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-blue-100 text-blue-800">#{index + 1} Priority</Badge>
                  <Badge className={phaseConfig[quickWin.phase as keyof typeof phaseConfig].color}>
                    {phaseConfig[quickWin.phase as keyof typeof phaseConfig].label}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{quickWin.title}</CardTitle>
                <CardDescription className="text-sm">{quickWin.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Impact/Effort Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`${getImpactColor(quickWin.impact)} border`}>
                      Impact: {quickWin.impact}/10
                    </Badge>
                    <Badge variant="outline" className={`${getEffortColor(quickWin.effort)} border`}>
                      Effort: {quickWin.effort}/10
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      {quickWin.confidence}% Confidence
                    </Badge>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Timeline</div>
                      <div className="font-medium">{quickWin.timeline}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Expected Lift</div>
                      <div className="font-medium text-green-600">{quickWin.expectedLift}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">ROI Estimate</div>
                      <div className="font-medium text-blue-600">{quickWin.roiEstimate}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Category</div>
                      <div className="font-medium">{quickWin.category}</div>
                    </div>
                  </div>

                  {/* Tools Required */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Required Tools</div>
                    <div className="flex flex-wrap gap-1">
                      {quickWin.tools.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Impact vs Effort Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Impact vs Effort Matrix
          </CardTitle>
          <CardDescription>
            Visual prioritization of all quick win opportunities based on business impact and implementation effort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-tr from-red-50 via-yellow-50 to-green-50 border rounded-lg p-6 h-96">
            {/* Axis Labels */}
            <div className="absolute -left-12 top-1/2 transform -rotate-90 text-sm font-medium text-gray-600">
              Impact (Business Value)
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 text-sm font-medium text-gray-600">
              Effort (Implementation Complexity)
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-6 border-l-2 border-b-2 border-gray-300">
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-0">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="border-r border-t border-gray-200 opacity-30"></div>
                ))}
              </div>
            </div>

            {/* Quadrant Labels */}
            <div className="absolute top-2 right-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
              High Impact, Low Effort (DO FIRST)
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
              High Impact, High Effort (DO NEXT)
            </div>
            <div className="absolute top-2 left-2 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
              Low Impact, Low Effort (DO LATER)
            </div>

            {/* Plot Points */}
            <div className="absolute inset-6">
              {allQuickWins.map((item) => {
                const x = (item.effort / 10) * 100;
                const y = 100 - (item.impact / 10) * 100;
                return (
                  <div
                    key={item.id}
                    className="absolute group cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 group-hover:w-4 group-hover:h-4 transition-all"></div>
                    <div className="absolute left-1/2 top-full mt-1 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.title}
                      <br />
                      Impact: {item.impact}/10, Effort: {item.effort}/10
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Axis Numbers */}
            <div className="absolute left-0 inset-y-6">
              {[10, 8, 6, 4, 2].map((num, i) => (
                <div key={num} className="absolute text-xs text-gray-500 -left-4" style={{ top: `${i * 20}%` }}>
                  {num}
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 inset-x-6">
              {[2, 4, 6, 8, 10].map((num, i) => (
                <div key={num} className="absolute text-xs text-gray-500 -bottom-4" style={{ left: `${i * 20}%` }}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Win Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Implementation Details & Next Steps
          </CardTitle>
          <CardDescription>
            Detailed breakdown of recommended quick wins with specific implementation guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quickWins.map((quickWin, index) => (
              <div key={quickWin.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{quickWin.title}</h3>
                      <p className="text-gray-600 text-sm">{quickWin.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {quickWin.timeline}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Success Metrics</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Expected Lift: <span className="font-medium text-green-600">{quickWin.expectedLift}</span></li>
                      <li>• ROI Estimate: <span className="font-medium text-blue-600">{quickWin.roiEstimate}</span></li>
                      <li>• Confidence Level: <span className="font-medium">{quickWin.confidence}%</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Required Tools</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {quickWin.tools.map((tool) => (
                        <li key={tool}>• {tool}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Implementation Steps</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Setup and configuration</li>
                      <li>• Testing and validation</li>
                      <li>• Launch and monitoring</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Maturity Assessment Dashboard with comprehensive scoring and benchmarks
function MaturityAssessmentDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  // Maturity scoring data based on OPAL framework (Crawl → Walk → Run → Fly)
  const maturityDimensions = {
    content: {
      score: 72,
      phase: 'Run',
      description: 'Content management and optimization capabilities',
      crawlScore: 85,
      walkScore: 78,
      runScore: 72,
      flyScore: 45,
      industryAvg: 68,
      strengths: ['Content audit processes', 'Performance tracking', 'Basic personalization'],
      gaps: ['Advanced AI-driven optimization', 'Real-time content decisioning', 'Cross-channel orchestration']
    },
    personalization: {
      score: 58,
      phase: 'Walk',
      description: 'Audience targeting and experience personalization',
      crawlScore: 92,
      walkScore: 58,
      runScore: 35,
      flyScore: 20,
      industryAvg: 64,
      strengths: ['Basic audience segmentation', 'Email personalization', 'Form optimization'],
      gaps: ['Machine learning models', 'Real-time behavioral targeting', 'Cross-device identity resolution']
    },
    experimentation: {
      score: 45,
      phase: 'Walk',
      description: 'A/B testing and optimization methodology',
      crawlScore: 88,
      walkScore: 45,
      runScore: 25,
      flyScore: 15,
      industryAvg: 52,
      strengths: ['Basic A/B testing setup', 'Conversion tracking', 'Statistical awareness'],
      gaps: ['Advanced statistical methods', 'Multi-variate testing', 'Automated experiment management']
    },
    technology: {
      score: 83,
      phase: 'Run',
      description: 'Technical infrastructure and integration readiness',
      crawlScore: 95,
      walkScore: 90,
      runScore: 83,
      flyScore: 62,
      industryAvg: 71,
      strengths: ['DXP integration', 'Data collection', 'API connectivity', 'Security compliance'],
      gaps: ['Real-time processing', 'Machine learning infrastructure', 'Edge computing capabilities']
    }
  };

  const overallScore = Math.round(Object.values(maturityDimensions).reduce((sum, dim) => sum + dim.score, 0) / 4);
  const industryOverallAvg = Math.round(Object.values(maturityDimensions).reduce((sum, dim) => sum + dim.industryAvg, 0) / 4);

  const getPhaseConfig = (score: number) => {
    if (score >= 80) return { phase: 'Fly', color: 'bg-purple-100 text-purple-800 border-purple-200', bgColor: 'bg-purple-50' };
    if (score >= 65) return { phase: 'Run', color: 'bg-green-100 text-green-800 border-green-200', bgColor: 'bg-green-50' };
    if (score >= 40) return { phase: 'Walk', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', bgColor: 'bg-yellow-50' };
    return { phase: 'Crawl', color: 'bg-red-100 text-red-800 border-red-200', bgColor: 'bg-red-50' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-purple-600';
    if (score >= 65) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentPhaseConfig = getPhaseConfig(overallScore);

  return (
    <div id="maturity-assessment-dashboard" className="space-y-6">
      {/* Current Maturity Score (Gauge Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Current Maturity Score
            </CardTitle>
            <CardDescription>
              Overall personalization and optimization readiness assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              {/* Circular Gauge */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    stroke={overallScore >= 80 ? '#8b5cf6' : overallScore >= 65 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - overallScore / 100)}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                    <div className="text-sm text-gray-600">out of 100</div>
                    <Badge className={`mt-2 ${currentPhaseConfig.color}`}>
                      {currentPhaseConfig.phase} Phase
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Indicators */}
            <div className="grid grid-cols-4 gap-2 mt-6">
              {[
                { name: 'Crawl', min: 0, max: 39, color: 'bg-red-100 text-red-800' },
                { name: 'Walk', min: 40, max: 64, color: 'bg-yellow-100 text-yellow-800' },
                { name: 'Run', min: 65, max: 79, color: 'bg-green-100 text-green-800' },
                { name: 'Fly', min: 80, max: 100, color: 'bg-purple-100 text-purple-800' }
              ].map((phase) => (
                <div key={phase.name} className="text-center">
                  <Badge
                    className={`text-xs ${overallScore >= phase.min && overallScore <= phase.max ? phase.color : 'bg-gray-100 text-gray-500'}`}
                  >
                    {phase.name}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">{phase.min}-{phase.max}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benchmark Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Industry Benchmark Comparison
            </CardTitle>
            <CardDescription>
              How your maturity score compares to industry averages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Comparison */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                    <div className="text-xs text-gray-600">Your Score</div>
                  </div>
                  <div className="text-2xl text-gray-400">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{industryOverallAvg}</div>
                    <div className="text-xs text-gray-600">Industry Avg</div>
                  </div>
                </div>
                <Badge
                  className={overallScore > industryOverallAvg ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                >
                  {overallScore > industryOverallAvg ? `+${overallScore - industryOverallAvg} points above average` : `${industryOverallAvg - overallScore} points below average`}
                </Badge>
              </div>

              {/* Dimension Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Dimension Performance vs Industry</h4>
                {Object.entries(maturityDimensions).map(([key, dimension]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{key}</span>
                      <div className="flex gap-2">
                        <span className={`font-medium ${getScoreColor(dimension.score)}`}>{dimension.score}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-gray-600">{dimension.industryAvg}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      {/* Your Score Bar */}
                      <div className="flex-1 bg-gray-200 rounded">
                        <div
                          className={`h-full rounded ${dimension.score >= 80 ? 'bg-purple-500' : dimension.score >= 65 ? 'bg-green-500' : dimension.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${dimension.score}%` }}
                        ></div>
                      </div>
                      {/* Industry Average Marker */}
                      <div className="relative w-1">
                        <div
                          className="absolute w-2 h-2 bg-gray-600 rounded-full transform -translate-x-1/2"
                          style={{ top: '0px' }}
                          title={`Industry Average: ${dimension.industryAvg}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimension Breakdown (Radar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Dimension Breakdown Analysis
          </CardTitle>
          <CardDescription>
            Detailed maturity assessment across all optimization capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Radar Chart Visualization */}
            <div className="flex items-center justify-center">
              <div className="relative w-80 h-80">
                <svg className="w-full h-full" viewBox="0 0 320 320">
                  {/* Grid circles */}
                  {[20, 40, 60, 80, 100].map((radius) => (
                    <circle
                      key={radius}
                      cx="160"
                      cy="160"
                      r={radius * 1.2}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Grid lines */}
                  {Object.keys(maturityDimensions).map((_, index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180);
                    const x2 = 160 + Math.cos(angle) * 120;
                    const y2 = 160 + Math.sin(angle) * 120;
                    return (
                      <line
                        key={index}
                        x1="160"
                        y1="160"
                        x2={x2}
                        y2={y2}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Data polygon */}
                  <polygon
                    points={Object.values(maturityDimensions).map((dimension, index) => {
                      const angle = (index * 90 - 90) * (Math.PI / 180);
                      const radius = (dimension.score / 100) * 120;
                      const x = 160 + Math.cos(angle) * radius;
                      const y = 160 + Math.sin(angle) * radius;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2"
                  />

                  {/* Data points */}
                  {Object.values(maturityDimensions).map((dimension, index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180);
                    const radius = (dimension.score / 100) * 120;
                    const x = 160 + Math.cos(angle) * radius;
                    const y = 160 + Math.sin(angle) * radius;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(59, 130, 246)"
                      />
                    );
                  })}

                  {/* Labels */}
                  {Object.entries(maturityDimensions).map(([key, dimension], index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180);
                    const labelRadius = 140;
                    const x = 160 + Math.cos(angle) * labelRadius;
                    const y = 160 + Math.sin(angle) * labelRadius;
                    return (
                      <text
                        key={key}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-gray-700"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </text>
                    );
                  })}

                  {/* Score labels */}
                  {Object.values(maturityDimensions).map((dimension, index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180);
                    const radius = (dimension.score / 100) * 120;
                    const x = 160 + Math.cos(angle) * (radius + 15);
                    const y = 160 + Math.sin(angle) * (radius + 15);
                    return (
                      <text
                        key={index}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-blue-600"
                      >
                        {dimension.score}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Dimension Details */}
            <div className="space-y-4">
              {Object.entries(maturityDimensions).map(([key, dimension]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{key}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPhaseConfig(dimension.score).color}>
                        {dimension.phase}
                      </Badge>
                      <span className={`font-bold ${getScoreColor(dimension.score)}`}>
                        {dimension.score}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{dimension.description}</p>

                  {/* Phase Progress */}
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {[
                      { name: 'Crawl', score: dimension.crawlScore },
                      { name: 'Walk', score: dimension.walkScore },
                      { name: 'Run', score: dimension.runScore },
                      { name: 'Fly', score: dimension.flyScore }
                    ].map((phase, index) => (
                      <div key={phase.name} className="text-center">
                        <div className="text-xs font-medium text-gray-600">{phase.name}</div>
                        <div className="h-2 bg-gray-200 rounded mt-1">
                          <div
                            className={`h-full rounded ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : index === 2 ? 'bg-green-500' : 'bg-purple-500'}`}
                            style={{ width: `${phase.score}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{phase.score}%</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-medium text-green-700 mb-1">Strengths</div>
                      <ul className="text-gray-600 space-y-1">
                        {dimension.strengths.slice(0, 2).map((strength, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-orange-700 mb-1">Priority Gaps</div>
                      <ul className="text-gray-600 space-y-1">
                        {dimension.gaps.slice(0, 2).map((gap, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              Readiness Summary
            </CardTitle>
            <CardDescription>
              Strategic assessment and next steps for optimization maturity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${currentPhaseConfig.bgColor} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={currentPhaseConfig.color}>
                    Current Phase: {currentPhaseConfig.phase}
                  </Badge>
                  <span className="text-sm text-gray-600">Score: {overallScore}/100</span>
                </div>
                <p className="text-sm text-gray-700">
                  {overallScore >= 80 ?
                    "Your organization demonstrates advanced optimization maturity with sophisticated AI-driven personalization and automated experimentation capabilities." :
                  overallScore >= 65 ?
                    "You have strong foundational capabilities with systematic processes. Focus on scaling automation and advancing ML-driven optimization." :
                  overallScore >= 40 ?
                    "Basic optimization processes are in place. Priority should be on systematizing approaches and building data-driven decision making." :
                    "Foundation building is required. Focus on establishing basic tracking, segmentation, and testing capabilities."}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Strategic Recommendations</h4>
                <div className="space-y-3">
                  {(overallScore >= 80 ? [
                    { title: "AI-First Optimization", description: "Implement advanced machine learning models for predictive personalization and automated optimization." },
                    { title: "Cross-Channel Orchestration", description: "Develop unified customer journey optimization across all touchpoints and channels." }
                  ] : overallScore >= 65 ? [
                    { title: "Automation & Scale", description: "Focus on automating manual processes and scaling successful optimization strategies." },
                    { title: "Advanced Analytics", description: "Implement predictive analytics and machine learning for deeper customer insights." }
                  ] : overallScore >= 40 ? [
                    { title: "Process Systematization", description: "Establish standardized processes for testing, personalization, and performance measurement." },
                    { title: "Data Infrastructure", description: "Strengthen data collection and integration capabilities across all customer touchpoints." }
                  ] : [
                    { title: "Foundation Building", description: "Establish basic analytics, audience segmentation, and A/B testing capabilities." },
                    { title: "Team & Training", description: "Build optimization expertise through training and hiring specialized talent." }
                  ]).map((rec, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{rec.title}</div>
                        <div className="text-sm text-gray-600">{rec.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Next Steps & Timeline
            </CardTitle>
            <CardDescription>
              Immediate actions and 90-day improvement roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3 text-green-700">Immediate Actions (Next 30 Days)</h4>
                <div className="space-y-2">
                  {[
                    "Audit current data collection and identify gaps in customer behavior tracking",
                    "Establish baseline metrics for all optimization dimensions",
                    "Prioritize highest-impact quick wins based on maturity assessment"
                  ].map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-blue-700">Medium-Term Goals (60-90 Days)</h4>
                <div className="space-y-2">
                  {[
                    "Implement systematic A/B testing process with proper statistical rigor",
                    "Launch basic personalization campaigns for high-value customer segments",
                    "Establish cross-functional optimization team and governance processes"
                  ].map((goal, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Maturity Improvement Target</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    +{Math.min(20, Math.max(5, 80 - overallScore))} points
                  </div>
                  <div className="text-xs text-blue-700">Expected improvement in 90 days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Phases Roadmap Dashboard with comprehensive phase planning and KPI tracking
function PhasesRoadmapDashboard({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  // OPAL Framework phases with detailed progression plan
  const phases = [
    {
      id: 'crawl',
      name: 'Crawl Phase',
      timeline: '0-3 months',
      status: 'completed',
      progress: 85,
      description: 'Foundation building - establish basic data collection, analytics, and segmentation capabilities',
      objectives: [
        'Implement comprehensive analytics and data collection infrastructure',
        'Establish baseline customer segmentation and basic audience targeting',
        'Set up fundamental A/B testing framework and statistical processes',
        'Create content audit processes and performance measurement systems'
      ],
      kpis: [
        { metric: 'Data Collection Completeness', target: '>90%', current: '87%', status: 'on-track' },
        { metric: 'Basic Segmentation Setup', target: '100%', current: '95%', status: 'excellent' },
        { metric: 'Analytics Implementation', target: '>85%', current: '92%', status: 'excellent' },
        { metric: 'Team Training Completion', target: '100%', current: '78%', status: 'needs-attention' }
      ],
      dependencies: [
        'IT infrastructure approval and deployment',
        'Data governance policies establishment',
        'Analytics team hiring and training completion'
      ],
      risks: [
        { risk: 'Data privacy compliance delays', impact: 'Medium', probability: 'Low', mitigation: 'Early legal review and GDPR compliance framework' },
        { risk: 'Team capacity constraints', impact: 'High', probability: 'Medium', mitigation: 'External consultant support and phased rollout' }
      ]
    },
    {
      id: 'walk',
      name: 'Walk Phase',
      timeline: '3-8 months',
      status: 'in-progress',
      progress: 45,
      description: 'Systematic optimization - implement structured testing, basic personalization, and automated processes',
      objectives: [
        'Deploy systematic A/B testing program with proper statistical rigor',
        'Launch basic personalization campaigns for high-value segments',
        'Implement automated content optimization and performance monitoring',
        'Establish cross-functional optimization team and governance processes'
      ],
      kpis: [
        { metric: 'A/B Test Velocity', target: '4+ tests/month', current: '2 tests/month', status: 'needs-attention' },
        { metric: 'Personalization Coverage', target: '>60%', current: '25%', status: 'behind' },
        { metric: 'Optimization Lift', target: '+15% conversion', current: '+8%', status: 'on-track' },
        { metric: 'Process Automation', target: '>70%', current: '40%', status: 'needs-attention' }
      ],
      dependencies: [
        'Crawl phase completion (>85% complete)',
        'Personalization platform integration',
        'Advanced analytics tool implementation'
      ],
      risks: [
        { risk: 'Testing program complexity', impact: 'Medium', probability: 'Medium', mitigation: 'Phased testing rollout with expert consultation' },
        { risk: 'Personalization platform integration', impact: 'High', probability: 'Low', mitigation: 'Dedicated integration team and vendor support' }
      ]
    },
    {
      id: 'run',
      name: 'Run Phase',
      timeline: '8-15 months',
      status: 'planned',
      progress: 15,
      description: 'Advanced optimization - machine learning models, sophisticated targeting, and automated decisioning',
      objectives: [
        'Implement machine learning models for predictive personalization',
        'Deploy real-time behavioral targeting and dynamic content optimization',
        'Establish advanced experimentation with multi-variate and sequential testing',
        'Create automated optimization workflows with minimal manual intervention'
      ],
      kpis: [
        { metric: 'ML Model Accuracy', target: '>85%', current: 'TBD', status: 'not-started' },
        { metric: 'Real-time Targeting', target: '<100ms response', current: 'TBD', status: 'not-started' },
        { metric: 'Automated Optimization', target: '>80% automated', current: '15%', status: 'planned' },
        { metric: 'Advanced Test Complexity', target: '8+ variants', current: '2-3 variants', status: 'planned' }
      ],
      dependencies: [
        'Walk phase completion (>70% complete)',
        'Machine learning infrastructure setup',
        'Advanced experimentation platform deployment',
        'Data science team expansion'
      ],
      risks: [
        { risk: 'ML model complexity', impact: 'High', probability: 'Medium', mitigation: 'External ML expertise and phased model deployment' },
        { risk: 'Real-time infrastructure scaling', impact: 'High', probability: 'Medium', mitigation: 'Cloud infrastructure investment and performance monitoring' }
      ]
    },
    {
      id: 'fly',
      name: 'Fly Phase',
      timeline: '15+ months',
      status: 'future',
      progress: 5,
      description: 'AI-first optimization - autonomous systems, cross-channel orchestration, and predictive optimization',
      objectives: [
        'Deploy autonomous AI-driven optimization with minimal human oversight',
        'Implement cross-channel journey optimization and unified customer experience',
        'Establish predictive optimization models that anticipate customer behavior',
        'Create self-learning systems that continuously improve without manual tuning'
      ],
      kpis: [
        { metric: 'AI Automation Level', target: '>95%', current: 'TBD', status: 'future' },
        { metric: 'Cross-channel Consistency', target: '>90%', current: 'TBD', status: 'future' },
        { metric: 'Predictive Accuracy', target: '>92%', current: 'TBD', status: 'future' },
        { metric: 'Self-optimization Rate', target: '>85%', current: 'TBD', status: 'future' }
      ],
      dependencies: [
        'Run phase completion (>80% complete)',
        'Advanced AI/ML infrastructure maturity',
        'Cross-channel data integration platform',
        'Organizational change management for AI-first approach'
      ],
      risks: [
        { risk: 'AI system complexity and governance', impact: 'Very High', probability: 'Medium', mitigation: 'AI ethics framework and progressive AI deployment' },
        { risk: 'Cross-channel technical integration', impact: 'High', probability: 'High', mitigation: 'Enterprise architecture review and integration roadmap' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'future': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getKPIStatus = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'on-track': return 'bg-blue-100 text-blue-800';
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800';
      case 'behind': return 'bg-red-100 text-red-800';
      case 'not-started': return 'bg-gray-100 text-gray-600';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'future': return 'bg-gray-50 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      case 'Very High': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div id="phases-roadmap-dashboard" className="space-y-6">
      {/* Phase Overview Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            OPAL Phase Progression Overview
          </CardTitle>
          <CardDescription>
            Four-stage optimization maturity journey: Crawl → Walk → Run → Fly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Visual Timeline */}
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                {phases.map((phase, index) => (
                  <div key={phase.id} className="flex flex-col items-center text-center flex-1">
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm ${
                      phase.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                      phase.status === 'in-progress' ? 'bg-blue-500 border-blue-500 text-white' :
                      phase.status === 'planned' ? 'bg-yellow-500 border-yellow-500 text-white' :
                      'bg-gray-300 border-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="mt-2">
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.name}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">{phase.timeline}</div>
                      <div className="text-xs font-medium mt-1">{phase.progress}% Complete</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-20 mt-2">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-full rounded-full ${
                            phase.progress >= 80 ? 'bg-green-500' :
                            phase.progress >= 40 ? 'bg-blue-500' :
                            phase.progress >= 20 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Connection Line */}
                    {index < phases.length - 1 && (
                      <div className="absolute top-6 left-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-300"
                           style={{
                             left: `${((index + 1) / phases.length) * 100}%`,
                             width: `${(1 / phases.length) * 100}%`,
                             zIndex: -1
                           }}>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Phase Highlight */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-blue-900">Current Focus: Walk Phase</h3>
                <Badge className="bg-blue-100 text-blue-800">45% Complete</Badge>
              </div>
              <p className="text-sm text-blue-800 mb-3">
                Implementing systematic optimization processes with structured testing and basic personalization campaigns
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">Priority:</span>
                  <span className="text-blue-700 ml-1">A/B Testing Program</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Timeline:</span>
                  <span className="text-blue-700 ml-1">3-8 months</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Next Milestone:</span>
                  <span className="text-blue-700 ml-1">60% Personalization Coverage</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Details Cards */}
      <div className="space-y-6">
        {phases.map((phase) => (
          <Card key={phase.id} className={`${phase.status === 'in-progress' ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    phase.status === 'completed' ? 'bg-green-500 text-white' :
                    phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                    phase.status === 'planned' ? 'bg-yellow-500 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {phases.findIndex(p => p.id === phase.id) + 1}
                  </div>
                  {phase.name}
                  <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{phase.progress}%</div>
                  <div className="text-sm text-gray-500">{phase.timeline}</div>
                </div>
              </div>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Objectives */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Key Objectives
                  </h4>
                  <div className="space-y-2">
                    {phase.objectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase KPIs */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    Phase KPIs
                  </h4>
                  <div className="space-y-3">
                    {phase.kpis.map((kpi, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{kpi.metric}</span>
                          <Badge className={`text-xs ${getKPIStatus(kpi.status)}`}>
                            {kpi.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Target: {kpi.target}</span>
                          <span className="font-medium">Current: {kpi.current}</span>
                        </div>
                        {kpi.current !== 'TBD' && (
                          <div className="mt-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full rounded-full ${getKPIStatus(kpi.status).includes('green') ? 'bg-green-500' :
                                  getKPIStatus(kpi.status).includes('blue') ? 'bg-blue-500' :
                                  getKPIStatus(kpi.status).includes('yellow') ? 'bg-yellow-500' :
                                  getKPIStatus(kpi.status).includes('red') ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                                style={{
                                  width: `${Math.min(100, parseInt(kpi.current.replace('%', '')) || 0)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dependencies & Risks */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dependencies */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600" />
                    Dependencies
                  </h4>
                  <div className="space-y-2">
                    {phase.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{dep}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Dependencies & Risks
                  </h4>
                  <div className="space-y-3">
                    {phase.risks.map((risk, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{risk.risk}</span>
                          <div className="flex gap-1">
                            <Badge className={`text-xs ${getRiskColor(risk.probability)}`}>
                              {risk.probability}
                            </Badge>
                            <Badge className={`text-xs ${getRiskColor(risk.impact)}`}>
                              {risk.impact}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase Transition Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Phase Transition Readiness Assessment
          </CardTitle>
          <CardDescription>
            Evaluation of readiness to advance to the next optimization phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Ready to Advance: Walk → Run Phase</h4>
              <div className="space-y-3">
                {[
                  { criterion: 'Walk Phase Completion', status: '45%', required: '>70%', ready: false },
                  { criterion: 'A/B Testing Velocity', status: '2/month', required: '4+/month', ready: false },
                  { criterion: 'Personalization Coverage', status: '25%', required: '>60%', ready: false },
                  { criterion: 'Team Capability Maturity', status: '65%', required: '>80%', ready: false }
                ].map((criterion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-sm">{criterion.criterion}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{criterion.status}</span>
                      <Badge className={criterion.ready ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {criterion.ready ? 'Ready' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-900">Estimated Timeline to Run Phase</div>
                  <div className="text-2xl font-bold text-orange-600 mt-1">4-6 months</div>
                  <div className="text-xs text-orange-700">Based on current progress trajectory</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Next Phase Preparation Actions</h4>
              <div className="space-y-2">
                {[
                  'Accelerate A/B testing program to meet 4+ tests per month target',
                  'Expand personalization coverage to 60% of high-value customer touchpoints',
                  'Complete advanced analytics platform integration and ML infrastructure setup',
                  'Build data science team capability through hiring and training initiatives',
                  'Establish governance framework for advanced experimentation and AI deployment'
                ].map((action, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Roadmap View component leveraging Roadmap Generator Agent capabilities
function EnhancedRoadmapView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="enhanced-roadmap-view" className="space-y-6">
      {/* Timeline Visualization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Strategic Implementation Roadmap
          </CardTitle>
          <CardDescription>12-month phased implementation timeline with milestones and dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Phase Timeline */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { phase: 'Crawl', months: '0-3', color: 'bg-gray-100 text-gray-800', initiatives: 8 },
                { phase: 'Walk', months: '3-8', color: 'bg-blue-100 text-blue-800', initiatives: 12 },
                { phase: 'Run', months: '8-15', color: 'bg-green-100 text-green-800', initiatives: 9 },
                { phase: 'Fly', months: '15+', color: 'bg-purple-100 text-purple-800', initiatives: 6 }
              ].map((phase, index) => (
                <div key={phase.phase} className="text-center">
                  <div className={`${phase.color} rounded-lg p-4 mb-2`}>
                    <div className="text-2xl font-bold">{phase.phase}</div>
                    <div className="text-sm opacity-75">Months {phase.months}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{phase.initiatives} initiatives</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>23% Complete</span>
              </div>
              <Progress value={23} className="h-3" />
              <div className="text-xs text-muted-foreground">
                Foundation phase: 3 of 8 initiatives completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Next 90 Days - Critical Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  milestone: 'Customer Data Platform Integration',
                  date: 'Dec 15, 2024',
                  status: 'in_progress',
                  progress: 67,
                  owner: 'Data Team',
                  blockers: []
                },
                {
                  milestone: 'Quick Wins Portfolio Launch',
                  date: 'Jan 8, 2025',
                  status: 'planned',
                  progress: 0,
                  owner: 'Marketing Team',
                  blockers: ['Data integration dependency']
                },
                {
                  milestone: 'Content Personalization Engine',
                  date: 'Feb 12, 2025',
                  status: 'planned',
                  progress: 0,
                  owner: 'Dev Team',
                  blockers: []
                }
              ].map((milestone, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{milestone.milestone}</h4>
                    <Badge variant={milestone.status === 'in_progress' ? 'default' : 'secondary'}>
                      {milestone.status === 'in_progress' ? 'In Progress' : 'Planned'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Target: {milestone.date}</span>
                      <span>Owner: {milestone.owner}</span>
                    </div>
                    <Progress value={milestone.progress} className="h-2" />
                    {milestone.blockers.length > 0 && (
                      <div className="text-xs text-orange-600">
                        Blockers: {milestone.blockers.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Resource Allocation & Team Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <div className="text-sm text-blue-700">Core Team Members</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$180K</div>
                  <div className="text-sm text-green-700">Annual Budget</div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { role: 'Personalization Manager', allocation: '100%', phase: 'All phases' },
                  { role: 'Data Analyst', allocation: '75%', phase: 'Months 1-12' },
                  { role: 'Frontend Developer', allocation: '50%', phase: 'Implementation phases' },
                  { role: 'UX Designer', allocation: '25%', phase: 'Crawl & Walk phases' }
                ].map((resource, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{resource.role}</div>
                      <div className="text-xs text-muted-foreground">{resource.phase}</div>
                    </div>
                    <Badge variant="outline">{resource.allocation}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Sequence & Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-orange-600" />
            Implementation Sequence & Dependencies
          </CardTitle>
          <CardDescription>Critical path analysis and dependency mapping</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Critical Path */}
            <div>
              <h4 className="font-medium mb-3">Critical Path Dependencies</h4>
              <div className="space-y-2">
                {[
                  { from: 'Data Infrastructure', to: 'Customer Segmentation', buffer: '2 weeks' },
                  { from: 'Customer Segmentation', to: 'Content Personalization', buffer: '1 week' },
                  { from: 'Content Personalization', to: 'A/B Testing Framework', buffer: '3 weeks' },
                  { from: 'A/B Testing Framework', to: 'Advanced ML Models', buffer: '4 weeks' }
                ].map((dep, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{dep.from}</span>
                      <ArrowRight className="h-4 w-4 inline mx-2 text-muted-foreground" />
                      <span className="font-medium">{dep.to}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">Buffer: {dep.buffer}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <h4 className="font-medium mb-3">Implementation Risks & Mitigations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    risk: 'ODP Integration Complexity',
                    probability: 'Medium',
                    impact: 'High',
                    mitigation: 'Parallel development with mock data, dedicated integration sprint'
                  },
                  {
                    risk: 'Resource Availability',
                    probability: 'Low',
                    impact: 'Medium',
                    mitigation: 'Cross-training team members, contractor backup plan'
                  }
                ].map((risk, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">{risk.risk}</h5>
                      <div className="flex gap-1">
                        <Badge variant={risk.probability === 'High' ? 'destructive' : risk.probability === 'Medium' ? 'default' : 'secondary'} className="text-xs">
                          {risk.probability}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Phase Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { phase: 'Crawl', metric: 'Data Collection Completeness', target: '>90%', current: '67%' },
                { phase: 'Walk', metric: 'Personalization Coverage', target: '>80%', current: '0%' },
                { phase: 'Run', metric: 'ML Model Accuracy', target: '>85%', current: 'TBD' }
              ].map((metric, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{metric.phase}: {metric.metric}</span>
                    <span>{metric.current}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {metric.target}</span>
                  </div>
                  <Progress
                    value={metric.current === 'TBD' ? 0 : metric.current === '0%' ? 0 : parseInt(metric.current)}
                    className="h-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Business Impact Projections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">+25%</div>
                <div className="text-sm text-green-700">Revenue per Session</div>
                <div className="text-xs text-muted-foreground">By Month 12</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Customer Engagement</span>
                  <span className="text-green-600">+40%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate</span>
                  <span className="text-green-600">+18%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Member Retention</span>
                  <span className="text-green-600">+22%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Implementation Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">87%</div>
                <div className="text-sm text-blue-700">Roadmap Health Score</div>
                <div className="text-xs text-muted-foreground">On track</div>
              </div>

              <div className="space-y-2">
                {[
                  { area: 'Timeline Adherence', score: 92 },
                  { area: 'Resource Utilization', score: 85 },
                  { area: 'Dependency Management', score: 89 },
                  { area: 'Risk Mitigation', score: 81 }
                ].map((health, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{health.area}</span>
                      <span>{health.score}%</span>
                    </div>
                    <Progress value={health.score} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Points with DXP Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            DXP Tool Integration Timeline
          </CardTitle>
          <CardDescription>Optimizely DXP tools integration schedule and readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                tool: 'ODP (Data Platform)',
                phase: 'Crawl',
                month: 'Month 1',
                status: 'in_progress',
                readiness: 78,
                integration: 'Customer data unification and segmentation'
              },
              {
                tool: 'Content Recs',
                phase: 'Walk',
                month: 'Month 4',
                status: 'planned',
                readiness: 45,
                integration: 'Dynamic content recommendations engine'
              },
              {
                tool: 'WEBX (Experimentation)',
                phase: 'Walk',
                month: 'Month 5',
                status: 'planned',
                readiness: 62,
                integration: 'A/B testing framework and statistical analysis'
              },
              {
                tool: 'CMP (Campaign Management)',
                phase: 'Run',
                month: 'Month 8',
                status: 'future',
                readiness: 34,
                integration: 'Cross-channel campaign orchestration'
              }
            ].map((integration, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium">{integration.tool}</h5>
                    <Badge className={phaseConfig[integration.phase.toLowerCase() as keyof typeof phaseConfig]?.color}>
                      {integration.phase}
                    </Badge>
                    <Badge variant="outline">{integration.month}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.integration}</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{integration.readiness}%</div>
                  <div className="text-xs text-muted-foreground">Ready</div>
                  <Progress value={integration.readiness} className="h-1 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Customer Experience View component leveraging Customer Journey Agent capabilities
function EnhancedCustomerExperienceView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="enhanced-customer-experience-view" className="space-y-6">
      {/* Journey Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            Customer Journey Overview
          </CardTitle>
          <CardDescription>Complete member lifecycle journey from awareness to advocacy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Journey Stages Flow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {[
                { stage: 'Awareness', conversion: '18%', duration: '2.3 weeks', color: 'bg-blue-500' },
                { stage: 'Consideration', conversion: '34%', duration: '4.2 weeks', color: 'bg-indigo-500' },
                { stage: 'Conversion', conversion: '23%', duration: '2.1 days', color: 'bg-green-500' },
                { stage: 'Onboarding', conversion: '89%', duration: '3.5 weeks', color: 'bg-orange-500' },
                { stage: 'Engagement', conversion: '76%', duration: 'Ongoing', color: 'bg-purple-500' },
                { stage: 'Advocacy', conversion: '42%', duration: 'Ongoing', color: 'bg-pink-500' }
              ].map((stage, index) => (
                <div key={stage.stage} className="flex-none">
                  <div className="flex items-center">
                    <div className="text-center">
                      <div className={`${stage.color} text-white rounded-lg p-3 mb-2 min-w-[120px]`}>
                        <div className="font-bold text-sm">{stage.stage}</div>
                        <div className="text-xs opacity-90">{stage.conversion} convert</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{stage.duration}</div>
                    </div>
                    {index < 5 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Journey Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">4.2%</div>
                <div className="text-sm text-blue-700">End-to-End Conversion</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">8.3</div>
                <div className="text-sm text-green-700">Avg Journey (weeks)</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">6.8</div>
                <div className="text-sm text-purple-700">Customer Effort Score</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">72</div>
                <div className="text-sm text-orange-700">Net Promoter Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drop-Off Points Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Critical Drop-Off Points
            </CardTitle>
            <CardDescription>High-impact areas where customers abandon the journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  location: 'Membership Registration Form',
                  dropOffRate: '34%',
                  impact: 'High',
                  causes: ['Form too long (23 fields)', 'Payment info requested early', 'Unclear tier differences'],
                  devicePattern: 'Mobile: 52%, Desktop: 28%'
                },
                {
                  location: 'Homepage Initial Visit',
                  dropOffRate: '67%',
                  impact: 'Critical',
                  causes: ['Unclear value proposition', 'Information overload', 'Mobile optimization issues'],
                  devicePattern: 'Mobile: 72%, Desktop: 58%'
                },
                {
                  location: 'Pricing Page',
                  dropOffRate: '45%',
                  impact: 'Medium',
                  causes: ['Pricing complexity', 'Unclear ROI for small operations', 'Payment terms confusion'],
                  devicePattern: 'Small retailers: 65%, Enterprise: 32%'
                }
              ].map((dropOff, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-red-900">{dropOff.location}</h5>
                    <div className="flex gap-2">
                      <Badge variant="destructive" className="text-xs">{dropOff.dropOffRate}</Badge>
                      <Badge variant={dropOff.impact === 'Critical' ? 'destructive' : dropOff.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                        {dropOff.impact}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-red-800">
                      <span className="font-medium">Primary causes:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {dropOff.causes.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs text-red-700">
                      <span className="font-medium">Pattern:</span> {dropOff.devicePattern}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              Experience Optimization Opportunities
            </CardTitle>
            <CardDescription>Immediate and strategic improvements to reduce friction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: 'Immediate',
                  optimization: 'Mobile Registration Simplification',
                  expectedImpact: '+18% conversion improvement',
                  timeline: '4-6 weeks',
                  effort: 'Medium',
                  approach: 'Multi-step wizard with progress indicators'
                },
                {
                  type: 'Strategic',
                  optimization: 'Personalized Onboarding Journey',
                  expectedImpact: '-40% time to value',
                  timeline: '8-12 weeks',
                  effort: 'High',
                  approach: 'Segment-specific welcome sequences'
                },
                {
                  type: 'Quick Win',
                  optimization: 'Homepage Value Proposition Clarity',
                  expectedImpact: '+12% engagement',
                  timeline: '2-3 weeks',
                  effort: 'Low',
                  approach: 'Simplified messaging and clear CTAs'
                }
              ].map((opt, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={opt.type === 'Immediate' ? 'default' : opt.type === 'Strategic' ? 'secondary' : 'outline'} className="text-xs">
                        {opt.type}
                      </Badge>
                      <h5 className="font-medium text-sm">{opt.optimization}</h5>
                    </div>
                    <Badge variant="outline" className="text-xs">{opt.timeline}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-green-600 font-medium">{opt.expectedImpact}</div>
                    <div className="text-xs text-muted-foreground">{opt.approach}</div>
                    <div className="text-xs text-gray-500">Effort: {opt.effort}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Touchpoint Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Key Touchpoint Performance
          </CardTitle>
          <CardDescription>Analysis of critical customer interaction points across channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                touchpoint: 'Organic Search Discovery',
                channel: 'Search Engine',
                traffic: '12.5K monthly',
                engagement: '23%',
                bounceRate: '67%',
                deviceSplit: { mobile: 65, desktop: 30, tablet: 5 },
                painPoints: ['Mobile results lack clear value prop', 'Landing page not optimized for industry terms']
              },
              {
                touchpoint: 'Resource Library Access',
                channel: 'Website',
                traffic: '8.2K monthly',
                engagement: '67%',
                bounceRate: '23%',
                deviceSplit: { mobile: 45, desktop: 50, tablet: 5 },
                painPoints: ['Search functionality limited', 'Categories not intuitive']
              },
              {
                touchpoint: 'Webinar Registration',
                channel: 'Email/Social',
                traffic: '3.1K monthly',
                engagement: '89%',
                bounceRate: '8%',
                deviceSplit: { mobile: 38, desktop: 58, tablet: 4 },
                painPoints: ['Registration form auto-fill issues', 'Calendar integration missing']
              }
            ].map((touchpoint, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="mb-3">
                  <h5 className="font-medium text-sm mb-1">{touchpoint.touchpoint}</h5>
                  <Badge variant="outline" className="text-xs">{touchpoint.channel}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Traffic:</span>
                      <div className="font-medium">{touchpoint.traffic}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement:</span>
                      <div className="font-medium text-green-600">{touchpoint.engagement}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Device Usage:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Mobile</span>
                        <span>{touchpoint.deviceSplit.mobile}%</span>
                      </div>
                      <Progress value={touchpoint.deviceSplit.mobile} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>Desktop</span>
                        <span>{touchpoint.deviceSplit.desktop}%</span>
                      </div>
                      <Progress value={touchpoint.deviceSplit.desktop} className="h-1" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Pain Points:</div>
                    <ul className="text-xs space-y-0.5">
                      {touchpoint.painPoints.map((pain, i) => (
                        <li key={i} className="text-orange-600">• {pain}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Channel Journey Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            Cross-Channel Journey Patterns
          </CardTitle>
          <CardDescription>How customers move between channels and devices during their journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Channel Transitions */}
            <div>
              <h4 className="font-medium mb-3">Popular Channel Transitions</h4>
              <div className="space-y-3">
                {[
                  { from: 'Social Media (LinkedIn)', to: 'Website Homepage', rate: '34%', path: 'LinkedIn post → Homepage → Resource library → Contact form' },
                  { from: 'Email Campaign', to: 'Resource Library', rate: '67%', path: 'Email link → Direct resource access → Related resources → Registration' },
                  { from: 'Trade Publication', to: 'Website Search', rate: '23%', path: 'Article mention → Search → Category browse → Membership inquiry' }
                ].map((transition, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-sm">{transition.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{transition.to}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{transition.rate}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Switching Patterns */}
            <div>
              <h4 className="font-medium mb-3">Device Switching Behavior</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Mobile Discovery → Desktop Conversion</h5>
                  <div className="text-2xl font-bold text-blue-600 mb-1">43%</div>
                  <div className="text-sm text-blue-700 mb-2">of conversions follow this pattern</div>
                  <div className="text-xs text-blue-600">
                    Implication: Need mobile-to-desktop experience continuity
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Single-Device Journey</h5>
                  <div className="text-2xl font-bold text-green-600 mb-1">57%</div>
                  <div className="text-sm text-green-700 mb-2">complete journey on one device</div>
                  <div className="text-xs text-green-600">
                    Implication: Each device experience must be complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona-Specific Journey Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Persona Journey Differences
          </CardTitle>
          <CardDescription>How different customer segments experience the journey differently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                persona: 'Premium Produce Buyer',
                characteristics: {
                  preferredChannels: ['Direct website access', 'Industry referrals'],
                  decisionTimeline: 'Faster (3-4 weeks average)',
                  contentPreferences: ['Technical specifications', 'ROI case studies', 'Peer testimonials'],
                  conversionTriggers: ['Bulk purchasing opportunities', 'Quality certifications', 'Supply chain reliability']
                },
                journeyMetrics: {
                  conversionRate: '8.2%',
                  avgJourneyTime: '3.4 weeks',
                  touchpointsToConversion: '5.2',
                  lifetimeValue: '$12,400'
                }
              },
              {
                persona: 'Small Independent Retailer',
                characteristics: {
                  preferredChannels: ['Social media discovery', 'Peer recommendations'],
                  decisionTimeline: 'Longer (6-8 weeks average)',
                  contentPreferences: ['Cost-benefit analysis', 'Small business case studies', 'Implementation guides'],
                  conversionTriggers: ['Affordable pricing tiers', 'Easy implementation', 'Community support']
                },
                journeyMetrics: {
                  conversionRate: '2.8%',
                  avgJourneyTime: '6.7 weeks',
                  touchpointsToConversion: '8.4',
                  lifetimeValue: '$3,200'
                }
              }
            ].map((persona, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h5 className="font-medium text-lg mb-3 text-orange-700">{persona.persona}</h5>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(persona.journeyMetrics).map(([metric, value]) => (
                      <div key={metric} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Preferred Channels:</span>
                      <div className="text-sm">{persona.characteristics.preferredChannels.join(', ')}</div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Decision Timeline:</span>
                      <div className="text-sm">{persona.characteristics.decisionTimeline}</div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Key Conversion Triggers:</span>
                      <ul className="text-sm space-y-0.5 mt-1">
                        {persona.characteristics.conversionTriggers.map((trigger, i) => (
                          <li key={i}>• {trigger}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Content Optimization View component
function ContentOptimizationView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="content-optimization-view" className="space-y-6">
      {/* Content Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Engagement</p>
                <p className="text-2xl font-bold">87%</p>
                <Badge className={phaseConfig.run.color}>Strong Performance</Badge>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Load Speed</p>
                <p className="text-2xl font-bold">1.8s</p>
                <Badge className={phaseConfig.walk.color}>Needs Improvement</Badge>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Freshness</p>
                <p className="text-2xl font-bold">92%</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SEO Score</p>
                <p className="text-2xl font-bold">85/100</p>
                <Badge className={phaseConfig.run.color}>Good</Badge>
              </div>
              <Search className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Content Audit Results
            </CardTitle>
            <CardDescription>Comprehensive analysis of content effectiveness and optimization opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'High-Performing Content', count: 34, engagement: '94%', color: 'text-green-600 bg-green-50' },
                { category: 'Needs Optimization', count: 18, engagement: '67%', color: 'text-yellow-600 bg-yellow-50' },
                { category: 'Low Performance', count: 7, engagement: '23%', color: 'text-red-600 bg-red-50' },
                { category: 'Outdated Content', count: 12, engagement: '31%', color: 'text-gray-600 bg-gray-50' }
              ].map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${item.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{item.category}</span>
                    <Badge variant="outline">{item.count} pages</Badge>
                  </div>
                  <div className="text-xs mt-2">Average Engagement: {item.engagement}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Content Performance Trends
            </CardTitle>
            <CardDescription>Engagement patterns and content consumption analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h6 className="font-medium text-sm text-blue-900">Peak Engagement Times</h6>
                <div className="text-xs text-blue-700 mt-1">Tuesday-Thursday 10AM-2PM EST (+47% engagement)</div>
                <Progress value={89} className="h-2 mt-2" />
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <h6 className="font-medium text-sm text-green-900">Top Content Types</h6>
                <div className="text-xs text-green-700 mt-1">How-to guides (8.3 min), Industry reports (6.7 min)</div>
                <Progress value={76} className="h-2 mt-2" />
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border">
                <h6 className="font-medium text-sm text-purple-900">Mobile Optimization</h6>
                <div className="text-xs text-purple-700 mt-1">68% mobile traffic, 3.2s avg load time</div>
                <Progress value={68} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Optimization Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Content Optimization Roadmap
          </CardTitle>
          <CardDescription>Prioritized recommendations for content improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500">
              <h6 className="font-medium text-red-900 mb-2">Immediate (Week 1-2)</h6>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Fix 7 low-performing landing pages</li>
                <li>• Update 12 outdated product descriptions</li>
                <li>• Implement mobile-first design improvements</li>
                <li>• Add structured data markup for SEO</li>
              </ul>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-yellow-500">
              <h6 className="font-medium text-yellow-900 mb-2">Short-term (Month 1-2)</h6>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Launch content personalization for member segments</li>
                <li>• Implement dynamic content recommendations</li>
                <li>• Create mobile-optimized content templates</li>
                <li>• Set up automated content performance monitoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Experimentation View component
function ExperimentationView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="experimentation-view" className="space-y-6">
      {/* Experimentation KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tests</p>
                <p className="text-2xl font-bold">12</p>
                <Badge className={phaseConfig.run.color}>Running</Badge>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Velocity</p>
                <p className="text-2xl font-bold">8/mo</p>
                <Badge className={phaseConfig.walk.color}>Moderate</Badge>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">34%</p>
                <Badge className={phaseConfig.run.color}>Above Industry</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statistical Power</p>
                <p className="text-2xl font-bold">89%</p>
                <Badge className={phaseConfig.run.color}>Strong</Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Portfolio Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Active Test Portfolio
            </CardTitle>
            <CardDescription>Current running experiments and their performance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Homepage Hero Optimization', status: 'Running', progress: 73, lift: '+12%', confidence: '94%' },
                { name: 'Checkout Flow Simplification', status: 'Analysis', progress: 95, lift: '+8%', confidence: '89%' },
                { name: 'Product Page Layout Test', status: 'Running', progress: 45, lift: '+3%', confidence: '67%' },
                { name: 'Email Subject Line A/B', status: 'Running', progress: 82, lift: '+18%', confidence: '96%' }
              ].map((test, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-medium text-sm">{test.name}</h6>
                    <Badge variant={test.status === 'Running' ? 'default' : 'secondary'}>{test.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>Progress: {test.progress}%</div>
                    <div>Lift: {test.lift}</div>
                    <div>Confidence: {test.confidence}</div>
                  </div>
                  <Progress value={test.progress} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Experimentation Impact
            </CardTitle>
            <CardDescription>Quantified business impact from completed tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border">
                <h6 className="font-medium text-sm text-green-900">Revenue Impact (YTD)</h6>
                <div className="text-2xl font-bold text-green-800 mt-1">+$847K</div>
                <div className="text-xs text-green-600">From 23 winning experiments</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h6 className="font-medium text-sm text-blue-900">Conversion Rate Improvement</h6>
                <div className="text-2xl font-bold text-blue-800 mt-1">+2.3%</div>
                <div className="text-xs text-blue-600">Average across all winning tests</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border">
                <h6 className="font-medium text-sm text-purple-900">Learning Velocity</h6>
                <div className="text-2xl font-bold text-purple-800 mt-1">96 tests</div>
                <div className="text-xs text-purple-600">Completed in the last 12 months</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Planning & Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Experimentation Roadmap
          </CardTitle>
          <CardDescription>Upcoming test priorities and experimental hypotheses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Q1 Priority Tests</h6>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Mobile checkout optimization</li>
                <li>• Personalized product recommendations</li>
                <li>• Newsletter signup flow</li>
                <li>• Search results relevance</li>
              </ul>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Q2 Advanced Tests</h6>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• AI-powered content personalization</li>
                <li>• Dynamic pricing experiments</li>
                <li>• Cross-channel attribution</li>
                <li>• Member onboarding flow</li>
              </ul>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Innovation Pipeline</h6>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Voice search optimization</li>
                <li>• AR product visualization</li>
                <li>• Predictive customer journeys</li>
                <li>• Behavioral micro-targeting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Personalization View component
function PersonalizationView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="personalization-view" className="space-y-6">
      {/* Personalization KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personalization Coverage</p>
                <p className="text-2xl font-bold">78%</p>
                <Badge className={phaseConfig.run.color}>Good Reach</Badge>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Lift</p>
                <p className="text-2xl font-bold">+24%</p>
                <Badge className={phaseConfig.run.color}>Strong Impact</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Segment Accuracy</p>
                <p className="text-2xl font-bold">91%</p>
                <Badge className={phaseConfig.run.color}>High Precision</Badge>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Real-time Processing</p>
                <p className="text-2xl font-bold">142ms</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Active Audience Segments
            </CardTitle>
            <CardDescription>Customer segments and their personalization performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { segment: 'Premium Produce Buyers', size: '23%', engagement: 94, revenue: '$2.1M', growth: '+18%' },
                { segment: 'Small Independent Retailers', size: '34%', engagement: 76, revenue: '$1.8M', growth: '+12%' },
                { segment: 'Food Service Operators', size: '19%', engagement: 88, revenue: '$3.2M', growth: '+22%' },
                { segment: 'New Members', size: '24%', engagement: 62, revenue: '$890K', growth: '+8%' }
              ].map((segment, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-medium text-sm">{segment.segment}</h6>
                    <Badge variant="outline">{segment.size} of traffic</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>Engagement: {segment.engagement}%</div>
                    <div>Revenue: {segment.revenue}</div>
                    <div>Growth: {segment.growth}</div>
                  </div>
                  <Progress value={segment.engagement} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Personalization Engine Health
            </CardTitle>
            <CardDescription>AI model performance and optimization metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h6 className="font-medium text-sm text-blue-900">Content Recommendation Model</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 mt-1">
                  <div>Accuracy: 89.3%</div>
                  <div>CTR: 8.7%</div>
                  <div>Coverage: 94.2%</div>
                  <div>Freshness: 96.1%</div>
                </div>
                <Progress value={89} className="h-1 mt-2" />
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <h6 className="font-medium text-sm text-green-900">Behavioral Prediction Model</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-700 mt-1">
                  <div>Precision: 91.7%</div>
                  <div>Recall: 87.4%</div>
                  <div>F1 Score: 89.5%</div>
                  <div>Latency: 38ms</div>
                </div>
                <Progress value={92} className="h-1 mt-2" />
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border">
                <h6 className="font-medium text-sm text-purple-900">Segmentation Engine</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-700 mt-1">
                  <div>Segments: 47 active</div>
                  <div>Overlap: &lt;15%</div>
                  <div>Stability: 94.3%</div>
                  <div>Update Freq: Daily</div>
                </div>
                <Progress value={94} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            Advanced Personalization Roadmap
          </CardTitle>
          <CardDescription>Next-generation personalization capabilities and AI enhancements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Enhanced Targeting</h6>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Micro-moment personalization</li>
                <li>• Cross-device identity resolution</li>
                <li>• Predictive customer lifetime value</li>
                <li>• Real-time intent detection</li>
              </ul>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">AI-Powered Features</h6>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Natural language content generation</li>
                <li>• Automated A/B test creation</li>
                <li>• Dynamic pricing optimization</li>
                <li>• Intelligent customer journey orchestration</li>
              </ul>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Next-Gen Capabilities</h6>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Conversational AI recommendations</li>
                <li>• Augmented reality product visualization</li>
                <li>• Voice-activated personalization</li>
                <li>• Predictive supply chain personalization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// User Experience View component
function UserExperienceView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="user-experience-view" className="space-y-6">
      {/* UX Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                <p className="text-2xl font-bold">4.3/5</p>
                <Badge className={phaseConfig.run.color}>Above Average</Badge>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Task Success Rate</p>
                <p className="text-2xl font-bold">89%</p>
                <Badge className={phaseConfig.run.color}>Strong</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Load Time</p>
                <p className="text-2xl font-bold">2.1s</p>
                <Badge className={phaseConfig.walk.color}>Needs Improvement</Badge>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accessibility Score</p>
                <p className="text-2xl font-bold">92/100</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Journey Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-600" />
              User Journey Flow Analysis
            </CardTitle>
            <CardDescription>Critical path analysis and conversion funnel insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 'Landing Page', users: 10000, conversion: 78, dropoff: 22, issues: 'Mobile layout, slow load' },
                { step: 'Product Browse', users: 7800, conversion: 64, dropoff: 36, issues: 'Search relevance' },
                { step: 'Product Details', users: 4992, conversion: 82, dropoff: 18, issues: 'Missing info, images' },
                { step: 'Add to Cart', users: 4093, conversion: 71, dropoff: 29, issues: 'Pricing clarity' },
                { step: 'Checkout', users: 2906, conversion: 89, dropoff: 11, issues: 'Form complexity' }
              ].map((step, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-medium text-sm">{step.step}</h6>
                    <Badge variant={step.conversion > 80 ? 'default' : step.conversion > 65 ? 'secondary' : 'destructive'}>
                      {step.conversion}% convert
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>Users: {step.users.toLocaleString()}</div>
                    <div>Drop-off: {step.dropoff}%</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Issues: {step.issues}</div>
                  <Progress value={step.conversion} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-600" />
              Device Experience Analysis
            </CardTitle>
            <CardDescription>Cross-device usability and performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h6 className="font-medium text-sm text-blue-900">Mobile Experience (68% traffic)</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 mt-1">
                  <div>Load Time: 2.8s</div>
                  <div>Satisfaction: 4.1/5</div>
                  <div>Task Success: 84%</div>
                  <div>Bounce Rate: 34%</div>
                </div>
                <Progress value={84} className="h-1 mt-2" />
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <h6 className="font-medium text-sm text-green-900">Desktop Experience (28% traffic)</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-700 mt-1">
                  <div>Load Time: 1.4s</div>
                  <div>Satisfaction: 4.6/5</div>
                  <div>Task Success: 94%</div>
                  <div>Bounce Rate: 18%</div>
                </div>
                <Progress value={94} className="h-1 mt-2" />
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border">
                <h6 className="font-medium text-sm text-purple-900">Tablet Experience (4% traffic)</h6>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-700 mt-1">
                  <div>Load Time: 1.9s</div>
                  <div>Satisfaction: 4.4/5</div>
                  <div>Task Success: 91%</div>
                  <div>Bounce Rate: 22%</div>
                </div>
                <Progress value={91} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UX Improvement Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-orange-600" />
            User Experience Optimization Roadmap
          </CardTitle>
          <CardDescription>Prioritized UX improvements to enhance customer experience and conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500">
              <h6 className="font-medium text-red-900 mb-2">Critical Fixes (Week 1-2)</h6>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Mobile checkout form optimization</li>
                <li>• Page load speed improvements</li>
                <li>• Search results relevance tuning</li>
                <li>• Error message clarity enhancement</li>
              </ul>
              <div className="text-xs text-red-600 mt-2">Impact: +12% conversion</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-500">
              <h6 className="font-medium text-yellow-900 mb-2">UX Enhancements (Month 1-2)</h6>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Personalized navigation menus</li>
                <li>• Progressive web app capabilities</li>
                <li>• Advanced search with filters</li>
                <li>• Streamlined member onboarding</li>
              </ul>
              <div className="text-xs text-yellow-600 mt-2">Impact: +8% engagement</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Innovation Features (Quarter 2+)</h6>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Voice search capabilities</li>
                <li>• AR product visualization</li>
                <li>• Predictive user assistance</li>
                <li>• Omnichannel experience sync</li>
              </ul>
              <div className="text-xs text-blue-600 mt-2">Impact: +15% satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Technology View component leveraging Integration Health Agent capabilities
function EnhancedTechnologyView({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="enhanced-technology-view" className="space-y-6">
      {/* DXP Tool Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Optimizely DXP Tool Health Dashboard
          </CardTitle>
          <CardDescription>Real-time monitoring and performance analysis of all DXP platform components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Health Score */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="text-3xl font-bold text-green-600 mb-1">87%</div>
              <div className="text-sm text-green-700 mb-2">Overall DXP Health Score</div>
              <Badge className="bg-green-100 text-green-800">Healthy - Ready for Scale</Badge>
            </div>

            {/* DXP Component Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  component: 'Content Recommendations',
                  health: 92,
                  status: 'Excellent',
                  availability: '99.7%',
                  responseTime: '145ms',
                  lastIncident: 'None (14 days)',
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                  borderColor: 'border-green-200'
                },
                {
                  component: 'Web Experimentation (WEBX)',
                  health: 84,
                  status: 'Good',
                  availability: '98.9%',
                  responseTime: '89ms',
                  lastIncident: '3 hours ago',
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50',
                  borderColor: 'border-orange-200'
                },
                {
                  component: 'Data Platform (ODP)',
                  health: 89,
                  status: 'Healthy',
                  availability: '99.2%',
                  responseTime: '234ms',
                  lastIncident: 'None (7 days)',
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200'
                },
                {
                  component: 'CMS Platform',
                  health: 91,
                  status: 'Excellent',
                  availability: '99.8%',
                  responseTime: '112ms',
                  lastIncident: 'None (21 days)',
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                  borderColor: 'border-green-200'
                },
                {
                  component: 'Campaign Management (CMP)',
                  health: 78,
                  status: 'Warning',
                  availability: '97.3%',
                  responseTime: '456ms',
                  lastIncident: '2 days ago',
                  color: 'text-red-600',
                  bgColor: 'bg-red-50',
                  borderColor: 'border-red-200'
                }
              ].map((tool, index) => (
                <div key={index} className={`p-4 ${tool.bgColor} border ${tool.borderColor} rounded-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-sm">{tool.component}</h5>
                    <Badge variant="outline" className={tool.color}>
                      {tool.health}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${tool.color}`}>{tool.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium">{tool.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response:</span>
                      <span className="font-medium">{tool.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Issue:</span>
                      <span className="font-medium">{tool.lastIncident}</span>
                    </div>
                  </div>
                  <Progress value={tool.health} className="mt-3 h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              System Performance Analysis
            </CardTitle>
            <CardDescription>Real-time performance metrics and capacity monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Key Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">234ms</div>
                  <div className="text-sm text-blue-700">Avg Response Time</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">99.2%</div>
                  <div className="text-sm text-green-700">System Availability</div>
                </div>
              </div>

              {/* Performance Trends */}
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Performance Trends (30 days)</h5>
                {[
                  { metric: 'API Response Time', current: '234ms', trend: '+15ms', status: 'warning' },
                  { metric: 'Error Rate', current: '0.3%', trend: '-0.1%', status: 'good' },
                  { metric: 'Throughput', current: '15.4K req/min', trend: '+2.1K', status: 'good' },
                  { metric: 'Resource Utilization', current: '68%', trend: '+5%', status: 'neutral' }
                ].map((perf, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{perf.metric}</div>
                      <div className="text-xs text-muted-foreground">{perf.current}</div>
                    </div>
                    <Badge variant={perf.status === 'good' ? 'default' : perf.status === 'warning' ? 'destructive' : 'secondary'}>
                      {perf.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Integration Status Monitor
            </CardTitle>
            <CardDescription>Critical system integrations and data flow health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Integration Health Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">8</div>
                  <div className="text-xs text-green-700">Healthy</div>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-600">2</div>
                  <div className="text-xs text-orange-700">Warning</div>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-600">0</div>
                  <div className="text-xs text-red-700">Critical</div>
                </div>
              </div>

              {/* Critical Integrations */}
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Critical Integrations</h5>
                {[
                  { name: 'Salesforce → ODP', status: 'Healthy', lastSync: '2 min ago', health: 93 },
                  { name: 'GA4 → Behavioral Data', status: 'Warning', lastSync: '45 min ago', health: 78 },
                  { name: 'Email Platform → CMP', status: 'Healthy', lastSync: '5 min ago', health: 91 },
                  { name: 'Content API → CMS', status: 'Healthy', lastSync: 'Real-time', health: 96 }
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{integration.name}</div>
                      <div className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.status === 'Healthy' ? 'default' : 'destructive'} className="text-xs">
                        {integration.status}
                      </Badge>
                      <div className="text-xs font-medium">{integration.health}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Readiness Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Technology Readiness Assessment
          </CardTitle>
          <CardDescription>Evaluation of technical capabilities for strategic initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                category: 'Personalization Readiness',
                score: '8.2/10',
                status: 'Ready',
                strengths: ['Strong data foundation', 'Real-time profile updates', 'Comprehensive segmentation'],
                gaps: ['ML model integration', 'Basic recommendation algorithms'],
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              },
              {
                category: 'Experimentation Platform',
                score: '7.8/10',
                status: 'Good',
                strengths: ['Robust A/B testing', 'Statistical monitoring', 'Cross-device tracking'],
                gaps: ['Limited multivariate testing', 'Manual experiment setup'],
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
              },
              {
                category: 'Data Infrastructure',
                score: '9.1/10',
                status: 'Excellent',
                strengths: ['Real-time processing', 'High availability', 'Strong governance'],
                gaps: ['Advanced analytics', 'Predictive modeling'],
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              }
            ].map((assessment, index) => (
              <div key={index} className={`p-4 ${assessment.bgColor} border border-gray-200 rounded-lg`}>
                <div className="mb-3">
                  <h5 className="font-medium text-sm mb-1">{assessment.category}</h5>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${assessment.color}`}>{assessment.score}</span>
                    <Badge variant="outline" className={assessment.color}>
                      {assessment.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-green-700">Strengths:</span>
                    <ul className="mt-1 space-y-0.5">
                      {assessment.strengths.map((strength, i) => (
                        <li key={i} className="text-green-600">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-orange-700">Gaps:</span>
                    <ul className="mt-1 space-y-0.5">
                      {assessment.gaps.map((gap, i) => (
                        <li key={i} className="text-orange-600">• {gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Optimization Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Immediate Optimization Actions
            </CardTitle>
            <CardDescription>High-priority improvements for immediate implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Implement ODP API request queuing',
                  impact: 'Prevent peak-hour performance degradation',
                  effort: 'Medium (2-3 weeks)',
                  benefit: 'Consistent <300ms response times',
                  priority: 'High',
                  type: 'Performance'
                },
                {
                  action: 'Fix GA4 user identification gaps',
                  impact: 'Improve profile completeness by 8%',
                  effort: 'Low (1 week)',
                  benefit: 'Better audience targeting accuracy',
                  priority: 'High',
                  type: 'Data Quality'
                },
                {
                  action: 'Upgrade CMP email delivery infrastructure',
                  impact: 'Reduce email processing latency by 40%',
                  effort: 'Medium (3-4 weeks)',
                  benefit: 'Improved campaign performance',
                  priority: 'Medium',
                  type: 'Infrastructure'
                }
              ].map((optimization, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h6 className="font-medium text-sm">{optimization.action}</h6>
                      <p className="text-xs text-muted-foreground mt-1">{optimization.impact}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={optimization.priority === 'High' ? 'default' : 'secondary'} className="text-xs">
                        {optimization.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {optimization.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effort:</span>
                      <span className="font-medium">{optimization.effort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Benefit:</span>
                      <span className="font-medium text-green-600">{optimization.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Scalability Analysis
            </CardTitle>
            <CardDescription>Capacity planning and growth projections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Capacity */}
              <div className="text-center p-3 bg-purple-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-purple-600">68%</div>
                <div className="text-sm text-purple-700">Current Capacity Utilization</div>
                <div className="text-xs text-muted-foreground mt-1">6-8 months runway at 15% monthly growth</div>
              </div>

              {/* Scaling Metrics */}
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Key Scaling Indicators</h5>
                {[
                  { metric: 'API Request Volume', current: '2.1M/day', capacity: '4.5M/day', utilization: 47 },
                  { metric: 'Data Processing', current: '15.4K events/min', capacity: '25K events/min', utilization: 62 },
                  { metric: 'Storage Usage', current: '4.2TB', capacity: '8TB', utilization: 53 },
                  { metric: 'Concurrent Users', current: '1,240', capacity: '2,000', utilization: 62 }
                ].map((scale, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{scale.metric}</span>
                      <span className="text-muted-foreground">{scale.current} / {scale.capacity}</span>
                    </div>
                    <Progress value={scale.utilization} className="h-2" />
                    <div className="text-xs text-muted-foreground">{scale.utilization}% utilization</div>
                  </div>
                ))}
              </div>

              {/* Scaling Recommendations */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h6 className="font-medium text-sm text-yellow-800 mb-2">Scaling Triggers</h6>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Upgrade API gateway when requests {'>'} 3M/day</li>
                  <li>• Scale data processing at {'>'} 20K events/min</li>
                  <li>• Add storage capacity at 6TB usage</li>
                  <li>• Implement load balancing at {'>'} 1,500 concurrent users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security and Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            Security & Compliance Status
          </CardTitle>
          <CardDescription>Data governance, security posture, and regulatory compliance monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                area: 'Data Security',
                status: 'Compliant',
                score: '94%',
                details: ['Encryption at rest/transit', 'Access controls active', 'Regular security audits'],
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              },
              {
                area: 'Privacy Compliance',
                status: 'Compliant',
                score: '97%',
                details: ['GDPR compliant', 'CCPA compliant', 'Consent management active'],
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              },
              {
                area: 'API Security',
                status: 'Good',
                score: '88%',
                details: ['Rate limiting active', 'Authentication verified', 'Monitoring enabled'],
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
              },
              {
                area: 'Backup & Recovery',
                status: 'Excellent',
                score: '96%',
                details: ['RTO <4 hours', 'RPO <1 hour', 'Automated backups'],
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              }
            ].map((security, index) => (
              <div key={index} className={`p-4 ${security.bgColor} border border-gray-200 rounded-lg`}>
                <div className="mb-3">
                  <h5 className="font-medium text-sm mb-1">{security.area}</h5>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${security.color}`}>{security.score}</span>
                    <Badge variant="outline" className={security.color}>
                      {security.status}
                    </Badge>
                  </div>
                </div>
                <ul className="text-xs space-y-0.5">
                  {security.details.map((detail, i) => (
                    <li key={i} className={`${security.color}`}>• {detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Investment Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-indigo-600" />
            Technology Investment Roadmap
          </CardTitle>
          <CardDescription>Strategic technology investments aligned with business objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Investment Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  timeframe: 'Q1 2025',
                  investments: [
                    { name: 'API Gateway Enhancement', cost: '$20K', roi: '6 months' },
                    { name: 'ML Model Integration', cost: '$45K', roi: '8 months' }
                  ],
                  color: 'bg-blue-50',
                  borderColor: 'border-blue-200'
                },
                {
                  timeframe: 'Q2 2025',
                  investments: [
                    { name: 'Advanced Analytics Platform', cost: '$65K', roi: '10 months' },
                    { name: 'Security Infrastructure Upgrade', cost: '$30K', roi: '12 months' }
                  ],
                  color: 'bg-green-50',
                  borderColor: 'border-green-200'
                },
                {
                  timeframe: 'Q3-Q4 2025',
                  investments: [
                    { name: 'Predictive Analytics Engine', cost: '$85K', roi: '15 months' },
                    { name: 'Infrastructure Scaling', cost: '$40K', roi: '6 months' }
                  ],
                  color: 'bg-purple-50',
                  borderColor: 'border-purple-200'
                }
              ].map((quarter, index) => (
                <div key={index} className={`p-4 ${quarter.color} border ${quarter.borderColor} rounded-lg`}>
                  <h5 className="font-medium text-sm mb-3">{quarter.timeframe}</h5>
                  <div className="space-y-2">
                    {quarter.investments.map((investment, i) => (
                      <div key={i} className="p-2 bg-white rounded border">
                        <div className="font-medium text-xs">{investment.name}</div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Cost: {investment.cost}</span>
                          <span>ROI: {investment.roi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Investment Priorities */}
            <div>
              <h5 className="font-medium text-sm mb-3">Investment Justification & Impact</h5>
              <div className="space-y-3">
                {[
                  {
                    priority: 'High',
                    investment: 'API Gateway Enhancement',
                    justification: 'Essential for handling 3x traffic increase from personalization rollout',
                    business_impact: 'Enables advanced personalization features without performance degradation',
                    technical_requirement: 'Support for increased API throughput and advanced rate limiting'
                  },
                  {
                    priority: 'Medium',
                    investment: 'Predictive Analytics Engine',
                    justification: 'Unlock advanced customer lifecycle management and proactive personalization',
                    business_impact: '25-40% improvement in personalization effectiveness and customer retention',
                    technical_requirement: 'Real-time ML model serving and automated model training pipelines'
                  }
                ].map((invest, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-sm">{invest.investment}</h6>
                      <Badge variant={invest.priority === 'High' ? 'default' : 'secondary'}>
                        {invest.priority} Priority
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div><span className="font-medium">Justification:</span> {invest.justification}</div>
                      <div><span className="font-medium text-green-700">Business Impact:</span> {invest.business_impact}</div>
                      <div><span className="font-medium text-blue-700">Technical Requirement:</span> {invest.technical_requirement}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Share content component
function ShareContent({ areaId, tabId }: { areaId: string, tabId: string }) {
  return (
    <Card id="share-content">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Share with Team
        </CardTitle>
        <CardDescription>
          Share insights and recommendations for {tabId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Share with</label>
            <div className="mt-2 space-y-2">
              {['Marketing Team', 'UX Team', 'Development Team', 'Leadership', 'Data Team'].map((team) => (
                <div key={team} className="flex items-center space-x-2">
                  <input type="checkbox" id={team} className="rounded" />
                  <label htmlFor={team} className="text-sm">{team}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Access Level</label>
            <select className="w-full mt-1 p-2 border rounded-md">
              <option>View Only</option>
              <option>Comment</option>
              <option>Edit</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Message (Optional)</label>
            <textarea className="w-full mt-1 p-2 border rounded-md" rows={3} placeholder="Add a message for your team..."></textarea>
          </div>

          <div className="flex gap-3">
            <Button>Share Now</Button>
            <Button variant="outline">Copy Link</Button>
            <Button variant="outline">Schedule Send</Button>

            {/* Print & Download Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Print & Download
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Excel
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PowerPoint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Engine Actions and Summary component
interface EngineActionsSummaryProps {
  areaId: string;
  tabId: string;
  actionTabId: string;
}

function EngineActionsSummary({ areaId, tabId, actionTabId }: EngineActionsSummaryProps) {
  // Enhanced state management for backend integration
  const [customRules, setCustomRules] = useState('');
  const [savedRules, setSavedRules] = useState('');
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ruleTemplates, setRuleTemplates] = useState<any[]>([]);
  const [userRules, setUserRules] = useState<any[]>([]);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rule editing states
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');

  // Load rules from backend API
  const loadRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/custom-rules?area_id=${areaId}&tab_id=${tabId}&include_templates=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to load rules: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const templates = data.rules.filter((rule: any) => rule.isTemplate);
        const userCustomRules = data.rules.filter((rule: any) => !rule.isTemplate);

        setRuleTemplates(templates);
        setUserRules(userCustomRules);

        // Load the current active rule if exists
        const activeRule = userCustomRules.find((rule: any) =>
          rule.areaId === areaId && rule.tabId === tabId
        );
        if (activeRule) {
          setCustomRules(activeRule.rule);
          setSavedRules(activeRule.rule);
          setSelectedRule(activeRule);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom rules');
      console.error('Error loading custom rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save rules to backend API
  const handleSaveRules = async () => {
    if (!customRules.trim()) {
      setError('Please enter custom rules before saving');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const method = selectedRule ? 'PUT' : 'POST';
      const url = '/api/custom-rules';

      const body = selectedRule
        ? {
            id: selectedRule.id,
            name: selectedRule.name || `Custom Rule for ${areaId}-${tabId}`,
            description: selectedRule.description || 'User-defined custom analysis rule',
            rule: customRules.trim()
          }
        : {
            areaId,
            tabId,
            name: newRuleName || `Custom Rule for ${areaId}-${tabId}`,
            description: newRuleDescription || 'User-defined custom analysis rule',
            rule: customRules.trim()
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to save rule: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSavedRules(customRules);
        setSelectedRule(data.rule);
        setSuccessMessage('Custom rules saved successfully!');

        // Reload rules to refresh the list
        await loadRules();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom rules');
      console.error('Error saving custom rules:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset/delete rules
  const handleResetRules = async () => {
    if (selectedRule) {
      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/custom-rules?id=${selectedRule.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete rule: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setCustomRules('');
          setSavedRules('');
          setSelectedRule(null);
          setSuccessMessage('Custom rules deleted successfully!');

          // Reload rules to refresh the list
          await loadRules();

          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete custom rules');
        console.error('Error deleting custom rules:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Just clear if no saved rule
      setCustomRules('');
      setSavedRules('');
    }
  };

  // Apply template rule
  const handleApplyTemplate = (template: any) => {
    setCustomRules(template.rule);
    setNewRuleName(template.name);
    setNewRuleDescription(template.description);

    // Clear any existing selected rule since we're creating a new one based on template
    setSelectedRule(null);
  };

  // Load user's custom rule
  const handleLoadCustomRule = (rule: any) => {
    setCustomRules(rule.rule);
    setSelectedRule(rule);
    setNewRuleName(rule.name);
    setNewRuleDescription(rule.description);
  };

  // Load saved rules on component mount
  useEffect(() => {
    loadRules();
  }, [areaId, tabId]);

  // Only show for content tab
  if (actionTabId !== 'content') {
    return null;
  }

  const getEngineSummary = () => {
    const key = `${areaId}-${tabId}`;

    const summaries = {
      // Strategy Plans Area
      'strategy-plans-osa': {
        title: 'Strategy Plans → OSA Analysis',
        opalAgents: ['strategy_assistant_workflow', 'personalization_idea_generator'],
        opalInstructions: ['1-company-overview.md', '2-marketing-strategy.md', '5-personalization-maturity-rubric.md'],
        opalTools: ['workflow_data_sharing', 'osa_contentrecs_tools'],
        ragActions: [
          'Aggregates strategic inputs from engine form submissions and business objectives',
          'Applies maturity framework scoring (Crawl→Walk→Run→Fly) to recommendations',
          'Synthesizes KPI dashboard with personalization readiness assessment'
        ],
        dataIssues: [
          'Limited Optimizely DXP integration - only basic OPAL data flows available',
          'Maturity scoring relies on self-reported data rather than live system metrics',
          'ROI calculations are projective without historical performance baselines'
        ],
        improvements: [
          'Integrate live Optimizely CMS performance data for accurate content maturity',
          'Connect ODP customer intelligence for real audience segmentation scores',
          'Add WEBX experimentation history for evidence-based maturity assessment'
        ]
      },

      'strategy-plans-overview': {
        title: 'Strategy Plans → Overview Analysis',
        opalAgents: ['strategy_assistant_workflow'],
        opalInstructions: ['5-personalization-maturity-rubric.md', '8-kpi-experimentation.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Processes maturity assessment data through framework scoring algorithms',
          'Generates capability progress tracking across content, data, and tech domains',
          'Creates phased implementation roadmap based on organizational readiness'
        ],
        dataIssues: [
          'Missing real-time capability validation from actual Optimizely tool usage',
          'Maturity scores lack integration with live system performance metrics',
          'Progress tracking based on form inputs rather than measurable outcomes'
        ],
        improvements: [
          'Implement Optimizely CMS analytics integration for content capability validation',
          'Add ODP audience quality metrics for data maturity scoring',
          'Connect WEBX test velocity data for experimentation maturity assessment'
        ]
      },

      'strategy-plans-personalization-maturity': {
        title: 'Strategy Plans → Maturity Analysis',
        opalAgents: ['personalization_idea_generator', 'strategy_assistant_workflow'],
        opalInstructions: ['5-personalization-maturity-rubric.md', '4-personas.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_odp_tools'],
        ragActions: [
          'Evaluates personalization capabilities against maturity framework',
          'Maps current state to Crawl/Walk/Run/Fly progression model',
          'Generates phase-specific upgrade recommendations with effort estimates'
        ],
        dataIssues: [
          'Maturity assessment lacks integration with actual Optimizely personalization performance',
          'Phase recommendations not validated against real Content Recs effectiveness data',
          'Missing ODP audience intelligence to validate segmentation maturity claims'
        ],
        improvements: [
          'Connect Content Recs performance analytics for personalization maturity validation',
          'Integrate ODP audience quality scores for segmentation maturity assessment',
          'Add CMP campaign performance data for channel maturity evaluation'
        ]
      },

      'strategy-plans-phased-recommendations': {
        title: 'Strategy Plans → Phases Analysis',
        opalAgents: ['strategy_assistant_workflow', 'experiment_blueprinter'],
        opalInstructions: ['2-marketing-strategy.md', '8-kpi-experimentation.md'],
        opalTools: ['osa_webx_tools', 'workflow_data_sharing'],
        ragActions: [
          'Prioritizes recommendations using impact vs effort matrix scoring',
          'Maps initiatives to implementation phases with resource requirements',
          'Generates experiment blueprints for testing strategic initiatives'
        ],
        dataIssues: [
          'Impact scoring lacks historical WEBX experimentation data for validation',
          'Effort estimates not calibrated against actual Optimizely implementation complexity',
          'Phase sequencing missing dependencies from real DXP tool integration requirements'
        ],
        improvements: [
          'Integrate WEBX historical test results for accurate impact forecasting',
          'Connect CMS implementation data for realistic effort estimation',
          'Add ODP data flow requirements for proper phase dependency mapping'
        ]
      },

      'strategy-plans-example-roadmap': {
        title: 'Strategy Plans → Roadmap Analysis',
        opalAgents: ['strategy_assistant_workflow'],
        opalInstructions: ['9-technical-implementation-guidelines.md', '2-marketing-strategy.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Creates timeline visualization based on strategic priorities and technical dependencies',
          'Generates milestone tracking with success criteria definitions',
          'Maps resource allocation across implementation phases'
        ],
        dataIssues: [
          'Timeline estimates lack integration with actual Optimizely DXP deployment complexity',
          'Dependencies not validated against real CMS, ODP, and WEBX integration requirements',
          'Success metrics missing baseline data from current Optimizely tool performance'
        ],
        improvements: [
          'Connect technical implementation data from actual DXP deployments',
          'Integrate historical project timelines for realistic roadmap scheduling',
          'Add live system performance baselines for meaningful success criteria'
        ]
      },

      // Analytics Insights Area
      'analytics-insights-osa': {
        title: 'Analytics Insights → OSA Analysis',
        opalAgents: ['content_review', 'audience_suggester'],
        opalInstructions: ['6-content-guidelines.md', '7-data-governance-privacy.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_odp_tools', 'workflow_data_sharing'],
        ragActions: [
          'Aggregates analytics data from OPAL content review and audience analysis',
          'Applies data quality scoring using governance framework validation',
          'Generates performance insights with AI-powered topic analysis'
        ],
        dataIssues: [
          'Limited Content Recs integration - missing real visitor behavior analytics',
          'No direct ODP connection for actual audience intelligence and segmentation data',
          'Analytics ROI calculations lack integration with real CMP campaign performance'
        ],
        improvements: [
          'Connect Content Recs visitor behavior and engagement analytics',
          'Integrate ODP unified customer profiles and predictive analytics',
          'Add CMP campaign performance data for complete analytics coverage'
        ]
      },

      'analytics-insights-content': {
        title: 'Analytics Insights → Content Analysis',
        opalAgents: ['content_review'],
        opalInstructions: ['6-content-guidelines.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_cmspaas_tools'],
        ragActions: [
          'Processes content performance data through NLP topic analysis',
          'Generates engagement scoring based on content guidelines framework',
          'Creates optimization recommendations for content strategy improvement'
        ],
        dataIssues: [
          'Missing live Content Recs topic analysis and visitor interest data',
          'No CMS content performance analytics integration for actual pageview metrics',
          'Content optimization recommendations lack real engagement data validation'
        ],
        improvements: [
          'Integrate Content Recs NLP topic analysis and content performance data',
          'Connect CMS analytics for actual pageviews and engagement metrics',
          'Add visitor interest profiles from Content Recs for personalized content insights'
        ]
      },

      'analytics-insights-audiences': {
        title: 'Analytics Insights → Audiences Analysis',
        opalAgents: ['audience_suggester'],
        opalInstructions: ['4-personas.md', '7-data-governance-privacy.md'],
        opalTools: ['osa_odp_tools'],
        ragActions: [
          'Analyzes audience data using persona framework and segmentation logic',
          'Applies privacy governance rules to audience data processing',
          'Generates audience insights with behavioral pattern recognition'
        ],
        dataIssues: [
          'No ODP integration for real unified customer profiles and audience intelligence',
          'Audience suggestions lack actual behavioral data from visitor tracking',
          'Segmentation analysis missing real-time audience data and lifecycle insights'
        ],
        improvements: [
          'Integrate ODP unified customer profiles for 360-degree audience view',
          'Connect real behavioral data streams for accurate audience segmentation',
          'Add ODP predictive analytics for audience lifecycle and value insights'
        ]
      },

      'analytics-insights-customer-experience': {
        title: 'Analytics Insights → Customer Experience Analysis',
        opalAgents: ['content_review', 'audience_suggester'],
        opalInstructions: ['4-personas.md', '6-content-guidelines.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_odp_tools'],
        ragActions: [
          'Maps customer journey using persona data and content interaction patterns',
          'Analyzes experience optimization opportunities through content performance',
          'Generates CX improvement recommendations based on audience insights'
        ],
        dataIssues: [
          'Missing real customer journey data from ODP cross-channel tracking',
          'Experience analysis lacks actual Content Recs personalization effectiveness data',
          'CX recommendations not validated with real visitor behavior and conversion data'
        ],
        improvements: [
          'Integrate ODP customer journey analytics and cross-channel behavior data',
          'Connect Content Recs personalization impact metrics for experience optimization',
          'Add real conversion funnel data for evidence-based CX recommendations'
        ]
      },

      'analytics-insights-other': {
        title: 'Analytics Insights → Other Metrics Analysis',
        opalAgents: ['geo_audit'],
        opalInstructions: ['7-data-governance-privacy.md', '9-technical-implementation-guidelines.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Processes miscellaneous analytics data through governance compliance checks',
          'Generates technical performance insights and system health monitoring',
          'Creates data quality assessments with privacy compliance validation'
        ],
        dataIssues: [
          'Limited technical integration with actual Optimizely DXP system performance metrics',
          'Geo analysis lacks real visitor location and regional performance data',
          'System health monitoring missing live DXP tool performance indicators'
        ],
        improvements: [
          'Add real system performance monitoring from all DXP tools',
          'Integrate actual geo-location analytics for regional insights',
          'Connect live data quality metrics from ODP and other DXP tools'
        ]
      },

      // Optimizely DXP Tools Area
      'dxp-tools-content-recommendations': {
        title: 'DXP Tools → Content Recommendations Analysis',
        opalAgents: ['content_review', 'personalization_idea_generator'],
        opalInstructions: ['6-content-guidelines.md', '4-personas.md'],
        opalTools: ['osa_contentrecs_tools'],
        ragActions: [
          'Simulates Content Recs visitor behavior analytics using OPAL content review',
          'Applies NLP topic analysis framework to content performance scoring',
          'Generates personalization effectiveness projections based on guidelines'
        ],
        dataIssues: [
          'No live Content Recs integration - missing actual visitor behavior and engagement data',
          'Topic analysis lacks real NLP processing from Optimizely Content Recommendations',
          'Personalization metrics simulated rather than measured from actual recommendations'
        ],
        improvements: [
          'Connect live Content Recs visitor behavior tracking and CTR analytics',
          'Integrate real NLP topic analysis and content performance data',
          'Add actual personalization effectiveness metrics and conversion impact data'
        ]
      },

      'dxp-tools-cms': {
        title: 'DXP Tools → CMS Analysis',
        opalAgents: ['content_review'],
        opalInstructions: ['6-content-guidelines.md', '9-technical-implementation-guidelines.md'],
        opalTools: ['osa_cmspaas_tools'],
        ragActions: [
          'Processes content hierarchy and performance data through CMS framework analysis',
          'Generates content model optimization recommendations based on guidelines',
          'Creates workflow efficiency insights using technical implementation frameworks'
        ],
        dataIssues: [
          'Missing live CMS content performance analytics and pageview data',
          'No integration with actual Optimizely CMS workflow and template usage metrics',
          'Content model insights lack real editor behavior and campaign performance data'
        ],
        improvements: [
          'Integrate live CMS pageview analytics and content engagement metrics',
          'Connect real workflow efficiency data and template performance insights',
          'Add actual editor behavior analytics and campaign ROI measurements'
        ]
      },

      'dxp-tools-odp': {
        title: 'DXP Tools → ODP Analysis',
        opalAgents: ['audience_suggester'],
        opalInstructions: ['4-personas.md', '7-data-governance-privacy.md'],
        opalTools: ['osa_odp_tools'],
        ragActions: [
          'Simulates ODP audience intelligence using persona-based segmentation logic',
          'Applies privacy governance framework to simulated customer profile data',
          'Generates predictive analytics insights using audience suggestion algorithms'
        ],
        dataIssues: [
          'No ODP integration - missing unified customer profiles and real audience intelligence',
          'Customer journey mapping lacks actual cross-channel behavioral data',
          'Predictive analytics simulated without real machine learning model outputs'
        ],
        improvements: [
          'Connect live ODP unified customer profiles and 360-degree customer view',
          'Integrate real predictive analytics including order likelihood and LTV insights',
          'Add actual audience segmentation data and real-time behavioral streams'
        ]
      },

      'dxp-tools-webx': {
        title: 'DXP Tools → WEBX Analysis',
        opalAgents: ['experiment_blueprinter'],
        opalInstructions: ['8-kpi-experimentation.md', '2-marketing-strategy.md'],
        opalTools: ['osa_webx_tools'],
        ragActions: [
          'Creates experiment blueprints using KPI framework and strategic objectives',
          'Generates A/B test recommendations based on experimentation guidelines',
          'Simulates statistical significance and conversion impact projections'
        ],
        dataIssues: [
          'No WEBX integration - missing actual experiment results and statistical data',
          'Blueprint recommendations lack validation from real A/B test performance',
          'Statistical projections simulated without historical test velocity and win rate data'
        ],
        improvements: [
          'Integrate live WEBX experiment results and conversion data',
          'Connect real statistical significance metrics and test performance history',
          'Add actual program management insights including win rates and velocity metrics'
        ]
      },

      'dxp-tools-cmp': {
        title: 'DXP Tools → CMP Analysis',
        opalAgents: ['cmp_organizer', 'audience_suggester'],
        opalInstructions: ['4-personas.md', '2-marketing-strategy.md'],
        opalTools: ['osa_cmp_tools'],
        ragActions: [
          'Organizes campaign data using persona-based targeting and strategic frameworks',
          'Generates email performance insights through audience suggestion algorithms',
          'Creates customer journey optimization recommendations based on campaign guidelines'
        ],
        dataIssues: [
          'Missing live CMP email performance data including open rates and conversion metrics',
          'No integration with actual send time optimization and personalization effectiveness',
          'Campaign insights lack real customer journey analytics and cross-channel attribution'
        ],
        improvements: [
          'Connect live CMP email performance analytics and engagement metrics',
          'Integrate real send time optimization data and personalization impact measurements',
          'Add actual customer journey analytics and multi-channel campaign attribution'
        ]
      },

      // Experience Optimization Area
      'experience-optimization-content-opt': {
        title: 'Experience Optimization → Content Analysis',
        opalAgents: ['content_review', 'personalization_idea_generator'],
        opalInstructions: ['6-content-guidelines.md', '5-personalization-maturity-rubric.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_cmspaas_tools'],
        ragActions: [
          'Optimizes content strategy using guidelines framework and maturity assessment',
          'Generates personalization recommendations based on content performance analysis',
          'Creates engagement improvement roadmap using CMS and Content Recs frameworks'
        ],
        dataIssues: [
          'Content optimization lacks real engagement data from Content Recs and CMS analytics',
          'Personalization recommendations not validated against actual performance metrics',
          'Improvement roadmap missing baseline data from current content effectiveness'
        ],
        improvements: [
          'Integrate real content engagement data from Content Recs visitor analytics',
          'Connect CMS content performance metrics for evidence-based optimization',
          'Add personalization effectiveness data for validated recommendation accuracy'
        ]
      },

      'experience-optimization-experimentation': {
        title: 'Experience Optimization → Experimentation Analysis',
        opalAgents: ['experiment_blueprinter', 'strategy_assistant_workflow'],
        opalInstructions: ['8-kpi-experimentation.md', '9-technical-implementation-guidelines.md'],
        opalTools: ['osa_webx_tools'],
        ragActions: [
          'Blueprints experimentation strategy using KPI framework and technical guidelines',
          'Generates testing recommendations based on strategic priorities and implementation constraints',
          'Creates experimentation roadmap with statistical power and resource planning'
        ],
        dataIssues: [
          'Experimentation strategy lacks historical WEBX performance data for realistic planning',
          'Testing recommendations not calibrated against actual test velocity and success rates',
          'Statistical planning missing baseline conversion rates and effect size data'
        ],
        improvements: [
          'Integrate historical WEBX experiment results for accurate forecasting',
          'Connect real test velocity data and organizational experimentation maturity',
          'Add baseline performance metrics for realistic statistical power calculations'
        ]
      },

      'experience-optimization-personalization': {
        title: 'Experience Optimization → Personalization Analysis',
        opalAgents: ['personalization_idea_generator', 'audience_suggester'],
        opalInstructions: ['5-personalization-maturity-rubric.md', '4-personas.md'],
        opalTools: ['osa_contentrecs_tools', 'osa_odp_tools'],
        ragActions: [
          'Generates personalization strategy using maturity framework and persona analysis',
          'Creates audience-based optimization recommendations through suggestion algorithms',
          'Develops personalization roadmap based on Content Recs and ODP capabilities'
        ],
        dataIssues: [
          'Personalization strategy missing real effectiveness data from Content Recs and ODP',
          'Audience optimization lacks actual behavioral data and conversion impact metrics',
          'Roadmap development without baseline personalization performance measurements'
        ],
        improvements: [
          'Connect Content Recs personalization effectiveness and engagement lift data',
          'Integrate ODP audience intelligence and real behavioral segmentation metrics',
          'Add actual personalization ROI data for evidence-based strategy development'
        ]
      },

      'experience-optimization-user-experience': {
        title: 'Experience Optimization → User Experience Analysis',
        opalAgents: ['content_review', 'geo_audit'],
        opalInstructions: ['6-content-guidelines.md', '4-personas.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Analyzes user experience using content guidelines and persona frameworks',
          'Generates UX optimization recommendations through geo and content analysis',
          'Creates experience improvement roadmap based on workflow data insights'
        ],
        dataIssues: [
          'UX analysis lacks real user behavior data and interaction analytics',
          'Experience optimization missing actual performance metrics and usability data',
          'Improvement recommendations not validated with real user feedback and conversion data'
        ],
        improvements: [
          'Add real user interaction analytics and behavior tracking data',
          'Integrate actual performance metrics including page speed and engagement rates',
          'Connect user feedback systems and real conversion funnel analytics'
        ]
      },

      'experience-optimization-technology': {
        title: 'Experience Optimization → Technology Analysis',
        opalAgents: ['strategy_assistant_workflow'],
        opalInstructions: ['9-technical-implementation-guidelines.md', '7-data-governance-privacy.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Evaluates technical implementation using guidelines framework and governance standards',
          'Generates technology optimization roadmap based on strategic workflow analysis',
          'Creates integration recommendations for DXP tool performance improvement'
        ],
        dataIssues: [
          'Technology analysis lacks real system performance metrics from DXP tools',
          'Implementation recommendations missing actual integration complexity data',
          'Performance optimization without baseline technical metrics and system health data'
        ],
        improvements: [
          'Add real system performance monitoring from all Optimizely DXP tools',
          'Integrate actual API performance data and system health metrics',
          'Connect live integration monitoring and technical performance baselines'
        ]
      },

      // Default fallback for any missing area-tab combinations
      'default': {
        title: 'General Analysis',
        opalAgents: ['strategy_assistant_workflow'],
        opalInstructions: ['1-company-overview.md', '2-marketing-strategy.md'],
        opalTools: ['workflow_data_sharing'],
        ragActions: [
          'Processing strategic inputs through RAG decision layer framework',
          'Applying maturity-based recommendations using OPAL guideline analysis',
          'Generating personalized insights based on organizational context'
        ],
        dataIssues: [
          'Limited integration with live Optimizely DXP tool performance data',
          'Recommendations based on form inputs rather than real system metrics',
          'Missing real-time validation from actual tool usage and effectiveness'
        ],
        improvements: [
          'Integrate live performance data from all Optimizely DXP tools',
          'Connect real user behavior analytics for validation',
          'Add system health monitoring for evidence-based recommendations'
        ]
      }
    };

    return summaries[key] || summaries['default'];
  };

  const summary = getEngineSummary();

  return (
    <div className="mt-8 border-t pt-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="engine-summary" className="bg-slate-50 rounded-lg border px-6 py-2">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <div className="text-left">
                <div>Engine Actions and Summary</div>
                <div className="text-sm font-normal text-slate-600">{summary.title}</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4 pb-2">
          {/* OSA Processing Summary */}
          <div>
            <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              How OSA Generates These Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600">OPAL Agents:</span>
                <ul className="mt-1 space-y-1">
                  {summary.opalAgents.map((agent, index) => (
                    <li key={index} className="text-slate-500">• {agent}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium text-slate-600">OPAL Instructions:</span>
                <ul className="mt-1 space-y-1">
                  {summary.opalInstructions.map((instruction, index) => (
                    <li key={index} className="text-slate-500">• {instruction}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium text-slate-600">OPAL Tools:</span>
                <ul className="mt-1 space-y-1">
                  {summary.opalTools.map((tool, index) => (
                    <li key={index} className="text-slate-500">• {tool}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* RAG Decision Layer Actions */}
          <div>
            <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              RAG Decision Layer Actions
            </h4>
            <ul className="space-y-1 text-sm">
              {summary.ragActions.map((action, index) => (
                <li key={index} className="text-slate-600">• {action}</li>
              ))}
            </ul>
          </div>

          {/* Data Issues */}
          <div>
            <h4 className="font-medium text-sm text-orange-700 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Current Data Limitations
            </h4>
            <ul className="space-y-1 text-sm">
              {summary.dataIssues.map((issue, index) => (
                <li key={index} className="text-orange-600">• {issue}</li>
              ))}
            </ul>
          </div>

          {/* Improvement Recommendations */}
          <div>
            <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommended Data Quality Improvements
            </h4>
            <ul className="space-y-1 text-sm">
              {summary.improvements.map((improvement, index) => (
                <li key={index} className="text-green-600">• {improvement}</li>
              ))}
            </ul>
          </div>

          {/* Custom Calculation Rules */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-purple-700 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Custom Calculation Rules
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                className="h-6 px-2 text-xs"
              >
                {isRulesExpanded ? 'Collapse' : 'Expand'}
                {isRulesExpanded ? (
                  <ChevronDown className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronUp className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>

            {!isRulesExpanded && savedRules && (
              <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded border">
                <span className="font-medium">Active Rules:</span> {savedRules.slice(0, 100)}...
              </div>
            )}

            {isRulesExpanded && (
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg border">
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      Loading custom rules...
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Error</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadRules}
                      className="mt-2 h-6 px-2 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">{successMessage}</span>
                    </div>
                  </div>
                )}

                {!isLoading && (
                  <>
                    {/* Your Saved Rules */}
                    {userRules.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-700">Your Saved Rules:</span>
                          <Badge variant="secondary" className="text-xs">{userRules.length} saved</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {userRules.map((rule) => (
                            <div
                              key={rule.id}
                              className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                selectedRule?.id === rule.id ? 'bg-purple-100 border-purple-300' : 'bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => handleLoadCustomRule(rule)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-xs">{rule.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{rule.description}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Updated: {new Date(rule.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                {selectedRule?.id === rule.id && (
                                  <Badge variant="outline" className="text-xs">Active</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rule Templates */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-700">Rule Templates:</span>
                        <Badge variant="secondary" className="text-xs">{ruleTemplates.length} templates</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ruleTemplates.map((template) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyTemplate(template)}
                            className="h-auto p-2 text-left flex-col items-start"
                          >
                            <div className="font-medium text-xs">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Rule Name and Description (when creating/editing) */}
                    {(customRules || selectedRule) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-purple-700 block mb-1">Rule Name:</label>
                          <input
                            type="text"
                            value={newRuleName}
                            onChange={(e) => setNewRuleName(e.target.value)}
                            placeholder="e.g., Conservative Scoring for IFPA"
                            className="w-full h-8 text-xs p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-purple-700 block mb-1">Description:</label>
                          <input
                            type="text"
                            value={newRuleDescription}
                            onChange={(e) => setNewRuleDescription(e.target.value)}
                            placeholder="Brief description of this rule's purpose"
                            className="w-full h-8 text-xs p-2 border rounded"
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom Rules Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-700">Custom Rules for {summary.title}:</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="h-6 px-2 text-xs"
                          >
                            {showPreview ? 'Hide' : 'Preview'}
                          </Button>
                        </div>
                      </div>
                      <textarea
                        value={customRules}
                        onChange={(e) => setCustomRules(e.target.value)}
                        placeholder="Enter custom rules for OSA to use when calculating results for this section. For example: 'Prioritize quick wins with implementation time < 2 weeks' or 'Apply conservative scoring to maturity assessments when confidence < 80%'"
                        className="w-full h-32 text-xs p-2 border rounded resize-none"
                        disabled={isSaving}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {customRules.length} characters
                          {savedRules !== customRules && customRules && (
                            <span className="text-orange-600 ml-2">• Unsaved changes</span>
                          )}
                          {selectedRule && (
                            <span className="text-blue-600 ml-2">• Editing: {selectedRule.name}</span>
                          )}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetRules}
                            className="h-6 px-2 text-xs"
                            disabled={(!customRules && !savedRules) || isSaving}
                          >
                            {selectedRule ? 'Delete' : 'Reset'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveRules}
                            className="h-6 px-2 text-xs"
                            disabled={(savedRules === customRules && selectedRule) || !customRules.trim() || isSaving}
                          >
                            {isSaving ? 'Saving...' : selectedRule ? 'Update Rule' : 'Save Rule'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Preview Section */}
                {showPreview && customRules && (
                  <div className="border-t pt-3">
                    <h5 className="text-xs font-medium text-purple-700 mb-2">Preview - How These Rules Would Affect Current Results:</h5>
                    <div className="bg-white p-3 rounded border text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-blue-700">Rule Impact Simulation</div>
                          <div className="text-muted-foreground mt-1">
                            {customRules.toLowerCase().includes('conservative') && (
                              <div>• Maturity scores would be adjusted downward by 10-15%</div>
                            )}
                            {customRules.toLowerCase().includes('quick win') && (
                              <div>• Recommendations would prioritize initiatives under 4 weeks</div>
                            )}
                            {customRules.toLowerCase().includes('high impact') && (
                              <div>• Only initiatives with impact score &gt; 7/10 would be highlighted</div>
                            )}
                            {customRules.toLowerCase().includes('data quality') && (
                              <div>• Data foundation improvements would be ranked higher</div>
                            )}
                            {!customRules.toLowerCase().includes('conservative') &&
                             !customRules.toLowerCase().includes('quick') &&
                             !customRules.toLowerCase().includes('high impact') &&
                             !customRules.toLowerCase().includes('data') && (
                              <div>• Custom rules will be applied to modify OSA calculations and prioritization</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <span className="font-medium">Note:</span> Rule preview is simulated. Actual impact will depend on OSA processing logic and current data.
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-white p-2 rounded border">
                  <span className="font-medium">How it works:</span> Custom rules are stored per section and guide OSA's analysis algorithms. Rules are applied during calculation to adjust scoring, prioritization, and recommendations based on your organizational preferences and constraints.
                </div>
              </div>
            )}
          </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Content Recommendations DXP Tool Component
function ContentRecommendationsContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="content-recommendations-content" className="space-y-6">
      {/* Content Recs KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommendation CTR</p>
                <p className="text-2xl font-bold">8.3%</p>
                <Badge className={phaseConfig.run.color}>Above Average</Badge>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Coverage</p>
                <p className="text-2xl font-bold">92%</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personalization Lift</p>
                <p className="text-2xl font-bold">+24%</p>
                <Badge className={phaseConfig.run.color}>Strong Impact</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Health</p>
                <p className="text-2xl font-bold">99.7%</p>
                <Badge className={phaseConfig.fly.color}>Operational</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              NLP Topic Analysis
            </CardTitle>
            <CardDescription>AI-powered content topic analysis and visitor interest patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Top Performing Content Topics</h5>
              {[
                { topic: 'Sustainable Agriculture Practices', engagement: 94, recommendations: 1247, ctr: '12.3%' },
                { topic: 'Food Safety Regulations', engagement: 89, recommendations: 892, ctr: '9.8%' },
                { topic: 'Supply Chain Innovation', engagement: 87, recommendations: 734, ctr: '8.9%' },
                { topic: 'Market Trends Analysis', engagement: 82, recommendations: 623, ctr: '7.4%' }
              ].map((topic, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{topic.topic}</span>
                    <Badge variant="outline">{topic.ctr} CTR</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>Engagement: {topic.engagement}%</div>
                    <div>Recs Served: {topic.recommendations}</div>
                  </div>
                  <Progress value={topic.engagement} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Visitor Interest Profiles
            </CardTitle>
            <CardDescription>Behavioral patterns and content preferences by audience segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  segment: 'Premium Produce Buyers',
                  interests: ['Quality Certifications', 'Supply Chain Transparency', 'Premium Varieties'],
                  engagement: 91,
                  size: '23% of visitors'
                },
                {
                  segment: 'Small Retailers',
                  interests: ['Cost Management', 'Local Sourcing', 'Basic Training'],
                  engagement: 76,
                  size: '34% of visitors'
                },
                {
                  segment: 'Food Service Operators',
                  interests: ['Menu Innovation', 'Volume Purchasing', 'Food Safety'],
                  engagement: 88,
                  size: '19% of visitors'
                }
              ].map((profile, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-medium text-sm">{profile.segment}</h6>
                    <span className="text-xs text-muted-foreground">{profile.size}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {profile.interests.map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Engagement: {profile.engagement}%</span>
                    <Progress value={profile.engagement} className="h-1 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Recommendation Effectiveness Analytics
          </CardTitle>
          <CardDescription>Performance metrics and optimization insights for content recommendation engine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Performance Metrics</h5>
              <div className="space-y-3">
                {[
                  { metric: 'Click-Through Rate', value: '8.3%', benchmark: '6.2% industry avg', status: 'above' },
                  { metric: 'Conversion Rate', value: '3.7%', benchmark: '2.8% industry avg', status: 'above' },
                  { metric: 'Recommendation Accuracy', value: '87%', benchmark: '75% baseline', status: 'above' },
                  { metric: 'Page Engagement Time', value: '+2.4min', benchmark: 'vs non-personalized', status: 'above' }
                ].map((perf, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{perf.metric}</div>
                      <div className="text-xs text-muted-foreground">{perf.benchmark}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{perf.value}</div>
                      <Badge variant="outline" className="text-xs">
                        {perf.status === 'above' ? '↑' : '↓'} Benchmark
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Content Distribution</h5>
              <div className="space-y-2">
                {[
                  { category: 'Educational Articles', percentage: 45, recs: '2,340/month' },
                  { category: 'Industry News', percentage: 28, recs: '1,456/month' },
                  { category: 'Best Practices', percentage: 18, recs: '934/month' },
                  { category: 'Research Reports', percentage: 9, recs: '468/month' }
                ].map((dist, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{dist.category}</span>
                      <span>{dist.percentage}%</span>
                    </div>
                    <Progress value={dist.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">{dist.recs}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Optimization Opportunities</h5>
              <div className="space-y-2">
                {[
                  {
                    opportunity: 'Expand seasonal content recommendations',
                    impact: 'High',
                    effort: 'Low',
                    description: 'Leverage calendar events for timely content'
                  },
                  {
                    opportunity: 'Implement cross-category suggestions',
                    impact: 'Medium',
                    effort: 'Medium',
                    description: 'Bridge related topics for discovery'
                  },
                  {
                    opportunity: 'Add trending topic boosting',
                    impact: 'Medium',
                    effort: 'Low',
                    description: 'Surface popular content dynamically'
                  }
                ].map((opp, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{opp.opportunity}</span>
                      <Badge variant={opp.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                        {opp.impact}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-1">{opp.description}</p>
                    <span className="text-muted-foreground">Effort: {opp.effort}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Strategic Content Recommendations Roadmap
          </CardTitle>
          <CardDescription>Prioritized improvements to enhance recommendation engine performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Algorithm Enhancement</h6>
              <p className="text-sm text-blue-700">Current recommendation accuracy (87%) can be improved to 92% through advanced ML model integration and behavioral pattern recognition.</p>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-medium">Next Steps:</span> Implement collaborative filtering and content-based hybrid approach
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Content Coverage Expansion</h6>
              <p className="text-sm text-green-700">Increase recommendation coverage from 92% to 98% by improving content tagging and taxonomy structure.</p>
              <div className="mt-2 text-xs text-green-600">
                <span className="font-medium">Next Steps:</span> Implement automated content classification and metadata enrichment
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Personalization Depth</h6>
              <p className="text-sm text-purple-700">Advanced user profiling can increase engagement lift from 24% to 35% through real-time preference learning.</p>
              <div className="mt-2 text-xs text-purple-600">
                <span className="font-medium">Next Steps:</span> Deploy dynamic preference models and context-aware recommendations
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h6 className="font-medium text-orange-900 mb-2">Cross-Platform Integration</h6>
              <p className="text-sm text-orange-700">Unify recommendation data across email, web, and mobile channels for consistent personalized experience.</p>
              <div className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Next Steps:</span> Implement unified recommendation API and cross-channel tracking
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// CMS Insights DXP Tool Component
function CMSInsightsContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="cms-insights-content" className="space-y-6">
      {/* CMS Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Velocity</p>
                <p className="text-2xl font-bold">47 pcs/wk</p>
                <Badge className={phaseConfig.run.color}>Publishing Rate</Badge>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflow Efficiency</p>
                <p className="text-2xl font-bold">89%</p>
                <Badge className={phaseConfig.run.color}>Automation Rate</Badge>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Performance</p>
                <p className="text-2xl font-bold">94%</p>
                <Badge className={phaseConfig.fly.color}>Engagement Score</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">99.8%</p>
                <Badge className={phaseConfig.fly.color}>Uptime</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Content Model Performance
            </CardTitle>
            <CardDescription>Content type effectiveness and template optimization insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  contentType: 'Industry Articles',
                  performance: 94,
                  volume: 156,
                  avgEngagement: '4.2min',
                  conversionRate: '8.3%',
                  templateOptimization: 'High'
                },
                {
                  contentType: 'Research Reports',
                  performance: 89,
                  volume: 23,
                  avgEngagement: '8.7min',
                  conversionRate: '12.1%',
                  templateOptimization: 'Medium'
                },
                {
                  contentType: 'Best Practice Guides',
                  performance: 87,
                  volume: 67,
                  avgEngagement: '6.1min',
                  conversionRate: '9.4%',
                  templateOptimization: 'High'
                },
                {
                  contentType: 'News & Updates',
                  performance: 76,
                  volume: 234,
                  avgEngagement: '2.1min',
                  conversionRate: '4.7%',
                  templateOptimization: 'Low'
                }
              ].map((content, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{content.contentType}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{content.performance}% Performance</Badge>
                      <Badge variant={content.templateOptimization === 'High' ? 'default' : content.templateOptimization === 'Medium' ? 'secondary' : 'outline'} className="text-xs">
                        {content.templateOptimization} Opt
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Volume</div>
                      <div className="font-medium">{content.volume} pieces</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Engagement</div>
                      <div className="font-medium">{content.avgEngagement}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversion</div>
                      <div className="font-medium">{content.conversionRate}</div>
                    </div>
                  </div>
                  <Progress value={content.performance} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Editorial Team Analytics
            </CardTitle>
            <CardDescription>Team productivity and workflow insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Team Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <div className="text-sm text-blue-700">Active Editors</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2.3d</div>
                  <div className="text-sm text-green-700">Avg Time to Publish</div>
                </div>
              </div>

              {/* Individual Editor Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3">Editor Performance</h5>
                <div className="space-y-2">
                  {[
                    { editor: 'Sarah Johnson', role: 'Content Manager', productivity: 94, quality: 96, speed: 87 },
                    { editor: 'Mike Chen', role: 'Technical Writer', productivity: 89, quality: 91, speed: 94 },
                    { editor: 'Lisa Rodriguez', role: 'Editor', productivity: 92, quality: 89, speed: 85 },
                    { editor: 'David Kim', role: 'Content Specialist', productivity: 86, quality: 93, speed: 88 }
                  ].map((editor, index) => (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="font-medium text-sm">{editor.editor}</span>
                          <span className="text-xs text-muted-foreground ml-2">{editor.role}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{Math.round((editor.productivity + editor.quality + editor.speed) / 3)}%</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Productivity</div>
                          <Progress value={editor.productivity} className="h-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Quality</div>
                          <Progress value={editor.quality} className="h-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Speed</div>
                          <Progress value={editor.speed} className="h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Optimization Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Workflow & Template Analytics
          </CardTitle>
          <CardDescription>Content creation efficiency and template performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workflow Stages */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Workflow Stage Performance</h5>
              <div className="space-y-3">
                {[
                  { stage: 'Content Planning', avgTime: '0.5d', efficiency: 92, bottleneck: false },
                  { stage: 'Draft Creation', avgTime: '1.2d', efficiency: 87, bottleneck: false },
                  { stage: 'Review & Edit', avgTime: '0.8d', efficiency: 94, bottleneck: false },
                  { stage: 'Approval Process', avgTime: '1.1d', efficiency: 71, bottleneck: true },
                  { stage: 'Publishing', avgTime: '0.2d', efficiency: 98, bottleneck: false }
                ].map((stage, index) => (
                  <div key={index} className={`p-2 rounded ${stage.bottleneck ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{stage.avgTime}</span>
                        {stage.bottleneck && <AlertCircle className="h-3 w-3 text-orange-500" />}
                      </div>
                    </div>
                    <Progress value={stage.efficiency} className="h-1" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {stage.efficiency}% efficiency {stage.bottleneck ? '(bottleneck detected)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Performance */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Template Effectiveness</h5>
              <div className="space-y-2">
                {[
                  { template: 'Industry Article', usage: 89, performance: 94, satisfaction: 4.8 },
                  { template: 'Research Report', usage: 67, performance: 91, satisfaction: 4.6 },
                  { template: 'Best Practices', usage: 78, performance: 87, satisfaction: 4.5 },
                  { template: 'News Update', usage: 95, performance: 76, satisfaction: 4.1 },
                  { template: 'Event Coverage', usage: 45, performance: 83, satisfaction: 4.3 }
                ].map((template, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{template.template}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{template.satisfaction}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Usage: {template.usage}%</div>
                      <div>Performance: {template.performance}%</div>
                    </div>
                    <Progress value={template.performance} className="h-1 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Insights */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Automation & Optimization</h5>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-green-800">Auto-Tagging</span>
                  </div>
                  <div className="text-xs text-green-700">
                    <div>Accuracy: 94%</div>
                    <div>Time Saved: 12hrs/week</div>
                    <div>Coverage: 98% of content</div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-800">Workflow Automation</span>
                  </div>
                  <div className="text-xs text-blue-700">
                    <div>Automated Steps: 7 of 12</div>
                    <div>Efficiency Gain: +34%</div>
                    <div>Error Reduction: -67%</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-800">Content Intelligence</span>
                  </div>
                  <div className="text-xs text-purple-700">
                    <div>SEO Optimization: 91%</div>
                    <div>Readability Score: 8.7/10</div>
                    <div>Brand Compliance: 96%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic CMS Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            CMS Strategic Optimization Roadmap
          </CardTitle>
          <CardDescription>Prioritized improvements for content management excellence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-500">
              <h6 className="font-medium text-orange-900 mb-2">Approval Workflow Optimization</h6>
              <p className="text-sm text-orange-700">Current approval bottleneck (1.1d average) can be reduced to 0.4d through automated review routing and parallel approval processes.</p>
              <div className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Impact:</span> +40% faster publishing, reduced editor frustration
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Template Enhancement Program</h6>
              <p className="text-sm text-green-700">News Update templates show lower performance (76%). Redesign can improve to 85% through better structure and automation.</p>
              <div className="mt-2 text-xs text-green-600">
                <span className="font-medium">Impact:</span> +12% content effectiveness, improved user engagement
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Advanced Automation Integration</h6>
              <p className="text-sm text-blue-700">Expand automation from 7 to 10 workflow steps through AI-powered content optimization and smart publishing scheduling.</p>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-medium">Impact:</span> +25% efficiency gain, reduced manual errors
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Performance Analytics Enhancement</h6>
              <p className="text-sm text-purple-700">Implement real-time content performance tracking and predictive analytics for content strategy optimization.</p>
              <div className="mt-2 text-xs text-purple-600">
                <span className="font-medium">Impact:</span> Data-driven content decisions, improved ROI measurement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ODP Analytics DXP Tool Component
function ODPAnalyticsContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="odp-analytics-content" className="space-y-6">
      {/* ODP Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unified Profiles</p>
                <p className="text-2xl font-bold">487K</p>
                <Badge className={phaseConfig.run.color}>Active Users</Badge>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                <p className="text-2xl font-bold">94.3%</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Real-time Processing</p>
                <p className="text-2xl font-bold">15.4K/min</p>
                <Badge className={phaseConfig.run.color}>Events</Badge>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Segment Accuracy</p>
                <p className="text-2xl font-bold">96.8%</p>
                <Badge className={phaseConfig.fly.color}>ML Powered</Badge>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Intelligence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Unified Customer Profiles
            </CardTitle>
            <CardDescription>360-degree customer view with behavioral insights and lifecycle analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Profile Completeness */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">91.2%</div>
                  <div className="text-sm text-blue-700">Profile Completeness</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">47</div>
                  <div className="text-sm text-green-700">Avg Data Points</div>
                </div>
              </div>

              {/* Customer Lifecycle Distribution */}
              <div>
                <h5 className="font-medium text-sm mb-3">Customer Lifecycle Distribution</h5>
                <div className="space-y-2">
                  {[
                    { stage: 'New Prospects', count: 12840, percentage: 26, value: '$145', color: 'blue' },
                    { stage: 'Active Members', count: 23670, percentage: 49, value: '$4,200', color: 'green' },
                    { stage: 'Loyal Advocates', count: 8450, percentage: 17, value: '$12,800', color: 'purple' },
                    { stage: 'At-Risk Users', count: 3890, percentage: 8, value: '$890', color: 'orange' }
                  ].map((stage, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{stage.stage}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{stage.count.toLocaleString()}</Badge>
                          <Badge className="text-xs">{stage.value} LTV</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{stage.percentage}% of total customer base</span>
                      </div>
                      <Progress value={stage.percentage * 2} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Predictive Analytics Engine
            </CardTitle>
            <CardDescription>ML-powered insights for customer behavior prediction and optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Predictive Models Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3">Active ML Models</h5>
                <div className="space-y-3">
                  {[
                    {
                      model: 'Customer Lifetime Value Prediction',
                      accuracy: 89,
                      impact: 'High',
                      predictions: '487K profiles scored',
                      confidence: '94%'
                    },
                    {
                      model: 'Churn Risk Assessment',
                      accuracy: 92,
                      impact: 'High',
                      predictions: '3.8K at-risk identified',
                      confidence: '91%'
                    },
                    {
                      model: 'Next Best Action Recommendation',
                      accuracy: 86,
                      impact: 'Medium',
                      predictions: '12.3K recommendations/day',
                      confidence: '88%'
                    },
                    {
                      model: 'Purchase Intent Scoring',
                      accuracy: 84,
                      impact: 'Medium',
                      predictions: '289K scored daily',
                      confidence: '87%'
                    }
                  ].map((model, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{model.model}</span>
                        <Badge variant={model.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                          {model.impact} Impact
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-1">
                        <div>Accuracy: {model.accuracy}%</div>
                        <div>Confidence: {model.confidence}</div>
                      </div>
                      <div className="text-xs text-blue-600 mb-1">{model.predictions}</div>
                      <Progress value={model.accuracy} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Segmentation Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Advanced Audience Segmentation Analytics
          </CardTitle>
          <CardDescription>AI-powered audience intelligence with behavioral clustering and engagement patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dynamic Segments */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Dynamic Segments</h5>
              <div className="space-y-3">
                {[
                  {
                    segment: 'High-Value Produce Buyers',
                    size: 23450,
                    growth: '+8.2%',
                    engagement: 94,
                    revenue: '$2.4M',
                    characteristics: ['Premium purchases', 'Seasonal focus', 'Quality-driven']
                  },
                  {
                    segment: 'Cost-Conscious Retailers',
                    size: 34280,
                    growth: '+12.1%',
                    engagement: 76,
                    revenue: '$1.8M',
                    characteristics: ['Price-sensitive', 'Bulk orders', 'Local sourcing']
                  },
                  {
                    segment: 'Innovation-Focused Operators',
                    size: 18930,
                    growth: '+15.3%',
                    engagement: 89,
                    revenue: '$3.1M',
                    characteristics: ['New products', 'Tech adoption', 'Trend-following']
                  }
                ].map((segment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h6 className="font-medium text-sm">{segment.segment}</h6>
                      <Badge variant="outline" className="text-xs">{segment.growth}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>Size: {segment.size.toLocaleString()}</div>
                      <div>Revenue: {segment.revenue}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {segment.characteristics.map((char, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{char}</Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Engagement: {segment.engagement}%</span>
                      <Progress value={segment.engagement} className="h-1 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Patterns */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Behavioral Intelligence</h5>
              <div className="space-y-2">
                {[
                  { behavior: 'Cross-Category Purchasing', frequency: 87, trend: 'up', insight: 'Strong correlation between produce and equipment purchases' },
                  { behavior: 'Seasonal Buying Patterns', frequency: 92, trend: 'stable', insight: 'Peak activity in Q2 and Q4 harvest seasons' },
                  { behavior: 'Content Engagement Cycles', frequency: 76, trend: 'up', insight: 'Educational content drives 3x higher conversion' },
                  { behavior: 'Price Sensitivity Clustering', frequency: 89, trend: 'down', insight: 'Quality-focused segments less price-sensitive' },
                  { behavior: 'Channel Preference Evolution', frequency: 82, trend: 'up', insight: 'Mobile engagement increasing 15% monthly' }
                ].map((pattern, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{pattern.behavior}</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`h-3 w-3 ${pattern.trend === 'up' ? 'text-green-500' : pattern.trend === 'down' ? 'text-red-500' : 'text-blue-500'}`} />
                        <span>{pattern.frequency}%</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{pattern.insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Optimization */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Engagement Optimization</h5>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-green-800">High-Performing Campaigns</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>Email Open Rate: 34.2% (+15% industry avg)</div>
                    <div>Content CTR: 12.8% (+8.3% baseline)</div>
                    <div>Cross-sell Success: 23.1% (+18% improvement)</div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-800">Real-time Personalization</span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Dynamic Content: 89% of pages personalized</div>
                    <div>Response Time: {'<'}200ms average</div>
                    <div>Relevance Score: 8.9/10 user satisfaction</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-800">Predictive Insights</span>
                  </div>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>Churn Prevention: 91% accuracy</div>
                    <div>Upsell Opportunities: 847 identified</div>
                    <div>Lifetime Value: $4,200 average predicted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality & Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            Data Quality & Integration Health
          </CardTitle>
          <CardDescription>Comprehensive data governance and system integration monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Data Source Integration Status</h5>
              <div className="space-y-3">
                {[
                  { source: 'Salesforce CRM', status: 'Connected', quality: 96, latency: '15min', volume: '2.4K/day' },
                  { source: 'Google Analytics 4', status: 'Connected', quality: 89, latency: 'Real-time', volume: '18K/hour' },
                  { source: 'Email Platform', status: 'Connected', quality: 94, latency: '5min', volume: '890/day' },
                  { source: 'E-commerce Platform', status: 'Connected', quality: 91, latency: '30min', volume: '1.2K/day' },
                  { source: 'Mobile App Analytics', status: 'Warning', quality: 78, latency: '2hrs', volume: '450/day' }
                ].map((source, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${source.status === 'Warning' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{source.source}</span>
                      <Badge variant={source.status === 'Connected' ? 'default' : 'destructive'} className="text-xs">
                        {source.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>Quality: {source.quality}%</div>
                      <div>Latency: {source.latency}</div>
                      <div>Volume: {source.volume}</div>
                    </div>
                    <Progress value={source.quality} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Data Quality Metrics</h5>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-medium text-sm text-blue-800 mb-2">Schema Compliance</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Required Fields</span>
                      <span className="font-medium">98.7%</span>
                    </div>
                    <Progress value={98.7} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Data Types</span>
                      <span className="font-medium">99.2%</span>
                    </div>
                    <Progress value={99.2} className="h-1" />
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h6 className="font-medium text-sm text-green-800 mb-2">Data Freshness</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Real-time Events</span>
                      <span className="font-medium">{'<'}500ms</span>
                    </div>
                    <Progress value={95} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Batch Processing</span>
                      <span className="font-medium">{'<'}30min</span>
                    </div>
                    <Progress value={88} className="h-1" />
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h6 className="font-medium text-sm text-purple-800 mb-2">Privacy & Governance</h6>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>✓ GDPR Compliant Data Processing</div>
                    <div>✓ CCPA Privacy Controls Active</div>
                    <div>✓ Data Retention Policies Enforced</div>
                    <div>✓ Access Controls & Audit Logs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic ODP Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            ODP Strategic Enhancement Roadmap
          </CardTitle>
          <CardDescription>Advanced data platform capabilities and predictive analytics expansion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Advanced ML Model Deployment</h6>
              <p className="text-sm text-blue-700">Expand from 4 to 8 predictive models including advanced clustering algorithms and deep learning for customer lifecycle optimization.</p>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-medium">Impact:</span> +35% prediction accuracy, enhanced customer insights
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Real-time Data Pipeline Enhancement</h6>
              <p className="text-sm text-green-700">Reduce data latency to {'<'}100ms and increase processing capacity to 50K events/minute for instantaneous personalization.</p>
              <div className="mt-2 text-xs text-green-600">
                <span className="font-medium">Impact:</span> Real-time decision making, improved user experience
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Cross-Platform Identity Resolution</h6>
              <p className="text-sm text-purple-700">Implement advanced identity stitching across mobile, web, email, and offline touchpoints for unified customer view.</p>
              <div className="mt-2 text-xs text-purple-600">
                <span className="font-medium">Impact:</span> +25% profile completeness, better attribution
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h6 className="font-medium text-orange-900 mb-2">Predictive Analytics Automation</h6>
              <p className="text-sm text-orange-700">Deploy automated model retraining and performance optimization with continuous learning algorithms.</p>
              <div className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Impact:</span> Self-optimizing platform, reduced manual maintenance
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// WEBX Experimentation DXP Tool Component
function WEBXExperimentationContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="webx-experimentation-content" className="space-y-6">
      {/* WEBX Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Experiments</p>
                <p className="text-2xl font-bold">23</p>
                <Badge className={phaseConfig.run.color}>Running</Badge>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">34.7%</p>
                <Badge className={phaseConfig.run.color}>Above Benchmark</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Lift</p>
                <p className="text-2xl font-bold">+12.3%</p>
                <Badge className={phaseConfig.fly.color}>High Impact</Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Health</p>
                <p className="text-2xl font-bold">98.9%</p>
                <Badge className={phaseConfig.fly.color}>Operational</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiment Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Live Experiment Results
            </CardTitle>
            <CardDescription>Real-time performance metrics for active A/B tests with statistical significance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  experiment: 'Homepage CTA Optimization',
                  status: 'Running',
                  visitors: 4567,
                  confidence: 95.2,
                  lift: '+18.4%',
                  significance: 'Significant',
                  runtime: '12 days',
                  variants: ['Original (50%)', 'New Button (50%)']
                },
                {
                  experiment: 'Product Page Layout Test',
                  status: 'Running',
                  visitors: 2890,
                  confidence: 87.3,
                  lift: '+8.7%',
                  significance: 'Trending',
                  runtime: '8 days',
                  variants: ['Control (33%)', 'Layout A (33%)', 'Layout B (34%)']
                },
                {
                  experiment: 'Email Subject Line A/B',
                  status: 'Completed',
                  visitors: 8934,
                  confidence: 99.1,
                  lift: '+23.1%',
                  significance: 'Winner',
                  runtime: '14 days',
                  variants: ['Standard (50%)', 'Personalized (50%)']
                },
                {
                  experiment: 'Mobile Navigation Menu',
                  status: 'Running',
                  visitors: 1245,
                  confidence: 67.8,
                  lift: '+4.2%',
                  significance: 'Inconclusive',
                  runtime: '5 days',
                  variants: ['Hamburger (50%)', 'Bottom Tab (50%)']
                }
              ].map((exp, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{exp.experiment}</span>
                    <div className="flex gap-2">
                      <Badge variant={exp.status === 'Running' ? 'default' : exp.status === 'Completed' ? 'secondary' : 'outline'} className="text-xs">
                        {exp.status}
                      </Badge>
                      <Badge variant={exp.significance === 'Significant' || exp.significance === 'Winner' ? 'default' : exp.significance === 'Trending' ? 'secondary' : 'outline'} className="text-xs">
                        {exp.significance}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs mb-2">
                    <div>
                      <div className="text-muted-foreground">Visitors</div>
                      <div className="font-medium">{exp.visitors.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Confidence</div>
                      <div className="font-medium">{exp.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Lift</div>
                      <div className={`font-medium ${exp.lift.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{exp.lift}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exp.variants.map((variant, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{variant}</Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Runtime: {exp.runtime}</span>
                    <Progress value={exp.confidence} className="h-1 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Program Performance Analytics
            </CardTitle>
            <CardDescription>Experimentation program health and optimization insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Program Velocity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">3.2</div>
                  <div className="text-sm text-blue-700">Tests per Month</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">14.5d</div>
                  <div className="text-sm text-green-700">Avg Test Duration</div>
                </div>
              </div>

              {/* Historical Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3">6-Month Program Trends</h5>
                <div className="space-y-3">
                  {[
                    { month: 'Oct 2024', tests: 4, winners: 2, lift: '+15.2%', significance: 89 },
                    { month: 'Sep 2024', tests: 3, winners: 1, lift: '+8.9%', significance: 92 },
                    { month: 'Aug 2024', tests: 5, winners: 2, lift: '+12.7%', significance: 87 },
                    { month: 'Jul 2024', tests: 2, winners: 0, lift: '-2.1%', significance: 76 },
                    { month: 'Jun 2024', tests: 4, winners: 1, lift: '+6.3%', significance: 84 },
                    { month: 'May 2024', tests: 3, winners: 2, lift: '+18.4%', significance: 94 }
                  ].map((period, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{period.month}</div>
                        <div className="text-xs text-muted-foreground">{period.tests} tests, {period.winners} winners</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-sm ${period.lift.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {period.lift}
                        </div>
                        <div className="text-xs text-muted-foreground">{period.significance}% avg confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Analysis & Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Statistical Analysis & Testing Insights
          </CardTitle>
          <CardDescription>Advanced statistical monitoring and experiment optimization recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Statistical Health */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Statistical Health Metrics</h5>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-green-800">Power Analysis</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>Minimum Detectable Effect: 5%</div>
                    <div>Statistical Power: 80%</div>
                    <div>Alpha (Type I Error): 5%</div>
                    <div>Sample Size Adequacy: 94%</div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-800">Significance Testing</span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Confidence Threshold: 95%</div>
                    <div>False Discovery Rate: 2.1%</div>
                    <div>Multiple Testing Correction: ✓</div>
                    <div>Sequential Testing: Active</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-800">Quality Assurance</span>
                  </div>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>Goal Tracking Accuracy: 96.8%</div>
                    <div>Traffic Assignment: Balanced</div>
                    <div>Data Quality Score: 91.2%</div>
                    <div>Implementation Health: 98%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Experiment Categories */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Experiment Category Performance</h5>
              <div className="space-y-2">
                {[
                  { category: 'Homepage Optimization', tests: 8, winRate: 42, avgLift: '+14.2%', impact: 'High' },
                  { category: 'Product Page Tests', tests: 12, winRate: 33, avgLift: '+8.7%', impact: 'Medium' },
                  { category: 'Checkout Flow', tests: 6, winRate: 50, avgLift: '+21.3%', impact: 'High' },
                  { category: 'Email Campaigns', tests: 15, winRate: 27, avgLift: '+6.1%', impact: 'Medium' },
                  { category: 'Mobile UX', tests: 9, winRate: 44, avgLift: '+11.8%', impact: 'High' },
                  { category: 'Navigation/Search', tests: 4, winRate: 25, avgLift: '+3.9%', impact: 'Low' }
                ].map((cat, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{cat.category}</span>
                      <Badge variant={cat.impact === 'High' ? 'default' : cat.impact === 'Medium' ? 'secondary' : 'outline'} className="text-xs">
                        {cat.impact}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>{cat.tests} tests</div>
                      <div>{cat.winRate}% win rate</div>
                      <div className="text-green-600">{cat.avgLift} lift</div>
                    </div>
                    <Progress value={cat.winRate} className="h-1 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Testing Recommendations */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Optimization Recommendations</h5>
              <div className="space-y-3">
                {[
                  {
                    type: 'Priority Test',
                    recommendation: 'Mobile checkout flow optimization',
                    reasoning: 'High impact area with 67% mobile traffic',
                    expectedLift: '+15-25%',
                    effort: 'Medium',
                    priority: 'High'
                  },
                  {
                    type: 'Statistical',
                    recommendation: 'Increase sample sizes for product page tests',
                    reasoning: 'Current power analysis shows 73% adequacy',
                    expectedLift: 'Better detection',
                    effort: 'Low',
                    priority: 'Medium'
                  },
                  {
                    type: 'Program',
                    recommendation: 'Implement multivariate testing capability',
                    reasoning: 'Complex interactions between elements',
                    expectedLift: '+8-12%',
                    effort: 'High',
                    priority: 'Medium'
                  }
                ].map((rec, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === 'High' ? 'default' : 'secondary'} className="text-xs">
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h6 className="font-medium text-sm">{rec.recommendation}</h6>
                      <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Expected: {rec.expectedLift}</span>
                        <span className="text-muted-foreground">Effort: {rec.effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Velocity & Resource Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Test Velocity & Resource Planning
          </CardTitle>
          <CardDescription>Experimentation program capacity planning and optimization roadmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Program Capacity Analysis</h5>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-medium text-sm text-blue-800 mb-2">Current Capacity</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Concurrent Tests</span>
                      <span className="font-medium">23 / 30 slots</span>
                    </div>
                    <Progress value={77} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span>Monthly Test Velocity</span>
                      <span className="font-medium">3.2 / 5.0 target</span>
                    </div>
                    <Progress value={64} className="h-2" />
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h6 className="font-medium text-sm text-green-800 mb-2">Resource Allocation</h6>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>• Data Analyst: 65% utilization</div>
                    <div>• UX Designer: 40% utilization</div>
                    <div>• Frontend Developer: 80% utilization</div>
                    <div>• Product Manager: 30% utilization</div>
                  </div>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h6 className="font-medium text-sm text-orange-800 mb-2">Bottleneck Analysis</h6>
                  <div className="text-xs text-orange-700 space-y-1">
                    <div>• Frontend development capacity limiting test velocity</div>
                    <div>• QA validation adding 2-3 days per test</div>
                    <div>• Statistical analysis review taking 1.5 days average</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Scaling Roadmap</h5>
              <div className="space-y-2">
                {[
                  {
                    initiative: 'Automated QA Testing Pipeline',
                    timeline: 'Q1 2025',
                    impact: 'Reduce QA time from 2.5d to 0.5d',
                    investment: '$15K',
                    roi: '6 months'
                  },
                  {
                    initiative: 'Self-Service Experiment Creation',
                    timeline: 'Q2 2025',
                    impact: 'Enable non-technical team testing',
                    investment: '$25K',
                    roi: '8 months'
                  },
                  {
                    initiative: 'Advanced Statistical Dashboard',
                    timeline: 'Q2 2025',
                    impact: 'Real-time significance monitoring',
                    investment: '$12K',
                    roi: '4 months'
                  },
                  {
                    initiative: 'Multivariate Testing Platform',
                    timeline: 'Q3 2025',
                    impact: 'Test complex element interactions',
                    investment: '$35K',
                    roi: '12 months'
                  }
                ].map((item, index) => (
                  <div key={index} className="p-3 border rounded text-xs">
                    <div className="flex justify-between items-start mb-2">
                      <h6 className="font-medium">{item.initiative}</h6>
                      <Badge variant="outline" className="text-xs">{item.timeline}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{item.impact}</p>
                    <div className="flex justify-between">
                      <span>Investment: {item.investment}</span>
                      <span className="text-green-600">ROI: {item.roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic WEBX Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            WEBX Strategic Enhancement Roadmap
          </CardTitle>
          <CardDescription>Advanced experimentation capabilities and program maturity acceleration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">Advanced Statistical Methods</h6>
              <p className="text-sm text-blue-700">Implement Bayesian testing, sequential analysis, and machine learning-powered experiment design for 40% faster results with maintained accuracy.</p>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-medium">Impact:</span> Shorter test cycles, higher statistical confidence
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Personalization Integration</h6>
              <p className="text-sm text-green-700">Connect WEBX with ODP for personalized experiment targeting and segment-specific analysis. Enable dynamic treatment assignment based on user profiles.</p>
              <div className="mt-2 text-xs text-green-600">
                <span className="font-medium">Impact:</span> +25% experiment relevance, improved user experience
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Cross-Platform Testing</h6>
              <p className="text-sm text-purple-700">Expand beyond web to mobile app, email, and offline touchpoints for unified experience optimization across all customer journey stages.</p>
              <div className="mt-2 text-xs text-purple-600">
                <span className="font-medium">Impact:</span> Holistic optimization, consistent experience
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h6 className="font-medium text-orange-900 mb-2">AI-Powered Experiment Generation</h6>
              <p className="text-sm text-orange-700">Deploy machine learning algorithms to automatically generate test hypotheses and predict experiment outcomes based on historical performance patterns.</p>
              <div className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Impact:</span> Automated hypothesis generation, predictive testing
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// CMP Campaign Management DXP Tool Component
function CMPCampaignContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole: string }) {
  return (
    <div id="cmp-campaign-content" className="space-y-6">
      {/* CMP Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Open Rate</p>
                <p className="text-2xl font-bold">34.2%</p>
                <Badge className={phaseConfig.run.color}>Above Industry</Badge>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campaign ROI</p>
                <p className="text-2xl font-bold">285%</p>
                <Badge className={phaseConfig.fly.color}>High Performance</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Send Time Optimization</p>
                <p className="text-2xl font-bold">91.3%</p>
                <Badge className={phaseConfig.run.color}>AI-Optimized</Badge>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Health</p>
                <p className="text-2xl font-bold">97.8%</p>
                <Badge className={phaseConfig.fly.color}>Excellent</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Email Performance Analytics
            </CardTitle>
            <CardDescription>Comprehensive email campaign performance with engagement and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Campaign Performance Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2.4M</div>
                  <div className="text-sm text-blue-700">Emails Sent (30d)</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12.8%</div>
                  <div className="text-sm text-green-700">Click-Through Rate</div>
                </div>
              </div>

              {/* Recent Campaign Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3">Recent Campaign Performance</h5>
                <div className="space-y-3">
                  {[
                    {
                      campaign: 'Seasonal Produce Updates',
                      sent: 45230,
                      openRate: 38.2,
                      ctr: 14.7,
                      conversions: 847,
                      revenue: '$12,400',
                      performance: 'excellent'
                    },
                    {
                      campaign: 'Industry Best Practices',
                      sent: 32180,
                      openRate: 41.5,
                      ctr: 16.2,
                      conversions: 623,
                      revenue: '$8,900',
                      performance: 'excellent'
                    },
                    {
                      campaign: 'Weekly Market Report',
                      sent: 52340,
                      openRate: 29.8,
                      ctr: 9.4,
                      conversions: 412,
                      revenue: '$5,200',
                      performance: 'good'
                    },
                    {
                      campaign: 'Product Launch Announcement',
                      sent: 28900,
                      openRate: 35.7,
                      ctr: 18.9,
                      conversions: 934,
                      revenue: '$18,700',
                      performance: 'excellent'
                    }
                  ].map((campaign, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{campaign.campaign}</span>
                        <Badge variant={campaign.performance === 'excellent' ? 'default' : 'secondary'} className="text-xs">
                          {campaign.performance}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                        <div>
                          <div className="text-muted-foreground">Sent</div>
                          <div className="font-medium">{campaign.sent.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue</div>
                          <div className="font-medium text-green-600">{campaign.revenue}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>Open: {campaign.openRate}%</div>
                        <div>CTR: {campaign.ctr}%</div>
                        <div>Conv: {campaign.conversions}</div>
                      </div>
                      <Progress value={campaign.openRate} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Campaign Orchestration Insights
            </CardTitle>
            <CardDescription>Multi-channel campaign coordination and automation performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Automation Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3">Active Automation Workflows</h5>
                <div className="space-y-3">
                  {[
                    {
                      workflow: 'New Member Onboarding',
                      status: 'Active',
                      trigger: 'Registration Complete',
                      steps: 7,
                      engagement: 89.4,
                      completionRate: 76.2,
                      avgRevenue: '$1,240'
                    },
                    {
                      workflow: 'Seasonal Content Series',
                      status: 'Active',
                      trigger: 'Interest Behavior',
                      steps: 5,
                      engagement: 92.1,
                      completionRate: 83.7,
                      avgRevenue: '$890'
                    },
                    {
                      workflow: 'Re-engagement Campaign',
                      status: 'Active',
                      trigger: '30 Days Inactive',
                      steps: 4,
                      engagement: 67.8,
                      completionRate: 45.2,
                      avgRevenue: '$340'
                    },
                    {
                      workflow: 'Purchase Follow-up',
                      status: 'Active',
                      trigger: 'Order Completion',
                      steps: 3,
                      engagement: 94.6,
                      completionRate: 91.3,
                      avgRevenue: '$2,100'
                    }
                  ].map((workflow, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="font-medium text-sm">{workflow.workflow}</h6>
                        <Badge variant="default" className="text-xs">{workflow.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Trigger: {workflow.trigger}</div>
                          <div>Steps: {workflow.steps}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Engagement</div>
                            <div className="font-medium">{workflow.engagement}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Completion</div>
                            <div className="font-medium">{workflow.completionRate}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Revenue</div>
                            <div className="font-medium text-green-600">{workflow.avgRevenue}</div>
                          </div>
                        </div>
                        <Progress value={workflow.engagement} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced CMP Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Advanced Campaign Analytics & Attribution
          </CardTitle>
          <CardDescription>Cross-channel performance analysis with AI-powered send time optimization and customer journey attribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Send Time Optimization */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">AI Send Time Optimization</h5>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-800">Personalized Scheduling</span>
                  </div>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>Optimization Coverage: 91.3%</div>
                    <div>Avg Engagement Lift: +23.4%</div>
                    <div>Time Zone Intelligence: Active</div>
                    <div>Behavioral Learning: 94% accuracy</div>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-xs mb-2">Optimal Send Times by Segment</h6>
                  <div className="space-y-2">
                    {[
                      { segment: 'Premium Buyers', time: '9:15 AM EST', lift: '+28%', confidence: 96 },
                      { segment: 'Small Retailers', time: '11:30 AM EST', lift: '+19%', confidence: 92 },
                      { segment: 'Food Service', time: '2:45 PM EST', lift: '+31%', confidence: 89 }
                    ].map((opt, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{opt.segment}</span>
                          <Badge variant="outline" className="text-xs">{opt.lift}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>{opt.time}</span>
                          <span>{opt.confidence}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Channel Attribution */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Cross-Channel Attribution</h5>
              <div className="space-y-2">
                {[
                  { channel: 'Email → Website', attribution: 47.2, revenue: '$89K', conversions: 1240 },
                  { channel: 'Email → Mobile App', attribution: 23.8, revenue: '$34K', conversions: 567 },
                  { channel: 'Email → Social', attribution: 12.4, revenue: '$18K', conversions: 234 },
                  { channel: 'Email → Phone', attribution: 8.9, revenue: '$23K', conversions: 145 },
                  { channel: 'Email → In-Store', attribution: 7.7, revenue: '$12K', conversions: 89 }
                ].map((attr, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{attr.channel}</span>
                      <span className="text-green-600">{attr.revenue}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <div>{attr.attribution}% attribution</div>
                      <div>{attr.conversions} conversions</div>
                    </div>
                    <Progress value={attr.attribution} className="h-1 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Journey Analytics */}
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Customer Journey Impact</h5>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-green-800">Journey Acceleration</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>Avg Journey Reduction: -18.7%</div>
                    <div>Time to Purchase: -12.3 days</div>
                    <div>Touchpoint Efficiency: +34%</div>
                    <div>Cross-sell Success: +41%</div>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-xs mb-2">Journey Stage Performance</h6>
                  <div className="space-y-2">
                    {[
                      { stage: 'Awareness → Interest', emails: 3.2, conversion: 34.7, timeline: '4.2d' },
                      { stage: 'Interest → Consideration', emails: 2.8, conversion: 28.9, timeline: '7.1d' },
                      { stage: 'Consideration → Purchase', emails: 4.1, conversion: 18.3, timeline: '12.8d' },
                      { stage: 'Purchase → Advocacy', emails: 6.7, conversion: 23.4, timeline: '21.3d' }
                    ].map((journey, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium mb-1">{journey.stage}</div>
                        <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                          <div>{journey.emails} emails</div>
                          <div>{journey.conversion}% conv</div>
                          <div>{journey.timeline} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverability & Performance Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            Deliverability & Performance Health
          </CardTitle>
          <CardDescription>Email deliverability monitoring and campaign performance optimization insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Deliverability Health Metrics</h5>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h6 className="font-medium text-sm text-green-800 mb-2">Sender Reputation</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>IP Reputation Score</span>
                      <span className="font-medium">98.7%</span>
                    </div>
                    <Progress value={98.7} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Domain Reputation</span>
                      <span className="font-medium">96.2%</span>
                    </div>
                    <Progress value={96.2} className="h-1" />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-medium text-sm text-blue-800 mb-2">Delivery Performance</h6>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Delivery Rate: 97.8% (↑2.1%)</div>
                    <div>Bounce Rate: 1.8% (↓0.3%)</div>
                    <div>Spam Rate: 0.2% (↓0.1%)</div>
                    <div>Unsubscribe Rate: 0.4% (stable)</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h6 className="font-medium text-sm text-purple-800 mb-2">Authentication Status</h6>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>✓ SPF Record Configured</div>
                    <div>✓ DKIM Signature Active</div>
                    <div>✓ DMARC Policy Enforced</div>
                    <div>✓ BIMI Record Validated</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Performance Optimization</h5>
              <div className="space-y-3">
                {[
                  {
                    category: 'Subject Line Optimization',
                    current: 34.2,
                    benchmark: 28.5,
                    opportunity: '+6.2% open rate potential',
                    action: 'A/B test personalization tokens',
                    priority: 'High'
                  },
                  {
                    category: 'Content Relevance',
                    current: 12.8,
                    benchmark: 9.4,
                    opportunity: '+2.1% CTR improvement',
                    action: 'Implement dynamic content blocks',
                    priority: 'Medium'
                  },
                  {
                    category: 'Mobile Optimization',
                    current: 89.3,
                    benchmark: 76.8,
                    opportunity: '+4.8% mobile engagement',
                    action: 'Optimize template responsiveness',
                    priority: 'Medium'
                  },
                  {
                    category: 'List Segmentation',
                    current: 76.4,
                    benchmark: 65.2,
                    opportunity: '+8.3% relevance score',
                    action: 'Refine behavioral segments',
                    priority: 'High'
                  }
                ].map((opt, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h6 className="font-medium text-sm">{opt.category}</h6>
                      <Badge variant={opt.priority === 'High' ? 'default' : 'secondary'} className="text-xs">
                        {opt.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Current: {opt.current}%</span>
                        <span className="text-muted-foreground">Benchmark: {opt.benchmark}%</span>
                      </div>
                      <Progress value={opt.current} className="h-1" />
                      <div className="text-xs text-green-600">{opt.opportunity}</div>
                      <div className="text-xs text-muted-foreground">{opt.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic CMP Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            CMP Strategic Enhancement Roadmap
          </CardTitle>
          <CardDescription>Advanced campaign management capabilities and cross-channel orchestration optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <h6 className="font-medium text-blue-900 mb-2">AI-Powered Content Personalization</h6>
              <p className="text-sm text-blue-700">Deploy advanced NLP and machine learning for dynamic content generation and personalization at scale, increasing relevance scores by 40%.</p>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-medium">Impact:</span> Automated content optimization, higher engagement rates
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <h6 className="font-medium text-green-900 mb-2">Cross-Channel Journey Orchestration</h6>
              <p className="text-sm text-green-700">Unify email, SMS, push notifications, and web experiences for seamless customer journeys with consistent messaging and optimal timing.</p>
              <div className="mt-2 text-xs text-green-600">
                <span className="font-medium">Impact:</span> +35% cross-channel engagement, unified customer experience
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-500">
              <h6 className="font-medium text-purple-900 mb-2">Predictive Campaign Analytics</h6>
              <p className="text-sm text-purple-700">Implement predictive modeling for campaign performance forecasting, optimal audience sizing, and automated A/B test recommendations.</p>
              <div className="mt-2 text-xs text-purple-600">
                <span className="font-medium">Impact:</span> Predictive optimization, reduced campaign planning time
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
              <h6 className="font-medium text-orange-900 mb-2">Advanced Attribution Modeling</h6>
              <p className="text-sm text-orange-700">Deploy multi-touch attribution with machine learning to accurately measure campaign contribution across all customer touchpoints and channels.</p>
              <div className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Impact:</span> Accurate ROI measurement, optimized budget allocation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Recommendations Content component with analytics tracking
interface RecommendationsContentProps {
  areaId: string;
  tabId: string;
  selectedRole: string;
  recommendations: EnhancedRecommendation[];
  analytics: ReturnType<typeof useAnalytics>;
}

function RecommendationsContent({
  areaId,
  tabId,
  selectedRole,
  recommendations,
  analytics
}: RecommendationsContentProps) {
  const handleRecommendationClick = (recommendation: EnhancedRecommendation) => {
    analytics.trackRecommendationClick(
      recommendation.id,
      recommendation.type,
      recommendation.confidence,
      recommendation.expectedOutcomes.primary,
      areaId,
      tabId
    );
  };

  const handleRecommendationDismiss = (recommendation: EnhancedRecommendation, reason: string) => {
    analytics.trackRecommendationDismiss(
      recommendation.id,
      reason,
      areaId,
      tabId
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalized Recommendations</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered recommendations tailored for {selectedRole} role in {areaId.replace('-', ' ')}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Star className="h-3 w-3 mr-1" />
          {recommendations.length} Recommendations
        </Badge>
      </div>

      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-500">
            No personalized recommendations found for the current context. Try switching areas or roles.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={rec.type === 'quick_win' ? 'default' :
                               rec.type === 'strategic' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {rec.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getConfidenceColor(rec.confidence)}`}
                      >
                        {rec.confidence}% Confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.timeline}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2">{rec.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {rec.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(rec.finalScore)}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Expected Impact</h4>
                    <p className="text-sm text-gray-600">{rec.actionableMetrics.expectedImpact}</p>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Success Probability</div>
                      <div className="text-sm font-medium text-green-600">{rec.successProbability}%</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Implementation</h4>
                    <p className="text-sm text-gray-600">{rec.actionableMetrics.implementationEffort}</p>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">ROI Estimate</div>
                      <div className="text-sm font-medium text-blue-600">{rec.roiEstimate}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Risk Assessment</h4>
                  <p className="text-sm text-gray-600">{rec.actionableMetrics.riskAssessment}</p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Why This Recommendation?</h4>
                  <p className="text-sm text-gray-600">{rec.personalization.reasonForRecommendation}</p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Role-Specific Benefits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.personalization.roleSpecificBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.personalization.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleRecommendationClick(rec)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Implement Recommendation
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRecommendationDismiss(rec, 'not_relevant')}>
                        Not Relevant
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRecommendationDismiss(rec, 'already_implemented')}>
                        Already Implemented
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRecommendationDismiss(rec, 'insufficient_resources')}>
                        Insufficient Resources
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRecommendationDismiss(rec, 'too_complex')}>
                        Too Complex
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Results Footer component with copyright and additional information
function ResultsFooter() {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              OSA (Optimizely Strategy Assistant)
            </h3>
            <p className="text-sm text-gray-600 max-w-2xl">
              Powered by OPAL AI technology, OSA provides comprehensive personalization strategy recommendations
              based on your organization's digital maturity and business objectives.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-white">
              <Database className="h-3 w-3 mr-1" />
              Real-Time Data
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span>© 2024 IFPA (International Fresh Produce Association)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>•</span>
            <span>Strategy Assistant v2.0</span>
            <span>•</span>
            <span>Powered by Optimizely DXP</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3 w-3" />
          <span>Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// TTYD Content Component
interface TTYDContentProps {
  question: string;
  onQuestionChange: (question: string) => void;
  onClose: () => void;
}

function TTYDContent({ question, onQuestionChange, onClose }: TTYDContentProps) {
  const [isListening, setIsListening] = useState(false);

  const handlePrebuiltPrompt = (prompt: string) => {
    onQuestionChange(prompt);
  };

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    console.log('TTYD: Processing question:', question);
    // TODO: Implement actual question processing
  };

  const handleVoiceActivation = () => {
    if (!isListening) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onQuestionChange(question + (question ? ' ' : '') + transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Speech recognition is not supported in your browser. Please try using Chrome, Safari, or Edge.');
      }
    } else {
      // Stop listening (this will be handled by recognition.onend)
      setIsListening(false);
    }
  };

  const prebuiltPrompts = [
    {
      category: "Content",
      icon: BookOpen,
      color: "bg-blue-500",
      prompt: "What are the key content optimization opportunities based on my Optimizely data?"
    },
    {
      category: "Audiences",
      icon: Users,
      color: "bg-green-500",
      prompt: "Which audience segments show the highest engagement and conversion potential in my data?"
    },
    {
      category: "Quick Wins",
      icon: Zap,
      color: "bg-purple-500",
      prompt: "What are the top 3 quick wins I can implement this week based on my Optimizely results?"
    }
  ];

  const didYouKnowInsights = [
    {
      icon: TrendingUp,
      title: "Personalization Impact",
      insight: "Your personalized experiences show 23% higher conversion rates than non-personalized variants"
    },
    {
      icon: Target,
      title: "Top Performing Audience",
      insight: "Mobile users from the 'Returning Customers' segment have the highest engagement scores"
    },
    {
      icon: BarChart3,
      title: "Content Performance",
      insight: "Product recommendation blocks drive 40% more clicks than static content areas"
    },
    {
      icon: Users,
      title: "Audience Insights",
      insight: "Your 'Premium Tier' audience segment shows 60% higher lifetime value"
    },
    {
      icon: Sparkles,
      title: "A/B Test Results",
      insight: "Tests with 3+ variants consistently outperform simple A/B tests by 15%"
    },
    {
      icon: Activity,
      title: "Engagement Patterns",
      insight: "Users engage most with your content between 2-4 PM on weekdays"
    },
    {
      icon: Globe,
      title: "Geographic Performance",
      insight: "West Coast traffic converts 18% better with social proof elements"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Talk To Your Data
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Ask questions about your Optimizely data and get AI-powered insights
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Main Question Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Ask Your Question</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <textarea
              placeholder="Ask me questions about your Optimizely data..."
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              className="w-full min-h-[120px] p-4 text-lg border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceActivation}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
              <div className="text-sm text-gray-500">
                {isListening ? (
                  <span className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Listening... Speak now
                  </span>
                ) : (
                  <span>Click the microphone to use voice input</span>
                )}
              </div>
            </div>
            <Button
              onClick={handleQuestionSubmit}
              disabled={!question.trim()}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Ask Question
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prebuilt Prompts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Questions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {prebuiltPrompts.map((prompt, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-gray-300"
              onClick={() => handlePrebuiltPrompt(prompt.prompt)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${prompt.color}`}>
                    <prompt.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-blue-600 mb-2">
                      {prompt.category}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Did You Know Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Did You Know?</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {didYouKnowInsights.map((insight, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <insight.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-600">{insight.insight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}