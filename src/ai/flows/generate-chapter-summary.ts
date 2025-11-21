
'use server';

/**
 * @fileOverview A flow for generating a chapter summary.
 * - generateChapterSummary - A function that summarizes the last 10 choices.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateChapterSummaryInputSchema,
  type GenerateChapterSummaryInput,
  GenerateChapterSummaryOutputSchema,
  type GenerateChapterSummaryOutput,
} from '@/lib/ai-schemas';

export async function generateChapterSummary(
  input: GenerateChapterSummaryInput
): Promise<GenerateChapterSummaryOutput> {
  return generateChapterSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChapterSummaryPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateChapterSummaryInputSchema},
  output: {schema: GenerateChapterSummaryOutputSchema},
  prompt: `You are a master storyteller for a {{genre}} story.
  
  The main plot is: "{{plot}}"
  
  The last chapter consisted of the following key events, based on the player's choices:
  {{#each lastTenChoices}}
  - {{this.characterName}} chose to "{{this.choice}}", which resulted in: {{this.outcomeDescription}}
  {{/each}}
  
  Your task is to write a summary of this chapter. Synthesize the key events and their consequences.
  
  **CRUCIAL FORMATTING RULES:**
  1. The summary MUST be broken into short paragraphs, each containing only 1-2 sentences.
  2. Separate each paragraph with a single newline character.
  3. After the summary paragraphs, you MUST add a single, separate sentence that acts as an **intense cliffhanger** for the next chapter. This sentence must create a sense of immediate peril, reveal a shocking twist, or pose an urgent, high-stakes question. This teaser should also be separated by a newline.
  
  Example Output:
  "After narrowly escaping the collapsing tomb, the heroes discovered the first piece of the Sunstone map. Their success, however, alerted the Shadow Syndicate to their quest.

  The Syndicate's assassins are now surely on their trail.

  But as the final piece of the map clicked into place, it wasn't a location it revealed—it was a name. The name of the traitor in their group."
  `,
});

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: GenerateChapterSummaryInputSchema,
    outputSchema: GenerateChapterSummaryOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateChapterSummaryFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateChapterSummaryFlow failed: ${errorMessage}`);
    }
  }
);
