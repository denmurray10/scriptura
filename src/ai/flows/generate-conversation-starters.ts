'use server';

/**
 * @fileOverview A flow for generating conversation starters for a character chat.
 * - generateConversationStarters - A function that generates three distinct conversation prompts.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateConversationStartersInputSchema,
  type GenerateConversationStartersInput,
  GenerateConversationStartersOutputSchema,
  type GenerateConversationStartersOutput,
} from '@/lib/ai-schemas';

export async function generateConversationStarters(
  input: GenerateConversationStartersInput
): Promise<GenerateConversationStartersOutput> {
  return generateConversationStartersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConversationStartersPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateConversationStartersInputSchema},
  output: {schema: GenerateConversationStartersOutputSchema},
  prompt: `You are a creative assistant for a storytelling app. Your task is to generate three distinct and engaging conversation starters for a user about to chat with a character.

  **CHARACTER & STORY CONTEXT:**
  - Character Name: {{character.name}}
  - Character Traits: {{character.traits}}
  - Character Backstory: {{character.backstory}}
  - Story Title: "{{story.title}}"
  - Story Plot: "{{story.plot}}"

  **GUIDELINES FOR STARTERS:**
  1.  **Be In-World:** The prompts should feel like questions someone within the story's universe might ask.
  2.  **Be Open-Ended:** Encourage detailed responses, not just "yes" or "no" answers.
  3.  **Be Diverse:** Provide a mix of prompts. One could be about the main plot, one about the character's personal feelings or past, and one could be a more casual, personality-probing question.
  4.  **Phrase as Actions:** Frame them as instructions for the user (e.g., "Ask about...", "Inquire why...").

  **Example Starters:**
  - "Ask them what they truly think about the prophecy."
  - "Inquire about the scar over their left eye."
  - "Question their loyalty to the king."

  Now, generate exactly three conversation starters based on the provided character and story details.
  `,
});

const generateConversationStartersFlow = ai.defineFlow(
  {
    name: 'generateConversationStartersFlow',
    inputSchema: GenerateConversationStartersInputSchema,
    outputSchema: GenerateConversationStartersOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;
    } catch (e) {
      console.error("Error in generateConversationStartersFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
        throw new Error("AI Rate Limit Exceeded. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateConversationStartersFlow failed: ${errorMessage}`);
    }
  }
);
