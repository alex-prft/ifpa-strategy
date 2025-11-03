import { NextRequest, NextResponse } from 'next/server';
import { MSGraphClient } from '@/lib/integrations/msgraph-client';
import { requireAuthentication, createAuthErrorResponse, createAuthAuditLog } from '@/lib/utils/auth';
import { APIResponse, NotifyToolResponse } from '@/lib/types';

/**
 * Notify Tool - com.acme.notify
 * Send email notifications to stakeholders via Microsoft Graph
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      const auditLog = createAuthAuditLog(request, authResult, 'notify-send');
      console.error('Authentication failed:', auditLog);
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, plan_title, cmp_url, plan_summary, sender_name } = body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Missing or invalid "to" field - must be an array of email addresses',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!subject && !plan_title) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Either "subject" or "plan_title" is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Initialize Microsoft Graph client
    const msGraphClient = new MSGraphClient();

    try {
      // Validate email addresses
      const validationResult = msGraphClient.validateEmailAddresses(to);

      if (validationResult.invalid.length > 0) {
        console.warn('Invalid email addresses detected:', validationResult.invalid);
      }

      if (validationResult.valid.length === 0) {
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'No valid email addresses provided',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      let emailResult;

      // Check if this is a plan notification or custom email
      if (plan_title && cmp_url) {
        // Send structured plan notification
        emailResult = await msGraphClient.sendPlanNotification({
          recipients: validationResult.valid,
          plan_title,
          cmp_url,
          plan_summary,
          sender_name
        });
      } else {
        // Send custom email
        if (!html && !text) {
          return NextResponse.json<APIResponse<null>>({
            success: false,
            error: 'Either "html" or "text" body content is required for custom emails',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        emailResult = await msGraphClient.sendEmail({
          to: validationResult.valid,
          subject: subject!,
          html_body: html,
          text_body: text
        });
      }

      // Construct response
      const responseData: NotifyToolResponse = {
        status: 'success',
        message_id: emailResult.message_id,
        message: `Email sent successfully to ${validationResult.valid.length} recipient(s)`
      };

      const processingTime = Date.now() - startTime;

      // Log successful notification
      console.log('Email notification sent successfully:', {
        recipients_count: validationResult.valid.length,
        message_id: emailResult.message_id,
        plan_title: plan_title || 'Custom email',
        processing_time: processingTime
      });

      return NextResponse.json<APIResponse<NotifyToolResponse>>({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Recipients-Count': validationResult.valid.length.toString(),
          'X-Message-ID': emailResult.message_id || 'unknown'
        }
      });

    } catch (emailError) {
      console.error('Microsoft Graph email error:', emailError);

      return NextResponse.json<APIResponse<NotifyToolResponse>>({
        success: false,
        data: {
          status: 'error',
          message: `Failed to send email: ${emailError}`
        },
        error: `Email notification failed: ${emailError}`,
        timestamp: new Date().toISOString()
      }, { status: 502 });
    }

  } catch (error) {
    console.error('Notify Tool error:', error);

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error in email notification',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for tool status and email templates
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    const url = new URL(request.url);
    const templateType = url.searchParams.get('template');

    if (templateType === 'plan_notification') {
      // Return template structure for plan notifications
      return NextResponse.json({
        success: true,
        data: {
          template_type: 'plan_notification',
          required_fields: ['plan_title', 'cmp_url'],
          optional_fields: ['plan_summary', 'sender_name'],
          description: 'Structured template for personalization plan notifications'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Default: return tool info
    return NextResponse.json({
      tool_id: 'com.acme.notify',
      name: 'Notify Tool',
      description: 'Send email notifications to stakeholders via Microsoft Graph',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        send_email: {
          method: 'POST',
          path: '/api/tools/notify',
          description: 'Send email notification (custom or plan notification)',
          parameters: {
            to: 'string[] (required)',
            subject: 'string (required for custom emails)',
            html: 'string (optional)',
            text: 'string (optional)',
            plan_title: 'string (for plan notifications)',
            cmp_url: 'string (for plan notifications)',
            plan_summary: 'string (optional)',
            sender_name: 'string (optional)'
          }
        },
        template_info: {
          method: 'GET',
          path: '/api/tools/notify?template=plan_notification',
          description: 'Get information about email templates'
        },
        health: {
          method: 'GET',
          path: '/api/tools/notify',
          description: 'Tool health check and information'
        }
      },
      supported_templates: ['plan_notification', 'custom'],
      email_provider: 'Microsoft Graph',
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