// app/api/mcp-unified/route.ts
// UNIFIED MCP Server - Full Protocol Implementation with SSE
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const FIGMA_TOKEN = process.env.FIGMA_API_KEY || '';
const EXPREZZZO_KEY = process.env.EXPREZZZO_API_KEY || '';

// MCP Protocol Server with full SSE support
class UnifiedMCPServer {
  private capabilities = {
    tools: {},
    prompts: {},
    resources: {}
  };

  async handleMessage(message: any): Promise<any> {
    const { jsonrpc, method, params, id } = message;
    
    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id
      };
    }

    try {
      switch (method) {
        case 'initialize':
          return this.handleInitialize(id, params);
        case 'initialized':
          return { jsonrpc: '2.0', result: {}, id };
        case 'tools/list':
          return this.handleToolsList(id);
        case 'tools/call':
          return this.handleToolCall(params, id);
        case 'shutdown':
          return { jsonrpc: '2.0', result: {}, id };
        default:
          return {
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id
          };
      }
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        },
        id
      };
    }
  }

  private handleInitialize(id: any, params: any) {
    return {
      jsonrpc: '2.0',
      result: {
        protocolVersion: '0.1.0',
        capabilities: this.capabilities,
        serverInfo: {
          name: 'exprezzzo-unified-mcp',
          version: '2.0.0'
        }
      },
      id
    };
  }

  private handleToolsList(id: any) {
    return {
      jsonrpc: '2.0',
      result: {
        tools: [
          // GitHub Tools
          {
            name: 'github_list_files',
            description: 'List files in a GitHub repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'Directory path', default: '' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'github_read_file',
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
            name: 'github_write_file',
            description: 'Write or update a file in GitHub',
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
          },
          {
            name: 'github_delete_file',
            description: 'Delete a file from GitHub',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                path: { type: 'string' },
                message: { type: 'string' }
              },
              required: ['owner', 'repo', 'path', 'message']
            }
          },
          // Figma Tools
          {
            name: 'figma_get_file',
            description: 'Get Figma file information',
            inputSchema: {
              type: 'object',
              properties: {
                fileId: { type: 'string', description: 'Figma file ID' }
              },
              required: ['fileId']
            }
          },
          {
            name: 'figma_list_components',
            description: 'List components in a Figma file',
            inputSchema: {
              type: 'object',
              properties: {
                fileId: { type: 'string' }
              },
              required: ['fileId']
            }
          },
          // Exprezzzo Tools
          {
            name: 'orchestrate_ai',
            description: 'Generate AI response using Exprezzzo orchestration',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                provider: { 
                  type: 'string',
                  enum: ['groq', 'openai', 'anthropic', 'gemini'],
                  default: 'groq'
                },
                maxTokens: { type: 'number', default: 500 }
              },
              required: ['prompt']
            }
          },
          {
            name: 'test_providers',
            description: 'Test AI provider status',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      },
      id
    };
  }

  private async handleToolCall(params: any, id: any) {
    const { name, arguments: args } = params;
    
    try {
      let result: any;
      
      switch (name) {
        // GitHub Operations
        case 'github_list_files':
          result = await this.githubListFiles(args);
          break;
        case 'github_read_file':
          result = await this.githubReadFile(args);
          break;
        case 'github_write_file':
          result = await this.githubWriteFile(args);
          break;
        case 'github_delete_file':
          result = await this.githubDeleteFile(args);
          break;
        // Figma Operations
        case 'figma_get_file':
          result = await this.figmaGetFile(args);
          break;
        case 'figma_list_components':
          result = await this.figmaListComponents(args);
          break;
        // Exprezzzo Operations
        case 'orchestrate_ai':
          result = await this.orchestrateAI(args);
          break;
        case 'test_providers':
          result = await this.testProviders();
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return {
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        },
        id
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Tool execution failed'
        },
        id
      };
    }
  }

  // GitHub Implementation
  private async githubListFiles(args: any) {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    const response = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path || ''}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const files = await response.json();
    return files.map((f: any) => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n');
  }

  private async githubReadFile(args: any) {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    const response = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  private async githubWriteFile(args: any) {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    // Get current file SHA if it exists
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (getResponse.ok) {
        const existing = await getResponse.json();
        sha = existing.sha;
      }
    } catch {
      // File doesn't exist, will create new
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: args.message,
          content: Buffer.from(args.content).toString('base64'),
          sha: sha
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }
    
    const data = await response.json();
    return `File ${sha ? 'updated' : 'created'}: ${data.content.path}\nCommit: ${data.commit.sha}`;
  }

  private async githubDeleteFile(args: any) {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    // Get file SHA (required for deletion)
    const getResponse = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!getResponse.ok) {
      throw new Error('File not found');
    }
    
    const fileData = await getResponse.json();
    
    const response = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: args.message,
          sha: fileData.sha
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return `File deleted: ${args.path}`;
  }

  // Figma Implementation
  private async figmaGetFile(args: any) {
    if (!FIGMA_TOKEN) throw new Error('Figma token not configured');
    
    const response = await fetch(
      `https://api.figma.com/v1/files/${args.fileId}`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return `File: ${data.name}\nLast Modified: ${data.lastModified}\nVersion: ${data.version}`;
  }

  private async figmaListComponents(args: any) {
    if (!FIGMA_TOKEN) throw new Error('Figma token not configured');
    
    const response = await fetch(
      `https://api.figma.com/v1/files/${args.fileId}/components`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const components = Object.values(data.meta?.components || {});
    return components.map((c: any) => `- ${c.name}`).join('\n');
  }

  // Exprezzzo Implementation
  private async orchestrateAI(args: any) {
    if (!EXPREZZZO_KEY) throw new Error('Exprezzzo API key not configured');
    
    const response = await fetch('https://exprezzzo-power.vercel.app/api/orchestrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXPREZZZO_KEY
      },
      body: JSON.stringify({
        prompt: args.prompt,
        providers: [args.provider || 'groq'],
        maxTokens: args.maxTokens || 500
      })
    });
    
    if (!response.ok) {
      throw new Error('Orchestration failed');
    }
    
    const data = await response.json();
    return data.response || 'No response';
  }

  private async testProviders() {
    const response = await fetch('https://exprezzzo-power.vercel.app/api/test-providers');
    const data = await response.json();
    
    return `Providers Status:\n` +
           `- Loaded: ${data.providerCount}\n` +
           `- Available: ${data.loadedProviders?.map((p: any) => p.id).join(', ')}\n` +
           `- Environment: ${data.vercelEnv || 'unknown'}`;
  }
}

// Main SSE Handler
export async function POST(req: NextRequest) {
  const server = new UnifiedMCPServer();
  
  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.text();
        const lines = body.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            const response = await server.handleMessage(message);
            controller.enqueue(encoder.encode(JSON.stringify(response) + '\n'));
          } catch (e) {
            console.error('Error processing message:', e);
            controller.enqueue(encoder.encode(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32700, message: 'Parse error' },
              id: null
            }) + '\n'));
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    server: 'EXPREZZZO Unified MCP Server',
    version: '2.0.0',
    capabilities: ['github', 'figma', 'orchestrate'],
    tokens: {
      github: !!GITHUB_TOKEN,
      figma: !!FIGMA_TOKEN,
      exprezzzo: !!EXPREZZZO_KEY
    }
  });
}