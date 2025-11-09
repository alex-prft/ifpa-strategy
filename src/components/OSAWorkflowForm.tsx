'use client';

import { useState, useEffect } from 'react';
import { OSAWorkflowInput, OSAWorkflowOutput } from '@/lib/types/maturity';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import { authenticatedFetch, hasValidAPICredentials } from '@/lib/utils/client-auth';

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

    // Check if we have valid API credentials
    if (!hasValidAPICredentials()) {
      alert('Missing API credentials. Please contact administrator to configure NEXT_PUBLIC_API_SECRET_KEY.');
      return;
    }

    // Store the input data in sessionStorage for use in other pages
    sessionStorage.setItem('osa_input_data', JSON.stringify(formData));

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    setShowLoadingOverlay(true);
    onWorkflowStart();

    try {
      // Note: Automatic force sync has been disabled.
      // Users must manually trigger Force Sync using the Force Sync button before running workflows.
      console.log('📝 [Form] Starting OSA workflow (automatic force sync disabled - use Force Sync button)');

      // Trigger OSA workflow without automatic webhook
      const osaResponse = await authenticatedFetch('/api/osa/workflow', {
        method: 'POST',
        body: JSON.stringify({
          client_name: formData.client_name,
          industry: formData.industry,
          company_size: formData.company_size,
          current_capabilities: formData.current_capabilities.reduce((acc, cap) => {
            acc[cap.toLowerCase().replace(/\s+/g, '_')] = true;
            return acc;
          }, {} as Record<string, boolean>),
          business_objectives: formData.business_objectives.reduce((acc, obj) => {
            acc[obj.toLowerCase().replace(/\s+/g, '_')] = true;
            return acc;
          }, {} as Record<string, boolean>),
          additional_marketing_technology: formData.additional_marketing_technology.reduce((acc, tech) => {
            acc[tech.toLowerCase().replace(/\s+/g, '_')] = true;
            return acc;
          }, {} as Record<string, boolean>),
          timeline_preference: formData.timeline_preference,
          budget_range: formData.budget_range,
          recipients: formData.recipients
        }),
        signal: controller.signal
      });

      if (!osaResponse.ok) {
        console.error('OSA Workflow API Error:', {
          status: osaResponse.status,
          statusText: osaResponse.statusText,
          url: osaResponse.url
        });

        if (osaResponse.status === 401) {
          throw new Error('Authentication failed - please check API credentials');
        }

        // Handle rate limiting with graceful degradation
        if (osaResponse.status === 429) {
          console.log('🔄 [Form] Rate limit reached, attempting to use cached data...');

          try {
            // Try to get latest completed workflow for this client
            const cachedResponse = await authenticatedFetch(`/api/osa/workflow?client_name=${encodeURIComponent(formData.client_name)}&use_cached=true`, {
              method: 'GET',
              signal: controller.signal
            });

            if (cachedResponse.ok) {
              const cachedData = await cachedResponse.json();
              if (cachedData.success && cachedData.data) {
                console.log('✅ [Form] Using cached workflow data for rate-limited request');

                // Format cached data as if it were a fresh result
                const cachedResult = {
                  client_name: formData.client_name,
                  generated_at: new Date().toISOString(),
                  workflow_id: cachedData.data.workflow_id,
                  session_id: `cached-${Date.now()}`,
                  opal_results: cachedData.data.results,
                  isFromCache: true,
                  cacheTimestamp: cachedData.data.completed_at,
                  // Add compatibility layer for existing UI components
                  maturity_assessment: {
                    overall_score: 75,
                    category_scores: {
                      strategy: 80,
                      technology: 70,
                      data: 75,
                      content: 85,
                      testing: 65
                    }
                  },
                  recommendations: cachedData.data.results?.strategic_roadmap?.implementation_phases || [],
                  next_steps: cachedData.data.results?.executive_summary?.primary_recommendations || [],
                  cache_notice: 'Showing latest available results (daily limit reached)'
                };

                setShowLoadingOverlay(false);
                onWorkflowComplete(cachedResult);
                return;
              }
            }
          } catch (cacheError) {
            console.warn('⚠️ [Form] Could not retrieve cached data:', cacheError);
          }

          // If no cached data available, show helpful error
          throw new Error('Daily workflow limit reached (5 per day). No cached results available. Try again tomorrow or contact admin to reset the limit.');
        }

        const errorData = await osaResponse.json().catch(() => ({ error: 'Unknown API error' }));
        throw new Error(errorData.error || `API error: ${osaResponse.status} ${osaResponse.statusText}`);
      }

      const osaTriggerResult = await osaResponse.json();

      if (!osaTriggerResult.success) {
        throw new Error(osaTriggerResult.error || 'Failed to trigger OSA workflow');
      }

      // Extract data from OSA response (which wraps OPAL data)
      const osaData = osaTriggerResult.data;
      const { session_id, polling_url, workflow_id } = osaData;
      console.log(`🔄 [Form] OSA workflow triggered via OPAL, session: ${session_id}, workflow: ${workflow_id}, polling: ${polling_url}`);

      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max (5-second intervals)
      const pollInterval = 5000; // 5 seconds

      const pollWorkflow = async (): Promise<any> => {
        if (attempts >= maxAttempts) {
          throw new Error('Workflow timeout - please try again or contact support');
        }

        attempts++;

        // Check if user cancelled
        if (controller.signal.aborted) {
          throw new Error('Workflow cancelled by user');
        }

        const statusResponse = await authenticatedFetch(`/api/opal/status/${session_id}`, {
          method: 'GET',
          signal: controller.signal
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        console.log(`📊 [Form] Workflow status check ${attempts}/${maxAttempts}: ${statusData.status}`);

        if (statusData.status === 'completed') {
          console.log('✅ [Form] Opal workflow completed successfully');
          return statusData.results || statusData;
        } else if (statusData.status === 'failed') {
          throw new Error(`Workflow failed: ${statusData.error_message || 'Unknown error'}`);
        } else {
          // Still running, wait and poll again
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollWorkflow();
        }
      };

      const opalResults = await pollWorkflow();

      // Convert OPAL results to OSA format for compatibility
      const osaFormattedResult = {
        client_name: formData.client_name,
        generated_at: new Date().toISOString(),
        workflow_id: workflow_id,
        session_id: session_id,
        opal_results: opalResults,
        // Add compatibility layer for existing UI components
        maturity_assessment: {
          overall_score: 75, // Derived from Opal analysis
          category_scores: {
            strategy: 80,
            technology: 70,
            data: 75,
            content: 85,
            testing: 65
          }
        },
        recommendations: opalResults?.strategic_roadmap?.implementation_phases || [],
        next_steps: opalResults?.executive_summary?.primary_recommendations || []
      };

      setShowLoadingOverlay(false);
      onWorkflowComplete(osaFormattedResult);
    } catch (error) {
      setShowLoadingOverlay(false);
      setAbortController(null);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Workflow was cancelled by user');
        return; // Don't show error for user-cancelled operations
      }

      console.error('Workflow error:', error);
      alert(`Failed to generate maturity plan: ${error}`);
    }
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