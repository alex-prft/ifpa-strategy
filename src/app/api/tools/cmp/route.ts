import { NextRequest, NextResponse } from 'next/server';
import { CMPClient } from '@/lib/integrations/cmp-client';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse, CMPToolResponse } from '@/lib/types';

/**
 * CMP Tool - com.acme.cmp
 * Create CMP campaign/brief with generated plan and return shareable URL
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'cmp-publish');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!));
    }

    // Parse request body
    const body = await request.json();
    const { title, plan_markdown, project_key, tasks } = body;

    if (!title || !plan_markdown) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Missing required fields: "title" and "plan_markdown"',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Initialize CMP client
    const cmpClient = new CMPClient();

    try {
      // Publish the complete plan to CMP
      const publishResult = await cmpClient.publishPlan({
        title,
        markdown_content: plan_markdown,
        project_key,
        tasks: tasks || []
      });

      // Construct response
      const responseData: CMPToolResponse = {
        campaign_url: publishResult.campaign_url,
        campaign_id: publishResult.campaign_id,
        brief_id: publishResult.brief_id,
        status: 'success'
      };

      const processingTime = Date.now() - startTime;

      // Log successful publication
      console.log('CMP plan published successfully:', {
        campaign_id: publishResult.campaign_id,
        brief_id: publishResult.brief_id,
        title: title,
        processing_time: processingTime
      });

      return NextResponse.json<APIResponse<CMPToolResponse>>({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Campaign-ID': publishResult.campaign_id,
          'X-Brief-ID': publishResult.brief_id
        }
      });

    } catch (cmpError) {
      console.error('CMP API error:', cmpError);

      return NextResponse.json<APIResponse<CMPToolResponse>>({
        success: false,
        data: {
          campaign_url: '',
          campaign_id: '',
          brief_id: '',
          status: 'error',
          message: `Failed to publish to CMP: ${cmpError}`
        },
        error: `CMP publication failed: ${cmpError}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    console.error('CMP Tool error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in CMP publication',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for CMP status and campaign retrieval
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!));
    }

    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaign_id');

    if (campaignId) {
      // Get specific campaign details
      const cmpClient = new CMPClient();

      try {
        const campaignDetails = await cmpClient.getCampaignDetails(campaignId);
        const shareableUrl = await cmpClient.getShareableURL(campaignId);

        return NextResponse.json({
          success: true,
          data: {
            ...campaignDetails,
            shareable_url: shareableUrl
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch campaign details:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch campaign details',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
    }

    // Default: return tool info
    return NextResponse.json({
      tool_id: 'com.acme.cmp',
      name: 'CMP Tool',
      description: 'Create CMP campaign/brief with generated plan and return shareable URL',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        publish: {
          method: 'POST',
          path: '/api/tools/cmp',
          description: 'Publish personalization plan to CMP',
          parameters: {
            title: 'string (required)',
            plan_markdown: 'string (required)',
            project_key: 'string (optional)',
            tasks: 'array (optional)'
          }
        },
        campaign_details: {
          method: 'GET',
          path: '/api/tools/cmp?campaign_id={id}',
          description: 'Get campaign details and shareable URL'
        },
        health: {
          method: 'GET',
          path: '/api/tools/cmp',
          description: 'Tool health check and information'
        }
      },
      supported_actions: ['create_campaign', 'create_brief', 'create_tasks', 'get_shareable_url'],
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

/**
 * PATCH endpoint for updating campaign status
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!));
    }

    const body = await request.json();
    const { campaign_id, status } = body;

    if (!campaign_id || !status) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Missing required fields: "campaign_id" and "status"',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const cmpClient = new CMPClient();

    try {
      const updatedCampaign = await cmpClient.updateCampaignStatus(campaign_id, status);

      return NextResponse.json<APIResponse<any>>({
        success: true,
        data: updatedCampaign,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to update campaign status:', error);
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Failed to update campaign status: ${error}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}