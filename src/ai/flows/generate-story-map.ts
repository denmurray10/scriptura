
'use server';

/**
 * @fileOverview A flow for generating a story map image.
 * - generateStoryMap - A function that generates a world map for a story.
 */

import {
  GenerateStoryMapInputSchema,
  type GenerateStoryMapInput,
  GenerateStoryMapOutputSchema,
  type GenerateStoryMapOutput,
} from '@/lib/ai-schemas';
import { generateImageWithGetImg } from '@/lib/getimg';
import { ai } from '@/ai/genkit';

export async function generateStoryMap(input: GenerateStoryMapInput): Promise<GenerateStoryMapOutput> {
  return generateStoryMapFlow(input);
}

const generateStoryMapFlow = ai.defineFlow(
  {
    name: 'generateStoryMapFlow',
    inputSchema: GenerateStoryMapInputSchema,
    outputSchema: GenerateStoryMapOutputSchema,
  },
  async ({ genre, plot }): Promise<GenerateStoryMapOutput> => {
    try {
      const plotSummary = plot.split('.').slice(0, 2).join('.') + '.';

      const prompt = `CRUCIAL: Generate a top-down, fantasy-style world map. The output MUST be a map, not a landscape scene.
      
      This is a world map for a ${genre} story. The map should visually represent key elements and locations hinted at in the plot: "${plotSummary}".
      
      **Style specifications:**
      - **Type:** Top-down cartographic map.
      - **Aesthetics:** Antique parchment, hand-drawn style.
      - **Composition:** The map must be entirely land-based and fill the entire image frame. It MUST NOT contain any water, oceans, seas, rivers, or lakes.
      - **Content Rules:** The map MUST NOT contain any text, labels, words, letters, numbers, calligraphy, logos, badges, symbols, icons, or man-made structures like buildings, roads, or bridges. There must be NO compass rose.
      - **Perspective:** Do not show a 3D landscape. This is a flat map.`;
      
      const apiKey = process.env.GETIMG_API_KEY;
      if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment.');
      }
      
      const imageDataUri = await generateImageWithGetImg(
        prompt,
        apiKey,
        1024,
        1536 // Portrait orientation
      );
      
      if (!imageDataUri) {
        throw new Error('Failed to generate story map: No image data returned from the AI.');
      }
      
      return { mapUrl: imageDataUri };
    } catch (e) {
      console.error("Error in generateStoryMapFlow:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
        throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`Image generation in generateStoryMapFlow failed: ${errorMessage}`);
    }
  }
);
