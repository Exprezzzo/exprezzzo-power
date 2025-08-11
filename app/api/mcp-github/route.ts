// /api/mcp-github/route.ts - GitHub MCP Server
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

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
          serverInfo: { name: 'github-mcp', version: '1.0.0' }
        },
        id
      });
      
    case 'tools/list':
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'list_repo_files',
              description: 'List files in a GitHub repository',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  path: { type: 'string', default: '' }
                },
                required: ['owner', 'repo']
              }
            },
            {
              name: 'read_file',
              description: 'Read a file from GitHub',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  path: { type: 'string' }
                },
                required: ['owner', 'repo', 'path']
              }
            },
            {
              name: 'commit_file',
              description: 'Commit a file to GitHub',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  path: { type: 'string' },
                  content: { type: 'string' },
                  message: { type: 'string' }
                },
                required: ['owner', 'repo', 'path', 'content', 'message']
              }
            }
          ]
        },
        id
      });
      
    case 'tools/call':
      const { name, arguments: args } = params;
      const headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      switch (name) {
        case 'list_repo_files':
          const listRes = await fetch(
            `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path || ''}`,
            { headers }
          );
          const files = await listRes.json();
          
          const fileList = Array.isArray(files) 
            ? files.map((f: any) => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n')
            : 'No files found';
          
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: `Files in ${args.owner}/${args.repo}:\n${fileList}`
              }]
            },
            id
          });
          
        case 'read_file':
          const readRes = await fetch(
            `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
            { headers }
          );
          const fileData = await readRes.json();
          
          const content = Buffer.from(fileData.content || '', 'base64').toString('utf-8');
          
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: content
              }]
            },
            id
          });
          
        case 'commit_file':
          // Get current file (for SHA)
          const currentRes = await fetch(
            `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
            { headers }
          );
          const current = await currentRes.json();
          
          const commitRes = await fetch(
            `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
            {
              method: 'PUT',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: args.message,
                content: Buffer.from(args.content).toString('base64'),
                sha: current.sha
              })
            }
          );
          const commitData = await commitRes.json();
          
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: `Committed: ${commitData.commit?.sha || 'Success'}`
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