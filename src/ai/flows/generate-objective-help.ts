
'use server';

/**
 * @fileOverview A flow for generating a step-by-step guide to complete an objective.
 * - generateObjectiveHelp - A function that provides hints for an objective.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateObjectiveHelpInputSchema,
  type GenerateObjectiveHelpInput,
  GenerateObjectiveHelpOutputSchema,
  type GenerateObjectiveHelpOutput,
} from '@/lib/ai-schemas';

export async function generateObjectiveHelp(
  input: GenerateObjectiveHelpInput
): Promise<GenerateObjectiveHelpOutput> {
  return generateObjectiveHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateObjectiveHelpPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateObjectiveHelpInputSchema},
  output: {schema: GenerateObjectiveHelpOutputSchema},
  prompt: `You are a helpful and wise Game Master AI. Your task is to provide a clear, step-by-step guide to help a player achieve their objective within the story.

  **CONTEXT:**
  - **Objective:** "{{objectiveDescription}}"
  - **Character:** {{character.name}}
    - **Skills:** {{#if character.skills.length}}{{#each character.skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
    - **Items:** {{#if character.items.length}}{{#each character.items}}{{this.name}}: {{this.description}}{{#unless @last}}; {{/unless}}{{/each}}{{else}}None{{/if}}
  - **Story So Far:** {{storyProgression}}
  - **Current Situation:** {{currentScenario}}
  - **Other Characters Present:** {{#if otherCharacters.length}}{{#each otherCharacters}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

  **YOUR TASK:**
  Based on all the provided context, generate a series of logical, actionable steps (2-4 steps) that the player can take to complete the objective.
  - The steps should be clever and consider the character's skills and items. For example, if they have a 'Lockpicking' skill and the objective is to "Find the stolen ledger", a good step would be "Try to pick the lock on the suspect's desk."
  - The steps should be phrased as suggestions or hints, not as direct commands. (e.g., "You might want to...", "Consider asking about...", "Perhaps inspecting the...").
  - The steps must make sense within the current scenario and story progression.
  - Keep each step concise and to the point.

  Provide the output as an array of strings.
  `,
});

const generateObjectiveHelpFlow = ai.defineFlow(
  {
    name: 'generateObjectiveHelpFlow',
    inputSchema: GenerateObjectiveHelpInputSchema,
    outputSchema: GenerateObjectiveHelpOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (!output || !output.steps) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;
    } catch (e) {
        console.error("Error in generateObjectiveHelpFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateObjectiveHelpFlow failed: ${errorMessage}`);
    }
  }
);
