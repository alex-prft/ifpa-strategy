'use client';

import { useState, useEffect } from 'react';
import { OSAWorkflowInput, OSAWorkflowOutput } from '@/lib/types/maturity';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
// Removed API authentication dependencies for simplified data collection

interface OSAWorkflowFormProps {
  onWorkflowStart: () => void;
  onWorkflowComplete: (result: OSAWorkflowOutput) => void;
  isLoading: boolean;
}

export default function OSAWorkflowForm({ onWorkflowStart, onWorkflowComplete, isLoading }: OSAWorkflowFormProps) {
  const [formData, setFormData] = useState<OSAWorkflowInput>({
    client_name: 'Freshproduce.com - IFPA',
    industry: 'Produce and Floral Trade Association',
    company_size: 'Marketing Team',
    current_capabilities: ['A/B testing', 'Personalization', 'Email Marketing', 'Search Engine Optimization', 'Content Marketing'],
    business_objectives: ['Increase Membership', 'Improve Content engagement', 'Promote Events', 'Scale personalization efforts'],
    additional_marketing_technology: ['Salesforce CRM', 'Salesforce Marketing Cloud', 'Intercom', 'Hotjar', 'Optimizely Web Experimentation', 'Optimizely Personalization', 'Optimizely CMS 12', 'Optimizely Data Platform', 'Optimizely Content Recommendations'],
    timeline_preference: 'Last 3 Months',
    budget_range: '100k-500k',
    recipients: ['alex.harris@perficient.com', 'JRucinski@freshproduce.com']
  });

  const [currentCapability, setCurrentCapability] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');
  const [currentMarketingTech, setCurrentMarketingTech] = useState('');
  const [currentRecipient, setCurrentRecipient] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Perficient auto-fill function
  const fillPerficientData = () => {
    setFormData(prev => ({
      ...prev,
      client_name: prev.client_name ? `${prev.client_name} - Perficient` : 'Perficient',
      industry: 'Agency Consulting Services',
      current_capabilities: ['Email', 'Experimentation', 'Personalization', 'Mobile Apps', 'Commerce', 'CMS'],
      business_objectives: ['Increase Lead Generation', 'Optimizely Customer Success', 'Webinar Registrations'],
      recipients: ['alex.harris@perficient.com']
    }));
  };

  // Expose function to window for header button and handle prefill events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fillPerficientData = fillPerficientData;

      // Listen for marketing tech prefill event
      const handleMarketingTechPrefill = (event: CustomEvent) => {
        const technologies = event.detail.technologies;
        setFormData(prev => ({
          ...prev,
          additional_marketing_technology: technologies
        }));
      };

      // Listen for complete Perficient data prefill event
      const handlePerficientDataPrefill = (event: CustomEvent) => {
        const { clientName, industry, currentCapabilities, businessObjectives, emailRecipients, technologies } = event.detail;

        // Parse current capabilities and business objectives from strings to arrays
        const capabilitiesArray = currentCapabilities.split(',').map((item: string) => item.trim());
        const objectivesArray = businessObjectives.split(',').map((item: string) => item.trim());
        const recipientsArray = emailRecipients.split(',').map((email: string) => email.trim());

        setFormData(prev => ({
          ...prev,
          client_name: clientName,
          industry: industry,
          current_capabilities: capabilitiesArray,
          business_objectives: objectivesArray,
          additional_marketing_technology: technologies,
          recipients: recipientsArray
        }));
      };

      window.addEventListener('prefillMarketingTech', handleMarketingTechPrefill as EventListener);
      window.addEventListener('prefillPerficientData', handlePerficientDataPrefill as EventListener);

      return () => {
        delete (window as any).fillPerficientData;
        window.removeEventListener('prefillMarketingTech', handleMarketingTechPrefill as EventListener);
        window.removeEventListener('prefillPerficientData', handlePerficientDataPrefill as EventListener);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name || formData.business_objectives.length === 0 || formData.recipients.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // Store the input data in sessionStorage for use in other pages and decision layer
    sessionStorage.setItem('osa_input_data', JSON.stringify(formData));

    // Create abort controller for cancellation (kept for UI consistency)
    const controller = new AbortController();
    setAbortController(controller);
    setShowLoadingOverlay(true);
    onWorkflowStart();

    try {
      console.log('📝 [Personal Configurator] Processing form data for decision layer learning...');

      // Send data to decision layer for brain learning (simplified processing)
      const processedData = {
        client_name: formData.client_name,
        industry: formData.industry,
        company_size: formData.company_size,
        current_capabilities: formData.current_capabilities,
        business_objectives: formData.business_objectives,
        additional_marketing_technology: formData.additional_marketing_technology,
        timeline_preference: formData.timeline_preference,
        budget_range: formData.budget_range,
        recipients: formData.recipients,
        processed_at: new Date().toISOString(),
        source: 'personal_configurator'
      };

      // Store processed data for decision layer learning
      sessionStorage.setItem('decision_layer_data', JSON.stringify(processedData));

      // Simulate processing time for better UX (reduced from API polling time)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if user cancelled during processing
      if (controller.signal.aborted) {
        console.log('Processing was cancelled by user');
        return;
      }

      // Create simplified result for Personal Configurator (no external API dependencies)
      const personalConfiguratorResult = {
        client_name: formData.client_name,
        generated_at: new Date().toISOString(),
        workflow_id: `pc-${Date.now()}`,
        session_id: `personal-configurator-${Date.now()}`,
        source: 'personal_configurator',
        // Simplified assessment based on form data for decision layer learning
        maturity_assessment: {
          overall_score: calculateMaturityScore(formData),
          category_scores: {
            strategy: assessStrategyMaturity(formData),
            technology: assessTechnologyMaturity(formData),
            data: assessDataMaturity(formData),
            content: assessContentMaturity(formData),
            testing: assessTestingMaturity(formData)
          }
        },
        recommendations: generateBasicRecommendations(formData),
        next_steps: generateNextSteps(formData),
        configuration_data: processedData,
        note: 'Data collected for Personal Configurator and decision layer learning'
      };

      setShowLoadingOverlay(false);
      onWorkflowComplete(personalConfiguratorResult);
      console.log('✅ [Personal Configurator] Data successfully processed and sent to decision layer');
    } catch (error) {
      setShowLoadingOverlay(false);
      setAbortController(null);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Processing was cancelled by user');
        return;
      }

      console.error('Personal Configurator processing error:', error);
      alert(`Failed to process configuration data: ${error}`);
    }
  };

  // Helper functions for simplified assessment (no external API calls)
  const calculateMaturityScore = (data: OSAWorkflowInput): number => {
    let score = 50; // Base score
    score += Math.min(data.current_capabilities.length * 5, 25);
    score += Math.min(data.additional_marketing_technology.length * 3, 15);
    score += Math.min(data.business_objectives.length * 2, 10);
    return Math.min(score, 100);
  };

  const assessStrategyMaturity = (data: OSAWorkflowInput): number => {
    let score = 60;
    if (data.business_objectives.length >= 3) score += 20;
    if (data.industry && data.industry.length > 0) score += 10;
    if (data.timeline_preference !== 'Last 3 Months') score += 10;
    return Math.min(score, 100);
  };

  const assessTechnologyMaturity = (data: OSAWorkflowInput): number => {
    let score = 50;
    score += Math.min(data.additional_marketing_technology.length * 8, 40);
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('api'))) score += 10;
    return Math.min(score, 100);
  };

  const assessDataMaturity = (data: OSAWorkflowInput): number => {
    let score = 55;
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('analytics'))) score += 15;
    if (data.additional_marketing_technology.some(tech => tech.toLowerCase().includes('crm'))) score += 15;
    if (data.additional_marketing_technology.some(tech => tech.toLowerCase().includes('data'))) score += 15;
    return Math.min(score, 100);
  };

  const assessContentMaturity = (data: OSAWorkflowInput): number => {
    let score = 65;
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('content'))) score += 15;
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('personalization'))) score += 20;
    return Math.min(score, 100);
  };

  const assessTestingMaturity = (data: OSAWorkflowInput): number => {
    let score = 45;
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('test'))) score += 25;
    if (data.current_capabilities.some(cap => cap.toLowerCase().includes('experimentation'))) score += 30;
    return Math.min(score, 100);
  };

  const generateBasicRecommendations = (data: OSAWorkflowInput): string[] => {
    const recommendations = [];

    if (data.current_capabilities.length < 3) {
      recommendations.push('Expand current personalization capabilities');
    }

    if (!data.current_capabilities.some(cap => cap.toLowerCase().includes('test'))) {
      recommendations.push('Implement A/B testing framework');
    }

    if (data.additional_marketing_technology.length < 3) {
      recommendations.push('Evaluate additional marketing technology stack');
    }

    recommendations.push('Establish data governance and privacy compliance');
    recommendations.push('Create content personalization strategy');

    return recommendations;
  };

  const generateNextSteps = (data: OSAWorkflowInput): string[] => {
    const nextSteps = [];

    nextSteps.push('Review current capabilities assessment');
    nextSteps.push('Prioritize business objectives by impact');
    nextSteps.push('Audit existing marketing technology integrations');

    if (data.timeline_preference === 'Last 3 Months') {
      nextSteps.push('Extend analytics timeline for better insights');
    }

    nextSteps.push('Develop personalization roadmap');

    return nextSteps;
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
  };

  const addCapability = () => {
    if (currentCapability.trim() && !formData.current_capabilities.includes(currentCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        current_capabilities: [...prev.current_capabilities, currentCapability.trim()]
      }));
      setCurrentCapability('');
    }
  };

  const addObjective = () => {
    if (currentObjective.trim() && !formData.business_objectives.includes(currentObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        business_objectives: [...prev.business_objectives, currentObjective.trim()]
      }));
      setCurrentObjective('');
    }
  };

  const addMarketingTech = () => {
    if (currentMarketingTech.trim() && !formData.additional_marketing_technology.includes(currentMarketingTech.trim())) {
      setFormData(prev => ({
        ...prev,
        additional_marketing_technology: [...prev.additional_marketing_technology, currentMarketingTech.trim()]
      }));
      setCurrentMarketingTech('');
    }
  };

  const addRecipient = () => {
    if (currentRecipient.trim() && !formData.recipients.includes(currentRecipient.trim())) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, currentRecipient.trim()]
      }));
      setCurrentRecipient('');
    }
  };

  const removeItem = (array: string[], index: number, field: keyof OSAWorkflowInput) => {
    const newArray = array.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          {...LoadingPresets.osaWorkflow}
          onCancel={handleCancel}
          variant="overlay"
          cancelButtonText="Cancel Process"
        />
      )}

      <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter client organization name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Retail, Financial Services, Healthcare"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose Your Role
          </label>
          <select
            value={formData.company_size}
            onChange={(e) => setFormData(prev => ({ ...prev, company_size: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Marketing Team">Marketing Team</option>
            <option value="Content Creator">Content Creator</option>
            <option value="UX Designer or Developer">UX Designer or Developer</option>
            <option value="Executive Team">Executive Team</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range for Analytics
          </label>
          <select
            value={formData.timeline_preference}
            onChange={(e) => setFormData(prev => ({ ...prev, timeline_preference: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last 12 Months">Last 12 Months</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* Current Capabilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Personalization Capabilities
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentCapability}
            onChange={(e) => setCurrentCapability(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Email personalization, Basic segmentation"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
          />
          <button
            type="button"
            onClick={addCapability}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.current_capabilities.map((capability, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {capability}
              <button
                type="button"
                onClick={() => removeItem(formData.current_capabilities, index, 'current_capabilities')}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Business Objectives */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Business Objectives *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentObjective}
            onChange={(e) => setCurrentObjective(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Increase conversion rate, Improve customer engagement"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
          />
          <button
            type="button"
            onClick={addObjective}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.business_objectives.map((objective, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {objective}
              <button
                type="button"
                onClick={() => removeItem(formData.business_objectives, index, 'business_objectives')}
                className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Additional Marketing Technology */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Marketing Technology
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentMarketingTech}
            onChange={(e) => setCurrentMarketingTech(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Salesforce CRM, Adobe Analytics, Contentsquare"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMarketingTech())}
          />
          <button
            type="button"
            onClick={addMarketingTech}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.additional_marketing_technology.map((tech, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {tech}
              <button
                type="button"
                onClick={() => removeItem(formData.additional_marketing_technology, index, 'additional_marketing_technology')}
                className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Recipients *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={currentRecipient}
            onChange={(e) => setCurrentRecipient(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="email@example.com"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
          />
          <button
            type="button"
            onClick={addRecipient}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.recipients.map((recipient, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {recipient}
              <button
                type="button"
                onClick={() => removeItem(formData.recipients, index, 'recipients')}
                className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Opal Strategy...
            </>
          ) : (
            <>
              🚀 Start Your Strategy
            </>
          )}
        </button>
      </div>
    </form>
    </>
  );
}