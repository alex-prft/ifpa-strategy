'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResultsNavigation from './ResultsNavigation';
import MobileResultsNavigation from './MobileResultsNavigation';
import ResultsProgressTracker from './ResultsProgressTracker';
import ModernMaturityPlanDisplay from './ModernMaturityPlanDisplay';
import MaturityAnalyticsDashboard from './MaturityAnalyticsDashboard';
import EnhancedAnalyticsDashboard from './EnhancedAnalyticsDashboard';
import ABTestBlueprintGenerator from './ABTestBlueprintGenerator';
import AudienceSyncRecommendations from './AudienceSyncRecommendations';
import ContentPerformanceScoring from './ContentPerformanceScoring';
import AEOAuditDashboard from './AEOAuditDashboard';
import AIExperimentationRecommendations from './AIExperimentationRecommendations';
import AIPersonalizationRecommendations from './AIPersonalizationRecommendations';
import DataInsightsDashboard from './DataInsightsDashboard';
import TalkToYourData from './TalkToYourData';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import {
  Search,
  Filter,
  Download,
  Share2,
  BookOpen,
  Target,
  Zap,
  Users,
  BarChart3,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface EnhancedResultsPageProps {
  workflowResult: OSAWorkflowOutput;
}

const navigationTabs = [
  {
    id: 'ttyd',
    label: 'Talk To Your Data',
    description: 'Interactive data exploration and insights',
    status: 'completed' as const,
    progress: 100,
    itemCount: 0,
    icon: MessageSquare
  },
  {
    id: 'strategy',
    label: 'Strategy Overview',
    description: 'Strategic maturity plan and analytics',
    status: 'completed' as const,
    progress: 100,
    itemCount: 8,
    icon: Target
  },
  {
    id: 'content',
    label: 'Content Analysis',
    description: 'AEO audit and content performance',
    status: 'completed' as const,
    progress: 100,
    itemCount: 12,
    icon: BookOpen
  },
  {
    id: 'experimentation',
    label: 'Experimentation',
    description: 'A/B test blueprints and recommendations',
    status: 'in-progress' as const,
    progress: 75,
    itemCount: 6,
    icon: Zap
  },
  {
    id: 'personalization',
    label: 'Personalization',
    description: 'AI-driven personalization strategies',
    status: 'in-progress' as const,
    progress: 60,
    itemCount: 4,
    icon: Users
  },
  {
    id: 'data-insights',
    label: 'Data Insights',
    description: 'Analytics and performance metrics',
    status: 'pending' as const,
    progress: 30,
    itemCount: 15,
    icon: BarChart3
  },
  {
    id: 'more',
    label: 'Additional Tools',
    description: 'Enhanced analytics and audience sync',
    status: 'pending' as const,
    progress: 20,
    itemCount: 5,
    icon: MoreHorizontal
  }
];

const progressItems = [
  {
    id: 'maturity-assessment',
    title: 'Digital Maturity Assessment',
    description: 'Complete evaluation of current digital capabilities and roadmap',
    status: 'completed' as const,
    progress: 100,
    priority: 'high' as const,
    impact: 'positive' as const,
    completedAt: new Date()
  },
  {
    id: 'content-audit',
    title: 'Content Performance Audit',
    description: 'Analysis of content effectiveness and optimization opportunities',
    status: 'completed' as const,
    progress: 100,
    priority: 'high' as const,
    impact: 'positive' as const,
    completedAt: new Date()
  },
  {
    id: 'ab-testing',
    title: 'A/B Testing Framework',
    description: 'Experimental design and testing recommendations',
    status: 'in-progress' as const,
    progress: 75,
    priority: 'medium' as const,
    impact: 'positive' as const,
    estimatedTime: '2 days',
    actionRequired: true
  },
  {
    id: 'personalization-engine',
    title: 'Personalization Engine Setup',
    description: 'Configuration of AI-driven personalization capabilities',
    status: 'in-progress' as const,
    progress: 60,
    priority: 'high' as const,
    impact: 'positive' as const,
    estimatedTime: '3 days'
  },
  {
    id: 'data-integration',
    title: 'Data Integration & Analytics',
    description: 'Connect data sources and establish reporting framework',
    status: 'pending' as const,
    progress: 30,
    priority: 'medium' as const,
    impact: 'neutral' as const,
    estimatedTime: '5 days'
  },
  {
    id: 'audience-sync',
    title: 'Audience Synchronization',
    description: 'Sync audience segments across marketing platforms',
    status: 'error' as const,
    progress: 10,
    priority: 'low' as const,
    impact: 'negative' as const,
    actionRequired: true
  }
];

export default function EnhancedResultsPage({ workflowResult }: EnhancedResultsPageProps) {
  const [currentTab, setCurrentTab] = useState('ttyd');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchExpanded(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }

      // Escape to close search
      if (event.key === 'Escape' && isSearchExpanded) {
        setIsSearchExpanded(false);
        setSearchQuery('');
      }

      // Arrow keys for tab navigation
      if (event.altKey) {
        const currentIndex = navigationTabs.findIndex(tab => tab.id === currentTab);
        if (event.key === 'ArrowLeft' && currentIndex > 0) {
          event.preventDefault();
          setCurrentTab(navigationTabs[currentIndex - 1].id);
        }
        if (event.key === 'ArrowRight' && currentIndex < navigationTabs.length - 1) {
          event.preventDefault();
          setCurrentTab(navigationTabs[currentIndex + 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, isSearchExpanded]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
    console.log('Searching for:', query);
  };

  const handleFilter = (filters: string[]) => {
    // Implement filter logic here
    console.log('Applying filters:', filters);
  };

  const handleExport = (tabId: string) => {
    // Implement export logic here
    console.log('Exporting tab:', tabId);
  };

  const handleShare = (tabId: string) => {
    // Implement share logic here
    console.log('Sharing tab:', tabId);
  };

  const handleProgressItemClick = (itemId: string) => {
    // Navigate to relevant section based on item
    const itemTabMapping: Record<string, string> = {
      'maturity-assessment': 'strategy',
      'content-audit': 'content',
      'ab-testing': 'experimentation',
      'personalization-engine': 'personalization',
      'data-integration': 'data-insights',
      'audience-sync': 'more'
    };

    if (itemTabMapping[itemId]) {
      setCurrentTab(itemTabMapping[itemId]);
    }
  };

  const handleProgressItemAction = (itemId: string, action: string) => {
    console.log('Progress item action:', itemId, action);
    // Implement specific actions based on item and action type
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'ttyd':
        return <TalkToYourData workflowResult={workflowResult} />;
      case 'strategy':
        return (
          <div className="space-y-6">
            <ModernMaturityPlanDisplay workflowResult={workflowResult} />
            <MaturityAnalyticsDashboard workflowResult={workflowResult} />
          </div>
        );
      case 'content':
        return (
          <div className="space-y-6">
            <AEOAuditDashboard workflowResult={workflowResult} />
            <ContentPerformanceScoring />
          </div>
        );
      case 'experimentation':
        return (
          <div className="space-y-6">
            <ABTestBlueprintGenerator />
            <AIExperimentationRecommendations />
          </div>
        );
      case 'personalization':
        return (
          <div className="space-y-6">
            <AIPersonalizationRecommendations />
          </div>
        );
      case 'data-insights':
        return (
          <div className="space-y-6">
            <DataInsightsDashboard />
          </div>
        );
      case 'more':
        return (
          <div className="space-y-6">
            <EnhancedAnalyticsDashboard workflowResult={workflowResult} />
            <AudienceSyncRecommendations />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Navigation */}
      <MobileResultsNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        tabs={navigationTabs}
        onSearch={handleSearch}
        onFilter={handleFilter}
      />

      <div className="flex">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block">
          <ResultsNavigation
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            tabs={navigationTabs}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onExport={handleExport}
            onShare={handleShare}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-80">
        {/* Top Search Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Search */}
              <div className={`relative transition-all duration-300 ${
                isSearchExpanded ? 'w-96' : 'w-64'
              }`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  type="text"
                  placeholder="Search results... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                  className="pl-10 pr-4 border-2 focus:border-blue-500"
                />
              </div>

              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Searching: "{searchQuery}"
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProgressTracker(!showProgressTracker)}
                className="gap-2"
              >
                {showProgressTracker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Progress
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export All
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Tracker (Collapsible) */}
          {showProgressTracker && (
            <div className="transition-all duration-300">
              <ResultsProgressTracker
                items={progressItems}
                onItemClick={handleProgressItemClick}
                onItemAction={handleProgressItemAction}
                title="Implementation Progress"
              />
            </div>
          )}

          {/* Tab Content */}
          <div className="transition-all duration-300">
            {renderTabContent()}
          </div>

          {/* Keyboard Shortcuts Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Ctrl+K</kbd>
                <span>Search</span>
                <span className="text-blue-600">•</span>
                <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Alt+←/→</kbd>
                <span>Navigate tabs</span>
                <span className="text-blue-600">•</span>
                <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Esc</kbd>
                <span>Close search</span>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}