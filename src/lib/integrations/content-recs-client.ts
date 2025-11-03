import { OptimizelyConfig } from '../types';
import { getOptimizelyConfig } from '../utils/config';

export class ContentRecsClient {
  private config: OptimizelyConfig['content_recs'];

  constructor() {
    const fullConfig = getOptimizelyConfig();
    this.config = fullConfig.content_recs;
  }

  /**
   * Get content recommendations by topic
   */
  async getRecommendationsByTopic(topic: string, audience?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        topic: topic,
        account_id: this.config.account_id
      });

      if (audience) {
        params.append('audience', audience);
      }

      const response = await fetch(`${this.config.base_url}/v1/recommendations/topic?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('ContentRecs getRecommendationsByTopic error:', error);
      throw new Error(`Failed to fetch recommendations by topic: ${error}`);
    }
  }

  /**
   * Get content recommendations by section
   */
  async getRecommendationsBySection(section: string, audience?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        section: section,
        account_id: this.config.account_id
      });

      if (audience) {
        params.append('audience', audience);
      }

      const response = await fetch(`${this.config.base_url}/v1/recommendations/section?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('ContentRecs getRecommendationsBySection error:', error);
      throw new Error(`Failed to fetch recommendations by section: ${error}`);
    }
  }

  /**
   * Get available topics in the content catalog
   */
  async getAvailableTopics(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.base_url}/v1/catalog/topics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: this.config.account_id
        })
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.topics || [];
    } catch (error) {
      console.error('ContentRecs getAvailableTopics error:', error);
      // Return some default topics if API call fails
      return [
        'product_features',
        'industry_insights',
        'case_studies',
        'best_practices',
        'tutorials',
        'news_updates',
        'customer_stories',
        'thought_leadership'
      ];
    }
  }

  /**
   * Get available sections in the content catalog
   */
  async getAvailableSections(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.base_url}/v1/catalog/sections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: this.config.account_id
        })
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.sections || [];
    } catch (error) {
      console.error('ContentRecs getAvailableSections error:', error);
      // Return some default sections if API call fails
      return [
        'homepage_hero',
        'product_pages',
        'blog_sidebar',
        'email_footer',
        'checkout_upsell',
        'category_pages',
        'search_results',
        'user_dashboard'
      ];
    }
  }

  /**
   * Get content affinity data for personalization context
   */
  async getContentAffinity(userId: string, idType: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/v1/users/affinity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: this.config.account_id,
          user_identifier: {
            type: idType,
            value: userId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ContentRecs getContentAffinity error:', error);
      throw new Error(`Failed to fetch content affinity: ${error}`);
    }
  }

  /**
   * Get performance metrics for content pieces
   */
  async getContentPerformance(contentIds: string[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.base_url}/v1/analytics/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: this.config.account_id,
          content_ids: contentIds
        })
      });

      if (!response.ok) {
        throw new Error(`Content Recs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.performance_data || [];
    } catch (error) {
      console.error('ContentRecs getContentPerformance error:', error);
      throw new Error(`Failed to fetch content performance: ${error}`);
    }
  }
}