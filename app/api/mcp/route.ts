// /api/mcp/route.ts - EXPREZZZO MCP Server
import { NextRequest, NextResponse } from 'next/server';

const EXPREZZZO_KEY = process.env.EXPREZZZO_KEY || '';
const BASE_URL = 'https://exprezzzo-power.vercel.app';

// MCP Protocol Implementation
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Handle JSON-RPC 2.0 protocol
  const { jsonrpc, method, params, id } = body;
  
  if (jsonrpc !== '2.0') {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id
    });
  }
  
  try {
    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '0.1.0',
            capabilities: {
              tools: {},
              prompts: {},
              resources: {}
            },
            serverInfo: {
              name: 'exprezzzo-mcp',
              version: '1.0.0'
            }
          },
          id
        });
        
      case 'tools/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            tools: [
              {
                name: 'orchestrate',
                description: 'Generate AI responses at $0.001',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'The prompt to generate from' },
                    temperature: { type: 'number', default: 0.7 }
                  },
                  required: ['prompt']
                }
              },
              {
                name: 'test_providers',
                description: 'Check AI provider network status',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              },
              {
                name: 'figma_to_code',
                description: 'Convert Figma design to code',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', description: 'Figma file URL' },
                    operation: { type: 'string', enum: ['extract', 'convert', 'optimize'] }
                  },
                  required: ['url']
                }
              },
              {
                name: 'get_components',
                description: 'Get EXPREZZZO component library',
                inputSchema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['all', 'buttons', 'forms', 'cards'] }
                  }
                }
              }
            ]
          },
          id
        });
        
      case 'tools/call':
        const { name, arguments: args } = params;
        
        switch (name) {
          case 'orchestrate':
            const orchestrateRes = await fetch(`${BASE_URL}/api/orchestrate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${EXPREZZZO_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(args)
            });
            const orchestrateData = await orchestrateRes.json();
            
            return NextResponse.json({
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: orchestrateData.response || orchestrateData.text || 'No response'
                  }
                ]
              },
              id
            });
            
          case 'test_providers':
            const providersRes = await fetch(`${BASE_URL}/api/test-providers`, {
              headers: { 'Authorization': `Bearer ${EXPREZZZO_KEY}` }
            });
            const providersData = await providersRes.json();
            
            return NextResponse.json({
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Active Providers: ${providersData.active_count || 0}\n` +
                          `Status: ${providersData.status || 'Unknown'}`
                  }
                ]
              },
              id
            });
            
          case 'figma_to_code':
            const figmaRes = await fetch(`${BASE_URL}/api/figma`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${EXPREZZZO_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(args)
            });
            const figmaData = await figmaRes.json();
            
            return NextResponse.json({
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: figmaData.code || 'Conversion complete'
                  }
                ]
              },
              id
            });
            
          case 'get_components':
            const componentsRes = await fetch(`${BASE_URL}/api/figma/components?type=${args.type || 'all'}`, {
              headers: { 'Authorization': `Bearer ${EXPREZZZO_KEY}` }
            });
            const componentsData = await componentsRes.json();
            
            return NextResponse.json({
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(componentsData, null, 2)
                  }
                ]
              },
              id
            });
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id
        });
    }
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { 
        code: -32603, 
        message: error instanceof Error ? error.message : 'Internal error' 
      },
      id
    });
  }
}