
'use server';

/**
 * @fileOverview A flow for generating speech from text.
 * - generateSpeech - Converts a string of text into a playable audio data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe("The text to be converted to speech."),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe("The data URI of the generated WAV audio file."),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async ({ text }) => {
    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard narrative voice
            },
          },
        },
        prompt: text,
      });

      if (!media || !media.url) {
        throw new Error('Audio generation failed to return valid media.');
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      
      const wavDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

      return {
        audioUrl: wavDataUri,
      };
    } catch (e) {
      console.error("Error in generateSpeechFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during speech generation.';
      throw new Error(`AI call in generateSpeechFlow failed: ${errorMessage}`);
    }
  }
);


export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
    return generateSpeechFlow(input);
}
