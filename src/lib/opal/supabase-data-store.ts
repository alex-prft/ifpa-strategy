/**
 * Supabase-backed OPAL Data Store
 * Replaces in-memory operations with persistent database storage
 */

import { createSupabaseAdmin, handleDatabaseError } from '@/lib/database/supabase-client';
import { withPooledConnection } from '@/lib/database/connection-pool';
import { dbWithRetry } from '@/lib/utils/retry';
import { OSAWorkflowInput } from '@/lib/types/maturity';
import type { Database } from '@/lib/types/database';

// Re-export interfaces for compatibility
export interface OpalAgentResult {
  agent_id: string;
  agent_name: string;
  output: any;
  success: boolean;
  error?: string;
  execution_time_ms: number;
  timestamp: string;
}

export interface OpalWorkflowResult {
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  input_data: OSAWorkflowInput;
  results: {
    [key: string]: OpalAgentResult;
  };
  metadata?: {
    client_id?: string;
    project_id?: string;
    user_id?: string;
    session_id?: string;
  };
}

type WorkflowRow = Database['public']['Tables']['opal_workflow_executions']['Row'];
type WorkflowInsert = Database['public']['Tables']['opal_workflow_executions']['Insert'];
type WorkflowUpdate = Database['public']['Tables']['opal_workflow_executions']['Update'];

type AgentRow = Database['public']['Tables']['opal_agent_executions']['Row'];
type AgentInsert = Database['public']['Tables']['opal_agent_executions']['Insert'];

/**
 * Supabase-backed OPAL data store with connection pooling, retry logic and error handling
 */
export class SupabaseOpalDataStore {
  private supabase = createSupabaseAdmin();
  private static instance: SupabaseOpalDataStore;
  private useConnectionPooling: boolean;

  constructor() {
    // Enable connection pooling in production or when explicitly configured
    this.useConnectionPooling = process.env.NODE_ENV === 'production' ||
                               process.env.DB_USE_POOLING === 'true';

    if (this.useConnectionPooling) {
      console.log('📊 Database connection pooling enabled for OPAL data store');
    }
  }

  // Singleton pattern for consistent usage
  static getInstance(): SupabaseOpalDataStore {
    if (!SupabaseOpalDataStore.instance) {
      SupabaseOpalDataStore.instance = new SupabaseOpalDataStore();
    }
    return SupabaseOpalDataStore.instance;
  }

  /**
   * Execute database operation with optional connection pooling
   */
  private async withDatabase<T>(
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    if (this.useConnectionPooling) {
      return withPooledConnection(operation);
    } else {
      return operation(this.supabase);
    }
  }

  /**
   * Rate limiting: Check if user can trigger workflow
   * TODO: RE-ENABLE DAILY RESTRICTION - Currently disabled to allow unlimited submissions
   * Original implementation had 5 requests per day limit
   */
  async canTriggerWorkflow(sessionId?: string): Promise<boolean> {
    // TEMPORARY: Daily restriction removed - always allow workflow submissions
    // TODO: Restore original rate limiting logic when needed
    console.log(`📊 Rate limit check: DISABLED - allowing all workflow submissions`);
    return true;

    /* ORIGINAL RATE LIMITING CODE - RESTORE WHEN NEEDED:
    try {
      return await dbWithRetry(async () => {
        return await this.withDatabase(async (client) => {
          const today = new Date().toISOString().split('T')[0];
          const startOfDay = `${today}T00:00:00.000Z`;
          const endOfDay = `${today}T23:59:59.999Z`;

          const { data, error } = await client
            .from('opal_workflow_executions')
            .select('id')
            .gte('trigger_timestamp', startOfDay)
            .lte('trigger_timestamp', endOfDay);

          if (error) {
            handleDatabaseError(error, 'rate limit check');
          }

          const todayCount = data?.length || 0;
          const canTrigger = todayCount < 5; // 5 requests per day limit

          console.log(`📊 Rate limit check: ${todayCount}/5 workflows today, can trigger: ${canTrigger}`);
          return canTrigger;
        });
      }, {
        operationName: 'rate limit check',
        maxAttempts: 2
      });
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      return false; // Fail safe - don't allow if we can't check
    }
    */
  }

  /**
   * Create a new workflow execution record with fallback to in-memory storage
   */
  async createWorkflow(
    workflowId: string,
    inputData: OSAWorkflowInput,
    sessionId?: string
  ): Promise<OpalWorkflowResult> {
    try {
      return await dbWithRetry(async () => {
        const now = new Date().toISOString();

        const workflowData: WorkflowInsert = {
          id: workflowId,
          session_id: sessionId || `session-${Date.now()}`,
          status: 'pending',
          client_name: inputData.client_name,
          industry: inputData.industry,
          company_size: inputData.company_size,
          current_capabilities: inputData.current_capabilities,
          business_objectives: inputData.business_objectives,
          additional_marketing_technology: inputData.additional_marketing_technology,
          timeline_preference: inputData.timeline_preference,
          budget_range: inputData.budget_range,
          recipients: inputData.recipients,
          triggered_by: 'user',
          trigger_timestamp: now,
          progress_percentage: 0,
          completed_agents: {},
          failed_agents: {},
          force_sync_requested: false,
          created_at: now,
          updated_at: now
        };

        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .insert(workflowData)
          .select()
          .single();

        if (error) {
          console.error('❌ [Database] workflow creation failed:', error);
          console.log('⚠️ [Opal] Database unavailable, creating mock workflow:', error.message || error);

          // Return mock workflow instead of throwing error
          return this.createMockWorkflow(workflowId, inputData, sessionId);
        }

        console.log('✅ Created workflow in database:', workflowId);

        return this.mapWorkflowRowToResult(data, inputData);
      }, {
        operationName: 'create workflow',
        maxAttempts: 3
      });
    } catch (error) {
      console.error('❌ Failed to create workflow:', error);
      console.log('⚠️ [Opal] Database unavailable, creating mock workflow:', error);

      // Return mock workflow instead of throwing error
      return this.createMockWorkflow(workflowId, inputData, sessionId);
    }
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(
    workflowId: string,
    status: OpalWorkflowResult['status']
  ): Promise<void> {
    try {
      await dbWithRetry(async () => {
        const now = new Date().toISOString();

        const updateData: WorkflowUpdate = {
          status,
          updated_at: now
        };

        if (status === 'running') {
          updateData.started_at = now;
        } else if (status === 'completed' || status === 'failed') {
          updateData.completed_at = now;
        }

        const { error } = await this.supabase
          .from('opal_workflow_executions')
          .update(updateData)
          .eq('id', workflowId);

        if (error) {
          handleDatabaseError(error, 'workflow status update');
        }

        console.log(`✅ Updated workflow ${workflowId} status to: ${status}`);
      }, {
        operationName: 'update workflow status',
        maxAttempts: 3
      });
    } catch (error) {
      console.error(`❌ Failed to update workflow status for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Add agent execution result
   */
  async addAgentResult(
    workflowId: string,
    agentId: string,
    result: OpalAgentResult
  ): Promise<void> {
    try {
      await dbWithRetry(async () => {
        const now = new Date().toISOString();

        // Insert agent execution record
        const agentData: AgentInsert = {
          workflow_id: workflowId,
          agent_name: result.agent_name,
          agent_type: result.agent_id,
          status: result.success ? 'completed' : 'failed',
          started_at: result.timestamp,
          completed_at: now,
          duration_ms: result.execution_time_ms,
          output_data: result.output,
          error_message: result.error,
          retry_count: 0,
          max_retries: 3,
          timeout_ms: 300000, // 5 minutes
          created_at: now,
          updated_at: now
        };

        const { error: agentError } = await this.supabase
          .from('opal_agent_executions')
          .insert(agentData);

        if (agentError) {
          handleDatabaseError(agentError, 'agent result insertion');
        }

        // Update workflow with agent results
        const { data: workflow, error: fetchError } = await this.supabase
          .from('opal_workflow_executions')
          .select('completed_agents, failed_agents')
          .eq('id', workflowId)
          .single();

        if (fetchError) {
          handleDatabaseError(fetchError, 'workflow fetch for agent update');
        }

        const completedAgents = { ...(workflow.completed_agents || {}) };
        const failedAgents = { ...(workflow.failed_agents || {}) };

        if (result.success) {
          completedAgents[agentId] = result;
          // Remove from failed if it was there
          delete failedAgents[agentId];
        } else {
          failedAgents[agentId] = result;
          // Remove from completed if it was there
          delete completedAgents[agentId];
        }

        const { error: updateError } = await this.supabase
          .from('opal_workflow_executions')
          .update({
            completed_agents: completedAgents,
            failed_agents: failedAgents,
            updated_at: now
          })
          .eq('id', workflowId);

        if (updateError) {
          handleDatabaseError(updateError, 'workflow agent results update');
        }

        console.log(`✅ Added agent result for ${agentId} in workflow ${workflowId}`);
      }, {
        operationName: 'add agent result',
        maxAttempts: 3
      });
    } catch (error) {
      console.error(`❌ Failed to add agent result for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<OpalWorkflowResult | undefined> {
    try {
      return await dbWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .select('*')
          .eq('id', workflowId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return undefined;
          }
          handleDatabaseError(error, 'workflow fetch');
        }

        return this.mapWorkflowRowToResult(data);
      }, {
        operationName: 'get workflow',
        maxAttempts: 2
      });
    } catch (error) {
      console.error(`❌ Failed to get workflow ${workflowId}:`, error);
      return undefined;
    }
  }

  /**
   * Get workflow by session ID
   */
  async getWorkflowBySessionId(sessionId: string): Promise<OpalWorkflowResult | undefined> {
    try {
      return await dbWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return undefined;
          }
          handleDatabaseError(error, 'workflow fetch by session');
        }

        return this.mapWorkflowRowToResult(data);
      }, {
        operationName: 'get workflow by session',
        maxAttempts: 2
      });
    } catch (error) {
      console.error(`❌ Failed to get workflow by session ${sessionId}:`, error);
      return undefined;
    }
  }

  /**
   * Get all workflows (with pagination)
   */
  async getAllWorkflows(limit: number = 50, offset: number = 0): Promise<OpalWorkflowResult[]> {
    try {
      return await dbWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          handleDatabaseError(error, 'workflows fetch');
        }

        return data?.map(row => this.mapWorkflowRowToResult(row)) || [];
      }, {
        operationName: 'get all workflows',
        maxAttempts: 2
      });
    } catch (error) {
      console.error('❌ Failed to get all workflows:', error);
      return [];
    }
  }

  /**
   * Get latest workflow
   */
  async getLatestWorkflow(): Promise<OpalWorkflowResult | undefined> {
    try {
      return await dbWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return undefined;
          }
          handleDatabaseError(error, 'latest workflow fetch');
        }

        return this.mapWorkflowRowToResult(data);
      }, {
        operationName: 'get latest workflow',
        maxAttempts: 2
      });
    } catch (error) {
      console.error('❌ Failed to get latest workflow:', error);
      return undefined;
    }
  }

  /**
   * Get latest completed workflow for a specific client (for graceful degradation)
   */
  async getLatestCompletedWorkflowForClient(clientName: string): Promise<OpalWorkflowResult | undefined> {
    try {
      return await dbWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .select('*')
          .eq('client_name', clientName)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            console.log(`📊 No completed workflows found for client: ${clientName}`);
            return undefined;
          }
          handleDatabaseError(error, 'client workflow fetch');
        }

        console.log(`📊 Found cached workflow for ${clientName}: ${data.id}`);
        return this.mapWorkflowRowToResult(data);
      }, {
        operationName: 'get client latest workflow',
        maxAttempts: 2
      });
    } catch (error) {
      console.error(`❌ Failed to get latest workflow for client ${clientName}:`, error);
      return undefined;
    }
  }

  /**
   * Get specific agent result
   */
  async getAgentResult(workflowId: string, agentId: string): Promise<OpalAgentResult | undefined> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow?.results[agentId]?.success) {
        return undefined;
      }
      return workflow.results[agentId];
    } catch (error) {
      console.error(`❌ Failed to get agent result for ${agentId}:`, error);
      return undefined;
    }
  }

  /**
   * Get all agent results for a workflow
   */
  async getAllResults(workflowId: string): Promise<{ [key: string]: OpalAgentResult }> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      return workflow?.results || {};
    } catch (error) {
      console.error(`❌ Failed to get all results for workflow ${workflowId}:`, error);
      return {};
    }
  }

  /**
   * Clean up old workflows
   */
  async cleanupOldWorkflows(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      return await dbWithRetry(async () => {
        const cutoffTime = new Date(Date.now() - maxAgeMs).toISOString();

        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .delete()
          .lt('created_at', cutoffTime)
          .select('id');

        if (error) {
          handleDatabaseError(error, 'workflow cleanup');
        }

        const deletedCount = data?.length || 0;
        console.log(`🧹 Cleaned up ${deletedCount} old workflows`);
        return deletedCount;
      }, {
        operationName: 'cleanup old workflows',
        maxAttempts: 2
      });
    } catch (error) {
      console.error('❌ Failed to cleanup old workflows:', error);
      return 0;
    }
  }

  /**
   * Reset daily rate limit (for testing/admin purposes)
   */
  async forceResetDailyLimit(): Promise<number> {
    try {
      return await dbWithRetry(async () => {
        const today = new Date().toISOString().split('T')[0];
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;

        // Delete all workflows from today to reset the count
        const { data, error } = await this.supabase
          .from('opal_workflow_executions')
          .delete()
          .gte('trigger_timestamp', startOfDay)
          .lte('trigger_timestamp', endOfDay)
          .select('id');

        if (error) {
          handleDatabaseError(error, 'daily limit reset');
        }

        const resetCount = data?.length || 0;
        console.log(`🔧 [Admin] Reset daily limit: deleted ${resetCount} workflows from today`);
        return resetCount;
      }, {
        operationName: 'reset daily limit',
        maxAttempts: 3
      });
    } catch (error) {
      console.error('❌ Failed to reset daily limit:', error);
      throw error;
    }
  }

  /**
   * Database health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('opal_workflow_executions')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database health check failed:', error);
        return false;
      }

      console.log('✅ Database health check passed');
      return true;
    } catch (error) {
      console.error('❌ Database health check error:', error);
      return false;
    }
  }

  /**
   * Create a mock workflow result when database is unavailable
   */
  private createMockWorkflow(
    workflowId: string,
    inputData: OSAWorkflowInput,
    sessionId?: string
  ): OpalWorkflowResult {
    const now = new Date().toISOString();

    console.log('🔧 [Opal] Mock workflow created for demo:', workflowId);

    return {
      workflow_id: workflowId,
      workflow_name: 'get_opal',
      status: 'pending',
      started_at: now,
      completed_at: undefined,
      input_data: inputData,
      results: {},
      metadata: {
        session_id: sessionId || `mock-session-${Date.now()}`,
        client_id: inputData.client_name,
        user_id: 'mock-user',
        mock_mode: true,
        database_unavailable: true,
        created_at: now
      }
    };
  }

  /**
   * Map database row to workflow result format
   */
  private mapWorkflowRowToResult(
    row: WorkflowRow,
    inputData?: OSAWorkflowInput
  ): OpalWorkflowResult {
    // Reconstruct input data from database fields if not provided
    const workflowInputData = inputData || {
      client_name: row.client_name,
      industry: row.industry || '',
      company_size: row.company_size || '',
      current_capabilities: row.current_capabilities || {},
      business_objectives: row.business_objectives || {},
      additional_marketing_technology: row.additional_marketing_technology || {},
      timeline_preference: row.timeline_preference || '',
      budget_range: row.budget_range || '',
      recipients: row.recipients || []
    };

    // Combine completed and failed agents into results
    const completedAgents = row.completed_agents || {};
    const failedAgents = row.failed_agents || {};
    const results = { ...completedAgents, ...failedAgents };

    return {
      workflow_id: row.id,
      workflow_name: 'get_opal', // Static workflow name for compatibility
      status: row.status as OpalWorkflowResult['status'],
      started_at: row.started_at || row.created_at,
      completed_at: row.completed_at || undefined,
      input_data: workflowInputData,
      results,
      metadata: {
        session_id: row.session_id,
        client_id: row.client_name, // Use client_name as client_id for compatibility
        user_id: row.triggered_by
      }
    };
  }
}

// Export singleton instance for backward compatibility
export const supabaseOpalDataStore = SupabaseOpalDataStore.getInstance();

// For legacy compatibility, export as opalDataStore
export const opalDataStore = supabaseOpalDataStore;