import { NextRequest, NextResponse } from 'next/server';
import { SessionQueueManager } from '@/lib/sessionQueue';
import { AISession, AIMessage } from '@/types/ai-playground';
// Import MongoDB and JSZip only when needed to avoid build issues
let MongoClient: any;
let Collection: any;
let JSZip: any;

try {
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  Collection = mongodb.Collection;
} catch (error) {
  console.warn('MongoDB not available in build environment');
}

try {
  JSZip = require('jszip');
} catch (error) {
  console.warn('JSZip not available in build environment');
}

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'exprezzzo_sessions';

interface ExportRequest {
  sessionIds: string[];
  format: 'json' | 'markdown' | 'txt' | 'csv' | 'xml' | 'pdf';
  includeMetadata: boolean;
  includeSystemPrompts: boolean;
  compression?: 'zip' | 'gzip' | 'none';
  sharing?: {
    enabled: boolean;
    publicUrl?: boolean;
    expiresAt?: Date;
    password?: string;
    allowedUsers?: string[];
  };
  customizations?: {
    includeTimestamps?: boolean;
    includeModelInfo?: boolean;
    groupByModel?: boolean;
    anonymizeUsers?: boolean;
    filterByDateRange?: {
      start: Date;
      end: Date;
    };
  };
}

interface ExportResult {
  exportId: string;
  downloadUrl: string;
  shareUrl?: string;
  expiresAt: Date;
  fileSize: number;
  format: string;
  sessionCount: number;
}

class SessionExporter {
  private client: MongoClient | null = null;
  private collection: Collection | null = null;
  private queueManager: SessionQueueManager;

  constructor() {
    this.queueManager = new SessionQueueManager();
  }

  private async connect() {
    if (!this.client) {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.collection = this.client.db(DB_NAME).collection('sessions');
    }
  }

  private async getSessions(sessionIds: string[], userId?: string): Promise<AISession[]> {
    await this.connect();
    
    const filter: any = { id: { $in: sessionIds } };
    if (userId) filter.userId = userId;
    
    const sessions = await this.collection!.find(filter).toArray();
    return sessions.map(this.transformDocument);
  }

  private transformDocument(doc: any): AISession {
    const { _id, createdAt, updatedAt, userId, ...session } = doc;
    return session as AISession;
  }

  private formatTimestamp(date: Date | string): string {
    return new Date(date).toISOString().replace('T', ' ').split('.')[0];
  }

  private anonymizeContent(content: string, options: ExportRequest['customizations']): string {
    if (!options?.anonymizeUsers) return content;
    
    // Simple anonymization - replace potential user identifiers
    return content
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{10,}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
  }

  private async exportAsJSON(sessions: AISession[], options: ExportRequest): Promise<string> {
    const exportData = {
      metadata: {
        exportedAt: new Date(),
        format: 'json',
        sessionCount: sessions.length,
        includeMetadata: options.includeMetadata,
        includeSystemPrompts: options.includeSystemPrompts
      },
      sessions: sessions.map(session => {
        const exportSession: any = {
          id: session.id,
          title: session.title,
          messages: session.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: this.anonymizeContent(msg.content, options.customizations),
            ...(options.customizations?.includeTimestamps && { timestamp: msg.timestamp }),
            ...(options.customizations?.includeModelInfo && msg.modelId && { modelId: msg.modelId })
          }))
        };

        if (options.includeMetadata) {
          exportSession.metadata = session.metadata;
        }

        if (options.includeSystemPrompts && session.settings?.systemPrompt) {
          exportSession.systemPrompt = this.anonymizeContent(session.settings.systemPrompt, options.customizations);
        }

        if (options.customizations?.includeModelInfo) {
          exportSession.modelConfigs = session.modelConfigs;
          exportSession.settings = session.settings;
        }

        return exportSession;
      })
    };

    return JSON.stringify(exportData, null, 2);
  }

  private async exportAsMarkdown(sessions: AISession[], options: ExportRequest): Promise<string> {
    let markdown = `# Session Export\n\n`;
    markdown += `**Exported:** ${this.formatTimestamp(new Date())}\n`;
    markdown += `**Sessions:** ${sessions.length}\n\n`;

    for (const session of sessions) {
      markdown += `## ${session.title}\n\n`;
      
      if (options.includeMetadata) {
        markdown += `**Created:** ${this.formatTimestamp(session.metadata.createdAt)}\n`;
        markdown += `**Updated:** ${this.formatTimestamp(session.metadata.updatedAt)}\n`;
        markdown += `**Messages:** ${session.metadata.messageCount}\n`;
        
        if (session.metadata.tags.length > 0) {
          markdown += `**Tags:** ${session.metadata.tags.join(', ')}\n`;
        }
        
        markdown += `\n`;
      }

      if (options.includeSystemPrompts && session.settings?.systemPrompt) {
        markdown += `### System Prompt\n\n`;
        markdown += `${this.anonymizeContent(session.settings.systemPrompt, options.customizations)}\n\n`;
      }

      markdown += `### Conversation\n\n`;

      for (const message of session.messages) {
        const role = message.role === 'user' ? '**User**' : 
                    message.role === 'assistant' ? '**Assistant**' : 
                    `**${message.role}**`;
        
        markdown += `${role}`;
        
        if (options.customizations?.includeTimestamps) {
          markdown += ` (${this.formatTimestamp(message.timestamp)})`;
        }
        
        if (options.customizations?.includeModelInfo && message.modelId) {
          markdown += ` [${message.modelId}]`;
        }
        
        markdown += `:\n\n`;
        markdown += `${this.anonymizeContent(message.content, options.customizations)}\n\n`;
        markdown += `---\n\n`;
      }
    }

    return markdown;
  }

  private async exportAsPlainText(sessions: AISession[], options: ExportRequest): Promise<string> {
    let text = `SESSION EXPORT\n${'='.repeat(50)}\n\n`;
    text += `Exported: ${this.formatTimestamp(new Date())}\n`;
    text += `Sessions: ${sessions.length}\n\n`;

    for (const session of sessions) {
      text += `${'='.repeat(50)}\n`;
      text += `SESSION: ${session.title}\n`;
      text += `${'='.repeat(50)}\n\n`;
      
      if (options.includeMetadata) {
        text += `Created: ${this.formatTimestamp(session.metadata.createdAt)}\n`;
        text += `Updated: ${this.formatTimestamp(session.metadata.updatedAt)}\n`;
        text += `Messages: ${session.metadata.messageCount}\n`;
        
        if (session.metadata.tags.length > 0) {
          text += `Tags: ${session.metadata.tags.join(', ')}\n`;
        }
        
        text += `\n`;
      }

      if (options.includeSystemPrompts && session.settings?.systemPrompt) {
        text += `SYSTEM PROMPT:\n${'-'.repeat(20)}\n`;
        text += `${this.anonymizeContent(session.settings.systemPrompt, options.customizations)}\n\n`;
      }

      text += `CONVERSATION:\n${'-'.repeat(20)}\n\n`;

      for (let i = 0; i < session.messages.length; i++) {
        const message = session.messages[i];
        
        text += `[${i + 1}] ${message.role.toUpperCase()}`;
        
        if (options.customizations?.includeTimestamps) {
          text += ` (${this.formatTimestamp(message.timestamp)})`;
        }
        
        if (options.customizations?.includeModelInfo && message.modelId) {
          text += ` [${message.modelId}]`;
        }
        
        text += `:\n`;
        text += `${this.anonymizeContent(message.content, options.customizations)}\n\n`;
      }
      
      text += `\n`;
    }

    return text;
  }

  private async exportAsCSV(sessions: AISession[], options: ExportRequest): Promise<string> {
    const headers = [
      'session_id',
      'session_title', 
      'message_index',
      'role',
      'content',
      'message_id'
    ];

    if (options.customizations?.includeTimestamps) {
      headers.push('timestamp');
    }
    
    if (options.customizations?.includeModelInfo) {
      headers.push('model_id');
    }

    if (options.includeMetadata) {
      headers.push('session_created', 'session_updated', 'message_count', 'tags');
    }

    let csv = headers.join(',') + '\n';

    for (const session of sessions) {
      for (let i = 0; i < session.messages.length; i++) {
        const message = session.messages[i];
        
        const row = [
          `"${session.id}"`,
          `"${session.title.replace(/"/g, '""')}"`,
          i,
          `"${message.role}"`,
          `"${this.anonymizeContent(message.content, options.customizations).replace(/"/g, '""')}"`,
          `"${message.id}"`
        ];

        if (options.customizations?.includeTimestamps) {
          row.push(`"${this.formatTimestamp(message.timestamp)}"`);
        }
        
        if (options.customizations?.includeModelInfo) {
          row.push(`"${message.modelId || ''}"`);
        }

        if (options.includeMetadata) {
          row.push(
            `"${this.formatTimestamp(session.metadata.createdAt)}"`,
            `"${this.formatTimestamp(session.metadata.updatedAt)}"`,
            session.metadata.messageCount.toString(),
            `"${session.metadata.tags.join(';')}"`
          );
        }

        csv += row.join(',') + '\n';
      }
    }

    return csv;
  }

  private async exportAsXML(sessions: AISession[], options: ExportRequest): Promise<string> {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sessionExport>\n';
    xml += `  <metadata>\n`;
    xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
    xml += `    <format>xml</format>\n`;
    xml += `    <sessionCount>${sessions.length}</sessionCount>\n`;
    xml += `  </metadata>\n`;
    xml += `  <sessions>\n`;

    for (const session of sessions) {
      xml += `    <session id="${session.id}">\n`;
      xml += `      <title><![CDATA[${session.title}]]></title>\n`;
      
      if (options.includeMetadata) {
        xml += `      <metadata>\n`;
        xml += `        <createdAt>${session.metadata.createdAt}</createdAt>\n`;
        xml += `        <updatedAt>${session.metadata.updatedAt}</updatedAt>\n`;
        xml += `        <messageCount>${session.metadata.messageCount}</messageCount>\n`;
        
        if (session.metadata.tags.length > 0) {
          xml += `        <tags>\n`;
          for (const tag of session.metadata.tags) {
            xml += `          <tag>${tag}</tag>\n`;
          }
          xml += `        </tags>\n`;
        }
        
        xml += `      </metadata>\n`;
      }

      if (options.includeSystemPrompts && session.settings?.systemPrompt) {
        xml += `      <systemPrompt><![CDATA[${this.anonymizeContent(session.settings.systemPrompt, options.customizations)}]]></systemPrompt>\n`;
      }

      xml += `      <messages>\n`;
      
      for (const message of session.messages) {
        xml += `        <message id="${message.id}" role="${message.role}"`;
        
        if (options.customizations?.includeTimestamps) {
          xml += ` timestamp="${message.timestamp}"`;
        }
        
        if (options.customizations?.includeModelInfo && message.modelId) {
          xml += ` modelId="${message.modelId}"`;
        }
        
        xml += `>\n`;
        xml += `          <content><![CDATA[${this.anonymizeContent(message.content, options.customizations)}]]></content>\n`;
        xml += `        </message>\n`;
      }
      
      xml += `      </messages>\n`;
      xml += `    </session>\n`;
    }

    xml += `  </sessions>\n`;
    xml += '</sessionExport>\n';

    return xml;
  }

  private async compressData(data: string, format: string, compression?: string): Promise<Buffer> {
    if (!compression || compression === 'none') {
      return Buffer.from(data, 'utf-8');
    }

    if (compression === 'zip') {
      const zip = new JSZip();
      const fileName = `session_export.${format}`;
      zip.file(fileName, data);
      return await zip.generateAsync({ type: 'nodebuffer' });
    }

    // For gzip, we'd need a compression library
    // For now, return uncompressed
    return Buffer.from(data, 'utf-8');
  }

  private async generateShareUrl(exportId: string, options: ExportRequest['sharing']): Promise<string | undefined> {
    if (!options?.enabled) return undefined;

    // Generate share URL with optional password protection
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let shareUrl = `${baseUrl}/share/export/${exportId}`;

    if (options.password) {
      // In production, you'd hash the password and store it
      shareUrl += `?protected=true`;
    }

    // Store sharing metadata in database or Redis
    // This would include expiration, allowed users, etc.

    return shareUrl;
  }

  async exportSessions(request: ExportRequest, userId?: string): Promise<ExportResult> {
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Queue the export job for background processing
    await this.queueManager.addExportJob({
      exportId,
      sessionIds: request.sessionIds,
      format: request.format,
      destination: 'file',
      priority: userId ? 1 : 10,
      options: request
    });

    // Get sessions for immediate processing (for small exports) or return job info
    const sessions = await this.getSessions(request.sessionIds, userId);
    
    let exportData: string;
    
    switch (request.format) {
      case 'json':
        exportData = await this.exportAsJSON(sessions, request);
        break;
      case 'markdown':
        exportData = await this.exportAsMarkdown(sessions, request);
        break;
      case 'txt':
        exportData = await this.exportAsPlainText(sessions, request);
        break;
      case 'csv':
        exportData = await this.exportAsCSV(sessions, request);
        break;
      case 'xml':
        exportData = await this.exportAsXML(sessions, request);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    const compressedData = await this.compressData(exportData, request.format, request.compression);
    
    // Store the export file (in production, use cloud storage)
    // For now, we'll return a temporary URL
    const downloadUrl = `/api/sessions/export/${exportId}/download`;
    const shareUrl = await this.generateShareUrl(exportId, request.sharing);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    return {
      exportId,
      downloadUrl,
      shareUrl,
      expiresAt,
      fileSize: compressedData.length,
      format: request.format,
      sessionCount: sessions.length
    };
  }
}

const exporter = new SessionExporter();

export async function POST(request: NextRequest) {
  try {
    const exportRequest: ExportRequest = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;

    // Validate request
    if (!exportRequest.sessionIds || exportRequest.sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'No session IDs provided' },
        { status: 400 }
      );
    }

    if (!['json', 'markdown', 'txt', 'csv', 'xml', 'pdf'].includes(exportRequest.format)) {
      return NextResponse.json(
        { error: 'Unsupported export format' },
        { status: 400 }
      );
    }

    const result = await exporter.exportSessions(exportRequest, userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get('exportId');

    if (!exportId) {
      return NextResponse.json(
        { error: 'Export ID required' },
        { status: 400 }
      );
    }

    // Get export status from queue or database
    // For now, return a placeholder
    return NextResponse.json({
      exportId,
      status: 'completed',
      downloadUrl: `/api/sessions/export/${exportId}/download`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Export status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get export status' },
      { status: 500 }
    );
  }
}