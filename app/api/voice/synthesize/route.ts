import { NextRequest, NextResponse } from 'next/server';

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'nova', provider = 'openai' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Sanitize and limit text
    const cleanText = text.replace(/[^\w\s.,!?;:'"()-]/g, '').slice(0, 4000);

    if (provider === 'openai') {
      // OpenAI TTS
      const response = await fetch(OPENAI_TTS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: voice, // nova, alloy, echo, fable, onyx, shimmer
          response_format: 'mp3',
          speed: 1.0
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI TTS error:', error);
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
      }

      const audioBuffer = await response.arrayBuffer();
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (provider === 'elevenlabs') {
      // ElevenLabs TTS
      const voiceId = voice || 'pNInz6obpgDQGcFmaJgB'; // Default voice ID
      
      const response = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('ElevenLabs TTS error:', error);
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
      }

      const audioBuffer = await response.arrayBuffer();
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Fallback for unsupported providers
    return NextResponse.json({ 
      error: `Provider ${provider} not implemented` 
    }, { status: 501 });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ 
      error: 'Text-to-speech failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;