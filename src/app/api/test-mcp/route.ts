import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Test MCP endpoint is working",
    path: "/api/test-mcp",
    timestamp: new Date().toISOString()
  });
}