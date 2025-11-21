
'use server';

import {ai} from '@/ai/genkit';
import { fantasySceneLocations } from '@/lib/config';
import { 
    GenerateSceneNameInputSchema, 
    type GenerateSceneNameInput, 
    GenerateSceneNameOutputSchema, 
    type GenerateSceneNameOutput 
} from '@/lib/ai-schemas';


export async function generateSceneNameAction(
  input: GenerateSceneNameInput
): Promise<GenerateSceneNameOutput> {
    try {
        // For a simple name, we can use a predefined list to avoid unnecessary LLM calls
        // This is faster, cheaper, and often provides good enough results.
        const availableNames = fantasySceneLocations.filter(
            name => !(input.existingSceneNames || []).includes(name)
        );
        
        if (availableNames.length === 0) {
            // Fallback to LLM if all predefined names are used
            return await generateSceneNameFlow(input);
        }

        const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
        
        return { name: randomName };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error in generateSceneNameAction:", errorMessage);
        throw new Error(`Failed to generate scene name. ${errorMessage}`);
    }
}

// LLM-based fallback flow
const generateSceneNameFlow = ai.defineFlow(
  {
    name: 'generateSceneNameFlow',
    inputSchema: GenerateSceneNameInputSchema,
    outputSchema: GenerateSceneNameOutputSchema,
  },
  async ({ genre, existingSceneNames }) => {
    const prompt = `You are a creative world-builder for a ${genre} storytelling app. Generate one unique, interesting, and compelling location name. Do not repeat any of the following existing names: ${existingSceneNames?.join(', ') || 'None'}. Respond with only the name.`;

    const response = await ai.generate({
      model: 'googleai/gemini-flash-latest',
      prompt,
      config: { temperature: 1.0 },
    });

    const name = response.text.trim();
    if (!name) {
      throw new Error('The AI returned an empty name.');
    }
    
    return { name };
  }
);
