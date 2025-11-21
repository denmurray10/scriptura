

'use server';

/**
 * @fileOverview A flow for generating individual character fields.
 *
 * - generateCharacterField - A function that generates a specific field for a character.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterFieldInputSchema,
  type GenerateCharacterFieldInput,
  GenerateCharacterFieldOutputSchema,
} from '@/lib/ai-schemas';
import { generateUniqueCharacterName } from '@/lib/utils';

export async function generateCharacterField(
  input: GenerateCharacterFieldInput
) {
  return generateCharacterFieldFlow(input);
}

const instructionMap: Record<string, string> = {
    // 'name' is now handled locally
    'traits': 'Generate exactly three interesting character traits, separated by commas.',
    'backstory': 'Generate a concise but intriguing backstory. It must be exactly 4 sentences long.',
    'sex': 'Generate a sex for the character. Respond with only "Male" or "Female".',
    'age': 'Generate an age group for the character. Respond with only one of: "Young", "Teenager", "Adult", or "Old".',
    'hairColour': 'Generate a hair colour for the character. Respond with only one of: "Red", "White", "Blonde", "Brown", "Silver", or "Black".',
    'eyeColour': 'Generate an eye colour for the character. Respond with only one of: "Blue", "Green", "Brown", "Hazel", "Grey", or "Amber".',
    'accessories': 'Generate a single, interesting accessory for the character (e.g., "a silver locket", "worn leather gloves", "a single feather earring"). Respond with only the accessory name. Can be "None".'
};


const generateCharacterFieldFlow = ai.defineFlow(
  {
    name: 'generateCharacterFieldFlow',
    inputSchema: GenerateCharacterFieldInputSchema,
    outputSchema: GenerateCharacterFieldOutputSchema,
  },
  async input => {
    try {
      // Handle name generation locally
      if (input.field === 'name') {
          const sex = input.context?.sex as 'Male' | 'Female' | undefined;
          const existingNames = input.context?.existingNames || [];
          const name = generateUniqueCharacterName(sex, existingNames);
          return { value: name };
      }

      const instruction = instructionMap[input.field];
      if (!instruction) {
          throw new Error(`Invalid field provided: ${input.field}`);
      }

      const contextPrompt = [
        `You are a creative assistant for a ${input.context?.genre || 'fantasy'} storytelling app, intended for a '${input.context?.ageRating || 'any age'}' audience.`,
        `Your task is to: ${instruction}`,
        'Use the following existing character details as context:',
        input.context?.name && `Name: ${input.context.name}.`,
        input.context?.traits && `Traits: ${input.context.traits}.`,
        input.context?.backstory && `Backstory: ${input.context.backstory}.`,
        input.context?.sex && `Sex: ${input.context.sex}.`,
        input.context?.age && `Age: ${input.context.age}.`,
        input.context?.hairColour && `Hair Colour: ${input.context.hairColour}.`,
        input.context?.eyeColour && `Eye Colour: ${input.context.eyeColour}.`,
        input.context?.accessories && `Accessories: ${input.context.accessories}.`,
        input.context?.existingNames?.length && `The following names are already in use, so you MUST NOT use them or any close variations: ${input.context.existingNames.join(', ')}.`,
        `Respond with only the generated value for the '${input.field}' field. Do not include any other text or formatting.`
      ].filter(Boolean).join('\n');


      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
        prompt: contextPrompt,
        config: { temperature: 1.0 }
      });
      
      const generatedText = response.text;

      if (!generatedText) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return { value: generatedText.trim() };

    } catch (e) {
      console.error("Error in generateCharacterFieldFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
          throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateCharacterFieldFlow failed: ${errorMessage}`);
    }
  }
);
