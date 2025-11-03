import { OptimizelyConfig } from '../types';
import { getOptimizelyConfig } from '../utils/config';

export class ExperimentationClient {
  private config: OptimizelyConfig['experimentation'];

  constructor() {
    const fullConfig = getOptimizelyConfig();
    this.config = fullConfig.experimentation;
  }

  /**
   * Get experiment catalog with results and metadata
   */
  async getExperiments(filters?: {
    kpi?: string;
    audience?: string;
    status?: 'running' | 'completed' | 'draft';
    limit?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        project_id: this.config.project_id
      });

      if (filters?.kpi) params.append('kpi', filters.kpi);
      if (filters?.audience) params.append('audience', filters.audience);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.config.base_url}/experiments?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.experiments || [];
    } catch (error) {
      console.error('Experimentation getExperiments error:', error);
      throw new Error(`Failed to fetch experiments: ${error}`);
    }
  }

  /**
   * Get specific experiment details including results
   */
  async getExperimentDetails(experimentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/experiments/${experimentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Experimentation getExperimentDetails error:', error);
      throw new Error(`Failed to fetch experiment details: ${error}`);
    }
  }

  /**
   * Get experiment results and statistical analysis
   */
  async getExperimentResults(experimentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/experiments/${experimentId}/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Experimentation getExperimentResults error:', error);
      throw new Error(`Failed to fetch experiment results: ${error}`);
    }
  }

  /**
   * Get available metrics for the project
   */
  async getAvailableMetrics(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/projects/${this.config.project_id}/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.metrics || [];
    } catch (error) {
      console.error('Experimentation getAvailableMetrics error:', error);
      throw new Error(`Failed to fetch available metrics: ${error}`);
    }
  }

  /**
   * Get available audiences for targeting
   */
  async getAvailableAudiences(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/projects/${this.config.project_id}/audiences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.audiences || [];
    } catch (error) {
      console.error('Experimentation getAvailableAudiences error:', error);
      throw new Error(`Failed to fetch available audiences: ${error}`);
    }
  }

  /**
   * Create a new experiment (for blueprint implementation)
   */
  async createExperiment(experimentSpec: any): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/experiments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: this.config.project_id,
          ...experimentSpec
        })
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Experimentation createExperiment error:', error);
      throw new Error(`Failed to create experiment: ${error}`);
    }
  }

  /**
   * Get feature flags for Feature Experimentation
   */
  async getFeatureFlags(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/projects/${this.config.project_id}/features`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Experimentation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('Experimentation getFeatureFlags error:', error);
      throw new Error(`Failed to fetch feature flags: ${error}`);
    }
  }
}