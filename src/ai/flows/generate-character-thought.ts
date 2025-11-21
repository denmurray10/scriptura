
'use server';

/**
 * @fileOverview A flow for generating a character's inner thought based on their current state.
 * - generateCharacterThought - A function that generates a short, in-character thought.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterThoughtInputSchema,
  type GenerateCharacterThoughtInput,
  GenerateCharacterThoughtOutputSchema,
  type GenerateCharacterThoughtOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterThought(
  input: GenerateCharacterThoughtInput
): Promise<GenerateCharacterThoughtOutput> {
  return generateCharacterThoughtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterThoughtPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateCharacterThoughtInputSchema},
  output: {schema: GenerateCharacterThoughtOutputSchema},
  prompt: `You are an AI that expresses a character's inner monologue for a {{genre}} story.
  
  Your task is to generate a short, in-character thought (1-2 sentences) based on the character's current situation and emotional state. The thought should be a reflection, a brief observation, or a feeling.

  Character's Name: {{character.name}}
  Current Health: {{character.health}}/100
  Current Happiness: {{character.happiness}}/100
  Current Scenario: {{{scenario}}}

  Example: If happiness is low and the scenario is "The old bridge creaks underfoot," a good thought would be "Every step feels like it could be my last. My heart is pounding in my chest."

  Generate a thought now.
  `,
});

const generateCharacterThoughtFlow = ai.defineFlow(
  {
    name: 'generateCharacterThoughtFlow',
    inputSchema: GenerateCharacterThoughtInputSchema,
    outputSchema: GenerateCharacterThoughtOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateCharacterThoughtFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterThoughtFlow failed: ${errorMessage}`);
    }
  }
);
