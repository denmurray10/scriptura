
'use server';

/**
 * @fileOverview A flow for generating a list of character accessories.
 * - generateCharacterAccessories - A function that generates a list of 9 accessories.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterAccessoriesInputSchema,
  type GenerateCharacterAccessoriesInput,
  GenerateCharacterAccessoriesOutputSchema,
  type GenerateCharacterAccessoriesOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterAccessories(
  input: GenerateCharacterAccessoriesInput
): Promise<GenerateCharacterAccessoriesOutput> {
  return generateCharacterAccessoriesFlow(input);
}

const generateCharacterAccessoriesFlow = ai.defineFlow(
  {
    name: 'generateCharacterAccessoriesFlow',
    inputSchema: GenerateCharacterAccessoriesInputSchema,
    outputSchema: GenerateCharacterAccessoriesOutputSchema,
  },
  async input => {
    try {
        const prompt = [
            `You are a creative assistant for a ${input.genre} storytelling app, intended for a '${input.ageRating}' audience.`,
            `Generate exactly 9 diverse and interesting accessories suitable for a character in this setting. The accessories should be simple and common.`,
            `CRUCIAL: One of the 9 suggestions MUST be the string "None".`,
            `Return the accessories as a single string, with each accessory separated by a comma.`
        ];

        if (input.name) prompt.push(`The character's name is ${input.name}.`);
        if (input.traits) prompt.push(`Their traits are: ${input.traits}.`);
        if (input.backstory) prompt.push(`Their backstory is: ${input.backstory}.`);

        const response = await ai.generate({
            model: 'googleai/gemini-flash-latest',
            prompt: prompt.join('\n'),
        });

        const rawText = response.text;

        if (!rawText) {
            throw new Error('The AI returned an empty or invalid output.');
        }

        const accessories = rawText.split(',').map(item => item.trim()).filter(Boolean);

        if (accessories.length !== 9) {
            console.warn(`AI generated ${accessories.length} accessories instead of 9. Raw: "${rawText}"`);
            // Attempt to pad or truncate to meet the schema requirement.
            while (accessories.length < 9) accessories.push("None");
            while (accessories.length > 9) accessories.pop();
        }
        
        return { accessories };

    } catch (e) {
        console.error("Error in generateCharacterAccessoriesFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterAccessoriesFlow failed: ${errorMessage}`);
    }
  }
);
