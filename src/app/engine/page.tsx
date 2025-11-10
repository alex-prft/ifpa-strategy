'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import OSAWorkflowForm from '@/components/OSAWorkflowForm';
import ModernMaturityPlanDisplay from '@/components/ModernMaturityPlanDisplay';
import MaturityAnalyticsDashboard from '@/components/MaturityAnalyticsDashboard';
import LoadingResultsPage from '@/components/LoadingResultsPage';
import PasswordProtection from '@/components/PasswordProtection';
import ForceSyncButton from '@/components/ForceSyncButton';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function EnginePage() {
  const [workflowResult, setWorkflowResult] = useState<OSAWorkflowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleWorkflowComplete = (result: OSAWorkflowOutput) => {
    // Save result to sessionStorage for the results page
    sessionStorage.setItem('osa_latest_result', JSON.stringify(result));

    // Redirect to results page
    router.push('/engine/results');
  };

  const handleWorkflowStart = () => {
    setIsLoading(true);
    setShowLoadingAnimation(true);
    setWorkflowResult(null);
  };

  const handleLoadingAnimationComplete = () => {
    setShowLoadingAnimation(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <PasswordProtection onAuthenticated={handleAuthenticated}>
        <div />
      </PasswordProtection>
    );
  }

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
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <div id="logo-icon" className="rounded-lg p-3">
                  <Image
                    src="/images/gradient-orb.png"
                    alt="Optimizely Strategy Assistant"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Strategy Results</h1>
                  <p className="text-muted-foreground text-sm">AI Personalization Strategy</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
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
                          <span>Strategy Assessment</span>
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
              <Link href="/" id="logo-icon-header" className="rounded-lg p-3">
                <Image
                  src="/images/gradient-orb.png"
                  alt="Optimizely Strategy Assistant"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Opal Strategy Engine</h1>
                <p className="text-muted-foreground">Generate your personalized strategy with AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ForceSyncButton variant="button" size="sm" />
              <span className="text-sm text-muted-foreground">BETA v1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Generate Your Customized Recommendations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Answer a few questions about your current setup and goals to get started
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 pb-16" id="assessment-form">
        <Card className="max-w-4xl mx-auto shadow-lg bg-white">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Complete Your Strategy Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <OSAWorkflowForm
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
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Opal Personalization Generator from Perficient. Powered by Opal AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}