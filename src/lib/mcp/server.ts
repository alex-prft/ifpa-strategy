/**
 * MCP Server for Opal Personalization Tools
 * Provides standardized interface for AI agents to interact with personalization services
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export class OpalMCPServer {
  private tools: MCPTool[] = [];
  private resources: MCPResource[] = [];
  private prompts: MCPPrompt[] = [];

  constructor() {
    this.initializeTools();
    this.initializeResources();
    this.initializePrompts();
  }

  private initializeTools() {
    this.tools = [
      {
        name: "pmg_personalization_maturity_assessment",
        description: "Complete personalization maturity assessment and strategic planning workflow with 4-phase framework",
        inputSchema: {
          type: "object",
          properties: {
            client_name: {
              type: "string",
              description: "Name of the client organization"
            },
            industry: {
              type: "string",
              description: "Industry sector of the organization"
            },
            company_size: {
              type: "string",
              enum: ["small", "medium", "large", "enterprise"],
              description: "Company size category"
            },
            current_capabilities: {
              type: "array",
              items: { type: "string" },
              description: "Array of current personalization capabilities"
            },
            business_objectives: {
              type: "array",
              items: { type: "string" },
              description: "Array of business objectives and goals"
            },
            timeline_preference: {
              type: "string",
              enum: ["6-months", "12-months", "18-months", "24-months"],
              description: "Preferred implementation timeline"
            },
            budget_range: {
              type: "string",
              enum: ["under-100k", "100k-500k", "500k-1m", "over-1m"],
              description: "Budget range for implementation"
            },
            recipients: {
              type: "array",
              items: { type: "string" },
              description: "Array of email addresses to receive the generated plan"
            }
          },
          required: ["client_name", "business_objectives", "recipients"]
        }
      },
      {
        name: "odp_audience_profile_lookup",
        description: "Look up user profile and segments from Optimizely Data Platform and Salesforce integration",
        inputSchema: {
          type: "object",
          properties: {
            email_hash: {
              type: "string",
              description: "Hashed email identifier for user lookup"
            },
            sf_contact_id: {
              type: "string",
              description: "Salesforce contact ID for user lookup"
            },
            opti_user_id: {
              type: "string",
              description: "Optimizely user ID for lookup"
            },
            zaius_id: {
              type: "string",
              description: "Legacy Zaius identifier for lookup"
            }
          },
          required: []
        }
      },
      {
        name: "ai_content_personalization_recommendations",
        description: "Get AI-powered content recommendations based on audience segments and user behavior",
        inputSchema: {
          type: "object",
          properties: {
            audience_id: {
              type: "string",
              description: "Target audience identifier for personalized recommendations"
            },
            content_types: {
              type: "array",
              items: { type: "string" },
              description: "Array of content types to include (articles, videos, guides, etc.)"
            },
            limit: {
              type: "integer",
              default: 10,
              description: "Maximum number of recommendations to return"
            },
            context: {
              type: "string",
              description: "Additional context for recommendation personalization"
            }
          },
          required: ["audience_id"]
        }
      },
      {
        name: "optimizely_experiment_analytics_data",
        description: "Access historical experiment data and performance metrics from Optimizely Experimentation platform",
        inputSchema: {
          type: "object",
          properties: {
            lookback_days: {
              type: "integer",
              default: 90,
              description: "Number of days to look back for experiment data"
            },
            include_archived: {
              type: "boolean",
              default: false,
              description: "Whether to include archived experiments in results"
            },
            project_id: {
              type: "string",
              description: "Specific project ID to filter experiments"
            },
            status_filter: {
              type: "string",
              enum: ["running", "completed", "paused"],
              description: "Filter experiments by status"
            }
          },
          required: []
        }
      },
      {
        name: "cmp_create_personalization_campaign",
        description: "Create and configure personalization campaigns in Campaign Management Platform",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Campaign title and identifier"
            },
            plan_markdown: {
              type: "string",
              description: "Detailed campaign plan in markdown format"
            },
            project_key: {
              type: "string",
              description: "Project identifier for campaign organization"
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  assignee: { type: "string" },
                  due_date: { type: "string" }
                }
              },
              description: "Array of tasks and assignments for campaign execution"
            }
          },
          required: ["title", "plan_markdown", "project_key"]
        }
      },
      {
        name: "sendgrid_personalization_plan_notification",
        description: "Send email notifications and plan delivery via SendGrid integration",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "array",
              items: { type: "string" },
              description: "Array of recipient email addresses"
            },
            subject: {
              type: "string",
              description: "Email subject line (for custom emails)"
            },
            html: {
              type: "string",
              description: "HTML email body content"
            },
            text: {
              type: "string",
              description: "Plain text email body content"
            },
            plan_title: {
              type: "string",
              description: "Title of personalization plan (for structured notifications)"
            },
            cmp_url: {
              type: "string",
              description: "Campaign Management Platform URL for plan access"
            },
            plan_summary: {
              type: "string",
              description: "Executive summary of the personalization plan"
            },
            sender_name: {
              type: "string",
              description: "Name of the email sender"
            }
          },
          required: ["to"]
        }
      }
    ];
  }

  private initializeResources() {
    this.resources = [
      {
        uri: "opal://maturity-framework/phases",
        name: "Personalization Maturity Phases",
        mimeType: "application/json",
        description: "Complete framework defining the 4-phase maturity model (Crawl, Walk, Run, Fly)"
      },
      {
        uri: "opal://templates/assessment",
        name: "Maturity Assessment Template",
        mimeType: "application/json",
        description: "Structured template for conducting personalization maturity assessments"
      },
      {
        uri: "opal://benchmarks/industry",
        name: "Industry Benchmarks",
        mimeType: "application/json",
        description: "Personalization maturity benchmarks across different industries"
      },
      {
        uri: "opal://strategies/recommendations",
        name: "Strategic Recommendations Database",
        mimeType: "application/json",
        description: "Database of proven strategies and recommendations for each maturity phase"
      }
    ];
  }

  private initializePrompts() {
    this.prompts = [
      {
        name: "assess_personalization_maturity",
        description: "Conduct a comprehensive personalization maturity assessment for an organization",
        arguments: [
          {
            name: "organization_info",
            description: "Basic information about the organization (name, industry, size)",
            required: true
          },
          {
            name: "current_capabilities",
            description: "List of current personalization and experimentation capabilities",
            required: true
          },
          {
            name: "business_goals",
            description: "Primary business objectives and KPIs",
            required: true
          }
        ]
      },
      {
        name: "generate_strategic_roadmap",
        description: "Create a detailed strategic roadmap for personalization maturity advancement",
        arguments: [
          {
            name: "current_phase",
            description: "Current maturity phase (crawl, walk, run, fly)",
            required: true
          },
          {
            name: "target_phase",
            description: "Desired target maturity phase",
            required: true
          },
          {
            name: "constraints",
            description: "Budget, timeline, and resource constraints",
            required: false
          }
        ]
      },
      {
        name: "recommend_optimizely_tools",
        description: "Recommend appropriate Optimizely tools and configurations for specific use cases",
        arguments: [
          {
            name: "use_case",
            description: "Primary use case or business objective",
            required: true
          },
          {
            name: "technical_requirements",
            description: "Technical constraints and requirements",
            required: false
          },
          {
            name: "integration_needs",
            description: "Existing systems and integration requirements",
            required: false
          }
        ]
      }
    ];
  }

  // MCP Server Interface Methods
  async listTools(): Promise<MCPTool[]> {
    return this.tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Route to appropriate API endpoint
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://opal-2025.vercel.app'
      : 'http://localhost:3000';

    let endpoint: string;

    switch (name) {
      case 'pmg_personalization_maturity_assessment':
        endpoint = '/api/pmg/workflow';
        break;
      case 'odp_audience_profile_lookup':
        endpoint = '/api/tools/audience';
        break;
      case 'ai_content_personalization_recommendations':
        endpoint = '/api/tools/content';
        break;
      case 'optimizely_experiment_analytics_data':
        endpoint = '/api/tools/experiments';
        break;
      case 'cmp_create_personalization_campaign':
        endpoint = '/api/tools/cmp';
        break;
      case 'sendgrid_personalization_plan_notification':
        endpoint = '/api/tools/notify';
        break;
      default:
        throw new Error(`No endpoint configured for tool ${name}`);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer opal-personalization-secret-2025'
      },
      body: JSON.stringify(args)
    });

    if (!response.ok) {
      throw new Error(`Tool execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async listResources(): Promise<MCPResource[]> {
    return this.resources;
  }

  async readResource(uri: string): Promise<string> {
    // Mock resource data - in production this would fetch from actual data sources
    switch (uri) {
      case "opal://maturity-framework/phases":
        return JSON.stringify({
          phases: [
            {
              name: "crawl",
              description: "Foundation Building - A/B testing and simple personalization",
              capabilities: ["Basic A/B testing", "Simple personalization rules", "Manual audience definition"],
              timeline: "0-6 months",
              success_metrics: ["First successful A/B test", "Basic personalization implementation"]
            },
            {
              name: "walk",
              description: "Structured Growth - Advanced experimentation and data-driven audiences",
              capabilities: ["Advanced experimentation", "Event-driven audiences", "Multi-variate testing"],
              timeline: "6-12 months",
              success_metrics: ["Automated experiment analysis", "Data-driven audience creation"]
            },
            {
              name: "run",
              description: "Advanced Execution - Smart personalization and integrated systems",
              capabilities: ["Smart personalization", "CDP integration", "Cross-channel orchestration"],
              timeline: "12-18 months",
              success_metrics: ["Real-time personalization", "Unified customer profiles"]
            },
            {
              name: "fly",
              description: "Mature Optimization - AI-powered omnichannel experiences",
              capabilities: ["AI-powered personalization", "Omnichannel experiences", "Predictive analytics"],
              timeline: "18+ months",
              success_metrics: ["AI-driven recommendations", "Seamless omnichannel journeys"]
            }
          ]
        });
      default:
        throw new Error(`Resource ${uri} not found`);
    }
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    return this.prompts;
  }

  async getPrompt(name: string, args: Record<string, any>): Promise<string> {
    const prompt = this.prompts.find(p => p.name === name);
    if (!prompt) {
      throw new Error(`Prompt ${name} not found`);
    }

    // Generate contextual prompts based on provided arguments
    switch (name) {
      case "assess_personalization_maturity":
        return `Conduct a comprehensive personalization maturity assessment for ${args.organization_info}.

Current capabilities: ${args.current_capabilities}
Business goals: ${args.business_goals}

Please evaluate across the following dimensions:
1. Experimentation maturity and capabilities
2. Personalization sophistication
3. Data integration and customer insights
4. Technology infrastructure
5. Organizational readiness

Provide specific recommendations for advancement through the 4-phase maturity model (Crawl → Walk → Run → Fly).`;

      default:
        return `Execute ${name} with provided arguments`;
    }
  }
}

export const mcpServer = new OpalMCPServer();