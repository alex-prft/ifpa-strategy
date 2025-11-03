import { NextRequest, NextResponse } from 'next/server';
import { ExperimentationClient } from '@/lib/integrations/experimentation-client';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse, ExperimentsToolResponse } from '@/lib/types';

/**
 * Experiments Tool - com.acme.opal.experiments
 * Return catalog/history of experiments for context and learning avoidance
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'experiments-lookup');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!));
    }

    // Parse request body
    const body = await request.json();
    const { kpi, path, audience, limit = 20, include_results = true } = body;

    // Initialize Experimentation client
    const experimentationClient = new ExperimentationClient();

    try {
      // Build filters for experiment search
      const filters: any = {
        limit: Math.min(limit, 100) // Cap at 100 for performance
      };

      if (kpi) filters.kpi = kpi;
      if (audience) filters.audience = audience;

      // Get experiments with filters
      const experiments = await experimentationClient.getExperiments(filters);

      // Transform experiments to match expected response format
      const transformedExperiments = await Promise.all(
        experiments.map(async (exp) => {
          let winner = null;
          let notes = '';

          // Get experiment results if requested and experiment is completed
          if (include_results && exp.status === 'completed') {
            try {
              const results = await experimentationClient.getExperimentResults(exp.id);
              winner = results.winner || null;

              // Extract key insights from results
              if (results.summary) {
                notes = results.summary;
              } else if (results.statistical_significance) {
                notes = `Statistical significance: ${results.statistical_significance}`;
              }
            } catch (resultError) {
              console.warn(`Failed to fetch results for experiment ${exp.id}:`, resultError);
              notes = 'Results unavailable';
            }
          }

          return {
            name: exp.name || exp.key || 'Unnamed Experiment',
            url_scope: exp.url || exp.page_conditions || path || 'Unknown scope',
            winner: winner,
            notes: notes || exp.description || 'No notes available',
            date: exp.created_at || exp.modified_at || new Date().toISOString(),
            kpi: exp.primary_metric || exp.optimization_metric || kpi || 'Unknown KPI',
            audience: exp.audience_name || exp.targeting_conditions || 'All visitors'
          };
        })
      );

      // Filter by path if specified (post-processing since API might not support it)
      let filteredExperiments = transformedExperiments;
      if (path) {
        filteredExperiments = transformedExperiments.filter(exp =>
          exp.url_scope.toLowerCase().includes(path.toLowerCase())
        );
      }

      // Construct response
      const responseData: ExperimentsToolResponse = {
        items: filteredExperiments
      };

      const processingTime = Date.now() - startTime;

      return NextResponse.json<APIResponse<ExperimentsToolResponse>>({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Experiments-Count': filteredExperiments.length.toString(),
          'X-Total-Available': experiments.length.toString()
        }
      });

    } catch (experimentationError) {
      console.error('Experimentation API error:', experimentationError);

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Failed to fetch experiments: ${experimentationError}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    console.error('Experiments Tool error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in experiments lookup',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for available metrics, audiences, and tool info
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!));
    }

    const url = new URL(request.url);
    const catalogType = url.searchParams.get('catalog');

    const experimentationClient = new ExperimentationClient();

    if (catalogType === 'metrics') {
      try {
        const metrics = await experimentationClient.getAvailableMetrics();
        return NextResponse.json({
          success: true,
          data: { metrics },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch available metrics',
          timestamp: new Date().toISOString()
        }, { status: 502 });
      }
    }

    if (catalogType === 'audiences') {
      try {
        const audiences = await experimentationClient.getAvailableAudiences();
        return NextResponse.json({
          success: true,
          data: { audiences },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch audiences:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch available audiences',
          timestamp: new Date().toISOString()
        }, { status: 502 });
      }
    }

    if (catalogType === 'features') {
      try {
        const features = await experimentationClient.getFeatureFlags();
        return NextResponse.json({
          success: true,
          data: { features },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch feature flags',
          timestamp: new Date().toISOString()
        }, { status: 502 });
      }
    }

    // Default: return tool info
    return NextResponse.json({
      tool_id: 'com.acme.opal.experiments',
      name: 'Experiments Tool',
      description: 'Return catalog/history of experiments for context and learning avoidance',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        lookup: {
          method: 'POST',
          path: '/api/tools/experiments',
          description: 'Get experiments catalog with optional filters',
          parameters: {
            kpi: 'string (optional)',
            path: 'string (optional)',
            audience: 'string (optional)',
            limit: 'number (optional, max 100)',
            include_results: 'boolean (optional, default true)'
          }
        },
        metrics: {
          method: 'GET',
          path: '/api/tools/experiments?catalog=metrics',
          description: 'Get available experiment metrics'
        },
        audiences: {
          method: 'GET',
          path: '/api/tools/experiments?catalog=audiences',
          description: 'Get available experiment audiences'
        },
        features: {
          method: 'GET',
          path: '/api/tools/experiments?catalog=features',
          description: 'Get available feature flags'
        }
      },
      supported_catalogs: ['metrics', 'audiences', 'features'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}