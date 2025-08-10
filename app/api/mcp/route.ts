// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';

// MCP Protocol Implementation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // MCP expects specific JSON-RPC format
    const { jsonrpc, method, params, id } = body;
    
    // Handle MCP discovery request
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '1.0',
          serverInfo: {
            name: 'EXPREZZZO Power',
            version: '1.0.0'
          },
          capabilities: {
            tools: true,
            resources: true
          }
        }
      });
    }
    
    // Handle tool listing
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'orchestrate_ai',
              description: 'Route AI requests to providers',
              inputSchema: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  providers: { type: 'array' }
                }
              }
            },
            {
              name: 'test_providers',
              description: 'Check provider status',
              inputSchema: { type: 'object' }
            },
            {
              name: 'get_figma',
              description: 'Get Figma metadata',
              inputSchema: { type: 'object' }
            }
          ]
        }
      });
    }
    
    // Handle tool execution
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      let result;
      switch(name) {
        case 'orchestrate_ai':
          const orchestrateRes = await fetch(
            'https://exprezzzo-power.vercel.app/api/orchestrate',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.EXPREZZZO_API_KEY || ''
              },
              body: JSON.stringify(args)
            }
          );
          result = await orchestrateRes.json();
          break;
          
        case 'test_providers':
          const testRes = await fetch(
            'https://exprezzzo-power.vercel.app/api/test-providers',
            {
              headers: {
                'x-api-key': process.env.EXPREZZZO_API_KEY || ''
              }
            }
          );
          result = await testRes.json();
          break;
          
        case 'get_figma':
          const figmaRes = await fetch(
            'https://exprezzzo-power.vercel.app/api/figma',
            {
              headers: {
                'x-api-key': process.env.EXPREZZZO_API_KEY || ''
              }
            }
          );
          result = await figmaRes.json();
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
    }
    
    // Unknown method
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error.message || 'Internal error'
      }
    });
  }
}

// CORS headers for MCP
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Health check
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    protocol: 'MCP 1.0',
    endpoint: '/api/mcp',
    message: 'Use POST method with JSON-RPC format'
  });
}
