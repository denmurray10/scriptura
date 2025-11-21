

import { type UseEmblaCarouselType } from 'embla-carousel-react';

export type CarouselApi = UseEmblaCarouselType[1]

export interface Item {
  name: string;
  description: string;
}

export interface Objective {
  id: string;
  description: string;
  status: 'active' | 'completed';
  tokenReward: number;
}

export interface Scene {
  id:string;
  name: string;
  url: string; // Single URL for the image
  prompt?: string;
  style?: string; // The style used to generate the scene, if any
  x?: number; // X coordinate for map
  y?: number; // Y coordinate for map
}

export interface Scenario {
  description: string;
  interactingNpcName?: string;
  requiredNextCharacterName?: string;
}

export interface Relationship {
  targetCharacterId: string;
  value: number; // e.g., -100 to 100
}

export interface CharacterStats {
  intellect: number;
  charisma: number;
  wits: number;
  willpower: number;
}

export interface Player {
    userId: string;
    characterId: string;
    displayName: string;
    photoURL?: string | null;
}

export interface Character {
  id: string;
  name: string;
  backstory: string;
  traits: string;
  accessories?: string; // New field
  quote?: string;
  personalityQuote?: string;
  
  // New fields
  sex: string;
  age: string;
  hairColour: string;
  eyeColour: string;
  isPlayable: boolean;
  
  // A headshot for profile/UI elements
  profileImageUrl: string;
  profileImageSize?: number;

  // Full-body image with transparent BG for story view
  inGameImageUrl: string;
  inGameImageSize?: number;

  health: number; // 0-100
  money: number;
  happiness: number; // 0-100
  items: Item[];
  skills: string[];

  relationships: Relationship[];

  // RPG stats
  level: number;
  xp: number;
  stats: CharacterStats;
  unspentStatPoints: number;

  // Store default stats for resetting
  defaultStats?: {
    health: number;
    money: number;
    happiness: number;
    items: Item[];
  };
  
  currentScenario: Scenario | null;
}

export interface TemporaryNpc {
  id: string;
  name: string;
  description: string;
  locationName: string;
  imageUrl: string;
}

export interface HagglingData {
  npcName: string;
  item: Item;
  targetPrice: number;
  patience: number;
  npcDialogue: string;
  lastOffer?: number;
}

export interface LockpickingData {
    puzzle: string[]; // e.g., ['triangle', 'circle', 'square']
    playerSequence: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface PersuasionData {
    npcName: string;
    npcAttitude: 'Hostile' | 'Annoyed' | 'Neutral' | 'Amused' | 'Friendly';
    goal: string;
    currentStage: number;
    stages: {
        npcDialogue: string;
        options: {
            text: string;
            stat: keyof CharacterStats;
            difficulty: number;
        }[];
    }[];
}

export interface RiddleData {
    question: string;
    answers: string[]; // Array of acceptable answers (case-insensitive)
    npcName?: string;
}

export interface LiarsDiceData {
    npcName: string;
    playerDice: number[];
    npcDice: number[]; // Kept hidden from the player on the client
    currentBid: { quantity: number; value: number } | null;
    turn: 'player' | 'npc';
    lastActionMessage: string;
    pot: number;
}


export type MiniGame = 
  | { type: 'haggling'; status: 'active' | 'won' | 'lost'; data: HagglingData; }
  | { type: 'lockpicking'; status: 'active' | 'won' | 'lost'; data: LockpickingData; }
  | { type: 'persuasion'; status: 'active' | 'won' | 'lost'; data: PersuasionData; }
  | { type: 'riddle'; status: 'active' | 'won' | 'lost'; data: RiddleData; }
  | { type: 'liarsDice'; status: 'active' | 'won' | 'lost'; data: LiarsDiceData; };


export interface StoryHistoryEntry {
  characterId: string;
  characterName: string;
  characterProfileImageUrl: string;
  choice: string;
  outcomeDescription: string;
  outcomeNpcName?: string;
  visualUrl: string;
  timestamp?: number;
  fromLocationName?: string;
  toLocationName?: string;
  relationshipChanges?: { characterId: string; change: number }[];
}

export interface Shelf {
  id: string;
  name: string;
  storyIds: string[];
}

export interface ReadingGoal {
    chaptersPerWeek: number;
}

export interface RelationshipEvent {
  character1: Character;
  character2: Character;
  description: string;
  imageUrl: string;
}

export interface Story {
  id:string;
  seriesId?: string; 
  name: string;
  plot: string;
  genre: string;
  ageRating: string;
  style: string;
  language?: 'UK English' | 'US English';
  isPublic?: boolean;
  isManuallyCreated?: boolean;
  storyMode: 'immersive' | 'narrator' | 'audio' | null;
  imageUrl?: string;
  videoUrl?: string;
  coverType?: 'image' | 'video';
  coverSize?: number;
  mapUrl?: string;
  characters: Character[];
  scenes: Scene[];
  activeCharacterId: string | null;
  storyStatus: 'idle' | 'playing' | 'ended' | 'chapter-end' | 'relationship-event';
  storyHistory: StoryHistoryEntry[];
  locationName: string;
  lastLocationName?: string | null;
  storyProgression: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  currentSceneIndex: number;
  objectives: Objective[];
  interactionsUntilNextObjective?: number;
  lastChapterSummary?: string | null;
  lastRelationshipEvent?: RelationshipEvent | null;
  isBookmarked?: boolean;
  lastPlayedTimestamp: number;
  createdAt: number;
  shelfId?: string | null;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
  authorAboutMe?: string;
  audioTeaserUrl?: string | null;
  teaser?: string | null;
  
  // Co-op fields
  isCoop?: boolean;
  inviteCode?: string;
  players?: Player[];
  playerIds?: string[]; // New field for efficient querying
  turnCharacterId?: string | null;

  // New fields for dynamic content
  temporaryNpcs?: TemporaryNpc[];
  activeMiniGame?: MiniGame | null;
}

export interface DashboardConfig {
  featuredBannerStoryIds?: string[];
  bookOfTheDayStoryId?: string;
}

export interface AppState {
  stories: Story[];
  activeStoryId: string | null;
  membershipPlan: 'Free' | 'Explorer' | 'Sculptor' | 'Admin';
  monthlyCreations?: number;
  creationResetDate?: string;
  bookmarks?: number;
  lastBookmarkRegen?: number;
  tokens?: number;
  lastTokenRegen?: number;
  shelves?: Shelf[];
  readingGoal?: ReadingGoal;
  chaptersReadThisWeek?: number;
  weekStartDate?: string;
  isAdminMode?: boolean;
  lastDailyRewardClaimed?: number;
  followedAuthors?: string[];
  aboutMe?: string;
  dashboardConfig?: DashboardConfig;
}

export interface ShopActionItem {
  id: 'discover_new_scene' | 'recruit_playable_character' | 'recruit_ai_companion' | 'refill_bookmarks';
  name: string;
  description: string;
  cost: number;
  type: 'action';
}

export interface ShopSkillItem {
  id: 'skill_persuasion' | 'skill_intimidation' | 'skill_lockpicking' | 'skill_survival';
  name: string;
  description: string;
  cost: number;
  type: 'skill';
  skill: 'Persuasion' | 'Intimidation' | 'Lockpicking' | 'Survivalist';
}

export type ShopItem = ShopActionItem | ShopSkillItem;

export interface TokenPackage {
  id: string;
  name: string;
  amount: number;
  price: string;
}

export interface CommunityPoll {
    id: string;
    storyName: string;
    storyCoverUrl: string;
    question: string;
    options: {
        id: string;
        text: string;
        votes: number;
    }[];
}

export interface FriendActivity {
    id: string;
    friendName: string;
    friendAvatar: string;
    storyName: string;
    action: string;
    timestamp: number;
    storyCoverUrl: string;
}
