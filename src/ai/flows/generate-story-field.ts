

'use server';

/**
 * @fileOverview A flow for generating individual story fields.
 *
 * - generateStoryField - A function that generates a specific field for a story.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateStoryFieldInputSchema,
  type GenerateStoryFieldInput,
  GenerateStoryFieldOutputSchema,
} from '@/lib/ai-schemas';

export async function generateStoryField(
  input: GenerateStoryFieldInput
) {
  return generateStoryFieldFlow(input);
}

const instructionMap: Record<string, string> = {
    'name': 'Generate a highly compelling, original, and unique story title. Avoid clichés and overused fantasy/sci-fi words like "Obsidian", "Shadow", "Crystal", "Forgotten", "Lost". Make it memorable, intriguing, and something that has not been heard before.',
    'genre': 'Generate a single, common story genre (e.g., High Fantasy, Sci-Fi, Mystery).',
    'plot': `Generate a detailed and engaging opening plot, approximately 3 paragraphs and up to 500 words long. The plot MUST be directly inspired by the story's name and genre(s).
    - It must establish a clear setting and a core conflict or mystery.
    - It must hint at the stakes for a potential protagonist.
    - CRUCIAL: Do not use any character names or specify a gender (e.g., use 'a lone traveler', 'a young scientist', 'they' instead of 'he' or 'she').
    - If there are multiple genres, creatively blend elements from all of them.`
};


const generateStoryFieldFlow = ai.defineFlow(
  {
    name: 'generateStoryFieldFlow',
    inputSchema: GenerateStoryFieldInputSchema,
    outputSchema: GenerateStoryFieldOutputSchema,
  },
  async input => {
    try {
      const instruction = instructionMap[input.field];
      if (!instruction) {
          throw new Error(`Invalid field provided: ${input.field}`);
      }
      
      const contextPrompt = [
        `You are a creative assistant for a storytelling app.`,
        `Your task is to: ${instruction}`,
        'Use the following existing story details as context:',
        input.context?.name && `Name: ${input.context.name}.`,
        input.context?.genre && `Genre(s): ${input.context.genre}.`,
        input.context?.plot && `Plot: ${input.context.plot}.`,
        input.context?.existingNames?.length && `The following titles are already in use, so you MUST NOT use them or any close variations: ${input.context.existingNames.join(', ')}.`,
        `Respond with only the generated value for the '${input.field}' field. Do not include any other text or formatting.`
      ].filter(Boolean).join('\n');
      
      const config = (input.field === 'name' || input.field === 'plot') ? { temperature: 1.0 } : {};

      const response = await ai.generate({
          model: 'googleai/gemini-flash-latest',
          prompt: contextPrompt,
          config,
      });

      let generatedText = response.text;

      if (!generatedText) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      
      if (input.field === 'plot' && generatedText.toLowerCase().startsWith('plot:')) {
          generatedText = generatedText.substring(5).trim();
      }

      return { value: generatedText.trim() };

    } catch (e) {
      console.error("Error in generateStoryFieldFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
          throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateStoryFieldFlow failed: ${errorMessage}`);
    }
  }
);
