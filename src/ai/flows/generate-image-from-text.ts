
'use server';

/**
 * @fileOverview A flow for generating an image from a text prompt using Gemini.
 *
 * - generateImageFromText - A function that generates an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
    GenerateImageFromTextInputSchema,
    GenerateImageFromTextOutputSchema,
    type GenerateImageFromTextInput,
    type GenerateImageFromTextOutput,
} from '@/lib/ai-schemas';

export async function generateImageFromText(
  input: GenerateImageFromTextInput
): Promise<GenerateImageFromTextOutput> {
  return generateImageFromTextFlow(input);
}

const generateImageFromTextFlow = ai.defineFlow(
  {
    name: 'generateImageFromTextFlow',
    inputSchema: GenerateImageFromTextInputSchema,
    outputSchema: GenerateImageFromTextOutputSchema,
  },
  async ({prompt}) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media || !media.url) {
        throw new Error('Image generation failed to return a valid image.');
      }

      return {
        imageUrl: media.url,
      };
    } catch (e) {
      console.error("Error in generateImageFromTextFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
        throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateImageFromTextFlow failed: ${errorMessage}`);
    }
  }
);
