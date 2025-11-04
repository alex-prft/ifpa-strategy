import { NextRequest, NextResponse } from 'next/server';

/**
 * MCP (Model Context Protocol) Server Endpoint
 * Provides standardized interface for AI agents to interact with Opal personalization tools
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    server: {
      name: "Opal Personalization MCP Server",
      version: "1.0.0"
    },
    status: "active",
    endpoint: "/api/mcp",
    message: "MCP Server is running successfully"
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "MCP POST endpoint is working",
    timestamp: new Date().toISOString()
  });
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