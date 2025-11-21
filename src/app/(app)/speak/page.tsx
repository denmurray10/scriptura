
"use client";

import { useMemo, useState, useEffect } from "react";
import { useStory } from "@/contexts/StoryContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowLeft, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimateInView } from "@/components/AnimateInView";
import type { Story, Character } from "@/types";
import { Separator } from "@/components/ui/separator";

interface CharacterWithStory extends Character {
    storyName: string;
    storyId: string;
    storyAuthor: string | undefined;
    lastSpokenTo?: number; // Add this for sorting recents
}

const CharacterCard = ({ char, small = false }: { char: CharacterWithStory, small?: boolean }) => {
    const router = useRouter();
    return (
        <Card 
            className="overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover:border-primary/50 h-full"
            onClick={() => router.push(`/speak/${char.id}`)}
        >
            <CardContent className="p-0 h-full flex flex-col">
                <div className={small ? "relative aspect-[1/1]" : "relative aspect-[9/16]"}>
                    <Image 
                        src={char.profileImageUrl}
                        alt={`Portrait of ${char.name}`}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-foreground font-headline truncate">{char.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">from "{char.storyName}"</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SpeakPage() {
    const { stories, activeStory } = useStory();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [interviewHistory, setInterviewHistory] = useState<Record<string, number>>({});

     useEffect(() => {
        const storedHistory = localStorage.getItem('interviewHistory');
        if (storedHistory) {
            setInterviewHistory(JSON.parse(storedHistory));
        }
    }, []);

    const allCharacters = useMemo<CharacterWithStory[]>(() => {
        return stories.flatMap(story => 
            story.characters.map(character => ({
                ...character,
                storyName: story.name,
                storyId: story.id,
                storyAuthor: story.authorName,
                lastSpokenTo: interviewHistory[character.id]
            }))
        );
    }, [stories, interviewHistory]);

    const recentCharacters = useMemo(() => {
        return allCharacters
            .filter(char => char.lastSpokenTo)
            .sort((a, b) => b.lastSpokenTo! - a.lastSpokenTo!)
            .slice(0, 3);
    }, [allCharacters]);

    const featuredCharacter = useMemo(() => {
        if (activeStory && activeStory.characters.length > 0) {
            return allCharacters.find(c => c.id === activeStory.activeCharacterId);
        }
        // Fallback to the most recently played story's character that has an image
        const lastPlayedStory = [...stories].sort((a,b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0))[0];
        return allCharacters.find(c => c.storyId === lastPlayedStory?.id && c.profileImageUrl);
    }, [activeStory, stories, allCharacters]);


    const storiesWithCharacters = useMemo(() => {
        const storyMap = new Map<string, { story: Story; characters: CharacterWithStory[] }>();
        allCharacters.forEach(char => {
            if (!storyMap.has(char.storyId)) {
                const story = stories.find(s => s.id === char.storyId);
                if (story) {
                    storyMap.set(char.storyId, { story, characters: [] });
                }
            }
            storyMap.get(char.storyId)?.characters.push(char);
        });

        let results = Array.from(storyMap.values());
        
        if (searchQuery) {
            results = results
                .map(group => ({
                    ...group,
                    characters: group.characters.filter(char => 
                        char.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                }))
                .filter(group => 
                    group.story.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    group.characters.length > 0
                );
        }

        return results;
    }, [allCharacters, stories, searchQuery]);
    
    return (
        <AnimateInView tag="div" className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="flex-shrink-0">
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Speak with the Cast</h1>
                    <p className="text-muted-foreground">
                      Have a one-on-one, in-character conversation with anyone from your stories.
                    </p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search characters or stories..."
                    className="w-full pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* Featured Character */}
            {featuredCharacter && !searchQuery && (
                <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Interview of the Day</h2>
                     <Card 
                        className="overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                        onClick={() => router.push(`/speak/${featuredCharacter.id}`)}
                    >
                        <div className="grid md:grid-cols-2">
                             <div className="p-6 flex flex-col justify-center">
                                <p className="text-sm text-primary font-semibold flex items-center gap-2"><Star className="h-4 w-4" /> Featured</p>
                                <h3 className="text-2xl font-bold font-headline mt-1">{featuredCharacter.name}</h3>
                                <p className="text-muted-foreground mt-1">from "{featuredCharacter.storyName}"</p>
                                <p className="text-sm mt-4 text-muted-foreground line-clamp-3">{featuredCharacter.backstory}</p>
                            </div>
                            <div className="relative aspect-[9/16] md:aspect-auto">
                                <Image 
                                    src={featuredCharacter.profileImageUrl}
                                    alt={`Portrait of ${featuredCharacter.name}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </Card>
                </section>
            )}

            {/* Recent Characters */}
            {recentCharacters.length > 0 && !searchQuery && (
                 <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Recent Interviews</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {recentCharacters.map(char => <CharacterCard key={char.id} char={char} />)}
                    </div>
                </section>
            )}

            <Separator />
            
            {/* All Characters, grouped by Story */}
            <div className="space-y-8">
                {storiesWithCharacters.map(({ story, characters }) => (
                    <section key={story.id}>
                        <h2 className="text-2xl font-bold font-headline mb-4">{story.name}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                             {characters.map(char => <CharacterCard key={char.id} char={char} />)}
                        </div>
                    </section>
                ))}
            </div>

            {storiesWithCharacters.length === 0 && (
                 <Card className="text-center py-20 col-span-full">
                    <CardContent className="flex flex-col items-center">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">No Characters Found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            No characters match your search. Try creating a new story or character!
                        </p>
                    </CardContent>
                </Card>
            )}
        </AnimateInView>
    )
}
