'use server';

/**
 * @fileOverview A flow for analyzing the compatibility between two characters.
 * - analyzeCharacterCompatibility - A function that provides a brief analysis of two characters' personalities.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeCharacterCompatibilityInputSchema,
  type AnalyzeCharacterCompatibilityInput,
  AnalyzeCharacterCompatibilityOutputSchema,
  type AnalyzeCharacterCompatibilityOutput,
} from '@/lib/ai-schemas';

export async function analyzeCharacterCompatibility(
  input: AnalyzeCharacterCompatibilityInput
): Promise<AnalyzeCharacterCompatibilityOutput> {
  return analyzeCharacterCompatibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCharacterCompatibilityPrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: AnalyzeCharacterCompatibilityInputSchema },
  output: { schema: AnalyzeCharacterCompatibilityOutputSchema },
  prompt: `You are an expert character analyst and psychologist. Your task is to provide a brief, insightful analysis of the potential relationship dynamic between two characters based on their traits and backstories.

Character 1:
- Name: {{character1.name}}
- Traits: {{character1.traits}}
- Backstory: {{character1.backstory}}

Character 2:
- Name: {{character2.name}}
- Traits: {{character2.traits}}
- Backstory: {{character2.backstory}}

Based on this information, generate a 1-2 sentence analysis. Focus on how their personalities might complement each other, clash, or create an interesting dynamic. For example: "Alistair's cautious nature might initially clash with Lyra's impulsiveness, but her courage could inspire him to take necessary risks."`,
});

const analyzeCharacterCompatibilityFlow = ai.defineFlow(
  {
    name: 'analyzeCharacterCompatibilityFlow',
    inputSchema: AnalyzeCharacterCompatibilityInputSchema,
    outputSchema: AnalyzeCharacterCompatibilityOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;
    } catch (e) {
      console.error("Error in analyzeCharacterCompatibilityFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      throw new Error(`AI call in analyzeCharacterCompatibilityFlow failed: ${errorMessage}`);
    }
  }
);
