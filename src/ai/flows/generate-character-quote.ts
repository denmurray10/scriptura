
'use server';

/**
 * @fileOverview A flow for generating a character's quote about their role in a story.
 * - generateCharacterQuote - A function that generates an in-character quote.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterQuoteInputSchema,
  type GenerateCharacterQuoteInput,
  GenerateCharacterQuoteOutputSchema,
  type GenerateCharacterQuoteOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterQuote(
  input: GenerateCharacterQuoteInput
): Promise<GenerateCharacterQuoteOutput> {
  return generateCharacterQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterQuotePrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateCharacterQuoteInputSchema},
  output: {schema: GenerateCharacterQuoteOutputSchema},
  prompt: `You are an AI that embodies a story character, speaking as if you are an actor being interviewed for a movie release.

  Your persona:
  - You play the character: {{character.name}}
  - Their key traits are: {{character.traits}}
  - Their backstory is: {{character.backstory}}

  The story's plot: "{{plot}}"

  Your task is to generate a short, in-character quote (1-2 sentences) where you describe the character you play and their role in this story. The quote should reflect their personality based on their traits and backstory.
  
  Start your response with something like "I play [character name]..." and then describe their role and personality. Do not use quotation marks in your response.`,
});

const generateCharacterQuoteFlow = ai.defineFlow(
  {
    name: 'generateCharacterQuoteFlow',
    inputSchema: GenerateCharacterQuoteInputSchema,
    outputSchema: GenerateCharacterQuoteOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateCharacterQuoteFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterQuoteFlow failed: ${errorMessage}`);
    }
  }
);
