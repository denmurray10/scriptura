

'use server';

import { analyzeChoiceEffects } from "@/ai/flows/analyze-choice-effects";
import { generateCharacterDetails } from "@/ai/flows/generate-character-details";
import { generateCharacterField } from "@/ai/flows/generate-character-field";
import { generateStorySuggestions } from "@/ai/flows/generate-story-suggestions";
import type { Character, Scene, Story, Objective } from "@/types";
import { generateScenePrompt } from "@/ai/flows/generate-scene-prompt";
import { generateCharacterImages } from '@/ai/flows/generate-character-images';
import { generateCharacterTraits } from '@/ai/flows/generate-character-traits';
import { generateStoryCover } from '@/ai/flows/generate-story-cover';
import { generateStoryField } from '@/ai/flows/generate-story-field';
import { generateScenarioVisual } from '@/ai/flows/generate-scenario-visual';
import { generateNewSceneDetails } from "@/ai/flows/generate-new-scene-details";
import { generateFullStory } from "@/ai/flows/generate-full-story";
import { storyStyles } from "./config";
import { compressImage, getBase64Size } from "./utils";
import type {
    GenerateCharacterDetailsInput,
    GenerateCharacterDetailsOutput,
    GenerateCharacterImagesInput,
    GenerateCharacterImagesOutput,
    GenerateCharacterFieldInput,
    GenerateScenePromptInput,
    GenerateCharacterTraitsInput,
    GenerateStoryCoverInput,
    GenerateStoryCoverOutput,
    GenerateStoryFieldInput,
    GenerateScenarioVisualInput,
    GenerateScenarioVisualOutput,
    GenerateNewSceneDetailsInput,
    GenerateNewSceneDetailsOutput,
    GenerateFullStoryInput,
    GenerateTwoScenesFromPlotInput,
    GenerateChapterSummaryInput,
    GenerateChapterSummaryOutput,
    GenerateCharacterQuoteInput,
    GenerateCharacterQuoteOutput,
    AnalyzeChoiceEffectsInput,
    NarratorTurnOutput,
    GenerateCharacterThoughtInput,
    GenerateCharacterThoughtOutput,
    GenerateSceneNameInput,
    GenerateSceneNameOutput,
    GenerateCharacterPersonalityQuoteInput,
    GenerateCharacterPersonalityQuoteOutput,
    GenerateCharacterResponseInput,
    GenerateCharacterResponseOutput,
    GenerateConversationStartersInput,
    GenerateConversationStartersOutput,
    RemoveImageBackgroundInput,
    RemoveImageBackgroundOutput,
    GenerateAudioTeaserInput,
    GenerateAudioTeaserOutput,
    GenerateStoryTeaserInput,
    GenerateStoryTeaserOutput,
    GenerateStoryMapInput,
    GenerateStoryMapOutput,
    GenerateObjectiveHelpInput,
    GenerateObjectiveHelpOutput,
    AnalyzeCharacterCompatibilityInput,
    AnalyzeCharacterCompatibilityOutput,
    GenerateCharacterAccessoriesInput,
    GenerateCharacterAccessoriesOutput,
    GenerateSpeechInput,
    GenerateSpeechOutput,
    HandleHagglingTurnInput,
    HandleHagglingTurnOutput,
    HandleLiarsDiceTurnInput,
    HandleLiarsDiceTurnOutput,
    GenerateLiarsDiceHintInput,
    GenerateLiarsDiceHintOutput
} from './ai-schemas';
import { generateTwoScenesFromPlot } from "@/ai/flows/generate-two-scenes-from-plot";
import { generateChapterSummary } from "@/ai/flows/generate-chapter-summary";
import { generateCharacterQuote } from "@/ai/flows/generate-character-quote";
import { generateCharacterPersonalityQuote } from "@/ai/flows/generate-character-personality-quote";
import { generateNarratorTurn } from "@/ai/flows/generate-narrator-turn";
import { generateCharacterThought } from "@/ai/flows/generate-character-thought";
import { generateSceneNameAction as generateSceneName } from "@/ai/flows/generate-scene-name";
import { generateCharacterResponse } from "@/ai/flows/generate-character-response";
import { generateConversationStarters } from "@/ai/flows/generate-conversation-starters";
import { removeImageBackground } from "@/ai/flows/remove-image-background";
import { generateAudioTeaser } from "@/ai/flows/generate-audio-teaser";
import { generateStoryTeaser } from "@/ai/flows/generate-story-teaser";
import { generateImageFromText } from "@/ai/flows/generate-image-from-text";
import { generateStoryMap } from "@/ai/flows/generate-story-map";
import { generateObjectiveHelp } from "@/ai/flows/generate-objective-help";
import { analyzeCharacterCompatibility } from "@/ai/flows/analyze-character-compatibility";
import { generateCharacterAccessories } from "@/ai/flows/generate-character-accessories";
import { generateSpeech } from "@/ai/flows/generate-speech";
import { handleHagglingTurn } from "@/ai/flows/handle-haggling-turn";
import { handleLiarsDiceTurn } from "@/ai/flows/handle-liars-dice-turn";
import { generateLiarsDiceHint } from "@/ai/flows/generate-liars-dice-hint";

export async function generateCharacterDetailsAction(
  input: GenerateCharacterDetailsInput
): Promise<GenerateCharacterDetailsOutput> {
  try {
    const details = await generateCharacterDetails(input);
    return details;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("AI Character Details generation failed:", errorMessage);
    throw new Error(`Failed to generate character details with AI. ${errorMessage}`);
  }
}

export async function generateCharacterImagesAction(
  params: GenerateCharacterImagesInput
): Promise<GenerateCharacterImagesOutput> {
  try {
    const rawResult = await generateCharacterImages(params);
    
    const [
      compressedProfile,
      compressedInGame,
    ] = await Promise.all([
      compressImage(rawResult.profileImageUrl, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
      compressImage(rawResult.inGameImageUrl, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
    ]);

    const result: GenerateCharacterImagesOutput = {
      profileImage: {
        url: compressedProfile,
        originalSize: getBase64Size(rawResult.profileImageUrl),
        newSize: getBase64Size(compressedProfile),
      },
      inGameImage: {
        url: compressedInGame,
        originalSize: getBase64Size(rawResult.inGameImageUrl),
        newSize: getBase64Size(compressedInGame),
      },
    };
    
    return result;
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     console.error("generateCharacterImagesAction failed:", errorMessage);
     throw new Error(`Failed to generate character images. ${errorMessage}`);
  }
}

export async function createManualCharacterAction(params: {
  name: string;
  traits: string;
  backstory: string;
  sex: string;
  age: string;
  hairColour: string;
  eyeColour: string;
  isPlayable: boolean;
  profileImageUrl: string;
  inGameImageUrl: string;
  accessories?: string;
}): Promise<Character> {
  try {
    const defaultStats = {
      health: 100,
      money: 10,
      happiness: 75,
      items: [],
    };
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: params.name,
      traits: params.traits,
      backstory: params.backstory,
      sex: params.sex,
      age: params.age,
      hairColour: params.hairColour,
      eyeColour: params.eyeColour,
      isPlayable: params.isPlayable,
      profileImageUrl: params.profileImageUrl,
      inGameImageUrl: params.inGameImageUrl,
      accessories: params.accessories,
      ...defaultStats,
      skills: [],
      relationships: [],
      level: 1,
      xp: 0,
      stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 },
      unspentStatPoints: 0,
      defaultStats: { ...defaultStats },
      currentScenario: null,
    };
    return newCharacter;
  } catch (error) {
    console.error("Error in createManualCharacterAction:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during image processing.';
    throw new Error(`Failed to create character with uploaded images: ${errorMessage}`);
  }
}


interface AnalyzeChoiceParams {
  choice: string;
  character: Character;
  storyState: Story;
  objectives: Objective[];
  shouldCreateNewObjective: boolean;
}

export async function analyzeChoiceAction({
  choice,
  character,
  storyState,
  objectives,
  shouldCreateNewObjective,
}: AnalyzeChoiceParams) {
  try {
    const otherCharacters = storyState.characters
        .filter(c => c.id !== character.id)
        .map(c => {
            const relationship = (c.relationships || []).find(r => r.targetCharacterId === character.id);
            return { 
                id: c.id,
                name: c.name, 
                sex: c.sex,
                traits: c.traits, 
                isPlayable: c.isPlayable,
                relationshipWithActiveCharacter: relationship ? relationship.value : 0,
            };
        });

    const result = await analyzeChoiceEffects({
      choice,
      character: {
        name: character.name,
        sex: character.sex,
        traits: character.traits,
        backstory: character.backstory,
        health: character.health,
        money: character.money,
        happiness: character.happiness,
        items: character.items,
        skills: character.skills || [],
        relationships: character.relationships || [],
        stats: character.stats,
      },
      scenes: (storyState.scenes || []).map(s => ({ id: s.id, name: s.name })),
      otherCharacters,
      storyProgression: storyState.storyProgression,
      scenario: character.currentScenario?.description || "An unknown location.",
      locationName: storyState.locationName,
      genre: storyState.genre,
      ageRating: storyState.ageRating,
      language: storyState.language,
      timeOfDay: storyState.timeOfDay,
      style: storyState.style,
      objectives: objectives,
      shouldCreateNewObjective,
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("analyzeChoiceAction failed:", errorMessage);
    throw new Error(`Failed to analyze choice effects. ${errorMessage}`);
  }
}

export async function generateNarratorTurnAction(input: AnalyzeChoiceEffectsInput): Promise<NarratorTurnOutput> {
  try {
    const result = await generateNarratorTurn(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("generateNarratorTurnAction failed:", errorMessage);
    throw new Error(`Failed to generate narrator turn. ${errorMessage}`);
  }
}


export async function generateCharacterFieldAction(
  input: GenerateCharacterFieldInput
) {
  try {
    const result = await generateCharacterField(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Error generating character field '${input.field}':`, errorMessage);
    throw new Error(`Failed to generate value for ${input.field}. ${errorMessage}`);
  }
}

export async function generateStoryFieldAction(
  input: GenerateStoryFieldInput
) {
  try {
    const result = await generateStoryField(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Error generating story field '${input.field}':`, errorMessage);
    throw new Error(`Failed to generate value for ${input.field}. ${errorMessage}`);
  }
}

interface GenerateSuggestionsParams {
  character: Character;
  storyState: Story;
}

export async function generateStorySuggestionsAction({
  character,
  storyState,
}: GenerateSuggestionsParams) {
  try {
    const otherCharacters = storyState.characters
        .filter(c => c.id !== character.id)
        .map(c => ({ name: c.name }));

    const result = await generateStorySuggestions({
      character: {
        name: character.name,
        traits: character.traits,
        backstory: character.backstory,
        health: character.health,
        money: character.money,
        happiness: character.happiness,
        items: character.items,
        stats: character.stats,
      },
      otherCharacters,
      storyProgression: storyState.storyProgression,
      scenario: character.currentScenario?.description || 'An unknown location.',
      genre: storyState.genre,
      ageRating: storyState.ageRating,
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating story suggestions:', errorMessage);
    throw new Error(`Failed to generate story suggestions. ${errorMessage}`);
  }
}

export async function generateScenePromptAction(
  input: GenerateScenePromptInput
) {
  try {
    const result = await generateScenePrompt(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating scene prompt:', errorMessage);
    throw new Error(`Failed to generate scene prompt. ${errorMessage}`);
  }
}

export async function generateCharacterTraitsAction(
  input: GenerateCharacterTraitsInput
) {
  try {
    const result = await generateCharacterTraits(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating character traits:', errorMessage);
    throw new Error(`Failed to generate character traits. ${errorMessage}`);
  }
}

export async function generateStoryCoverAction(
  input: GenerateStoryCoverInput
): Promise<GenerateStoryCoverOutput> {
  try {
    const result = await generateStoryCover(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating story cover:', errorMessage);
    throw new Error(`Failed to generate story cover. ${errorMessage}`);
  }
}

export async function generateScenarioVisualAction(
  input: GenerateScenarioVisualInput
): Promise<GenerateScenarioVisualOutput> {
  try {
    const rawResult = await generateScenarioVisual(input);
    const originalSize = getBase64Size(rawResult.url);
    const compressedUrl = await compressImage(rawResult.url, { quality: 0.8, maxWidth: 1024, maxHeight: 1536 });
    const newSize = getBase64Size(compressedUrl);

    return {
      url: compressedUrl,
      originalSize,
      newSize,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating scenario visual:', errorMessage);
    throw new Error(`Failed to generate scenario visual. ${errorMessage}`);
  }
}

export async function generateNewSceneDetailsAction(
  input: GenerateNewSceneDetailsInput
): Promise<GenerateNewSceneDetailsOutput> {
  try {
    const result = await generateNewSceneDetails(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error generating new scene details:", errorMessage);
    throw new Error(`Failed to generate new scene details. ${errorMessage}`);
  }
}

export async function discoverAndAddSceneAction(
  input: GenerateNewSceneDetailsInput & { x: number; y: number }
): Promise<Omit<Scene, "id">> {
  try {
    const details = await generateNewSceneDetailsAction(input);

    const selectedStyle = storyStyles.find(s => s.value === input.style);
    if (!selectedStyle) {
      throw new Error(`Invalid style provided: ${input.style}`);
    }
    
    const fullPrompt = `${selectedStyle.scenePromptModifier}, ${details.prompt}`;
    const { url } = await generateScenarioVisualAction({ 
      scenarioDescription: fullPrompt,
    });
    
    const newSceneData: Omit<Scene, 'id'> = {
        name: details.name,
        prompt: details.prompt,
        url,
        style: input.style,
        x: input.x,
        y: input.y,
    };

    return newSceneData;

  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     console.error("discoverNewSceneAction failed:", errorMessage);
     throw new Error(`Failed to discover new scene. ${errorMessage}`);
  }
}

export async function recruitNewCharacterAction(
  input: GenerateCharacterDetailsInput,
  stylePrompt: string,
  isPlayable: boolean,
): Promise<Character> {
  try {
    const details = await generateCharacterDetailsAction(input);

    const imageResult = await generateCharacterImagesAction({
        ...details,
        stylePrompt: stylePrompt,
        genre: input.genre,
        accessories: undefined, // Accessories are not used here.
    });
    
    const [compressedProfile, compressedInGame] = await Promise.all([
        compressImage(imageResult.profileImage.url, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
        compressImage(imageResult.inGameImage.url, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
    ]);
    
    const defaultStats = {
      health: 100,
      money: 10,
      happiness: 75,
      items: [],
    };
    
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      ...details,
      isPlayable: isPlayable,
      profileImageUrl: compressedProfile,
      inGameImageUrl: compressedInGame,
      ...defaultStats,
      skills: [],
      relationships: [],
      level: 1,
      xp: 0,
      stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 },
      unspentStatPoints: 0,
      defaultStats: { ...defaultStats },
      currentScenario: null,
    };

    return newCharacter;

  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     console.error("recruitNewCharacterAction failed:", errorMessage);
     throw new Error(`Failed to recruit new character. ${errorMessage}`);
  }
}

export async function generateFullStoryAction(input: GenerateFullStoryInput) {
    try {
        const result = await generateFullStory(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateFullStoryAction failed:", errorMessage);
        throw new Error(`Failed to generate the full story. ${errorMessage}`);
    }
}

export async function generateTwoScenesFromPlotAction(input: GenerateTwoScenesFromPlotInput) {
    try {
        const result = await generateTwoScenesFromPlot(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateTwoScenesFromPlotAction failed:", errorMessage);
        throw new Error(`Failed to generate scene details from plot. ${errorMessage}`);
    }
}

export async function generateChapterSummaryAction(input: GenerateChapterSummaryInput): Promise<GenerateChapterSummaryOutput> {
    try {
        const result = await generateChapterSummary(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateChapterSummaryAction failed:", errorMessage);
        throw new Error(`Failed to generate the chapter summary. ${errorMessage}`);
    }
}

export async function generateCharacterQuoteAction(input: GenerateCharacterQuoteInput): Promise<GenerateCharacterQuoteOutput> {
    try {
        const result = await generateCharacterQuote(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateCharacterQuoteAction failed:", errorMessage);
        throw new Error(`Failed to generate the character quote. ${errorMessage}`);
    }
}

export async function generateCharacterPersonalityQuoteAction(input: GenerateCharacterPersonalityQuoteInput): Promise<GenerateCharacterPersonalityQuoteOutput> {
    try {
        const result = await generateCharacterPersonalityQuote(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateCharacterPersonalityQuoteAction failed:", errorMessage);
        throw new Error(`Failed to generate the character's personality quote. ${errorMessage}`);
    }
}


export async function generateCharacterThoughtAction(input: GenerateCharacterThoughtInput): Promise<GenerateCharacterThoughtOutput> {
    try {
        const result = await generateCharacterThought(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateCharacterThoughtAction failed:", errorMessage);
        throw new Error(`Failed to generate the character's thought. ${errorMessage}`);
    }
}

export async function generateSceneNameAction(input: GenerateSceneNameInput): Promise<GenerateSceneNameOutput> {
    try {
        const result = await generateSceneName(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateSceneNameAction failed:", errorMessage);
        throw new Error(`Failed to generate the scene name. ${errorMessage}`);
    }
}

export async function generateCharacterResponseAction(input: GenerateCharacterResponseInput): Promise<GenerateCharacterResponseOutput> {
    try {
        const result = await generateCharacterResponse(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateCharacterResponseAction failed:", errorMessage);
        throw new Error(`Failed to generate the character response. ${errorMessage}`);
    }
}

export async function generateConversationStartersAction(input: GenerateConversationStartersInput): Promise<GenerateConversationStartersOutput> {
    try {
        const result = await generateConversationStarters(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateConversationStartersAction failed:", errorMessage);
        throw new Error(`Failed to generate conversation starters. ${errorMessage}`);
    }
}

export async function removeImageBackgroundAction(input: RemoveImageBackgroundInput): Promise<RemoveImageBackgroundOutput> {
  try {
    const result = await removeImageBackground(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("removeImageBackgroundAction failed:", errorMessage);
    throw new Error(`Failed to remove image background. ${errorMessage}`);
  }
}

export async function generateAudioTeaserAction(input: GenerateAudioTeaserInput): Promise<GenerateAudioTeaserOutput> {
  try {
    const result = await generateAudioTeaser(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("generateAudioTeaserAction failed:", errorMessage);
    throw new Error(`Failed to generate audio teaser. ${errorMessage}`);
  }
}

export async function generateStoryTeaserAction(input: GenerateStoryTeaserInput): Promise<GenerateStoryTeaserOutput> {
    try {
        const result = await generateStoryTeaser(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateStoryTeaserAction failed:", errorMessage);
        throw new Error(`Failed to generate story teaser. ${errorMessage}`);
    }
}

export async function generateStoryMapAction(input: GenerateStoryMapInput): Promise<GenerateStoryMapOutput> {
    try {
        const result = await generateStoryMap(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateStoryMapAction failed:", errorMessage);
        throw new Error(`Failed to generate story map. ${errorMessage}`);
    }
}

export async function generateObjectiveHelpAction(input: GenerateObjectiveHelpInput): Promise<GenerateObjectiveHelpOutput> {
  try {
    const result = await generateObjectiveHelp(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("generateObjectiveHelpAction failed:", errorMessage);
    throw new Error(`Failed to generate objective help. ${errorMessage}`);
  }
}

export async function analyzeCharacterCompatibilityAction(input: AnalyzeCharacterCompatibilityInput): Promise<AnalyzeCharacterCompatibilityOutput> {
  try {
    const result = await analyzeCharacterCompatibility(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("analyzeCharacterCompatibilityAction failed:", errorMessage);
    throw new Error(`Failed to generate character compatibility analysis. ${errorMessage}`);
  }
}

export async function generateCharacterAccessoriesAction(
  input: GenerateCharacterAccessoriesInput
): Promise<GenerateCharacterAccessoriesOutput> {
  try {
    const result = await generateCharacterAccessories(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error('Error generating character accessories:', errorMessage);
    throw new Error(`Failed to generate character accessories. ${errorMessage}`);
  }
}

export async function generateSpeechAction(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
    try {
        const result = await generateSpeech(input);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("generateSpeechAction failed:", errorMessage);
        throw new Error(`Failed to generate speech. ${errorMessage}`);
    }
}

export async function handleHagglingTurnAction(input: HandleHagglingTurnInput): Promise<HandleHagglingTurnOutput> {
    try {
        const result = await handleHagglingTurn(input);
        return result;
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("handleHagglingTurnAction failed:", errorMessage);
        throw new Error(`Failed to handle haggling turn. ${errorMessage}`);
    }
}

export async function handleLiarsDiceTurnAction(input: HandleLiarsDiceTurnInput): Promise<HandleLiarsDiceTurnOutput> {
    try {
        const result = await handleLiarsDiceTurn(input);
        return result;
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("handleLiarsDiceTurnAction failed:", errorMessage);
        throw new Error(`Failed to handle Liar's Dice turn. ${errorMessage}`);
    }
}

export async function generateLiarsDiceHintAction(input: GenerateLiarsDiceHintInput): Promise<GenerateLiarsDiceHintOutput> {
    try {
        const result = await generateLiarsDiceHint(input);
        return result;
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("generateLiarsDiceHintAction failed:", errorMessage);
        throw new Error(`Failed to generate a hint for Liar's Dice. ${errorMessage}`);
    }
}


// New regeneration actions
export async function regenerateCoverAction(story: Story): Promise<GenerateStoryCoverOutput> {
    const selectedStyle = storyStyles.find(s => s.value === story.style);
    if (!selectedStyle) throw new Error("Invalid style for regeneration.");
    return generateStoryCoverAction({
        title: story.name,
        genre: story.genre,
        plot: story.plot,
        stylePrompt: selectedStyle.characterPromptModifier,
    });
}

export async function regenerateCharacterImagesAction(character: Character, story: Story): Promise<GenerateCharacterImagesOutput> {
    const selectedStyle = storyStyles.find(s => s.value === story.style);
    if (!selectedStyle) throw new Error("Invalid style for regeneration.");
    return generateCharacterImagesAction({
        ...character,
        stylePrompt: selectedStyle.characterPromptModifier,
        genre: story.genre,
        accessories: character.accessories,
    });
}

export async function regenerateSceneVisualAction(scene: Scene, story: Story): Promise<GenerateScenarioVisualOutput> {
    const selectedStyle = storyStyles.find(s => s.value === scene.style || story.style);
    if (!selectedStyle) throw new Error("Invalid style for regeneration.");

    const fullPrompt = `${selectedStyle.scenePromptModifier}, ${scene.prompt}`;
    return generateScenarioVisualAction({
        scenarioDescription: fullPrompt,
    });
}

export async function regenerateStoryMapAction(story: Story): Promise<{ mapUrl: string }> {
    const result = await generateStoryMap({
        genre: story.genre,
        plot: story.plot,
    });
    return { mapUrl: result.mapUrl };
}

    
