import { NextRequest, NextResponse } from 'next/server';
import { ODPClient } from '@/lib/integrations/odp-client';
import { resolveIdentifier, createIdentifierObject, createTrackingContext } from '@/lib/utils/id-resolution';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse, AudienceToolResponse, UserIdentifier } from '@/lib/types';

/**
 * Audience Tool - com.acme.opal.audience
 * Resolve user ID and return segment memberships and attributes from ODP + Salesforce
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'audience-lookup');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { ids } = body;

    if (!ids || typeof ids !== 'object') {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Missing or invalid "ids" object in request body',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Create identifier object and resolve priority ID
    const identifierObject: UserIdentifier = createIdentifierObject(ids);
    const resolvedId = resolveIdentifier(identifierObject);

    if (!resolvedId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'No valid identifier found in provided IDs',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Create tracking context for audit
    const trackingContext = createTrackingContext(resolvedId, 'audience-lookup');
    console.log('Audience lookup request:', trackingContext);

    // Initialize ODP client and fetch user profile
    const odpClient = new ODPClient();

    try {
      // Get user profile with segments and attributes
      const userProfile = await odpClient.getUserProfile(resolvedId.id, resolvedId.id_type);

      // Get available segments for context
      const availableSegments = await odpClient.getSegments();

      // Get allowlisted attributes
      const allowlistedAttributes = await odpClient.getAllowlistedAttributes();

      // Filter user attributes to only include allowlisted ones
      const filteredAttributes: Record<string, any> = {};
      if (userProfile.attributes) {
        for (const attr of allowlistedAttributes) {
          if (userProfile.attributes[attr] !== undefined) {
            filteredAttributes[attr] = userProfile.attributes[attr];
          }
        }
      }

      // Calculate coverage estimates for user's segments
      const coverageEstimates: Record<string, number> = {};
      if (userProfile.segments && Array.isArray(userProfile.segments)) {
        for (const segmentId of userProfile.segments) {
          try {
            const segment = availableSegments.find(s => s.id === segmentId);
            if (segment?.logic) {
              const estimatedSize = await odpClient.getAudienceSize(segment.logic);
              if (estimatedSize) {
                coverageEstimates[segmentId] = estimatedSize;
              }
            }
          } catch (error) {
            // Continue if coverage estimation fails for individual segments
            console.warn(`Failed to estimate coverage for segment ${segmentId}:`, error);
          }
        }
      }

      // Construct response
      const responseData: AudienceToolResponse = {
        id: resolvedId.id,
        id_type: resolvedId.id_type,
        segments: userProfile.segments || [],
        attributes: filteredAttributes,
        coverage_estimates: coverageEstimates
      };

      const processingTime = Date.now() - startTime;

      return NextResponse.json<APIResponse<AudienceToolResponse>>({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-ID-Resolution': resolvedId.id_type,
          'X-Confidence': resolvedId.confidence.toString()
        }
      });

    } catch (odpError) {
      console.error('ODP API error:', odpError);

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Failed to fetch user profile from ODP: ${odpError}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    console.error('Audience Tool error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in audience lookup',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for health check and basic info
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    return NextResponse.json({
      tool_id: 'com.acme.opal.audience',
      name: 'Audience Tool',
      description: 'Resolve user identifiers and return segment memberships and attributes from ODP + Salesforce',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        lookup: {
          method: 'POST',
          path: '/api/tools/audience',
          description: 'Look up user profile and segments'
        },
        health: {
          method: 'GET',
          path: '/api/tools/audience',
          description: 'Health check and tool information'
        }
      },
      id_priority: ['email_hash', 'sf_contact_id', 'opti_user_id', 'zaius_id'],
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