

"use client";

import { analyzeChoiceAction, discoverAndAddSceneAction, recruitNewCharacterAction, generateStoryCoverAction, type GenerateCharacterDetailsOutput, type GenerateCharacterImagesOutput, generateChapterSummaryAction, generateNarratorTurnAction, generateFullStoryAction, regenerateCoverAction, regenerateCharacterImagesAction, regenerateSceneVisualAction, generateStoryMapAction, regenerateStoryMapAction, generateScenarioVisualAction, generateAudioTeaserAction } from "@/lib/actions";
import type { Character, Scene, Story, AppState, Item, Scenario, StoryHistoryEntry, Objective, ShopItem, TokenPackage, Relationship, Shelf, ReadingGoal, RelationshipEvent, Player } from "@/types";
import React, { FC } from "react";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { storyStyles, genreOptions } from "@/lib/config";
import { compressImage, getBase64Size } from "@/lib/utils";
import BookLoader from "@/components/BookLoader";
import { auth, db, uploadDataUrlToFirebase } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut, updateProfile, updateEmail } from "firebase/auth";
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc, updateDoc, query, where, writeBatch, getDoc, deleteField, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, startOfWeek } from "date-fns";


interface StoryContextType {
  stories: Story[];
  activeStoryId: string | null;
  activeStory: Story | null;
  getStoryById: (storyId: string) => Story | null;
  createStory: (storyData: Omit<Story, 'id' | 'characters' | 'scenes' | 'storyStatus' | 'storyHistory' | 'activeCharacterId' | 'locationName' | 'timeOfDay' | 'currentSceneIndex' | 'coverUrl' | 'coverSize' | 'objectives' | 'interactionsUntilNextObjective' | 'storyMode' | 'isBookmarked' | 'lastPlayedTimestamp' | 'createdAt' | 'shelfId' | 'audioTeaserUrl' | 'authorId' | 'authorName' | 'isManuallyCreated' | 'authorPhotoURL' | 'authorAboutMe' | 'teaser' | 'mapUrl' | 'lastLocationName' | 'lastRelationshipEvent' | 'language' | 'inviteCode' | 'isCoop' | 'players' | 'turnCharacterId'>, scenes: Scene[], characters: Character[]) => Promise<Story | undefined>;
  updateStory: (storyId: string, updatedData: Partial<Omit<Story, "id">>) => void;
  deleteStory: (storyId: string) => void;
  setActiveStoryId: (id: string | null) => Promise<void>;
  setActiveCharacterId: (id: string | null) => void;
  setStoryMode: (storyId: string, mode: 'immersive' | 'narrator') => Promise<void>;
  restartStory: (storyId: string) => Promise<void>;
  toggleBookmark: (storyId: string) => Promise<void>;
  addCharacter: (character: Character, cost: number) => Promise<void>;
  updateCharacter: (character: Character) => void;
  deleteCharacter: (characterId: string) => void;
  addScene: (scene: Omit<Scene, "id">, cost: number) => Promise<void>;
  removeScene: (sceneId: string) => void;
  updateScene: (sceneId: string, updatedData: Partial<Omit<Scene, "id">>) => void;
  updateSceneCoordinates: (sceneId: string, x: number, y: number) => void;
  startStory: () => Promise<void>;
  joinStory: () => Promise<void>;
  joinStoryByInviteCode: (inviteCode: string) => Promise<boolean>;
  claimCharacterInCoop: (storyId: string, characterId: string) => Promise<boolean>;
  createAndClaimCharacterInCoop: (storyId: string, characterData: Omit<Character, 'id' | 'relationships' | 'skills' | 'items' | 'defaultStats' | 'currentScenario'>) => Promise<boolean>;
  removePlayerFromCoop: (storyId: string, playerId: string) => Promise<boolean>;
  isLoading: boolean;
  activeCharacter: Character | null;
  exportStory: (storyId?: string) => void;
  signOutUser: () => Promise<void>;
  purchaseShopItem: (item: ShopItem) => Promise<void>;
  purchaseTokens: (item: TokenPackage) => Promise<void>;
  consumeToken: (amount?: number) => Promise<boolean>;
  currentUser: User | null;
  updateUserProfile: (profileData: { displayName?: string; photoURL?: string; email?: string; aboutMe?: string; }) => Promise<void>;
  
  // New regeneration functions
  regenerateStoryCover: (storyId: string) => Promise<void>;
  regenerateCharacterImages: (storyId: string, characterId: string) => Promise<void>;
  regenerateSceneVisual: (storyId: string, sceneId: string) => Promise<void>;
  regenerateStoryMap: (storyId: string) => Promise<void>;

  // Shelves
  shelves: Shelf[];
  createShelf: (name: string) => Promise<void>;
  deleteShelf: (shelfId: string) => Promise<void>;
  moveStoryToShelf: (storyId: string, newShelfId: string, oldShelfId?: string | null) => Promise<void>;
  reorderShelf: (shelfId: string, sourceIndex: number, destinationIndex: number) => Promise<void>;
  
  // Reading Goal
  readingGoal: ReadingGoal | undefined;
  chaptersReadThisWeek: number;
  setReadingGoal: (goal: ReadingGoal) => Promise<void>;

  // Daily Reward
  lastDailyRewardClaimed?: number;
  claimDailyReward: () => Promise<void>;

  // Follow authors
  followedAuthors: string[];
  followAuthor: (authorId: string) => Promise<void>;
  
  // For convenience
  characters: Character[];
  scenes: Scene[];
  storyStatus: Story['storyStatus'];
  currentScenario: Scenario | null;
  storyHistory: StoryHistoryEntry[];
  storyProgression: string;
  genre: string;
  ageRating: string;
  style: string;
  locationName: string;
  lastLocationName: string | undefined | null;
  timeOfDay: Story['timeOfDay'];
  currentSceneIndex: number;
  tokens: number;
  membershipPlan: 'Free' | 'Explorer' | 'Sculptor' | 'Admin';
  displayPlan: 'Free' | 'Explorer' | 'Sculptor' | 'Admin';
  setMembershipPlan: (plan: 'Free' | 'Explorer' | 'Sculptor' | 'Admin') => void;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  objectives: Objective[];
  bookmarks: number;
  handleStoryClick: (storyId: string) => void;
  aboutMe?: string;
  
  // Creation Limits
  monthlyCreations: number;
  creationLimit: number;
  lastRelationshipEvent?: RelationshipEvent | null;
  makeChoice: (choice: string) => Promise<void>;
  continueToNextChapter: () => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

function getRandomInteractionsCount() {
    const MIN_INTERACTIONS = 6;
    const MAX_INTERACTIONS = 8;
    return Math.floor(Math.random() * (MAX_INTERACTIONS - MIN_INTERACTIONS + 1)) + MIN_INTERACTIONS;
}

const DEFAULT_STORY_DATA: Omit<Story, 'id'> = {
  name: 'Untitled Story',
  plot: "The story has just begun.",
  genre: 'Fantasy',
  ageRating: '14+',
  style: 'fantasy',
  language: 'US English',
  isPublic: true,
  isManuallyCreated: false,
  storyMode: null,
  coverUrl: '',
  coverSize: 0,
  mapUrl: '',
  characters: [],
  scenes: [],
  activeCharacterId: null,
  storyStatus: "idle",
  storyHistory: [],
  storyProgression: "The story has just begun.",
  locationName: "Unknown Location",
  lastLocationName: null,
  timeOfDay: 'Morning',
  currentSceneIndex: 0,
  objectives: [],
  interactionsUntilNextObjective: getRandomInteractionsCount(),
  lastChapterSummary: null,
  isBookmarked: false,
  lastPlayedTimestamp: 0,
  createdAt: 0,
  shelfId: null,
  authorId: undefined,
  authorName: undefined,
  authorPhotoURL: undefined,
  authorAboutMe: undefined,
  teaser: null,
  audioTeaserUrl: null,
  lastRelationshipEvent: null,
  isCoop: false,
  inviteCode: undefined,
  players: [],
  turnCharacterId: null,
};

const MAX_BOOKMARKS = 3;
const MAX_TOKENS = 10;
const DAILY_REWARD_AMOUNT = 1;

const planLimits = {
  Free: 1,
  Explorer: 5,
  Sculptor: 10,
  Admin: Infinity,
};

const INITIAL_STATE: AppState = {
  stories: [],
  activeStoryId: null,
  membershipPlan: 'Free',
  monthlyCreations: 0,
  creationResetDate: endOfMonth(new Date()).toISOString(),
  bookmarks: MAX_BOOKMARKS,
  lastBookmarkRegen: Date.now(),
  tokens: MAX_TOKENS,
  lastTokenRegen: Date.now(),
  shelves: [],
  readingGoal: { chaptersPerWeek: 5 },
  chaptersReadThisWeek: 0,
  weekStartDate: startOfWeek(new Date()).toISOString(),
  isAdminMode: true,
  lastDailyRewardClaimed: undefined,
  followedAuthors: [],
  aboutMe: undefined,
};

export const StoryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Set up real-time listeners for stories
  useEffect(() => {
    if (!currentUser) return;
  
    const processSnapshot = (querySnapshot: any): Story[] => {
      const stories: Story[] = [];
      querySnapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        stories.push({
          ...DEFAULT_STORY_DATA,
          ...data,
          id: docSnap.id,
          characters: (data.characters || []).map((c: any) => ({
            ...c,
            isPlayable: c.isPlayable === undefined ? true : c.isPlayable,
          })),
        } as Story);
      });
      return stories;
    };
  
    const unsubscribes: (() => void)[] = [];
    const storyMap = new Map<string, Story>();

    const updateStateWithNewStories = (newStories: Story[]) => {
      newStories.forEach(s => storyMap.set(s.id, s));
      setState(prevState => ({ ...prevState, stories: Array.from(storyMap.values()) }));
    };

    // 1. Listen to all public stories
    const publicQuery = query(collection(db, "stories"), where("isPublic", "==", true));
    unsubscribes.push(onSnapshot(publicQuery, (snapshot) => {
        updateStateWithNewStories(processSnapshot(snapshot));
    }, (error) => console.error("Error listening to public stories:", error)));

    // 2. Listen to user's private stories
    const privateQuery = query(collection(db, "users", currentUser.uid, "stories"));
    unsubscribes.push(onSnapshot(privateQuery, (snapshot) => {
        updateStateWithNewStories(processSnapshot(snapshot));
    }, (error) => console.error("Error listening to user stories:", error)));

    // 3. Listen to all stories where the user is a player (for co-op)
    const coOpQuery = query(collection(db, "stories"), where("players", "array-contains", {userId: currentUser.uid, characterId: state.stories.find(s => s.players?.some(p => p.userId === currentUser.uid))?.players?.find(p => p.userId === currentUser.uid)?.characterId }));
    unsubscribes.push(onSnapshot(coOpQuery, (snapshot) => {
        const playerStories = processSnapshot(snapshot).filter(s => s.players?.some(p => p.userId === currentUser.uid));
        updateStateWithNewStories(playerStories);
    }, (error) => console.error("Error listening to co-op stories:", error)));
  
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser]);


  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
  
    const generateNewStoryPeriodically = async () => {
      if (!currentUser) return;
  
      console.log('Auto-generating a new story...');
      try {
        const randomGenre = genreOptions[Math.floor(Math.random() * genreOptions.length)].name;
        
        const { storyData, scenes, characters } = await generateFullStoryAction({ genre: randomGenre });
        
        const finalStoryData = { ...storyData, isPublic: true, language: 'US English' as const, isCoop: false };
        await createStory(finalStoryData, scenes, characters);
        
        toast({
          title: "A New Story Has Appeared!",
          description: `A new adventure, "${storyData.name}", has been discovered in the world. Check your library!`,
          duration: 10000,
        });

      } catch (error) {
        console.error("Failed to auto-generate story:", error);
      } finally {
        scheduleNextGeneration();
      }
    };
  
    const scheduleNextGeneration = () => {
      if (timerId) clearTimeout(timerId);
      const randomInterval = (50 + Math.random() * 20) * 60 * 1000;
      timerId = setTimeout(generateNewStoryPeriodically, randomInterval);
    };
  
    if (currentUser) {
      scheduleNextGeneration();
    }
  
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentUser]);

  const updateAppState = async (updatedData: Partial<AppState>) => {
    if (!currentUser) return;

    // This is a robust way to strip undefined values before saving to Firestore.
    const cleanData = JSON.parse(JSON.stringify(updatedData));

    setState((prevState) => ({ ...prevState, ...cleanData }));

    if (Object.keys(cleanData).length > 0) {
        try {
            const appStateDocRef = doc(db, 'users', currentUser.uid, 'appState', 'main');
            await setDoc(appStateDocRef, cleanData, { merge: true });
        } catch (error) {
            console.error("Failed to update app state in Firestore:", error);
            // Optionally, revert the local state change if the DB update fails
            // Or show an error toast to the user.
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Could not save changes to the cloud.",
            });
        }
    }
};

  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);

    // Listener for app state
    const appStateDocRef = doc(db, "users", currentUser.uid, "appState", "main");
    const unsubscribeAppState = onSnapshot(appStateDocRef, (docSnap) => {
        const appData = docSnap.data() || {};
        let { 
          activeStoryId = null, 
          membershipPlan = 'Free', 
          monthlyCreations = 0,
          creationResetDate = endOfMonth(new Date()).toISOString(),
          bookmarks = MAX_BOOKMARKS,
          lastBookmarkRegen = Date.now(),
          tokens = MAX_TOKENS,
          lastTokenRegen = Date.now(),
          shelves = [],
          readingGoal = { chaptersPerWeek: 5 },
          chaptersReadThisWeek = 0,
          weekStartDate = startOfWeek(new Date()).toISOString(),
          isAdminMode = true,
          lastDailyRewardClaimed = undefined,
          followedAuthors = [],
          aboutMe = undefined,
        } = appData;

        if (currentUser.displayName === "Den") {
          membershipPlan = 'Admin';
        } else {
          isAdminMode = false;
        }
        
        setState(prevState => ({ ...prevState, activeStoryId, membershipPlan, monthlyCreations, creationResetDate, bookmarks, lastBookmarkRegen, tokens, lastTokenRegen, shelves, readingGoal, chaptersReadThisWeek, weekStartDate, isAdminMode, lastDailyRewardClaimed, followedAuthors, aboutMe }));
        setIsLoading(false);
    });

    return () => {
        unsubscribeAppState();
    };
  }, [currentUser]);

  const activeStory = state.stories.find(s => s.id === state.activeStoryId) || null;
  const activeCharacter = activeStory?.characters.find(c => c.id === activeStory.activeCharacterId) || null;
  
  const getStoryById = (storyId: string) => {
    return state.stories.find(s => s.id === storyId) || null;
  };
  
  const handleStoryClick = (storyId: string) => {
    router.push(`/book/${storyId}`);
  };

  const updateStory = async (storyId: string, updatedData: Partial<Omit<Story, "id">>) => {
    if (!currentUser) return;

    const storyToUpdate = state.stories.find(s => s.id === storyId);
    if (!storyToUpdate) return;
  
    setState(prevState => ({
      ...prevState,
      stories: prevState.stories.map(s =>
        s.id === storyId ? { ...s, ...updatedData } as Story : s
      ),
    }));
  
    const collectionName = storyToUpdate.isCoop || storyToUpdate.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
    const storyDocRef = doc(db, collectionName, storyId);
    await setDoc(storyDocRef, updatedData, { merge: true });
  };
  
  const createStory = async (storyData: Omit<Story, 'id' | 'characters' | 'scenes' | 'storyStatus' | 'storyHistory' | 'activeCharacterId' | 'locationName' | 'timeOfDay' | 'currentSceneIndex' | 'coverUrl' | 'coverSize' | 'objectives' | 'interactionsUntilNextObjective' | 'storyMode' | 'isBookmarked' | 'lastPlayedTimestamp' | 'createdAt' | 'shelfId' | 'audioTeaserUrl' | 'authorId' | 'authorName' | 'isManuallyCreated' | 'authorPhotoURL' | 'authorAboutMe' | 'teaser' | 'mapUrl' | 'lastLocationName' | 'lastRelationshipEvent' | 'language' | 'inviteCode' | 'isCoop' | 'players' | 'turnCharacterId'>, scenes: Scene[], characters: Character[]): Promise<Story | undefined> => {
    if (!currentUser) throw new Error("User not authenticated.");
    
    const limit = planLimits[state.membershipPlan];
    if ((state.monthlyCreations ?? 0) >= limit) {
      toast({
        variant: "destructive",
        title: "Creation Limit Reached",
        description: `You have reached your monthly limit of ${limit} stories. Please upgrade your plan to create more.`,
      });
      return;
    }
    
    setIsLoading(true);

    try {
        const selectedStyle = storyStyles.find(s => s.value === storyData.style);
        if (!selectedStyle) {
            throw new Error("Invalid style selected. Please select a valid visual style.");
        }

        const [coverResult, mapResult, audioResult] = await Promise.all([
            generateStoryCoverAction({ title: storyData.name, genre: storyData.genre, plot: storyData.plot, stylePrompt: selectedStyle.characterPromptModifier }),
            generateStoryMapAction({ genre: storyData.genre, plot: storyData.plot }),
            generateAudioTeaserAction({ title: storyData.name, genre: storyData.genre, plot: storyData.plot }).catch(() => null)
        ]);
        
        if (!coverResult?.coverUrl) throw new Error("The AI failed to generate a cover image.");
        if (!mapResult?.mapUrl) throw new Error("The AI failed to generate a world map.");
        
        const compressedCover = await compressImage(coverResult.coverUrl, { quality: 0.8, maxWidth: 400, maxHeight: 600 });
        const compressedMap = await compressImage(mapResult.mapUrl, { quality: 0.7, maxWidth: 1024, maxHeight: 1536 });

        const [finalCoverUrl, finalMapUrl] = await Promise.all([
            uploadDataUrlToFirebase(compressedCover, 'covers'),
            uploadDataUrlToFirebase(compressedMap, 'maps')
        ]);
        
        const finalScenes = await Promise.all(scenes.map(async scene => {
            const url = await uploadDataUrlToFirebase(scene.url, 'scene-images');
            return { ...scene, url };
        }));

        const finalCharacters = await Promise.all(characters.map(async char => {
            const [profileUrl, inGameUrl] = await Promise.all([
                uploadDataUrlToFirebase(char.profileImageUrl, 'character-images'),
                uploadDataUrlToFirebase(char.inGameImageUrl, 'character-images')
            ]);
            return { ...char, profileImageUrl: profileUrl, inGameImageUrl: inGameUrl };
        }));

        const finalCharactersWithRelationships = finalCharacters.map(char => {
            const otherCharIds = finalCharacters.filter(c => c.id !== char.id).map(c => c.id);
            const existingRels = new Map((char.relationships || []).map(r => [r.targetCharacterId, r]));
            
            for (const otherId of otherCharIds) {
                if (!existingRels.has(otherId)) {
                    existingRels.set(otherId, { targetCharacterId: otherId, value: 0 });
                }
            }
            return { ...char, relationships: Array.from(existingRels.values()) };
        });

        const mainPlayableCharacter = finalCharactersWithRelationships.find(c => c.isPlayable);

        let players: Player[] = [];
        if (storyData.isCoop) {
            // Only add creator as a player if they are not an Admin
            if (mainPlayableCharacter && state.membershipPlan !== 'Admin') {
                players.push({
                    userId: currentUser.uid,
                    characterId: mainPlayableCharacter.id,
                    displayName: currentUser.displayName || "Player 1",
                    photoURL: currentUser.photoURL || undefined,
                });
            }
        }

        const newStoryForDb: Omit<Story, 'id'> = {
            ...DEFAULT_STORY_DATA,
            name: storyData.name,
            plot: storyData.plot,
            genre: storyData.genre,
            ageRating: storyData.ageRating,
            style: storyData.style,
            language: storyData.language || 'US English',
            isPublic: storyData.isPublic,
            isManuallyCreated: storyData.isManuallyCreated || false,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || "Anonymous",
            authorPhotoURL: currentUser.photoURL || undefined,
            authorAboutMe: state.aboutMe,
            isBookmarked: false,
            lastPlayedTimestamp: Date.now(),
            createdAt: Date.now(),
            coverUrl: finalCoverUrl,
            coverSize: getBase64Size(compressedCover),
            mapUrl: finalMapUrl,
            characters: finalCharactersWithRelationships,
            scenes: finalScenes,
            activeCharacterId: mainPlayableCharacter ? mainPlayableCharacter.id : null,
            locationName: finalScenes[0]?.name || "Starting Location",
            audioTeaserUrl: audioResult?.audioUrl ?? null,
            storyMode: storyData.isCoop ? 'immersive' : null,
            teaser: null,
            lastRelationshipEvent: null,
            isCoop: storyData.isCoop || false,
            inviteCode: storyData.isCoop ? crypto.randomUUID().slice(0, 6).toUpperCase() : undefined,
            players,
            turnCharacterId: storyData.isCoop && players.length > 0 ? players[0].characterId : null,
        };

        const collectionName = newStoryForDb.isCoop || newStoryForDb.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
        const storiesCollectionRef = collection(db, collectionName);
        const newDocRef = await addDoc(storiesCollectionRef, newStoryForDb);

        const finalStory: Story = { ...newStoryForDb, id: newDocRef.id };
        
        const newMonthlyCreations = (state.monthlyCreations ?? 0) + 1;

        setState(prevState => ({
            ...prevState,
            stories: [...prevState.stories, finalStory],
            activeStoryId: finalStory.id,
            monthlyCreations: newMonthlyCreations,
        }));
        
        if (finalStory.isManuallyCreated) {
            toast({
                variant: "success",
                title: "Your new story is live!",
                description: `Followers will be notified about "${finalStory.name}".`,
            });
        }

        const appStateDocRef = doc(db, "users", currentUser.uid, "appState", "main");
        await setDoc(appStateDocRef, { activeStoryId: finalStory.id, monthlyCreations: newMonthlyCreations }, { merge: true });
        
        return finalStory;
    } finally {
        setIsLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!currentUser) return;
    
    const storyToDelete = state.stories.find(s => s.id === storyId);
    if (!storyToDelete) return;
    
    setState(prevState => ({
      ...prevState,
      stories: prevState.stories.filter(s => s.id !== storyId),
      activeStoryId: prevState.activeStoryId === storyId ? null : prevState.activeStoryId,
    }));

    try {
      const collectionName = storyToDelete.isCoop || storyToDelete.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
      await deleteDoc(doc(db, collectionName, storyId));
      
      if (state.activeStoryId === storyId) {
        const appStateDocRef = doc(db, "users", currentUser.uid, "appState", "main");
        await setDoc(appStateDocRef, { activeStoryId: null }, { merge: true });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      setState(prevState => ({...prevState, stories: [...prevState.stories, storyToDelete]}));
    }
  };
  
  const setActiveStoryId = async (id: string | null) => {
    setState((prevState) => {
      const storyToActivate = prevState.stories.find(s => s.id === id);
      if (id && !storyToActivate) {
          console.warn(`Attempted to activate a non-existent story ID: ${id}`);
          return prevState;
      }
      return { ...prevState, activeStoryId: id };
    });
  
    if (currentUser) {
      const appStateDocRef = doc(db, 'users', currentUser.uid, 'appState', 'main');
      await setDoc(appStateDocRef, { activeStoryId: id }, { merge: true });
    }
  };

  const setStoryMode = async (storyId: string, mode: 'immersive' | 'narrator') => {
    if (!currentUser) return;
    await updateStory(storyId, { storyMode: mode });
  };
  
  const toggleBookmark = async (storyId: string) => {
    if (!currentUser) return;
    const story = state.stories.find(s => s.id === storyId);
    if (!story) return;
    await updateStory(storyId, { isBookmarked: !story.isBookmarked });
  };

  const restartStory = async (storyId: string) => {
    if (!currentUser) return;
    
    const storyToReset = state.stories.find(s => s.id === storyId);
    if (!storyToReset) return;

    const resetCharacters = storyToReset.characters.map(char => ({
      ...char,
      ...char.defaultStats,
      currentScenario: null,
      level: 1,
      xp: 0,
      unspentStatPoints: 0,
      skills: [],
      relationships: char.relationships.map(rel => ({ ...rel, value: 0 })),
    }));

    const resetStoryData: Partial<Story> = {
      storyHistory: [],
      storyStatus: 'idle',
      storyProgression: storyToReset.plot,
      timeOfDay: 'Morning',
      currentSceneIndex: 0,
      locationName: storyToReset.scenes[0]?.name || "Starting Location",
      lastLocationName: null,
      objectives: [],
      interactionsUntilNextObjective: getRandomInteractionsCount(),
      lastChapterSummary: null,
      storyMode: null,
      activeCharacterId: storyToReset.characters.find(c => c.isPlayable)?.id || null,
      characters: resetCharacters,
    };
    
    await updateStory(storyId, resetStoryData);
  };
  
  const setMembershipPlan = async (plan: 'Free' | 'Explorer' | 'Sculptor' | 'Admin') => {
    await updateAppState({ membershipPlan: plan });
  };

  const toggleAdminMode = async () => {
    await updateAppState({ isAdminMode: !state.isAdminMode });
  }

  const setActiveCharacterId = (id: string | null) => {
    if (activeStory) {
      updateStory(activeStory.id, { activeCharacterId: id });
    }
  };

  const addCharacter = async (character: Character, cost: number) => {
    if (!activeStory || !currentUser) return;
    
    if ((state.tokens ?? 0) < cost) {
      toast({
        variant: "destructive",
        title: "Not enough tokens!",
        description: `You need ${cost} tokens to create a new character.`,
      });
      return;
    }
    
    setIsLoading(true);
    try {
        const [profileUrl, inGameUrl] = await Promise.all([
          uploadDataUrlToFirebase(character.profileImageUrl, `characters/${activeStory.id}`),
          uploadDataUrlToFirebase(character.inGameImageUrl, `characters/${activeStory.id}`)
        ]);

        let newCharacter = { ...character, profileImageUrl: profileUrl, inGameImageUrl: inGameUrl, currentScenario: null };

        const existingCharacters = activeStory.characters;
        newCharacter.relationships = existingCharacters.map(c => ({ targetCharacterId: c.id, value: 0 }));

        const updatedExistingCharacters = existingCharacters.map(c => ({
            ...c,
            relationships: [...(c.relationships || []), { targetCharacterId: newCharacter.id, value: 0 }]
        }));
        
        await updateStory(activeStory.id, {
          characters: [...updatedExistingCharacters, newCharacter],
          activeCharacterId: character.isPlayable ? character.id : activeStory.activeCharacterId,
        });
        await updateAppState({ tokens: (state.tokens ?? 0) - cost });

    } catch(e) {
        console.error("Failed to add character", e);
    } finally {
        setIsLoading(false);
    }
  };

  const updateCharacter = (updatedCharacter: Character) => {
    if (!activeStory) return;
    updateStory(activeStory.id, {
      characters: activeStory.characters.map((char) =>
        char.id === updatedCharacter.id ? updatedCharacter : char
      ),
    });
  };

  const deleteCharacter = (characterId: string) => {
    if (!activeStory) return;

    const remainingCharacters = activeStory.characters
        .filter((char) => char.id !== characterId)
        .map(char => ({
            ...char,
            relationships: (char.relationships || []).filter(rel => rel.targetCharacterId !== characterId)
        }));

    updateStory(activeStory.id, {
        characters: remainingCharacters,
        activeCharacterId: activeStory.activeCharacterId === characterId ? null : activeStory.activeCharacterId,
    });
  };

  const addScene = async (sceneData: Omit<Scene, "id">, cost: number) => {
    if (!activeStory || !currentUser) return;

    if (cost > 0 && (state.tokens ?? 0) < cost) {
       toast({
        variant: "destructive",
        title: "Not enough tokens!",
        description: `You need ${cost} tokens to create a new scene.`,
      });
      return;
    }
    
    setIsLoading(true);
    try {
        const uploadedUrl = await uploadDataUrlToFirebase(sceneData.url, `scenes/${activeStory.id}`);
        const newScene = { ...sceneData, id: crypto.randomUUID(), url: uploadedUrl };
        
        const newHistoryEntry: StoryHistoryEntry = {
            characterId: activeCharacter?.id || "system",
            characterName: activeCharacter?.name || "System",
            characterProfileImageUrl: activeCharacter?.profileImageUrl || "",
            choice: `Discovered a new location: ${newScene.name}.`,
            outcomeDescription: `The world expands as ${newScene.name} is now known.`,
            visualUrl: newScene.url,
            timestamp: Date.now(),
            toLocationName: newScene.name,
        };
        
        await updateStory(activeStory.id, {
          scenes: [...(activeStory.scenes || []), newScene],
          storyHistory: [...(activeStory.storyHistory || []), newHistoryEntry],
        });
        
        if (cost > 0) {
          await updateAppState({ tokens: (state.tokens ?? 0) - cost });
        }

    } catch (e) {
        console.error("Failed to add scene", e);
    } finally {
        setIsLoading(false);
    }
  };

  const removeScene = (sceneId: string) => {
    if (!activeStory) return;
    updateStory(activeStory.id, {
      scenes: (activeStory.scenes || []).filter((scene) => scene.id !== sceneId)
    });
  };
  
  const updateScene = (sceneId: string, updatedData: Partial<Omit<Scene, "id">>) => {
    if (!activeStory) return;
    updateStory(activeStory.id, {
      scenes: (activeStory.scenes || []).map((scene) =>
        scene.id === sceneId ? { ...scene, ...updatedData } : scene
      ),
    });
  };
  
  const updateSceneCoordinates = (sceneId: string, x: number, y: number) => {
    if (!activeStory) return;
    const updatedScenes = (activeStory.scenes || []).map(scene => 
      scene.id === sceneId ? { ...scene, x, y } : scene
    );
    updateStory(activeStory.id, { scenes: updatedScenes });
  };

  const startStory = async () => {
    if (!activeStory) return;
    
    let updateData: Partial<Story> = {
        storyStatus: 'playing',
        lastPlayedTimestamp: Date.now(),
    };
    
    if (activeStory.isCoop) {
        if (!activeStory.players || activeStory.players.length === 0) {
            toast({ variant: 'destructive', title: 'Cannot Start', description: 'No players in the lobby.' });
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * activeStory.players.length);
        const firstPlayerCharacterId = activeStory.players[randomIndex]?.characterId ?? null;
        const firstScene = (activeStory.scenes || [])[0];

        if (!firstScene) {
            toast({ variant: 'destructive', title: 'Cannot Start Story', description: 'This story has no scenes.' });
            return;
        }

        const initialScenario: Scenario = { description: activeStory.plot };
        const updatedCharacters = activeStory.characters.map(c => ({...c, currentScenario: initialScenario}));
        
        updateData = {
          ...updateData,
          turnCharacterId: firstPlayerCharacterId,
          storyHistory: [],
          locationName: firstScene.name,
          lastLocationName: null,
          currentSceneIndex: 0,
          characters: updatedCharacters,
        };
    } else {
        if (!activeCharacter) {
            toast({ variant: 'destructive', title: 'No Active Character', description: 'Please select a character before starting.' });
            return;
        }
        const firstScene = (activeStory.scenes || [])[0];
        if (!firstScene) {
            toast({ variant: 'destructive', title: 'Cannot Start Story', description: 'This story has no scenes.' });
            return;
        }
        const initialScenario: Scenario = { description: activeStory.plot };
        const updatedCharacter: Character = { ...activeCharacter, currentScenario: initialScenario };
        updateData = {
            ...updateData,
            storyHistory: [],
            locationName: firstScene.name,
            lastLocationName: null,
            currentSceneIndex: 0,
            characters: activeStory.characters.map((c) => c.id === updatedCharacter.id ? updatedCharacter : c),
        };
    }
  
    await updateStory(activeStory.id, updateData);
};

  const joinStory = async () => {
    if (!activeStory || !activeCharacter) return;
    setIsLoading(true);
    try {
       const scenario: Scenario = {
        description: `With determination in their eyes, ${activeCharacter.name} steps into the unfolding narrative, ready to make their mark on the world. The current situation is: ${activeStory.storyProgression}`,
      };

      const updatedCharacter = { ...activeCharacter, currentScenario: scenario };
      
      await updateStory(activeStory.id, {
        lastPlayedTimestamp: Date.now(),
        characters: activeStory.characters.map(c => c.id === activeCharacter.id ? updatedCharacter : c)
      });

    } finally {
        setIsLoading(false);
    }
  };
  
  const consumeToken = async (amount: number = 1): Promise<boolean> => {
    if ((state.tokens ?? 0) < amount) {
      return false;
    }
    
    let newRegenTime = state.lastTokenRegen ?? Date.now();
    if (state.tokens === MAX_TOKENS) {
        newRegenTime = Date.now();
    }
    await updateAppState({ tokens: (state.tokens ?? amount) - amount, lastTokenRegen: newRegenTime });
    return true;
  };

  const makeChoice = async (choice: string) => {
    if (!activeStory || !activeCharacter) return;
    
    if ((activeStory.storyHistory || []).length >= 400) {
      await updateStory(activeStory.id, { storyStatus: 'ended' });
      toast({
          title: "The End",
          description: "You have reached the maximum number of choices for this story.",
      });
      return;
    }

    setIsLoading(true);
    try {
      let nextTurnCharacterId = activeStory.turnCharacterId;
      if (activeStory.isCoop && activeStory.players && activeStory.players.length > 1) {
          const currentPlayerIndex = activeStory.players.findIndex(p => p.characterId === activeStory.turnCharacterId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % activeStory.players.length;
          nextTurnCharacterId = activeStory.players[nextPlayerIndex].characterId;
      }

      if (activeStory.storyMode === 'narrator') {
          const narratorInput = {
            choice,
            character: { ...activeCharacter, skills: [], relationships: [] },
            scenes: (activeStory.scenes || []).map(s => ({ id: s.id, name: s.name })),
            otherCharacters: [],
            storyProgression: activeStory.storyProgression,
            scenario: activeCharacter.currentScenario?.description || "An unknown location.",
            locationName: activeStory.locationName,
            genre: activeStory.genre,
            ageRating: activeStory.ageRating,
            language: activeStory.language,
            timeOfDay: activeStory.timeOfDay,
            style: activeStory.style,
            objectives: [],
            shouldCreateNewObjective: false,
          };
          
          const effects = await generateNarratorTurnAction(narratorInput);
          
          const sceneIdx = (activeStory.scenes || []).findIndex(s => s.id === effects.selectedSceneId);
          const newSceneIndex = sceneIdx !== -1 ? sceneIdx : activeStory.currentSceneIndex;

          const updatedCharacter = {
              ...activeCharacter,
              currentScenario: { description: effects.newScenario }
          };

          const newHistoryEntry: StoryHistoryEntry = {
              characterId: activeCharacter.id,
              characterName: activeCharacter.name,
              characterProfileImageUrl: activeCharacter.profileImageUrl,
              choice,
              outcomeDescription: effects.newScenario,
              visualUrl: activeStory.scenes[newSceneIndex]?.url || '',
              timestamp: Date.now(),
          };

          const newStoryHistory = [...activeStory.storyHistory, newHistoryEntry];
          const storyUpdates: Partial<Story> = {
              storyStatus: 'playing',
              storyProgression: effects.storyProgressionEffects,
              locationName: effects.newLocationName,
              timeOfDay: effects.timeOfDay,
              currentSceneIndex: newSceneIndex,
              storyHistory: newStoryHistory,
              lastPlayedTimestamp: Date.now(),
              characters: activeStory.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c),
              turnCharacterId: nextTurnCharacterId,
          };
          
          if (newStoryHistory.length % 10 === 0 && newStoryHistory.length > 0) {
            const lastTenChoices = newStoryHistory.slice(-10).map(h => ({
                characterName: h.characterName,
                choice: h.choice,
                outcomeDescription: h.outcomeDescription,
            }));
            
            const summaryResult = await generateChapterSummaryAction({
                genre: activeStory.genre,
                plot: activeStory.plot,
                lastTenChoices,
            });

            storyUpdates.storyStatus = 'chapter-end';
            storyUpdates.lastChapterSummary = summaryResult.summary;
          }

          await updateStory(activeStory.id, storyUpdates);

      } else {
          const activeObjectives = (activeStory.objectives || []).filter(o => o.status === 'active');
          
          let interactions = activeStory.interactionsUntilNextObjective ?? getRandomInteractionsCount();
          interactions--;
          const shouldCreateNewObjective = interactions <= 0;

          const effects = await analyzeChoiceAction({
            choice,
            character: activeCharacter,
            storyState: activeStory,
            objectives: activeObjectives,
            shouldCreateNewObjective,
          });
          
          let finalScenes = [...(activeStory.scenes || [])];
          if (effects.storyUpdate.newScene) {
            const newSceneData = effects.storyUpdate.newScene;
            const visualResult = await generateScenarioVisualAction({ scenarioDescription: newSceneData.prompt });
            const uploadedUrl = await uploadDataUrlToFirebase(visualResult.url, `scenes/${activeStory.id}`);
            const newScene: Scene = {
              id: crypto.randomUUID(),
              name: newSceneData.name,
              prompt: newSceneData.prompt,
              url: uploadedUrl,
              style: activeStory.style,
              x: Math.round(Math.random() * 80 + 10), // Avoid edges
              y: Math.round(Math.random() * 80 + 10), // Avoid edges
            };
            finalScenes.push(newScene);
            effects.storyUpdate.selectedSceneId = newScene.id;
          }
          
          const sceneIdx = finalScenes.findIndex(s => s.id === effects.storyUpdate.selectedSceneId);
          const newSceneIndex = sceneIdx !== -1 ? sceneIdx : activeStory.currentSceneIndex;

          let finalObjectives = [...(activeStory.objectives || [])];
          let tokensReward = 0;

          if (effects.storyUpdate.completedObjectiveId) {
              const objectiveId = effects.storyUpdate.completedObjectiveId;
              const objective = finalObjectives.find(o => o.id === objectiveId);
              if (objective) {
                  objective.status = 'completed';
                  if (state.membershipPlan !== 'Free') {
                      tokensReward = objective.tokenReward;
                      toast({
                          variant: "success",
                          title: `Objective Complete: ${objective.description}`,
                          description: `+${objective.tokenReward} Tokens rewarded!`,
                      });
                  } else {
                      toast({
                          variant: "success",
                          title: `Objective Complete: ${objective.description}`,
                          description: `Upgrade to a premium plan to earn Token rewards!`,
                      });
                  }
              }
          }

          if (effects.storyUpdate.newObjective) {
              const newObjective: Objective = {
                  id: crypto.randomUUID(),
                  description: effects.storyUpdate.newObjective.description,
                  tokenReward: effects.storyUpdate.newObjective.tokenReward,
                  status: 'active',
              };
              finalObjectives.push(newObjective);
              toast({
                  title: "New Objective!",
                  description: newObjective.description,
              });
          }

          let newInteractionsValue = interactions;
          if (shouldCreateNewObjective && effects.storyUpdate.newObjective) {
              newInteractionsValue = getRandomInteractionsCount();
          }

          const characterStatUpdates = effects.characterUpdate;
          const updatedCharactersMap = new Map(activeStory.characters.map(c => [c.id, { ...c }]));
          const activeCharacterToUpdate = updatedCharactersMap.get(activeCharacter.id)!;

          activeCharacterToUpdate.health = characterStatUpdates.health;
          activeCharacterToUpdate.money = characterStatUpdates.money;
          activeCharacterToUpdate.happiness = characterStatUpdates.happiness;
          activeCharacterToUpdate.items = characterStatUpdates.items;

          if (characterStatUpdates.xp > 0) {
            activeCharacterToUpdate.xp += characterStatUpdates.xp;
            let xpForNextLevel = activeCharacterToUpdate.level * 100;
            if (activeCharacterToUpdate.xp >= xpForNextLevel) {
              activeCharacterToUpdate.level += 1;
              activeCharacterToUpdate.unspentStatPoints += 1;
              toast({
                  variant: "success",
                  title: "Level Up!",
                  description: `${activeCharacterToUpdate.name} is now level ${activeCharacterToUpdate.level}! You have a new stat point to spend.`
              });
            } else {
                toast({ title: "Experience Gained!", description: `+${characterStatUpdates.xp} XP` });
            }
          }
          if (characterStatUpdates.unspentStatPoints > 0) {
            activeCharacterToUpdate.unspentStatPoints += characterStatUpdates.unspentStatPoints;
          }
          
          activeCharacterToUpdate.currentScenario = { 
            description: effects.storyUpdate.newScenario,
            interactingNpcName: effects.storyUpdate.interactingNpcName,
            requiredNextCharacterName: effects.storyUpdate.requiredNextCharacterName,
          };
          
          const relationshipUpdates = effects.storyUpdate.relationshipChanges;
          const newHistoryEntry: StoryHistoryEntry = {
            characterId: activeCharacter.id,
            characterName: activeCharacter.name,
            characterProfileImageUrl: activeCharacter.profileImageUrl,
            choice,
            outcomeDescription: effects.storyUpdate.newScenario,
            outcomeNpcName: effects.storyUpdate.interactingNpcName,
            visualUrl: finalScenes[newSceneIndex]?.url || '',
            timestamp: Date.now(),
            relationshipChanges: relationshipUpdates || [],
          };
          
          if (relationshipUpdates && relationshipUpdates.length > 0) {
            for (const update of relationshipUpdates) {
              const { targetCharacterId, change } = update;
              
              const activeRels = [...(activeCharacterToUpdate.relationships || [])];
              const activeRelIndex = activeRels.findIndex(r => r.targetCharacterId === targetCharacterId);
              if (activeRelIndex > -1) {
                  activeRels[activeRelIndex].value = Math.max(-100, Math.min(100, activeRels[activeRelIndex].value + change));
              } else {
                  activeRels.push({ targetCharacterId, value: change });
              }
              activeCharacterToUpdate.relationships = activeRels;

              const targetCharToUpdate = updatedCharactersMap.get(targetCharacterId);
              if (targetCharToUpdate) {
                  const targetRels = [...(targetCharToUpdate.relationships || [])];
                  const targetRelIndex = targetRels.findIndex(r => r.targetCharacterId === activeCharacter.id);
                  if (targetRelIndex > -1) {
                      targetRels[targetRelIndex].value = Math.max(-100, Math.min(100, targetRels[targetRelIndex].value + change));
                  } else {
                      targetRels.push({ targetCharacterId: activeCharacter.id, value: change });
                  }
                  targetCharToUpdate.relationships = targetRels;
              }
            }
          }

          const newStoryHistory = [...activeStory.storyHistory, newHistoryEntry];
          const storyUpdates: Partial<Story> = {
              storyStatus: 'playing',
              storyProgression: effects.storyUpdate.storyProgressionEffects,
              locationName: effects.storyUpdate.newLocationName,
              timeOfDay: effects.storyUpdate.timeOfDay,
              currentSceneIndex: newSceneIndex,
              storyHistory: newStoryHistory,
              lastPlayedTimestamp: Date.now(),
              characters: Array.from(updatedCharactersMap.values()),
              scenes: finalScenes,
              objectives: finalObjectives,
              interactionsUntilNextObjective: newInteractionsValue,
              turnCharacterId: nextTurnCharacterId,
          };

          if (effects.storyUpdate.relationshipEvent) {
            const char1 = activeCharacterToUpdate;
            const otherCharId = effects.storyUpdate.relationshipUpdates?.find(ru => ru.targetCharacterId !== char1.id)?.targetCharacterId || effects.storyUpdate.relationshipUpdates?.[0]?.targetCharacterId;
            const char2 = updatedCharactersMap.get(otherCharId!);

            if (char1 && char2) {
              const eventImageUrl = await generateScenarioVisualAction({ scenarioDescription: effects.storyUpdate.relationshipEvent.imagePrompt });
              storyUpdates.storyStatus = 'relationship-event';
              storyUpdates.lastRelationshipEvent = {
                character1: char1,
                character2: char2,
                description: effects.storyUpdate.relationshipEvent.description,
                imageUrl: eventImageUrl.url,
              };
            }
          } else if (newStoryHistory.length % 10 === 0 && newStoryHistory.length > 0) {
            const lastTenChoices = newStoryHistory.slice(-10).map(h => ({
                characterName: h.characterName,
                choice: h.choice,
                outcomeDescription: h.outcomeDescription,
            }));
            const summaryResult = await generateChapterSummaryAction({
                genre: activeStory.genre,
                plot: activeStory.plot,
                lastTenChoices,
            });
            storyUpdates.storyStatus = 'chapter-end';
            storyUpdates.lastChapterSummary = summaryResult.summary;
          }
          
          await updateStory(activeStory.id, storyUpdates);
          if (tokensReward > 0) {
            await updateAppState({ tokens: (state.tokens ?? 0) + tokensReward });
          }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const continueToNextChapter = async () => {
    if (!activeStory) return;
    
    if ((state.bookmarks ?? 0) < 1) {
        toast({
            variant: "destructive",
            title: "Out of Bookmarks",
            description: "You need a bookmark to start the next chapter. Bookmarks regenerate hourly."
        });
        return;
    }

    const newBookmarkCount = (state.bookmarks ?? 1) - 1;
    let newRegenTime = state.lastBookmarkRegen ?? Date.now();
    if (state.bookmarks === MAX_BOOKMARKS) {
        newRegenTime = Date.now();
    }
    
    await updateAppState({ 
        bookmarks: newBookmarkCount, 
        lastBookmarkRegen: newRegenTime,
        chaptersReadThisWeek: (state.chaptersReadThisWeek ?? 0) + 1,
    });

    await updateStory(activeStory.id, { storyStatus: 'playing', lastChapterSummary: null });
  };

  const purchaseShopItem = async (item: ShopItem) => {
    if (!activeStory || !currentUser) return;

    if ((state.tokens ?? 0) < item.cost) {
      toast({ variant: 'destructive', title: 'Not enough tokens!' });
      return;
    }
    
    if (item.type === 'skill' && !activeCharacter) {
      toast({ variant: 'destructive', title: 'No active character', description: 'Please select a character to learn a skill.' });
      return;
    }

    setIsLoading(true);
    try {
        const newTokens = (state.tokens ?? 0) - item.cost;
        await updateAppState({ tokens: newTokens });

        let storyUpdates: Partial<Story> = {};

        let toastTitle = "Purchase Successful!";
        let toastDescription = "";

        if (item.type === 'action') {
            if (item.id === 'discover_new_scene') {
                const newSceneData = await discoverAndAddSceneAction({
                    genre: activeStory.genre,
                    plot: activeStory.plot,
                    style: activeStory.style,
                    existingSceneNames: (activeStory.scenes || []).map(s => s.name),
                    x: Math.round(Math.random() * 80 + 10),
                    y: Math.round(Math.random() * 80 + 10),
                });
                
                const url = await uploadDataUrlToFirebase(newSceneData.url, `scenes/${activeStory.id}`);

                const newScene: Scene = {
                    ...newSceneData,
                    id: crypto.randomUUID(),
                    url,
                };
                
                const newHistoryEntry: StoryHistoryEntry = {
                    characterId: activeCharacter?.id || "system",
                    characterName: activeCharacter?.name || "System",
                    characterProfileImageUrl: activeCharacter?.profileImageUrl || "",
                    choice: `Discovered a new location: ${newScene.name}.`,
                    outcomeDescription: `The world expands as ${newScene.name} is now known.`,
                    visualUrl: newScene.url,
                    timestamp: Date.now(),
                    toLocationName: newScene.name,
                };

                storyUpdates.scenes = [...(activeStory.scenes || []), newScene];
                storyUpdates.storyHistory = [...(activeStory.storyHistory || []), newHistoryEntry];
                toastDescription = `New location discovered: ${newScene.name}`;

            } else if (item.id === 'recruit_playable_character' || item.id === 'recruit_ai_companion') {
                const isPlayable = item.id === 'recruit_playable_character';
                const selectedStyle = storyStyles.find(s => s.value === activeStory.style);
                
                if (!selectedStyle) throw new Error("Invalid story style for recruitment.");
                
                const existingNames = activeStory.characters.map(c => c.name);

                const newCharacterData = await recruitNewCharacterAction(
                    { genre: activeStory.genre, ageRating: activeStory.ageRating, existingNames },
                    selectedStyle.characterPromptModifier,
                    isPlayable
                );

                const profileUrl = await uploadDataUrlToFirebase(newCharacterData.profileImageUrl, `characters/${activeStory.id}`);
                const inGameUrl = await uploadDataUrlToFirebase(newCharacterData.inGameImageUrl, `characters/${activeStory.id}`);
                let newCharacter = { ...newCharacterData, profileImageUrl: profileUrl, inGameImageUrl: inGameUrl };

                const existingCharacters = activeStory.characters;
                newCharacter.relationships = existingCharacters.map(c => ({ targetCharacterId: c.id, value: 0 }));
                const updatedExistingCharacters = existingCharacters.map(c => ({
                    ...c,
                    relationships: [...(c.relationships || []), { targetCharacterId: newCharacter.id, value: 0 }]
                }));

                storyUpdates.characters = [...updatedExistingCharacters, newCharacter];
                toastDescription = `${newCharacter.name} has joined your story!`;
            } else if (item.id === 'refill_bookmarks') {
                await updateAppState({ bookmarks: MAX_BOOKMARKS, lastBookmarkRegen: Date.now() });
                toastDescription = "Your bookmarks have been refilled!";
            }
        } else if (item.type === 'skill') {
            const currentSkills = activeCharacter!.skills || [];
            if (!currentSkills.includes(item.skill)) {
                const updatedCharacter = { ...activeCharacter!, skills: [...currentSkills, item.skill] };
                storyUpdates.characters = activeStory.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c);
                toastDescription = `You have learned the skill: ${item.skill}!`;
            } else {
                toast({ title: "Skill Already Known", description: `You have already learned ${item.skill}.`, variant: 'default' });
                setIsLoading(false);
                return;
            }
        }

        await updateStory(activeStory.id, { ...storyUpdates });
        toast({ variant: "success", title: toastTitle, description: toastDescription });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Purchase Failed', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };
  
  const purchaseTokens = async (item: TokenPackage) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const newTokens = (state.tokens ?? 0) + item.amount;
      await updateAppState({ tokens: newTokens });
      toast({
        variant: "success",
        title: 'Purchase Successful!',
        description: `You paid ${item.price} and received ${item.amount} tokens.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Token Purchase Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const claimDailyReward = async () => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (state.lastDailyRewardClaimed && (now - state.lastDailyRewardClaimed < twentyFourHours)) {
      toast({
        title: "Reward Already Claimed",
        description: "You can claim your next daily reward tomorrow.",
      });
      return;
    }

    const newTokens = (state.tokens ?? 0) + DAILY_REWARD_AMOUNT;
    await updateAppState({ tokens: newTokens, lastDailyRewardClaimed: now });
    
    toast({
      variant: "success",
      title: "Daily Reward Claimed!",
      description: `You received ${DAILY_REWARD_AMOUNT} token.`,
    });
  };

  const exportStory = (storyId?: string) => {
    const storyToExport = storyId ? getStoryById(storyId) : activeStory;
    if (!storyToExport) return;
    
    const dataStr = JSON.stringify({ story: storyToExport }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${storyToExport.name.replace(/\s/g, '_')}_Story.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const signOutUser = async () => {
      try {
          await signOut(auth);
          setState(INITIAL_STATE);
          router.push('/login');
      } catch (error) {
          console.error("Error signing out: ", error);
      }
  };
  
  const updateUserProfile = async (profileData: { displayName?: string; photoURL?: string; email?: string; aboutMe?: string; }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in.");

    try {
        if (profileData.aboutMe !== undefined) {
            await updateAppState({ aboutMe: profileData.aboutMe });
        }

        let firebaseUpdateData: { displayName?: string; photoURL?: string; } = {};

        if (profileData.displayName) {
            firebaseUpdateData.displayName = profileData.displayName;
        }

        if (profileData.photoURL) {
            const uploadedUrl = await uploadDataUrlToFirebase(profileData.photoURL, `avatars/${user.uid}`);
            firebaseUpdateData.photoURL = uploadedUrl;
        }

        if (Object.keys(firebaseUpdateData).length > 0) {
            await updateProfile(user, firebaseUpdateData);
        }

        if (profileData.email && profileData.email !== user.email) {
            await updateEmail(user, profileData.email);
        }

        setCurrentUser({ ...auth.currentUser! });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("This is a sensitive action. Please sign out and sign back in to update your email.");
        }
        throw new Error("Could not update profile in Firebase.");
    }
  };
  
  const createShelf = async (name: string) => {
      const newShelf: Shelf = { id: crypto.randomUUID(), name, storyIds: [] };
      await updateAppState({ shelves: [...(state.shelves || []), newShelf] });
  };
  
  const deleteShelf = async (shelfId: string) => {
      const shelfToDelete = (state.shelves || []).find(s => s.id === shelfId);
      if (!shelfToDelete) return;
      
      const updatedStories = state.stories.map(story => {
          if (shelfToDelete.storyIds.includes(story.id)) {
              return { ...story, shelfId: null };
          }
          return story;
      });
      
      const updatedShelves = (state.shelves || []).filter(s => s.id !== shelfId);
      
      await updateAppState({ shelves: updatedShelves, stories: updatedStories });
      
      const batch = writeBatch(db);
      shelfToDelete.storyIds.forEach(storyId => {
          if (!currentUser) return;
          const storyRef = doc(db, "users", currentUser.uid, "stories", storyId);
          batch.update(storyRef, { shelfId: null });
      });
      await batch.commit();
  };

  const moveStoryToShelf = async (storyId: string, newShelfId: string, oldShelfId?: string | null) => {
      if (!currentUser) return;

      const updatedShelves = [...(state.shelves || [])].map(shelf => {
          let newStoryIds = [...shelf.storyIds];
          
          if (shelf.id === newShelfId && !newStoryIds.includes(storyId)) {
              newStoryIds.push(storyId);
          }
          
          if (shelf.id === oldShelfId) {
              newStoryIds = newStoryIds.filter(id => id !== storyId);
          }
          
          return { ...shelf, storyIds: newStoryIds };
      });
      
      const updatedStories = state.stories.map(s => 
          s.id === storyId ? { ...s, shelfId: newShelfId === 'all' ? null : newShelfId } : s
      );

      await updateAppState({ shelves: updatedShelves, stories: updatedStories });

      const storyRef = doc(db, "users", currentUser.uid, "stories", storyId);
      await updateDoc(storyRef, { shelfId: newShelfId === 'all' ? null : newShelfId });
  };

  const reorderShelf = async (shelfId: string, sourceIndex: number, destinationIndex: number) => {
    const shelf = (state.shelves || []).find(s => s.id === shelfId);
    if (!shelf) return;
    
    const newStoryIds = Array.from(shelf.storyIds);
    const [removed] = newStoryIds.splice(sourceIndex, 1);
    newStoryIds.splice(destinationIndex, 0, removed);
    
    const updatedShelves = (state.shelves || []).map(s => 
        s.id === shelfId ? { ...s, storyIds: newStoryIds } : s
    );

    await updateAppState({ shelves: updatedShelves });
  };

  const setReadingGoal = async (goal: ReadingGoal) => {
    await updateAppState({ readingGoal: goal });
  };
  
  const followAuthor = async (authorId: string) => {
    if (!currentUser) return;
    const currentFollows = state.followedAuthors || [];
    let newFollows;
    let message;

    if (currentFollows.includes(authorId)) {
        newFollows = currentFollows.filter(id => id !== authorId);
        message = "Author unfollowed.";
    } else {
        newFollows = [...currentFollows, authorId];
        message = "Author followed! You'll be notified of their new stories.";
    }
    
    await updateAppState({ followedAuthors: newFollows });
    toast({ title: message });
  };

  const regenerateStoryCover = async (storyId: string) => {
    const story = state.stories.find(s => s.id === storyId);
    if (!story || !currentUser) return;

    const result = await regenerateCoverAction(story);
    const updatedUrl = await uploadDataUrlToFirebase(result.coverUrl, 'covers');
    const updatedStory = { ...story, coverUrl: updatedUrl, coverSize: result.newSize };

    setState(prevState => ({
      ...prevState,
      stories: prevState.stories.map(s => s.id === storyId ? updatedStory : s),
    }));

    const collectionName = story.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
    const storyDocRef = doc(db, collectionName, storyId);
    await updateDoc(storyDocRef, { coverUrl: updatedUrl, coverSize: result.newSize });
  };

  const regenerateCharacterImages = async (storyId: string, characterId: string) => {
    const story = state.stories.find(s => s.id === storyId);
    const character = story?.characters.find(c => c.id === characterId);
    if (!story || !character || !currentUser) return;

    const result = await regenerateCharacterImagesAction(character, story);
    
    const [profileUrl, inGameUrl] = await Promise.all([
        uploadDataUrlToFirebase(result.profileImage.url, `characters/${storyId}`),
        uploadDataUrlToFirebase(result.inGameImage.url, `characters/${storyId}`)
    ]);

    const updatedCharacter = { 
        ...character, 
        profileImageUrl: profileUrl, 
        inGameImageUrl: inGameUrl,
        profileImageSize: result.profileImage.newSize,
        inGameImageSize: result.inGameImage.newSize,
    };

    const updatedStory = {
        ...story,
        characters: story.characters.map(c => c.id === characterId ? updatedCharacter : c)
    };

    setState(prevState => ({
      ...prevState,
      stories: prevState.stories.map(s => s.id === storyId ? updatedStory : s),
    }));

    const collectionName = story.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
    const storyDocRef = doc(db, collectionName, storyId);
    await updateDoc(storyDocRef, { characters: updatedStory.characters });
  };

  const regenerateSceneVisual = async (storyId: string, sceneId: string) => {
    const story = state.stories.find(s => s.id === storyId);
    const scene = story?.scenes.find(s => s.id === sceneId);
    if (!story || !scene || !currentUser) return;

    const selectedStyle = storyStyles.find(s => s.value === scene.style || story.style);
    if (!selectedStyle) throw new Error("Invalid style for regeneration.");

    const fullPrompt = `${selectedStyle.scenePromptModifier}, ${scene.prompt}`;
    const result = await regenerateSceneVisualAction(scene, story);
    const updatedUrl = await uploadDataUrlToFirebase(result.url, `scenes/${storyId}`);
    
    const updatedScene = { ...scene, url: updatedUrl };

    const updatedStory = {
        ...story,
        scenes: story.scenes.map(s => s.id === sceneId ? updatedScene : s)
    };

    setState(prevState => ({
      ...prevState,
      stories: prevState.stories.map(s => s.id === storyId ? updatedStory : s),
    }));

    const collectionName = story.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
    const storyDocRef = doc(db, collectionName, storyId);
    await updateDoc(storyDocRef, { scenes: updatedStory.scenes });
  };

  const regenerateStoryMap = async (storyId: string) => {
    const story = state.stories.find(s => s.id === storyId);
    if (!story || !currentUser) return;

    const result = await regenerateStoryMapAction(story);
    const updatedUrl = await uploadDataUrlToFirebase(result.mapUrl, 'maps');

    const updatedStory = { ...story, mapUrl: updatedUrl };

    setState(prevState => ({
        ...prevState,
        stories: prevState.stories.map(s => (s.id === storyId ? updatedStory : s)),
    }));

    const collectionName = story.isPublic ? "stories" : `users/${currentUser.uid}/stories`;
    const storyDocRef = doc(db, collectionName, storyId);
    await updateDoc(storyDocRef, { mapUrl: updatedUrl });
  };

  const joinStoryByInviteCode = async (inviteCode: string): Promise<boolean> => {
      if (!currentUser) {
          toast({ variant: 'destructive', title: "You must be logged in to join a story."});
          return false;
      }
      
      const storiesRef = collection(db, "stories");
      const q = query(storiesRef, where("inviteCode", "==", inviteCode));
      
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: "Invalid Code", description: "No story found with that invite code."});
            return false;
        }

        const storyDoc = querySnapshot.docs[0];
        const storyId = storyDoc.id;

        await setActiveStoryId(storyId);
        router.push(`/co-op/${storyId}/lobby`);
        return true;

      } catch(e) {
          console.error("Error joining story by invite code:", e);
          toast({ variant: 'destructive', title: "Error", description: "Could not join the story."});
          return false;
      }
  };

  const claimCharacterInCoop = async (storyId: string, characterId: string): Promise<boolean> => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: "You must be logged in." });
        return false;
    }

    const storyDocRef = doc(db, "stories", storyId);
    
    try {
        const storyDoc = await getDoc(storyDocRef);
        if (!storyDoc.exists()) {
            toast({ variant: 'destructive', title: "Story not found." });
            return false;
        }

        const story = storyDoc.data() as Story;
        
        const isAlreadyPlayer = story.players?.some(p => p.userId === currentUser.uid);
        if (isAlreadyPlayer) {
            toast({ variant: 'destructive', title: "Already joined!", description: "You are already a player in this story." });
            return true;
        }

        const isCharacterTaken = story.players?.some(p => p.characterId === characterId);
        if (isCharacterTaken) {
            toast({ variant: 'destructive', title: "Character Taken", description: "This character has already been claimed by another player." });
            return false;
        }
        
        const newPlayer: Player = {
            userId: currentUser.uid,
            characterId: characterId,
            displayName: currentUser.displayName || "New Player",
            photoURL: currentUser.photoURL ?? null,
        };
        
        await updateDoc(storyDocRef, { players: arrayUnion(newPlayer) });

        await setActiveStoryId(storyId);
        return true;
    } catch(e) {
        console.error("Error claiming character:", e);
        toast({ variant: 'destructive', title: "Error", description: "Could not claim the character." });
        return false;
    }
  };

  const createAndClaimCharacterInCoop = async (
    storyId: string,
    characterData: Omit<Character, 'id' | 'relationships' | 'skills' | 'items' | 'defaultStats' | 'currentScenario'>
  ): Promise<boolean> => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: "You must be logged in." });
      return false;
    }

    const storyDocRef = doc(db, "stories", storyId);
    try {
      const storyDoc = await getDoc(storyDocRef);
      if (!storyDoc.exists()) {
        toast({ variant: 'destructive', title: "Story not found." });
        return false;
      }
      const story = storyDoc.data() as Story;
      const existingCharacters = story.characters || [];

      // Create the new character object
      const newCharacterId = crypto.randomUUID();
      const newCharacter: Character = {
        ...characterData,
        id: newCharacterId,
        skills: [],
        items: [],
        relationships: existingCharacters.map(c => ({ targetCharacterId: c.id, value: 0 })),
        level: 1,
        xp: 0,
        unspentStatPoints: 0,
        defaultStats: { health: 100, money: 10, happiness: 75, items: [] },
        currentScenario: null,
      };

      // Add relationship from existing characters to the new one
      const updatedExistingCharacters = existingCharacters.map(c => ({
        ...c,
        relationships: [...(c.relationships || []), { targetCharacterId: newCharacterId, value: 0 }]
      }));
      
      // Create the new player object
      const newPlayer: Player = {
        userId: currentUser.uid,
        characterId: newCharacterId,
        displayName: currentUser.displayName || "New Player",
        photoURL: currentUser.photoURL || undefined,
      };
      
      const batch = writeBatch(db);
      batch.update(storyDocRef, {
        characters: [...updatedExistingCharacters, newCharacter],
        players: arrayUnion(newPlayer)
      });
      await batch.commit();

      await setActiveStoryId(storyId);
      return true;
    } catch (e) {
      console.error("Error creating and claiming character:", e);
      toast({ variant: 'destructive', title: "Error", description: "Could not create and claim the character." });
      return false;
    }
  };

  const removePlayerFromCoop = async (storyId: string, playerId: string): Promise<boolean> => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: "You must be logged in." });
        return false;
    }
    const storyDocRef = doc(db, "stories", storyId);
    try {
        const storyDoc = await getDoc(storyDocRef);
        if (!storyDoc.exists()) {
            toast({ variant: 'destructive', title: "Story not found." });
            return false;
        }
        const story = storyDoc.data() as Story;
        const playerToRemove = (story.players || []).find(p => p.userId === playerId);

        if (!playerToRemove) {
            toast({ variant: 'destructive', title: "Player not found in lobby." });
            return false;
        }

        const updatedPlayers = (story.players || []).filter(p => p.userId !== playerId);
        let updatedTurnId = story.turnCharacterId;

        // If the removed player's turn was active, advance the turn.
        if (story.turnCharacterId === playerToRemove.characterId && updatedPlayers.length > 0) {
            const removedPlayerIndex = (story.players || []).findIndex(p => p.userId === playerId);
            // The next player is now at the same index in the updated (smaller) array.
            const nextPlayerIndex = removedPlayerIndex % updatedPlayers.length;
            updatedTurnId = updatedPlayers[nextPlayerIndex].characterId;
        } else if (updatedPlayers.length === 0) {
            updatedTurnId = null;
        }

        await updateDoc(storyDocRef, {
            players: updatedPlayers,
            turnCharacterId: updatedTurnId,
        });

        return true;
    } catch (e) {
        console.error("Error removing player:", e);
        toast({ variant: 'destructive', title: "Error", description: "Could not remove player from lobby." });
        return false;
    }
  };

  const displayPlan = state.membershipPlan === 'Admin' && !state.isAdminMode ? 'Free' : state.membershipPlan;

  const value: StoryContextType = {
    stories: state.stories,
    activeStoryId: state.activeStoryId,
    activeStory: activeStory,
    getStoryById,
    handleStoryClick,
    
    characters: activeStory?.characters ?? [],
    scenes: activeStory?.scenes ?? [],
    storyStatus: activeStory?.storyStatus ?? 'idle',
    currentScenario: activeCharacter?.currentScenario ?? null,
    storyHistory: activeStory?.storyHistory ?? [],
    storyProgression: activeStory?.storyProgression ?? '',
    genre: activeStory?.genre ?? '',
    ageRating: activeStory?.ageRating ?? '',
    style: activeStory?.style ?? 'fantasy',
    locationName: activeStory?.locationName ?? 'Unknown Location',
    lastLocationName: activeStory?.lastLocationName,
    timeOfDay: activeStory?.timeOfDay ?? 'Morning',
    currentSceneIndex: activeStory?.currentSceneIndex ?? 0,
    objectives: activeStory?.objectives ?? [],
    membershipPlan: state.membershipPlan,
    displayPlan: displayPlan,
    bookmarks: state.bookmarks ?? 0,
    tokens: state.tokens ?? 0,
    currentUser,
    isAdminMode: state.isAdminMode ?? false,
    aboutMe: state.aboutMe,

    monthlyCreations: state.monthlyCreations ?? 0,
    creationLimit: planLimits[displayPlan],

    addCharacter,
    updateCharacter,
    deleteCharacter,
    addScene,
    removeScene,
    updateScene,
    updateSceneCoordinates,
    setActiveStoryId,
    setActiveCharacterId,
    setStoryMode,
    restartStory,
    toggleBookmark,
    startStory,
    joinStory,
    joinStoryByInviteCode,
    claimCharacterInCoop,
    createAndClaimCharacterInCoop,
    removePlayerFromCoop,
    makeChoice,
    continueToNextChapter,
    isLoading: isLoading || !isAuthChecked,
    activeCharacter,
    exportStory,
    signOutUser,
    createStory,
    updateStory,
    deleteStory,
    setMembershipPlan,
    toggleAdminMode,
    purchaseShopItem,
    purchaseTokens,
    consumeToken,
    updateUserProfile,
    
    shelves: state.shelves || [],
    createShelf,
    deleteShelf,
    moveStoryToShelf,
    reorderShelf,
    readingGoal: state.readingGoal,
    chaptersReadThisWeek: state.chaptersReadThisWeek ?? 0,
    setReadingGoal,
    lastDailyRewardClaimed: state.lastDailyRewardClaimed,
    claimDailyReward,
    followedAuthors: state.followedAuthors || [],
    followAuthor,
    regenerateStoryCover,
    regenerateCharacterImages,
    regenerateSceneVisual,
    regenerateStoryMap,
    lastRelationshipEvent: activeStory?.lastRelationshipEvent,
  };
  
  if (!isAuthChecked) {
    return <BookLoader />;
  }

  if (!currentUser) {
    router.replace('/login');
    return <BookLoader />;
  }

  return (
    <StoryContext.Provider value={value}>{children}</StoryContext.Provider>
  );
};

export const useStory = (): StoryContextType => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error("useStory must be used within a StoryProvider");
  }
  return context;
};




    


    
