
'use server';

/**
 * @fileOverview This file is now deprecated. The interview background is now a static image.
 * This flow is kept for archival purposes but is no longer used by the application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateImageWithGetImg } from '@/lib/getimg';
import {
  GenerateInterviewBackgroundInputSchema,
  GenerateInterviewBackgroundOutputSchema,
  type GenerateInterviewBackgroundInput,
  type GenerateInterviewBackgroundOutput,
} from '@/lib/ai-schemas';

export async function generateInterviewBackground(
  input: GenerateInterviewBackgroundInput
): Promise<GenerateInterviewBackgroundOutput> {
  return generateInterviewBackgroundFlow(input);
}

const generateInterviewBackgroundFlow = ai.defineFlow(
  {
    name: 'generateInterviewBackgroundFlow',
    inputSchema: GenerateInterviewBackgroundInputSchema,
    outputSchema: GenerateInterviewBackgroundOutputSchema,
  },
  async (input) => {
    try {
      const { character, story } = input;
      const prompt = `A full-body photorealistic image of ${character.name}, a ${character.age} ${character.sex} with ${character.hairColour} hair and ${character.eyeColour} eyes. They are sitting comfortably on an ornate chair in a location that fits a ${story.genre} story. The character is facing forward, looking directly at the camera, as if being interviewed. Cinematic, interview-style lighting, sharp focus. Style: ${story.style}.`;
      
      const apiKey = process.env.GETIMG_API_KEY;
      if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment.');
      }
      
      // Use a widescreen aspect ratio
      const imageDataUri = await generateImageWithGetImg(prompt, apiKey, 1024, 576);

      return {
        imageUrl: imageDataUri,
      };
    } catch (e) {
      console.error("Error in generateInterviewBackgroundFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      throw new Error(`AI call in generateInterviewBackgroundFlow failed: ${errorMessage}`);
    }
  }
);
