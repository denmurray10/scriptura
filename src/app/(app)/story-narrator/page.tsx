

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { BookDashed, CornerDownLeft, Loader2, Send, Sparkles, Hourglass, History, UserPlus, Check, Library, Download, Plus, BookOpen, ArrowRight, ShoppingCart, Coins, Bookmark, Star, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { generateStorySuggestionsAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shopItems, tokenPackages } from "@/lib/config";
import { Separator } from "@/components/ui/separator";
import AdSense from "@/components/AdSense";

const choiceSchema = z.object({
  choice: z.string().min(5, "Your action should be at least 5 characters long.").max(200, "Your action is too long."),
});

export default function StoryNarratorPage() {
  const { 
    storyStatus, 
    currentScenario, 
    makeChoice, 
    isLoading, 
    activeCharacter,
    characters,
    activeStory,
    storyHistory,
    startStory,
    joinStory,
    scenes,
    currentSceneIndex,
    exportStory,
    continueToNextChapter,
    tokens,
    purchaseShopItem,
    purchaseTokens,
    bookmarks,
    consumeToken,
  } = useStory();
  const router = useRouter();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [hasAcknowledgedScenario, setHasAcknowledgedScenario] = useState(true);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopDefaultTab, setShopDefaultTab] = useState("upgrades");

  // State for the end-of-story feedback
  const [rating, setRating] = useState(0);
  const [pollAnswer, setPollAnswer] = useState<'yes' | 'no' | null>(null);
  const feedbackGiven = rating > 0 && pollAnswer !== null;

  const form = useForm<z.infer<typeof choiceSchema>>({
    resolver: zodResolver(choiceSchema),
    defaultValues: { choice: "" },
  });
  
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
    }
  }, [currentScenario, activeCharacter, storyStatus, activeStory]);

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
    await onSubmit({ choice: suggestion });
  };
  
  if (!activeStory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (storyStatus === "idle") {
     return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>Ready to Start?</CardTitle>
            <CardDescription>
                {activeCharacter 
                    ? `You've selected ${activeCharacter.name} to lead this tale.`
                    : 'Select a character to begin your adventure.'
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            { !activeCharacter ? (
                 <Button onClick={() => router.push('/characters')}>
                    <BookDashed className="mr-2 h-4 w-4" />
                    Choose a Character
                </Button>
            ) : (
                <Button onClick={startStory} disabled={isLoading}>
                    {isLoading ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Begin the Story
                </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const bgUrl = scenes?.[currentSceneIndex]?.url || 'https://placehold.co/1024x576.png';

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
    const chapterNumber = Math.floor(activeStory.storyHistory.length / 10);
    const summaryParts = activeStory.lastChapterSummary?.split('\n\n') || [];
    const mainSummary = summaryParts.length > 1 ? summaryParts.slice(0, -1).join('\n\n') : activeStory.lastChapterSummary || '';
    const cliffhanger = summaryParts.length > 1 ? summaryParts[summaryParts.length - 1] : '';

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <div className="relative z-20 flex h-full flex-col justify-center p-8 md:p-12 animate-in fade-in-50 duration-1000">
                <div className="max-w-xl space-y-4">
                    <h1 className="text-xl font-semibold text-white/90 font-headline">
                        Chapter {chapterNumber} Complete
                    </h1>
                    
                    {mainSummary && (
                        <div className="space-y-2">
                            <h2 className="text-lg font-medium text-white/80">Summary</h2>
                            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                                {mainSummary}
                            </p>
                        </div>
                    )}
                    
                    {cliffhanger && (
                        <div className="space-y-2 pt-3 border-t border-white/10">
                            <h2 className="text-lg font-medium text-white/80">Meanwhile...</h2>
                            <p className="text-sm text-white/70 leading-relaxed italic whitespace-pre-wrap">
                                {cliffhanger}
                            </p>
                        </div>
                    )}
                    
                    {/* <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_VIDEO_AD_SLOT!} /> */}

                    <div className="pt-4">
                        <Button onClick={continueToNextChapter} disabled={isLoading} size="lg" className="bg-white text-black hover:bg-white/90">
                            {isLoading ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                            Start Chapter {chapterNumber + 1}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
  }
  
  const renderStoryContent = () => {
    if (!activeCharacter) {
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle>Select a Character</CardTitle>
              <CardDescription>
                Something went wrong. Please return to the dashboard and select a character.
              </CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
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
          <div className="mt-4 flex-shrink-0">
            { !hasAcknowledgedScenario && currentScenario ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-lg animate-in fade-in-50 duration-500">
                  <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed text-white/95 drop-shadow-md">
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
                              <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
                              <TabsTrigger value="tokens">Buy Tokens</TabsTrigger>
                          </TabsList>
                      </div>
                      <ScrollArea className="flex-1">
                          <TabsContent value="upgrades" className="mt-0 p-6 space-y-4">
                              {shopItems
                                .filter(item => item.id === 'recruit_playable_character' || item.id === 'recruit_ai_companion' || item.id === 'refill_bookmarks')
                                .map(item => {
                                  const canAfford = tokens >= item.cost;
                                  const isDisabled = isLoading || !canAfford;
                                
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
                                                {item.cost}
                                                <Coins className="ml-2 h-4 w-4" />
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
              </div>

              {/* Right-aligned controls */}
              <div className="flex items-start gap-2 sm:items-center sm:gap-4">
                 <div className="flex h-10 items-center rounded-md border border-white/30 bg-black/20 px-3 text-sm font-semibold text-white backdrop-blur-sm">
                    {activeCharacter?.name}
                 </div>
                 <div className="flex h-10 items-center gap-2 rounded-md border border-white/30 bg-black/20 px-3 text-xs font-semibold text-white backdrop-blur-sm" title="Bookmarks">
                      <Bookmark className="h-4 w-4 text-primary" />
                      <span>{bookmarks}</span>
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
                          storyHistory.map((entry, index) => (
                            <div key={index} className="space-y-2 pb-4 border-b last:border-b-0">
                              <div className="flex items-center gap-3">
                                <Image src={entry.characterProfileImageUrl} alt={entry.characterName} width={32} height={32} className="rounded-full" />
                                <p><span className="font-semibold">{entry.characterName}</span> chose to:</p>
                              </div>
                              <p className="pl-11 text-sm text-muted-foreground italic">"{entry.choice}"</p>
                              <p className="pl-11 text-sm">{entry.outcomeDescription}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-4">Your story has just begun...</p>
                        )}
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
    </div>
  );
}
