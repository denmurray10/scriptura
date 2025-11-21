
"use client";

import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, CornerDownLeft, Hourglass, Bookmark, History, Target, Users, Map, Heart, Smile, CircleDollarSign, Briefcase, Clock, ChevronDown, UserPlus, ShoppingCart, Coins, HelpCircle, Check, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { generateStorySuggestionsAction, generateObjectiveHelpAction } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { tokenPackages, shopItems } from "@/lib/config";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Objective } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookLoader from "@/components/BookLoader";

const choiceSchema = z.object({
  choice: z.string().min(5, "Your action should be at least 5 characters long.").max(200, "Your action is too long."),
});

export default function StoryCoopPage() {
  const { 
    activeStory, 
    isLoading: isContextLoading, 
    makeChoice,
    storyHistory,
    scenes,
    currentSceneIndex,
    currentUser,
    consumeToken,
    tokens,
    characters,
    objectives,
    timeOfDay,
    purchaseShopItem,
    purchaseTokens,
    bookmarks,
    storyProgression,
  } = useStory();
  const router = useRouter();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isObjectivesOpen, setIsObjectivesOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopDefaultTab, setShopDefaultTab] = useState("upgrades");
  const [hasAcknowledgedScenario, setHasAcknowledgedScenario] = useState(true);
  
  const [helpObjective, setHelpObjective] = useState<Objective | null>(null);
  const [helpSteps, setHelpSteps] = useState<string[]>([]);
  const [isGeneratingHelp, setIsGeneratingHelp] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const turnCharacter = activeStory?.characters.find(c => c.id === activeStory.turnCharacterId);
  const myPlayerInfo = activeStory?.players?.find(p => p.userId === currentUser?.uid);
  const myCharacter = activeStory?.characters.find(c => c.id === myPlayerInfo?.characterId);
  
  // Use the activeCharacter's scenario as the source of truth for what's happening.
  // The context now updates all characters with the same currentScenario.
  const activeCharacterForScenario = activeStory?.characters.find(c => c.id === activeStory.activeCharacterId);
  const currentScenario = activeCharacterForScenario?.currentScenario;

  const prevTurnIdRef = useRef<string | null | undefined>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const form = useForm<z.infer<typeof choiceSchema>>({
    resolver: zodResolver(choiceSchema),
    defaultValues: { choice: "" },
  });
  
  const isMyTurn = turnCharacter?.id === myCharacter?.id;
  
  useEffect(() => {
    if (!isContextLoading && !activeStory) {
        router.replace('/dashboard');
    }
  }, [activeStory, isContextLoading, router]);
  
  useEffect(() => {
      if (typeof window !== "undefined") {
          audioRef.current = new Audio('/turn-notification.mp3');
      }
  }, []);

  useEffect(() => {
    const newTurnId = activeStory?.turnCharacterId;
    const myCharId = myCharacter?.id;
    
    if (newTurnId && newTurnId !== prevTurnIdRef.current && newTurnId === myCharId) {
      toast({
        title: "It's your turn!",
        description: `What will ${turnCharacter?.name} do next?`,
      });
      audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
    }
    
    prevTurnIdRef.current = newTurnId;

  }, [activeStory?.turnCharacterId, myCharacter?.id, turnCharacter?.name, toast]);

  useEffect(() => {
    if (turnCharacter && activeStory && isMyTurn) {
        setHasAcknowledgedScenario(false);
        const fetchSuggestions = async () => {
            setIsGeneratingSuggestions(true);
            setSuggestions([]);
            try {
                const result = await generateStorySuggestionsAction({
                    character: turnCharacter,
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
    }
  }, [isMyTurn, turnCharacter, activeStory]);
  
  async function onSubmit(values: z.infer<typeof choiceSchema>) {
    if (!isMyTurn) return;
    try {
      await makeChoice(values.choice);
      form.reset();
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
    if (!isMyTurn) return;
    if ((tokens ?? 0) < 1) {
        toast({
            variant: "destructive",
            title: "Out of Tokens",
            description: "You need a token to use a suggestion. They regenerate hourly.",
        });
        return;
    }
    const consumed = await consumeToken();
    if (!consumed) return;
    
    form.setValue("choice", suggestion, { shouldValidate: true });
    await onSubmit({ choice: suggestion });
  };
  
    const handleObjectiveHelp = async (objective: Objective) => {
    if (!myCharacter || !currentScenario) return;

    setHelpObjective(objective);
    setIsGeneratingHelp(true);
    setHelpSteps([]);

    try {
      const result = await generateObjectiveHelpAction({
        objectiveDescription: objective.description,
        character: {
          name: myCharacter.name,
          skills: myCharacter.skills || [],
          items: myCharacter.items || [],
        },
        storyProgression,
        currentScenario: currentScenario.description,
        otherCharacters: characters.filter(c => c.id !== myCharacter?.id).map(c => c.name),
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

  const isLoadingScreen = isContextLoading || !activeStory;
  if (isLoadingScreen) {
    return <BookLoader />;
  }

  const bgUrl = scenes?.[currentSceneIndex]?.url || 'https://placehold.co/1024x576.png';

  if (!turnCharacter) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <Image
            src={bgUrl}
            alt={"Story scenario"}
            fill
            className="object-cover transition-opacity duration-500"
            data-ai-hint="fantasy landscape"
            key={bgUrl}
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="mt-4 text-white">Starting game, assigning first turn...</p>
        </div>
      </div>
    );
  }

  const renderStoryContent = () => {
    const interactingNpc = currentScenario?.interactingNpcName
      ? characters.find(c => c.name === currentScenario.interactingNpcName)
      : null;
      
    if (!currentScenario) {
      return (
        <div className="flex-1" />
      )
    }

    if (!hasAcknowledgedScenario) {
      return (
        <div className="flex-1 flex flex-col justify-end">
          {interactingNpc ? (
            <Card className="p-4 pt-8 shadow-2xl relative animate-in fade-in-50 duration-500">
              <div className="absolute top-0 left-4 -translate-y-1/2">
                <Avatar className="h-12 w-12 border-4 border-card">
                  <AvatarImage src={interactingNpc.profileImageUrl} alt={interactingNpc.name} />
                  <AvatarFallback>{interactingNpc.name.charAt(0)}</AvatarFallback>
                </Avatar>
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
          )}
        </div>
      );
    }
    
    if (isMyTurn) {
        return (
            <div className="flex-1 flex flex-col justify-end animate-in fade-in-50 duration-500">
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
                            (tokens ?? 0) < 1 && "blur-sm text-transparent select-none"
                          )}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isContextLoading || isGeneratingSuggestions}
                        >
                          <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
                          <span>{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-lg">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField control={form.control} name="choice" render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <FormControl>
                                            <Textarea placeholder={`What does ${turnCharacter.name} do next?`} className="min-h-[40px] resize-none border-0 bg-transparent pr-12 text-xs text-white placeholder:text-white/60 focus-visible:ring-0 md:text-sm"
                                                {...field} disabled={isContextLoading} onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); form.handleSubmit(onSubmit)();}}} />
                                        </FormControl>
                                        <Button type="submit" disabled={isContextLoading} size="icon" variant="ghost" className="absolute bottom-1.5 right-2 h-8 w-8 text-primary">
                                            {isContextLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage className="text-red-400 pt-1" />
                                </FormItem>
                            )} />
                        </form>
                    </Form>
                    <p className="mt-2 flex items-center gap-1 text-xs text-white/70">
                        <CornerDownLeft className="h-3 w-3" /> Press Enter to submit, Shift+Enter for new line.
                    </p>
                </div>
            </div>
        )
    } else {
        return (
            <div className="flex-1 flex flex-col justify-end">
                 <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white">
                    <CardContent className="p-4 flex items-center justify-center gap-3">
                        <Hourglass className="h-5 w-5 animate-spin"/>
                        <p className="font-semibold text-center">Waiting for {turnCharacter?.name || 'the next player'}...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
  }


  return (
    <div className="h-screen w-full">
        <div className="relative h-full w-full overflow-hidden">
            <Image
                src={bgUrl}
                alt={"Story scenario"}
                fill
                className="object-cover transition-opacity duration-500"
                data-ai-hint="fantasy landscape"
                key={bgUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
            
            <div className="relative z-20 flex h-full flex-col p-4 md:p-6">
                 <div className="mb-4 space-y-2 z-10">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Sheet open={isShopOpen} onOpenChange={setIsShopOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30" onClick={() => setShopDefaultTab("upgrades")}>
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
                                                    const isSkillOwned = item.type === 'skill' && myCharacter?.skills?.includes(item.skill);
                                                    const canAfford = tokens >= item.cost;
                                                    const isDisabled = isContextLoading || !canAfford || isSkillOwned;
                                                    
                                                    return (
                                                    <Card key={item.id} className="bg-white">
                                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <p className="font-bold">{item.name}</p>
                                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                                            </div>
                                                            <Button onClick={() => purchaseShopItem(item)} disabled={isDisabled} className="w-28">
                                                                {isSkillOwned ? 'Owned' : (<>{item.cost}<Coins className="ml-2 h-4 w-4" /></>)}
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
                                                                <Button onClick={() => purchaseTokens(pkg)} disabled={isContextLoading} className="w-28">{pkg.price}</Button>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                            </TabsContent>
                                        </ScrollArea>
                                    </Tabs>
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
                                        <SheetDescription>Track your goals for this story. Hold down on an active objective for a hint.</SheetDescription>
                                    </SheetHeader>
                                    <ScrollArea className="flex-1 p-6">
                                        {objectives.length > 0 ? (
                                        <div className="space-y-4">
                                            {objectives.map(obj => (
                                                <Card key={obj.id} className={cn("transition-all", obj.status === 'completed' && "bg-muted text-muted-foreground")}
                                                    onMouseDown={() => obj.status === 'active' && handlePointerDown(obj)} onMouseUp={handlePointerUp}
                                                    onTouchStart={() => obj.status === 'active' && handlePointerDown(obj)} onTouchEnd={handlePointerUp}>
                                                    <CardContent className="p-4"><p>{obj.description}</p></CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        ) : <p className="text-center text-muted-foreground">No objectives right now.</p>}
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                            <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30" onClick={() => router.push('/story/map')}><Map className="h-5 w-5" /></Button>
                            <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30" onClick={() => router.push('/story/relationships')}><Users className="h-5 w-5" /></Button>
                        </div>
                        <div className="flex items-start gap-2 sm:items-center sm:gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="justify-between border-white/30 bg-black/20 text-white hover:bg-black/30">
                                        <span className="truncate pr-1">{myCharacter ? myCharacter.name.split(' ')[0] : "Me"}</span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[220px]">
                                    {myCharacter && (
                                        <>
                                        <DropdownMenuLabel>{myCharacter.name}'s Stats</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5 text-sm space-y-2">
                                            <div className="flex items-center gap-2" title="Health"><Heart className="h-4 w-4 text-red-400" /><span>Health: {myCharacter.health}/100</span></div>
                                            <div className="flex items-center gap-2" title="Happiness"><Smile className="h-4 w-4 text-yellow-400" /><span>Happiness: {myCharacter.happiness}/100</span></div>
                                            <div className="flex items-center gap-2" title="Money"><CircleDollarSign className="h-4 w-4 text-green-400" /><span>Money: {myCharacter.money}</span></div>
                                            <div className="flex items-center gap-2 cursor-pointer" title="View Inventory" onClick={() => setIsInventoryOpen(true)}><Briefcase className="h-4 w-4" /><span>Inventory: {myCharacter.items.length} items</span></div>
                                            <div className="flex items-center gap-2" title="Time of Day"><Clock className="h-4 w-4" /><span>Time: {timeOfDay}</span></div>
                                        </div>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <div className="flex h-10 items-center gap-2 rounded-md border border-white/30 bg-black/20 px-3 text-xs font-semibold text-white backdrop-blur-sm" title="Bookmarks">
                                <Bookmark className="h-4 w-4 text-primary" /><span>{bookmarks}</span>
                            </div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-white/30 bg-black/20 text-white hover:bg-black/30">
                                        <History className="h-5 w-5" /><span className="sr-only">View Story Log</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full h-full p-0 flex flex-col sm:max-w-md md:max-w-md">
                                    <SheetHeader className="p-6 pb-4 border-b"><SheetTitle>Story Log</SheetTitle><SheetDescription>A recap of your journey so far.</SheetDescription></SheetHeader>
                                    <ScrollArea className="flex-1 p-6"><div className="space-y-6">
                                        {storyHistory.length > 0 ? storyHistory.map((entry, index) => (<div key={index} className="space-y-2 pb-4 border-b last:border-b-0">
                                            <div className="flex items-center gap-3"><Avatar><AvatarImage src={entry.characterProfileImageUrl} /><AvatarFallback>{entry.characterName.charAt(0)}</AvatarFallback></Avatar><p><span className="font-semibold">{entry.characterName}</span> chose to:</p></div>
                                            <p className="pl-11 text-sm text-muted-foreground italic">"{entry.choice}"</p>
                                            <p className="pl-11 text-sm">{entry.outcomeDescription}</p>
                                        </div>)) : <p className="text-sm text-muted-foreground italic text-center py-4">Your story has just begun...</p>}
                                    </div></ScrollArea>
                                    <div className="p-4 border-t bg-background"><Button className="w-full" onClick={() => router.push('/dashboard')}>Exit Book</Button></div>
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
                <DialogHeader><DialogTitle>{myCharacter?.name}'s Inventory</DialogTitle><DialogDescription>Items currently held by the character.</DialogDescription></DialogHeader>
                {myCharacter && myCharacter.items.length > 0 ? (<ScrollArea className="max-h-60 mt-4"><div className="space-y-4 pr-4">
                    {myCharacter.items.map((item, index) => (<div key={index} className="pb-2 border-b last:border-b-0">
                        <p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>))}
                </div></ScrollArea>) : (<p className="mt-4 text-sm text-muted-foreground">The bag is empty.</p>)}
            </DialogContent>
        </Dialog>
        <Dialog open={!!helpObjective} onOpenChange={(isOpen) => !isOpen && setHelpObjective(null)}>
            <DialogContent>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><HelpCircle className="h-6 w-6 text-primary"/>Objective Help</DialogTitle><DialogDescription>{helpObjective?.description}</DialogDescription></DialogHeader>
                <div className="py-4">
                    {isGeneratingHelp ? (<div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin"/><span>Generating helpful steps...</span></div>) : (<ol className="list-decimal list-inside space-y-3">{helpSteps.map((step, index) => (<li key={index} className="text-sm">{step}</li>))}</ol>)}
                </div>
                <DialogFooter><Button onClick={(e) => { e.stopPropagation(); setHelpObjective(null); }}>Close</Button></DialogFooter>
            </DialogContent>
      </Dialog>
    </div>
  );
}
