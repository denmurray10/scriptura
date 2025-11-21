

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useStory } from "@/contexts/StoryContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookCopy, BarChart, List, MoreHorizontal, FilePenLine, Trash2, Library, Users2, GalleryHorizontal, Clock, Check, PieChart, Image as ImageIcon, RefreshCw, Loader2, Edit, Search, ChevronsUpDown, CheckCircle, Save, X, Star, Map as MapIcon, ClipboardCopy, Video, UploadCloud, BookMarked, Download, MessageCircle, KeyRound, MessageSquare, Puzzle, Dice5 } from "lucide-react";
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import type { Story, Character, Scene } from "@/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadDataUrlToFirebase } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { stories, deleteStory, updateStory, regenerateStoryCover, regenerateCharacterImages, regenerateSceneVisual, regenerateStoryMap, dashboardConfig, updateDashboardConfig, exportStory } = useStory();
  const { toast } = useToast();
  const router = useRouter();

  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [storyToView, setStoryToView] = useState<Story | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  
  const [authorSearchOpen, setAuthorSearchOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<{ value: string; label: string } | null>(null);
  const [plotText, setPlotText] = useState("");
  const [imageCoverUrl, setImageCoverUrl] = useState("");
  const [videoCoverUrl, setVideoCoverUrl] = useState("");
  
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [selectedBookOfTheDay, setSelectedBookOfTheDay] = useState<string | null>(dashboardConfig.bookOfTheDayStoryId || null);

  const totalStories = stories.length;
  const totalCharacters = stories.reduce((acc, story) => acc + (story.characters?.length || 0), 0);
  const totalChoices = stories.reduce((acc, story) => acc + (story.storyHistory?.length || 0), 0);
  const avgChoicesPerStory = totalStories > 0 ? (totalChoices / totalStories).toFixed(1) : 0;
  
  const allAuthors = useMemo(() => {
    const authorsMap = new Map<string, { value: string; label: string }>();
    stories.forEach(story => {
      if (story.authorId && story.authorName) {
        authorsMap.set(story.authorId, { value: story.authorId, label: story.authorName });
      }
    });
    return Array.from(authorsMap.values());
  }, [stories]);
  
  const publicStories = useMemo(() => stories.filter(s => s.isPublic), [stories]);

  useEffect(() => {
    if (storyToView) {
      if (storyToView.authorId && storyToView.authorName) {
        setSelectedAuthor({ value: storyToView.authorId, label: storyToView.authorName });
      } else {
        setSelectedAuthor(null);
      }
      setPlotText(storyToView.plot);
      setImageCoverUrl(storyToView.imageUrl || "");
      setVideoCoverUrl(storyToView.videoUrl || "");
    }
  }, [storyToView]);
  
  useEffect(() => {
    setSelectedBookOfTheDay(dashboardConfig?.bookOfTheDayStoryId || null);
  }, [dashboardConfig]);


  const handleDeleteClick = (story: Story) => {
    setStoryToDelete(story);
  };

  const handleDeleteConfirm = () => {
    if (storyToDelete) {
      deleteStory(storyToDelete.id);
      toast({
        title: "Story Deleted",
        description: `"${storyToDelete.name}" has been removed.`,
      });
      setStoryToDelete(null);
    }
  };
  
  const handleAuthorSelect = (authorId: string) => {
    if (!storyToView) return;
    const author = allAuthors.find(a => a.value === authorId);
    if (!author) return;

    updateStory(storyToView.id, { authorId: author.value, authorName: author.label });
    
    setStoryToView(prev => prev ? { ...prev, authorId: author.value, authorName: author.label } : null);
    setSelectedAuthor(author);

    toast({ title: "Author Updated", description: `"${storyToView.name}" is now authored by ${author.label}.` });
    setAuthorSearchOpen(false);
  }

  const handleSaveChanges = () => {
    if (!storyToView) return;
    
    const updates: Partial<Story> = {};
    let hasChanges = false;
    
    if (plotText.trim() !== storyToView.plot) {
        updates.plot = plotText.trim();
        hasChanges = true;
    }
    
    if (imageCoverUrl.trim() !== (storyToView.imageUrl || "")) {
        updates.imageUrl = imageCoverUrl.trim();
        if (updates.imageUrl) updates.coverType = 'image';
        hasChanges = true;
    }
    
    if (videoCoverUrl.trim() !== (storyToView.videoUrl || "")) {
        updates.videoUrl = videoCoverUrl.trim();
        if (updates.videoUrl) updates.coverType = 'video';
        hasChanges = true;
    }

    if (!hasChanges) return;

    updateStory(storyToView.id, updates);
    
    setStoryToView(prev => prev ? { ...prev, ...updates } : null);
    
    toast({ title: "Story Updated", description: "Your changes have been saved." });
  };
  
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a video file." });
        return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({ variant: "destructive", title: "File too large", description: "Please upload a file smaller than 20MB." });
        return;
    }

    setIsUploadingVideo(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const url = await uploadDataUrlToFirebase(dataUrl, 'covers');
            setVideoCoverUrl(url);
            toast({ variant: 'success', title: 'Video Uploaded!', description: 'The new video URL has been set.' });
        };
    } catch (error) {
        const err = error as Error;
        toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
        setIsUploadingVideo(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "The image URL has been copied to your clipboard.",
    });
  };

  const handleRegenerate = async (type: 'cover' | 'character' | 'scene' | 'map', storyId: string, assetId?: string) => {
    const actionId = `${type}-${assetId || storyId}`;
    setIsRegenerating(actionId);

    try {
        if (type === 'cover') {
            await regenerateStoryCover(storyId);
            const updatedStory = stories.find(s => s.id === storyId);
            if (updatedStory) {
                setImageCoverUrl(updatedStory.imageUrl || '');
                setVideoCoverUrl(updatedStory.videoUrl || '');
            }
        } else if (type === 'character' && assetId) {
            await regenerateCharacterImages(storyId, assetId);
        } else if (type === 'scene' && assetId) {
            await regenerateSceneVisual(storyId, assetId);
        } else if (type === 'map') {
            await regenerateStoryMap(storyId);
        }

        toast({
            variant: "success",
            title: "Regeneration Successful!",
            description: `The ${type} image has been updated.`,
        });
    } catch (error) {
        const err = error as Error;
        toast({
            variant: "destructive",
            title: "Regeneration Failed",
            description: err.message,
        });
    } finally {
        setIsRegenerating(null);
    }
  };

  const handleEditCharacter = (storyId: string, characterId: string) => {
    router.push(`/characters?storyId=${storyId}&characterId=${characterId}&action=view`);
  };

  const handleSetBookOfTheDay = (storyId: string | null) => {
    updateDashboardConfig({ bookOfTheDayStoryId: storyId || undefined });
    setSelectedBookOfTheDay(storyId);
    if(storyId) {
        const story = stories.find(s => s.id === storyId);
        toast({ title: "Book of the Day Updated", description: `"${story?.name}" is now featured.`});
    } else {
        toast({ title: "Book of the Day Reset", description: `The featured book will now be based on popularity.`});
    }
  };
  
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the control center for your application.
        </p>
      </div>

      {/* Stats Cards */}
      <section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
              <BookCopy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStories}</div>
              <p className="text-xs text-muted-foreground">Number of stories you've created.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Characters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCharacters}</div>
              <p className="text-xs text-muted-foreground">Characters across all your stories.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Choices / Story</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgChoicesPerStory}</div>
              <p className="text-xs text-muted-foreground">Average interactions per story.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dev Tools</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/admin/image-test">
                <Button variant="outline" className="w-full">
                  Image Generation
                </Button>
              </Link>
              <Link href="/admin/end-story-preview">
                <Button variant="outline" className="w-full">
                  End of Story Preview
                </Button>
              </Link>
               <Link href="/admin/relationship-event-test">
                <Button variant="outline" className="w-full">
                  Relationship Event Preview
                </Button>
              </Link>
              <Link href="/admin/npc-interaction-test">
                <Button variant="outline" className="w-full">
                  NPC Interaction Test
                </Button>
              </Link>
              <Link href="/admin/lockpicking-test">
                <Button variant="outline" className="w-full">
                  Lockpicking Test
                </Button>
              </Link>
               <Link href="/admin/persuasion-test">
                <Button variant="outline" className="w-full">
                  Persuasion Test
                </Button>
              </Link>
              <Link href="/admin/riddle-test">
                <Button variant="outline" className="w-full">
                  Riddle Test
                </Button>
              </Link>
              <Link href="/admin/liars-dice-test">
                <Button variant="outline" className="w-full">
                  Liar's Dice Test
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Management Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Story Management</CardTitle>
            <CardDescription>Browse, view details of, or remove your stories.</CardDescription>
          </CardHeader>
          <CardContent>
            {stories.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Author</TableHead>
                            <TableHead className="hidden md:table-cell">Genre</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Characters</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Choices</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stories.map((story) => (
                            <TableRow key={story.id}>
                                <TableCell className="font-medium">{story.name}</TableCell>
                                <TableCell className="hidden md:table-cell">{story.authorName || 'N/A'}</TableCell>
                                <TableCell className="hidden md:table-cell"><Badge variant="outline">{story.genre}</Badge></TableCell>
                                <TableCell className="hidden md:table-cell text-center">{story.characters.length}</TableCell>
                                <TableCell className="hidden md:table-cell text-center">{story.storyHistory?.length ?? 0}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setStoryToView(story)}><FilePenLine className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => exportStory(story.id)}><Download className="mr-2 h-4 w-4" /> Export JSON</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(story)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    <List className="mx-auto h-12 w-12" />
                    <p className="mt-4">You haven't created any stories yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Settings</CardTitle>
                <CardDescription>Control what appears on the main dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="book-of-the-day" className="text-sm font-medium">Book of the Day</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="book-of-the-day" variant="outline" role="combobox" className="w-full justify-between mt-1">
                        {selectedBookOfTheDay
                          ? stories.find((s) => s.id === selectedBookOfTheDay)?.name
                          : "Select a book..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search stories..." />
                        <CommandEmpty>No story found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem onSelect={() => handleSetBookOfTheDay(null)}>
                                <BookMarked className="mr-2 h-4 w-4" />
                                Automatic (Most Popular)
                            </CommandItem>
                            {publicStories.map((story) => (
                              <CommandItem
                                key={story.id}
                                value={story.name}
                                onSelect={() => handleSetBookOfTheDay(story.id)}
                              >
                                <CheckCircle className={cn("mr-2 h-4 w-4", selectedBookOfTheDay === story.id ? "opacity-100" : "opacity-0")} />
                                {story.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">Select a story to feature. "Automatic" uses the most popular.</p>
                </div>
              </CardContent>
            </Card>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!storyToDelete} onOpenChange={(open) => !open && setStoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the story "{storyToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story Detail Dialog */}
      <Dialog open={!!storyToView} onOpenChange={(open) => { if(!isRegenerating && !open) setStoryToView(null) }}>
        <DialogContent className="max-w-4xl">
          {storyToView && (
            <>
            <ScrollArea className="max-h-[80vh]">
              <div className="p-6 pr-8 space-y-6">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold font-headline text-center mb-2">{storyToView.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Plot</label>
                  </div>
                  <Textarea 
                    value={plotText}
                    onChange={(e) => setPlotText(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Author</p>
                  <Popover open={authorSearchOpen} onOpenChange={setAuthorSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={authorSearchOpen} className="w-full justify-between">
                        {selectedAuthor ? selectedAuthor.label : "Select author..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search authors..." />
                        <CommandEmpty>No author found.</CommandEmpty>
                        <CommandList>
                            <CommandGroup>
                                {allAuthors.map((author) => (
                                <CommandItem
                                    key={author.value}
                                    value={author.label}
                                    onSelect={() => handleAuthorSelect(author.value)}
                                >
                                    <CheckCircle className={cn("mr-2 h-4 w-4",selectedAuthor?.value === author.value ? "opacity-100" : "opacity-0")} />
                                    {author.label}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">Cover Media</h3>
                            <div className="w-full aspect-[9/16] rounded-md object-cover shadow-lg bg-muted">
                                {storyToView.videoUrl ? (
                                    <video src={storyToView.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-md" />
                                ) : (
                                    <Image src={storyToView.imageUrl || 'https://placehold.co/400x600.png'} alt={`Cover for ${storyToView.name}`} width={400} height={600} className="w-full h-full object-cover rounded-md" />
                                )}
                            </div>
                            
                            <div className="space-y-1 mt-2">
                                <Label htmlFor="image-cover-url" className="text-xs">Image URL</Label>
                                <Input 
                                  id="image-cover-url" 
                                  value={imageCoverUrl}
                                  onChange={(e) => setImageCoverUrl(e.target.value)}
                                  className="h-8 text-xs" 
                                />
                            </div>
                             <div className="space-y-1 mt-2">
                                <Label htmlFor="video-cover-url" className="text-xs">Video URL</Label>
                                <Input 
                                  id="video-cover-url" 
                                  value={videoCoverUrl}
                                  onChange={(e) => setVideoCoverUrl(e.target.value)}
                                  className="h-8 text-xs" 
                                />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideo} className="w-full mt-2">
                                {isUploadingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                Upload Video
                            </Button>
                            <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/mp4,video/webm" />
                            <Button size="sm" onClick={() => handleRegenerate('cover', storyToView.id)} disabled={!!isRegenerating} className="w-full mt-2">
                                {isRegenerating === `cover-${storyToView.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Re-generate Cover Image
                            </Button>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" />World Map</h3>
                            <Image src={storyToView.mapUrl || 'https://placehold.co/400x600.png'} alt={`Map for ${storyToView.name}`} width={400} height={600} className="rounded-md object-cover shadow-lg w-full" data-ai-hint="fantasy map" />
                            <Button size="sm" onClick={() => handleRegenerate('map', storyToView.id)} disabled={!!isRegenerating} className="w-full mt-2">
                                {isRegenerating === `map-${storyToView.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Re-generate Map
                            </Button>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users2 className="h-5 w-5 text-primary" />Characters</h3>
                            <div className="space-y-4">
                                {storyToView.characters.map(char => (
                                <div key={char.id} className="flex items-start gap-4 p-3 rounded-md bg-muted/50">
                                    <div className="relative w-20 h-28 flex-shrink-0">
                                      <Image 
                                        src={char.profileImageUrl} 
                                        alt={char.name} 
                                        fill
                                        className="rounded-md object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="font-semibold">{char.name}</p>
                                        <p className="text-xs text-muted-foreground">{char.traits}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleEditCharacter(storyToView.id, char.id)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleRegenerate('character', storyToView!.id, char.id)} disabled={!!isRegenerating}>
                                                {isRegenerating === `character-${char.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                                Re-generate
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><GalleryHorizontal className="h-5 w-5 text-primary" />Scenes</h3>
                             <ScrollArea className="w-full whitespace-nowrap rounded-md">
                                <div className="flex space-x-4 pb-4">
                                    {storyToView.scenes.map(scene => (
                                    <div key={scene.id} className="space-y-2 group w-40 flex-shrink-0">
                                        <div className="aspect-[9/16] relative overflow-hidden rounded-md">
                                            <Image src={scene.url} alt={scene.name} fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <Button size="sm" className="w-full text-xs h-7" onClick={() => router.push(`/scenes?storyId=${storyToView.id}&sceneId=${scene.id}`)}>
                                                    <Edit className="mr-1 h-3 w-3" /> Edit
                                                </Button>
                                                <Button size="sm" className="w-full text-xs h-7" onClick={() => handleRegenerate('scene', storyToView!.id, scene.id)} disabled={!!isRegenerating}>
                                                    {isRegenerating === `scene-${scene.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                                                    Re-gen
                                                </Button>
                                                <Button size="sm" className="w-full text-xs h-7" onClick={() => handleDownload(scene.url, `${scene.name}.jpg`)}>
                                                    <Download className="mr-1 h-3 w-3" /> Download
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold truncate text-center">{scene.name}</p>
                                    </div>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0 border-t">
                <Button variant="ghost" onClick={() => setStoryToView(null)}>Close</Button>
                <Button onClick={handleSaveChanges} disabled={plotText.trim() === storyToView.plot && imageCoverUrl.trim() === (storyToView.imageUrl || "") && videoCoverUrl.trim() === (storyToView.videoUrl || "")}>
                    <Save className="mr-2 h-4 w-4"/>
                    Save Changes
                </Button>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
