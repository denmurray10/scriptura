
'use server';

/**
 * @fileOverview A flow to generate two scene details from a story plot.
 * - generateTwoScenesFromPlot - The main exported function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateTwoScenesFromPlotInputSchema,
  type GenerateTwoScenesFromPlotInput,
  GenerateTwoScenesFromPlotOutputSchema,
  type GenerateTwoScenesFromPlotOutput,
} from '@/lib/ai-schemas';

const prompt = ai.definePrompt({
    name: 'generateTwoScenesFromPlotPrompt',
    model: 'googleai/gemini-flash-latest',
    input: { schema: GenerateTwoScenesFromPlotInputSchema },
    output: { schema: GenerateTwoScenesFromPlotOutputSchema },
    prompt: `Based on the following plot for a {{genre}} story, define two distinct but closely related key scenes (locations). For each scene, provide a name and a detailed prompt for an AI image generator.
  
    Plot: "{{plot}}"
  
    CRUCIAL: The image generation prompt MUST NOT include any people, characters, or figures. It should only describe the environment and atmosphere.

    The scenes should represent important places where the story might begin or progress to. For example, if the plot is about a stolen artifact from a royal vault, Scene 1 could be "The Royal Vault" and Scene 2 could be "The Black Market". Your response should reflect the user's example: if the main character is a teenager and the story is a sports story about basketball, the scenes could be a basketball court and a school.`,
});


export async function generateTwoScenesFromPlot(input: GenerateTwoScenesFromPlotInput): Promise<GenerateTwoScenesFromPlotOutput> {
  return generateTwoScenesFromPlotFlow(input);
}

const generateTwoScenesFromPlotFlow = ai.defineFlow(
  {
    name: 'generateTwoScenesFromPlotFlow',
    inputSchema: GenerateTwoScenesFromPlotInputSchema,
    outputSchema: GenerateTwoScenesFromPlotOutputSchema,
  },
  async (input) => {
    try {
        const { output } = await prompt(input);
        if (!output) throw new Error('Failed to generate scenes.');
        return output;
    } catch (e) {
        console.error("Error in generateTwoScenesFromPlotFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        throw new Error(`AI call in generateTwoScenesFromPlotFlow failed: ${errorMessage}`);
    }
  }
);
