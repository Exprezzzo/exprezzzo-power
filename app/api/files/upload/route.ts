import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import formidable from 'formidable';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 50MB' }, { status: 400 });
    }

    // Create uploads directory
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileId = crypto.randomUUID();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // Process based on file type
    const processedData = await processFile(buffer, file.type, filename);
    
    return NextResponse.json({
      success: true,
      fileId,
      filename,
      url: `/uploads/${filename}`,
      mimeType: file.type,
      size: file.size,
      processed: processedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

async function processFile(buffer: Buffer, mimeType: string, filename: string) {
  if (mimeType.startsWith('image/')) {
    return await processImage(buffer, mimeType);
  } else if (mimeType === 'application/pdf') {
    return await processPDF(buffer);
  } else if (mimeType.startsWith('audio/')) {
    return await processAudio(buffer);
  } else if (mimeType.includes('sheet') || filename.endsWith('.csv')) {
    return await processSpreadsheet(buffer, filename);
  } else if (mimeType.startsWith('video/')) {
    return await processVideo(buffer);
  } else {
    return { type: 'unknown', message: 'File uploaded but not processed' };
  }
}

async function processImage(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString('base64');
  
  // Use GPT-4 Vision
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image in detail' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }],
          max_tokens: 300
        })
      });
      
      const data = await response.json();
      return {
        type: 'image',
        vision: data.choices?.[0]?.message?.content || 'No description available',
        dimensions: { width: 0, height: 0 }, // Add image processing to get dimensions
        format: mimeType.split('/')[1]
      };
    } catch (error) {
      console.error('Vision API error:', error);
    }
  }
  
  return {
    type: 'image',
    message: 'Image uploaded successfully',
    format: mimeType.split('/')[1]
  };
}

async function processPDF(buffer: Buffer) {
  // In production, use pdf-parse or similar
  return {
    type: 'pdf',
    pageCount: 1,
    text: 'PDF processing requires pdf-parse library',
    extractedAt: new Date().toISOString()
  };
}

async function processAudio(buffer: Buffer) {
  // Use OpenAI Whisper API
  if (process.env.OPENAI_API_KEY) {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([buffer], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData
      });
      
      const data = await response.json();
      return {
        type: 'audio',
        transcript: data.text || 'No transcription available',
        duration: 0
      };
    } catch (error) {
      console.error('Whisper API error:', error);
    }
  }
  
  return {
    type: 'audio',
    message: 'Audio uploaded, transcription requires Whisper API'
  };
}

async function processSpreadsheet(buffer: Buffer, filename: string) {
  // Parse CSV data
  if (filename.endsWith('.csv')) {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').slice(0, 10); // Preview first 10 rows
    
    return {
      type: 'spreadsheet',
      format: 'csv',
      preview: lines,
      rowCount: text.split('\n').length,
      message: 'CSV parsed successfully'
    };
  }
  
  return {
    type: 'spreadsheet',
    message: 'Excel files require xlsx library for parsing'
  };
}

async function processVideo(buffer: Buffer) {
  return {
    type: 'video',
    message: 'Video uploaded successfully',
    thumbnailGenerated: false,
    duration: 0
  };
}

// Next.js App Router automatically handles FormData, no config needed