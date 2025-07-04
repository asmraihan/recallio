import { NextRequest, NextResponse } from 'next/server';
import { synthesize, getVoices } from '@echristian/edge-tts';

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }
    const selectedVoice = voice || 'de-DE-AmalaNeural'; // Default to a German voice if none provided
    const { audio } = await synthesize({ text, voice: selectedVoice, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    // audio is a Blob
    const arrayBuffer = await audio.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="tts.mp3"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'TTS synthesis failed', details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  // Return available voices (for voice picker)
  try {
    const voices = await getVoices();
    // Only return German voices for now
    const deVoices = voices.filter((v: any) => v.Locale.startsWith('de-'));
    return NextResponse.json(deVoices);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch voices', details: String(err) }, { status: 500 });
  }
}
