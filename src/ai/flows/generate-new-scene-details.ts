
'use server';

/**
 * @fileOverview A flow for generating a new scene's details based on story context.
 * - generateNewSceneDetails - A function that generates a name and prompt for a new scene.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateNewSceneDetailsInputSchema,
  type GenerateNewSceneDetailsInput,
  GenerateNewSceneDetailsOutputSchema,
  type GenerateNewSceneDetailsOutput,
} from '@/lib/ai-schemas';

export async function generateNewSceneDetails(
  input: GenerateNewSceneDetailsInput
): Promise<GenerateNewSceneDetailsOutput> {
  return generateNewSceneDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewSceneDetailsPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateNewSceneDetailsInputSchema},
  output: {schema: GenerateNewSceneDetailsOutputSchema},
  prompt: `You are a creative world-builder for a {{genre}} storytelling app.
  
  The main plot of the story is: "{{plot}}"
  
  The story already has the following locations:
  {{#if existingSceneNames}}
    {{#each existingSceneNames}}
    - {{this}}
    {{/each}}
  {{else}}
    None
  {{/if}}
  
  Your task is to invent one completely new, interesting, and compelling location that fits the story's theme. Do NOT create a variation of an existing location.
  
  Provide a unique name for this new scene and a vivid, descriptive prompt that an AI image generator could use to create a visual for it.
  
  CRUCIAL: The image generation prompt must describe only the environment and atmosphere. It MUST NOT include any people, characters, or figures.

  Example:
  - Name: "The Sunken Market of Whispers"
  - Prompt: "An eerie, underwater marketplace with bioluminescent stalls casting a greenish glow on strange artifacts. Ghostly figures of merchants and patrons drift through the water, their forms shimmering and translucent. Ancient, waterlogged structures rise in the background, covered in glowing barnacles."
  `,
});

const generateNewSceneDetailsFlow = ai.defineFlow(
  {
    name: 'generateNewSceneDetailsFlow',
    inputSchema: GenerateNewSceneDetailsInputSchema,
    outputSchema: GenerateNewSceneDetailsOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateNewSceneDetailsFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateNewSceneDetailsFlow failed: ${errorMessage}`);
    }
  }
);
