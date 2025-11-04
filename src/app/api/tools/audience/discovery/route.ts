import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for Audience Tool
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "odp_audience_profile_lookup",
          description: "Look up user profile and segments from Optimizely Data Platform and Salesforce integration",
          parameters: [
            {
              name: "email_hash",
              type: "string",
              description: "Hashed email identifier for user lookup",
              required: false
            },
            {
              name: "sf_contact_id",
              type: "string",
              description: "Salesforce contact ID for user lookup",
              required: false
            },
            {
              name: "opti_user_id",
              type: "string",
              description: "Optimizely user ID for lookup",
              required: false
            },
            {
              name: "zaius_id",
              type: "string",
              description: "Legacy Zaius identifier for lookup",
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