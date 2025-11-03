import { MSGraphConfig } from '../types';
import { getMSGraphConfig } from '../utils/config';

export class MSGraphClient {
  private config: MSGraphConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = getMSGraphConfig();
  }

  /**
   * Get access token for Microsoft Graph API
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      // Get new token using client credentials flow
      const tokenUrl = `https://login.microsoftonline.com/${this.config.tenant_id}/oauth2/v2.0/token`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
          scope: 'https://graph.microsoft.com/.default'
        })
      });

      if (!response.ok) {
        throw new Error(`MS Graph auth error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('MS Graph getAccessToken error:', error);
      throw new Error(`Failed to get MS Graph access token: ${error}`);
    }
  }

  /**
   * Send email notification to stakeholders
   */
  async sendEmail(emailData: {
    to: string[];
    subject: string;
    html_body?: string;
    text_body?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const recipients = emailData.to.map(email => ({
        emailAddress: {
          address: email
        }
      }));

      const ccRecipients = emailData.cc?.map(email => ({
        emailAddress: {
          address: email
        }
      })) || [];

      const bccRecipients = emailData.bcc?.map(email => ({
        emailAddress: {
          address: email
        }
      })) || [];

      const message = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: emailData.html_body ? 'HTML' : 'Text',
            content: emailData.html_body || emailData.text_body || ''
          },
          toRecipients: recipients,
          ccRecipients: ccRecipients,
          bccRecipients: bccRecipients,
          from: {
            emailAddress: {
              address: this.config.sender_email
            }
          }
        },
        saveToSentItems: true
      };

      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MS Graph send email error: ${response.status} ${errorText}`);
      }

      // Microsoft Graph returns 202 Accepted with no body for successful sends
      return {
        status: 'success',
        message_id: response.headers.get('request-id') || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('MS Graph sendEmail error:', error);
      throw new Error(`Failed to send email via MS Graph: ${error}`);
    }
  }

  /**
   * Send notification about published CMP plan
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
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
                🎯 Personalization Strategy Plan
              </h2>

              <p>Hi there,</p>

              <p>Your personalization strategy plan "<strong>${notificationData.plan_title}</strong>" has been generated and is now ready for review.</p>

              ${notificationData.plan_summary ? `
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #1e40af;">Plan Overview:</h4>
                  <p style="margin-bottom: 0;">${notificationData.plan_summary}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${notificationData.cmp_url}"
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  📖 View Plan in CMP →
                </a>
              </div>

              <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">

              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px;">
                <h4 style="color: #92400e; margin-top: 0;">📋 Next Steps:</h4>
                <ul style="color: #92400e; margin-bottom: 0;">
                  <li>Review the personalization strategy and experiment blueprints</li>
                  <li>Validate audience targeting and coverage estimates</li>
                  <li>Assign tasks and set implementation timeline</li>
                  <li>Schedule kickoff meeting with implementation team</li>
                </ul>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This plan was generated by the Opal AI Personalization System.
                ${notificationData.sender_name ? `Requested by: ${notificationData.sender_name}` : ''}
                <br>
                <em>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</em>
              </p>
            </div>
          </body>
        </html>
      `;

      const textBody = `
Personalization Strategy Plan Ready for Review

Your personalization strategy plan "${notificationData.plan_title}" has been generated and is now ready for review.

${notificationData.plan_summary ? `Plan Overview: ${notificationData.plan_summary}\n\n` : ''}

View the complete plan here: ${notificationData.cmp_url}

Next Steps:
- Review the personalization strategy and experiment blueprints
- Validate audience targeting and coverage estimates
- Assign tasks and set implementation timeline
- Schedule kickoff meeting with implementation team

This plan was generated by the Opal AI Personalization System.
${notificationData.sender_name ? `Requested by: ${notificationData.sender_name}` : ''}
Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      `;

      return await this.sendEmail({
        to: notificationData.recipients,
        subject: subject,
        html_body: htmlBody,
        text_body: textBody
      });
    } catch (error) {
      console.error('MS Graph sendPlanNotification error:', error);
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
}