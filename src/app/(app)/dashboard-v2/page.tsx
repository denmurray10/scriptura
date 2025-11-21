

"use client";

import Image from "next/image";
import {
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  Home,
  BookOpen,
  Clock,
  Bookmark,
  Settings,
  Menu,
  Check,
  MoreHorizontal,
  Play,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import type { Story } from "@/types";
import { useMemo, useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const readerFriends = [
    {
        id: 1,
        name: "Roberto Jordan",
        avatar: "https://firebasestorage.googleapis.com/v0/b/choicescraft-2af32.firebasestorage.app/o/dev-uploads%2Fd243e2e5-bb0d-48a5-a5f1-b25623e524fb.webp?alt=media&token=2329aca5-1eac-4038-97b4-577cced8f2fd",
        hint: "man avatar",
        comment: "What a delightful and magical chapter it is! It indeed transports readers to the wizarding world..",
        progress: "Chapter Five: Diagon Alley",
        time: "2 min ago"
    },
    {
        id: 2,
        name: "Anna Henry",
        avatar: "https://placehold.co/100x100.png",
        hint: "woman avatar",
        comment: "I finished reading the chapter last night and I'm still thinking about it!",
        progress: "Chapter Six: The Journey from Platform 9¾",
        time: "1 hour ago"
    }
]

const LeftSidebar = ({ variant = 'full', showLogo = true }: { variant?: 'full' | 'logo-only', showLogo?: boolean }) => {
    const navItems = [
        { icon: Home, label: "Home", active: true },
        { icon: BookOpen, label: "Library" },
        { icon: Clock, label: "History" },
        { icon: Bookmark, label: "Bookmarks" },
        { icon: Settings, label: "Settings" },
    ];
    return (
        <aside className="w-[60px] flex-shrink-0 flex flex-col items-center bg-background relative">
            {showLogo && (
                <div className="absolute top-[30px]">
                    <Logo />
                </div>
            )}
            
            {variant === 'full' && (
              <>
                <nav className={cn(
                    "flex-1 flex flex-col items-center gap-6",
                    showLogo ? "justify-center" : "justify-start pt-8"
                )}>
                    {navItems.map(item => (
                        <Button key={item.label} variant="ghost" size="icon" className={cn(
                            "w-14 h-14 rounded-2xl text-muted-foreground hover:bg-primary/10 hover:text-primary",
                            item.active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        )}>
                            <item.icon className="w-6 h-6" />
                        </Button>
                    ))}
                </nav>
                
                <div className="absolute bottom-[30px]">
                    <Button variant="ghost" size="icon" className="w-14 h-14 rounded-2xl text-muted-foreground">
                        <Menu className="w-6 h-6"/>
                    </Button>
                </div>
              </>
            )}

            <div className="absolute inset-y-0 right-0 w-px bg-gray-300 h-full" />
        </aside>
    )
}

const RightColumn = ({ story }: { story: Story | null }) => {
    return (
         <aside className="w-full lg:w-[48vw] flex-shrink-0 bg-white h-full overflow-y-auto hidden lg:flex flex-col relative">
            <div className="space-y-8 p-8 flex-1 flex flex-col">
                {/* Schedule */}
                <div className="space-y-4 pt-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold font-headline">Schedule Reading</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"><ChevronLeft/></Button>
                            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"><ChevronRight/></Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <div key={day} className={cn("font-medium", i === 0 && "text-primary")}>{day}</div>
                        ))}
                         {Array.from({length: 7}).map((_, i) => {
                            const day = 11 + i;
                            return (
                                <Button key={day} variant="ghost" size="icon" className={cn(
                                    "rounded-full font-semibold", 
                                    day === 13 && "bg-gray-200 text-foreground"
                                )}>
                                    {day}
                                </Button>
                            )
                         })}
                    </div>
                </div>

                {/* Reader Friends */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold font-headline">Reader Friends</h3>
                        <Button variant="ghost" size="icon"><MoreHorizontal/></Button>
                    </div>
                    <div className="relative space-y-6">
                        <div className="absolute left-5 top-5 h-full border-l-2 border-dashed border-gray-300"></div>
                        {readerFriends.map(friend => (
                             <div key={friend.id} className="relative flex items-start gap-4">
                                <Avatar className="w-10 h-10 border-2 border-background ring-2 ring-gray-300 z-10">
                                    <AvatarImage src={friend.avatar} data-ai-hint={friend.hint}/>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-bold">{friend.name}</p>
                                    <p className="text-muted-foreground text-sm my-1">{friend.comment}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                                            <Check className="w-4 h-4"/>
                                            <span>{friend.progress}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{friend.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
         </aside>
    );
};

const FollowedAuthorsSection = () => {
    const { stories, followedAuthors, handleStoryClick } = useStory();

    const followedStories = useMemo(() => {
        if (!followedAuthors || followedAuthors.length === 0) return [];
        return stories
            .filter(story => followedAuthors.includes(story.authorId || '') && story.isPublic)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [stories, followedAuthors]);

    if (followedStories.length === 0) return (
        <section className="mt-10">
            <h2 className="text-2xl font-bold font-headline mb-4">New from Followed Authors</h2>
            <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>You're not following any authors yet.</p>
                    <p className="text-xs">Find authors you like and follow them to see their new stories here!</p>
                </CardContent>
            </Card>
        </section>
    );

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline">New from Followed Authors</h2>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    See all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
            <ScrollArea>
                <div className="flex space-x-6 pb-4">
                    {followedStories.map((story) => (
                        <div key={story.id} className="w-32 shrink-0 group relative cursor-pointer" onClick={() => handleStoryClick(story.id)}>
                            <Card className="overflow-hidden shadow-lg shadow-black/10 transition-transform hover:-translate-y-2 rounded-[5px]">
                                <Image
                                    src={story.imageUrl || 'https://placehold.co/400x600.png'}
                                    alt={story.name}
                                    width={400}
                                    height={600}
                                    className="aspect-[9/16]"
                                    data-ai-hint="book cover"
                                />
                            </Card>
                            {story.isCoop && (
                                <Badge className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm px-1.5">
                                    <Users className="w-3 h-3" />
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </section>
    );
};

export const BookCover = ({ story, children, onClick }: { story: Story, children?: React.ReactNode, onClick?: (e: React.MouseEvent) => void }) => {
  return (
    <div onClick={onClick} className={"w-[120px] flex-shrink-0 cursor-pointer group relative"}>
        <div className="w-full h-auto aspect-[9/16] shadow-md rounded-[5px] overflow-hidden bg-muted">
            {story.videoUrl ? (
                <video src={story.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <Image 
                    src={story.imageUrl || 'https://placehold.co/200x300.png'} 
                    alt={story.name} 
                    width={120}
                    height={180}
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

const MultiplayerPreviewImmersive = () => {
    const { stories, handleStoryClick } = useStory();
    const router = useRouter();
    const coopStories = useMemo(() => stories.filter(s => s.isCoop), [stories]);
    
    const [api, setApi] = useState<CarouselApi>()
    const [activeIndex, setActiveIndex] = useState(0)
    const autoplayPlugin = useRef(Autoplay({ delay: 6000, stopOnInteraction: false }));


    useEffect(() => {
        if (!api) return;
        
        const onSelect = (carouselApi: CarouselApi) => {
            setActiveIndex(carouselApi.selectedScrollSnap())
        }
        api.on("select", onSelect);
        onSelect(api); // Set initial active index
        
        return () => {
            api.off("select", onSelect);
        }
    }, [api])

    if (coopStories.length === 0) return (
        <section className="mt-10">
            <h2 className="text-2xl font-bold font-headline mb-4">Online Co-op Adventures</h2>
            <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No co-op stories available right now.</p>
                    <p className="text-xs">Create a new co-op story to play with friends!</p>
                     <Button variant="link" asChild><Link href="/create-story?co-op=true">Create Co-op Story</Link></Button>
                </CardContent>
            </Card>
        </section>
    );

    const activeStory = coopStories[activeIndex];
    
    return (
        <section className="mt-10">
            <h2 className="text-2xl font-bold font-headline mb-4">Online Co-op Adventures</h2>
            <div className="cursor-pointer relative h-96 rounded-lg overflow-hidden flex flex-col justify-end p-4" onClick={() => activeStory && handleStoryClick(activeStory.id)}>
                <div className="absolute inset-0 z-0 transition-opacity duration-500 ease-in-out">
                    {coopStories.map((story, index) => (
                        <Image
                            key={story.id}
                            src={story.scenes?.[0]?.url || 'https://placehold.co/600x400.png'}
                            alt="Co-op background"
                            fill
                            className={cn(
                            "object-cover transition-opacity duration-700 ease-in-out",
                            index === activeIndex ? "opacity-100" : "opacity-0"
                            )}
                            priority={index === activeIndex}
                            data-ai-hint="fantasy landscape"
                        />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
                <div className="relative z-20 w-full text-white flex flex-col h-full justify-end">
                    <Carousel 
                        setApi={setApi}
                        opts={{ align: "center", loop: true }}
                        plugins={[autoplayPlugin.current]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4 pb-11">
                            {coopStories.map(story => (
                                <CarouselItem key={story.id} className="basis-1/3 pl-4">
                                    <BookCover story={story} onClick={(e) => { e.stopPropagation(); handleStoryClick(story.id); }}>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-2 z-10">
                                            {story.players?.slice(0, 2).map(player => (
                                                <Avatar key={player.userId} className="h-6 w-6 border-2 border-background">
                                                    <AvatarImage src={player.photoURL} alt={player.displayName} />
                                                    <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {Array.from({ length: 2 - (story.players?.length || 0) }).map((_, index) => (
                                                <Avatar key={`blank-${index}`} className="h-6 w-6 border-2 border-background bg-muted/50">
                                                    <AvatarFallback>?</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                    </BookCover>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    {activeStory && (
                        <div className="text-center">
                            <h3 className="text-lg font-bold font-headline">{activeStory.name}</h3>
                             <Button variant="ghost" className="text-white/80 hover:text-white mt-1 h-auto p-1 text-xs mb-5" onClick={(e) => {
                                e.stopPropagation();
                                router.push('/co-op')
                            }}>
                               View More
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default function DashboardV2Page() {
    const { stories, setActiveStoryId, handleStoryClick, dashboardConfig } = useStory();
    const router = useRouter();

    const latestStory = useMemo(() => {
        if (!dashboardConfig?.bookOfTheDayStoryId) {
            return [...stories].sort((a, b) => (b.storyHistory?.length || 0) - (a.storyHistory?.length || 0))[0];
        }
        return stories.find(s => s.id === dashboardConfig.bookOfTheDayStoryId) || null;
    }, [stories, dashboardConfig]);

    const handleStartReading = () => {
        if (latestStory) {
            setActiveStoryId(latestStory.id);
            const path = latestStory.storyMode === 'narrator' ? '/story-narrator' : '/story';
            router.push(path);
        } else {
            router.push('/create');
        }
    };
    
    const story = latestStory;
    const interactions = story?.storyHistory?.length ?? 0;
    const totalInteractions = 120;
    const progress = story ? (interactions / totalInteractions) * 100 : 51;
    const interactionsRead = story ? interactions : 154;
    const totalPages = story ? totalInteractions : 300;

    const popularStories = useMemo(() => {
        return [...stories]
          .filter(s => s.isPublic)
          .sort((a, b) => (b.storyHistory?.length || 0) - (a.storyHistory?.length || 0))
          .slice(0, 5);
      }, [stories]);
    

  return (
    <div className="bg-background text-foreground font-sans flex flex-col min-h-screen">
        <section className="flex-shrink-0">
          <div className="flex flex-col md:flex-row">
            <Card className="w-full md:w-[32%] rounded-none border-0 bg-background flex">
              <LeftSidebar variant="logo-only" />
              <CardContent className="p-8 space-y-8 flex-1">
                <div className="relative w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search book name, author, edition..." className="pl-12 h-12 rounded-full bg-background border-0" />
                </div>
                <section>
                    {latestStory ? (
                        <>
                            <h1 className="text-3rem font-bold leading-tight font-headline">Happy reading,<br />{latestStory.name}</h1>
                            <p className="text-muted-foreground mt-4 max-w-md truncate">{latestStory.plot}</p>
                            <Button onClick={handleStartReading} className="mt-6 bg-foreground text-primary-foreground rounded-full h-12 px-6 hover:bg-foreground/90">
                                Continue reading <Play className="ml-2"/>
                            </Button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3rem font-bold leading-tight font-headline">Your story awaits</h1>
                            <p className="text-muted-foreground mt-4 max-w-md">Let's create your first interactive adventure and bring your world to life.</p>
                            <Button onClick={handleStartReading} className="mt-6 bg-foreground text-primary-foreground rounded-full h-12 px-6 hover:bg-foreground/90">
                                Create a story <Plus className="ml-2"/>
                            </Button>
                        </>
                    )}
                </section>
              </CardContent>
            </Card>
            <Card className="w-full md:w-[35%] rounded-none border-0 bg-gradient-to-r from-background from-50% to-white to-50% flex items-center justify-center p-4 md:p-8">
               <div className="relative w-full max-w-md mx-auto aspect-[4/3]">
                 <img
                    src="https://firebasestorage.googleapis.com/v0/b/choicescraft-2af32.firebasestorage.app/o/dev-uploads%2Fe0761395-480e-423c-98d7-424089a29ea2.webp?alt=media&token=a9965d8d-5b95-4eb8-a275-b71b675e360d"
                    alt="Open book with story content"
                    className="object-contain w-full h-full drop-shadow-xl"
                    data-ai-hint="open book"
                 />

                {/* Left Page Overlay (now with text) */}
                <div
                    className="absolute top-[12%] left-[7.5%] w-[40%] h-[75%] p-2 sm:p-3 flex flex-col justify-start overflow-hidden text-left"
                >
                    <p className="text-black font-bold leading-tight line-clamp-2 font-headline" style={{ fontSize: '0.3rem' }}>
                        {latestStory?.name || "Your Next Story"}
                    </p>
                    <p className="text-gray-600 leading-snug line-clamp-8 mt-1 sm:mt-2" style={{ fontSize: '0.3rem' }}>
                        {latestStory?.plot || "Every great story starts with a single choice. Begin your journey now and shape a world of your own making."}
                    </p>
                </div>
                {/* Right Page Overlay (now with image) */}
                <div
                    className="absolute top-[12%] right-[8.5%] w-[39%] h-[75%] p-1 sm:p-2 flex items-center justify-center overflow-hidden"
                >
                    {latestStory?.scenes?.[0]?.url ? (
                    <Image
                        src={latestStory.scenes[0].url}
                        alt={`Background for ${latestStory.name}`}
                        fill
                        className="object-cover rounded-sm"
                    />
                    ) : (
                    <div className="w-full h-full bg-muted rounded-sm flex items-center justify-center">
                        <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground"/>
                    </div>
                    )}
                </div>
                </div>
            </Card>
            <Card className="w-full md:w-[33%] rounded-none border-0 bg-white text-foreground">
              <CardContent className="p-8">
                {/* User Info */}
                <div className="flex items-center justify-end gap-6">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="user avatar"/>
                        <AvatarFallback>AM</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">Alexander Mark</p>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Bell className="w-6 h-6" />
                    </Button>
                </div>

                {/* Story Summary */}
                <div className="space-y-2 mt-8">
                    <h3 className="text-base font-bold font-headline">{story?.name || "The Chamber of Secrets"}</h3>
                    <div className="flex items-center gap-2 text-primary text-xs">
                        <span>{interactionsRead} / {totalPages} interactions</span>
                    </div>
                    <div className="w-full h-1 bg-primary/20 rounded-full">
                        <div className="h-1 bg-primary rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-snug line-clamp-4 mt-2">
                        {story?.plot || "Harry as he returns to Hogwarts school of witchcraft and wizardry for his 2nd year, only to discover that.."}
                    </p>
                    {story ? (
                        <p className="text-right text-xs font-medium italic">- A {story.genre} Story</p>
                    ): (
                        <p className="text-right text-xs font-medium italic">- JK Rowlings</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <div className="flex flex-1">
            <LeftSidebar showLogo={false} />
            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-headline">Popular Now</h2>
                         <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                          See all <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      {popularStories.length > 0 ? (
                        <ScrollArea>
                            <div className="flex space-x-6 pb-4">
                            {popularStories.map((book) => (
                                <div key={book.id} className="w-40 shrink-0 group relative cursor-pointer" onClick={() => handleStoryClick(book.id)}>
                                    <Card className="overflow-hidden shadow-lg shadow-black/10 transition-transform hover:-translate-y-2 rounded-[5px]">
                                        <div className="w-full aspect-[9/16] bg-muted">
                                            {book.videoUrl ? (
                                                <video src={book.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                            ) : (
                                                <Image
                                                    src={book.imageUrl || 'https://placehold.co/400x600.png'}
                                                    alt={book.name}
                                                    width={400}
                                                    height={600}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint="book cover"
                                                />
                                            )}
                                        </div>
                                    </Card>
                                    {book.isCoop && (
                                        <Badge className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm px-1.5">
                                            <Users className="w-3 h-3" />
                                        </Badge>
                                    )}
                                    <p className="font-semibold mt-3 truncate">{book.name}</p>
                                </div>
                            ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>No popular stories at the moment.</p>
                                <p className="text-xs">Create a story and share it to make it popular!</p>
                            </CardContent>
                        </Card>
                      )}
                    </section>
                    
                    <FollowedAuthorsSection />

                    <MultiplayerPreviewImmersive />

                </main>
                
                <RightColumn story={latestStory} />
            </div>
        </div>
    </div>
  );
}
