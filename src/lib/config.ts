
import type { ShopItem, TokenPackage, FriendActivity } from '@/types';

export const storyStyles = [
  { 
    name: 'Fantasy Art', 
    value: 'fantasy', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'fantasy art', 
    characterPromptModifier: 'epic fantasy character portrait, digital painting, intricate detail, dramatic lighting',
    scenePromptModifier: 'breathtaking masterpiece fantasy landscape, epic scale, vibrant colors, magical, ethereal, intricate detail, dramatic lighting, award-winning digital art, by artists like Greg Rutkowski and Thomas Kinkade'
  },
  { 
    name: 'Anime', 
    value: 'anime', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'anime character', 
    characterPromptModifier: 'anime style character portrait, vibrant, clean lines, cel shaded, by Makoto Shinkai',
    scenePromptModifier: 'masterpiece anime background art, beautiful scenery, vibrant colors, detailed, serene, cinematic lighting, by Studio Ghibli, Makoto Shinkai'
  },
  { 
    name: 'Photorealistic', 
    value: 'photo', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'realistic portrait', 
    characterPromptModifier: 'photorealistic masterpiece, 8k, ultra high detail, sharp focus, professional photography, detailed skin texture, cinematic lighting',
    scenePromptModifier: 'breathtaking photorealistic landscape, 8k, ultra high detail, sharp focus, professional photography, National Geographic style, cinematic lighting, award-winning'
  },
  { 
    name: 'Cyberpunk', 
    value: 'cyberpunk', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'cyberpunk character', 
    characterPromptModifier: 'cyberpunk character portrait, neon lighting, futuristic, gritty detail, Blade Runner style',
    scenePromptModifier: 'cyberpunk cityscape at night, sprawling megastructure, neon-drenched, Blade Runner style, high detail, volumetric lighting, reflections on wet streets'
  },
  { 
    name: 'Watercolor', 
    value: 'watercolor', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'watercolor portrait', 
    characterPromptModifier: 'watercolor character portrait, soft, blended colors, artistic, flowing, on textured paper',
    scenePromptModifier: 'beautiful watercolor landscape painting, soft blended colors, artistic, light-filled, serene, loose and expressive style'
  },
  { 
    name: 'Pixel Art', 
    value: 'pixel', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'pixel art', 
    characterPromptModifier: 'pixel art character portrait, 16-bit, retro video game sprite, detailed',
    scenePromptModifier: 'detailed pixel art background, 16-bit, retro video game style, vibrant color palette, parallax scrolling effect'
  },
  { 
    name: 'Cinematic', 
    value: 'cinematic', 
    image: 'https://placehold.co/300x200.png', 
    hint: 'cinematic landscape', 
    characterPromptModifier: 'cinematic character portrait, dramatic lighting, high detail, movie still',
    scenePromptModifier: 'cinematic movie still of a landscape, epic, dramatic lighting, high detail, volumetric lighting, anamorphic lens flare'
  },
];

export const fantasySceneLocations = [
    "Ancient Forest with Whispering Trees",
    "Floating Island Fortress",
    "Cursed Mountain Pass",
    "Underground Crystal Caverns",
    "Skybridge City Suspended in the Clouds",
    "Abandoned Temple of a Forgotten God",
    "Witch’s Hollow Hidden in the Fog",
    "Royal Castle with a Living Throne Room",
    "Ghost-Infested Battlefield",
    "Sacred Glade of the Moon Elk",
    "Time-Frozen Village",
    "Magical Library with Infinite Hallways",
    "Ashen Wasteland from a Lost War",
    "The Black Sand Shore of the Dead Sea",
    "Tower of Eternal Storms",
    "The Veiled Bazaar of Enchanted Goods",
    "Dragon-Ruled Volcano Stronghold",
    "Undead King’s Tomb Beneath the Desert",
    "Enchanted Orchard with Talking Fruit",
    "Forest of Mirrors and Illusions",
    "Waterfall Shrine Guarded by Spirits",
    "Floating Graveyard of Airships",
    "Sunken Ruins of an Elven City",
    "Winter Fortress Built from Ice and Bone",
    "Shifting Labyrinth of the Trickster God",
    "Obsidian Obelisk on the Plains of Ash",
    "Cave of Singing Stones",
    "The Serpent Bridge Over an Endless Abyss",
    "Forgotten Village Trapped in a Dream",
    "Sacred Arena of Trial by Magic",
    "Skyfire Cliffs Where Phoenixes Nest",
    "The Last Oasis in a Cursed Desert",
    "Haunted Cathedral Beneath the Lake",
    "Goblin Market in a Dimensional Pocket",
    "The Root Halls Beneath the World Tree",
    "Frozen Lake that Reveals Visions",
    "Griffin Nesting Peaks",
    "Abandoned Mage School with Echoing Spells",
    "Chasm of Lost Echoes",
    "Underground City Powered by Soul Crystals",
    "The Singing Dunes of Varethkar",
    "Sanctuary Island of the Time Keepers",
    "Ritual Grounds Under the Twin Moons",
    "The Red Forest Where Trees Bleed Sap",
    "Bridge That Only Appears During Storms",
    "Celestial Observatory of the Star Priests",
    "The Hollow Tree That Leads to Other Worlds",
    "Ruined Fortress of the Fallen Archangel",
    "Moonlit Glade Where Fairies Feast",
    "Dimensional Rift at the World’s Edge"
];

export const shopItems: readonly ShopItem[] = [
    { id: 'discover_new_scene', name: 'Discover New Location', description: 'The AI will generate a new, unique location for your story.', cost: 15, type: 'action' },
    { id: 'recruit_playable_character', name: 'Recruit Playable Character', description: 'Add a new hero you can control to your story.', cost: 20, type: 'action' },
    { id: 'recruit_ai_companion', name: 'Recruit AI Companion', description: 'Add a new AI-controlled character to your story.', cost: 15, type: 'action' },
    { id: 'refill_bookmarks', name: 'Refill Bookmarks', description: 'Instantly get 3 new bookmarks to continue your story.', cost: 10, type: 'action' },
    { id: 'skill_persuasion', name: 'Skill: Persuasion', description: 'Permanently learn the art of diplomacy.', cost: 40, type: 'skill', skill: 'Persuasion' },
    { id: 'skill_intimidation', name: 'Skill: Intimidation', description: 'Permanently learn to command respect through fear.', cost: 40, type: 'skill', skill: 'Intimidation' },
    { id: 'skill_lockpicking', name: 'Skill: Lockpicking', description: 'Permanently learn to bypass simple locks.', cost: 30, type: 'skill', skill: 'Lockpicking' },
    { id: 'skill_survival', name: 'Skill: Survivalist', description: 'Better outcomes in wilderness scenarios.', cost: 35, type: 'skill', skill: 'Survivalist' },
];

export const tokenPackages: readonly TokenPackage[] = [
    { id: 'tokens_10', name: '10 Tokens', amount: 10, price: '£0.99' },
    { id: 'tokens_20', name: '20 Tokens', amount: 20, price: '£1.79' },
    { id: 'tokens_50', name: '50 Tokens', amount: 50, price: '£3.49' },
];

export const genreOptions = [
    { name: "Adventure", description: "Embark on epic journeys to uncharted lands, facing thrilling challenges and discovering hidden treasures." },
    { name: "Crime", description: "Step into the shoes of a detective to solve intricate puzzles, investigate complex cases, and bring criminals to justice." },
    { name: "Fantasy", description: "Enter a world of magic, mythical beasts, and legendary heroes. Forge your path in a realm where anything is possible." },
    { name: "Horror", description: "Survive chilling encounters and navigate terrifying landscapes. A genre for those who enjoy suspense and a good scare." },
    { name: "Mystery", description: "Unravel enigmatic plots and solve baffling cases. Every clue matters as you piece together the truth." },
    { name: "Romance", description: "Explore the complexities of the heart, build deep connections, and navigate the emotional highs and lows of love." },
    { name: "Science Fiction (Sci-Fi)", description: "Journey through space, encounter alien life, and explore futuristic technologies in worlds beyond imagination." },
    { name: "Sports", description: "Experience the thrill of competition, the dedication of an athlete, and the drama of the game. Lead your team to victory." },
    { name: "Thriller/Suspense", description: "Navigate high-stakes situations filled with tension and unexpected twists. Every decision could be your last." },
    { name: "Supernatural", description: "Encounter ghosts, vampires, and other paranormal beings. Explore stories where the laws of nature don't apply." },
    { name: "Period Drama", description: "Travel back in time to different historical eras, experiencing the culture, society, and challenges of the past." },
    { name: "Dystopian", description: "Fight for survival in a bleak, futuristic society where you must challenge oppressive systems to find hope and freedom." },
    { name: "Adult", description: "Explore mature themes and complex narratives intended for an adult audience." },
    { name: "Erotica", description: "Stories centered around passion, desire, and intimate relationships, intended for a mature audience." },
];

export const readingMoods = [
    { name: "Quick Read", description: "Shorter stories perfect for a quick escape." },
    { name: "Deep Lore", description: "Complex worlds with rich histories and intricate plots." },
    { name: "Character-Driven", description: "Stories focused on deep character development and relationships." },
    { name: "High-Stakes Thrills", description: "Action-packed adventures where every choice matters." },
    { name: "Relaxing", description: "Calm, narrative-focused stories with low stress." },
];

export const mockFriendActivity: FriendActivity[] = [
    {
        id: '1',
        friendName: 'Anna Henry',
        friendAvatar: 'https://placehold.co/100x100.png',
        storyName: 'The Sunken City',
        storyCoverUrl: 'https://placehold.co/200x300.png',
        action: 'started reading',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    },
    {
        id: '2',
        friendName: 'Roberto Jordan',
        friendAvatar: 'https://firebasestorage.googleapis.com/v0/b/choicescraft-2af32.firebasestorage.app/o/dev-uploads%2Fd243e2e5-bb0d-48a5-a5f1-b25623e524fb.webp?alt=media&token=2329aca5-1eac-4038-97b4-577cced8f2fd',
        storyName: 'Whispers of the Void',
        storyCoverUrl: 'https://placehold.co/200x300.png',
        action: 'reached Chapter 3',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    },
];

    
