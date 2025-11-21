
'use server';

/**
 * @fileOverview A flow for generating an audio teaser for a story.
 * - generateAudioTeaser - A function that generates a short audio clip.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import {
    GenerateAudioTeaserInputSchema,
    type GenerateAudioTeaserInput,
    GenerateAudioTeaserOutputSchema,
    type GenerateAudioTeaserOutput,
} from '@/lib/ai-schemas';
import { googleAI } from '@genkit-ai/googleai';

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

const generateAudioTeaserFlow = ai.defineFlow(
  {
    name: 'generateAudioTeaserFlow',
    inputSchema: GenerateAudioTeaserInputSchema,
    outputSchema: GenerateAudioTeaserOutputSchema,
  },
  async ({ plot, title, genre }) => {
    const textPrompt = `Create a very short, dramatic, and compelling audio teaser (1-2 sentences) for a ${genre} story titled "${title}". The plot is: "${plot}".`;

    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A suitable voice for narration
            },
          },
        },
        prompt: textPrompt,
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
      console.error("Error in generateAudioTeaserFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during audio generation.';
      throw new Error(`AI call in generateAudioTeaserFlow failed: ${errorMessage}`);
    }
  }
);


export async function generateAudioTeaser(input: GenerateAudioTeaserInput): Promise<GenerateAudioTeaserOutput> {
    return generateAudioTeaserFlow(input);
}
