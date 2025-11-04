'use client';

import React, { useState, useEffect } from 'react';

interface OptimizelyTool {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const optimizelyTools: OptimizelyTool[] = [
  {
    name: 'Optimizely Data Platform',
    description: 'Analyzing customer profiles and segments',
    icon: '📊',
    color: 'blue'
  },
  {
    name: 'Optimizely Experimentation',
    description: 'Reviewing experiment history and performance',
    icon: '🧪',
    color: 'green'
  },
  {
    name: 'Optimizely Content Recommendations',
    description: 'Evaluating content personalization opportunities',
    icon: '🎯',
    color: 'purple'
  },
  {
    name: 'Campaign Management Platform',
    description: 'Setting up personalization campaigns',
    icon: '📧',
    color: 'orange'
  },
  {
    name: 'SendGrid Notifications',
    description: 'Preparing strategy delivery',
    icon: '📬',
    color: 'indigo'
  },
  {
    name: 'Opal AI Engine',
    description: 'Generating personalized strategy recommendations',
    icon: '🤖',
    color: 'red'
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'green':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'purple':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'orange':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'indigo':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

interface LoadingResultsPageProps {
  onComplete: () => void;
}

export default function LoadingResultsPage({ onComplete }: LoadingResultsPageProps) {
  const [currentToolIndex, setCurrentToolIndex] = useState(0);
  const [completedTools, setCompletedTools] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentToolIndex((prev) => {
        if (prev < optimizelyTools.length - 1) {
          return prev + 1;
        } else {
          // All tools completed, wait a moment then call onComplete
          setTimeout(() => {
            onComplete();
          }, 1500);
          return prev;
        }
      });
    }, 2500); // Each tool takes 2.5 seconds

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (currentToolIndex > 0) {
      setCompletedTools((prev) => [...prev, currentToolIndex - 1]);
    }
  }, [currentToolIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Loading Animation */}
        <div className="mb-12">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Analyzing Your Strategy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Opal AI is analyzing your data across multiple Optimizely tools to generate your personalized strategy
          </p>
        </div>

        {/* Tools Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {optimizelyTools.map((tool, index) => {
            const isActive = index === currentToolIndex;
            const isCompleted = completedTools.includes(index);
            const isPending = index > currentToolIndex;

            return (
              <div
                key={tool.name}
                className={`relative p-6 rounded-xl border-2 transition-all duration-500 ${
                  isActive
                    ? `${getColorClasses(tool.color)} scale-105 shadow-lg animate-pulse`
                    : isCompleted
                    ? 'bg-green-50 text-green-800 border-green-300 shadow-md'
                    : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                }`}
              >
                {/* Status Icon */}
                <div className="absolute top-2 right-2">
                  {isCompleted ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  )}
                </div>

                {/* Tool Content */}
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                <p className="text-sm opacity-75">{tool.description}</p>

                {/* Active Loading Bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="mt-12">
          <div className="flex justify-center space-x-2 mb-4">
            {optimizelyTools.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  completedTools.includes(index)
                    ? 'bg-green-500'
                    : index === currentToolIndex
                    ? 'bg-blue-500 animate-pulse scale-125'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedTools.length} of {optimizelyTools.length} tools analyzed
          </p>
        </div>

        {/* Estimated Time */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 inline-block shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ⏱️ Estimated completion: {Math.max(0, (optimizelyTools.length - currentToolIndex - 1) * 2.5)} seconds remaining
          </p>
        </div>
      </div>
    </div>
  );
}