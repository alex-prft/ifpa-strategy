import { NextRequest, NextResponse } from 'next/server';
import { mcpServer } from '@/lib/mcp/server';

/**
 * MCP (Model Context Protocol) Server Endpoint
 * Provides standardized interface for AI agents to interact with Opal personalization tools
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'list_tools':
        const tools = await mcpServer.listTools();
        return NextResponse.json({ tools });

      case 'list_resources':
        const resources = await mcpServer.listResources();
        return NextResponse.json({ resources });

      case 'list_prompts':
        const prompts = await mcpServer.listPrompts();
        return NextResponse.json({ prompts });

      default:
        return NextResponse.json({
          server: {
            name: "Opal Personalization MCP Server",
            version: "1.0.0"
          },
          capabilities: {
            tools: {
              listChanged: false
            },
            resources: {
              subscribe: false,
              listChanged: false
            },
            prompts: {
              listChanged: false
            }
          },
          instructions: "Use GET with ?action=list_tools, ?action=list_resources, or ?action=list_prompts to explore available capabilities. Use POST to execute tools or get prompts."
        });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'MCP server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    switch (method) {
      case 'tools/call':
        const { name, arguments: toolArgs } = params;
        const result = await mcpServer.callTool(name, toolArgs);
        return NextResponse.json({ result });

      case 'resources/read':
        const { uri } = params;
        const content = await mcpServer.readResource(uri);
        return NextResponse.json({ content });

      case 'prompts/get':
        const { name: promptName, arguments: promptArgs } = params;
        const prompt = await mcpServer.getPrompt(promptName, promptArgs);
        return NextResponse.json({ prompt });

      case 'initialize':
        return NextResponse.json({
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {
              listChanged: false
            },
            resources: {
              subscribe: false,
              listChanged: false
            },
            prompts: {
              listChanged: false
            }
          },
          serverInfo: {
            name: "Opal Personalization MCP Server",
            version: "1.0.0"
          }
        });

      default:
        return NextResponse.json({
          error: 'Unknown method',
          method,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'MCP request processing error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}