
'use server';

import {ai} from '@/ai/genkit';
import {
    GenerateStoryTeaserInputSchema,
    type GenerateStoryTeaserInput,
    GenerateStoryTeaserOutputSchema,
    type GenerateStoryTeaserOutput,
} from '@/lib/ai-schemas';


export async function generateStoryTeaser(input: GenerateStoryTeaserInput): Promise<GenerateStoryTeaserOutput> {
  return generateStoryTeaserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryTeaserPrompt',
  model: 'googleai/gemini-flash-latest',
  input: {schema: GenerateStoryTeaserInputSchema},
  output: {schema: GenerateStoryTeaserOutputSchema},
  prompt: `You are a marketing copywriter for a book publisher. Your task is to write a compelling, 2-sentence teaser for a new story. This teaser will be displayed on the book's detail page to entice readers.

  Story Details:
  - Title: "{{title}}"
  - Genre: "{{genre}}"
  - Plot: "{{plot}}"

  Based on these details, write a dramatic and exciting 2-sentence teaser. The teaser should capture the essence of the plot and make someone want to read the story immediately.
  `,
});

const generateStoryTeaserFlow = ai.defineFlow(
  {
    name: 'generateStoryTeaserFlow',
    inputSchema: GenerateStoryTeaserInputSchema,
    outputSchema: GenerateStoryTeaserOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid output.');
      }
      return output;
    } catch (e) {
      console.error("Error in generateStoryTeaserFlow:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      throw new Error(`AI call in generateStoryTeaserFlow failed: ${errorMessage}`);
    }
  }
);
