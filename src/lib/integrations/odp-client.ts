import { OptimizelyConfig } from '../types';
import { getOptimizelyConfig } from '../utils/config';

export class ODPClient {
  private config: OptimizelyConfig['odp'];

  constructor() {
    const fullConfig = getOptimizelyConfig();
    this.config = fullConfig.odp;
  }

  /**
   * Get user profile and segments from ODP
   */
  async getUserProfile(userId: string, idType: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/v3/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.api_key}`,
          'X-Optimizely-SDK-Name': 'opal-personalization-system',
          'X-Optimizely-SDK-Version': '1.0.0'
        },
        body: JSON.stringify({
          type: 'profile',
          identifiers: {
            [idType]: userId
          },
          fields: [
            'email_hash',
            'sf_contact_id',
            'opti_user_id',
            'zaius_id',
            'segments',
            'attributes',
            'computed_traits'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`ODP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ODP getUserProfile error:', error);
      throw new Error(`Failed to fetch user profile from ODP: ${error}`);
    }
  }

  /**
   * Get available segments and their definitions
   */
  async getSegments(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/v3/segments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ODP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.segments || [];
    } catch (error) {
      console.error('ODP getSegments error:', error);
      throw new Error(`Failed to fetch segments from ODP: ${error}`);
    }
  }

  /**
   * Get Real-Time Audience definitions for experiment targeting
   */
  async getRealTimeAudiences(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/v3/audiences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        params: new URLSearchParams({
          type: 'real_time',
          project_id: this.config.project_id
        })
      });

      if (!response.ok) {
        throw new Error(`ODP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.audiences || [];
    } catch (error) {
      console.error('ODP getRealTimeAudiences error:', error);
      throw new Error(`Failed to fetch real-time audiences from ODP: ${error}`);
    }
  }

  /**
   * Get audience size estimates for coverage calculations
   */
  async getAudienceSize(audienceLogic: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.config.base_url}/v3/audiences/estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logic: audienceLogic,
          project_id: this.config.project_id
        })
      });

      if (!response.ok) {
        // Size estimation might not be available for all audiences
        return null;
      }

      const data = await response.json();
      return data.estimated_size || null;
    } catch (error) {
      console.error('ODP getAudienceSize error:', error);
      return null;
    }
  }

  /**
   * Get available attributes and their allowlisted fields
   */
  async getAllowlistedAttributes(): Promise<string[]> {
    try {
      // This would typically come from a configuration endpoint or be hardcoded
      // based on your ODP setup and Salesforce sync configuration
      return [
        'customer_tier',
        'lifecycle_stage',
        'product_interest',
        'geographic_region',
        'engagement_score',
        'last_purchase_date',
        'total_ltv',
        'preferred_channel'
      ];
    } catch (error) {
      console.error('ODP getAllowlistedAttributes error:', error);
      return [];
    }
  }
}