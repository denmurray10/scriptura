
'use server';

/**
 * @fileOverview A flow for generating a scene prompt.
 *
 * - generateScenePrompt - A function that generates a descriptive prompt for a scene.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateScenePromptInputSchema,
  type GenerateScenePromptInput,
  GenerateScenePromptOutputSchema,
  type GenerateScenePromptOutput,
} from '@/lib/ai-schemas';

export async function generateScenePrompt(
  input: GenerateScenePromptInput
): Promise<GenerateScenePromptOutput> {
  return generateScenePromptFlow(input);
}

const generateScenePromptFlow = ai.defineFlow(
  {
    name: 'generateScenePromptFlow',
    inputSchema: GenerateScenePromptInputSchema,
    outputSchema: GenerateScenePromptOutputSchema,
  },
  async (input) => {
    try {
      const prompt = [
        `You are a creative assistant for a ${input.genre || 'fantasy'} storytelling app. Your task is to generate a vivid and descriptive prompt for a scene.`,
        `The prompt should be suitable for an AI image generator to create a compelling background visual. Be descriptive and evocative.`,
        `For example, if the name is "The Whispering Caverns", a good prompt would be "A vast, glowing cavern with bioluminescent fungi casting an ethereal blue light on ancient, carved stone pillars and a still, underground lake."`,
        `Respond with only the generated prompt. Do not include any other text or formatting.`
      ];
      
      if (input.name) {
        prompt.splice(2, 0, `Use the scene's name as context: "${input.name}".`);
      }


      const response = await ai.generate({
        model: 'googleai/gemini-flash-latest',
        prompt: prompt.join('\n')
      });
      
      const generatedText = response.text;

      if (!generatedText) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return { prompt: generatedText.trim() };
    } catch (e) {
      console.error("Error in generateScenePromptFlow:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during AI processing.";
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
          throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`AI call in generateScenePromptFlow failed: ${errorMessage}`);
    }
  }
);
