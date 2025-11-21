
'use server';

/**
 * @fileOverview A flow for generating a list of character traits.
 *
 * - generateCharacterTraits - A function that generates a list of 9 traits.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterTraitsInputSchema,
  type GenerateCharacterTraitsInput,
  GenerateCharacterTraitsOutputSchema,
  type GenerateCharacterTraitsOutput,
} from '@/lib/ai-schemas';

export async function generateCharacterTraits(
  input: GenerateCharacterTraitsInput
): Promise<GenerateCharacterTraitsOutput> {
  return generateCharacterTraitsFlow(input);
}


const generateCharacterTraitsFlow = ai.defineFlow(
  {
    name: 'generateCharacterTraitsFlow',
    inputSchema: GenerateCharacterTraitsInputSchema,
    outputSchema: GenerateCharacterTraitsOutputSchema,
  },
  async input => {
    try {
        const prompt = [
            `You are a creative assistant for a ${input.genre} storytelling app, intended for a '${input.ageRating}' audience.`,
            `Generate exactly 9 diverse and interesting character traits suitable for a character in this setting.`,
            `Provide a mix of positive, negative, and neutral traits. Keep each trait to one or two words.`,
            `Examples: "Brave", "Cynical", "Quick-witted", "Clumsy", "Loyal", "Greedy".`,
            `Return the traits as a single string, with each trait separated by a comma.`
        ];

        if (input.name) prompt.push(`The character's name is ${input.name}.`);
        
        const response = await ai.generate({
            model: 'googleai/gemini-flash-latest',
            prompt: prompt.join('\n'),
        });

        const rawText = response.text;
        
        if (!rawText) {
            throw new Error('The AI returned an empty or invalid output.');
        }

        const traits = rawText.split(',').map(item => item.trim()).filter(Boolean);
        
        if (traits.length !== 9) {
            console.warn(`AI generated ${traits.length} traits instead of 9. Raw: "${rawText}"`);
            // Attempt to pad or truncate to meet the schema requirement.
            while (traits.length < 9) traits.push("Adaptable");
            while (traits.length > 9) traits.pop();
        }

        return { traits };
    } catch (e) {
        console.error("Error in generateCharacterTraitsFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterTraitsFlow failed: ${errorMessage}`);
    }
  }
);
