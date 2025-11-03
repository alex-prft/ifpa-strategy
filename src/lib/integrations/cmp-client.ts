import { OptimizelyConfig } from '../types';
import { getOptimizelyConfig } from '../utils/config';

export class CMPClient {
  private config: OptimizelyConfig['cmp'];

  constructor() {
    const fullConfig = getOptimizelyConfig();
    this.config = fullConfig.cmp;
  }

  /**
   * Create a new campaign in CMP
   */
  async createCampaign(campaignData: {
    title: string;
    description?: string;
    project_key?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: this.config.workspace_id,
          name: campaignData.title,
          description: campaignData.description || '',
          project_key: campaignData.project_key,
          status: 'draft',
          type: 'personalization_plan'
        })
      });

      if (!response.ok) {
        throw new Error(`CMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMP createCampaign error:', error);
      throw new Error(`Failed to create campaign in CMP: ${error}`);
    }
  }

  /**
   * Create a brief within a campaign
   */
  async createBrief(campaignId: string, briefData: {
    title: string;
    content: string;
    type?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/campaigns/${campaignId}/briefs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: briefData.title,
          content: briefData.content,
          content_type: 'markdown',
          brief_type: briefData.type || 'personalization_strategy',
          status: 'published'
        })
      });

      if (!response.ok) {
        throw new Error(`CMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMP createBrief error:', error);
      throw new Error(`Failed to create brief in CMP: ${error}`);
    }
  }

  /**
   * Create tasks within a campaign
   */
  async createTasks(campaignId: string, tasks: Array<{
    title: string;
    description: string;
    assignee?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
  }>): Promise<any[]> {
    try {
      const createdTasks = [];

      for (const task of tasks) {
        const response = await fetch(`${this.config.base_url}/campaigns/${campaignId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            due_date: task.due_date,
            priority: task.priority || 'medium',
            status: 'todo'
          })
        });

        if (!response.ok) {
          console.error(`Failed to create task: ${task.title}`);
          continue;
        }

        const createdTask = await response.json();
        createdTasks.push(createdTask);
      }

      return createdTasks;
    } catch (error) {
      console.error('CMP createTasks error:', error);
      throw new Error(`Failed to create tasks in CMP: ${error}`);
    }
  }

  /**
   * Get campaign details and URL
   */
  async getCampaignDetails(campaignId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/campaigns/${campaignId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMP getCampaignDetails error:', error);
      throw new Error(`Failed to fetch campaign details from CMP: ${error}`);
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: 'draft' | 'active' | 'completed'): Promise<any> {
    try {
      const response = await fetch(`${this.config.base_url}/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`CMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMP updateCampaignStatus error:', error);
      throw new Error(`Failed to update campaign status in CMP: ${error}`);
    }
  }

  /**
   * Get shareable URL for campaign/brief review
   */
  async getShareableURL(campaignId: string, briefId?: string): Promise<string> {
    try {
      // Construct the shareable URL based on CMP's URL structure
      const baseURL = this.config.base_url.replace('/api', ''); // Remove /api if present

      if (briefId) {
        return `${baseURL}/campaigns/${campaignId}/briefs/${briefId}`;
      } else {
        return `${baseURL}/campaigns/${campaignId}`;
      }
    } catch (error) {
      console.error('CMP getShareableURL error:', error);
      throw new Error(`Failed to generate shareable URL: ${error}`);
    }
  }

  /**
   * Publish complete personalization plan to CMP
   */
  async publishPlan(planData: {
    title: string;
    markdown_content: string;
    project_key?: string;
    tasks?: Array<{
      title: string;
      description: string;
      assignee?: string;
      due_date?: string;
      priority?: 'low' | 'medium' | 'high';
    }>;
  }): Promise<{
    campaign_url: string;
    campaign_id: string;
    brief_id: string;
  }> {
    try {
      // Step 1: Create the campaign
      const campaign = await this.createCampaign({
        title: planData.title,
        description: 'AI-Generated Personalization Strategy Plan',
        project_key: planData.project_key
      });

      // Step 2: Create the brief with the markdown content
      const brief = await this.createBrief(campaign.id, {
        title: `${planData.title} - Strategy Brief`,
        content: planData.markdown_content,
        type: 'personalization_strategy'
      });

      // Step 3: Create tasks if provided
      if (planData.tasks && planData.tasks.length > 0) {
        await this.createTasks(campaign.id, planData.tasks);
      }

      // Step 4: Update campaign to active status
      await this.updateCampaignStatus(campaign.id, 'active');

      // Step 5: Generate shareable URL
      const campaign_url = await this.getShareableURL(campaign.id, brief.id);

      return {
        campaign_url,
        campaign_id: campaign.id,
        brief_id: brief.id
      };
    } catch (error) {
      console.error('CMP publishPlan error:', error);
      throw new Error(`Failed to publish plan to CMP: ${error}`);
    }
  }
}