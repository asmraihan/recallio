declare module '@lixen/edge-tts' {
  export interface TTSOptions {
    rate?: string;
    volume?: string;
    pitch?: string;
  }

  export interface Voice {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
  }

  export class EdgeTTS {
    constructor();
    
    getVoices(): Promise<Voice[]>;
    
    synthesize(
      text: string,
      voice: string,
      options?: TTSOptions
    ): Promise<void>;
    
    toBase64(): string;
    toFile(filename: string): Promise<void>;
    toRaw(): Promise<Buffer>;
  }
}
