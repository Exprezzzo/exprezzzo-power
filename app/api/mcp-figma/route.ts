// /api/mcp-figma/route.ts - Figma MCP Server
import { NextRequest, NextResponse } from 'next/server';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jsonrpc, method, params, id } = body;
  
  if (jsonrpc !== '2.0') {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id
    });
  }
  
  switch (method) {
    case 'initialize':
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '0.1.0',
          capabilities: { tools: {} },
          serverInfo: { name: 'figma-mcp', version: '1.0.0' }
        },
        id
      });
      
    case 'tools/list':
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'get_figma_file',
              description: 'Get Figma file metadata',
              inputSchema: {
                type: 'object',
                properties: {
                  fileId: { type: 'string', description: 'Figma file ID' }
                },
                required: ['fileId']
              }
            },
            {
              name: 'list_figma_components',
              description: 'List all components in a Figma file',
              inputSchema: {
                type: 'object',
                properties: {
                  fileId: { type: 'string', description: 'Figma file ID' }
                },
                required: ['fileId']
              }
            }
          ]
        },
        id
      });
      
    case 'tools/call':
      const { name, arguments: args } = params;
      
      switch (name) {
        case 'get_figma_file':
          const fileRes = await fetch(`https://api.figma.com/v1/files/${args.fileId}`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
          });
          const fileData = await fileRes.json();
          
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: `File: ${fileData.name}\nLast Modified: ${fileData.lastModified}\nVersion: ${fileData.version}`
              }]
            },
            id
          });
          
        case 'list_figma_components':
          const compRes = await fetch(`https://api.figma.com/v1/files/${args.fileId}/components`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
          });
          const compData = await compRes.json();
          
          const componentList = compData.meta?.components || {};
          const names = Object.values(componentList).map((c: any) => c.name).join('\n');
          
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: `Components:\n${names}`
              }]
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
}