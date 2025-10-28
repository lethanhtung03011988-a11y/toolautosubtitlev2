
import { GoogleGenAI } from '@google/genai';
import type { SubtitleBlock } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please provide a valid key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

export async function generateSubtitles(
  transcript: string,
  audio: { mimeType: string; data: string },
  onProgress: (block: SubtitleBlock) => void
): Promise<void> {
  const prompt = `You are an expert audio-to-text synchronizer. Your task is to create perfectly synchronized subtitle data. 
  
  You will be given a full text transcript and the corresponding audio file.
  
  Analyze the audio and align the provided text precisely with the speech timings.
  
  The output must be a stream of valid JSON objects, with each object on a new line. Each JSON object represents a single subtitle block and must contain:
  - "id": a sequential number starting from 1.
  - "startTime": a string in 'HH:MM:SS,mmm' format.
  - "endTime": a string in 'HH:MM:SS,mmm' format.
  - "text": a string with the subtitle content.
  
  Do not wrap the objects in a JSON array. Do not output any introductory text, closing text, or any markdown formatting like \`\`\`json. Just the raw JSON objects, one per line.`;

  const transcriptPart = {
    text: `TRANSCRIPT:\n---\n${transcript}\n---`,
  };

  const audioPart = {
    inlineData: {
      mimeType: audio.mimeType,
      data: audio.data,
    },
  };

  const promptPart = {
    text: prompt,
  };

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: { parts: [promptPart, transcriptPart, audioPart] },
    });

    let buffer = '';
    for await (const chunk of stream) {
      buffer += chunk.text;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            const parsed = JSON.parse(line);
            // Basic validation
            if (
              typeof parsed.id === 'number' &&
              typeof parsed.startTime === 'string' &&
              typeof parsed.endTime === 'string' &&
              typeof parsed.text === 'string'
            ) {
              onProgress(parsed as SubtitleBlock);
            }
          } catch (e) {
            console.warn('Failed to parse streaming line, skipping:', line);
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      try {
        const parsed = JSON.parse(line);
        if (
          typeof parsed.id === 'number' &&
          typeof parsed.startTime === 'string' &&
          typeof parsed.endTime === 'string' &&
          typeof parsed.text === 'string'
        ) {
          onProgress(parsed as SubtitleBlock);
        }
      } catch (e) {
        console.warn('Failed to parse final buffer, skipping:', line);
      }
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to communicate with the AI model.');
  }
}
