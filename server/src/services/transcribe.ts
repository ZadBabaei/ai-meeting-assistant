import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(filePath: string): Promise<string> {
  const file = fs.createReadStream(filePath);

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });

  // Clean up the uploaded file after transcription
  fs.unlink(filePath, () => {});

  return response as unknown as string;
}
