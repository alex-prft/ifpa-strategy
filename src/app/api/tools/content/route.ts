import { NextRequest, NextResponse } from 'next/server';
import { ContentRecsClient } from '@/lib/integrations/content-recs-client';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse, ContentToolResponse } from '@/lib/types';

/**
 * Content Tool - com.acme.opal.content
 * Provide Content Recommendations context by topic/section for personalization ideas
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'content-lookup');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { topic, section, audience } = body;

    if (!topic && !section) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Either "topic" or "section" parameter is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Initialize Content Recommendations client
    const contentRecsClient = new ContentRecsClient();

    try {
      let recommendations: any[] = [];

      // Fetch recommendations based on topic or section
      if (topic) {
        recommendations = await contentRecsClient.getRecommendationsByTopic(topic, audience);
      } else if (section) {
        recommendations = await contentRecsClient.getRecommendationsBySection(section, audience);
      }

      // Transform recommendations to match expected response format
      const transformedRecommendations = recommendations.map(rec => ({
        title: rec.title || 'Untitled Content',
        url: rec.url || '#',
        topics: Array.isArray(rec.topics) ? rec.topics : (rec.topic ? [rec.topic] : []),
        sections: Array.isArray(rec.sections) ? rec.sections : (rec.section ? [rec.section] : []),
        confidence: rec.confidence || rec.score || 0.5
      }));

      // Construct response
      const responseData: ContentToolResponse = {
        recommendations: transformedRecommendations
      };

      const processingTime = Date.now() - startTime;

      return NextResponse.json<APIResponse<ContentToolResponse>>({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Recommendations-Count': transformedRecommendations.length.toString(),
          'X-Query-Type': topic ? 'topic' : 'section'
        }
      });

    } catch (contentError) {
      console.error('Content Recommendations API error:', contentError);

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Failed to fetch content recommendations: ${contentError}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    console.error('Content Tool error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in content lookup',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for available topics and sections
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    const url = new URL(request.url);
    const catalogType = url.searchParams.get('catalog');

    const contentRecsClient = new ContentRecsClient();

    if (catalogType === 'topics') {
      try {
        const topics = await contentRecsClient.getAvailableTopics();
        return NextResponse.json({
          success: true,
          data: { topics },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch available topics',
          timestamp: new Date().toISOString()
        }, { status: 502 });
      }
    }

    if (catalogType === 'sections') {
      try {
        const sections = await contentRecsClient.getAvailableSections();
        return NextResponse.json({
          success: true,
          data: { sections },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch sections:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch available sections',
          timestamp: new Date().toISOString()
        }, { status: 502 });
      }
    }

    // Default: return tool info and available catalogs
    return NextResponse.json({
      tool_id: 'com.acme.opal.content',
      name: 'Content Tool',
      description: 'Provide Content Recommendations context by topic/section for personalization ideas',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        lookup: {
          method: 'POST',
          path: '/api/tools/content',
          description: 'Get content recommendations by topic or section',
          parameters: {
            topic: 'string (optional)',
            section: 'string (optional)',
            audience: 'string (optional)'
          }
        },
        topics: {
          method: 'GET',
          path: '/api/tools/content?catalog=topics',
          description: 'Get available content topics'
        },
        sections: {
          method: 'GET',
          path: '/api/tools/content?catalog=sections',
          description: 'Get available content sections'
        }
      },
      supported_catalogs: ['topics', 'sections'],
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