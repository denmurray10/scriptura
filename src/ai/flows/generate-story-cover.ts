
'use server';

/**
 * @fileOverview A flow for generating a story cover image.
 * - generateStoryCover - A function that generates a book cover image for a story.
 */

import {
  GenerateStoryCoverInputSchema,
  type GenerateStoryCoverInput,
  GenerateStoryCoverOutputSchema,
  type GenerateStoryCoverOutput,
} from '@/lib/ai-schemas';
import { compressImage, getBase64Size } from '@/lib/utils';
import { ai } from '@/ai/genkit';
import { generateImageWithGetImg } from '@/lib/getimg';

export async function generateStoryCover(input: GenerateStoryCoverInput): Promise<GenerateStoryCoverOutput> {
  return generateStoryCoverFlow(input);
}

const generateStoryCoverFlow = ai.defineFlow(
  {
    name: 'generateStoryCoverFlow',
    inputSchema: GenerateStoryCoverInputSchema,
    outputSchema: GenerateStoryCoverOutputSchema,
  },
  async (input): Promise<GenerateStoryCoverOutput> => {
    try {
      const plotSummary = input.plot.split('.').slice(0, 2).join('.') + '.';
      
      const prompt = `A professional book cover for a ${input.genre} novel. The title "${input.title}" MUST be the main focus, rendered in large, clear, artistic typography, and fully visible. The background should be a symbolic image related to the plot: "${plotSummary}". Style: ${input.stylePrompt}. Minimalist, modern graphic design. Do NOT include any other text like author names or taglines.`;
      
      const apiKey = process.env.GETIMG_API_KEY;
      if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment.');
      }
      
      const imageDataUri = await generateImageWithGetImg(
        prompt,
        apiKey,
        720,
        1280
      );
      
      if (!imageDataUri) {
        throw new Error('Failed to generate story cover: No image data returned from the AI.');
      }

      const originalSize = getBase64Size(imageDataUri);
      const compressedUrl = await compressImage(imageDataUri, { quality: 0.8, maxWidth: 400, maxHeight: 600 });
      const newSize = getBase64Size(compressedUrl);
      
      return { coverUrl: compressedUrl, originalSize, newSize };
    } catch (e) {
      console.error("Error in generateStoryCoverFlow:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
        throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`Image generation in generateStoryCoverFlow failed: ${errorMessage}`);
    }
  }
);
