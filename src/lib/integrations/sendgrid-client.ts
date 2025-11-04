import { SendGridConfig } from '../types';
import { getSendGridConfig } from '../utils/config';

export class SendGridClient {
  private config: SendGridConfig;

  constructor() {
    this.config = getSendGridConfig();
  }

  /**
   * Send email notification using SendGrid API
   */
  async sendEmail(emailData: {
    to: string[];
    subject: string;
    html_body?: string;
    text_body?: string;
    cc?: string[];
    bcc?: string[];
    from?: string;
  }): Promise<any> {
    try {
      const message = {
        personalizations: [
          {
            to: emailData.to.map(email => ({ email })),
            cc: emailData.cc?.map(email => ({ email })) || [],
            bcc: emailData.bcc?.map(email => ({ email })) || [],
            subject: emailData.subject
          }
        ],
        from: {
          email: emailData.from || this.config.sender_email,
          name: this.config.sender_name || 'Opal AI Personalization System'
        },
        content: [] as Array<{ type: string; value: string }>
      };

      // Add content based on what's provided
      if (emailData.text_body) {
        message.content.push({
          type: 'text/plain',
          value: emailData.text_body
        });
      }

      if (emailData.html_body) {
        message.content.push({
          type: 'text/html',
          value: emailData.html_body
        });
      }

      // If no content provided, use subject as text
      if (message.content.length === 0) {
        message.content.push({
          type: 'text/plain',
          value: emailData.subject
        });
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
      }

      // SendGrid returns 202 Accepted with minimal response for successful sends
      return {
        status: 'success',
        message_id: response.headers.get('x-message-id') || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('SendGrid sendEmail error:', error);
      throw new Error(`Failed to send email via SendGrid: ${error}`);
    }
  }

  /**
   * Send structured plan notification using SendGrid
   */
  async sendPlanNotification(notificationData: {
    recipients: string[];
    plan_title: string;
    cmp_url: string;
    plan_summary?: string;
    sender_name?: string;
  }): Promise<any> {
    try {
      const subject = `📊 Personalization Plan Ready for Review: ${notificationData.plan_title}`;

      const htmlBody = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Personalization Plan Ready</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 8px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  🎯 Personalization Strategy Plan
                </h1>
              </div>

              <!-- Greeting -->
              <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>

              <!-- Main Message -->
              <p style="font-size: 16px; margin-bottom: 25px;">
                Your personalization strategy plan "<strong>${notificationData.plan_title}</strong>" has been generated and is now ready for review.
              </p>

              ${notificationData.plan_summary ? `
                <!-- Plan Summary -->
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                  <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">📋 Plan Overview:</h3>
                  <p style="margin-bottom: 0; font-size: 15px; line-height: 1.5;">${notificationData.plan_summary}</p>
                </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${notificationData.cmp_url}"
                   style="background-color: #2563eb; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  📖 View Plan in CMP →
                </a>
              </div>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 35px 0;">

              <!-- Next Steps -->
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">📋 Next Steps:</h3>
                <ul style="color: #92400e; margin-bottom: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Review the personalization strategy and experiment blueprints</li>
                  <li style="margin-bottom: 8px;">Validate audience targeting and coverage estimates</li>
                  <li style="margin-bottom: 8px;">Assign tasks and set implementation timeline</li>
                  <li style="margin-bottom: 0;">Schedule kickoff meeting with implementation team</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center;">
                <p style="margin-bottom: 10px;">
                  <strong>Generated by Opal AI Personalization System</strong>
                </p>
                ${notificationData.sender_name ? `
                  <p style="margin-bottom: 10px;">Requested by: ${notificationData.sender_name}</p>
                ` : ''}
                <p style="margin-bottom: 0;">
                  <em>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</em>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const textBody = `
PERSONALIZATION STRATEGY PLAN READY FOR REVIEW

Your personalization strategy plan "${notificationData.plan_title}" has been generated and is now ready for review.

${notificationData.plan_summary ? `Plan Overview: ${notificationData.plan_summary}\n\n` : ''}

VIEW THE COMPLETE PLAN:
${notificationData.cmp_url}

NEXT STEPS:
- Review the personalization strategy and experiment blueprints
- Validate audience targeting and coverage estimates
- Assign tasks and set implementation timeline
- Schedule kickoff meeting with implementation team

---
Generated by Opal AI Personalization System
${notificationData.sender_name ? `Requested by: ${notificationData.sender_name}\n` : ''}Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      `;

      return await this.sendEmail({
        to: notificationData.recipients,
        subject: subject,
        html_body: htmlBody,
        text_body: textBody
      });
    } catch (error) {
      console.error('SendGrid sendPlanNotification error:', error);
      throw new Error(`Failed to send plan notification: ${error}`);
    }
  }

  /**
   * Validate email addresses format
   */
  validateEmailAddresses(emails: string[]): { valid: string[]; invalid: string[] } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      if (emailRegex.test(email.trim())) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
      }
    }

    return { valid, invalid };
  }

  /**
   * Test SendGrid API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }
}