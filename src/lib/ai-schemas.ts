

/**
 * @fileoverview This file centralizes all Zod schemas and their inferred types
 * for AI-related flows. By separating data contracts from server-only logic,
 * we can safely use these types in both server and client components without
 * violating Next.js's "use server" module constraints.
 */

import {z} from 'genkit';
import type { Character, Scene, Story } from '@/types';

// From: analyze-choice-effects.ts
export const ItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  description: z.string().describe('A brief description of the item.'),
});
export type Item = z.infer<typeof ItemSchema>;

export const RelationshipSchema = z.object({
  targetCharacterId: z.string().describe("The unique ID of the character this relationship refers to."),
  value: z.number().describe("The relationship score, from -100 (Hated) to 100 (Beloved)."),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const ObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['active', 'completed']),
  tokenReward: z.number(),
});
export type Objective = z.infer<typeof ObjectiveSchema>;

export const CharacterStatsSchema = z.object({
    intellect: z.number().describe("The character's intellect score. Governs logic, memory, and problem-solving."),
    charisma: z.number().describe("The character's charisma score. Influences persuasion, leadership, and social grace."),
    wits: z.number().describe("The character's wits score. Affects perception, quick thinking, and spotting details."),
    willpower: z.number().describe("The character's willpower score. Determines resistance to mental effects and endurance."),
}).describe("The character's core RPG stats.");

export const AnalyzeChoiceEffectsInputSchema = z.object({
  choice: z.string().describe('The choice made by the user.'),
  character: z
    .object({
      name: z.string(),
      sex: z.string().describe("The sex of the character, e.g., 'Male' or 'Female'."),
      traits: z.string(),
      backstory: z.string(),
      health: z.number(),
      money: z.number(),
      happiness: z.number(),
      items: z.array(ItemSchema),
      skills: z.array(z.string()).describe("A list of the character's special skills, like 'Lockpicking' or 'Persuasion'."),
      relationships: z.array(RelationshipSchema).describe("The active character's relationships with others."),
      stats: CharacterStatsSchema,
    })
    .describe('The character making the choice.'),
  scenes: z.array(z.object({
      id: z.string(),
      name: z.string(),
  })).describe('A list of available scenes the story can take place in.'),
  otherCharacters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sex: z.string().describe("The sex of this character."),
    traits: z.string(),
    isPlayable: z.boolean().describe("Whether this character is a player-controlled character."),
    relationshipWithActiveCharacter: z.number().optional().describe("This character's relationship score towards the active character."),
  })).describe('A list of other characters present in the scene, including other playable characters.'),
  storyProgression: z
    .string()
    .describe('The current state of the story progression.'),
  scenario: z.string().describe('A description of the current scenario'),
  locationName: z.string().describe('The name of the current location (e.g., "The Rusty Flagon Inn", "Whispering Woods").'),
  genre: z.string().describe('The genre of the story.'),
  ageRating: z.string().describe('The age rating for the story.'),
  language: z.enum(['UK English', 'US English']).optional().describe('The English dialect to use for the response. Important for spelling and phrasing.'),
  timeOfDay: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']),
  style: z.string().describe('The visual style of the story (e.g., "fantasy", "anime").'),
  objectives: z.array(ObjectiveSchema).describe('The list of current active objectives for the character.'),
  shouldCreateNewObjective: z.boolean().optional().describe("A flag indicating whether the AI MUST create a new objective in this turn."),
  associatedNpc: z.object({
    name: z.string(),
    description: z.string(),
    locationName: z.string(),
    imagePrompt: z.string(),
  }).optional().nullable().describe("An NPC to create and place in the world, associated with the new objective."),
  startMiniGame: z.enum(['haggling', 'lockpicking', 'persuasion', 'riddle', 'liarsDice']).optional().nullable().describe("A signal to start a specific mini-game."),
});
export type AnalyzeChoiceEffectsInput = z.infer<
  typeof AnalyzeChoiceEffectsInputSchema
>;

export const AnalyzeChoiceEffectsOutputSchema = z.object({
    characterUpdate: z.object({
        health: z.number().describe("The character's new health value (0-100). Should not go below 0."),
        money: z.number().describe("The character's new money value. Should not go below 0."),
        happiness: z.number().describe("The character's new happiness value (0-100)."),
        items: z.array(ItemSchema).describe("The character's new inventory of items. Include existing items that are kept."),
        xp: z.number().describe("The amount of experience points the character has gained. Can be 0."),
        unspentStatPoints: z.number().describe("The number of new stat points the character has earned to spend."),
    }),
    storyUpdate: z.object({
        newScenario: z
            .string()
            .describe('A description of the new scenario that results from the choice. This should be a direct continuation of the story.'),
        newLocationName: z.string().describe('The name of the new location. This must be the name of the scene you select.'),
        selectedSceneId: z.string().describe('The ID of the scene from the input list that best matches the new scenario. You MUST choose one.'),
        storyProgressionEffects: z
            .string()
            .describe('An updated, one-sentence summary of the overall story progression.'),
        timeOfDay: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).describe('The new time of day, which should logically follow the previous state and the choice made.'),
        interactingNpcName: z.string().optional().describe('If an NPC is the main actor or speaker in the new scenario, provide their name here. Otherwise, this should be empty.'),
        requiredNextCharacterName: z.string().optional().nullable().describe("If the narrative strongly suggests another character should act next, provide that character's name here. This name MUST be one of the other playable characters present."),
        completedObjectiveId: z.string().optional().nullable().describe('The ID of the objective that was completed by this choice, if any.'),
        newObjective: z.object({
          description: z.string().describe("A description of the new objective."),
          tokenReward: z.number().describe("The number of tokens awarded for completing this objective. This MUST be 1."),
        }).optional().nullable().describe('A new objective for the character that arises from the current situation.'),
        newScene: z.object({
          name: z.string().describe("The name of the newly discovered scene."),
          prompt: z.string().describe("A vivid, descriptive prompt for an AI image generator to create the scene's visual."),
        }).optional().nullable().describe("If the choice leads to a new location, define it here."),
        relationshipChanges: z.array(z.object({
          targetCharacterId: z.string().describe("The ID of the character whose relationship is being updated."),
          change: z.number().describe("The amount to change the relationship by. Can be positive (for improvement) or negative (for worsening)."),
        })).optional().describe("An array of relationship changes for the active character resulting from their choice."),
        relationshipEvent: z.object({
            description: z.string().describe("A special, one-time scene description for the event."),
            imagePrompt: z.string().describe("A vivid image generation prompt for this specific event."),
        }).optional().nullable().describe("A special, one-time scene description that is triggered when a relationship crosses a critical threshold (e.g., becoming 'Beloved' or 'Hated').")
    })
});
export type AnalyzeChoiceEffectsOutput = z.infer<
  typeof AnalyzeChoiceEffectsOutputSchema
>;

// From: handle-haggling-turn.ts
export const HandleHagglingTurnInputSchema = z.object({
  npcName: z.string(),
  item: ItemSchema,
  targetPrice: z.number(),
  patience: z.number(),
  playerOffer: z.number(),
});
export type HandleHagglingTurnInput = z.infer<typeof HandleHagglingTurnInputSchema>;

export const HandleHagglingTurnOutputSchema = z.object({
  dialogue: z.string().describe("The NPC's reaction to the player's offer."),
  patienceDamage: z.number().describe("The amount of patience the NPC loses due to the offer."),
  isDeal: z.boolean().describe("Whether the NPC accepts the offer."),
});
export type HandleHagglingTurnOutput = z.infer<typeof HandleHagglingTurnOutputSchema>;

// From: handle-liars-dice-turn.ts
const BidSchema = z.object({
  quantity: z.number().describe("The quantity of the dice value being bid."),
  value: z.number().min(1).max(6).describe("The face value of the dice being bid (1-6).")
});
export const HandleLiarsDiceTurnInputSchema = z.object({
  npcName: z.string(),
  npcDice: z.array(z.number()).min(1).describe("The NPC's hidden dice."),
  totalDiceInPlay: z.number().describe("The total number of dice on the table (player's + NPC's)."),
  currentBid: BidSchema.nullable().describe("The player's most recent bid."),
});
export type HandleLiarsDiceTurnInput = z.infer<typeof HandleLiarsDiceTurnInputSchema>;

export const HandleLiarsDiceTurnOutputSchema = z.object({
  action: z.enum(['bid', 'challenge']),
  bid: BidSchema.optional().nullable().describe("The new bid, if the action is 'bid'."),
  dialogue: z.string().describe("A short, in-character line of dialogue for the NPC's turn."),
});
export type HandleLiarsDiceTurnOutput = z.infer<typeof HandleLiarsDiceTurnOutputSchema>;

// From: generate-liars-dice-hint.ts
export const GenerateLiarsDiceHintInputSchema = z.object({
    playerDice: z.array(z.number()).min(1).describe("The player's dice."),
    totalDiceInPlay: z.number().describe("The total number of all dice in play."),
    currentBid: BidSchema.describe("The current bid on the table made by the NPC."),
});
export type GenerateLiarsDiceHintInput = z.infer<typeof GenerateLiarsDiceHintInputSchema>;

export const GenerateLiarsDiceHintOutputSchema = z.object({
    recommendation: z.string().describe("A helpful recommendation for the player's next move (e.g., 'Challenging seems risky, the bid is quite plausible.' or 'This looks like a bluff, you might want to challenge.')."),
});
export type GenerateLiarsDiceHintOutput = z.infer<typeof GenerateLiarsDiceHintOutputSchema>;


// From: generate-narrator-turn.ts
export const NarratorTurnOutputSchema = z.object({
  newScenario: z
    .string()
    .describe('A description of the new scenario that results from the choice.'),
  storyProgressionEffects: z
    .string()
    .describe('An updated, one-sentence summary of the overall story progression.'),
  newLocationName: z.string().describe('The name of the new location.'),
  selectedSceneId: z.string().describe('The ID of the scene from the input list that best matches the new scenario. You MUST choose one.'),
  timeOfDay: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).describe('The new time of day.'),
});
export type NarratorTurnOutput = z.infer<typeof NarratorTurnOutputSchema>;


// From: generate-character-details.ts
export const GenerateCharacterDetailsInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  ageRating: z.string().describe('The age rating for the story.'),
  sex: z.enum(['Male', 'Female']).optional().describe('The desired sex for the character.'),
  existingNames: z.array(z.string()).optional().describe('A list of character names that already exist in the story, to avoid duplication.'),
});
export type GenerateCharacterDetailsInput = z.infer<
  typeof GenerateCharacterDetailsInputSchema
>;

export const GenerateCharacterDetailsOutputSchema = z.object({
  name: z.string().describe('The generated name for the character.'),
  traits: z.string().describe('The generated traits for the character.'),
  backstory: z.string().describe('The generated backstory for the character.'),
  sex: z.enum(['Male', 'Female']).describe('The generated sex for the character.'),
  age: z.enum(['Young', 'Teenager', 'Adult', 'Old']).describe('The generated age group for the character.'),
  hairColour: z.enum(['Red', 'White', 'Blonde', 'Brown', 'Silver', 'Black']).describe('The generated hair colour for the character.'),
  eyeColour: z.enum(["Blue", "Green", "Brown", "Hazel", "Grey", "Amber"]).describe('The generated eye colour for the character.'),
});
export type GenerateCharacterDetailsOutput = z.infer<
  typeof GenerateCharacterDetailsOutputSchema
>;


// From: generate-character-field.ts
export const GenerateCharacterFieldInputSchema = z.object({
  field: z.enum(['name', 'traits', 'backstory', 'sex', 'age', 'hairColour', 'eyeColour', 'accessories']),
  context: z
    .object({
      name: z.string().optional(),
      traits: z.string().optional(),
      backstory: z.string().optional(),
      genre: z.string().optional(),
      ageRating: z.string().optional(),
      sex: z.string().optional(),
      age: z.string().optional(),
      hairColour: z.string().optional(),
      eyeColour: z.string().optional(),
      accessories: z.string().optional(),
      existingNames: z.array(z.string()).optional().describe('A list of character names that already exist in the story, to avoid duplication.'),
    })
    .optional(),
});
export type GenerateCharacterFieldInput = z.infer<
  typeof GenerateCharacterFieldInputSchema
>;

export const GenerateCharacterFieldOutputSchema = z.object({
  value: z.string().describe('The generated value for the requested field.'),
});
export type GenerateCharacterFieldOutput = z.infer<
  typeof GenerateCharacterFieldOutputSchema
>;


// From: generate-character-images.ts
export const GenerateCharacterImagesInputSchema = z.object({
  name: z.string(),
  traits: z.string(),
  backstory: z.string(),
  sex: z.string(),
  age: z.string(),
  hairColour: z.string(),
  eyeColour: z.string(),
  stylePrompt: z.string(),
  genre: z.string(),
  accessories: z.string().optional().describe('Optional accessories the character is wearing, like "glasses" or "a scar".'),
});
export type GenerateCharacterImagesInput = z.infer<typeof GenerateCharacterImagesInputSchema>;

export const GenerateCharacterImagesOutputSchema = z.object({
    profileImage: z.object({
      url: z.string().describe("Data URI for the character's profile image."),
      originalSize: z.number(),
      newSize: z.number(),
    }),
    inGameImage: z.object({
      url: z.string().describe("Data URI for the character's in-game image."),
      originalSize: z.number(),
      newSize: z.number(),
    }),
});
export type GenerateCharacterImagesOutput = z.infer<typeof GenerateCharacterImagesOutputSchema>;



// From: generate-character-traits.ts
export const GenerateCharacterTraitsInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  ageRating: z.string().describe('The age rating for the story.'),
  name: z.string().optional().describe('The name of the character.'),
});
export type GenerateCharacterTraitsInput = z.infer<
  typeof GenerateCharacterTraitsInputSchema
>;

export const GenerateCharacterTraitsOutputSchema = z.object({
  traits: z.array(z.string()).length(9).describe('An array of exactly 9 distinct and creative character traits.'),
});
export type GenerateCharacterTraitsOutput = z.infer<
  typeof GenerateCharacterTraitsOutputSchema
>;


// From: generate-scenario-visual.ts
export const GenerateScenarioVisualInputSchema = z.object({
  scenarioDescription: z
    .string()
    .describe('A description of the scenario to visualize.'),
});
export type GenerateScenarioVisualInput = z.infer<
  typeof GenerateScenarioVisualInputSchema
>;

export const GenerateScenarioVisualOutputSchema = z.object({
  url: z.string().describe('A data URI for the portrait (9:16) image.'),
  originalSize: z.number().describe('The original size of the image in bytes.'),
  newSize: z.number().describe('The new size of the compressed image in bytes.'),
});
export type GenerateScenarioVisualOutput = z.infer<
  typeof GenerateScenarioVisualOutputSchema
>;


// From: generate-scene-prompt.ts
export const GenerateScenePromptInputSchema = z.object({
  name: z.string().optional().describe('The name of the scene to generate a prompt for.'),
  genre: z.string().optional().describe('The genre of the story.'),
});
export type GenerateScenePromptInput = z.infer<
  typeof GenerateScenePromptInputSchema
>;

export const GenerateScenePromptOutputSchema = z.object({
  prompt: z.string().describe('The generated descriptive prompt for the scene.'),
});
export type GenerateScenePromptOutput = z.infer<
  typeof GenerateScenePromptOutputSchema
>;


// From: generate-story-cover.ts
export const GenerateStoryCoverInputSchema = z.object({
  title: z.string().describe('The title of the story.'),
  genre: z.string().describe('The genre of the story.'),
  plot: z.string().describe('A brief plot summary of the story.'),
  stylePrompt: z.string().describe('A prompt describing the visual style (e.g., "anime style", "photorealistic").'),
});
export type GenerateStoryCoverInput = z.infer<typeof GenerateStoryCoverInputSchema>;

export const GenerateStoryCoverOutputSchema = z.object({
  coverUrl: z.string().describe(
    "A data URI containing the generated cover image. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  originalSize: z.number().describe('The original size of the image in bytes.'),
  newSize: z.number().describe('The new size of the compressed image in bytes.'),
});
export type GenerateStoryCoverOutput = z.infer<typeof GenerateStoryCoverOutputSchema>;


// From: generate-story-field.ts
export const GenerateStoryFieldInputSchema = z.object({
  field: z.enum(['name', 'genre', 'plot']),
  context: z
    .object({
      name: z.string().optional(),
      genre: z.string().optional(),
      plot: z.string().optional(),
      existingNames: z.array(z.string()).optional().describe('A list of story titles that already exist, to avoid duplication.'),
    })
    .optional(),
});
export type GenerateStoryFieldInput = z.infer<
  typeof GenerateStoryFieldInputSchema
>;

export const GenerateStoryFieldOutputSchema = z.object({
  value: z.string().describe('The generated value for the requested field.'),
});
export type GenerateStoryFieldOutput = z.infer<
  typeof GenerateStoryFieldOutputSchema
>;


// From: generate-story-suggestions.ts
export const GenerateStorySuggestionsInputSchema = z.object({
  character: z
    .object({
      name: z.string(),
      traits: z.string(),
      backstory: z.string(),
      health: z.number(),
      money: z.number(),
      happiness: z.number(),
      items: z.array(ItemSchema),
      stats: CharacterStatsSchema,
    })
    .describe('The character making the choice, including their current stats.'),
  otherCharacters: z.array(z.object({
    name: z.string(),
  })).describe('A list of other non-player characters in the world.'),
  storyProgression: z
    .string()
    .describe('The current state of the story progression.'),
  scenario: z.string().describe('A description of the current scenario'),
  genre: z.string().describe('The genre of the story.'),
  ageRating: z.string().describe('The age rating of the story.'),
});
export type GenerateStorySuggestionsInput = z.infer<
  typeof GenerateStorySuggestionsInputSchema
>;

export const GenerateStorySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .length(2)
    .describe('An array of exactly two distinct and creative suggestions for the character\'s next action. One should be safe, the other daring.'),
});
export type GenerateStorySuggestionsOutput = z.infer<
  typeof GenerateStorySuggestionsOutputSchema
>;

// From: generate-new-scene-details.ts
export const GenerateNewSceneDetailsInputSchema = z.object({
  genre: z.string(),
  plot: z.string(),
  style: z.string(),
  existingSceneNames: z.array(z.string()),
});
export type GenerateNewSceneDetailsInput = z.infer<typeof GenerateNewSceneDetailsInputSchema>;

export const GenerateNewSceneDetailsOutputSchema = z.object({
  name: z.string().describe("The creative and unique name for the new scene."),
  prompt: z.string().describe("The descriptive prompt for an AI image generator to create the scene's visual."),
});
export type GenerateNewSceneDetailsOutput = z.infer<typeof GenerateNewSceneDetailsOutputSchema>;


// From: generate-full-story.ts
export const GenerateFullStoryInputSchema = z.object({
  genre: z.string(),
});
export type GenerateFullStoryInput = z.infer<typeof GenerateFullStoryInputSchema>;

const StoryDataSchema = z.object({
  name: z.string(),
  plot: z.string(),
  genre: z.string(),
  ageRating: z.string(),
  style: z.string(),
  imageUrl: z.string().optional(),
  coverType: z.enum(['image', 'video']).optional(),
});

const CharacterSchemaForOutput = z.any();
const SceneSchemaForOutput = z.any();

export const GenerateFullStoryOutputSchema = z.object({
  storyData: StoryDataSchema.describe("Core details of the generated story."),
  characters: z.array(CharacterSchemaForOutput).min(3).describe("An array of all characters, including one main playable character and two AI companions."),
  scenes: z.array(SceneSchemaForOutput).length(2).describe("An array of exactly two key scenes for the story, with image URLs as data URIs."),
});
export type GenerateFullStoryOutput = {
  storyData: z.infer<typeof StoryDataSchema>;
  characters: Character[];
  scenes: Scene[];
};


// From: generate-two-scenes-from-plot.ts
export const GenerateTwoScenesFromPlotInputSchema = z.object({
  plot: z.string(),
  genre: z.string(),
});
export type GenerateTwoScenesFromPlotInput = z.infer<typeof GenerateTwoScenesFromPlotInputSchema>;

export const GenerateTwoScenesFromPlotOutputSchema = z.object({
    scene1: z.object({
      name: z.string().describe('A name for the first key location, inspired by the plot.'),
      prompt: z.string().describe('A vivid image generation prompt for this first location.'),
    }),
    scene2: z.object({
      name: z.string().describe('A name for a second, related key location.'),
      prompt: z.string().describe('A vivid image generation prompt for this second location.'),
    }),
});
export type GenerateTwoScenesFromPlotOutput = z.infer<typeof GenerateTwoScenesFromPlotOutputSchema>;


// From: generate-chapter-summary.ts
const StoryHistoryEntrySchema = z.object({
  characterName: z.string(),
  choice: z.string(),
  outcomeDescription: z.string(),
});

export const GenerateChapterSummaryInputSchema = z.object({
  genre: z.string(),
  plot: z.string(),
  lastTenChoices: z.array(StoryHistoryEntrySchema).describe("The last 10 choices and outcomes that formed the chapter."),
});
export type GenerateChapterSummaryInput = z.infer<typeof GenerateChapterSummaryInputSchema>;

export const GenerateChapterSummaryOutputSchema = z.object({
  summary: z.string().describe("A summary of the chapter. It must be broken into short, 1-2 sentence paragraphs separated by newlines, with a final separate sentence acting as a teaser."),
});
export type GenerateChapterSummaryOutput = z.infer<typeof GenerateChapterSummaryOutputSchema>;


// From: generate-character-quote.ts
export const GenerateCharacterQuoteInputSchema = z.object({
    plot: z.string().describe("The plot of the story."),
    character: z.object({
        name: z.string(),
        traits: z.string(),
        backstory: z.string(),
    }).describe("The character who is 'speaking'."),
});
export type GenerateCharacterQuoteInput = z.infer<typeof GenerateCharacterQuoteInputSchema>;

export const GenerateCharacterQuoteOutputSchema = z.object({
    quote: z.string().describe("The generated in-character quote."),
});
export type GenerateCharacterQuoteOutput = z.infer<typeof GenerateCharacterQuoteOutputSchema>;

// From: generate-character-personality-quote.ts
export const GenerateCharacterPersonalityQuoteInputSchema = z.object({
    character: z.object({
        name: z.string(),
        traits: z.string(),
        backstory: z.string(),
    }).describe("The character whose personality quote is being generated."),
});
export type GenerateCharacterPersonalityQuoteInput = z.infer<typeof GenerateCharacterPersonalityQuoteInputSchema>;

export const GenerateCharacterPersonalityQuoteOutputSchema = z.object({
    quote: z.string().describe("A generated short, in-character quote that reflects the character's core personality."),
});
export type GenerateCharacterPersonalityQuoteOutput = z.infer<typeof GenerateCharacterPersonalityQuoteOutputSchema>;


// From: generate-character-thought.ts
export const GenerateCharacterThoughtInputSchema = z.object({
    character: z.object({
        name: z.string(),
        health: z.number(),
        happiness: z.number(),
    }).describe("The character whose thought is being generated."),
    scenario: z.string().describe("The current scenario the character is in."),
    genre: z.string().describe('The genre of the story.'),
});
export type GenerateCharacterThoughtInput = z.infer<typeof GenerateCharacterThoughtInputSchema>;

export const GenerateCharacterThoughtOutputSchema = z.object({
    thought: z.string().describe("The generated short, in-character thought."),
});
export type GenerateCharacterThoughtOutput = z.infer<typeof GenerateCharacterThoughtOutputSchema>;

// From: generate-scene-name.ts
export const GenerateSceneNameInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  existingSceneNames: z.array(z.string()).optional().describe('A list of scene names that already exist, to avoid duplication.'),
});
export type GenerateSceneNameInput = z.infer<typeof GenerateSceneNameInputSchema>;

export const GenerateSceneNameOutputSchema = z.object({
  name: z.string().describe('The generated creative name for the scene.'),
});
export type GenerateSceneNameOutput = z.infer<typeof GenerateSceneNameOutputSchema>;


// From: generate-character-response.ts
const ChatHistoryEntrySchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});
export const GenerateCharacterResponseInputSchema = z.object({
    character: z.object({
        name: z.string(),
        traits: z.string(),
        backstory: z.string(),
        sex: z.string(),
        age: z.string(),
    }).describe("The character's persona."),
    story: z.object({
        title: z.string(),
        plot: z.string(),
    }).describe("The context of the story the character belongs to."),
    chatHistory: z.array(ChatHistoryEntrySchema).describe("The history of the conversation so far."),
    userMessage: z.string().describe("The latest message from the user."),
});
export type GenerateCharacterResponseInput = z.infer<typeof GenerateCharacterResponseInputSchema>;

export const GenerateCharacterResponseOutputSchema = z.object({
    response: z.string().describe("The character's in-character response to the user's message."),
});
export type GenerateCharacterResponseOutput = z.infer<typeof GenerateCharacterResponseOutputSchema>;


// From: generate-conversation-starters.ts
export const GenerateConversationStartersInputSchema = z.object({
    character: z.object({
        name: z.string(),
        traits: z.string(),
        backstory: z.string(),
    }).describe("The character to generate conversation starters for."),
    story: z.object({
        title: z.string(),
        plot: z.string(),
    }).describe("The context of the story."),
});
export type GenerateConversationStartersInput = z.infer<typeof GenerateConversationStartersInputSchema>;

export const GenerateConversationStartersOutputSchema = z.object({
    starters: z.array(z.string()).length(3).describe("An array of exactly three distinct conversation starters."),
});
export type GenerateConversationStartersOutput = z.infer<typeof GenerateConversationStartersOutputSchema>;

// From: remove-image-background.ts
export const RemoveImageBackgroundInputSchema = z.object({
  imageDataUrl: z.string().describe("The image to process, as a data URI."),
});
export type RemoveImageBackgroundInput = z.infer<typeof RemoveImageBackgroundInputSchema>;

export const RemoveImageBackgroundOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the image with the background removed."),
});
export type RemoveImageBackgroundOutput = z.infer<typeof RemoveImageBackgroundOutputSchema>;

// From: generate-image-from-text.ts
export const GenerateImageFromTextInputSchema = z.object({
  prompt: z.string().describe("A text prompt to generate an image from."),
});
export type GenerateImageFromTextInput = z.infer<typeof GenerateImageFromTextInputSchema>;

export const GenerateImageFromTextOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image."),
});
export type GenerateImageFromTextOutput = z.infer<typeof GenerateImageFromTextOutputSchema>;


// From: generate-audio-teaser.ts
export const GenerateAudioTeaserInputSchema = z.object({
  plot: z.string().describe("The plot of the story."),
  title: z.string().describe("The title of the story."),
  genre: z.string().describe("The genre of the story."),
});
export type GenerateAudioTeaserInput = z.infer<typeof GenerateAudioTeaserInputSchema>;

export const GenerateAudioTeaserOutputSchema = z.object({
  audioUrl: z.string().describe("A data URI for the generated audio teaser."),
});
export type GenerateAudioTeaserOutput = z.infer<typeof GenerateAudioTeaserOutputSchema>;

// From: generate-story-teaser.ts
export const GenerateStoryTeaserInputSchema = z.object({
  title: z.string().describe("The title of the story."),
  genre: z.string().describe("The genre of the story."),
  plot: z.string().describe("The plot of the story."),
});
export type GenerateStoryTeaserInput = z.infer<typeof GenerateStoryTeaserInputSchema>;

export const GenerateStoryTeaserOutputSchema = z.object({
  teaser: z.string().describe("A compelling, 2-sentence teaser for the story."),
});
export type GenerateStoryTeaserOutput = z.infer<typeof GenerateStoryTeaserOutputSchema>;

// From: generate-story-map.ts
export const GenerateStoryMapInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  plot: z.string().describe('The plot of the story.'),
});
export type GenerateStoryMapInput = z.infer<typeof GenerateStoryMapInputSchema>;

export const GenerateStoryMapOutputSchema = z.object({
  mapUrl: z.string().describe('A data URI for the generated map image.'),
});
export type GenerateStoryMapOutput = z.infer<typeof GenerateStoryMapOutputSchema>;


// From: generate-objective-help.ts
export const GenerateObjectiveHelpInputSchema = z.object({
    objectiveDescription: z.string().describe('The objective the user needs help with.'),
    character: z.object({
        name: z.string(),
        skills: z.array(z.string()),
        items: z.array(ItemSchema),
    }).describe("The character attempting the objective."),
    storyProgression: z.string().describe("A summary of the story so far."),
    currentScenario: z.string().describe("The immediate situation the character is in."),
    otherCharacters: z.array(z.string()).describe("A list of names of other characters present."),
});
export type GenerateObjectiveHelpInput = z.infer<typeof GenerateObjectiveHelpInputSchema>;

export const GenerateObjectiveHelpOutputSchema = z.object({
    steps: z.array(z.string()).describe('A list of actionable, step-by-step instructions to help the user complete the objective.'),
});
export type GenerateObjectiveHelpOutput = z.infer<typeof GenerateObjectiveHelpOutputSchema>;

// From: analyze-character-compatibility.ts
const CharacterCompatibilityInfoSchema = z.object({
  name: z.string(),
  traits: z.string(),
  backstory: z.string(),
});
export const AnalyzeCharacterCompatibilityInputSchema = z.object({
  character1: CharacterCompatibilityInfoSchema,
  character2: CharacterCompatibilityInfoSchema,
});
export type AnalyzeCharacterCompatibilityInput = z.infer<typeof AnalyzeCharacterCompatibilityInputSchema>;

export const AnalyzeCharacterCompatibilityOutputSchema = z.object({
  analysis: z.string().describe("A 1-2 sentence analysis of how the two characters' personalities might interact."),
});
export type AnalyzeCharacterCompatibilityOutput = z.infer<typeof AnalyzeCharacterCompatibilityOutputSchema>;


// From: generate-character-accessories.ts
export const GenerateCharacterAccessoriesInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  ageRating: z.string().describe('The age rating for the story.'),
  name: z.string().optional().describe('The name of the character.'),
  traits: z.string().optional().describe('The traits of the character.'),
  backstory: z.string().optional().describe('The backstory of the character.'),
  accessories: z.string().optional().describe('The accessories of the character.'),
});
export type GenerateCharacterAccessoriesInput = z.infer<typeof GenerateCharacterAccessoriesInputSchema>;

export const GenerateCharacterAccessoriesOutputSchema = z.object({
    accessories: z.array(z.string()).length(9).describe('An array of exactly 9 accessory suggestions, including "None".'),
});
export type GenerateCharacterAccessoriesOutput = z.infer<typeof GenerateCharacterAccessoriesOutputSchema>;

// From: generate-interview-background.ts
export const GenerateInterviewBackgroundInputSchema = z.object({
    character: z.custom<Character>(),
    story: z.custom<Story>(),
});
export type GenerateInterviewBackgroundInput = z.infer<typeof GenerateInterviewBackgroundInputSchema>;

export const GenerateInterviewBackgroundOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the generated background image."),
});
export type GenerateInterviewBackgroundOutput = z.infer<typeof GenerateInterviewBackgroundOutputSchema>;

// From: generate-speech.ts
export const GenerateSpeechInputSchema = z.object({
  text: z.string().describe("The text to be converted to speech."),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

export const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe("The data URI of the generated WAV audio file."),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;
