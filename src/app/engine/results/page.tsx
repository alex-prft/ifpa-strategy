'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingResultsPage from '@/components/LoadingResultsPage';
import PasswordProtection from '@/components/PasswordProtection';
import ResultsSidebar from '@/components/ResultsSidebar';
import TalkToYourData from '@/components/TalkToYourData';
import { ServiceStatusProvider, useServiceErrorListener } from '@/components/ServiceStatusProvider';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function ResultsPageContent() {
  const [workflowResult, setWorkflowResult] = useState<OSAWorkflowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [skipAuth, setSkipAuth] = useState(false);

  // Initialize service error listener
  useServiceErrorListener();

  useEffect(() => {
    // Check for skipAuth parameter
    const urlParams = new URLSearchParams(window.location.search);
    const shouldSkipAuth = urlParams.get('skipAuth') === 'true';
    setSkipAuth(shouldSkipAuth);

    // Try to get results from sessionStorage or URL params
    const resultId = urlParams.get('id');

    if (resultId) {
      // In a real app, you'd fetch the result by ID from your API
      // For now, check sessionStorage
      const savedResult = sessionStorage.getItem(`osa_result_${resultId}`);
      if (savedResult) {
        try {
          setWorkflowResult(JSON.parse(savedResult));
        } catch (error) {
          console.error('Failed to parse saved result:', error);
        }
      }
    } else {
      // Check for the latest result in sessionStorage
      const latestResult = sessionStorage.getItem('osa_latest_result');
      if (latestResult) {
        try {
          setWorkflowResult(JSON.parse(latestResult));
        } catch (error) {
          console.error('Failed to parse latest result:', error);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated && !skipAuth) {
    return (
      <PasswordProtection onAuthenticated={handleAuthenticated}>
        <div />
      </PasswordProtection>
    );
  }

  if (isLoading) {
    return <LoadingResultsPage onComplete={() => setIsLoading(false)} />;
  }

  if (!workflowResult) {
    return (
      <div id="no-results-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div id="no-results-page-layout" className="flex">
          {/* Sidebar Navigation */}
          <ResultsSidebar />

          {/* Main Content */}
          <main id="no-results-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div id="no-results-centered-content" className="flex items-center justify-center min-h-[80vh]">
              <Card id="no-results-card" className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div id="no-results-content" className="space-y-4">
                    <div id="no-results-icon" className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Image
                        src="/images/gradient-orb.png"
                        alt="Opal AI"
                        width={32}
                        height={32}
                        className="rounded-lg"
                      />
                    </div>
                    <div id="no-results-text">
                      <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                      <p className="text-muted-foreground mb-6">
                        It looks like you haven't generated a strategy yet. Let's create one!
                      </p>
                      <Link href="/engine">
                        <Button id="generate-strategy-btn" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Generate Strategy
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="results-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div id="results-page-layout" className="flex">
          {/* Sidebar Navigation */}
          <ResultsSidebar />

          {/* Main Content - TTYD Interface */}
          <main id="results-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <TalkToYourData workflowResult={workflowResult} />
          </main>
        </div>
      </div>
      <ServiceStatusFooter />
    </>
  );
}

export default function EngineResultsPage() {
  return (
    <ServiceStatusProvider>
      <ResultsPageContent />
    </ServiceStatusProvider>
  );
}