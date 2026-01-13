import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@lixen/edge-tts';


// get all available voices

export async function GET(request: NextRequest) {
  try {
    const tts = new EdgeTTS();
    const voices = await tts.getVoices();
    return NextResponse.json({ voices });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }
}

// synthesize text to speech

export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const selectedVoice = voice || 'de-DE-AmalaNeural';
    const tts = new EdgeTTS();

    await tts.synthesize(text, selectedVoice, {
      rate: '-20%',    // Slower speed for better comprehension
      volume: '20%',  // Louder for clarity
      pitch: '-10Hz'   // Slightly higher pitch for clearer pronunciation
    });

    const base64Audio = tts.toBase64();
    return NextResponse.json({ audio: base64Audio });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
