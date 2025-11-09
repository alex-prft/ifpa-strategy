// Database Operations for Opal Workflow Management
// Implements all CRUD operations for workflow orchestration and DXP insights storage
// Updated: Database error handling now uses fallback behavior instead of throwing errors

import { createSupabaseAdmin, handleDatabaseError } from './supabase-client';
import type { Database } from '@/lib/types/database';
import {
  OpalWorkflowExecution,
  OpalAgentExecution,
  OpalTriggerRequest,
  OpalWorkflowResult,
  UpdateOpalWorkflow,
  CreateAgentExecution,
  UpdateAgentExecution
} from '@/lib/types/opal';

const supabase = createSupabaseAdmin();

export class WorkflowDatabaseOperations {
  // =====================================================
  // WORKFLOW EXECUTION OPERATIONS
  // =====================================================

  /**
   * Creates a new workflow execution record
   */
  async createWorkflowExecution(request: OpalTriggerRequest): Promise<OpalWorkflowExecution> {
    const startTime = Date.now();

    try {
      const sessionId = this.generateSessionId();

      const workflowData: Database['public']['Tables']['opal_workflow_executions']['Insert'] = {
        session_id: sessionId,
        status: 'triggered',
        client_name: request.client_name,
        industry: request.industry,
        company_size: request.company_size,
        current_capabilities: request.current_capabilities || [],
        business_objectives: request.business_objectives || [],
        additional_marketing_technology: request.additional_marketing_technology || [],
        timeline_preference: request.timeline_preference,
        budget_range: request.budget_range,
        recipients: request.recipients || [],
        triggered_by: request.triggered_by || 'form_submission',
        trigger_timestamp: new Date().toISOString(),
        progress_percentage: 0,
        completed_agents: [],
        failed_agents: [],
        force_sync_requested: request.force_sync || false,
        scheduled_for: request.scheduled_for?.toISOString()
      };

      const { data, error } = await supabase
        .from('opal_workflow_executions')
        .insert(workflowData as any)
        .select()
        .single();

      if (error || !data) {
        console.error('❌ [DB] Workflow creation failed:', error);
        console.log('⚠️ [DB] Database unavailable, returning mock workflow for resilience');

        // Return a mock workflow instead of throwing error
        return this.createMockWorkflow(request);
      }

      console.log(`✅ [DB] Workflow created: ${(data as any).id} (${Date.now() - startTime}ms)`);

      return this.mapDatabaseRowToWorkflow(data as any);
    } catch (error) {
      console.error('❌ [DB] Workflow creation exception:', error);
      console.log('⚠️ [DB] Database unavailable, returning mock workflow for resilience');

      // Return a mock workflow instead of throwing error
      return this.createMockWorkflow(request);
    }
  }

  /**
   * Updates workflow execution status and metadata
   */
  async updateWorkflowStatus(workflowId: string, updates: UpdateOpalWorkflow): Promise<void> {
    const startTime = Date.now();

    try {
      const { error } = await supabase
        .from('opal_workflow_executions')
        .update(updates as any)
        .eq('id', workflowId);

      if (error) {
        handleDatabaseError(error, 'workflow status update');
      }

      console.log(`📝 [DB] Workflow ${workflowId} updated (${Date.now() - startTime}ms)`);
    } catch (error) {
      handleDatabaseError(error, 'workflow status update');
    }
  }

  /**
   * Retrieves workflow by session ID
   */
  async getWorkflowBySession(sessionId: string): Promise<OpalWorkflowExecution | null> {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .from('opal_workflow_executions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log(`⚠️ [DB] No workflow found for session: ${sessionId}`);
          return null;
        }
        handleDatabaseError(error, 'workflow retrieval');
      }

      console.log(`📊 [DB] Workflow retrieved: ${sessionId} (${Date.now() - startTime}ms)`);

      return this.mapDatabaseRowToWorkflow(data);
    } catch (error) {
      handleDatabaseError(error, 'workflow retrieval');
    }
  }

  /**
   * Retrieves workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<OpalWorkflowExecution | null> {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .from('opal_workflow_executions')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️ [DB] No workflow found for ID: ${workflowId}`);
          return null;
        }
        handleDatabaseError(error, 'workflow retrieval');
      }

      console.log(`📊 [DB] Workflow retrieved: ${workflowId} (${Date.now() - startTime}ms)`);

      return this.mapDatabaseRowToWorkflow(data);
    } catch (error) {
      handleDatabaseError(error, 'workflow retrieval');
    }
  }

  // =====================================================
  // AGENT EXECUTION OPERATIONS
  // =====================================================

  /**
   * Creates a new agent execution record
   */
  async createAgentExecution(agent: CreateAgentExecution): Promise<OpalAgentExecution> {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .from('opal_agent_executions')
        .insert({
          workflow_id: agent.workflow_id,
          agent_name: agent.agent_name,
          agent_type: agent.agent_type,
          execution_order: agent.execution_order,
          status: agent.status || 'pending',
          input_data: agent.input_data,
          workflow_context: agent.workflow_context,
          retry_count: agent.retry_count || 0,
          max_retries: agent.max_retries || 2,
          timeout_ms: agent.timeout_ms || 120000
        })
        .select()
        .single();

      if (error) {
        handleDatabaseError(error, 'agent execution creation');
      }

      console.log(`✅ [DB] Agent execution created: ${data.id} (${Date.now() - startTime}ms)`);

      return this.mapDatabaseRowToAgent(data);
    } catch (error) {
      handleDatabaseError(error, 'agent execution creation');
    }
  }

  /**
   * Updates agent execution status and results
   */
  async updateAgentExecution(agentId: string, updates: UpdateAgentExecution): Promise<void> {
    const startTime = Date.now();

    try {
      const { error } = await supabase
        .from('opal_agent_executions')
        .update(updates)
        .eq('id', agentId);

      if (error) {
        handleDatabaseError(error, 'agent execution update');
      }

      console.log(`📝 [DB] Agent ${agentId} updated (${Date.now() - startTime}ms)`);
    } catch (error) {
      handleDatabaseError(error, 'agent execution update');
    }
  }

  // =====================================================
  // DXP INSIGHTS STORAGE OPERATIONS
  // =====================================================

  /**
   * Stores DXP insights in the appropriate table
   */
  async storeDXPInsights(workflowId: string, agentName: string, insights: Record<string, any>): Promise<void> {
    const startTime = Date.now();

    try {
      let tableName: string;
      let insightData: Record<string, any> = {
        workflow_id: workflowId,
        ...insights
      };

      // Route to appropriate DXP insights table
      switch (agentName) {
        case 'content_review':
          tableName = 'opal_content_insights';
          break;
        case 'geo_audit':
          tableName = 'opal_webx_insights';
          break;
        case 'audience_suggester':
          tableName = 'opal_odp_insights';
          break;
        case 'personalization_idea_generator':
          tableName = 'opal_cms_insights';
          break;
        case 'experiment_blueprinter':
          tableName = 'opal_odp_insights'; // Statistical analysis also goes to ODP
          break;
        case 'cmp_organizer':
          tableName = 'opal_cmp_insights';
          break;
        default:
          console.warn(`⚠️ [DB] Unknown agent type for insights storage: ${agentName}`);
          return;
      }

      const { error } = await supabase
        .from(tableName)
        .insert(insightData);

      if (error) {
        handleDatabaseError(error, `${agentName} insights storage`);
      }

      console.log(`💾 [DB] Stored ${agentName} insights for workflow ${workflowId} (${Date.now() - startTime}ms)`);
    } catch (error) {
      handleDatabaseError(error, 'DXP insights storage');
    }
  }

  // =====================================================
  // RAG KNOWLEDGE MANAGEMENT
  // =====================================================

  /**
   * Updates RAG model with new workflow insights
   */
  async updateRAGModel(workflowId: string, context: Record<string, any>): Promise<void> {
    const startTime = Date.now();

    try {
      // Extract key insights for RAG knowledge base
      const knowledgeEntries = this.extractKnowledgeFromContext(workflowId, context);

      for (const entry of knowledgeEntries) {
        const { error } = await supabase
          .from('opal_rag_knowledge')
          .insert(entry);

        if (error) {
          console.error(`❌ [DB] Failed to store RAG knowledge entry:`, error);
          // Continue processing other entries
        }
      }

      console.log(`🧠 [DB] Updated RAG model with ${knowledgeEntries.length} knowledge entries (${Date.now() - startTime}ms)`);
    } catch (error) {
      console.error(`❌ [DB] RAG model update failed:`, error);
      // Don't throw - RAG updates should not block workflow completion
    }
  }

  /**
   * Compiles final workflow results from all DXP insights
   */
  async compileWorkflowResults(workflowId: string): Promise<OpalWorkflowResult> {
    const startTime = Date.now();

    try {
      // Get workflow details
      const workflow = await this.getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Get all agent executions
      const { data: agents, error: agentError } = await supabase
        .from('opal_agent_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('execution_order');

      if (agentError) {
        handleDatabaseError(agentError, 'agent executions retrieval');
      }

      // Get all DXP insights
      const insights = await this.getAllDXPInsights(workflowId);

      // Compile performance metrics
      const agentPerformance = agents.map(agent => ({
        agent_name: agent.agent_name,
        duration_ms: agent.duration_ms || 0,
        status: agent.status as any
      }));

      const totalDuration = agentPerformance.reduce((sum, agent) => sum + agent.duration_ms, 0);

      const result: OpalWorkflowResult = {
        workflow_id: workflowId,
        session_id: workflow.session_id,
        status: workflow.status,
        insights,
        total_duration_ms: totalDuration,
        agent_performance: agentPerformance,
        rag_knowledge_created: 0, // TODO: Count from RAG operations
        rag_knowledge_updated: 0,
        strategy_brief: insights.cmp?.strategy_brief,
        executive_summary: insights.cmp?.executive_summary,
        recommendations: this.extractRecommendations(insights)
      };

      console.log(`📋 [DB] Compiled workflow results for ${workflowId} (${Date.now() - startTime}ms)`);

      return result;
    } catch (error) {
      handleDatabaseError(error, 'workflow results compilation');
    }
  }

  // =====================================================
  // PERFORMANCE MONITORING
  // =====================================================

  /**
   * Logs API performance metrics
   */
  async logAPIPerformance(metrics: {
    endpoint: string;
    method: string;
    workflowId?: string;
    agentExecutionId?: string;
    responseTimeMs: number;
    statusCode?: number;
    payloadSizeBytes?: number;
    dxpPlatform?: string;
    apiCallType?: string;
    errorMessage?: string;
    retryAttempt?: number;
  }): Promise<void> {
    try {
      await supabase
        .from('opal_api_performance')
        .insert({
          endpoint: metrics.endpoint,
          method: metrics.method,
          workflow_id: metrics.workflowId,
          agent_execution_id: metrics.agentExecutionId,
          response_time_ms: metrics.responseTimeMs,
          status_code: metrics.statusCode,
          payload_size_bytes: metrics.payloadSizeBytes,
          dxp_platform: metrics.dxpPlatform,
          api_call_type: metrics.apiCallType,
          error_message: metrics.errorMessage,
          retry_attempt: metrics.retryAttempt || 0
        });
    } catch (error) {
      console.error('❌ [DB] Performance logging failed:', error);
      // Don't throw - performance logging should not block operations
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `opal_${timestamp}_${randomPart}`;
  }

  private createMockWorkflow(request: OpalTriggerRequest): OpalWorkflowExecution {
    const now = new Date().toISOString();
    const sessionId = this.generateSessionId();
    const workflowId = `mock-workflow-${Date.now()}`;

    console.log('🔧 [DB] Mock workflow created for demo:', workflowId);

    return {
      id: workflowId,
      session_id: sessionId,
      status: 'mock_mode' as any,
      client_name: request.client_name,
      industry: request.industry || '',
      company_size: request.company_size || '',
      current_capabilities: request.current_capabilities || [],
      business_objectives: request.business_objectives || [],
      additional_marketing_technology: request.additional_marketing_technology || [],
      timeline_preference: request.timeline_preference || '',
      budget_range: request.budget_range || '',
      recipients: request.recipients || [],
      triggered_by: request.triggered_by || 'system',
      trigger_timestamp: now,
      started_at: now,
      completed_at: undefined,
      progress_percentage: 0,
      completed_agents: {},
      failed_agents: {},
      agent_executions: [],
      force_sync_requested: request.force_sync || false,
      scheduled_for: request.scheduled_for,
      created_at: now,
      updated_at: now,
      mock_mode: true,
      database_unavailable: true
    };
  }

  private mapDatabaseRowToWorkflow(row: any): OpalWorkflowExecution {
    return {
      id: row.id,
      session_id: row.session_id,
      status: row.status,
      client_name: row.client_name,
      industry: row.industry,
      company_size: row.company_size,
      current_capabilities: row.current_capabilities,
      business_objectives: row.business_objectives,
      additional_marketing_technology: row.additional_marketing_technology,
      timeline_preference: row.timeline_preference,
      budget_range: row.budget_range,
      recipients: row.recipients,
      triggered_by: row.triggered_by,
      trigger_timestamp: new Date(row.trigger_timestamp),
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      failed_at: row.failed_at ? new Date(row.failed_at) : undefined,
      error_message: row.error_message,
      current_step: row.current_step,
      progress_percentage: row.progress_percentage,
      expected_agents: row.expected_agents,
      completed_agents: row.completed_agents,
      failed_agents: row.failed_agents,
      scheduled_for: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
      last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      force_sync_requested: row.force_sync_requested,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  private mapDatabaseRowToAgent(row: any): OpalAgentExecution {
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      agent_name: row.agent_name,
      agent_type: row.agent_type,
      execution_order: row.execution_order,
      status: row.status,
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      duration_ms: row.duration_ms,
      input_data: row.input_data,
      output_data: row.output_data,
      workflow_context: row.workflow_context,
      error_message: row.error_message,
      retry_count: row.retry_count,
      max_retries: row.max_retries,
      timeout_ms: row.timeout_ms,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  private async getAllDXPInsights(workflowId: string): Promise<OpalWorkflowResult['insights']> {
    const insights: OpalWorkflowResult['insights'] = {};

    try {
      // Get ODP insights
      const { data: odpData } = await supabase
        .from('opal_odp_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (odpData) insights.odp = odpData as any;

      // Get Content insights
      const { data: contentData } = await supabase
        .from('opal_content_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (contentData) insights.content = contentData as any;

      // Get CMS insights
      const { data: cmsData } = await supabase
        .from('opal_cms_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (cmsData) insights.cms = cmsData as any;

      // Get CMP insights
      const { data: cmpData } = await supabase
        .from('opal_cmp_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (cmpData) insights.cmp = cmpData as any;

      // Get WebX insights
      const { data: webxData } = await supabase
        .from('opal_webx_insights')
        .select('*')
        .eq('workflow_id', workflowId)
        .single();

      if (webxData) insights.webx = webxData as any;

    } catch (error) {
      console.error('❌ [DB] Error retrieving DXP insights:', error);
    }

    return insights;
  }

  private extractKnowledgeFromContext(workflowId: string, context: Record<string, any>): Array<any> {
    const knowledgeEntries = [];

    // Extract form data knowledge
    if (context.form_data) {
      knowledgeEntries.push({
        source_type: 'form_data',
        workflow_id: workflowId,
        knowledge_title: `Client Profile: ${context.form_data.client_name}`,
        knowledge_summary: `Business context and objectives for ${context.form_data.client_name}`,
        knowledge_content: context.form_data,
        knowledge_type: 'client_profile',
        confidence_score: 1.0,
        relevance_tags: ['client_data', 'business_context', context.form_data.industry].filter(Boolean),
        is_active: true,
        usage_count: 0
      });
    }

    // Extract agent insights
    Object.entries(context.agent_results || {}).forEach(([agentName, results]: [string, any]) => {
      if (results && typeof results === 'object') {
        knowledgeEntries.push({
          source_type: 'agent_output',
          workflow_id: workflowId,
          knowledge_title: `${agentName} Analysis Results`,
          knowledge_summary: `Insights and recommendations from ${agentName} agent`,
          knowledge_content: results,
          knowledge_type: agentName,
          confidence_score: 0.9,
          relevance_tags: [agentName, 'agent_insights', 'dxp_analysis'],
          is_active: true,
          usage_count: 0
        });
      }
    });

    return knowledgeEntries;
  }

  private extractRecommendations(insights: OpalWorkflowResult['insights']): Array<any> {
    const recommendations = [];

    // Extract content recommendations
    if (insights.content?.content_recommendations) {
      const contentRecs = insights.content.content_recommendations;
      if (Array.isArray(contentRecs)) {
        recommendations.push(...contentRecs);
      }
    }

    // Extract technical recommendations
    if (insights.webx?.technical_recommendations) {
      const techRecs = insights.webx.technical_recommendations;
      if (Array.isArray(techRecs)) {
        recommendations.push(...techRecs);
      }
    }

    // Extract strategy recommendations from CMP
    if (insights.cmp?.strategy_brief?.strategy_recommendations) {
      const strategyRecs = insights.cmp.strategy_brief.strategy_recommendations;
      if (Array.isArray(strategyRecs)) {
        recommendations.push(...strategyRecs);
      }
    }

    return recommendations.map((rec, index) => ({
      category: rec.category || 'general',
      title: rec.title || rec.action || `Recommendation ${index + 1}`,
      description: rec.description || rec.rationale || '',
      priority: rec.priority || 'medium',
      implementation_effort: rec.implementation_effort || rec.resources_required || 'unknown'
    }));
  }
}

// Export singleton instance
export const workflowDb = new WorkflowDatabaseOperations();