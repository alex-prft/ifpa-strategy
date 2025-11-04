import { getBaseURL, getAPISecretKey } from '../utils/config';

/**
 * OPAL Agent Client - Orchestrates PMG workflow steps
 * Calls internal API endpoints to execute the complete workflow
 */

export class OPALAgentClient {
  private baseURL: string;
  private apiKey: string;
  private isDemoMode: boolean;

  constructor() {
    this.baseURL = getBaseURL();
    this.apiKey = getAPISecretKey();

    // Check if we're in demo mode (missing external API keys)
    this.isDemoMode = !process.env.ODP_API_KEY || !process.env.CMP_API_KEY || !process.env.SENDGRID_API_KEY;

    console.log('OPAL Agent Client environment check:', {
      ODP_API_KEY: process.env.ODP_API_KEY ? 'present' : 'missing',
      CMP_API_KEY: process.env.CMP_API_KEY ? 'present' : 'missing',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'present' : 'missing',
      isDemoMode: this.isDemoMode
    });

    if (this.isDemoMode) {
      console.log('OPAL Agent Client running in demo mode - external APIs will be mocked');
    }
  }

  /**
   * Create CMP campaign with maturity plan content
   */
  async createCMPCampaign(campaignData: {
    campaign_name: string;
    brief_description: string;
    content: string;
    tags: string[];
  }): Promise<{ campaign_url: string; campaign_id: string; brief_id: string }> {
    // In demo mode, return mock data
    if (this.isDemoMode) {
      console.log('Demo mode: Mock CMP campaign created', {
        campaign_name: campaignData.campaign_name,
        brief_description: campaignData.brief_description
      });

      return {
        campaign_url: `https://demo-cmp.example.com/campaigns/demo-${Date.now()}`,
        campaign_id: `demo-campaign-${Date.now()}`,
        brief_id: `demo-brief-${Date.now()}`
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/api/tools/cmp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: campaignData.campaign_name,
          plan_markdown: campaignData.content,
          project_key: 'pmg-workflow',
          tasks: []
        })
      });

      if (!response.ok) {
        throw new Error(`CMP API error: ${response.status}`);
      }

      const result = await response.json();
      return {
        campaign_url: result.data.campaign_url,
        campaign_id: result.data.campaign_id,
        brief_id: result.data.brief_id
      };
    } catch (error) {
      console.error('CMP campaign creation error:', error);
      throw new Error(`Failed to create CMP campaign: ${error}`);
    }
  }

  /**
   * Send notification with plan details
   */
  async sendNotification(notificationData: {
    to: string[];
    plan_title: string;
    cmp_url: string;
    plan_summary: string;
    sender_name: string;
  }): Promise<{ status: 'success' | 'failed'; message_id?: string }> {
    // In demo mode, return mock notification result
    if (this.isDemoMode) {
      console.log('Demo mode: Mock notification sent', {
        to: notificationData.to,
        plan_title: notificationData.plan_title,
        sender_name: notificationData.sender_name
      });

      return {
        status: 'success',
        message_id: `demo-message-${Date.now()}`
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/api/tools/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: notificationData.to,
          plan_title: notificationData.plan_title,
          cmp_url: notificationData.cmp_url,
          plan_summary: notificationData.plan_summary,
          sender_name: notificationData.sender_name
        })
      });

      if (!response.ok) {
        throw new Error(`Notify API error: ${response.status}`);
      }

      const result = await response.json();
      return {
        status: result.data.status,
        message_id: result.data.message_id
      };
    } catch (error) {
      console.error('Notification error:', error);
      return { status: 'failed' };
    }
  }

  /**
   * Get audience insights for maturity assessment
   */
  async getAudienceInsights(identifiers: {
    email_hash?: string;
    sf_contact_id?: string;
    opti_user_id?: string;
  }) {
    try {
      const response = await fetch(`${this.baseURL}/api/tools/audience`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(identifiers)
      });

      if (!response.ok) {
        throw new Error(`Audience API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Audience insights error:', error);
      throw error;
    }
  }

  /**
   * Get content recommendations for use case examples
   */
  async getContentRecommendations(audienceId: string) {
    try {
      const response = await fetch(`${this.baseURL}/api/tools/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience_id: audienceId,
          content_types: ['articles', 'videos', 'guides'],
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Content API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Content recommendations error:', error);
      throw error;
    }
  }

  /**
   * Get historical experiments for maturity benchmarking
   */
  async getExperimentHistory(lookbackDays: number = 90) {
    try {
      const response = await fetch(`${this.baseURL}/api/tools/experiments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lookback_days: lookbackDays,
          include_archived: true
        })
      });

      if (!response.ok) {
        throw new Error(`Experiments API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Experiment history error:', error);
      throw error;
    }
  }
}