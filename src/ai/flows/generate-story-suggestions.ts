
'use server';

/**
 * @fileOverview Generates story suggestions for the user.
 *
 * - generateStorySuggestions - Generates two possible next actions for the user's character.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateStorySuggestionsInputSchema,
  type GenerateStorySuggestionsInput,
  GenerateStorySuggestionsOutputSchema,
  type GenerateStorySuggestionsOutput,
} from '@/lib/ai-schemas';

export async function generateStorySuggestions(
  input: GenerateStorySuggestionsInput
): Promise<GenerateStorySuggestionsOutput> {
  return generateStorySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateStorySuggestionsPrompt',
    model: 'googleai/gemini-flash-latest',
    input: { schema: GenerateStorySuggestionsInputSchema },
    output: { schema: GenerateStorySuggestionsOutputSchema },
    prompt: `You are a creative AI assistant for a {{genre}} storytelling app. Your goal is to help users decide what to do next, keeping in mind the story is for a '{{ageRating}}' audience.
  
    **PRINCIPLES FOR COMPELLING SUGGESTIONS:**
    *   **Action-Oriented:** Suggestions should be phrased as direct actions (e.g., "Examine the strange altar," not "You could examine the altar.").
    *   **Context-Specific:** Suggestions MUST be directly related to the current scenario, character stats, and items. Avoid generic actions.
    *   **Inspire, Don't Prescribe:** Offer clear paths, but leave the *how* and the ultimate outcome open to interpretation.
    *   **Stat & Skill-Driven:** A character with high Wits should get suggestions about noticing details. A character with high Charisma should get suggestions about diplomacy or deception. A character with low Health should get more cautious suggestions.

    **AVOID GENERIC SUGGESTIONS LIKE:**
    *   "Look around."
    *   "Explore the area."
    *   "Talk to the NPC."
    *   "Check your inventory."

    The character is:
    Name: {{character.name}}
    Traits: {{character.traits}}
    Backstory: {{character.backstory}}
    
    Their current state is:
    Health: {{character.health}}/100
    Happiness: {{character.happiness}}/100
    Money: {{character.money}}
    Stats: Intellect: {{character.stats.intellect}}, Charisma: {{character.stats.charisma}}, Wits: {{character.stats.wits}}, Willpower: {{character.stats.willpower}}.
    Items: {{#if character.items.length}}{{#each character.items}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
  
    The current situation is:
    Scenario: {{scenario}}
    Story so far: {{storyProgression}}
    Other characters available for interaction: {{#if otherCharacters.length}}{{#each otherCharacters}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
  
    CRUCIAL TASK: Based on the principles above, the character's CURRENT STATS, and the situation, generate exactly two distinct and engaging suggestions for what they could do next.
    
    1.  **Suggestion 1 (Calculated Move):** A logical next step that is clever and observant. This could involve using an item in a smart way, using their wits to gain an advantage, or having a careful conversation to gather information.
    2.  **Suggestion 2 (Bold Action):** A more daring, unconventional, or risky action. This should push the story in a potentially dramatic new direction and might involve using their charisma to influence someone, or their willpower to push through a challenge.
    
    You must provide your response in the specified JSON format.`,
});


const generateStorySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateStorySuggestionsFlow',
    inputSchema: GenerateStorySuggestionsInputSchema,
    outputSchema: GenerateStorySuggestionsOutputSchema,
  },
  async input => {
    try {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('The AI returned an empty or invalid output.');
        }
        return output;

    } catch (e) {
        console.error("Error in generateStorySuggestionsFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
         if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateStorySuggestionsFlow failed: ${errorMessage}`);
    }
  }
);
