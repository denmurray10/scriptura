
'use server';

/**
 * @fileOverview A flow for generating scenario visuals based on a description.
 *
 * - generateScenarioVisual - A function that generates a scenario visual.
 */

import {
  GenerateScenarioVisualInputSchema,
  type GenerateScenarioVisualInput,
  GenerateScenarioVisualOutputSchema,
  type GenerateScenarioVisualOutput,
} from '@/lib/ai-schemas';
import { generateImageWithGetImg } from '@/lib/getimg';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export async function generateScenarioVisual(
  input: GenerateScenarioVisualInput
): Promise<GenerateScenarioVisualOutput> {
  return generateScenarioVisualFlow(input);
}

const generateScenarioVisualFlow = ai.defineFlow(
  {
    name: 'generateScenarioVisualFlow',
    inputSchema: GenerateScenarioVisualInputSchema,
    outputSchema: GenerateScenarioVisualOutputSchema,
  },
  async ({ scenarioDescription }) => {
    try {
      const apiKey = process.env.GETIMG_API_KEY;
      if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment. Please add it to the .env file.');
      }
      const imageDataUri = await generateImageWithGetImg(
        `cinematic portrait shot, ${scenarioDescription}`,
        apiKey,
        720, 
        1280 // Portrait aspect ratio for mobile
      );

      return {
        url: imageDataUri,
        originalSize: 0, // Will be calculated in the action
        newSize: 0,      // Will be calculated in the action
      };
    } catch (e) {
      console.error('Error in generateScenarioVisualFlow:', e);
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'An unknown error occurred during image generation.';
      if (errorMessage.includes('429') || /rate limit/i.test(errorMessage)) {
        throw new Error(
          "AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again."
        );
      }
      throw new Error(
        `Image generation in generateScenarioVisualFlow failed: ${errorMessage}`
      );
    }
  }
);
