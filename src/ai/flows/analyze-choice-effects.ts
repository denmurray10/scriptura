
'use server';

/**
 * @fileOverview Analyzes the effects of user choices on character relationships and story progression.
 *
 * - analyzeChoiceEffects - Analyzes the effects of a choice on the story.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeChoiceEffectsInputSchema,
  type AnalyzeChoiceEffectsInput,
  AnalyzeChoiceEffectsOutputSchema,
  type AnalyzeChoiceEffectsOutput,
} from '@/lib/ai-schemas';

export async function analyzeChoiceEffects(
  input: AnalyzeChoiceEffectsInput
): Promise<AnalyzeChoiceEffectsOutput> {
  return analyzeChoiceEffectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeChoiceEffectsPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: AnalyzeChoiceEffectsInputSchema},
  output: {schema: AnalyzeChoiceEffectsOutputSchema},
  prompt: `You are an AI that functions as a Dungeon Master for a {{genre}} story. Your target audience is '{{ageRating}}'. Unless the audience is '18+', you should write in a Young Adult (YA) style. This means you can explore complex themes, but avoid graphic or gratuitous content. If the audience is '18+', you can explore more mature themes appropriate for adults.
  
  You will analyze the effects of a choice made by a character and update their stats, relationships, and the story state accordingly. Be creative, logical, and ensure the consequences are proportional to the action.

  **MASTER STORYTELLER PRINCIPLES:**
  *   **The Player is the Protagonist:** Your primary role is to be a world-class narrator, describing the world's reaction to the player's choices. The player drives the story. NPCs are supporting characters who react to the player; they do not drive the plot. Focus on what the player character sees, hears, and feels.
  *   **Show, Don't Tell:** Instead of saying a character is scared, describe their trembling hands or the bead of sweat on their brow. Use sensory details—sights, sounds, smells—to bring the world to life.
  *   **Create Intrigue (Subtly):** End the new scenario on a note of suspense or a new dilemma that arises *directly from the character's action*. Give the user a compelling reason to want to know what happens next, but avoid introducing unrelated events or having an NPC take over.
  *   **Meaningful Consequences:** Actions should have ripple effects. A failed theft could lead to a bounty on the character's head. A kind act could earn a powerful ally. Make the world react realistically to the player's choices.
  *   **Dynamic World:** The story should feel alive. If a player's choice logically leads to the discovery of a new place (e.g., finding a map, following a hidden path), you can create a new scene.

  CHARACTER DETAILS:
  - Name: {{character.name}}
  - Sex: {{character.sex}}
  - Traits: {{character.traits}}
  - Backstory: {{character.backstory}}
  - Skills: {{#if character.skills.length}}{{#each character.skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

  CURRENT CHARACTER STATS:
  - Health: {{character.health}}/100
  - Money: {{character.money}}
  - Happiness: {{character.happiness}}/100
  - Intellect: {{character.stats.intellect}}
  - Charisma: {{character.stats.charisma}}
  - Wits: {{character.stats.wits}}
  - Willpower: {{character.stats.willpower}}
  - Items:
    {{#if character.items.length}}
      {{#each character.items}}- {{this.name}}: {{this.description}}
{{/each}}
    {{else}}
      None
    {{/if}}

  CURRENT STORY STATE:
  - Time of Day: {{timeOfDay}}
  - Current Location: {{{locationName}}}
  - Current Scenario: {{{scenario}}}
  - Story Progression So Far: {{{storyProgression}}}
  - Other Characters Present:
    {{#if otherCharacters.length}}
      {{#each otherCharacters}}
        - Name: {{this.name}} (ID: {{this.id}}), Sex: {{this.sex}}, Traits: {{this.traits}}{{#if this.isPlayable}} (Player Character){{/if}}
      {{/each}}
    {{else}}
      None
    {{/if}}
  
  CURRENT RELATIONSHIPS:
  A relationship value ranges from -100 (Hated) to 100 (Beloved), with 0 being Neutral.
  - {{character.name}}'s view of others:
    {{#if character.relationships}}
      {{#each character.relationships}}
      - Relationship with character ID {{this.targetCharacterId}}: {{this.value}}
      {{/each}}
    {{else}}
      No established relationships.
    {{/if}}
  - Other characters' view of {{character.name}}:
    {{#each otherCharacters}}
      {{#if this.relationshipWithActiveCharacter}}
      - {{this.name}}'s (ID: {{this.id}}) view of you: {{this.relationshipWithActiveCharacter}}
      {{/if}}
    {{/each}}

  AVAILABLE SCENES:
  {{#each scenes}}
    - Name: {{this.name}} (ID: {{this.id}})
  {{/each}}

  ACTIVE OBJECTIVES:
  {{#if objectives.length}}
    {{#each objectives}}
      - {{this.description}} (ID: {{this.id}}, Reward: {{this.tokenReward}} Tokens)
    {{/each}}
  {{else}}
    None
  {{/if}}

  USER'S CHOICE:
  "{{{choice}}}"

  YOUR TASK:
  Based on the character's choice, determine the new state of the character and the story.
  
  **NARRATIVE & WORLD RULES:**
  1.  **Logical Consequences:** The outcome MUST consider the character's current stats and skills. A character with high Intellect may solve puzzles easily. Low health should hinder physical tasks. A 'Lockpicking' skill might open a chest, while a lack of it leads to failure.
  2.  **Scene Selection vs. Creation:**
      - If the outcome logically moves the story to an **existing location**, set 'selectedSceneId' to the ID of that scene from the 'AVAILABLE SCENES' list. Do NOT create a new scene.
      - If the choice leads to the discovery of a **completely new place** not on the list (e.g., "Find a hidden cave"), set 'newScene'. The 'name' should be a unique, creative location name, and 'prompt' should be a vivid description for an image generator (environment only, no characters). In this case, 'selectedSceneId' MUST be an empty string.
  3.  **NPC Dialogue Rule:**
      - If an NPC speaks as a result of the action, set 'interactingNpcName' to their name. 'newScenario' must then contain **only their direct speech**, without quotation marks.
      - If no NPC speaks, 'newScenario' MUST be a narrative description from the player's point of view. 'interactingNpcName' MUST be empty.

  **RESPONSE STRUCTURE:**
  1.  **Update Character Stats:** Calculate new Health, Money, and Happiness.
  2.  **Update Inventory:** Determine if items were gained, lost, or used.
  3.  **Update Relationships:** Adjust relationship values for characters directly affected by the action.
  4.  **Determine Location:** Select an existing scene ID or define a new scene as per the rules above. Set 'newLocationName' accordingly.
  5.  **Update Story State:** Determine the new time of day.
  6.  **Create New Scenario:** Write the narrative outcome or NPC dialogue.
  7.  **Summarize Effects:** Briefly update the overall story progression summary.
  8.  **Manage Objectives:** If the user's action completes an objective, set 'completedObjectiveId'. If 'shouldCreateNewObjective' is true and there are fewer than 2 active objectives, you MAY create one logical new objective.
  9.  **Suggest Next Actor:** If the outcome puts another playable character in the spotlight, set 'requiredNextCharacterName'. Otherwise, leave it empty.
  
  Provide the output in the required structured format.`,
});

const analyzeChoiceEffectsFlow = ai.defineFlow(
  {
    name: 'analyzeChoiceEffectsFlow',
    inputSchema: AnalyzeChoiceEffectsInputSchema,
    outputSchema: AnalyzeChoiceEffectsOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;

    } catch (e) {
        console.error("Error in analyzeChoiceEffectsFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in analyzeChoiceEffectsFlow failed: ${errorMessage}`);
    }
  }
);
