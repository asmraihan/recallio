import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@lixen/edge-tts';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const tts = new EdgeTTS();
    // const voices = await tts.getVoices();
    // console.log(voices.filter(v => v.Locale === 'de-DE'));

    await tts.synthesize(text, 'de-DE-AmalaNeural', {
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
