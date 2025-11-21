
'use server';

/**
 * @fileOverview A flow for generating random character details.
 *
 * - generateCharacterDetails - A function that generates character details.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCharacterDetailsInputSchema,
  type GenerateCharacterDetailsInput,
  GenerateCharacterDetailsOutputSchema,
  type GenerateCharacterDetailsOutput,
} from '@/lib/ai-schemas';
import { generateUniqueCharacterName } from '@/lib/utils';
import { z } from 'genkit';


// New input schema for the prompt which now includes the pre-generated name
const CharacterDetailsPromptInputSchema = GenerateCharacterDetailsInputSchema.extend({
    name: z.string(),
});

// Define the prompt without an output schema, so it just returns text.
const textPrompt = ai.definePrompt({
  name: 'generateCharacterDetailsTextPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: CharacterDetailsPromptInputSchema},
  // NO output schema here
  prompt: `You are a creative assistant for a {{genre}} storytelling app, intended for a '{{ageRating}}' audience.
Your task is to generate the details for a compelling character named **{{name}}**.
{{#if sex}}The character MUST be {{sex}}.{{/if}}

CRUCIAL: You must generate a value for each of the following 6 fields, in this exact order, separated by a pipe character ('|'):
1. Traits (three interesting traits, separated by commas)
2. Backstory (an intriguing backstory, exactly 4 sentences long, consistent with the character's sex of '{{sex}}')
3. Sex (one of: Male, Female)
4. Age (one of: Young, Teenager, Adult, Old)
5. Hair Colour (one of: Red, White, Blonde, Brown, Silver, Black)
6. Eye Colour (one of: Blue, Green, Brown, Hazel, Grey, Amber)

Example Response Format for a character named Aethelred:
Brave, Cynical, Loyal|A former knight exiled for a crime he didn't commit. He now wanders the land as a mercenary, taking on dangerous jobs for coin. He secretly seeks evidence to clear his name and expose the conspiracy that led to his downfall. He carries the sigil of his old order, hidden beneath his cloak.|Male|Adult|Silver|Blue

Now, generate the details for **{{name}}** based on the request.
`,
});

export async function generateCharacterDetails(
  input: GenerateCharacterDetailsInput
): Promise<GenerateCharacterDetailsOutput> {
  return generateCharacterDetailsFlow(input);
}

const generateCharacterDetailsFlow = ai.defineFlow(
  {
    name: 'generateCharacterDetailsFlow',
    inputSchema: GenerateCharacterDetailsInputSchema,
    outputSchema: GenerateCharacterDetailsOutputSchema,
  },
  async input => {
    try {
        const name = generateUniqueCharacterName(input.sex, input.existingNames || []);
        
        const {text} = await textPrompt({ ...input, name }, { config: { temperature: 1.0 } });
        
        if (!text) {
            throw new Error('The AI returned an empty or invalid output.');
        }

        const parts = text.split('|').map(p => p.trim());
        if (parts.length !== 6) {
            throw new Error(`AI returned an improperly formatted string. Expected 6 parts, got ${parts.length}. Raw: "${text}"`);
        }
        
        const [traits, backstory, sex, age, hairColour, eyeColour] = parts;
        
        const result: GenerateCharacterDetailsOutput = {
            name, // Use the locally generated name
            traits,
            backstory,
            sex: sex as 'Male' | 'Female',
            age: age as 'Young' | 'Teenager' | 'Adult' | 'Old',
            hairColour: hairColour as 'Red' | 'White' | 'Blonde' | 'Brown' | 'Silver' | 'Black',
            eyeColour: eyeColour as 'Blue' | 'Green' | 'Brown' | 'Hazel' | 'Grey' | 'Amber',
        };

        // Validate the parsed data against the Zod schema. This is a crucial step.
        const parsedResult = GenerateCharacterDetailsOutputSchema.parse(result);
        
        return parsedResult;

    } catch (e) {
        console.error("Error in generateCharacterDetailsFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateCharacterDetailsFlow failed: ${errorMessage}`);
    }
  }
);
