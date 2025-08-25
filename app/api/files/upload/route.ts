import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const mimeType = file.type;
    let processedData = null;

    if (mimeType.startsWith('image/')) {
      processedData = await processWithVision(buffer, mimeType);
    } else if (mimeType === 'application/pdf') {
      processedData = await processPDF(buffer);
    } else if (mimeType.startsWith('audio/')) {
      processedData = await processAudio(buffer);
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
      processedData = await processSpreadsheet(buffer);
    }

    return NextResponse.json({
      success: true,
      fileId,
      filename,
      url: `/uploads/${filename}`,
      mimeType,
      size: file.size,
      processed: processedData
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

async function processWithVision(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;
  return {
    type: 'vision',
    analysis: 'Image contains objects and text',
    confidence: 0.95
  };
}

async function processPDF(buffer: Buffer) {
  return {
    type: 'pdf',
    pageCount: 1,
    text: 'PDF content would be extracted here'
  };
}

async function processAudio(buffer: Buffer) {
  return {
    type: 'audio',
    transcript: 'Audio transcription would appear here',
    duration: 0
  };
}

async function processSpreadsheet(buffer: Buffer) {
  return {
    type: 'spreadsheet',
    rows: 0,
    columns: 0,
    preview: []
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};