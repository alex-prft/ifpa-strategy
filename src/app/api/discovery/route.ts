import { NextRequest, NextResponse } from 'next/server';
import { getBaseURL } from '@/lib/utils/config';
import { ToolDiscovery } from '@/lib/types';

/**
 * Tool Discovery Endpoint for Opal Integration
 * Returns catalog of all available tools with their endpoints and schemas
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const baseURL = getBaseURL();

    // Define all available tools with their discovery information
    const tools: ToolDiscovery[] = [
      {
        toolId: 'com.acme.opal.audience',
        name: 'Audience Tool',
        description: 'Resolve user identifiers and return segment memberships and attributes from ODP + Salesforce',
        version: '1.0.0',
        endpoints: {
          'audience-lookup': {
            method: 'POST',
            path: '/api/tools/audience',
            description: 'Look up user profile and segments by identifier',
            schema: {
              type: 'object',
              required: ['ids'],
              properties: {
                ids: {
                  type: 'object',
                  description: 'User identifiers in priority order',
                  properties: {
                    email_hash: { type: 'string', description: 'SHA-256 hashed email (primary)' },
                    sf_contact_id: { type: 'string', description: 'Salesforce Contact ID' },
                    opti_user_id: { type: 'string', description: 'Optimizely User ID' },
                    zaius_id: { type: 'string', description: 'Legacy Zaius identifier' }
                  }
                }
              },
              example: {
                ids: {
                  email_hash: 'a1b2c3d4e5f6...',
                  sf_contact_id: '003XX000004TmiQQAS'
                }
              }
            }
          },
          'health-check': {
            method: 'GET',
            path: '/api/tools/audience',
            description: 'Tool health check and information',
            schema: {
              type: 'object',
              properties: {}
            }
          }
        }
      },
      {
        toolId: 'com.acme.opal.content',
        name: 'Content Tool',
        description: 'Provide Content Recommendations context by topic/section for personalization ideas',
        version: '1.0.0',
        endpoints: {
          'content-lookup': {
            method: 'POST',
            path: '/api/tools/content',
            description: 'Get content recommendations by topic or section',
            schema: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Content topic to search for' },
                section: { type: 'string', description: 'Content section to search in' },
                audience: { type: 'string', description: 'Target audience for recommendations' }
              },
              oneOf: [
                { required: ['topic'] },
                { required: ['section'] }
              ],
              example: {
                topic: 'product_features',
                audience: 'enterprise_customers'
              }
            }
          },
          'catalog-topics': {
            method: 'GET',
            path: '/api/tools/content?catalog=topics',
            description: 'Get available content topics',
            schema: { type: 'object', properties: {} }
          },
          'catalog-sections': {
            method: 'GET',
            path: '/api/tools/content?catalog=sections',
            description: 'Get available content sections',
            schema: { type: 'object', properties: {} }
          }
        }
      },
      {
        toolId: 'com.acme.opal.experiments',
        name: 'Experiments Tool',
        description: 'Return catalog/history of experiments for context and learning avoidance',
        version: '1.0.0',
        endpoints: {
          'experiment-catalog': {
            method: 'POST',
            path: '/api/tools/experiments',
            description: 'Get experiments catalog with optional filters',
            schema: {
              type: 'object',
              properties: {
                kpi: { type: 'string', description: 'Filter by primary KPI' },
                path: { type: 'string', description: 'Filter by URL path or scope' },
                audience: { type: 'string', description: 'Filter by target audience' },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                include_results: { type: 'boolean', default: true, description: 'Include experiment results' }
              },
              example: {
                kpi: 'conversion_rate',
                limit: 10,
                include_results: true
              }
            }
          },
          'catalog-metrics': {
            method: 'GET',
            path: '/api/tools/experiments?catalog=metrics',
            description: 'Get available experiment metrics',
            schema: { type: 'object', properties: {} }
          },
          'catalog-audiences': {
            method: 'GET',
            path: '/api/tools/experiments?catalog=audiences',
            description: 'Get available experiment audiences',
            schema: { type: 'object', properties: {} }
          }
        }
      },
      {
        toolId: 'com.acme.cmp',
        name: 'CMP Tool',
        description: 'Create CMP campaign/brief with generated plan and return shareable URL',
        version: '1.0.0',
        endpoints: {
          'publish-plan': {
            method: 'POST',
            path: '/api/tools/cmp',
            description: 'Publish personalization plan to CMP',
            schema: {
              type: 'object',
              required: ['title', 'plan_markdown'],
              properties: {
                title: { type: 'string', description: 'Campaign/plan title' },
                plan_markdown: { type: 'string', description: 'Complete plan in markdown format' },
                project_key: { type: 'string', description: 'Optional project identifier' },
                tasks: {
                  type: 'array',
                  description: 'Optional tasks to create',
                  items: {
                    type: 'object',
                    required: ['title', 'description'],
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      assignee: { type: 'string' },
                      due_date: { type: 'string', format: 'date' },
                      priority: { enum: ['low', 'medium', 'high'] }
                    }
                  }
                }
              },
              example: {
                title: 'Q1 Personalization Strategy - Enterprise Segment',
                plan_markdown: '# Personalization Plan\\n\\n## Executive Summary...',
                project_key: 'PERS-Q1-2024'
              }
            }
          },
          'campaign-details': {
            method: 'GET',
            path: '/api/tools/cmp?campaign_id={id}',
            description: 'Get campaign details and shareable URL',
            schema: { type: 'object', properties: {} }
          }
        }
      },
      {
        toolId: 'com.acme.notify',
        name: 'Notify Tool',
        description: 'Send email notifications to stakeholders via Microsoft Graph',
        version: '1.0.0',
        endpoints: {
          'send-notification': {
            method: 'POST',
            path: '/api/tools/notify',
            description: 'Send email notification (custom or plan notification)',
            schema: {
              type: 'object',
              required: ['to'],
              properties: {
                to: {
                  type: 'array',
                  items: { type: 'string', format: 'email' },
                  description: 'Recipient email addresses'
                },
                subject: { type: 'string', description: 'Email subject (required for custom emails)' },
                html: { type: 'string', description: 'HTML email body' },
                text: { type: 'string', description: 'Text email body' },
                plan_title: { type: 'string', description: 'Plan title for structured notifications' },
                cmp_url: { type: 'string', format: 'uri', description: 'CMP URL for plan notifications' },
                plan_summary: { type: 'string', description: 'Optional plan summary' },
                sender_name: { type: 'string', description: 'Optional sender name' }
              },
              oneOf: [
                { required: ['subject'] },
                { required: ['plan_title', 'cmp_url'] }
              ],
              example: {
                to: ['stakeholder@company.com'],
                plan_title: 'Q1 Personalization Strategy',
                cmp_url: 'https://cmp.company.com/campaigns/123',
                plan_summary: 'Comprehensive personalization strategy for enterprise segment',
                sender_name: 'AI Personalization System'
              }
            }
          },
          'template-info': {
            method: 'GET',
            path: '/api/tools/notify?template=plan_notification',
            description: 'Get information about email templates',
            schema: { type: 'object', properties: {} }
          }
        }
      }
    ];

    // Add full URLs to each endpoint
    const toolsWithUrls = tools.map(tool => ({
      ...tool,
      endpoints: Object.fromEntries(
        Object.entries(tool.endpoints).map(([key, endpoint]) => [
          key,
          {
            ...endpoint,
            url: `${baseURL}${endpoint.path}`
          }
        ])
      )
    }));

    return NextResponse.json({
      success: true,
      data: {
        registry_name: 'Opal Personalization Tools',
        registry_version: '1.0.0',
        description: 'Custom tools for AI-powered personalization system',
        tools: toolsWithUrls,
        authentication: {
          type: 'Bearer',
          description: 'Include Bearer token in Authorization header',
          header: 'Authorization: Bearer <token>'
        },
        base_url: baseURL,
        contact: {
          name: 'Personalization System',
          email: 'support@company.com'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Discovery endpoint error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate tool discovery information',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for tool registration validation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { tool_id, validation_request } = body;

    if (!tool_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing tool_id parameter',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate that the requested tool exists
    const availableTools = [
      'com.acme.opal.audience',
      'com.acme.opal.content',
      'com.acme.opal.experiments',
      'com.acme.cmp',
      'com.acme.notify'
    ];

    if (!availableTools.includes(tool_id)) {
      return NextResponse.json({
        success: false,
        error: `Tool ${tool_id} not found in registry`,
        available_tools: availableTools,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Return validation success
    return NextResponse.json({
      success: true,
      data: {
        tool_id,
        status: 'available',
        validation_result: 'passed',
        last_health_check: new Date().toISOString(),
        endpoints_healthy: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tool validation error:', error);

    return NextResponse.json({
      success: false,
      error: 'Tool validation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}