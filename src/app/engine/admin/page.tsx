'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar, Settings, Database, Users, TrendingUp, AlertCircle, Save, RefreshCw, Webhook, Activity, CheckCircle, XCircle, TestTube, Key, BarChart, Map, FileText, Cog, Layers } from 'lucide-react';
import ForceSyncButton from '@/components/ForceSyncButton';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import OpalWorkflowManager from '@/components/OpalWorkflowManager';
import { ServiceStatusProvider, useServiceErrorListener } from '@/components/ServiceStatusProvider';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import EnhancedOpalMonitoringDashboard from '@/components/EnhancedOpalMonitoringDashboard';
import Link from 'next/link';
import Image from 'next/image';

// Mock OPAL mapping data for demonstration - In production, this would be loaded from the OPAL configuration API
const opalMappingData = {
  "Strategy Plans": {
    "OSA": {
      "opal_instructions": ["company-overview", "marketing-strategy"],
      "opal_agents": ["strategy_assistant_workflow"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },
    "Quick Wins": {
      "opal_instructions": ["company-overview", "marketing-strategy"],
      "opal_agents": ["strategy_assistant_workflow"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },
    "Maturity": {
      "opal_instructions": ["personalization-maturity-rubric", "personas"],
      "opal_agents": ["strategy_assistant_workflow"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },
    "Phases": {
      "opal_instructions": ["marketing-strategy", "technical-implementation-guidelines"],
      "opal_agents": ["strategy_assistant_workflow", "personalization_idea_generator"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },
    "Roadmap": {
      "opal_instructions": ["technical-implementation-guidelines", "company-overview"],
      "opal_agents": ["strategy_assistant_workflow"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    }
  },
  "Optimizely DXP Tools": {
    "Content Recs": {
      "opal_instructions": ["content-guidelines"],
      "opal_agents": ["content_review"],
      "opal_tools": ["osa_contentrecs_tools"],
      "optimizely_dxp_tools": ["Content Recs"]
    },
    "CMS": {
      "opal_instructions": ["content-guidelines", "data-governance-privacy", "technical-implementation-guidelines"],
      "opal_agents": ["content_review"],
      "opal_tools": ["osa_cmspaas_tools"],
      "optimizely_dxp_tools": ["CMS"]
    },
    "ODP": {
      "opal_instructions": ["data-governance-privacy", "personas"],
      "opal_agents": ["audience_suggester"],
      "opal_tools": ["osa_odp_tools"],
      "optimizely_dxp_tools": ["ODP"]
    },
    "WEBX": {
      "opal_instructions": ["technical-implementation-guidelines"],
      "opal_agents": ["experiment_blueprinter"],
      "opal_tools": ["osa_webx_tools"],
      "optimizely_dxp_tools": ["WEBX"]
    },
    "CMP": {
      "opal_instructions": ["data-governance-privacy", "technical-implementation-guidelines"],
      "opal_agents": ["cmp_organizer"],
      "opal_tools": ["osa_cmp_tools"],
      "optimizely_dxp_tools": ["CMP"]
    }
  },
  "Analytics Insights": {
    "OSA": {
      "opal_instructions": ["content-guidelines", "personas", "data-governance-privacy", "kpi-experimentation"],
      "opal_agents": ["content_review"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "CMP"]
    },
    "Content": {
      "opal_instructions": ["content-guidelines", "brand-tone-guidelines", "kpi-experimentation"],
      "opal_agents": ["content_review"],
      "opal_tools": ["workflow_data_sharing"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "CMP"]
    }
  },
  "Experience Optimization": {
    "Content": {
      "opal_instructions": ["content-guidelines", "brand-tone-guidelines"],
      "opal_agents": ["content_review"],
      "opal_tools": ["osa_contentrecs_tools"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },
    "Experimentation": {
      "opal_instructions": ["kpi-experimentation", "technical-implementation-guidelines"],
      "opal_agents": ["experiment_blueprinter"],
      "opal_tools": ["osa_webx_tools"],
      "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    }
  }
};

const agentConfigurations = {
  "strategy_assistant_workflow": {
    "name": "Strategy Assistant Workflow",
    "description": "Primary agent for processing strategic planning inputs and generating comprehensive recommendations",
    "capabilities": ["Strategic planning analysis", "Maturity assessment scoring", "ROI projection calculations"],
    "instructions_required": ["company-overview", "marketing-strategy", "technical-implementation-guidelines"],
    "tools_used": ["workflow_data_sharing"]
  },
  "content_review": {
    "name": "Content Review Agent",
    "description": "Specialized agent for analyzing content performance, engagement metrics, and optimization opportunities",
    "capabilities": ["Content performance analysis", "NLP topic analysis", "Engagement scoring"],
    "instructions_required": ["content-guidelines", "brand-tone-guidelines", "kpi-experimentation"],
    "tools_used": ["osa_contentrecs_tools", "osa_cmspaas_tools", "workflow_data_sharing"]
  },
  "audience_suggester": {
    "name": "Audience Suggestion Agent",
    "description": "Agent focused on audience analysis, segmentation, and personalization strategy development",
    "capabilities": ["Audience segmentation analysis", "Behavioral pattern recognition", "Personalization strategy development"],
    "instructions_required": ["personas", "data-governance-privacy", "kpi-experimentation"],
    "tools_used": ["osa_odp_tools", "workflow_data_sharing"]
  },
  "experiment_blueprinter": {
    "name": "Experiment Blueprint Agent",
    "description": "Specialized agent for A/B test planning, statistical analysis, and experimentation strategy",
    "capabilities": ["A/B test blueprint generation", "Statistical significance calculations", "Experiment design optimization"],
    "instructions_required": ["kpi-experimentation", "technical-implementation-guidelines"],
    "tools_used": ["osa_webx_tools"]
  }
};

const instructionConfigurations = {
  "company-overview": {
    "filename": "company-overview.md",
    "title": "Company Overview Guidelines",
    "description": "Foundational company information, business objectives, and strategic context for OPAL analysis",
    "content_type": "guideline",
    "applicable_areas": ["Strategy Plans"]
  },
  "marketing-strategy": {
    "filename": "marketing-strategy.md",
    "title": "Marketing Strategy Framework",
    "description": "Marketing goals, target audiences, competitive positioning, and strategic objectives",
    "content_type": "framework",
    "applicable_areas": ["Strategy Plans"]
  },
  "content-guidelines": {
    "filename": "content-guidelines.md",
    "title": "Content Performance Guidelines",
    "description": "Content creation standards, performance metrics, and optimization criteria",
    "content_type": "guideline",
    "applicable_areas": ["Analytics Insights", "Experience Optimization", "Optimizely DXP Tools"]
  },
  "data-governance-privacy": {
    "filename": "data-governance-privacy.md",
    "title": "Data Governance and Privacy Standards",
    "description": "Privacy compliance, data handling protocols, and governance framework for customer data",
    "content_type": "framework",
    "applicable_areas": ["Analytics Insights", "Optimizely DXP Tools"]
  }
};

const toolConfigurations = {
  "workflow_data_sharing": {
    "name": "Workflow Data Sharing Tool",
    "description": "Central data orchestration tool for sharing insights between OPAL agents and consolidating analysis results",
    "dxp_integration": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"],
    "data_sources": ["User form inputs", "Strategic objectives", "Historical analysis results"],
    "output_format": "Structured JSON with cross-agent insights"
  },
  "osa_contentrecs_tools": {
    "name": "Content Recommendations Integration Tool",
    "description": "Interface for Content Recs visitor behavior analytics, topic analysis, and personalization effectiveness metrics",
    "dxp_integration": ["Content Recs"],
    "data_sources": ["Visitor behavior tracking", "Content engagement metrics", "NLP topic analysis"],
    "output_format": "Content performance analytics and recommendations"
  },
  "osa_webx_tools": {
    "name": "Web Experimentation Integration Tool",
    "description": "Interface for WEBX experiment results, statistical analysis, and testing program management",
    "dxp_integration": ["WEBX"],
    "data_sources": ["A/B test results and statistical data", "Conversion impact measurements", "Test velocity and win rates"],
    "output_format": "Experimentation insights and test blueprints"
  }
};

const dxpToolConfigurations = {
  "Content Recs": {
    "name": "Optimizely Content Recommendations",
    "description": "AI-powered content recommendation engine with visitor behavior analytics and NLP topic analysis",
    "api_endpoints": ["/api/contentrecs/visitor-behavior", "/api/contentrecs/topic-analysis"],
    "data_types": ["visitor_behavior_tracking", "content_engagement_metrics", "nlp_topic_analysis"],
    "integration_status": "simulated"
  },
  "CMS": {
    "name": "Optimizely Content Management System",
    "description": "Headless CMS with content performance analytics and workflow optimization",
    "api_endpoints": ["/api/cms/content-analytics", "/api/cms/workflow-efficiency"],
    "data_types": ["page_view_analytics", "content_model_performance", "editor_workflow_metrics"],
    "integration_status": "simulated"
  },
  "ODP": {
    "name": "Optimizely Data Platform",
    "description": "Unified customer data platform with audience intelligence and predictive analytics",
    "api_endpoints": ["/api/odp/unified-profiles", "/api/odp/audience-intelligence"],
    "data_types": ["unified_customer_profiles", "cross_channel_behavioral_data", "audience_segmentation_quality"],
    "integration_status": "simulated"
  },
  "WEBX": {
    "name": "Optimizely Web Experimentation",
    "description": "A/B testing platform with statistical analysis and experiment program management",
    "api_endpoints": ["/api/webx/experiment-results", "/api/webx/statistical-analysis"],
    "data_types": ["ab_test_results", "statistical_significance_data", "conversion_impact_measurements"],
    "integration_status": "simulated"
  },
  "CMP": {
    "name": "Campaign Management Platform",
    "description": "Email marketing and multi-channel campaign orchestration with performance analytics",
    "api_endpoints": ["/api/cmp/email-performance", "/api/cmp/send-optimization"],
    "data_types": ["email_engagement_metrics", "send_time_optimization_data", "cross_channel_campaign_attribution"],
    "integration_status": "simulated"
  }
};

interface ConfigurationSettings {
  maturityWeights: {
    analytics: number;
    personalization: number;
    testing: number;
    optimization: number;
  };
  recommendationEngine: {
    confidenceThreshold: number;
    maxRecommendations: number;
    includeIndustryBenchmarks: boolean;
    prioritizeQuickWins: boolean;
  };
  dataIntegrations: {
    salesforce: {
      enabled: boolean;
      refreshInterval: number;
      syncFields: string[];
    };
    ga4: {
      enabled: boolean;
      lookbackDays: number;
      includeBehaviorData: boolean;
    };
    optimizely: {
      enabled: boolean;
      includeArchivedExperiments: boolean;
      minimumSampleSize: number;
    };
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    weeklyReports: boolean;
  };
}

interface InfluenceFactors {
  formResponses: {
    currentPhase: string;
    targetPhase: string;
    industryFocus: string;
    teamSize: number;
    budget: string;
    timeline: string;
    influence: number;
  };
  analyticsData: {
    trafficVolume: number;
    conversionRate: number;
    segmentCount: number;
    influence: number;
  };
  integrationHealth: {
    salesforce: 'healthy' | 'warning' | 'error';
    ga4: 'healthy' | 'warning' | 'error';
    optimizely: 'healthy' | 'warning' | 'error';
    sendgrid: 'healthy' | 'warning' | 'error';
    influence: number;
  };
}

function AdminPageContent() {

  const [config, setConfig] = useState<ConfigurationSettings>({
    maturityWeights: {
      analytics: 25,
      personalization: 30,
      testing: 25,
      optimization: 20
    },
    recommendationEngine: {
      confidenceThreshold: 0.7,
      maxRecommendations: 8,
      includeIndustryBenchmarks: true,
      prioritizeQuickWins: false
    },
    dataIntegrations: {
      salesforce: {
        enabled: true,
        refreshInterval: 24,
        syncFields: ['engagement_score', 'lifecycle_stage', 'customer_tier']
      },
      ga4: {
        enabled: true,
        lookbackDays: 90,
        includeBehaviorData: true
      },
      optimizely: {
        enabled: true,
        includeArchivedExperiments: true,
        minimumSampleSize: 1000
      }
    },
    notifications: {
      emailEnabled: true,
      slackEnabled: false,
      weeklyReports: true
    }
  });

  const [influenceFactors, setInfluenceFactors] = useState<InfluenceFactors>({
    formResponses: {
      currentPhase: 'Explore',
      targetPhase: 'Run',
      industryFocus: 'Fresh Produce',
      teamSize: 8,
      budget: '$50k-100k',
      timeline: '6 months',
      influence: 35
    },
    analyticsData: {
      trafficVolume: 87340,
      conversionRate: 2.4,
      segmentCount: 12,
      influence: 25
    },
    integrationHealth: {
      salesforce: 'healthy',
      ga4: 'healthy',
      optimizely: 'warning',
      sendgrid: 'healthy',
      influence: 40
    }
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize service error listener
  useServiceErrorListener();

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Simulate API call to save configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ConfigurationSettings],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const updateNestedConfig = (section: string, subsection: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ConfigurationSettings],
        [subsection]: {
          ...(prev[section as keyof ConfigurationSettings] as any)[subsection],
          [key]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'Operational';
      case 'warning': return 'Issues Detected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  // Webhook Management Section Component
  function WebhookManagementSection() {
    const [webhookStatus, setWebhookStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

    const fetchWebhookStatus = async () => {
      const controller = new AbortController();
      setAbortController(controller);
      setLoading(true);
      setShowLoadingOverlay(true);

      try {
        const response = await fetch('/api/webhooks/management', {
          signal: controller.signal
        });
        const data = await response.json();
        setWebhookStatus(data);
        setShowLoadingOverlay(false);
      } catch (error) {
        setShowLoadingOverlay(false);

        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Webhook status fetch was cancelled by user');
          return;
        }

        console.error('Failed to fetch webhook status:', error);
      } finally {
        setLoading(false);
        setAbortController(null);
      }
    };

    const handleCancelWebhookLoad = () => {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      setShowLoadingOverlay(false);
      setLoading(false);
    };

    useEffect(() => {
      fetchWebhookStatus();
    }, []);

    const testWebhook = async (provider: 'ga4' | 'salesforce') => {
      try {
        const response = await fetch(`/api/webhooks/management?action=test&provider=${provider}`);
        const result = await response.json();
        alert(result.message);
        fetchWebhookStatus(); // Refresh status
      } catch (error) {
        alert(`Failed to test ${provider} webhook`);
      }
    };

    const clearErrors = async (provider: 'ga4' | 'salesforce') => {
      try {
        const response = await fetch('/api/webhooks/management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_errors', provider })
        });
        const result = await response.json();
        alert(result.message);
        fetchWebhookStatus(); // Refresh status
      } catch (error) {
        alert(`Failed to clear ${provider} errors`);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Real-time Data Sync Status
            </CardTitle>
            <p className="text-sm text-gray-600">
              Monitor and manage webhook endpoints for real-time data synchronization
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Loading webhook status...</span>
              </div>
            ) : webhookStatus ? (
              <div className="space-y-6">
                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {webhookStatus.system_info.webhook_processing_enabled ? 'ON' : 'OFF'}
                    </div>
                    <div className="text-sm text-gray-600">Processing Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{webhookStatus.system_info.uptime}</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{webhookStatus.system_info.memory_usage}</div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE || 100}/min
                    </div>
                    <div className="text-sm text-gray-600">Rate Limit</div>
                  </div>
                </div>

                {/* GA4 Webhook */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Google Analytics 4 Webhook</h3>
                          <p className="text-sm text-gray-600">{webhookStatus.webhooks.ga4.endpoint}</p>
                        </div>
                      </div>
                      {webhookStatus.webhooks.ga4.enabled ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {webhookStatus.webhooks.ga4.total_received}
                        </div>
                        <div className="text-xs text-gray-600">Total Received</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.ga4.error_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Error Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {webhookStatus.webhooks.ga4.last_received
                            ? new Date(webhookStatus.webhooks.ga4.last_received).toLocaleString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-600">Last Received</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => testWebhook('ga4')}>
                          <TestTube className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => clearErrors('ga4')}>
                          Clear Errors
                        </Button>
                      </div>
                    </div>

                    {webhookStatus.webhooks.ga4.recent_errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors:</h4>
                        <ul className="text-xs text-red-700 space-y-1">
                          {webhookStatus.webhooks.ga4.recent_errors.map((error: string, index: number) => (
                            <li key={index} className="truncate">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Salesforce Webhook */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Database className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Salesforce CRM Webhook</h3>
                          <p className="text-sm text-gray-600">{webhookStatus.webhooks.salesforce.endpoint}</p>
                        </div>
                      </div>
                      {webhookStatus.webhooks.salesforce.enabled ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.salesforce.total_received}
                        </div>
                        <div className="text-xs text-gray-600">Total Received</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.salesforce.error_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Error Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {webhookStatus.webhooks.salesforce.last_received
                            ? new Date(webhookStatus.webhooks.salesforce.last_received).toLocaleString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-600">Last Received</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => testWebhook('salesforce')}>
                          <TestTube className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => clearErrors('salesforce')}>
                          Clear Errors
                        </Button>
                      </div>
                    </div>

                    {webhookStatus.webhooks.salesforce.recent_errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors:</h4>
                        <ul className="text-xs text-red-700 space-y-1">
                          {webhookStatus.webhooks.salesforce.recent_errors.map((error: string, index: number) => (
                            <li key={index} className="truncate">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Webhook Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Webhook Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-medium">GA4 Webhook URL</Label>
                          <div className="p-3 bg-gray-100 rounded-md text-sm font-mono">
                            {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ga4
                          </div>
                          <p className="text-xs text-gray-600">
                            Configure this URL in your GA4 property settings for real-time data sync
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Salesforce Webhook URL</Label>
                          <div className="p-3 bg-gray-100 rounded-md text-sm font-mono">
                            {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/salesforce
                          </div>
                          <p className="text-xs text-gray-600">
                            Configure this URL in your Salesforce org's outbound messaging or Process Builder
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Refresh webhook status</span>
                          <Button size="sm" variant="outline" onClick={fetchWebhookStatus}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Failed to load webhook status
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow">
                  <Image
                    src="/images/gradient-orb.png"
                    alt="Optimizely Strategy Assistant"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Admin Configuration</h1>
                <p className="text-muted-foreground text-sm">Opal Assistant for IFPA</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ForceSyncButton />

              <Link href="/engine/results">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  View Results
                </Button>
              </Link>

              <Button
                onClick={handleSaveConfig}
                disabled={!unsavedChanges || saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            System Configuration
          </h2>
          <p className="text-gray-600 mb-6">
            Configure system settings and view influence factors for personalization results
          </p>
        </div>

        {/* Unsaved Changes Alert */}
        {unsavedChanges && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">You have unsaved configuration changes</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="opal-monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="opal-monitoring">OPAL Monitoring</TabsTrigger>
            <TabsTrigger value="strategy-ai">Strategy AI</TabsTrigger>
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
            <TabsTrigger value="data-mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="recommendation-engine">Recommendation Engine</TabsTrigger>
          </TabsList>

          {/* OPAL Monitoring Tab */}
          <TabsContent value="opal-monitoring" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">OPAL Monitoring Dashboard</h2>
                <p className="text-gray-600 mb-6">
                  Real-time monitoring and analytics for OPAL agents, workflows, and integrations
                </p>
              </div>
              <EnhancedOpalMonitoringDashboard />
            </div>
          </TabsContent>

          {/* Strategy AI Tab */}
          <TabsContent value="strategy-ai" className="space-y-6">
            <Tabs defaultValue="influence-factors" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="influence-factors">Influence Factors</TabsTrigger>
                <TabsTrigger value="maturity-scoring">Maturity Scoring</TabsTrigger>
                <TabsTrigger value="roadmap-management">Roadmap Management</TabsTrigger>
              </TabsList>

              {/* Influence Factors Sub-tab */}
              <TabsContent value="influence-factors" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Strategy Influence Factors</h3>
                  <p className="text-gray-600 mb-6">
                    Configure how different data sources influence AI-powered strategy recommendations
                  </p>
                </div>

                {/* Existing Influence Factors Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Form Responses Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Form Responses
                    <Badge variant="secondary">{influenceFactors.formResponses.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Phase</Label>
                    <div className="text-2xl font-bold text-blue-600">
                      {influenceFactors.formResponses.currentPhase}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Phase</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {influenceFactors.formResponses.targetPhase}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-gray-500">Industry</Label>
                      <div className="font-medium">{influenceFactors.formResponses.industryFocus}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Team Size</Label>
                      <div className="font-medium">{influenceFactors.formResponses.teamSize} people</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Budget</Label>
                      <div className="font-medium">{influenceFactors.formResponses.budget}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Timeline</Label>
                      <div className="font-medium">{influenceFactors.formResponses.timeline}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Data Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Analytics Data
                    <Badge variant="secondary">{influenceFactors.analyticsData.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Monthly Sessions</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {influenceFactors.analyticsData.trafficVolume.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Conversion Rate</Label>
                    <div className="text-2xl font-bold text-blue-600">
                      {influenceFactors.analyticsData.conversionRate}%
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs text-gray-500">Active Segments</Label>
                    <div className="text-lg font-medium">{influenceFactors.analyticsData.segmentCount} segments</div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Data Range: Last 90 Days
                  </div>
                </CardContent>
              </Card>

              {/* Integration Health Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    Integration Health
                    <Badge variant="secondary">{influenceFactors.integrationHealth.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(influenceFactors.integrationHealth).filter(([key]) => key !== 'influence').map(([integration, status]) => (
                    <div key={integration} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{integration}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(status as any)}`} />
                        <span className="text-sm text-gray-600">
                          {getHealthStatusText(status as any)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t text-xs text-gray-500">
                    Integration health affects data quality and recommendation confidence
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Influence Weight Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Factor Influence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Form Responses</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.formResponses.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.formResponses.influence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Analytics Data</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.analyticsData.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.analyticsData.influence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Integration Health</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.integrationHealth.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.integrationHealth.influence}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Maturity Scoring Sub-tab */}
              <TabsContent value="maturity-scoring" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Maturity Assessment Configuration</h3>
                  <p className="text-gray-600 mb-6">
                    Configure how different factors contribute to personalization maturity scoring
                  </p>
                </div>
            <Card>
              <CardHeader>
                <CardTitle>Maturity Assessment Weights</CardTitle>
                <p className="text-sm text-gray-600">
                  Adjust how different factors contribute to the overall maturity score
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(config.maturityWeights).map(([category, weight]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize font-medium">{category}</Label>
                      <span className="text-sm font-medium">{weight}%</span>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={(value) => updateConfig('maturityWeights', category, value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">
                      Weight: {weight}% - {category === 'analytics' ? 'Data collection and measurement capabilities' :
                              category === 'personalization' ? 'Content and experience customization' :
                              category === 'testing' ? 'A/B testing and experimentation processes' :
                              'Conversion rate and performance optimization'}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Total: {Object.values(config.maturityWeights).reduce((a, b) => a + b, 0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Roadmap Management Sub-tab */}
              <TabsContent value="roadmap-management" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Strategic Roadmap Management</h3>
                  <p className="text-gray-600 mb-6">
                    Configure AI-driven roadmap generation and strategic timeline planning
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Roadmap Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Roadmap Generation Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default Timeline Horizon</Label>
                        <Select defaultValue="12">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="18">18 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Priority Weighting Algorithm</Label>
                        <Select defaultValue="impact_effort">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="impact_effort">Impact vs Effort Matrix</SelectItem>
                            <SelectItem value="roi_based">ROI-Based Scoring</SelectItem>
                            <SelectItem value="strategic_alignment">Strategic Alignment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto-generate Dependencies</Label>
                        <Switch defaultChecked={true} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Include Resource Planning</Label>
                        <Switch defaultChecked={false} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Roadmap Templates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Roadmap Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Fresh Produce Growth</h4>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Active
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Optimized for fresh produce e-commerce growth strategies
                          </p>
                          <div className="text-xs text-gray-500">Last used: 2 days ago</div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Digital Transformation</h4>
                            <Badge variant="outline">
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Standard digital transformation roadmap template
                          </p>
                          <div className="text-xs text-gray-500">Industry standard</div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Personalization Maturity</h4>
                            <Badge variant="outline">
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Crawl-Walk-Run-Fly progression template
                          </p>
                          <div className="text-xs text-gray-500">Optimizely recommended</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Roadmap Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Current Roadmap Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">23</div>
                        <div className="text-sm text-blue-700 mt-1">Total Initiatives</div>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">8</div>
                        <div className="text-sm text-green-700 mt-1">In Progress</div>
                      </div>

                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">12</div>
                        <div className="text-sm text-orange-700 mt-1">Planned</div>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">3</div>
                        <div className="text-sm text-purple-700 mt-1">Completed</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Next Milestone: Q1 2024</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Launch personalized product recommendations</div>
                            <div className="text-xs text-gray-600">Fresh Produce category</div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            85% complete
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Implement advanced audience segmentation</div>
                            <div className="text-xs text-gray-600">Multi-channel targeting</div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            60% complete
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Configurations Tab */}
          <TabsContent value="configurations" className="space-y-6">
            <Tabs defaultValue="data-integrations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="data-integrations">Data Integrations</TabsTrigger>
                <TabsTrigger value="webhooks">Webhook Management</TabsTrigger>
                <TabsTrigger value="opal-workflows">Opal Workflows</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Data Integrations Tab */}
              <TabsContent value="data-integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Salesforce Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Salesforce Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Salesforce</Label>
                    <Switch
                      checked={config.dataIntegrations.salesforce.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'salesforce', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Refresh Interval (hours)</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.salesforce.refreshInterval}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'salesforce', 'refreshInterval', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Fields</Label>
                    <Textarea
                      value={config.dataIntegrations.salesforce.syncFields.join(', ')}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'salesforce', 'syncFields', e.target.value.split(', '))}
                      placeholder="engagement_score, lifecycle_stage, customer_tier"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Google Analytics 4 Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Google Analytics 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable GA4</Label>
                    <Switch
                      checked={config.dataIntegrations.ga4.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'ga4', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.ga4.lookbackDays}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'ga4', 'lookbackDays', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Behavior Data</Label>
                    <Switch
                      checked={config.dataIntegrations.ga4.includeBehaviorData}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'ga4', 'includeBehaviorData', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optimizely Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimizely Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Optimizely</Label>
                    <Switch
                      checked={config.dataIntegrations.optimizely.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'optimizely', 'enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Archived Experiments</Label>
                    <Switch
                      checked={config.dataIntegrations.optimizely.includeArchivedExperiments}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'optimizely', 'includeArchivedExperiments', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Sample Size</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.optimizely.minimumSampleSize}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'optimizely', 'minimumSampleSize', parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch
                      checked={config.notifications.emailEnabled}
                      onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Slack Notifications</Label>
                    <Switch
                      checked={config.notifications.slackEnabled}
                      onCheckedChange={(checked) => updateConfig('notifications', 'slackEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Weekly Reports</Label>
                    <Switch
                      checked={config.notifications.weeklyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'weeklyReports', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhook Management Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <WebhookManagementSection />
          </TabsContent>

          {/* Opal Workflows Tab */}
          <TabsContent value="opal-workflows" className="space-y-6">
            <OpalWorkflowManager />
          </TabsContent>

          {/* OPAL Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Map className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(opalMappingData).length}</div>
                      <div className="text-sm text-muted-foreground">Dashboard Areas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Cog className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(agentConfigurations).length}</div>
                      <div className="text-sm text-muted-foreground">OPAL Agents</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(instructionConfigurations).length}</div>
                      <div className="text-sm text-muted-foreground">Instructions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Layers className="h-8 w-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(toolConfigurations).length}</div>
                      <div className="text-sm text-muted-foreground">OPAL Tools</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Mapping Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Strategy Dashboard → OPAL Component Mapping
                </CardTitle>
                <p className="text-sm text-gray-600">
                  This shows how each Strategy Dashboard area and tab maps to specific OPAL agents, instructions, tools, and DXP integrations
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(opalMappingData).map(([areaName, areaSections]) => (
                    <div key={areaName} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 text-blue-700">{areaName}</h3>
                      <div className="space-y-4">
                        {Object.entries(areaSections as any).map(([sectionName, sectionData]: [string, any]) => (
                          <div key={sectionName} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-3 text-gray-900">{sectionName}</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* OPAL Agents */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">OPAL Agents</Label>
                                <div className="mt-2 space-y-1">
                                  {sectionData.opal_agents.map((agent: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                      {agent}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* OPAL Instructions */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Instructions</Label>
                                <div className="mt-2 space-y-1">
                                  {sectionData.opal_instructions.map((instruction: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                                      {instruction}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* OPAL Tools */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">OPAL Tools</Label>
                                <div className="mt-2 space-y-1">
                                  {sectionData.opal_tools.map((tool: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs mr-1 mb-1 bg-green-50 text-green-700 border-green-200">
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* DXP Tools */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">DXP Tools</Label>
                                <div className="mt-2 space-y-1">
                                  {sectionData.optimizely_dxp_tools.map((dxpTool: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs mr-1 mb-1 bg-purple-50 text-purple-700 border-purple-200">
                                      {dxpTool}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OPAL Agents Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    OPAL Agent Configurations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(agentConfigurations).map(([agentName, agentConfig]: [string, any]) => (
                      <div key={agentName} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium text-sm">{agentConfig.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{agentConfig.description}</p>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">Capabilities:</span> {agentConfig.capabilities.length} defined
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">Instructions:</span> {agentConfig.instructions_required.join(', ')}
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">Tools:</span> {agentConfig.tools_used.join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* DXP Tool Integration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    DXP Tool Integration Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dxpToolConfigurations).map(([toolName, toolConfig]: [string, any]) => (
                      <div key={toolName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm">{toolConfig.name}</h4>
                          <p className="text-xs text-gray-600">{toolConfig.description}</p>
                          <div className="text-xs mt-1">
                            <span className="font-medium">Endpoints:</span> {toolConfig.api_endpoints.length} configured
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            toolConfig.integration_status === 'connected' ? 'bg-green-500' :
                            toolConfig.integration_status === 'testing' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs capitalize">
                            {toolConfig.integration_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  OSA Mapping System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✓ Configured</div>
                    <div className="text-sm text-green-700 mt-1">Mapping System</div>
                    <div className="text-xs text-green-600 mt-2">
                      All {Object.keys(opalMappingData).length} dashboard areas properly mapped
                    </div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">⚠ Simulated</div>
                    <div className="text-sm text-yellow-700 mt-1">Data Integration</div>
                    <div className="text-xs text-yellow-600 mt-2">
                      All DXP tools currently using simulated data
                    </div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">🔄 Ready</div>
                    <div className="text-sm text-blue-700 mt-1">Live Integration</div>
                    <div className="text-xs text-blue-600 mt-2">
                      Infrastructure ready for real DXP connections
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Next Steps for Production Deployment:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>1. Configure Optimizely API credentials in environment variables</li>
                    <li>2. Enable real-time data connections for each DXP tool</li>
                    <li>3. Test mapping accuracy with live data feeds</li>
                    <li>4. Deploy enhanced personalization engine</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <p className="text-sm text-gray-600">
                      Configure general system behavior and preferences
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Confidence Threshold</Label>
                      <Slider
                        value={[config.recommendationEngine.confidenceThreshold * 100]}
                        onValueChange={(value) => updateConfig('recommendationEngine', 'confidenceThreshold', value[0] / 100)}
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500">
                        Current: {(config.recommendationEngine.confidenceThreshold * 100).toFixed(0)}% - Only show recommendations above this confidence level
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Recommendations</Label>
                      <Input
                        type="number"
                        value={config.recommendationEngine.maxRecommendations}
                        onChange={(e) => updateConfig('recommendationEngine', 'maxRecommendations', parseInt(e.target.value))}
                        min="1"
                        max="20"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Include Industry Benchmarks</Label>
                      <Switch
                        checked={config.recommendationEngine.includeIndustryBenchmarks}
                        onCheckedChange={(checked) => updateConfig('recommendationEngine', 'includeIndustryBenchmarks', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Prioritize Quick Wins</Label>
                      <Switch
                        checked={config.recommendationEngine.prioritizeQuickWins}
                        onCheckedChange={(checked) => updateConfig('recommendationEngine', 'prioritizeQuickWins', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Data Mapping Tab */}
          <TabsContent value="data-mapping" className="space-y-6">
            <Tabs defaultValue="mapping" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="mapping">Mapping</TabsTrigger>
              </TabsList>

              {/* Mapping Sub-tab */}
              <TabsContent value="mapping" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">OPAL Component Mapping</h3>
                  <p className="text-gray-600 mb-6">
                    View and configure how Strategy Dashboard areas map to OPAL agents, tools, and DXP integrations
                  </p>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Source Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Active Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Salesforce CRM</h4>
                        <p className="text-sm text-gray-600">Customer data, engagement scores</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Google Analytics 4</h4>
                        <p className="text-sm text-gray-600">Website behavior, conversion data</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Optimizely DXP</h4>
                        <p className="text-sm text-gray-600">Experiment results, feature flags</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Simulated
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">SendGrid</h4>
                        <p className="text-sm text-gray-600">Email campaign performance</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Field Mapping Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-purple-600" />
                    Field Mapping Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Customer Engagement Score</h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Salesforce: <code>Engagement_Score__c</code></div>
                        <div>GA4: <code>user_engagement_score</code></div>
                        <div>Target: <code>unified_engagement_score</code></div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Lifecycle Stage</h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Salesforce: <code>Lifecycle_Stage__c</code></div>
                        <div>GA4: <code>customer_lifecycle_stage</code></div>
                        <div>Target: <code>normalized_lifecycle_stage</code></div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Conversion Events</h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>GA4: <code>purchase, form_submit</code></div>
                        <div>Optimizely: <code>conversion_event</code></div>
                        <div>Target: <code>unified_conversion_events</code></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Transformation Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Data Transformation Pipeline
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time data processing and normalization status
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">4</div>
                    <div className="text-sm text-blue-700 mt-1">Active Sources</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">15</div>
                    <div className="text-sm text-green-700 mt-1">Mapped Fields</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.3k</div>
                    <div className="text-sm text-purple-700 mt-1">Records/Hour</div>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">99.7%</div>
                    <div className="text-sm text-orange-700 mt-1">Data Quality</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Recommendation Engine Tab */}
          <TabsContent value="recommendation-engine" className="space-y-6">
            <Tabs defaultValue="content-recs" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="content-recs">Content Recs</TabsTrigger>
                <TabsTrigger value="audience-recs">Audience Recs</TabsTrigger>
                <TabsTrigger value="personalization-recs">Personalization Recs</TabsTrigger>
                <TabsTrigger value="experimentation-recs">Experimentation Recs</TabsTrigger>
                <TabsTrigger value="ux-recs">UX Recs</TabsTrigger>
                <TabsTrigger value="ai-recs">AI Recs</TabsTrigger>
              </TabsList>

              {/* Content Recs Sub-tab */}
              <TabsContent value="content-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Content Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    Configure AI-driven content performance analysis and content strategy recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Content Performance Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Content Scoring Algorithm</Label>
                        <Select defaultValue="engagement_driven">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engagement_driven">Engagement-Driven</SelectItem>
                            <SelectItem value="conversion_focused">Conversion-Focused</SelectItem>
                            <SelectItem value="balanced_approach">Balanced Approach</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Auto-detect Content Gaps</Label>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Topic Trend Analysis</Label>
                        <Switch defaultChecked={true} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Content Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-sm">Optimize Fresh Produce Category Pages</div>
                          <div className="text-xs text-gray-600 mt-1">Add seasonal content and nutritional information</div>
                          <div className="text-xs text-blue-600 mt-1">Expected: +15% engagement</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-sm">Create Mobile-First Product Descriptions</div>
                          <div className="text-xs text-gray-600 mt-1">Shorter, scannable content for mobile users</div>
                          <div className="text-xs text-green-600 mt-1">Expected: +22% mobile conversions</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Audience Recs Sub-tab */}
              <TabsContent value="audience-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Audience Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    AI-powered audience segmentation and targeting strategy recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Audience Segmentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Segmentation Granularity</Label>
                        <Slider value={[7]} max={10} min={3} step={1} className="w-full" />
                        <div className="text-sm text-gray-500">Current: 7 segments - Balanced precision vs. actionability</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Dynamic Segment Updates</Label>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Cross-Channel Behavior Analysis</Label>
                        <Switch defaultChecked={false} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        Targeting Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="font-medium text-sm">High-Value Fresh Produce Buyers</div>
                          <div className="text-xs text-gray-600 mt-1">Premium organic produce segment (847 users)</div>
                          <div className="text-xs text-purple-600 mt-1">Conversion rate: 8.2% (+112% vs avg)</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="font-medium text-sm">Mobile-First Convenience Shoppers</div>
                          <div className="text-xs text-gray-600 mt-1">Quick reorder patterns, mobile-heavy (1,234 users)</div>
                          <div className="text-xs text-orange-600 mt-1">Session frequency: 3.4x per week</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Personalization Recs Sub-tab */}
              <TabsContent value="personalization-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personalization Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    Strategic personalization opportunities and implementation recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image
                          src="/images/gradient-orb.png"
                          alt="Optimizely Strategy Assistant"
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        Personalization Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">Product Recommendation Engine</div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">High Impact</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">AI-driven product suggestions based on purchase history</div>
                          <div className="text-xs text-green-600">Expected lift: +24% revenue per session</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">Dynamic Content Blocks</div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Medium Impact</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">Personalized hero banners and category highlights</div>
                          <div className="text-xs text-green-600">Expected lift: +18% engagement</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Implementation Roadmap
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">1</div>
                          <div>
                            <div className="font-medium text-sm">Implement Basic Product Recs</div>
                            <div className="text-xs text-gray-600">Timeline: 2-3 weeks</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-medium">2</div>
                          <div>
                            <div className="font-medium text-sm">Deploy Dynamic Content</div>
                            <div className="text-xs text-gray-600">Timeline: 3-4 weeks</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-medium">3</div>
                          <div>
                            <div className="font-medium text-sm">Advanced ML Algorithms</div>
                            <div className="text-xs text-gray-600">Timeline: 6-8 weeks</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Experimentation Recs Sub-tab */}
              <TabsContent value="experimentation-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Experimentation Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    A/B testing opportunities and experiment design recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-purple-600" />
                        Recommended Experiments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">Checkout Flow Optimization</div>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High Priority</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">Test single-page vs multi-step checkout</div>
                          <div className="text-xs text-blue-600">Expected improvement: 15-25% completion rate</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">Product Card Layout</div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium Priority</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">Compare image-first vs info-first layouts</div>
                          <div className="text-xs text-blue-600">Expected improvement: 8-12% CTR</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-green-600" />
                        Experiment Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">8</div>
                          <div className="text-sm text-green-700 mt-1">Active Experiments</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">73%</div>
                            <div className="text-xs text-blue-700">Win Rate</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">+18%</div>
                            <div className="text-xs text-purple-700">Avg Lift</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* UX Recs Sub-tab */}
              <TabsContent value="ux-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">UX Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    User experience optimization recommendations based on behavior analysis
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-600" />
                        UX Optimization Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium text-sm mb-1">Improve Mobile Search</div>
                          <div className="text-xs text-gray-600 mb-2">38% of mobile users abandon search due to poor autocomplete</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Mobile Priority</Badge>
                            <span className="text-xs text-green-600">+12% conversion potential</span>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium text-sm mb-1">Streamline Category Navigation</div>
                          <div className="text-xs text-gray-600 mb-2">Users require 3.2 avg clicks to reach target products</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Navigation</Badge>
                            <span className="text-xs text-green-600">-45% bounce rate potential</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        User Behavior Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-lg font-bold text-red-600">23%</div>
                            <div className="text-xs text-red-700">Cart Abandonment</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-lg font-bold text-yellow-600">67s</div>
                            <div className="text-xs text-yellow-700">Avg Page Load</div>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium mb-2">Top UX Pain Points</div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>• Slow category page loading</div>
                            <div>• Complex checkout process</div>
                            <div>• Poor mobile filter experience</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* AI Recs Sub-tab */}
              <TabsContent value="ai-recs" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Model Recommendations</h3>
                  <p className="text-gray-600 mb-6">
                    AI model performance analysis and optimization recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image
                          src="/images/gradient-orb.png"
                          alt="Optimizely Strategy Assistant"
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        Model Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Recommendation Confidence Threshold</Label>
                        <Slider value={[0.78]} max={1.0} min={0.5} step={0.01} className="w-full" />
                        <div className="text-sm text-gray-500">Current: 78% - Optimal balance of precision vs coverage</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Model Refresh Frequency</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real-time">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        AI Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">94.2%</div>
                            <div className="text-xs text-green-700">Model Accuracy</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">127ms</div>
                            <div className="text-xs text-blue-700">Avg Response Time</div>
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm font-medium mb-2">Recent Model Updates</div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>• Improved fresh produce seasonality detection (+8% accuracy)</div>
                            <div>• Enhanced mobile user behavior modeling (+12% precision)</div>
                            <div>• Added cross-category preference learning (+15% coverage)</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
      <ServiceStatusFooter />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ServiceStatusProvider>
      <AdminPageContent />
    </ServiceStatusProvider>
  );
}
