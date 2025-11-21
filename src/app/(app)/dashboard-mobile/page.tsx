

"use client"

import { Flame, Star, Search, Library, User, Bookmark, Crown, Home, Info, BarChart3, Users, Heart, Gift, PlayCircle, Loader2, ArrowRight, BookHeart, MessageSquare, Edit, Mic, Plus, GalleryHorizontal, Target, Waves, ChevronRight, CheckCircle, Quote, BookPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Progress } from "@/components/ui/progress";
import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import { genreOptions, mockFriendActivity } from "@/lib/config";
import type { Story, Character, CommunityPoll, FriendActivity, Shelf } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useRef, useEffect, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateConversationStartersAction, generateCharacterResponseAction } from "@/lib/actions";
import { BookCover as DesktopBookCover } from '../dashboard-v2/page';
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


const BookCover = ({ story, size = 'normal', children }: { story: Story, size?: 'normal' | 'small', children?: React.ReactNode }) => {
  const router = useRouter();
  
  const handleBookClick = () => {
      router.push(`/book/${story.id}`);
  };

  const sizeClasses = {
      normal: 'w-[120px]',
      small: 'w-[90px]'
  };
  
  return (
    <div onClick={handleBookClick} className={cn(sizeClasses[size], "flex-shrink-0 cursor-pointer group relative")}>
        <div className="w-full h-auto aspect-[9/16] shadow-md rounded-[5px] overflow-hidden bg-muted">
            {story.videoUrl ? (
                <video src={story.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <Image 
                    src={story.imageUrl || 'https://placehold.co/200x300.png'} 
                    alt={story.name} 
                    width={size === 'small' ? 90 : 120}
                    height={size === 'small' ? 135 : 180}
                    data-ai-hint="book cover"
                    className="w-full h-full object-cover"
                />
            )}
        </div>
        {story.isCoop && (
            <Badge className="absolute top-1 right-1 bg-primary/80 backdrop-blur-sm px-1.5">
                <Users className="w-3 h-3" />
            </Badge>
        )}
        {children}
    </div>
  )
}

const CommunityChoiceModal = () => {
    const [poll, setPoll] = useState<CommunityPoll | null>(null);
    const [voted, setVoted] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Mock poll data for demonstration
        const mockPoll: CommunityPoll = {
            id: 'dilemma1',
            storyName: 'The Sunken City',
            storyCoverUrl: 'https://placehold.co/200x300.png',
            question: 'The mysterious artifact glows dimly. Do you touch it or leave it be?',
            options: [
                { id: 'opt1', text: 'Touch the artifact', votes: 482 },
                { id: 'opt2', text: 'Leave it and report back', votes: 1109 },
            ]
        };
        setPoll(mockPoll);
        
        const hasInteracted = localStorage.getItem(`interacted-poll-${mockPoll.id}`);
        if (!hasInteracted) {
            setTimeout(() => setIsOpen(true), 2000);
        }
    }, []);

    const handleVote = (optionId: string) => {
        if (!poll) return;
        setVoted(optionId);
        localStorage.setItem(`interacted-poll-${poll.id}`, 'true');
        setTimeout(() => setIsOpen(false), 1500);
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && poll && !voted) {
            localStorage.setItem(`interacted-poll-${poll.id}`, 'true');
        }
        setIsOpen(open);
    };

    if (!poll) return null;

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0) + (voted ? 1 : 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choice of the Week</DialogTitle>
                    <DialogDescription>
                        Your decision will influence the official canon of "{poll.storyName}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-center mb-4 font-semibold">{poll.question}</p>
                    <div className="space-y-3">
                        {poll.options.map(option => {
                            const currentVotes = option.votes + (voted === option.id ? 1 : 0);
                            const percentage = totalVotes > 0 ? (currentVotes / totalVotes * 100) : 0;
                            const isVotedOption = voted === option.id;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleVote(option.id)}
                                    disabled={!!voted}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                                        isVotedOption ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                                        !!voted && !isVotedOption && "opacity-60"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">{option.text}</span>
                                        {voted && <span className="text-sm font-bold">{Math.round(percentage)}%</span>}
                                    </div>
                                    {voted && (
                                        <Progress value={percentage} className="h-2 mt-1" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const BookOfTheDay = () => {
    const { stories, handleStoryClick, dashboardConfig } = useStory();

    const featuredStory = useMemo(() => {
        const publicStories = stories.filter(s => s.isPublic);
        if (publicStories.length === 0) return null;

        // 1. Check for hardcoded override
        const rem6Story = publicStories.find(s => s.name === "rem 6");
        if(rem6Story) return rem6Story;
        
        // 2. Check for manual override from dashboard config
        if (dashboardConfig?.bookOfTheDayStoryId) {
            const story = stories.find(s => s.id === dashboardConfig.bookOfTheDayStoryId);
            if (story) return story;
        }
        
        // 3. Fallback to most interacted-with story
        return publicStories.sort((a,b) => (b.storyHistory?.length || 0) - (a.storyHistory?.length || 0))[0];
    }, [stories, dashboardConfig]);
    
    if (!featuredStory) {
        return (
            <section>
                <Card className="border-none">
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <p>A new adventure will be featured soon. Create a public story to have a chance to be featured!</p>
                        <Button variant="link" asChild><Link href="/create">Create a Story</Link></Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    const backgroundUrl = featuredStory.scenes?.[0]?.url || "https://placehold.co/600x400.png";
    const hasStarted = (featuredStory.storyHistory?.length ?? 0) > 0;

    return (
        <section onClick={() => handleStoryClick(featuredStory.id)}>
             <Card className="overflow-hidden relative text-white h-[250px] flex flex-col justify-end p-4 bg-foreground rounded-t-none border-none">
                <Image
                    src={backgroundUrl}
                    alt={`${featuredStory.name} background`}
                    fill
                    className="object-cover opacity-30"
                    data-ai-hint={`${featuredStory.genre} landscape`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-28 h-auto aspect-[9/16] rounded shadow-2xl overflow-hidden bg-muted">
                        {featuredStory.videoUrl ? (
                            <video src={featuredStory.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                            <Image 
                                src={featuredStory.imageUrl || 'https://placehold.co/200x300.png'}
                                alt={featuredStory.name}
                                width={80}
                                height={120}
                                className="w-full h-full object-cover"
                                data-ai-hint="book cover"
                            />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold uppercase tracking-wider text-xs text-white/80">Book OF THE WEEK</p>
                        <h3 className="font-bold font-headline text-lg mt-1">{featuredStory.name}</h3>
                        <p className="text-xs text-white/80 line-clamp-4 mt-2">{featuredStory.plot}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4 bg-white/20 hover:bg-white/30 text-white rounded-full h-8 px-4"
                        >
                          {hasStarted ? "Lead The Way" : "Start Your Journey"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
             </Card>
        </section>
    );
};

const ContinueReadingCarousel = () => {
    const { stories, handleStoryClick } = useStory();

    const readingList = useMemo(() => {
        return [...stories]
            .filter(story => (story.storyHistory?.length ?? 0) > 0)
            .sort((a, b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0));
    }, [stories]);

    if (readingList.length === 0) {
        return null;
    }

    return (
        <section className="mt-8">
            <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-4 basis-full">
                    {readingList.map((story) => {
                        const backgroundUrl = story.scenes?.[story.currentSceneIndex]?.url || "https://placehold.co/600x400.png";
                        const progress = (story.storyHistory.length / 120) * 100;
                        const chapter = Math.floor((story.storyHistory?.length || 0) / 10) + 1;
                        const mainCharacter = story.characters.find(c => c.isPlayable);
                        const companions = story.characters.filter(c => !c.isPlayable).slice(0, 2);

                        return (
                            <CarouselItem key={story.id} className="pl-4 basis-full">
                                <Card className="overflow-hidden relative text-white h-[250px] flex flex-col justify-end p-4 bg-foreground rounded-xl border-none" onClick={() => handleStoryClick(story.id)}>
                                    <Image
                                        src={backgroundUrl}
                                        alt={`${story.name} background`}
                                        fill
                                        className="object-cover opacity-30"
                                        data-ai-hint={`${story.genre} landscape`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold uppercase tracking-wider text-xs text-white/80">Continue Reading</p>
                                            <h3 className="font-bold font-headline text-lg mt-1">{story.name}</h3>
                                            <p className="text-xs text-white/80 line-clamp-2 mt-2">{story.plot}</p>
                                            <div className="w-full mt-2">
                                                <div className="flex justify-between items-center text-xs text-white/80 mt-1">
                                                    <span>Chapter {chapter}</span>
                                                </div>
                                                <Progress value={progress} className="h-1 mt-1 bg-white/20" />
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                {mainCharacter && (
                                                    <div className="w-8 h-12 rounded-sm overflow-hidden border-2 border-primary">
                                                        <Image src={mainCharacter.profileImageUrl} alt={mainCharacter.name} width={32} height={48} className="object-cover w-full h-full" />
                                                    </div>
                                                )}
                                                {companions.map(comp => (
                                                     <div key={comp.id} className="w-8 h-12 rounded-sm overflow-hidden border-2 border-background/50">
                                                        <Image src={comp.profileImageUrl} alt={comp.name} width={32} height={48} className="object-cover w-full h-full" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-28 h-auto aspect-[9/16] rounded shadow-2xl overflow-hidden bg-muted flex-shrink-0">
                                            {story.videoUrl ? (
                                                <video src={story.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                            ) : (
                                                <Image 
                                                    src={story.imageUrl || 'https://placehold.co/200x300.png'}
                                                    alt={story.name}
                                                    width={80}
                                                    height={120}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint="book cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
            </Carousel>
        </section>
    );
};


const HotSeatInterview = () => {
    const { stories } = useStory();
    const router = useRouter();
    const { toast } = useToast();

    const [api, setApi] = useState<CarouselApi>();
    const [activeCharacter, setActiveCharacter] = useState<{character: Character, story: Story} | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [answer, setAnswer] = useState<string | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    
    const charactersToDisplay = useMemo(() => {
        if (!stories) return [];
        const allPlayableChars = stories.flatMap(s =>
            s.characters.filter(c => c.isPlayable).map(c => ({ character: c, story: s }))
        );
        const uniqueCharactersMap = new Map();
        allPlayableChars.forEach(item => {
            if (!uniqueCharactersMap.has(item.character.id)) {
                uniqueCharactersMap.set(item.character.id, item);
            }
        });
        // Shuffle the characters
        const shuffled = Array.from(uniqueCharactersMap.values()).sort(() => 0.5 - Math.random());
        return shuffled;
    }, [stories]);


    useEffect(() => {
        if (charactersToDisplay.length > 0 && !activeCharacter) {
            setActiveCharacter(charactersToDisplay[0]);
        }
    }, [charactersToDisplay, activeCharacter]);


    useEffect(() => {
        if (!api) return;
        const onSelect = (carouselApi: CarouselApi) => {
            const selectedIndex = carouselApi.selectedScrollSnap();
            if (charactersToDisplay[selectedIndex]) {
                setActiveCharacter(charactersToDisplay[selectedIndex]);
            }
        };
        api.on("select", onSelect);
        return () => { api.off("select", onSelect); };
    }, [api, charactersToDisplay]);
    
    useEffect(() => {
        if (!activeCharacter) return;
        const { character, story } = activeCharacter;
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            setSuggestions([]); setAnswer(null); setSelectedQuestion(null);
            try {
                const result = await generateConversationStartersAction({
                    character: { name: character.name, traits: character.traits, backstory: character.backstory },
                    story: { title: story.name, plot: story.plot }
                });
                setSuggestions(result.starters);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Could not load interview questions.' });
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [activeCharacter, toast]);

    const handleQuestionClick = async (question: string) => {
        if (!activeCharacter || isAnswering) return;
        const { character, story } = activeCharacter;
        setIsAnswering(true); setSelectedQuestion(question); setAnswer(null);
        try {
            const result = await generateCharacterResponseAction({
                character: { name: character.name, traits: character.traits, backstory: character.backstory, sex: character.sex, age: character.age },
                story: { title: story.name, plot: story.plot },
                chatHistory: [], userMessage: question,
            });
            setAnswer(result.response);
        } catch (error) {
            setAnswer("I'm not sure how to respond to that right now.");
            toast({ variant: 'destructive', title: 'AI response failed.' });
        } finally {
            setIsAnswering(false);
        }
    };
    
    if (charactersToDisplay.length === 0) return null;

    return (
        <section className="mt-8">
            <Carousel setApi={setApi} opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-4 basis-full">
                    {charactersToDisplay.map(({ character, story }, index) => {
                        const charactersToShow = charactersToDisplay.slice(index, index + 3).map(item => item.character);
                        if (charactersToShow.length < 3) {
                             charactersToShow.push(...charactersToDisplay.slice(0, 3 - charactersToShow.length).map(item => item.character));
                        }
                        
                        return (
                            <CarouselItem key={character.id} className="pl-4 basis-full">
                                <div className="relative rounded-lg overflow-hidden p-4 h-80 flex flex-col justify-between">
                                    <Image src={character.inGameImageUrl} alt="Story background" fill className="object-cover -z-20" data-ai-hint="fantasy landscape" />
                                    <div className="absolute inset-0 bg-black/60 -z-10" />
                                    
                                    <div className="relative z-10 text-white flex items-start gap-4">
                                        <div className="flex -space-x-8 h-24">
                                            {charactersToShow.map((char, i) => (
                                                <div key={char.id} className={cn(
                                                    "w-16 h-24 aspect-[2/3] object-cover rounded-md border-2 transition-all duration-300",
                                                    i === 0 ? 'border-primary' : 'border-white/50 opacity-50'
                                                )} style={{ zIndex: 5-i }}>
                                                    <Image src={char.profileImageUrl} alt={char.name} width={64} height={96} className="w-full h-full object-cover rounded-md" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1 pt-6">
                                            <p className="font-semibold uppercase tracking-wider text-xs text-white/80">
                                                ASK THE CAST
                                            </p>
                                            <h3 className="font-bold font-headline text-lg">{character.name}</h3>
                                            <p className="text-xs text-white/80">From "{story.name}"</p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 text-white">
                                        {!selectedQuestion ? (
                                            <div className="space-y-2 mb-4">
                                                {isLoadingSuggestions ? (
                                                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md bg-white/10" />)
                                                ) : (
                                                    suggestions.map(q => (
                                                        <button key={q} onClick={() => handleQuestionClick(q)} disabled={isAnswering} className={cn(
                                                            "w-full text-left text-xs py-1 rounded-full transition-colors text-white bg-white/20 hover:bg-white/30 px-3",
                                                            selectedQuestion === q && "bg-white/30"
                                                        )}>
                                                            {q}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        ) : (
                                            <div className="pt-2 mt-2 border-t border-primary/20 text-white">
                                                {isAnswering ? (
                                                    <div className="flex items-center gap-2 text-white/70">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <p className="text-xs italic">{character.name} is thinking...</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-2 text-xs">
                                                        <Quote className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                                        <p className="italic">{answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CarouselItem>
                        );
                    })}
                     <CarouselItem key="speak-with-cast" className="pl-4 basis-full">
                        <div className="relative rounded-lg overflow-hidden p-4 h-80 flex flex-col justify-between" onClick={() => router.push('/speak')}>
                            <Image src="https://placehold.co/600x400.png" alt="Interview room background" fill className="object-cover -z-20" data-ai-hint="library study" />
                            <div className="absolute inset-0 bg-black/60 -z-10" />
                            
                            <div className="relative z-10 text-white flex flex-col items-center justify-center h-full text-center">
                                <MessageSquare className="h-12 w-12 text-primary" />
                                <h3 className="font-bold font-headline text-xl mt-4">Speak with the Cast</h3>
                                <p className="text-sm text-white/80 mt-2 max-w-xs">
                                    Have a one-on-one conversation with any character from your stories.
                                </p>
                                <Button onClick={() => router.push('/speak')} className="mt-6">
                                    Go to Interview Room <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </section>
    );
};

const MultiplayerPreview = () => {
    const { stories, handleStoryClick, currentUser } = useStory();
    const router = useRouter();
    const coopStories = useMemo(() => stories.filter(s => s.isCoop), [stories]);
    
    if (coopStories.length === 0) return (
        <section className="mt-10">
            <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No co-op stories available right now.</p>
                    <p className="text-xs">Create a new co-op story to play with friends!</p>
                     <Button variant="link" asChild><Link href="/create-story?co-op=true">Create Co-op Story</Link></Button>
                </CardContent>
            </Card>
        </section>
    );

    const featuredStoryFromLogic = coopStories.find(s => s.name === "Eclipse of the Beast");
    const featuredCoopStory = featuredStoryFromLogic || coopStories.sort((a,b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0))[0];
    const otherStories = coopStories.filter(s => s.id !== featuredCoopStory.id);
    
    const getGameStatus = (story: Story) => {
        if (story.storyStatus === 'ended') return 'Completed';
        if (story.storyStatus === 'idle') return 'Waiting for Players';
        return 'In Progress';
    };

    return (
        <section className="mt-10">
            <Card 
                className="overflow-hidden relative text-white bg-foreground rounded-xl border-none"
                onClick={() => handleStoryClick(featuredCoopStory.id)}
            >
                <Image
                    src={featuredCoopStory.scenes?.[0]?.url || 'https://placehold.co/600x400.png'}
                    alt="Co-op background"
                    fill
                    className="object-cover opacity-30"
                    data-ai-hint="fantasy landscape"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative z-10 p-4 flex flex-col h-full">
                    {/* Top half for visuals */}
                    <div className="flex-1 flex items-center justify-center -space-x-8 py-4">
                        {(featuredCoopStory.characters || []).slice(0, 3).map((character, index) => {
                            const player = featuredCoopStory.players?.find(p => p.characterId === character.id);
                            const isCurrentUserCharacter = player?.userId === currentUser?.uid;
                            return (
                                <div key={character.id} className="relative" style={{ zIndex: 5 - index }}>
                                    <div className={cn(
                                        "w-28 h-40 aspect-[2/3] object-cover rounded-md border-4 transition-all duration-300 shadow-lg",
                                        isCurrentUserCharacter ? "border-primary" : "border-white/20"
                                    )}>
                                        <Image 
                                            src={character.profileImageUrl} 
                                            alt={character.name} 
                                            width={112} height={160} 
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>
                                    {player && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                                            <Avatar className={cn(
                                                "h-10 w-10 border-4",
                                                isCurrentUserCharacter ? "border-primary" : "border-background/50"
                                            )}>
                                                <AvatarImage src={player.photoURL || undefined} alt={player.displayName} />
                                                <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Bottom half for text */}
                    <div className="pt-6 text-center">
                        <h3 className="font-bold font-headline text-lg mt-1">{featuredCoopStory.name}</h3>
                        <p className="text-xs text-white/70 line-clamp-2 mt-2 mx-auto max-w-xs">
                           {featuredCoopStory.storyHistory.slice(-1)[0]?.outcomeDescription || "The adventure is about to begin!"}
                        </p>
                        <div className="mt-4 pb-4">
                            <Button variant="secondary" size="sm" className="h-7 bg-white/20 hover:bg-white/30 text-white rounded-full">{getGameStatus(featuredCoopStory)} - {featuredCoopStory.players?.length || 0}/3 Players</Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Other Lobbies */}
            {otherStories.length > 0 && (
                <div className="mt-4">
                    <ScrollArea>
                        <div className="flex space-x-4 pb-2">
                            {otherStories.map(story => {
                                const isUserInGame = story.players?.some(p => p.userId === currentUser?.uid);
                                const lobbyBg = story.scenes?.[0]?.url || story.imageUrl || 'https://placehold.co/200x300.png';
                                return (
                                <Card key={story.id} className="w-64 flex-shrink-0 relative overflow-hidden text-white bg-foreground" onClick={() => handleStoryClick(story.id)}>
                                    <Image
                                        src={lobbyBg}
                                        alt={story.name}
                                        fill
                                        className="object-cover opacity-30"
                                        data-ai-hint="fantasy location"
                                    />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                                    <CardContent className="p-3 flex items-center gap-3 relative z-10">
                                        <Image
                                            src={story.imageUrl || 'https://placehold.co/200x300.png'}
                                            alt={story.name}
                                            width={45}
                                            height={67}
                                            className="aspect-[9/16] object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold truncate text-sm">{story.name}</p>
                                            <p className="text-xs text-white/80">{getGameStatus(story)} - {story.players?.length || 0} / 3 Players</p>
                                            <Button variant="secondary" size="sm" className="w-full mt-2 h-7 bg-white/20 hover:bg-white/30 text-white rounded-full">{isUserInGame ? 'Continue' : 'Join'}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}
        </section>
    );
}

const MyShelvesPreview = () => {
    const { shelves, stories, handleStoryClick } = useStory();
    const router = useRouter();

    const shelvesWithStories = useMemo(() => {
        return (shelves || [])
            .map(shelf => ({
                ...shelf,
                stories: shelf.storyIds.map(id => stories.find(s => s.id === id)).filter(Boolean) as Story[]
            }))
            .filter(shelf => shelf.stories.length > 0)
            .slice(0, 2); // Show max 2 shelves
    }, [shelves, stories]);

    if (shelvesWithStories.length === 0) return null;

    return (
        <section className="mt-8 space-y-6">
            {shelvesWithStories.map(shelf => (
                <div key={shelf.id}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-headline">{shelf.name}</h2>
                        <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => router.push('/library')}>
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <div className="bookshelf">
                        <div className="grid grid-cols-3 gap-3 px-4">
                            {shelf.stories.slice(0, 3).map(story => (
                                 <div key={story.id} className="w-full cursor-pointer relative group" onClick={() => handleStoryClick(story.id)}>
                                    <Image 
                                        src={story.imageUrl || 'https://placehold.co/200x300.png'} 
                                        alt={story.name}
                                        width={120}
                                        height={180}
                                        data-ai-hint="book cover"
                                        className="w-full h-auto object-cover aspect-[9/16] shadow-md rounded-[5px]"
                                    />
                                    {story.isCoop && (
                                        <Badge className="absolute top-1 right-1 bg-primary/80 backdrop-blur-sm px-1.5">
                                            <Users className="w-3 h-3" />
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="shelf-shadows" />
                        <div className="shelf" />
                    </div>
                </div>
            ))}
        </section>
    );
}

const AudioBookPreview = () => {
    const { stories, activeStory, handleStoryClick } = useStory();
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const audioBookStory = useMemo(() => {
        const recentStories = [...stories]
            .filter(story => (story.storyHistory?.length ?? 0) > 0)
            .sort((a, b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0));
        return recentStories[0] ?? stories.find(s => s.audioTeaserUrl) ?? stories.find(s => s.isPublic) ?? null;
    }, [stories]);
    
    const mainCharacter = useMemo(() => {
        if (!audioBookStory) return null;
        return audioBookStory.characters.find(c => c.isPlayable);
    }, [audioBookStory]);

    const activeObjective = useMemo(() => {
        if (!audioBookStory) return null;
        if (activeStory?.id === audioBookStory.id) {
            return (activeStory.objectives || []).find(obj => obj.status === 'active');
        }
        return (audioBookStory.objectives || []).find(obj => obj.status === 'active');
    }, [audioBookStory, activeStory]);
    
    useEffect(() => {
        if (audioBookStory?.audioTeaserUrl) {
            audioRef.current = new Audio(audioBookStory.audioTeaserUrl);
            audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
                }
            };
        }
    }, [audioBookStory]);

    if (!audioBookStory) return null;
    
    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <section className="mt-8">
            <Card 
                className="bg-primary/5 border-none relative overflow-hidden text-white py-6 px-4"
                onClick={() => router.push('/audio')}
            >
                <Image
                    src={audioBookStory?.scenes?.[1]?.url || audioBookStory?.imageUrl || 'https://placehold.co/600x400.png'}
                    alt="Audiobook background"
                    fill
                    className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                <CardContent className="p-0 relative z-10 flex items-center justify-between">
                     <div className="w-[70%] space-y-1">
                        <Badge variant="destructive" className="bg-primary text-primary-foreground mb-2">Coming Soon</Badge>
                        <h3 className="font-bold text-lg font-headline mt-1">Interactive Audio Book</h3>
                        <p className="text-xs text-white/80">Narrated by AI</p>

                        <div className="text-xs text-white/90 space-y-1 pt-2">
                            {mainCharacter && (
                               <div className="flex items-center gap-2">
                                   <Avatar className="h-5 w-5 border-2 border-background">
                                       <AvatarImage src={mainCharacter.profileImageUrl} alt={mainCharacter.name} />
                                       <AvatarFallback>{mainCharacter.name.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <p>Playing as {mainCharacter?.name || '...'} | Chapter {Math.floor((audioBookStory.storyHistory?.length || 0) / 10) + 1}</p>
                               </div>
                            )}
                             {activeObjective && (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5 border-2 border-background bg-primary flex items-center justify-center">
                                        <Target className="h-3 w-3 text-primary-foreground" />
                                    </Avatar>
                                    <p>{activeObjective.description}</p>
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="w-[30%] flex items-center justify-center">
                        <Button
                            size="icon"
                            variant="secondary"
                            onClick={handlePlayPause}
                            className="rounded-full bg-white/90 text-black hover:bg-white w-16 h-16"
                        >
                        {isPlaying ? <Loader2 className="h-8 w-8 animate-spin" /> : <PlayCircle className="h-8 w-8" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};


export default function DashboardMobilePage() {
  const { stories, currentUser, handleStoryClick, dashboardConfig } = useStory();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const popularStories = useMemo(() => {
    const publicStories = stories.filter(s => s.isPublic || s.isCoop);
    const featuredBannerStoryIds = new Set(dashboardConfig?.featuredBannerStoryIds || []);
    if (featuredBannerStoryIds.size > 0) {
        return stories.filter(s => featuredBannerStoryIds.has(s.id));
    }
    return [...publicStories].sort((a, b) => (b.storyHistory?.length || 0) - (a.storyHistory?.length || 0)).slice(0, 5);
  }, [stories, dashboardConfig]);
  
  const userName = currentUser?.displayName?.split(' ')[0] || 'User';

  const filteredStories = useMemo(() => {
      let tempStories = stories.filter(s => s.isPublic || s.isCoop);
      
      if (selectedGenre !== "All") {
          tempStories = tempStories.filter(story => (story.genre || '').includes(selectedGenre));
      }
      
      if (searchQuery) {
          tempStories = tempStories.filter(story => story.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      return tempStories;
  }, [stories, selectedGenre, searchQuery]);

  const firstShelfStories = filteredStories.slice(0, 6);
  const secondShelfStories = filteredStories.slice(6, 12);

  const trendingStories = useMemo(() => {
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      return stories.filter(s => s.isPublic && (s.createdAt || 0) > threeHoursAgo);
  }, [stories]);

  const FollowedAuthorsSectionMobile = () => {
    const { stories, followedAuthors, handleStoryClick } = useStory();

    const followedStories = useMemo(() => {
        if (!followedAuthors || followedAuthors.length === 0) return null;
        return stories
            .filter(story => followedAuthors.includes(story.authorId || '') && story.isPublic)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);
    }, [stories, followedAuthors]);

    if (!followedStories || followedStories.length === 0) return null;

    return (
        <section className="mt-8">
            <h2 className="text-xl font-bold font-headline mb-4">New from Authors You Follow</h2>
             <div className="bookshelf">
                <ScrollArea className="px-4">
                    <div className="flex space-x-4 pb-4">
                        {followedStories.map((story) => (
                            <BookCover key={`${story.id}-followed`} story={story} />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <div className="shelf-shadows" />
                <div className="shelf" />
            </div>
        </section>
    );
  };
  
  return (
    <div className="bg-background text-foreground">
      <CommunityChoiceModal />
      
      <BookOfTheDay />
      
      {/* Main content with padding */}
      <div className="space-y-4">
        {/* Genre Filter */}
        <div className="mt-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                  placeholder="Search books..."
                  className="pl-10 h-12 rounded-full bg-muted border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-2 pb-2">
                  <button
                      onClick={() => setSelectedGenre("All")}
                      className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 h-8 text-sm font-medium transition-colors",
                          selectedGenre === "All"
                            ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                            : "bg-[#f5f5f4] text-muted-foreground border"
                      )}
                  >
                      All
                  </button>
                  {genreOptions.map((genre) => (
                      <button
                          key={genre.name}
                          onClick={() => setSelectedGenre(genre.name)}
                          className={cn(
                              "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 h-8 text-sm font-medium transition-colors",
                              selectedGenre === genre.name
                                ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                                : "bg-[#f5f5f4] text-muted-foreground border"
                          )}
                      >
                          {genre.name}
                      </button>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden"/>
          </ScrollArea>
        </div>

        {/* Books Section */}
        <section>
            {filteredStories.length > 0 ? (
              <div className="space-y-4">
                {firstShelfStories.length > 0 && (
                  <div className="bookshelf">
                      <ScrollArea className="px-4">
                        <div className="flex space-x-4 pb-4">
                          {firstShelfStories.map((story, index) => (
                              <BookCover key={`${story.id}-${index}`} story={story as Story} />
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      <div className="shelf-shadows" />
                      <div className="shelf" />
                  </div>
                )}

                {secondShelfStories.length > 0 && (
                  <div className="bookshelf mt-4">
                      <ScrollArea className="px-4">
                        <div className="flex space-x-4 pb-4">
                          {secondShelfStories.map((story, index) => (
                              <BookCover key={`${story.id}-${index}`} story={story as Story} />
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      <div className="shelf-shadows" />
                      <div className="shelf" />
                  </div>
                )}
              </div>
          ) : (
              <div className="text-center py-8">
                  <p className="text-muted-foreground">No stories found for this combination.</p>
                  <Link href="/create-ai-story">
                      <Button variant="link">Create one with AI?</Button>
                  </Link>
              </div>
          )}
        </section>

        <ContinueReadingCarousel />
        
        {/* Trending Stories */}
        {trendingStories.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold font-headline">Trending Stories</h2>
            </div>
            <div className="bookshelf">
                <ScrollArea className="px-4">
                  <div className="flex space-x-4 pb-4">
                    {trendingStories.map((story) => (
                        <BookCover key={`${story.id}-trending`} story={story as Story} />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <div className="shelf-shadows" />
                <div className="shelf" />
            </div>
          </section>
        )}
        
        <MyShelvesPreview />
        
        <MultiplayerPreview />

        <AudioBookPreview />
        
        <HotSeatInterview />
        
        <FollowedAuthorsSectionMobile />

        <section className="mt-10">
            <Card className="rounded-2xl border-none p-6 bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full">
                        <BookPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg font-headline">Create Your Own Story</h3>
                        <p className="text-sm text-muted-foreground mt-1">Have an idea for an adventure? Bring it to life with our powerful creation tools.</p>
                         <Button asChild size="sm" className="mt-4">
                            <Link href="/create">Start Creating <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </section>
      </div>
    </div>
  );
}



    


























    

    






