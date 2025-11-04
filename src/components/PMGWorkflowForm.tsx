'use client';

import { useState, useEffect } from 'react';
import { PMGWorkflowInput, PMGWorkflowOutput } from '@/lib/types/maturity';

interface PMGWorkflowFormProps {
  onWorkflowStart: () => void;
  onWorkflowComplete: (result: PMGWorkflowOutput) => void;
  isLoading: boolean;
}

export default function PMGWorkflowForm({ onWorkflowStart, onWorkflowComplete, isLoading }: PMGWorkflowFormProps) {
  const [formData, setFormData] = useState<PMGWorkflowInput>({
    client_name: '',
    industry: '',
    company_size: 'medium',
    current_capabilities: [],
    business_objectives: [],
    additional_marketing_technology: [],
    timeline_preference: '12-months',
    budget_range: '100k-500k',
    recipients: []
  });

  const [currentCapability, setCurrentCapability] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');
  const [currentMarketingTech, setCurrentMarketingTech] = useState('');
  const [currentRecipient, setCurrentRecipient] = useState('');

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

      window.addEventListener('prefillMarketingTech', handleMarketingTechPrefill as EventListener);

      return () => {
        delete (window as any).fillPerficientData;
        window.removeEventListener('prefillMarketingTech', handleMarketingTechPrefill as EventListener);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name || formData.business_objectives.length === 0 || formData.recipients.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    onWorkflowStart();

    try {
      const response = await fetch('/api/pmg/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer opal-personalization-secret-2025'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Workflow failed: ${response.status}`);
      }

      const result = await response.json();
      onWorkflowComplete(result.data);
    } catch (error) {
      console.error('Workflow error:', error);
      alert(`Failed to generate maturity plan: ${error}`);
    }
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

  const removeItem = (array: string[], index: number, field: keyof PMGWorkflowInput) => {
    const newArray = array.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  return (
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
            Company Size
          </label>
          <select
            value={formData.company_size}
            onChange={(e) => setFormData(prev => ({ ...prev, company_size: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="small">Small (&lt; 100 employees)</option>
            <option value="medium">Medium (100-1000 employees)</option>
            <option value="large">Large (1000-10000 employees)</option>
            <option value="enterprise">Enterprise (&gt; 10000 employees)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timeline Preference
          </label>
          <select
            value={formData.timeline_preference}
            onChange={(e) => setFormData(prev => ({ ...prev, timeline_preference: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="6-months">6 Months (Fast Track)</option>
            <option value="12-months">12 Months (Standard)</option>
            <option value="18-months">18 Months (Comprehensive)</option>
            <option value="24-months">24 Months (Enterprise)</option>
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

      {/* Budget Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget Range
        </label>
        <select
          value={formData.budget_range}
          onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="under-100k">Under $100K</option>
          <option value="100k-500k">$100K - $500K</option>
          <option value="500k-1m">$500K - $1M</option>
          <option value="over-1m">Over $1M</option>
        </select>
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
              Generating PMG Plan...
            </>
          ) : (
            <>
              🚀 Start Your Strategy
            </>
          )}
        </button>
      </div>
    </form>
  );
}