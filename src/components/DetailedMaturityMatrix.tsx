'use client';

import React from 'react';

interface MaturityPhase {
  name: string;
  experienceType: string;
  segmentation: string;
  customerData: string;
  audienceExamples: string[];
  sampleUseCases: string;
  color: string;
}

const maturityPhases: MaturityPhase[] = [
  {
    name: 'Crawl',
    experienceType: 'A/B testing and Simple Personalization',
    segmentation: 'Manually Defined',
    customerData: 'OOTB Optimizely Audiences',
    audienceExamples: [
      'New Visitors',
      'Geolocation',
      'Local promotions or seasonality',
      'Demographics (gender, age))',
      'Marketing campaign'
    ],
    sampleUseCases: 'Acquisition Improvements',
    color: 'red'
  },
  {
    name: 'Walk',
    experienceType: 'Auto targeting experimentation and Advanced Personalization',
    segmentation: 'Advanced Event-Driven Audiences',
    customerData: 'Custom Audiences, 3rd or 1st party data Query parameters',
    audienceExamples: [
      'Returning / Abandonment Visitors',
      'Explicitly defined behaviors (pages viewed, events performed)'
    ],
    sampleUseCases: 'Journey Orchestration and Personalized Content',
    color: 'yellow'
  },
  {
    name: 'Run',
    experienceType: 'Smart Personalization, Context Traffic Distribution',
    segmentation: 'Automated Audiences and CDP Targeting',
    customerData: 'Customer Data Integration with Salesforce, Marketo and Visitor Behavior',
    audienceExamples: [
      'Lead prospects',
      'Current Customers',
      'Prospect type',
      'Authenticated versus non-authenticated'
    ],
    sampleUseCases: 'Journey Automation and Personalized Landing Pages',
    color: 'green'
  },
  {
    name: 'Fly',
    experienceType: 'AI Powered Omnichannel Experiences',
    segmentation: 'Cross device, cross channel alignment for personas',
    customerData: 'Portal and Logged-in User Data',
    audienceExamples: [
      'Email, kiosk and offline sync',
      'Incremental lifestyle and content preferences',
      'Cross channel alignment for phone, email and sms messaging'
    ],
    sampleUseCases: '1:1 Personalized Portals and marketing Communications',
    color: 'blue'
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case 'red':
      return {
        header: 'bg-red-600 text-white',
        cell: 'bg-red-50 dark:bg-red-900/20'
      };
    case 'yellow':
      return {
        header: 'bg-yellow-600 text-white',
        cell: 'bg-yellow-50 dark:bg-yellow-900/20'
      };
    case 'green':
      return {
        header: 'bg-green-600 text-white',
        cell: 'bg-green-50 dark:bg-green-900/20'
      };
    case 'blue':
      return {
        header: 'bg-blue-600 text-white',
        cell: 'bg-blue-50 dark:bg-blue-900/20'
      };
    default:
      return {
        header: 'bg-gray-600 text-white',
        cell: 'bg-gray-50 dark:bg-gray-900/20'
      };
  }
};

export default function DetailedMaturityMatrix() {
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="min-w-[1000px]">
        {/* Title */}
        <div className="bg-gray-900 text-white text-center py-4">
          <h2 className="text-2xl font-bold">Personalization Maturity Plan</h2>
        </div>

        {/* Header Row */}
        <div className="grid grid-cols-5 border-b border-gray-300 dark:border-gray-600">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            {/* Empty cell for row labels */}
          </div>
          {maturityPhases.map((phase) => {
            const colors = getColorClasses(phase.color);
            return (
              <div
                key={phase.name}
                className={`${colors.header} p-4 text-center font-semibold border-r border-gray-300 dark:border-gray-600 last:border-r-0`}
              >
                {phase.name}
              </div>
            );
          })}
        </div>

        {/* Experience Type Row */}
        <div className="grid grid-cols-5 border-b border-gray-300 dark:border-gray-600">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            Experience Type
          </div>
          {maturityPhases.map((phase) => (
            <div
              key={`${phase.name}-experience`}
              className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
            >
              {phase.experienceType}
            </div>
          ))}
        </div>

        {/* Segmentation Row */}
        <div className="grid grid-cols-5 border-b border-gray-300 dark:border-gray-600">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            Segmentation
          </div>
          {maturityPhases.map((phase) => (
            <div
              key={`${phase.name}-segmentation`}
              className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
            >
              {phase.segmentation}
            </div>
          ))}
        </div>

        {/* Customer Data Row */}
        <div className="grid grid-cols-5 border-b border-gray-300 dark:border-gray-600">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            Customer Data
          </div>
          {maturityPhases.map((phase) => (
            <div
              key={`${phase.name}-data`}
              className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
            >
              {phase.customerData}
            </div>
          ))}
        </div>

        {/* Audience Examples Row */}
        <div className="grid grid-cols-5 border-b border-gray-300 dark:border-gray-600">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            Audience Examples
          </div>
          {maturityPhases.map((phase) => (
            <div
              key={`${phase.name}-audience`}
              className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
            >
              <ul className="list-disc list-inside space-y-1">
                {phase.audienceExamples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sample Use Cases Row */}
        <div className="grid grid-cols-5">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
            Sample Use Cases
          </div>
          {maturityPhases.map((phase) => (
            <div
              key={`${phase.name}-usecases`}
              className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
            >
              {phase.sampleUseCases}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}