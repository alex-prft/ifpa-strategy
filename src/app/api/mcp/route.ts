import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "MCP endpoint is working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    message: "MCP POST is working",
    timestamp: new Date().toISOString()
  });
}