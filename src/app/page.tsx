'use client';

import { useState } from 'react';
import PMGWorkflowForm from '@/components/PMGWorkflowForm';
import MaturityPlanDisplay from '@/components/MaturityPlanDisplay';
import { PMGWorkflowOutput } from '@/lib/types/maturity';

export default function Home() {
  const [workflowResult, setWorkflowResult] = useState<PMGWorkflowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkflowComplete = (result: PMGWorkflowOutput) => {
    setWorkflowResult(result);
    setIsLoading(false);
  };

  const handleWorkflowStart = () => {
    setIsLoading(true);
    setWorkflowResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Accelerate Results with Optimizely Opal
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  AI Personalization Strategy with your Optimizely Data and Martech Tools
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // This will be handled by the form component via a prop
                  if (typeof window !== 'undefined' && (window as any).fillPerficientData) {
                    (window as any).fillPerficientData();
                  }
                }}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
              >
                🚀 Powered by Perficient
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!workflowResult ? (
          /* Workflow Form */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Start Your Personalization and Experimentation Strategy
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Accelerate your personalization and experimentation strategy with Opal AI
                </p>
              </div>

              {/* Phase Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🐛</div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">CRAWL</h3>
                  <p className="text-sm text-red-600 dark:text-red-300">Foundation Building</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🚶</div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">WALK</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">Structured Growth</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🏃</div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">RUN</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">Advanced Execution</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🦅</div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">FLY</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Mature Optimization</p>
                </div>
              </div>

              <PMGWorkflowForm
                onWorkflowStart={handleWorkflowStart}
                onWorkflowComplete={handleWorkflowComplete}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          /* Results Display */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Maturity Plan Generated
              </h2>
              <button
                onClick={() => setWorkflowResult(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate New Plan
              </button>
            </div>
            <MaturityPlanDisplay workflowResult={workflowResult} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Opal Personalization Generator from Perficient. Powered by Opal AI.
            </div>
            <div className="flex space-x-6">
              <a href="/api/pmg/workflow" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                API Documentation
              </a>
              <a href="https://github.com/alex-prft/opal-2025" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
