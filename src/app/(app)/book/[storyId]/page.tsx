
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useStory } from "@/contexts/StoryContext";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Bookmark, Download, Loader2, Share2, Users, Star, Sparkles, Gamepad2, Lock, Check, Undo2, ArrowRight, UserPlus, Mic, MessageSquare, BrainCircuit, Shield, Repeat, ClipboardCopy, Volume2, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story, Character } from "@/types";
import { AnimateInView } from "@/components/AnimateInView";
import { Separator } from "@/components/ui/separator";
import { generateCharacterQuoteAction, generateStoryTeaserAction, generateSpeechAction } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import BookLoader from "@/components/BookLoader";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";


const CharacterQuote = ({ character }: { character: Character }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="relative w-12 h-[72px] flex-shrink-0">
        <Image
          src={character.profileImageUrl}
          alt={character.name}
          fill
          className="object-cover rounded-md"
          data-ai-hint="character portrait"
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{character.name}</p>
          {character.isPlayable && <Badge variant="outline">Main Character</Badge>}
        </div>
        {character.quote ? (
          <p className="text-sm text-muted-foreground italic">
            “{character.quote}”
          </p>
        ) : (
          <div className="space-y-2 mt-1">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}
      </div>
    </div>
  );
};


const StoryTeaser = ({ story }: { story: Story | null }) => {
    return (
        <div className="mt-4 max-w-prose text-sm text-muted-foreground">
            {!story || !story.teaser ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            ) : (
                <p>{story.teaser}</p>
            )}
        </div>
    );
};


export default function BookDetailPage() {
  const { getStoryById, setActiveStoryId, exportStory, stories, displayPlan, setStoryMode, toggleBookmark, restartStory, followAuthor, followedAuthors, currentUser, aboutMe, updateStory } = useStory();
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingStory, setIsStartingStory] = useState(false);
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'narrator' | 'immersive' | 'audio' | null>(null);
  const [isRestartAlertOpen, setIsRestartAlertOpen] = useState(false);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);

  // State for synopsis audio
  const [isPlayingSynopsis, setIsPlayingSynopsis] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (storyId) {
      const fetchedStory = getStoryById(storyId);
      if (fetchedStory) {
        setStory(fetchedStory);
      }
      setIsLoading(false);
    }
  }, [storyId, stories, getStoryById]);
  
  useEffect(() => {
    if (!story) return;

    let isMounted = true;
    
    const fetchMissingContent = async () => {
        let needsUpdate = false;
        const updatePayload: Partial<Story> = {};
        
        // Batch all promises
        const promises: Promise<any>[] = [];

        if (!story.teaser) {
            promises.push(
                generateStoryTeaserAction({
                    title: story.name,
                    genre: story.genre,
                    plot: story.plot,
                }).catch(() => ({ teaser: "Get ready for an exciting adventure." })) // Fallback
            );
        } else {
            promises.push(Promise.resolve(null)); // Placeholder
        }

        const charactersToUpdate = story.characters.filter(c => !c.quote);
        charactersToUpdate.forEach(char => {
            promises.push(
                generateCharacterQuoteAction({
                    plot: story.plot,
                    character: { name: char.name, traits: char.traits, backstory: char.backstory }
                }).then(result => ({ charId: char.id, quote: result.quote }))
                  .catch(() => ({ charId: char.id, quote: "I'd rather not talk about it right now." })) // Fallback
            );
        });

        if (promises.length <= 1 && !story.teaser) { // Only run if there is something to update
             if (!story.teaser) promises.shift(); // Remove placeholder
             if (promises.length === 0) return;
        };

        const results = await Promise.all(promises);
        if (!isMounted) return;

        const teaserResult = results[0];
        if (teaserResult) {
            updatePayload.teaser = teaserResult.teaser;
            needsUpdate = true;
        }
        
        const quoteResults = results.slice(1).filter(Boolean);
        if (quoteResults.length > 0) {
            const updatedCharacters = story.characters.map(char => {
                const newQuoteResult = quoteResults.find(q => q.charId === char.id);
                if (newQuoteResult) {
                    return { ...char, quote: newQuoteResult.quote };
                }
                return char;
            });
            updatePayload.characters = updatedCharacters;
            needsUpdate = true;
        }

        if (needsUpdate) {
            updateStory(story.id, updatePayload);
        }
    };

    fetchMissingContent();

    return () => {
        isMounted = false;
    }
  }, [story, updateStory]);


  useEffect(() => {
    // Reset selection when dialog is closed
    if (!isModeSelectOpen) {
      setSelectedMode(null);
    }
  }, [isModeSelectOpen]);

   useEffect(() => {
    // Setup audio element and its event listeners
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onplay = () => setIsPlayingSynopsis(true);
        audioRef.current.onpause = () => setIsPlayingSynopsis(false);
        audioRef.current.onended = () => setIsPlayingSynopsis(false);
    }
    // Cleanup audio element on component unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

  if (isLoading) {
    return <BookLoader />;
  }

  if (!story) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Story Not Found</h1>
        <p className="text-muted-foreground">
          The story you are looking for does not exist or has been moved.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handlePlaySynopsis = () => {
    if (!story?.audioTeaserUrl || !audioRef.current) {
      toast({
          variant: "destructive",
          title: "Audio Not Available",
          description: "The audio for this synopsis could not be loaded."
      });
      return;
    }

    if (isPlayingSynopsis) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = story.audioTeaserUrl;
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
  };

  const handleStartReading = async () => {
    if (!story || !selectedMode) return;
    setIsStartingStory(true);
    await setStoryMode(story.id, selectedMode);
    setActiveStoryId(story.id);

    const path = selectedMode === 'narrator' ? '/story-narrator' : selectedMode === 'audio' ? '/story-audio' : '/story';
    router.push(path);

    setIsStartingStory(false);
    setIsModeSelectOpen(false);
  };

  const handleRestartConfirm = async () => {
    if (!story) return;
    await restartStory(story.id);
    toast({
        title: "Story Restarted",
        description: `Your progress for "${story.name}" has been reset.`,
    });
    setIsRestartAlertOpen(false);
  };
  
  const handleShare = async () => {
    const shareData = {
      title: story.name,
      text: `Check out this interactive story I'm reading: ${story.name}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (error) {
      // Fallback to copying URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "The story URL has been copied to your clipboard.",
        });
      } catch (copyError) {
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Could not share or copy the link.",
        });
      }
    }
  };
  
  const handleCopyInviteCode = () => {
    if (!story.inviteCode) return;
    navigator.clipboard.writeText(story.inviteCode);
    toast({
      title: "Invite Code Copied!",
    });
  };

  const narratorFeatures = [
      { title: "Pure Narrative Focus", description: "Immerse yourself in the plot without the distraction of stats or inventory management. This mode is all about the story, letting you experience the narrative as a streamlined, choice-driven novel.", icon: BookOpen },
      { title: "AI-Powered Suggestions", description: "Never get stuck. Our AI provides creative, context-aware suggestions for your next move, ensuring the story always flows. It's like having a co-author to help you when you need it.", icon: Sparkles },
      { title: "Fast-Paced Gameplay", description: "Ideal for casual reading sessions. Jump in, make a few impactful choices, and see where the story takes you. Perfect for playing on the go or when you have a few spare minutes.", icon: ArrowRight },
      { title: "Effortless Storytelling", description: "Enjoy a 'lean-back' experience where you can focus entirely on your character's journey. No need to manage resources—just read, choose, and enjoy the unfolding tale.", icon: BrainCircuit },
  ];

  const immersiveFeatures = [
      { title: "Full RPG System", description: "Go beyond the story with a deep RPG layer. Manage your character's health, happiness, money, and inventory. Every choice has a tangible impact on your character's state.", icon: Gamepad2 },
      { title: "Dynamic Objectives & Rewards", description: "Receive and complete goals that emerge organically from your choices. Successfully completing objectives earns you valuable Token rewards, which you can spend on powerful upgrades and new content.", icon: Check },
      { title: "Deep Character Progression", description: "Level up your character by making choices and completing objectives. Spend stat points to improve your Intellect, Charisma, Wits, and Willpower, unlocking new possibilities in the story.", icon: UserPlus },
      { title: "Meaningful Consequences", description: "Your character's skills, items, and stats directly influence the outcome of your choices. A high wits might spot a hidden clue, while low health makes a fight far more perilous.", icon: Shield },
  ];
  
  const audioFeatures = [
    { title: "Fully Voiced Narration", description: "Listen to the entire story, from the rich descriptions of the world to the character dialogues, all brought to life with high-quality voice acting. It's a cinematic audio experience.", icon: Mic },
    { title: "Voice-Powered Choices", description: "Become part of the story like never before. Use your own voice to make decisions for your character, creating a truly hands-free and immersive interactive experience.", icon: MessageSquare },
    { title: "Immersive Soundscapes", description: "It's not just narration. The world is filled with background sounds, ambient music, and sound effects that pull you deeper into the story's environment, making the world feel alive.", icon: Mic },
    { title: "On-the-Go Storytelling", description: "Perfect for your commute, a workout, or relaxing at home. Let the story unfold around you without ever needing to look at a screen. Experience your adventure anywhere, anytime.", icon: Repeat },
  ];

  const renderStartButton = () => {
    if (story.isCoop) {
        return (
            <Button className="flex-1" onClick={() => router.push(`/co-op/${story.id}/lobby`)}>
                <Users className="mr-2" />
                Enter Lobby
            </Button>
        );
    }
      
    if (story.storyHistory && story.storyHistory.length > 0) {
        const path = story.storyMode === 'narrator' ? '/story-narrator' : '/story';
        return (
            <Button className="flex-1" onClick={() => {
                setActiveStoryId(story.id);
                router.push(path);
            }}>
                <BookOpen className="mr-2" />
                Continue Story
            </Button>
        );
    }

    const isFreePlan = displayPlan === 'Free';

    const FeatureDetailDialog = ({ title, description, features, children }: { title: string, description: string, features: {title:string, description:string, icon:any}[], children: React.ReactNode }) => (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-none w-screen h-screen p-0 sm:max-w-2xl sm:h-auto sm:rounded-lg flex flex-col">
          <DialogHeader className="p-6">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 pt-0">
                <ul className="space-y-4 text-sm text-muted-foreground">
                    {features.map(feature => (
                        <li key={feature.title} className="flex items-start gap-4">
                            <feature.icon className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-foreground">{feature.title}</p>
                              <p>{feature.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
    

    return (
      <Dialog open={isModeSelectOpen} onOpenChange={setIsModeSelectOpen}>
        <DialogTrigger asChild>
            <Button className="flex-1">
                <BookOpen className="mr-2" />
                Start Reading
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-8" hideCloseButton>
            <DialogHeader className="sr-only">
                <DialogTitle>Choose Your Experience</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                <Card 
                  className={cn(
                      "hover:border-primary transition-all duration-300 cursor-pointer flex flex-col text-left transform hover:-translate-y-1 relative",
                      selectedMode === 'narrator' && "border-primary ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMode('narrator')}
                >
                    <CardHeader>
                        <Sparkles className="h-8 w-8 text-primary mb-2" />
                        <CardTitle>Narrator Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-muted-foreground mb-4">A streamlined, choice-driven novel experience focused purely on the narrative.</p>
                        <FeatureDetailDialog title="Narrator Mode" description="For the purist who loves a good story. Narrator Mode offers a 'lean-back' reading experience, letting you focus on the characters and plot without the complexity of game mechanics. It's the fastest way to enjoy a tale." features={narratorFeatures}>
                           <Button variant="link" className="p-0 h-auto self-start">View More</Button>
                        </FeatureDetailDialog>
                    </CardContent>
                    {selectedMode === 'narrator' && (
                        <div className="absolute bottom-4 right-4 animate-in fade-in-50 duration-500">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStartReading(); }} disabled={isStartingStory}>
                              {isStartingStory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Confirm & Start
                            </Button>
                        </div>
                    )}
                </Card>
                
                <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                            <div
                                onClick={() => !isFreePlan && setSelectedMode('immersive')}
                                className={cn("rounded-lg", isFreePlan && "cursor-not-allowed opacity-70")}
                            >
                                <Card className={cn(
                                    "transition-all duration-300 flex flex-col h-full text-left transform relative",
                                    !isFreePlan && "hover:border-primary cursor-pointer hover:-translate-y-1",
                                    selectedMode === 'immersive' && "border-primary ring-2 ring-primary"
                                )}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            {isFreePlan ? <Lock className="h-8 w-8 text-muted-foreground mb-2" /> : <Gamepad2 className="h-8 w-8 text-primary mb-2" />}
                                            {!isFreePlan && <Badge>Premium</Badge>}
                                        </div>
                                        <CardTitle>Immersive Mode</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-between">
                                        <p className="text-sm text-muted-foreground mb-4">A full RPG experience with stats, items, and meaningful objectives.</p>
                                         <FeatureDetailDialog title="Immersive Mode" description="For the strategist who loves deep gameplay. Immersive Mode transforms the story into a full-fledged RPG. Your choices have statistical consequences, and you'll need to manage your character's state to survive and thrive." features={immersiveFeatures}>
                                           <Button variant="link" className="p-0 h-auto self-start">View More</Button>
                                         </FeatureDetailDialog>
                                    </CardContent>
                                    {selectedMode === 'immersive' && (
                                        <div className="absolute bottom-4 right-4 animate-in fade-in-50 duration-500">
                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStartReading(); }} disabled={isStartingStory}>
                                              {isStartingStory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                              Confirm & Start
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </TooltipTrigger>
                        {isFreePlan && (
                            <TooltipContent>
                                <p>Upgrade to a premium plan to unlock Immersive Mode.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <Card 
                  className={cn(
                      "hover:border-primary transition-all duration-300 cursor-pointer flex flex-col text-left transform hover:-translate-y-1 relative",
                      selectedMode === 'audio' && "border-primary ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMode('audio')}
                >
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Mic className="h-8 w-8 text-primary mb-2" />
                            {/* <Badge>New!</Badge> */}
                        </div>
                        <CardTitle>Audio Book</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-muted-foreground mb-4">A fully voiced, hands-free listening and response experience.</p>
                        <FeatureDetailDialog title="Audio Book" description="For the listener who wants to be part of the story. Audio Book mode transforms your adventure into an interactive podcast. Listen to a fully voiced narrative and make your choices by speaking, offering a truly hands-free experience." features={audioFeatures}>
                           <Button variant="link" className="p-0 h-auto self-start">View More</Button>
                        </FeatureDetailDialog>
                    </CardContent>
                    {selectedMode === 'audio' && (
                        <div className="absolute bottom-4 right-4 animate-in fade-in-50 duration-500">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStartReading(); }} disabled={isStartingStory}>
                              {isStartingStory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Confirm & Start
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </DialogContent>
      </Dialog>
    );
  };

  const mainCharacter = story.characters.find(c => c.isPlayable);
  const suggestedStories = mainCharacter
    ? stories.filter(s => {
        if (s.id === story.id) return false;
        const otherMainChar = s.characters.find(c => c.isPlayable);
        return otherMainChar?.name === mainCharacter.name;
    })
    : [];
  
  const authorStories = story.authorId ? stories.filter(s => s.authorId === story.authorId && s.id !== story.id) : [];
  
  return (
    <div>
      <AnimateInView tag="div" className="p-4 md:p-8 relative z-10">
        <header className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary/10" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div className="w-10" />
        </header>

        <main className="space-y-6">
          <section className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <div className="w-40 flex-shrink-0 md:w-48">
              <div className="book-3d">
                  <div className="book-3d__inner">
                    <div className="book-3d__cover aspect-[9/16] bg-muted overflow-hidden rounded-[2px_6px_6px_2px]">
                        {story.videoUrl ? (
                            <video src={story.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                            <Image
                                src={story.imageUrl || "https://placehold.co/400x600.png"}
                                alt={`Cover of ${story.name}`}
                                width={400}
                                height={600}
                                className="w-full h-full object-cover"
                                data-ai-hint="book cover"
                            />
                        )}
                    </div>
                  </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold font-headline leading-tight">
                {story.name}
              </h2>
              <p className="mt-1 text-lg text-muted-foreground">
                {story.genre} Story
              </p>
              <StoryTeaser story={story} />
            </div>
          </section>

          <section className="flex items-center justify-center gap-2">
            {renderStartButton()}
            <Button variant="outline" size="icon" onClick={() => toggleBookmark(story.id)}>
              <Bookmark className={cn(story.isBookmarked && "fill-current text-primary")} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsRestartAlertOpen(true)} disabled={!story.storyHistory || story.storyHistory.length === 0}>
              <Undo2 />
            </Button>
          </section>

          <Separator />
          
          {story.isCoop && story.inviteCode && (
             <section>
                 <h3 className="text-xl font-bold font-headline">Invite Friends</h3>
                 <div className="mt-2 p-4 rounded-lg bg-muted/50 border space-y-2">
                     <p className="text-sm text-muted-foreground">Share this code with friends so they can join your co-op adventure.</p>
                     <div className="flex items-center gap-2">
                         <Input readOnly value={story.inviteCode} className="font-mono tracking-widest text-lg h-11" />
                         <Button size="icon" variant="secondary" onClick={handleCopyInviteCode}>
                           <ClipboardCopy className="h-5 w-5" />
                         </Button>
                     </div>
                 </div>
             </section>
          )}

          <section>
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-headline">Synopsis</h3>
                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handlePlaySynopsis} disabled={!story.audioTeaserUrl}>
                    {isPlayingSynopsis ? <Pause className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                </Button>
            </div>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {story.plot}
            </div>
          </section>
          
          {mainCharacter && suggestedStories.length > 0 && (
            <section>
              <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-8">
                          {[story, ...suggestedStories].slice(0, 3).map((book) => (
                            <div key={book.id} className="relative h-24 w-16 border-2 border-background rounded-lg overflow-hidden aspect-[9/16] shadow-lg">
                              <Image src={book.imageUrl || 'https://placehold.co/120x180.png'} alt={book.name} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">The Journey Continues</p>
                          <p className="text-sm text-muted-foreground">Explore more adventures with {mainCharacter.name}.</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>The {mainCharacter.name} Collection</DialogTitle>
                    <DialogDescription>
                      All stories featuring {mainCharacter.name} as the main character.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="bookshelf">
                        <Carousel opts={{ align: "start" }} className="w-full px-4">
                            <CarouselContent className="-ml-4">
                                {[story, ...suggestedStories].map((suggestion) => (
                                    <CarouselItem key={suggestion.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5">
                                        <Link href={`/book/${suggestion.id}`} className="block w-full" onClick={() => setIsSeriesDialogOpen(false)}>
                                            <Image
                                              src={suggestion.imageUrl || 'https://placehold.co/120x180.png'}
                                              alt={suggestion.name}
                                              width={120}
                                              height={180}
                                              style={{ objectFit: 'cover' }}
                                              className="shadow-md rounded-[2px] w-full h-auto aspect-[9/16]"
                                              data-ai-hint="story cover"
                                            />
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                        <div className="shelf-shadows" />
                        <div className="shelf" />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </section>
          )}

           <section>
            <h3 className="text-xl font-bold font-headline mb-4">Characters Say...</h3>
            <div className="space-y-4">
              {story.characters?.map((char) => (
                <CharacterQuote 
                    key={char.id} 
                    character={char} 
                />
              ))}
            </div>
          </section>

          <Separator />
          
          {story.authorId && (
            <section>
                <h3 className="text-xl font-bold font-headline mb-4">About the Author</h3>
                 <Dialog open={isAuthorDialogOpen} onOpenChange={setIsAuthorDialogOpen}>
                    <DialogTrigger asChild>
                        <Card className="bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={story.authorPhotoURL} alt={story.authorName} />
                                    <AvatarFallback>{story.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{story.authorName}</p>
                                    <p className="text-sm text-muted-foreground">{authorStories.length} other stories</p>
                                </div>
                                <Button variant="outline" size="sm">View Profile</Button>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={story.authorPhotoURL} alt={story.authorName} />
                                    <AvatarFallback>{story.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <DialogTitle>{story.authorName}</DialogTitle>
                                    <DialogDescription className="mt-2">
                                        {currentUser?.uid === story.authorId
                                            ? aboutMe || "This author hasn't written a bio yet."
                                            : story.authorAboutMe || "This author hasn't written a bio yet."}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant={followedAuthors.includes(story.authorId) ? "secondary" : "default"}
                                onClick={() => story.authorId && followAuthor(story.authorId)}
                                className="w-full sm:w-auto"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {followedAuthors.includes(story.authorId) ? "Unfollow" : "Follow Author"}
                            </Button>
                        </DialogHeader>
                        {authorStories.length > 0 ? (
                            <div className="mt-4">
                                <div className="bookshelf">
                                    <Carousel opts={{ align: "start" }} className="w-full px-4">
                                        <CarouselContent className="-ml-4">
                                            {authorStories.map((s) => (
                                                <CarouselItem key={s.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5">
                                                    <Link href={`/book/${s.id}`} className="block w-full" onClick={() => setIsAuthorDialogOpen(false)}>
                                                        <Image
                                                          src={s.imageUrl || 'https://placehold.co/120x180.png'}
                                                          alt={s.name}
                                                          width={120}
                                                          height={180}
                                                          style={{ objectFit: 'cover' }}
                                                          className="shadow-md rounded-[2px] w-full h-auto aspect-[9/16]"
                                                          data-ai-hint="story cover"
                                                        />
                                                    </Link>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                    </Carousel>
                                    <div className="shelf-shadows" />
                                    <div className="shelf" />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">This author has not published any other public stories yet.</p>
                        )}
                    </DialogContent>
                </Dialog>
            </section>
          )}

          <Separator />


          <section className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
            <div>
              <h4 className="font-bold font-headline">User Feedback</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-primary">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground">(4.5k reviews)</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold font-headline">Language</h4>
              <p className="mt-1 text-muted-foreground">
                Standard English (USA & UK)
              </p>
            </div>
             <div>
              <h4 className="font-bold font-headline">Characters</h4>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{story.characters.length} characters</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold font-headline">Format</h4>
              <p className="mt-1 text-muted-foreground">Interactive Digital</p>
            </div>
          </section>

        </main>
      </AnimateInView>
      <AlertDialog open={isRestartAlertOpen} onOpenChange={setIsRestartAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete your progress for "{story.name}" and cannot be undone. You will start over from the beginning.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestartConfirm}>
                    Restart
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
