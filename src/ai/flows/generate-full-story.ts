

'use server';

/**
 * @fileOverview A flow to generate a complete story from a single genre input.
 * This flow orchestrates multiple AI calls to create a title, plot, characters, scenes, and a cover.
 *
 * - generateFullStory - The main exported function to generate a story.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  GenerateFullStoryInputSchema,
  GenerateFullStoryOutputSchema,
  type GenerateFullStoryOutput,
  type GenerateFullStoryInput,
} from '@/lib/ai-schemas';
import {
  generateCharacterDetails,
} from '@/ai/flows/generate-character-details';
import {
  generateCharacterImages,
} from '@/ai/flows/generate-character-images';
import {
  generateScenarioVisual,
} from '@/ai/flows/generate-scenario-visual';
import { storyStyles } from '@/lib/config';
import type { Character, Scene } from '@/types';
import { generateUniqueCharacterName } from '@/lib/utils';
import { generateTwoScenesFromPlot } from './generate-two-scenes-from-plot';
import { generateStoryCover } from './generate-story-cover';

export async function generateFullStory(input: GenerateFullStoryInput): Promise<GenerateFullStoryOutput> {
  return generateFullStoryFlow(input);
}

// Sub-flow prompts defined internally for co-location

const titleAndPlotPrompt = ai.definePrompt({
  name: 'generateTitleAndPlotPrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: z.object({ genre: z.string() }) },
  output: {
    schema: z.object({
      title: z.string().describe('A highly compelling, original, and unique story title.'),
      plot: z.string().describe("An in-depth opening plot, approximately 3 paragraphs and up to 500 words long. It must introduce a central conflict, a mysterious element, and a personal stake for a potential protagonist, without using any character names or specifying gender. Use gender-neutral pronouns like 'they' or role descriptions like 'a detective'."),
    }),
  },
  prompt: `You are an expert storyteller. For the genre "{{genre}}", generate a highly compelling and unique story title and an in-depth opening plot. The plot must be approximately 3 paragraphs long, up to 500 words. It should establish a clear setting, introduce a core conflict or mystery, and hint at the stakes for a protagonist. CRUCIAL: Do not use any character names or specify a gender (e.g., use 'a lone traveler', 'a young scientist', 'they' instead of 'he' or 'she'). Avoid clichés.`,
});

const characterDetailsFromPlotPrompt = ai.definePrompt({
  name: 'generateCharacterDetailsFromPlotPrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: z.object({ plot: z.string(), genre: z.string(), name: z.string() }) },
  output: {
    schema: z.object({
      sex: z.enum(['Male', 'Female']),
      age: z.enum(['Young', 'Teenager', 'Adult', 'Old']),
      traits: z.string().describe('Three interesting traits, separated by commas, that fit the character implied by the plot.'),
      backstory: z.string().describe('A concise backstory that connects directly to the events or circumstances described in the plot.'),
      hairColour: z.enum(['Red', 'White', 'Blonde', 'Brown', 'Silver', 'Black']),
      eyeColour: z.enum(['Blue', 'Green', 'Brown', 'Hazel', 'Grey', 'Amber']),
    }),
  },
  prompt: `Analyze the following plot for a {{genre}} story and generate the details for the main character, who is named **{{name}}**.
  
  Plot: "{{plot}}"

  Your task is to:
  1. Read the plot carefully.
  2. Generate all other character details (sex, age, traits, backstory, etc.) that are strongly implied by or complementary to the plot and the provided character name. The backstory must be directly related to the plot.
  `,
});


// The main orchestration flow
const generateFullStoryFlow = ai.defineFlow(
  {
    name: 'generateFullStoryFlow',
    inputSchema: GenerateFullStoryInputSchema,
    outputSchema: GenerateFullStoryOutputSchema,
  },
  async ({ genre }) => {
    try {
        // For this auto-generation, we'll fix the style and age rating for consistency.
        const style = 'photo'; 
        const ageRating = '14+';
        const selectedStyle = storyStyles.find(s => s.value === style)!;

        // Step 1: Generate Title and Plot
        const { output: titleAndPlot } = await titleAndPlotPrompt({ genre });
        if (!titleAndPlot) throw new Error('Failed to generate title and plot.');
        
        const { title, plot } = titleAndPlot;

        // Step 2: Generate Cover Image (New Step!)
        const coverImage = await generateStoryCover({
            title,
            plot,
            genre,
            stylePrompt: selectedStyle.characterPromptModifier,
        });
        if (!coverImage || !coverImage.coverUrl) throw new Error('Failed to generate story cover.');
        
        // Step 3: Generate All Characters (Main + 2 Companions)
        
        // Main Character (from plot)
        const mainCharName = generateUniqueCharacterName(undefined, []);
        const { output: mainCharDetailsPartial } = await characterDetailsFromPlotPrompt({ plot, genre, name: mainCharName });
        if (!mainCharDetailsPartial) throw new Error('Failed to generate main character details.');
        const mainCharDetails = { name: mainCharName, ...mainCharDetailsPartial };

        const mainCharImages = await generateCharacterImages({
          ...mainCharDetails, stylePrompt: selectedStyle.characterPromptModifier, genre
        });
        if (!mainCharImages) throw new Error('Failed to generate main character images.');
        let mainCharacter: Character = {
            id: crypto.randomUUID(), ...mainCharDetails, isPlayable: true,
            profileImageUrl: mainCharImages.profileImage.url,
            inGameImageUrl: mainCharImages.inGameImage.url,
            health: 100, money: 10, happiness: 75, items: [], skills: [], relationships: [],
            level: 1, xp: 0, stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 }, unspentStatPoints: 0, currentScenario: null,
        };

        // Companion 1
        const companion1Details = await generateCharacterDetails({ genre, ageRating, existingNames: [mainCharacter.name] });
        const companion1Images = await generateCharacterImages({
            ...companion1Details, stylePrompt: selectedStyle.characterPromptModifier, genre
        });
        if (!companion1Images) throw new Error('Failed to generate companion 1 images.');
        let companion1: Character = {
            id: crypto.randomUUID(), ...companion1Details, isPlayable: false,
            profileImageUrl: companion1Images.profileImage.url,
            inGameImageUrl: companion1Images.inGameImage.url,
            health: 100, money: 10, happiness: 75, items: [], skills: [], relationships: [],
            level: 1, xp: 0, stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 }, unspentStatPoints: 0, currentScenario: null,
        };
        
        // Companion 2
        const companion2Details = await generateCharacterDetails({ genre, ageRating, existingNames: [mainCharacter.name, companion1.name] });
        const companion2Images = await generateCharacterImages({
            ...companion2Details, stylePrompt: selectedStyle.characterPromptModifier, genre
        });
        if (!companion2Images) throw new Error('Failed to generate companion 2 images.');
        let companion2: Character = {
            id: crypto.randomUUID(), ...companion2Details, isPlayable: false,
            profileImageUrl: companion2Images.profileImage.url,
            inGameImageUrl: companion2Images.inGameImage.url,
            health: 100, money: 10, happiness: 75, items: [], skills: [], relationships: [],
            level: 1, xp: 0, stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 }, unspentStatPoints: 0, currentScenario: null,
        };
        
        // Initialize relationships
        mainCharacter.relationships = [{ targetCharacterId: companion1.id, value: 0 }, { targetCharacterId: companion2.id, value: 0 }];
        companion1.relationships = [{ targetCharacterId: mainCharacter.id, value: 0 }, { targetCharacterId: companion2.id, value: 0 }];
        companion2.relationships = [{ targetCharacterId: mainCharacter.id, value: 0 }, { targetCharacterId: companion1.id, value: 0 }];

        const characters = [mainCharacter, companion1, companion2];

        // Step 4: Generate Scenes (Details + Visuals)
        const sceneDetails = await generateTwoScenesFromPlot({ plot, genre });
        if (!sceneDetails) throw new Error('Failed to generate scenes.');

        const [scene1Visual, scene2Visual] = await Promise.all([
            generateScenarioVisual({ scenarioDescription: `${selectedStyle.scenePromptModifier}, ${sceneDetails.scene1.prompt}` }),
            generateScenarioVisual({ scenarioDescription: `${selectedStyle.scenePromptModifier}, ${sceneDetails.scene2.prompt}` })
        ]);

        if (!scene1Visual || !scene2Visual) throw new Error('Failed to generate scene visuals.');

        const scenes: Scene[] = [
            {
                id: crypto.randomUUID(),
                name: sceneDetails.scene1.name,
                prompt: sceneDetails.scene1.prompt,
                url: scene1Visual.url,
                style,
                x: Math.round(Math.random() * 90 + 5),
                y: Math.round(Math.random() * 90 + 5),
            },
            {
                id: crypto.randomUUID(),
                name: sceneDetails.scene2.name,
                prompt: sceneDetails.scene2.prompt,
                url: scene2Visual.url,
                style,
                x: Math.round(Math.random() * 90 + 5),
                y: Math.round(Math.random() * 90 + 5),
            },
        ];

        // Assemble the final story data package
        const result: GenerateFullStoryOutput = {
          storyData: {
            name: title,
            plot: plot,
            genre,
            ageRating,
            style,
            imageUrl: coverImage.coverUrl,
            coverType: 'image',
          },
          characters,
          scenes,
        };

        return result;
    } catch (e) {
        console.error("Error in generateFullStoryFlow:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
        if (errorMessage.includes("429") || /rate limit/i.test(errorMessage)) {
            throw new Error("AI Rate Limit Exceeded. You've made too many requests in a short time. Please wait a minute and try again.");
        }
        throw new Error(`AI call in generateFullStoryFlow failed: ${errorMessage}`);
    }
  }
);
