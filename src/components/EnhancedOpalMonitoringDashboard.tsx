'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Server,
  Database,
  Webhook,
  Cpu,
  HardDrive,
  Timer,
  Users,
  Globe,
  Shield
} from 'lucide-react';
import { agentStatusTracker, AgentStatusInfo, WorkflowProgress } from '@/lib/monitoring/agent-status-tracker';
import RealTimeAgentStatus from './RealTimeAgentStatus';

interface MonitoringMetrics {
  timestamp: string;
  timeframe: string;
  agentSummary: {
    total: number;
    idle: number;
    running: number;
    completed: number;
    failed: number;
    retrying: number;
  };
  performance: {
    avgExecutionTime: number;
    totalWorkflows: number;
    successRate: number;
    throughputPerHour: number;
  };
  systemHealth: {
    overall: string;
    apiLatency: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    webhookSuccessRate: number;
  };
  historicalData: {
    executions: Array<{
      timestamp: string;
      executions: number;
      successes: number;
      failures: number;
    }>;
    errors: Array<{
      timestamp: string;
      webhookErrors: number;
      timeoutErrors: number;
      systemErrors: number;
    }>;
    performance: Array<{
      timestamp: string;
      avgResponseTime: number;
      throughput: number;
      memoryUsage: number;
      cpuUsage: number;
    }>;
  };
  errorSummary: {
    total: number;
    webhookErrors: number;
    timeoutErrors: number;
    systemErrors: number;
  };
}

interface EnhancedOpalMonitoringDashboardProps {
  className?: string;
}

export default function EnhancedOpalMonitoringDashboard({ className }: EnhancedOpalMonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load monitoring metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`/api/monitoring/metrics?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('Failed to load monitoring metrics:', error);
      }
    };

    loadMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/monitoring/metrics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  if (!metrics) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            OPAL Agents & Workflow Monitoring
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and analytics for OPAL agent performance and system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getHealthColor(metrics.systemHealth.overall)}>
            {getHealthIcon(metrics.systemHealth.overall)}
            <span className="ml-2 capitalize">{metrics.systemHealth.overall}</span>
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-2xl font-bold">
                      {metrics.agentSummary.running + metrics.agentSummary.retrying}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{formatPercentage(metrics.performance.successRate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Timer className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Execution</p>
                    <p className="text-2xl font-bold">{formatDuration(metrics.performance.avgExecutionTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Throughput/Hour</p>
                    <p className="text-2xl font-bold">{metrics.performance.throughputPerHour}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Agent Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeAgentStatus />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Workflow Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Completed', value: metrics.agentSummary.completed, color: 'bg-green-500' },
                    { label: 'Running', value: metrics.agentSummary.running, color: 'bg-blue-500' },
                    { label: 'Failed', value: metrics.agentSummary.failed, color: 'bg-red-500' },
                    { label: 'Idle', value: metrics.agentSummary.idle, color: 'bg-gray-400' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                      <Progress
                        value={(value / metrics.agentSummary.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Real-time Agent Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RealTimeAgentStatus className="scale-150 origin-top-left" />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries({
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
                }).map(([agentId, config]) => (
                  <Card key={agentId} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm">{config.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Runtime</span>
                          <span>{formatDuration(config.estimated_runtime_ms)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Timeout</span>
                          <span>{formatDuration(config.timeout_threshold_ms)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-purple-600" />
                  Execution Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatDuration(metrics.performance.avgExecutionTime)}
                      </p>
                      <p className="text-sm text-gray-600">Avg Execution Time</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {metrics.performance.throughputPerHour}
                      </p>
                      <p className="text-sm text-gray-600">Workflows/Hour</p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {formatPercentage(metrics.performance.successRate)}
                    </p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Error Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Webhook Errors', value: metrics.errorSummary.webhookErrors, icon: Webhook },
                    { label: 'Timeout Errors', value: metrics.errorSummary.timeoutErrors, icon: Clock },
                    { label: 'System Errors', value: metrics.errorSummary.systemErrors, icon: Server }
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Badge variant={value > 0 ? "destructive" : "secondary"}>
                        {value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-600" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    label: 'Memory Usage',
                    value: metrics.systemHealth.memoryUsage,
                    icon: Database,
                    color: metrics.systemHealth.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'
                  },
                  {
                    label: 'CPU Usage',
                    value: metrics.systemHealth.cpuUsage,
                    icon: Cpu,
                    color: metrics.systemHealth.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'
                  },
                  {
                    label: 'Disk Usage',
                    value: metrics.systemHealth.diskUsage,
                    icon: HardDrive,
                    color: metrics.systemHealth.diskUsage > 80 ? 'text-red-600' : 'text-green-600'
                  }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className={`text-sm font-bold ${color}`}>
                        {formatPercentage(value)}
                      </span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Network & API Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(metrics.systemHealth.apiLatency)}ms
                    </p>
                    <p className="text-sm text-gray-600">API Latency</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(metrics.systemHealth.webhookSuccessRate)}
                    </p>
                    <p className="text-sm text-gray-600">Webhook Success</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()} |
          Auto-refresh: 30s |
          Timeframe: {timeframe}
        </p>
      </div>
    </div>
  );
}