import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for PMG Maturity Generator Workflow
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "pmg_personalization_maturity_assessment",
          description: "Complete personalization maturity assessment and strategic planning workflow with 4-phase framework",
          parameters: [
            {
              name: "client_name",
              type: "string",
              description: "Name of the client organization",
              required: true
            },
            {
              name: "industry",
              type: "string",
              description: "Industry sector of the organization",
              required: false
            },
            {
              name: "company_size",
              type: "string",
              description: "Company size category (small, medium, large, enterprise)",
              required: false
            },
            {
              name: "current_capabilities",
              type: "array",
              description: "Array of current personalization capabilities",
              required: false
            },
            {
              name: "business_objectives",
              type: "array",
              description: "Array of business objectives and goals",
              required: true
            },
            {
              name: "timeline_preference",
              type: "string",
              description: "Preferred implementation timeline (6-months, 12-months, 18-months, 24-months)",
              required: false
            },
            {
              name: "budget_range",
              type: "string",
              description: "Budget range for implementation (under-100k, 100k-500k, 500k-1m, over-1m)",
              required: false
            },
            {
              name: "recipients",
              type: "array",
              description: "Array of email addresses to receive the generated plan",
              required: true
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