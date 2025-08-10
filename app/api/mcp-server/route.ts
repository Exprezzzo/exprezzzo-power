// app/api/mcp-server/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.EXPREZZZO_API_KEY;
const BASE_URL = process.env.EXPREZZZO_BASE_URL || 'https://exprezzzo-power.vercel.app';

// MCP method handlers
const handlers = {
  orchestrate_ai: async (params: any) => {
    const response = await fetch(`${BASE_URL}/api/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || ''
      },
      body: JSON.stringify(params)
    });
    return response.json();
  },
  
  test_providers: async () => {
    const response = await fetch(`${BASE_URL}/api/test-providers`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY || ''
      }
    });
    return response.json();
  },
  
  get_figma_metadata: async () => {
    const response = await fetch(`${BASE_URL}/api/figma`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY || ''
      }
    });
    return response.json();
  },
  
  get_figma_components: async () => {
    const response = await fetch(`${BASE_URL}/api/figma/components`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY || ''
      }
    });
    return response.json();
  }
};

export async function POST(req: NextRequest) {
  try {
    const { method, params = {} } = await req.json();
    
    // Check if handler exists
    const handler = handlers[method as keyof typeof handlers];
    
    if (!handler) {
      return NextResponse.json({
        error: `Unknown method: ${method}`,
        available: Object.keys(handlers)
      }, { status: 400 });
    }
    
    // Execute handler
    const result = await handler(params);
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error: any) {
    console.error('MCP Server error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Handle GET for health check
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'EXPREZZZO MCP Server',
    version: '1.0.0',
    methods: Object.keys(handlers)
  });
}
