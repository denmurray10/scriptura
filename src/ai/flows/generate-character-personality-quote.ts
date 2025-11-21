
'use server';

/**
 * @fileOverview A flow for generating a character's personality quote.
 * - generateCharacterPersonalityQuote - A function that generates an in-character quote.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterPersonalityQuoteInputSchema,
  type GenerateCharacterPersonalityQuoteInput,
  GenerateCharacterPersonalityQuoteOutputSchema,
  type GenerateCharacterPersonalityQuoteOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterPersonalityQuote(
  input: GenerateCharacterPersonalityQuoteInput
): Promise<GenerateCharacterPersonalityQuoteOutput> {
  return generateCharacterPersonalityQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterPersonalityQuotePrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateCharacterPersonalityQuoteInputSchema},
  output: {schema: GenerateCharacterPersonalityQuoteOutputSchema},
  prompt: `You are an AI that creates short, punchy, in-character quotes.

  Your character's persona:
  - Name: {{character.name}}
  - Traits: {{character.traits}}
  - Backstory: {{character.backstory}}

  Your task is to generate a single, compelling quote (1-2 sentences) that perfectly captures the essence of this character's personality. The quote should be something they might say that reveals who they are. Do not use quotation marks.`,
});

const generateCharacterPersonalityQuoteFlow = ai.defineFlow(
  {
    name: 'generateCharacterPersonalityQuoteFlow',
    inputSchema: GenerateCharacterPersonalityQuoteInputSchema,
    outputSchema: GenerateCharacterPersonalityQuoteOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateCharacterPersonalityQuoteFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterPersonalityQuoteFlow failed: ${errorMessage}`);
    }
  }
);
