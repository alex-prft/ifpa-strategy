import { NextResponse } from 'next/server';

/**
 * Opal Discovery endpoint for Email Notification Service Tool
 * Returns function definitions in Opal-compatible format
 */
export async function GET(): Promise<NextResponse> {
  try {
    const discoveryResponse = {
      functions: [
        {
          name: "sendgrid_personalization_plan_notification",
          description: "Send email notifications and plan delivery via SendGrid integration",
          parameters: [
            {
              name: "to",
              type: "array",
              description: "Array of recipient email addresses",
              required: true
            },
            {
              name: "subject",
              type: "string",
              description: "Email subject line (for custom emails)",
              required: false
            },
            {
              name: "html",
              type: "string",
              description: "HTML email body content",
              required: false
            },
            {
              name: "text",
              type: "string",
              description: "Plain text email body content",
              required: false
            },
            {
              name: "plan_title",
              type: "string",
              description: "Title of personalization plan (for structured notifications)",
              required: false
            },
            {
              name: "cmp_url",
              type: "string",
              description: "Campaign Management Platform URL for plan access",
              required: false
            },
            {
              name: "plan_summary",
              type: "string",
              description: "Executive summary of the personalization plan",
              required: false
            },
            {
              name: "sender_name",
              type: "string",
              description: "Name of the email sender",
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