

'use server';

/**
 * @fileOverview Character image generation flow using getimg.ai.
 *
 * - generateCharacterImages - A function that generates a character profile image (headshot) and an in-game image (full body).
 */

import {
  GenerateCharacterImagesInputSchema,
  type GenerateCharacterImagesInput,
} from '@/lib/ai-schemas';
import { generateImageWithGetImg } from '@/lib/getimg';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCharacterImagesFlowOutputSchema = z.object({
  profileImageUrl: z.string().describe("The data URI for the character's profile image."),
  inGameImageUrl: z.string().describe("The data URI for the character's in-game, full-body image."),
});
export type GenerateCharacterImagesFlowOutput = z.infer<typeof GenerateCharacterImagesFlowOutputSchema>;

export async function generateCharacterImages(input: GenerateCharacterImagesInput): Promise<GenerateCharacterImagesFlowOutput> {
  return generateCharacterImagesFlow(input);
}


async function generateImage(promptText: string, width: number, height: number): Promise<string> {
    const apiKey = process.env.GETIMG_API_KEY;
    if (!apiKey) {
        throw new Error('The GETIMG_API_KEY is missing from your environment. Please add it to the .env file.');
    }
    return generateImageWithGetImg(promptText, apiKey, width, height);
}


const generateCharacterImagesFlow = ai.defineFlow(
  {
    name: 'generateCharacterImagesFlow',
    inputSchema: GenerateCharacterImagesInputSchema,
    outputSchema: GenerateCharacterImagesFlowOutputSchema,
  },
  async input => {
    try {
        const baseDescription = `A ${input.age}, ${input.sex} ${input.genre} character named ${input.name}. Style: ${input.stylePrompt}.`;

        const prompts = {
          profileImage: `Photorealistic character portrait, 8k, ultra-detailed, cinematic shot of ${baseDescription}.
            Hair: ${input.hairColour} color.
            Eyes: ${input.eyeColour} color.
            Expression should reflect their traits: ${input.traits}.
            ${input.accessories && input.accessories.toLowerCase() !== 'none' ? `The character is wearing or holding: ${input.accessories}.` : ''}

            **Detailed Facial Features (AI must select from these options):**
            - **Facial Structure:** Choose one: Square jaw, pointed chin, rounded chin, high forehead, sloped forehead.
            - **Skin Details:** Choose one or two: Smooth skin, freckled skin, weathered skin, subtle wrinkles, faint acne scars.
            - **Expression Nuances:** Choose one: A faint smirk, a furrowed brow, wide-eyed, an asymmetrical smile, neutral but intense gaze.
            
            The background must be a plain, neutral, non-distracting color. 85mm lens, f/1.8 aperture.`,
            
          inGameImage: `A high-quality, detailed full-body portrait of ${baseDescription}. The character has ${input.hairColour} hair and ${input.eyeColour} eyes. The character should be standing, facing forward. ${input.accessories && input.accessories.toLowerCase() !== 'none' ? `They have these accessories: ${input.accessories}.` : ''} The background should be a solid, plain white, suitable for easy removal or use as a cutout sprite.`
        };
        
        const [
            profileImageDataUri,
            inGameImageDataUri,
        ] = await Promise.all([
            generateImage(prompts.profileImage, 512, 768),
            generateImage(prompts.inGameImage, 512, 768),
        ]);

        return {
            profileImageUrl: profileImageDataUri,
            inGameImageUrl: inGameImageDataUri,
        };

    } catch (e) {
      console.error("Error in generateCharacterImagesFlow:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
          throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
      }
      throw new Error(`Image generation in generateCharacterImages failed: ${errorMessage}`);
    }
  }
);
