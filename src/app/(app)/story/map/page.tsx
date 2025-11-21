
"use client";

import * as React from "react";
import { useMemo } from "react";
import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookLoader from "@/components/BookLoader";
import { AnimateInView } from "@/components/AnimateInView";

export default function WorldMapPage() {
  const { activeStory, scenes, storyHistory, characters } = useStory();
  const router = useRouter();

  const charactersByLocation = useMemo(() => {
    if (!activeStory) return {};
    return (scenes || []).reduce((acc, scene) => {
      const presentCharacters = characters.filter(char => {
          const lastEntry = [...storyHistory].reverse().find(entry => entry.characterId === char.id && entry.toLocationName);
          if (!lastEntry) {
              // If no history, assume they are at the starting location (first scene)
              return scene.name === (scenes || [])[0]?.name;
          }
          return lastEntry.toLocationName === scene.name;
      });
      acc[scene.name] = presentCharacters;
      return acc;
    }, {} as Record<string, typeof characters>);
  }, [activeStory, scenes, storyHistory, characters]);


  if (!activeStory) {
    return <BookLoader />;
  }

  if (!scenes || scenes.length === 0) {
    return (
      <div className="flex flex-col gap-4 h-screen w-full items-center justify-center p-4">
          <h2 className="text-2xl font-bold">Map Not Available</h2>
          <p className="text-muted-foreground">This story has no scenes yet.</p>
          <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
      </div>
    );
  }

  const handleBackToStory = () => {
    const path = activeStory.storyMode === 'narrator' ? '/story-narrator' : '/story';
    router.push(path);
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
       <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">World Map</h1>
          <p className="text-muted-foreground">All discovered locations in "{activeStory.name}".</p>
        </div>
        <Button variant="outline" onClick={handleBackToStory} className="bg-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Story
        </Button>
      </header>

      <div className="space-y-6">
        {scenes.map((scene, index) => (
          <AnimateInView key={scene.id} tag="div">
            <Card className="overflow-hidden flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="w-full md:w-1/3 aspect-video md:aspect-[9/16] relative flex-shrink-0">
                <Image
                  src={scene.url}
                  alt={scene.name}
                  fill
                  className="object-cover"
                  data-ai-hint="fantasy landscape"
                />
              </div>
              <div className="p-6 flex-1 bg-white">
                <h2 className="text-2xl font-bold font-headline">{scene.name}</h2>
                {scene.prompt && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                        "{scene.prompt}"
                    </p>
                )}
                <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" /> Characters Present
                    </h3>
                    <div className="flex flex-wrap items-start gap-4">
                      {(charactersByLocation[scene.name] || []).length > 0 ? (
                        (charactersByLocation[scene.name] || []).map(char => (
                          <div key={char.id} className="flex flex-col items-center gap-1.5" title={char.name}>
                            <div className="h-[100px] aspect-[9/16] rounded-md overflow-hidden border-2 border-border shadow-sm">
                                <Image 
                                  src={char.profileImageUrl} 
                                  alt={char.name} 
                                  width={80} 
                                  height={128} 
                                  className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground truncate w-full text-center max-w-[56px]">{char.name}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None</p>
                      )}
                    </div>
                </div>
              </div>
            </Card>
          </AnimateInView>
        ))}
      </div>
    </div>
  );
}

