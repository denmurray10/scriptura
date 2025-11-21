

"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { BookDashed, CornerDownLeft, Loader2, Send, Sparkles, Hourglass, History, CornerDownRight, Heart, Smile, CircleDollarSign, Briefcase, Clock, UserPlus, Check, ChevronDown, Target, Trophy, ShoppingCart, Coins, Download, Plus, Library, BookOpen, Bookmark, ArrowRight, Undo2, Star, MessageSquare, Info, Map, HelpCircle, CheckCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { generateCharacterThoughtAction, generateStorySuggestionsAction, generateObjectiveHelpAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shopItems, tokenPackages } from "@/lib/config";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AdSense from "@/components/AdSense";
import { Objective } from "@/types";
import BookLoader from "@/components/BookLoader";

const choiceSchema = z.object({
  choice: z.string().min(5, "Your action should be at least 5 characters long.").max(200, "Your action is too long."),
});

const CharacterThought = () => {
  const { activeCharacter, currentScenario, genre } = useStory();
  const [thought, setThought] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFetchThought = async () => {
    if (!activeCharacter || !currentScenario) return;
    setIsLoading(true);
    try {
      const result = await generateCharacterThoughtAction({
        character: {
          name: activeCharacter.name,
          health: activeCharacter.health,
          happiness: activeCharacter.happiness,
        },
        scenario: currentScenario.description,
        genre: genre,
      });
      setThought(result.thought);
    } catch (error) {
      setThought("I can't quite put my finger on it...");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);
    if (shouldOpen && !thought) {
      handleFetchThought();
    }
  };

  if (!activeCharacter) return null;

  const getHappinessColor = (happiness: number) => {
    if (happiness > 70) return 'border-green-400';
    if (happiness > 40) return 'border-yellow-400';
    return 'border-red-500';
  };
  
  return (
    <div className="relative">
      <button
        className="relative group focus:outline-none h-20 w-[53px]"
        onClick={handleToggle}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-background aspect-[2/3]">
            <Image
                src={activeCharacter.profileImageUrl}
                alt={activeCharacter.name}
                fill
                className="object-cover"
            />
        </div>
        <div className={cn(
            "absolute inset-0 rounded-lg border-2",
            getHappinessColor(activeCharacter.happiness)
        )}></div>
      </button>
      
      {isOpen && (
          <Card 
              className="p-4 shadow-2xl absolute top-0 right-0 w-64 animate-in fade-in-50 duration-500 cursor-pointer"
              onClick={handleToggle}
          >
            <div className="space-y-2">
                <h4 className="font-medium leading-none">{activeCharacter.name}'s Status</h4>
                <p className="text-sm text-muted-foreground">
                    Feeling {activeCharacter.happiness > 70 ? 'great' : activeCharacter.happiness > 40 ? 'uneasy' : 'terrible'}.
                </p>
                <div className="pt-2 mt-2 border-t">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-1">Inner Thought</h5>
                    {isLoading ? (
                        <Skeleton className="h-8 w-full" />
                    ) : (
                        <p className="text-sm italic">“{thought}”</p>
                    )}
                </div>
            </div>
          </Card>
      )}
    </div>
  );
};


export default function StoryPage() {
  const { 
    storyStatus, 
    currentScenario, 
    makeChoice, 
    isLoading, 
    activeCharacter,
    characters,
    setActiveCharacterId,
    activeStory,
    storyHistory,
    startStory,
    joinStory,
    timeOfDay,
    scenes,
    currentSceneIndex,
    objectives,
    tokens,
    purchaseShopItem,
    exportStory,
    purchaseTokens,
    continueToNextChapter,
    bookmarks,
    consumeToken,
    storyProgression,
    lastRelationshipEvent,
  } = useStory();
  const router = useRouter();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [hasAcknowledgedScenario, setHasAcknowledgedScenario] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isObjectivesOpen, setIsObjectivesOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isWorldInfoOpen, setIsWorldInfoOpen] = useState(false);
  const [shopDefaultTab, setShopDefaultTab] = useState("upgrades");

  // New state for Objective Help
  const [helpObjective, setHelpObjective] = useState<Objective | null>(null);
  const [helpSteps, setHelpSteps] = useState<string[]>([]);
  const [isGeneratingHelp, setIsGeneratingHelp] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);


  // State for the end-of-story feedback
  const [rating, setRating] = useState(0);
  const [pollAnswer, setPollAnswer] = useState<'yes' | 'no' | null>(null);
  const feedbackGiven = rating > 0 && pollAnswer !== null;

  const form = useForm<z.infer<typeof choiceSchema>>({
    resolver: zodResolver(choiceSchema),
    defaultValues: { choice: "" },
  });

  const playableCharacters = characters.filter((c) => c.isPlayable);
  
  useEffect(() => {
    if (!activeStory) {
        router.replace('/dashboard');
    }
  }, [activeStory, router]);

  useEffect(() => {
    if (storyStatus === 'playing' && currentScenario && activeCharacter && activeStory) {
      const fetchSuggestions = async () => {
        setHasAcknowledgedScenario(false);
        setIsGeneratingSuggestions(true);
        setSuggestions([]);
        try {
          const result = await generateStorySuggestionsAction({
            character: activeCharacter,
            storyState: activeStory,
          });
          setSuggestions(result.suggestions);
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        } finally {
          setIsGeneratingSuggestions(false);
        }
      };
      fetchSuggestions();

      if (currentScenario.requiredNextCharacterName) {
        const nextChar = characters.find(c => c.name === currentScenario.requiredNextCharacterName);
        if (nextChar && nextChar.id !== activeCharacter.id) {
          toast({
            title: "Character Switch Suggested",
            description: `The story's focus is shifting. It's time for ${nextChar.name} to act.`,
            duration: 8000,
          });
        }
      }
    }
  }, [currentScenario, activeCharacter, storyStatus, activeStory, characters, toast]);

  async function onSubmit(values: z.infer<typeof choiceSchema>) {
    try {
      await makeChoice(values.choice);
      form.reset();
      const textarea = document.querySelector('textarea[name="choice"]');
      if (textarea) {
        (textarea as HTMLTextAreaElement).style.height = 'auto';
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Failed to Progress Story",
        description: errorMessage,
      });
    }
  }
  
  const handleSuggestionClick = async (suggestion: string) => {
    const isFirstTurn = storyHistory.length === 0;

    if (!isFirstTurn && (tokens ?? 0) < 1) {
      toast({
        variant: "destructive",
        title: "Out of Tokens",
        description: "You need a token to use a suggestion. They regenerate hourly, or you can get more in the shop.",
      });
      setShopDefaultTab('tokens');
      setIsShopOpen(true);
      return;
    }

    if (!isFirstTurn) {
        const consumed = await consumeToken();
        if (!consumed) {
          toast({
            variant: "destructive",
            title: "Token Error",
            description: "Failed to use a token. Please try again.",
          });
          return;
        }
    }

    form.setValue("choice", suggestion, { shouldValidate: true });
    const textarea = document.querySelector('textarea[name="choice"]') as HTMLTextAreaElement;
    if (textarea) {
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }, 0)
    }
    await onSubmit({ choice: suggestion });
  };

  const handleObjectiveHelp = async (objective: Objective) => {
    if (!activeCharacter || !currentScenario) return;

    setHelpObjective(objective);
    setIsGeneratingHelp(true);
    setHelpSteps([]);

    try {
      const result = await generateObjectiveHelpAction({
        objectiveDescription: objective.description,
        character: {
          name: activeCharacter.name,
          skills: activeCharacter.skills || [],
          items: activeCharacter.items || [],
        },
        storyProgression,
        currentScenario: currentScenario.description,
        otherCharacters: characters.filter(c => c.id !== activeCharacter.id).map(c => c.name),
      });
      setHelpSteps(result.steps);
    } catch (error) {
      const err = error as Error;
      toast({ variant: "destructive", title: "Help Failed", description: err.message });
      setHelpObjective(null); // Close dialog on error
    } finally {
      setIsGeneratingHelp(false);
    }
  };

  const handlePointerDown = (objective: Objective) => {
    longPressTimer.current = setTimeout(() => {
        handleObjectiveHelp(objective);
    }, 500); // 500ms for long press
  };
  
  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  
  if (!activeStory) {
    return <BookLoader />;
  }

  const bgUrl = scenes?.[currentSceneIndex]?.url || 'https://placehold.co/1024x576.png';

  if (storyStatus === "idle") {
    if (!activeCharacter) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center p-6">
                    <CardHeader>
                        <CardTitle>Select a Character</CardTitle>
                        <CardDescription>
                            Choose a character to begin your adventure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/characters')}>
                            <BookDashed className="mr-2 h-4 w-4" />
                            Choose a Character
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const firstSceneUrl = (activeStory.scenes[0]?.url) || bgUrl;
    
    return (
       <div className="relative h-full w-full overflow-hidden">
          <Image
            src={firstSceneUrl}
            alt={"Story scenario"}
            fill
            className="object-cover"
            data-ai-hint="fantasy landscape"
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
             <div className="w-full max-w-4xl text-center p-6 animate-in fade-in-50">
                <div className="w-32 h-48 mx-auto rounded-lg overflow-hidden border-4 border-white/20 shadow-lg mb-4">
                  <Image src={activeCharacter.profileImageUrl} alt={activeCharacter.name} width={200} height={300} className="w-full h-full object-cover" />
                </div>
                <h1 className="text-3xl font-headline text-white font-bold">Ready to Start?</h1>
                <p className="text-white/80 mt-1">
                  You've selected <span className="font-bold text-white">{activeCharacter.name}</span> to lead this tale.
                </p>
                <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <div className="text-sm text-white/80 p-4 bg-black/20 backdrop-blur-sm rounded-lg">
                            <h4 className="font-semibold text-white mb-2">Character Summary</h4>
                            <p><span className="font-semibold text-white">Traits:</span> {activeCharacter.traits}</p>
                            <p className="mt-2"><span className="font-semibold text-white">Backstory Snippet:</span> {activeCharacter.backstory.split('.').slice(0, 2).join('.') + '.'}</p>
                        </div>
                        <div className="text-sm text-white/80 p-4 bg-primary/10 backdrop-blur-sm rounded-lg flex flex-col justify-center">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Pro Tip</h4>
                                    <p>Use AI suggestions if you're stuck, but remember that custom, creative actions often lead to the most unique outcomes!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={startStory} disabled={isLoading} size="lg" className="w-full mt-4">
                      {isLoading ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Begin the Story
                    </Button>
                </div>
            </div>
          </div>
       </div>
    );
  }

  if (storyStatus === 'relationship-event' && lastRelationshipEvent) {
    const { character1, character2 } = lastRelationshipEvent;
    return (
        <div className="relative h-screen w-full overflow-hidden">
            {lastRelationshipEvent.imageUrl && (
                <Image
                    src={lastRelationshipEvent.imageUrl}
                    alt={"Relationship event"}
                    fill
                    className="object-cover"
                    data-ai-hint="dramatic fantasy landscape"
                />
            )}
            <div className="absolute inset-0 bg-black/30 z-10" />
            <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
                <div className={cn(
                    "w-full max-w-2xl text-center p-6 animate-in fade-in-50 duration-1000",
                    "bg-black/20 backdrop-blur-md rounded-2xl border border-white/10"
                )}>
                    <div className="relative flex justify-center items-center -space-x-8 mb-6">
                        <div className="w-24 h-36 md:w-32 md:h-48 rounded-lg overflow-hidden border-4 border-white/20 shadow-lg transform -rotate-6">
                            <Image src={character1.profileImageUrl} alt={character1.name} width={200} height={300} className="w-full h-full object-cover" data-ai-hint="male character portrait" />
                        </div>
                        <div className="w-24 h-36 md:w-32 md:h-48 rounded-lg overflow-hidden border-4 border-white/20 shadow-lg transform rotate-6 z-10">
                            <Image src={character2.profileImageUrl} alt={character2.name} width={200} height={300} className="w-full h-full object-cover" data-ai-hint="female character portrait" />
                        </div>
                    </div>
                    <h1 className="text-xl md:text-2xl font-headline text-white font-bold">Relationship Event</h1>
                    <p className="text-lg md:text-xl text-white/90 font-semibold mt-2">{character1.name} & {character2.name}</p>
                    <p className="text-white/80 mt-4 leading-relaxed max-w-xl mx-auto">
                        {lastRelationshipEvent.description}
                    </p>
                    <div className="mt-8">
                        <Button onClick={() => makeChoice("Continue.")} size="lg" className="bg-white text-black hover:bg-white/90">
                            Continue Story <Check className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (storyStatus === 'ended') {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={bgUrl}
          alt={"Story scenario"}
          fill
          className="object-cover"
          data-ai-hint="fantasy landscape"
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
           <Card className="w-full max-w-lg text-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in-50">
               <CardHeader>
                   <CardTitle className="text-3xl font-bold font-headline">The End</CardTitle>
                   <CardDescription>
                       Your adventure, "{activeStory.name}", has concluded after {storyHistory.length} choices.
                   </CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col gap-4 pt-4">
                  <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Rate this story</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-8 w-8 cursor-pointer transition-colors",
                                rating >= star ? "text-primary fill-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                              )}
                              onClick={() => setRating(star)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Would you like a sequel to this story?</p>
                        <div className="flex flex-col items-center gap-2 mt-2">
                          <Button variant={pollAnswer === 'yes' ? 'default' : 'outline'} onClick={() => setPollAnswer('yes')} className="w-full max-w-xs">Yes</Button>
                          <Button variant={pollAnswer === 'no' ? 'default' : 'outline'} onClick={() => setPollAnswer('no')} className="w-full max-w-xs">No</Button>
                        </div>
                      </div>
                  </div>

                  {feedbackGiven && (
                      <div className="text-center p-4 bg-primary/10 rounded-lg animate-in fade-in-20">
                        <p className="font-semibold text-primary">Thank you for your feedback!</p>
                      </div>
                  )}

                  <Separator className="my-2" />
                  
                  <div>
                      <p className="text-sm text-muted-foreground mb-4">What's next? Chat with the characters you met or begin a brand new journey.</p>
                      <div className="flex justify-center gap-4">
                          <Button onClick={() => router.push('/speak')}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Speak with the Cast
                          </Button>
                          <Button onClick={() => router.push('/create')}>
                              <Plus className="mr-2 h-4 w-4" />
                              New Adventure
                          </Button>
                      </div>
                  </div>
               </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  if (storyStatus === 'chapter-end') {
    return (
      <div className="h-full w-full overflow-hidden bg-black">
        <div className="relative z-20 flex h-full flex-col justify-center p-8 md:p-12 animate-in fade-in-50 duration-1000">
          <div className="max-w-xl space-y-6">
            <h1 className="text-lg font-medium text-white/90 font-headline">
              Chapter {Math.floor(activeStory.storyHistory.length / 10)} Complete
            </h1>
            
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {activeStory.lastChapterSummary}
            </p>
            
            <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_VIDEO_AD_SLOT!} />

            <div className="pt-4">
              <Button onClick={continueToNextChapter} disabled={isLoading} size="lg" className="bg-white text-black hover:bg-white/90">
                {isLoading ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                Start Chapter {Math.floor(activeStory.storyHistory.length / 10) + 1}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const renderStoryContent = () => {
    const interactingNpc = currentScenario?.interactingNpcName
      ? characters.find(c => c.name === currentScenario.interactingNpcName)
      : null;

    if (!activeCharacter) {
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle>Select a Character</CardTitle>
              <CardDescription>
                Choose a character from the dropdown to continue the story.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    }
  
    if (!currentScenario) {
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle>{activeCharacter.name} is ready!</CardTitle>
              <CardDescription>
                The story is already underway. Join the adventure now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={joinStory} disabled={isLoading}>
                {isLoading ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Join Adventure
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <>
        {/* FLEXIBLE SPACER */}
        <div className="flex-1" />

        {/* FIXED INPUT AREA */}
        <div className="mt-4 flex-shrink-0 relative z-20">
            { !hasAcknowledgedScenario && currentScenario ? (
               interactingNpc ? (
                 <Card className="p-4 pt-8 shadow-2xl relative animate-in fade-in-50 duration-500">
                    <div className="absolute top-0 left-4 -translate-y-1/2">
                        <Image
                            src={interactingNpc.profileImageUrl}
                            alt={interactingNpc.name}
                            width={48}
                            height={48}
                            className="rounded-full border-4 border-card"
                        />
                    </div>
                    <p className="font-bold text-lg mb-2">{interactingNpc.name}</p>
                    <div className="max-h-[50dvh] overflow-y-auto no-scrollbar pr-2">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentScenario.description}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setHasAcknowledgedScenario(true)}>
                            Continue <Check className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                 </Card>
               ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-lg animate-in fade-in-50 duration-500">
                  <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed text-white/95 drop-shadow-md max-h-[50dvh] overflow-y-auto no-scrollbar pr-2">
                      <p className="whitespace-pre-wrap">{currentScenario.description}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      size="sm"
                      onClick={() => setHasAcknowledgedScenario(true)}
                      className="bg-primary/90 hover:bg-primary text-primary-foreground"
                    >
                      Continue <Check className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="animate-in fade-in-50 duration-500">
                {/* AI SUGGESTIONS */}
                <div className="mb-4">
                  {isGeneratingSuggestions ? (
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-1/2 rounded-lg bg-black/20" />
                      <Skeleton className="h-10 w-1/2 rounded-lg bg-black/20" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-start gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-auto whitespace-normal rounded-lg border-white/30 bg-black/20 backdrop-blur-sm py-1 px-3 text-left font-normal text-white hover:bg-black/40 text-xs md:text-sm justify-start transition-all",
                            (tokens ?? 0) < 1 && storyHistory.length > 0 && "blur-sm text-transparent select-none"
                          )}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading || isGeneratingSuggestions}
                        >
                          <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
                          <span>{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* LIQUID GLASS FORM WRAPPER */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-lg">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                      <FormField
                        control={form.control}
                        name="choice"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Textarea
                                  placeholder={`What does ${activeCharacter?.name} do next?`}
                                  className="min-h-[40px] resize-none rounded-lg border-white/20 bg-white/5 backdrop-blur-sm pr-12 text-xs text-white placeholder:text-white/60 focus:ring-primary md:text-sm max-h-[50dvh] no-scrollbar"
                                  rows={1}
                                  {...field}
                                  onInput={(e) => {
                                    field.onChange(e);
                                    const textarea = e.currentTarget;
                                    textarea.style.height = 'auto';
                                    textarea.style.height = `${textarea.scrollHeight}px`;
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      form.handleSubmit(onSubmit)();
                                    }
                                  }}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <Button
                                type="submit"
                                disabled={isLoading}
                                size="icon"
                                variant="ghost"
                                className="absolute bottom-1.5 right-2 h-8 w-8 text-primary hover:bg-transparent hover:text-primary/80"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Send className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                            <FormMessage className="text-primary/80" />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <p className="mt-2 flex items-center gap-1 text-xs text-white/70">
                    <CornerDownLeft className="h-3 w-3" /> Press Enter to submit, Shift+Enter for new line.
                  </p>
                </div>
              </div>
            )}
        </div>
      </>
    )
  }


  return (
    <div className="h-screen w-full">
      <div className="relative h-full w-full overflow-hidden">
        {/* BACKGROUND IMAGE */}
        {isLoading && storyHistory.length === 0 ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <>
            <Image
              src={bgUrl}
              alt={"Story scenario"}
              fill
              className="object-cover transition-opacity duration-500"
              data-ai-hint="fantasy landscape"
              key={bgUrl}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[8]" />
          </>
        )}

        <div className="absolute top-[20%] right-4 md:right-6 z-20">
            <CharacterThought />
        </div>

        {/* CONTENT OVERLAY */}
        <div className="relative z-10 flex h-full flex-col p-4 md:p-6">
          <div className="mb-4 space-y-2 z-10">
            {/* TOP ROW */}
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              {/* Left-aligned controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                <Sheet open={isShopOpen} onOpenChange={setIsShopOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-white/30 bg-black/20 text-white hover:bg-black/30"
                      onClick={() => setShopDefaultTab("upgrades")}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="sr-only">Open Shop</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full h-full p-0 flex flex-col sm:max-w-md md:max-w-md">
                    <SheetHeader className="p-6 pb-2 border-b">
                      <SheetTitle>Shop</SheetTitle>
                      <SheetDescription>Spend your tokens on powerful upgrades and new content. You have {tokens} tokens.</SheetDescription>
                    </SheetHeader>
                    <Tabs value={shopDefaultTab} onValueChange={setShopDefaultTab} className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 border-b">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="upgrades">Upgrades & Skills</TabsTrigger>
                              <TabsTrigger value="tokens">Buy Tokens</TabsTrigger>
                          </TabsList>
                      </div>
                      <ScrollArea className="flex-1">
                          <TabsContent value="upgrades" className="mt-0 p-6 space-y-4">
                              {shopItems.map(item => {
                                const isSkillOwned = item.type === 'skill' && activeCharacter?.skills?.includes(item.skill);
                                const canAfford = tokens >= item.cost;
                                const isDisabled = isLoading || !canAfford || isSkillOwned;
                                
                                return (
                                  <Card key={item.id} className="bg-white">
                                      <CardContent className="p-4 flex items-center justify-between gap-4">
                                          <div className="flex-1">
                                              <p className="font-bold">{item.name}</p>
                                              <p className="text-sm text-muted-foreground">{item.description}</p>
                                          </div>
                                          <Button 
                                              onClick={() => purchaseShopItem(item)}
                                              disabled={isDisabled}
                                              className="w-28"
                                          >
                                              {isSkillOwned ? 'Owned' : (
                                                  <>
                                                    {item.cost}
                                                    <Coins className="ml-2 h-4 w-4" />
                                                  </>
                                              )}
                                          </Button>
                                      </CardContent>
                                  </Card>
                                )
                              })}
                          </TabsContent>
                          <TabsContent value="tokens" className="mt-0 p-6 space-y-4">
                              {tokenPackages.map(pkg => (
                                    <Card key={pkg.id} className="bg-white">
                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-bold">{pkg.name}</p>
                                                <p className="text-sm text-muted-foreground">Add {pkg.amount} tokens to your balance.</p>
                                            </div>
                                            <Button 
                                                onClick={() => purchaseTokens(pkg)}
                                                disabled={isLoading}
                                                className="w-28"
                                            >
                                                {pkg.price}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                          </TabsContent>
                      </ScrollArea>
                    </Tabs>
                     <div className="p-4 border-t bg-background">
                      <SheetClose asChild>
                        <Button className="w-full">Close</Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
                <Sheet open={isObjectivesOpen} onOpenChange={setIsObjectivesOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30">
                        <Target className="h-5 w-5" />
                        <span className="sr-only">View Objectives</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full h-full p-0 flex flex-col sm:max-w-md md:max-w-md">
                      <SheetHeader className="p-6 pb-4 border-b">
                        <SheetTitle>Objectives</SheetTitle>
                        <SheetDescription>Track your goals and rewards for this story. Hold down on an active objective for a hint.</SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="flex-1 p-6">
                        {objectives.length > 0 ? (
                           <div className="space-y-4">
                             {objectives.map(obj => (
                                <Card 
                                    key={obj.id} 
                                    className={cn(
                                        "transition-all",
                                        obj.status === 'completed' 
                                            ? "bg-green-100/10 text-muted-foreground border-green-500/50" 
                                            : "bg-white border-primary"
                                    )}
                                    onMouseDown={() => obj.status === 'active' && handlePointerDown(obj)}
                                    onMouseUp={handlePointerUp}
                                    onTouchStart={() => obj.status === 'active' && handlePointerDown(obj)}
                                    onTouchEnd={handlePointerUp}
                                >
                                    <CardContent className="p-4">
                                      <p className={cn("font-headline", obj.status === 'completed' ? "text-muted-foreground line-through" : "text-card-foreground")}>{obj.description}</p>
                                      <div className={cn("flex items-center gap-2 text-sm mt-1", obj.status === 'completed' ? 'text-green-500' : 'text-primary')}>
                                          {obj.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                                          <span>{obj.tokenReward} Token Reward</span>
                                      </div>
                                    </CardContent>
                                </Card>
                              ))}
                           </div>
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-muted-foreground">No objectives right now.</p>
                          </div>
                        )}
                      </ScrollArea>
                      <div className="p-4 border-t bg-background">
                        <Button onClick={() => setIsObjectivesOpen(false)} className="w-full bg-primary hover:bg-primary/90">Close</Button>
                      </div>
                  </SheetContent>
                </Sheet>
                <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30" onClick={() => router.push('/story/map')}>
                  <Map className="h-5 w-5" />
                  <span className="sr-only">Open World Map</span>
                </Button>
                <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30" onClick={() => router.push('/story/relationships')}>
                  <Users className="h-5 w-5" />
                  <span className="sr-only">View Relationships</span>
                </Button>
              </div>

              {/* Right-aligned controls */}
              <div className="flex items-start gap-2 sm:items-center sm:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between border-white/30 bg-black/20 text-white hover:bg-black/30">
                      <span className="truncate pr-1">{activeCharacter ? activeCharacter.name.split(' ')[0] : "Select Character"}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[220px]">
                      {activeCharacter && (
                          <>
                          <DropdownMenuLabel>
                              {activeCharacter.name}'s Stats
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-sm space-y-2">
                              <div className="flex items-center gap-2" title="Health">
                                  <Heart className="h-4 w-4 text-red-400" />
                                  <span>Health: {activeCharacter.health}/100</span>
                              </div>
                              <div className="flex items-center gap-2" title="Happiness">
                                  <Smile className="h-4 w-4 text-yellow-400" />
                                  <span>Happiness: {activeCharacter.happiness}/100</span>
                              </div>
                              <div className="flex items-center gap-2" title="Money">
                                  <CircleDollarSign className="h-4 w-4 text-green-400" />
                                  <span>Money: {activeCharacter.money}</span>
                              </div>
                              <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  title="View Inventory"
                                  onClick={() => setIsInventoryOpen(true)}
                              >
                                  <Briefcase className="h-4 w-4" />
                                  <span>Inventory: {activeCharacter.items.length} items</span>
                              </div>
                              <div className="flex items-center gap-2" title="Time of Day">
                                  <Clock className="h-4 w-4" />
                                  <span>Time: {timeOfDay}</span>
                              </div>
                          </div>
                          </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Switch Character</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={activeCharacter?.id ?? ""} onValueChange={(id) => setActiveCharacterId(id === 'none' ? null : id)}>
                      {playableCharacters.map(char => (
                          <DropdownMenuRadioItem key={char.id} value={char.id}>
                          {char.name}
                          </DropdownMenuRadioItem>
                      ))}
                      {playableCharacters.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground italic">No other characters available.</div>
                      )}
                      </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex h-10 items-center gap-2 rounded-md border border-white/30 bg-black/20 px-3 text-xs font-semibold text-white backdrop-blur-sm" title="Bookmarks">
                      <Bookmark className="h-4 w-4 text-primary" />
                      <span>{bookmarks}</span>
                  </div>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30">
                      <History className="h-5 w-5" />
                      <span className="sr-only">View Story Log</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full h-full p-0 flex flex-col sm:max-w-md md:max-w-md">
                    <SheetHeader className="p-6 pb-4 border-b">
                      <SheetTitle>Story Log</SheetTitle>
                      <SheetDescription>A recap of your journey so far.</SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        {storyHistory.length > 0 ? (
                          storyHistory.map((entry, index) => {
                            const npc = entry.outcomeNpcName ? characters.find(c => c.name === entry.outcomeNpcName) : null;
                            return (
                              <div key={index} className="space-y-4 pb-6 border-b last:border-b-0">
                                {/* Player's Choice */}
                                <div className="flex items-start gap-3">
                                  <div className="relative w-8 h-12 flex-shrink-0">
                                      <Image src={entry.characterProfileImageUrl} alt={`Headshot of ${entry.characterName}`} fill className="rounded-sm object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{entry.characterName} chose to:</p>
                                    <p className="text-sm text-muted-foreground italic">&quot;{entry.choice}&quot;</p>
                                  </div>
                                </div>

                                {/* Outcome */}
                                {entry.outcomeDescription && (
                                  <div className="pl-11">
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                                        <CornerDownRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                                        {npc ? (
                                          <div className="flex-1">
                                            <p className="font-semibold">{npc.name} responded:</p>
                                            <p className="text-sm text-muted-foreground">“{entry.outcomeDescription}”</p>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground flex-1">{entry.outcomeDescription}</p>
                                        )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-4">Your story has just begun...</p>
                        )}
                        {currentScenario && <div className="space-y-3 pt-6 border-t">
                            <p className="font-semibold text-foreground">Current Situation:</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{currentScenario.description}</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Hourglass className="h-4 w-4" />
                                <p className="italic">...What happens next?</p>
                            </div>
                        </div>}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background">
                      <Button
                        className="w-full"
                        onClick={() => router.push('/dashboard')}
                      >
                        Exit Book
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          {renderStoryContent()}
        </div>
      </div>
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{activeCharacter?.name}'s Inventory</DialogTitle>
            <DialogDescription>
                Items currently held by the character.
            </DialogDescription>
            </DialogHeader>
            {activeCharacter && activeCharacter.items.length > 0 ? (
            <ScrollArea className="max-h-60 mt-4">
                <div className="space-y-4 pr-4">
                {activeCharacter.items.map((item, index) => (
                    <div key={index} className="pb-2 border-b last:border-b-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                ))}
                </div>
            </ScrollArea>
            ) : (
            <p className="mt-4 text-sm text-muted-foreground">The bag is empty.</p>
            )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!helpObjective} onOpenChange={(isOpen) => !isOpen && setHelpObjective(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-primary"/>
                    Objective Help
                </DialogTitle>
                <DialogDescription>
                    {helpObjective?.description}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {isGeneratingHelp ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        <span>Generating helpful steps...</span>
                    </div>
                ) : (
                    <ol className="list-decimal list-inside space-y-3">
                        {helpSteps.map((step, index) => (
                            <li key={index} className="text-sm">{step}</li>
                        ))}
                    </ol>
                )}
            </div>
            <DialogFooter>
                <Button onClick={(e) => { e.stopPropagation(); setHelpObjective(null); }}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
