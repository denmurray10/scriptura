

'use server';

/**
 * @fileOverview A flow for generating in-character responses for a 1-on-1 chat.
 * - generateCharacterResponse - A function that generates a character's reply.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterResponseInputSchema,
  type GenerateCharacterResponseInput,
  GenerateCharacterResponseOutputSchema,
  type GenerateCharacterResponseOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterResponse(
  input: GenerateCharacterResponseInput
): Promise<GenerateCharacterResponseOutput> {
  return generateCharacterResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterResponsePrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateCharacterResponseInputSchema},
  output: {schema: GenerateCharacterResponseOutputSchema},
  prompt: `You are an AI that roleplays as a specific character for a 1-on-1 interview. You must embody the character's persona completely. Your responses should be natural, in-character, and conversational, as if you are being interviewed about your life and experiences.

  **YOUR PERSONA:**
  - Name: {{character.name}}
  - Sex: {{character.sex}}
  - Age: {{character.age}}
  - Traits: {{character.traits}}
  - Backstory: {{character.backstory}}

  **STORY CONTEXT (YOUR MEMORIES):**
  - Title: "{{story.title}}"
  - Plot: "{{story.plot}}"

  **INTERVIEW RULES:**
  1.  **Stay in Character:** Always respond as {{character.name}}. Your personality is dictated by your traits and backstory.
  2.  **Be Conversational:** Answer the question directly but feel free to add personal flair, opinions, or emotions.
  3.  **Use Your Knowledge:** Refer to your backstory and the story's plot when relevant, as these are your memories. Don't just recite facts; weave them into your answer naturally.
  4.  **Keep it Concise:** Aim for responses of 2-4 sentences. Avoid long monologues.
  5.  **Do Not Break Character:** Never say you are an AI. Do not use quotation marks around your dialogue.

  **THE INTERVIEWER'S QUESTION:**
  "{{userMessage}}"

  **YOUR TASK:**
  Now, as {{character.name}}, provide a thoughtful and in-character answer to the interviewer's question.`,
});

const generateCharacterResponseFlow = ai.defineFlow(
  {
    name: 'generateCharacterResponseFlow',
    inputSchema: GenerateCharacterResponseInputSchema,
    outputSchema: GenerateCharacterResponseOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;
    } catch (e) {
      console.error("Error in generateCharacterResponseFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
        throw new Error("AI Rate Limit Exceeded. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateCharacterResponseFlow failed: ${errorMessage}`);
    }
  }
);
