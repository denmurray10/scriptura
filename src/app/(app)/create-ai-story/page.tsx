

"use client";

import { useState } from "react";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Globe, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AnimateInView } from "@/components/AnimateInView";
import { generateFullStoryAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { genreOptions } from "@/lib/config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function CreateAiStoryPage() {
  const { createStory } = useStory();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenreToggle = (genreName: string) => {
    const newSelectedGenres = [...selectedGenres];
    const index = newSelectedGenres.indexOf(genreName);

    if (index > -1) {
      newSelectedGenres.splice(index, 1);
    } else {
      if (newSelectedGenres.length >= 2) {
        toast({
          variant: "destructive",
          title: "Genre Limit Reached",
          description: "You can select a maximum of 2 genres.",
        });
        return;
      }
      newSelectedGenres.push(genreName);
    }
    setSelectedGenres(newSelectedGenres);
  };

  const handleGenerateStory = async () => {
    if (selectedGenres.length === 0) {
      toast({
        variant: "destructive",
        title: "No Genre Selected",
        description: "Please choose at least one genre for your story.",
      });
      return;
    }

    setIsLoading(true);
    const combinedGenre = selectedGenres.join(' / ');
    try {
      const { storyData, scenes, characters } = await generateFullStoryAction({ genre: combinedGenre });

      const finalStoryData = {
        ...storyData,
        isPublic: isPublic,
      }

      await createStory(finalStoryData, scenes, characters);
      
      toast({
        title: "Story Created!",
        description: `"${storyData.name}" has been generated and saved.`,
      });
      router.push("/dashboard");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "AI Story Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold">Creating your story...</p>
        </div>
      )}
      <AnimateInView tag="div" className="space-y-8 max-w-4xl mx-auto">
        <div className="text-left">
          <h1 className="text-3xl font-bold font-headline">AI Story Generator</h1>
          <p className="text-muted-foreground">Choose up to two genres, and let the AI craft an entire story for you.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Genre(s)</CardTitle>
            <CardDescription>This will define the world, characters, and plot of your story.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {genreOptions.map((genre) => (
                  <Tooltip key={genre.name}>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant={selectedGenres.includes(genre.name) ? "default" : "outline"}
                          onClick={() => handleGenreToggle(genre.name)}
                          className="h-20 text-center w-full"
                        >
                          {genre.name}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{genre.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Step 2: Choose Privacy</CardTitle>
                <CardDescription>Decide who can see your generated story.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={String(isPublic)}
                    onValueChange={(value) => setIsPublic(value === 'true')}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="true" id="privacy-public" className="peer sr-only" />
                        <Label
                            htmlFor="privacy-public"
                            className={cn(
                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-full",
                                "hover:bg-accent hover:text-accent-foreground",
                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                "cursor-pointer transition-all text-center"
                            )}
                        >
                            <Globe className="h-8 w-8 mb-2" />
                            <span className="text-lg font-semibold">Public</span>
                            <span className="text-sm font-normal text-muted-foreground mt-1">Visible to all. Public stories may be submitted for review and featured on the platform.</span>
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="false" id="privacy-personal" className="peer sr-only" />
                        <Label
                            htmlFor="privacy-personal"
                            className={cn(
                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-full",
                                "hover:bg-accent hover:text-accent-foreground",
                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                "cursor-pointer transition-all text-center"
                            )}
                        >
                            <Lock className="h-8 w-8 mb-2" />
                            <span className="text-lg font-semibold">Personal</span>
                            <span className="text-sm font-normal text-muted-foreground mt-1">Only for you. Your story will appear in your library immediately and will not be shared.</span>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button
            size="lg"
            onClick={handleGenerateStory}
            disabled={selectedGenres.length === 0 || isLoading}
          >
            <Bot className="mr-2 h-5 w-5" />
            Generate Story with AI
          </Button>
        </div>
      </AnimateInView>
    </>
  );
}
