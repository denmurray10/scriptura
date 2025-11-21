"use client";

import { useState, useMemo, useRef } from "react";
import { useStory } from "@/contexts/StoryContext";
import { Card, CardContent } from "@/components/ui/card";
import { Library, BookOpen, Trash2, PlusCircle, Search, Bot, MoreVertical, Edit, X, Loader2, Bookmark, Gamepad2, Sparkles, Mic, CheckCircle, Users } from "lucide-react";
import Image from "next/image";
import { AnimateInView } from "@/components/AnimateInView";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { generateFullStoryAction } from "@/lib/actions";
import type { Story, Shelf } from "@/types";
import { cn, sanitizeUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { genreOptions } from "@/lib/config";


export default function LibraryPage() {
  const { stories, toggleBookmark, setActiveStoryId, shelves, createShelf, deleteShelf, moveStoryToShelf, reorderShelf, createStory: contextCreateStory, currentUser } = useStory();
  const router = useRouter();
  const { toast } = useToast();
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  const libraryStories = useMemo(() => stories.filter(story => (story.storyHistory?.length ?? 0) > 0), [stories]);
  const bookmarkedStories = useMemo(() => libraryStories.filter(story => story.isBookmarked), [libraryStories]);
  const coopStories = useMemo(() => stories.filter(story => story.isCoop), [stories]);

  const filteredStories = useMemo(() => {
    let storiesToShow: Story[] = [];
    if (activeTab === 'all') {
        storiesToShow = libraryStories.filter(s => !s.shelfId);
    } else if (activeTab === 'bookmarks') {
        storiesToShow = bookmarkedStories;
    } else if (activeTab === 'co-op') {
        storiesToShow = coopStories;
    } else {
        const shelf = shelves.find(s => s.id === activeTab);
        if (shelf) {
            storiesToShow = shelf.storyIds.map(id => libraryStories.find(s => s.id === id)).filter(Boolean) as Story[];
        }
    }
    
    if (searchQuery) {
      storiesToShow = storiesToShow.filter(story =>
        story.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return storiesToShow;
  }, [libraryStories, bookmarkedStories, coopStories, activeTab, shelves, searchQuery]);

  const handleContinueReading = (story: Story) => {
    setActiveStoryId(story.id);
    const path = story.storyMode === 'narrator' ? '/story-narrator' : '/story';
    router.push(path);
  };
  
  const handleCreateShelf = () => {
    if (newShelfName.trim()) {
        createShelf(newShelfName.trim());
        setNewShelfName("");
        setIsShelfModalOpen(false);
        toast({ title: "Shelf created!" });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (['bookmarks', 'co-op'].includes(destination.droppableId)) {
        toast({
            variant: "destructive",
            title: "Cannot Move",
            description: "This is an automatic shelf and cannot be manually organized.",
        });
        return;
    }
    
    if (source.droppableId === destination.droppableId) {
        reorderShelf(source.droppableId, source.index, destination.index);
    } else {
        moveStoryToShelf(draggableId, destination.droppableId, source.droppableId || 'all');
    }
  };
  
  const handlePlayTeaser = (e: React.MouseEvent, audioUrl: string) => {
    e.stopPropagation();
    if (audioRef.current) {
        if (playingAudioUrl === audioUrl) {
            audioRef.current.pause();
            setPlayingAudioUrl(null);
        } else {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setPlayingAudioUrl(audioUrl);
        }
    }
  };
  
  const StoryCard = ({ story, index, isDraggable = true }: { story: Story, index: number, isDraggable?: boolean }) => {
    const mainCharacter = story.characters.find(c => c.isPlayable);
    
    return (
        <Draggable draggableId={story.id} index={index} isDragDisabled={!isDraggable}>
            {(provided) => (
                <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Card className="group bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 relative">
                      <div className="flex items-start p-4 gap-4">
                          <div className="w-24 aspect-[9/16] flex-shrink-0 cursor-pointer relative" onClick={() => router.push(`/book/${story.id}`)}>
                            <Image
                                  src={sanitizeUrl(story.imageUrl || "https://placehold.co/400x600.png")}
                                  alt={`Cover of ${story.name}`}
                                  fill
                                  className="object-cover rounded-md"
                                  data-ai-hint="book cover"
                              />
                              {story.audioTeaserUrl && (
                                <Button 
                                    size="icon" 
                                    className="absolute bottom-1 right-1 h-7 w-7 rounded-full" 
                                    onClick={(e) => handlePlayTeaser(e, story.audioTeaserUrl!)}
                                >
                                    <Mic className="h-4 w-4"/>
                                </Button>
                              )}
                          </div>
                          <div className="flex-1 space-y-2.5">
                            
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{story.genre}</Badge>
                                {story.isCoop && <Badge variant="secondary"><Users className="h-3 w-3 mr-1"/>Co-op</Badge>}
                            </div>

                            <p className="text-sm text-muted-foreground">Chapter {Math.floor((story.storyHistory?.length ?? 0) / 10) + 1}</p>
                            <Progress value={(story.storyHistory?.length || 0) / 120 * 100} className="h-2" />
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                {story.storyStatus === 'ended' ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle className="mr-1.5 h-3 w-3"/> Completed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="capitalize">
                                        {story.storyMode ? (
                                            <>
                                                {story.storyMode === 'immersive' ? <Gamepad2 className="mr-1.5 h-3 w-3"/> : <Sparkles className="mr-1.5 h-3 w-3" />}
                                                {story.storyMode}
                                            </>
                                        ) : (
                                            "Not Started"
                                        )}
                                    </Badge>
                                )}
                              <span>
                                {story.lastPlayedTimestamp ? `Played ${formatDistanceToNow(new Date(story.lastPlayedTimestamp), { addSuffix: true })}` : 'Not started'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {story.storyStatus !== 'ended' && (
                                    <Button variant="default" size="sm" className="mt-2 rounded-full bg-black text-white hover:bg-black/80 flex-1" onClick={() => handleContinueReading(story)}>Continue</Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full mt-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/book/${story.id}`)}>
                                            <BookOpen className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {shelves.map(shelf => (
                                            <DropdownMenuItem key={shelf.id} onClick={() => moveStoryToShelf(story.id, shelf.id, story.shelfId || 'all')}>
                                                Move to "{shelf.name}"
                                            </DropdownMenuItem>
                                        ))}
                                        {story.shelfId && (
                                            <DropdownMenuItem onClick={() => moveStoryToShelf(story.id, 'all', story.shelfId)}>
                                                Move to "Active Books"
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                          </div>
                        </div>
                    </Card>
                </li>
            )}
        </Draggable>
    );
  };


  return (
    <AnimateInView tag="div" className="space-y-8 pt-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Library</h1>
        <p className="text-muted-foreground">
          Organize, search, and continue your started stories.
        </p>
      </div>
      
      <audio ref={audioRef} onEnded={() => setPlayingAudioUrl(null)} />

      <div className="space-y-6">
        <Card>
            <CardContent className="p-4 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search in this shelf..." 
                        className="pl-10 w-full bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Dialog open={isShelfModalOpen} onOpenChange={setIsShelfModalOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="bg-white">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>New Shelf</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new shelf</DialogTitle>
                            <DialogDescription>Enter a name for your new shelf.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="shelf-name">Shelf Name</Label>
                            <Input id="shelf-name" value={newShelfName} onChange={(e) => setNewShelfName(e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsShelfModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateShelf}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="w-full">
                <div className="flex items-center">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-2 pb-2">
                             {[
                                { id: 'all', name: 'Active Books' },
                                { id: 'bookmarks', name: 'Bookmarks' },
                                { id: 'co-op', name: 'Co-op' },
                                ...shelves,
                             ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 h-8 text-sm font-medium transition-colors relative group",
                                        activeTab === tab.id
                                            ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                                            : "bg-[#f5f5f4] text-muted-foreground border hover:bg-muted"
                                    )}
                                >
                                    {tab.name}
                                    {shelves.some(s => s.id === tab.id) && (
                                        <div
                                            role="button"
                                            aria-label={`Delete shelf ${tab.name}`}
                                            onClick={(e) => {e.stopPropagation(); deleteShelf(tab.id)}} 
                                            className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full hidden group-hover:flex items-center justify-center"
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
                
                <Droppable droppableId={activeTab} isDropDisabled={['bookmarks', 'co-op'].includes(activeTab)}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <div className="mt-6">
                                <ul
                                    className="grid grid-cols-1 gap-4"
                                >
                                    {filteredStories.length > 0 ? (
                                        filteredStories.map((story, index) => <StoryCard key={story.id} story={story} index={index} isDraggable={!['bookmarks', 'co-op'].includes(activeTab)} />)
                                    ) : (
                                       <div className="col-span-full">
                                         <Card className="text-center py-20">
                                            <CardContent className="flex flex-col items-center">
                                              <Library className="h-16 w-16 text-muted-foreground mb-4" />
                                              <h3 className="text-xl font-semibold">This Shelf is Empty</h3>
                                              <p className="text-muted-foreground mt-2 max-w-sm">
                                                  {searchQuery ? "No stories match your search." : (activeTab === 'co-op' ? "You haven't joined or created any co-op stories." : "Drag a story here or use the 'Move to' option to organize your library.")}
                                              </p>
                                            </CardContent>
                                          </Card>
                                       </div>
                                    )}
                                    {provided.placeholder}
                                </ul>
                            </div>
                        </div>
                    )}
                </Droppable>
            </div>
        </DragDropContext>
      </div>
    </AnimateInView>
  );
}
