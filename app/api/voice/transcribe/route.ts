import { NextRequest, NextResponse } from 'next/server';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const ASSEMBLY_API_URL = 'https://api.assemblyai.com/v2/transcript';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const provider = formData.get('provider') as string || 'whisper';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert to appropriate format for each provider
    const audioBuffer = await audioFile.arrayBuffer();
    
    if (provider === 'whisper') {
      // OpenAI Whisper implementation
      const whisperFormData = new FormData();
      whisperFormData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
      whisperFormData.append('model', 'whisper-1');
      whisperFormData.append('language', 'en');
      whisperFormData.append('response_format', 'json');
      
      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
        },
        body: whisperFormData
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Whisper API error:', error);
        return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
      }
      
      const data = await response.json();
      return NextResponse.json({ 
        transcript: data.text,
        provider: 'whisper',
        confidence: 0.95
      });
    }
    
    if (provider === 'assembly') {
      // AssemblyAI implementation
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': process.env.ASSEMBLY_API_KEY || '',
          'content-type': 'application/octet-stream'
        },
        body: audioBuffer
      });
      
      const { upload_url } = await uploadResponse.json();
      
      const transcriptResponse = await fetch(ASSEMBLY_API_URL, {
        method: 'POST',
        headers: {
          'authorization': process.env.ASSEMBLY_API_KEY || '',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_detection: true
        })
      });
      
      const { id } = await transcriptResponse.json();
      
      // Poll for completion
      let transcript = null;
      let attempts = 0;
      while (!transcript && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`${ASSEMBLY_API_URL}/${id}`, {
          headers: {
            'authorization': process.env.ASSEMBLY_API_KEY || ''
          }
        });
        
        const statusData = await statusResponse.json();
        if (statusData.status === 'completed') {
          transcript = statusData.text;
        } else if (statusData.status === 'error') {
          throw new Error('Transcription failed');
        }
        attempts++;
      }
      
      return NextResponse.json({ 
        transcript: transcript || 'Transcription timeout',
        provider: 'assembly',
        confidence: 0.92
      });
    }
    
    // Fallback response
    return NextResponse.json({ 
      transcript: '[Provider not implemented]',
      provider: provider,
      confidence: 0
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;