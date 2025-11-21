
'use server';

/**
 * @fileOverview A flow for removing the background from an image using getimg.ai.
 *
 * - removeImageBackground - Removes the background from a given image data URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';

const RemoveImageBackgroundInputSchema = z.object({
  imageDataUrl: z.string().describe("The image to process, as a data URI."),
});
export type RemoveImageBackgroundInput = z.infer<typeof RemoveImageBackgroundInputSchema>;

const RemoveImageBackgroundOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the image with the background removed."),
});
export type RemoveImageBackgroundOutput = z.infer<typeof RemoveImageBackgroundOutputSchema>;


async function removeBackgroundWithGetImg(base64Image: string): Promise<string> {
    const apiKey = process.env.GETIMG_API_KEY;
    if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment. Please add it to the .env file.');
    }
    try {
        const response = await axios.post(
            'https://api.getimg.ai/v1/tools/remove-background', // CORRECTED ENDPOINT
            {
                image: base64Image,
                output_format: 'png' // PNG supports transparency
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return `data:image/png;base64,${response.data.image}`;
    } catch (error: any) {
        console.error('Error calling getimg.ai remove background API:', error.response?.data || error.message);
        throw new Error(`Failed to remove background with getimg.ai: ${error.response?.data?.message || error.message}`);
    }
}


export const removeImageBackgroundFlow = ai.defineFlow(
  {
    name: 'removeImageBackgroundFlow',
    inputSchema: RemoveImageBackgroundInputSchema,
    outputSchema: RemoveImageBackgroundOutputSchema,
  },
  async ({ imageDataUrl }) => {
    try {
      if (!imageDataUrl.startsWith('data:image')) {
        throw new Error('Invalid image data URL format.');
      }
      
      const base64Image = imageDataUrl.split(',')[1];
      const resultImageUrl = await removeBackgroundWithGetImg(base64Image);

      return {
        imageUrl: resultImageUrl,
      };

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during background removal.';
      console.error("Error in removeImageBackgroundFlow:", e);
      throw new Error(`Background removal failed: ${errorMessage}`);
    }
  }
);

export async function removeImageBackground(input: RemoveImageBackgroundInput): Promise<RemoveImageBackgroundOutput> {
  return removeImageBackgroundFlow(input);
}
