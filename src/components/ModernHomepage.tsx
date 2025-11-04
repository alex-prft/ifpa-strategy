'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PMGWorkflowForm from '@/components/PMGWorkflowForm';
import ModernMaturityPlanDisplay from '@/components/ModernMaturityPlanDisplay';
import MaturityAnalyticsDashboard from '@/components/MaturityAnalyticsDashboard';
import LoadingResultsPage from '@/components/LoadingResultsPage';
import { PMGWorkflowOutput } from '@/lib/types/maturity';
import {
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Users,
  Brain,
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function ModernHomepage() {
  const [workflowResult, setWorkflowResult] = useState<PMGWorkflowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  const handleWorkflowComplete = (result: PMGWorkflowOutput) => {
    setWorkflowResult(result);
    setIsLoading(false);
    setShowLoadingAnimation(false);
  };

  const handleWorkflowStart = () => {
    setIsLoading(true);
    setShowLoadingAnimation(true);
    setWorkflowResult(null);
  };

  const handleLoadingAnimationComplete = () => {
    setShowLoadingAnimation(false);
  };

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Strategy",
      description: "Advanced AI analyzes your current capabilities and generates personalized roadmaps"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Data-Driven Insights",
      description: "Comprehensive analytics and benchmarking against industry standards"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Precision Targeting",
      description: "Create highly targeted experiences with advanced audience segmentation"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Measurable Growth",
      description: "Track ROI and performance metrics with real-time analytics dashboards"
    }
  ];

  const maturityPhases = [
    {
      phase: "Crawl",
      title: "Foundation Building",
      description: "A/B testing and simple personalization",
      icon: "🐛",
      color: "from-red-500/10 to-red-500/5 border-red-200"
    },
    {
      phase: "Walk",
      title: "Structured Growth",
      description: "Advanced experimentation and data-driven audiences",
      icon: "🚶",
      color: "from-yellow-500/10 to-yellow-500/5 border-yellow-200"
    },
    {
      phase: "Run",
      title: "Advanced Execution",
      description: "Smart personalization and integrated systems",
      icon: "🏃",
      color: "from-green-500/10 to-green-500/5 border-green-200"
    },
    {
      phase: "Fly",
      title: "Mature Optimization",
      description: "AI-powered omnichannel experiences",
      icon: "🦅",
      color: "from-blue-500/10 to-blue-500/5 border-blue-200"
    }
  ];

  if (showLoadingAnimation) {
    return <LoadingResultsPage onComplete={handleLoadingAnimationComplete} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Finalizing your strategy...</h3>
            <p className="text-muted-foreground text-center">Just a few more moments</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workflowResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Strategy Results</h1>
                  <p className="text-muted-foreground text-sm">AI Personalization Strategy</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setWorkflowResult(null)}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Generate New Strategy
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Tabs defaultValue="strategy" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="strategy">Strategy Plan</TabsTrigger>
              <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
              <TabsTrigger value="mcp">MCP Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy">
              <ModernMaturityPlanDisplay workflowResult={workflowResult} />
            </TabsContent>

            <TabsContent value="analytics">
              <MaturityAnalyticsDashboard workflowResult={workflowResult} />
            </TabsContent>

            <TabsContent value="mcp">
              <Card>
                <CardHeader>
                  <CardTitle>MCP Server Integration</CardTitle>
                  <CardDescription>
                    Model Context Protocol server for AI agent integration with personalization tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Available Tools</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>PMG Maturity Assessment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Audience Profile Lookup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Content Recommendations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Experiment Analytics</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Server Endpoint</h4>
                      <code className="block p-2 bg-muted rounded text-sm">
                        /api/mcp
                      </code>
                      <p className="text-xs text-muted-foreground">
                        RESTful API endpoint implementing Model Context Protocol for AI agent integration
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Accelerate Results with Optimizely Opal</h1>
                <p className="text-muted-foreground">AI Personalization Strategy with your Optimizely Data and Martech Tools</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
                Powered by Perficient
              </Button>
              <span className="text-sm text-muted-foreground">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Start Your Personalization and Experimentation Strategy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accelerate your personalization and experimentation strategy with Opal AI.
              Get data-driven insights and a comprehensive roadmap tailored to your organization.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Maturity Phase Overview */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">4-Phase Maturity Framework</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive framework guides you through progressive stages of personalization maturity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {maturityPhases.map((phase, index) => (
            <Card key={phase.phase} className={`bg-gradient-to-br ${phase.color} border`}>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl mb-2">{phase.icon}</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">{phase.phase.toUpperCase()}</h4>
                    <h5 className="font-semibold text-sm">{phase.title}</h5>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="max-w-4xl mx-auto shadow-lg bg-white">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Get Your Personalized Strategy</CardTitle>
            <CardDescription className="text-lg">
              Complete the assessment below to receive your comprehensive personalization roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PMGWorkflowForm
              onWorkflowStart={handleWorkflowStart}
              onWorkflowComplete={handleWorkflowComplete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Opal Personalization Generator from Perficient. Powered by Opal AI.
            </div>
            <div className="flex space-x-6">
              <Button variant="link" size="sm" asChild>
                <a href="/api/mcp">MCP API</a>
              </Button>
              <Button variant="link" size="sm" asChild>
                <a href="https://github.com/alex-prft/opal-2025">GitHub</a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}