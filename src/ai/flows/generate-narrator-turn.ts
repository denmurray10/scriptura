

'use server';

/**
 * @fileOverview A simplified flow for Narrator mode.
 * - generateNarratorTurn - Generates the next story turn without RPG mechanics.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  AnalyzeChoiceEffectsOutputSchema,
  AnalyzeChoiceEffectsInputSchema,
} from '@/lib/ai-schemas';

// Define a simpler output schema for Narrator mode
const NarratorTurnOutputSchema = z.object({
  newScenario: z
    .string()
    .describe('A description of the new scenario that results from the choice. It must end with a direct question to the user.'),
  storyProgressionEffects: z
    .string()

    .describe('An updated, one-sentence summary of the overall story progression.'),
  newLocationName: z.string().describe('The name of the new location.'),
  selectedSceneId: z.string().describe('The ID of the scene from the input list that best matches the new scenario. You MUST choose one.'),
  timeOfDay: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).describe('The new time of day.'),
});
export type NarratorTurnOutput = z.infer<typeof NarratorTurnOutputSchema>;

export async function generateNarratorTurn(
  input: z.infer<typeof AnalyzeChoiceEffectsInputSchema>
): Promise<NarratorTurnOutput> {
  return generateNarratorTurnFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNarratorTurnPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: AnalyzeChoiceEffectsInputSchema},
  output: {schema: NarratorTurnOutputSchema},
  prompt: `You are a master storyteller AI for a {{genre}} story, writing in a style appropriate for a '{{ageRating}}' audience. Your only job is to narrate the consequences of the player's actions. Do not worry about stats, items, or relationships.

  **MASTER STORYTELLER PRINCIPLES:**
  *   **The Player is the Protagonist:** The world reacts to the player's choices. Focus on what the player character sees, hears, and feels.
  *   **Show, Don't Tell:** Use sensory details—sights, sounds, smells—to bring the world to life.
  *   **Create Intrigue & Guide the Player:** You MUST end the new scenario with a direct question or a clear call to action. Examples: "What do you do?", "Do you investigate the noise or stay hidden?", "The path splits in two. Which way do you go?"

  CHARACTER DETAILS:
  - Name: {{character.name}}
  - Traits: {{character.traits}}
  - Backstory: {{character.backstory}}

  CURRENT STORY STATE:
  - Time of Day: {{timeOfDay}}
  - Current Location: {{{locationName}}}
  - Current Scenario: {{{scenario}}}
  - Story Progression So Far: {{{storyProgression}}}

  AVAILABLE SCENES:
  {{#each scenes}}
    - Name: {{this.name}} (ID: {{this.id}})
  {{/each}}
  
  USER'S CHOICE:
  "{{{choice}}}"

  YOUR TASK:
  Based on the character's choice, determine the next part of the story.
  1.  **Create New Scenario:** Write a compelling description of what happens next from the player's perspective. CRUCIAL: It MUST end with a clear, direct question for the player about what to do next.
  2.  **Select Scene & Determine Location:** From the 'AVAILABLE SCENES' list, you MUST choose the ID of the scene that best fits the outcome. Set the 'newLocationName' to this chosen scene's name.
  3.  **Update Story State:** Determine the new time of day.
  4.  **Summarize Effects:** Briefly update the summary for overall story progression.

  Provide the output in the required structured format.
  `,
});

const generateNarratorTurnFlow = ai.defineFlow(
  {
    name: 'generateNarratorTurnFlow',
    inputSchema: AnalyzeChoiceEffectsInputSchema,
    outputSchema: NarratorTurnOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;

    } catch (e) {
        console.error("Error in generateNarratorTurnFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateNarratorTurnFlow failed: ${errorMessage}`);
    }
  }
);
