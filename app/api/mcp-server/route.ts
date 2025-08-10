import { NextRequest, NextResponse } from ‘next/server’;

const API_KEY = process.env.EXPREZZZO_API_KEY;

// MCP Server Implementation
export async function POST(req: NextRequest) {
try {
const jsonRpcRequest = await req.json();

```
// Handle MCP initialization
if (jsonRpcRequest.method === 'initialize') {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: jsonRpcRequest.id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'EXPREZZZO Power',
        version: '1.0.0'
      }
    }
  });
}

// Handle tools list request
if (jsonRpcRequest.method === 'tools/list') {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: jsonRpcRequest.id,
    result: {
      tools: [
        {
          name: 'test_providers',
          description: 'Test EXPREZZZO API providers',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'orchestrate',
          description: 'Run EXPREZZZO orchestration',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                description: 'Data to orchestrate'
              }
            },
            required: []
          }
        },
        {
          name: 'figma_components',
          description: 'Get Figma components',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }
  });
}

// Handle tool calls
if (jsonRpcRequest.method === 'tools/call') {
  const { name, arguments: args } = jsonRpcRequest.params;
  
  let endpoint: string;
  let method = 'GET';
  let data: any = undefined;

  switch (name) {
    case 'test_providers':
      endpoint = '/api/test-providers';
      break;
    case 'orchestrate':
      endpoint = '/api/orchestrate';
      method = 'POST';
      data = args?.data;
      break;
    case 'figma_components':
      endpoint = '/api/figma/components';
      break;
    default:
      return NextResponse.json({
        jsonrpc: '2.0',
        id: jsonRpcRequest.id,
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`
        }
      });
  }

  // Make the actual API call
  const response = await fetch(`https://exprezzzo-power.vercel.app${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const result = await response.json();

  return NextResponse.json({
    jsonrpc: '2.0',
    id: jsonRpcRequest.id,
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
  id: jsonRpcRequest.id,
  error: {
    code: -32601,
    message: 'Method not found'
  }
});
```

} catch (error) {
return NextResponse.json({
jsonrpc: ‘2.0’,
id: null,
error: {
code: -32700,
message: ‘Parse error’
}
});
}
}

export async function OPTIONS() {
return new NextResponse(null, {
status: 200,
headers: {
‘Access-Control-Allow-Origin’: ‘*’,
‘Access-Control-Allow-Methods’: ‘POST, OPTIONS’,
‘Access-Control-Allow-Headers’: ‘Content-Type’
}
});
}
