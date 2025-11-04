import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for Experimentation Analytics Tool
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "optimizely_experiment_analytics_data",
          description: "Access historical experiment data and performance metrics from Optimizely Experimentation platform",
          parameters: [
            {
              name: "lookback_days",
              type: "integer",
              description: "Number of days to look back for experiment data (default: 90)",
              required: false
            },
            {
              name: "include_archived",
              type: "boolean",
              description: "Whether to include archived experiments in results",
              required: false
            },
            {
              name: "project_id",
              type: "string",
              description: "Specific project ID to filter experiments",
              required: false
            },
            {
              name: "status_filter",
              type: "string",
              description: "Filter experiments by status (running, completed, paused)",
              required: false
            }
          ],
          endpoint: "/",
          http_method: "POST",
          auth_requirements: []
        }
      ]
    };

    return NextResponse.json(discoveryResponse);

  } catch (error) {
    return NextResponse.json({
      error: "Discovery endpoint failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}