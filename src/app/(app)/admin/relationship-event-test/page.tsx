
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useStory } from "@/contexts/StoryContext";
import type { Character } from "@/types";
import { generateScenarioVisualAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function RelationshipEventTestPage() {
    const router = useRouter();
    const { activeStory } = useStory();
    const { toast } = useToast();

    const [character1, setCharacter1] = useState<Character | null>(null);
    const [character2, setCharacter2] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bgUrl, setBgUrl] = useState<string | null>(null);

    useEffect(() => {
        if (activeStory && activeStory.characters.length >= 2) {
            const char1 = activeStory.characters[0];
            const char2 = activeStory.characters[1];
            setCharacter1(char1);
            setCharacter2(char2);

            const generateBg = async () => {
                try {
                    const prompt = `A cinematic, emotional, and dramatic scene. In the scene are two fantasy characters. 
                    
                    Character 1:
                    - Name: ${char1.name}
                    - Sex: ${char1.sex}
                    - Age: ${char1.age}
                    - Hair Colour: ${char1.hairColour}
                    - Eye Colour: ${char1.eyeColour}

                    Character 2:
                    - Name: ${char2.name}
                    - Sex: ${char2.sex}
                    - Age: ${char2.age}
                    - Hair Colour: ${char2.hairColour}
                    - Eye Colour: ${char2.eyeColour}

                    The atmosphere is tense and pivotal. Style: ${activeStory.style}.`;
                    const result = await generateScenarioVisualAction({ scenarioDescription: prompt });
                    setBgUrl(result.url);
                } catch (error) {
                    const err = error as Error;
                    toast({
                        variant: "destructive",
                        title: "Background Generation Failed",
                        description: err.message,
                    });
                    setBgUrl('https://placehold.co/1280x720.png');
                } finally {
                    setIsLoading(false);
                }
            };

            generateBg();
        } else {
            setIsLoading(false);
        }
    }, [activeStory, toast]);

    const mockEvent = {
        description: character1 && character2 
            ? `As the tension finally breaks, ${character1.name} grabs ${character2.name}'s arm, their voice low and urgent. 'I can't let you do this alone,' they say, their usual caution replaced by a fierce protectiveness. ${character2.name}, taken aback, sees not just an ally, but a true friend in their eyes for the first time. Their bond has deepened into a true partnership.`
            : "A significant moment has occurred between two characters, strengthening their bond.",
        type: "positive"
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4 text-muted-foreground">Generating event preview...</p>
            </div>
        );
    }
    
    if (!activeStory || !character1 || !character2) {
         return (
            <div className="flex flex-col gap-4 h-screen w-full items-center justify-center">
                <h2 className="text-2xl font-bold">No Active Story</h2>
                <p className="text-muted-foreground max-w-sm text-center">Please select an active story with at least two characters from the dashboard to run this test.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {bgUrl && (
                <Image
                    src={bgUrl}
                    alt={"Story scenario"}
                    fill
                    className="object-cover"
                    data-ai-hint="dramatic fantasy landscape"
                />
            )}
            <div className="absolute inset-0 bg-black/30 z-10" />
            <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
                <div className={cn(
                    "w-full max-w-2xl text-center p-6 animate-in fade-in-50 duration-1000",
                    "bg-black/20 backdrop-blur-md rounded-2xl border border-white/10"
                )}>

                    <div className="relative flex justify-center items-center -space-x-8 mb-6">
                        <div className="w-24 h-36 md:w-32 md:h-48 rounded-lg overflow-hidden border-4 border-white/20 shadow-lg transform -rotate-6">
                            <Image src={character1.profileImageUrl} alt={character1.name} width={200} height={300} className="w-full h-full object-cover" data-ai-hint="male character portrait" />
                        </div>
                        <div className="w-24 h-36 md:w-32 md:h-48 rounded-lg overflow-hidden border-4 border-white/20 shadow-lg transform rotate-6 z-10">
                             <Image src={character2.profileImageUrl} alt={character2.name} width={200} height={300} className="w-full h-full object-cover" data-ai-hint="female character portrait" />
                        </div>
                    </div>

                    <h1 className="text-xl md:text-2xl font-headline text-white font-bold">Relationship Event</h1>
                    <p className="text-lg md:text-xl text-white/90 font-semibold mt-2">{character1.name} & {character2.name}</p>
                    
                    <p className="text-white/80 mt-4 leading-relaxed max-w-xl mx-auto">
                        {mockEvent.description}
                    </p>
                    
                    <div className="mt-8">
                        <Button onClick={() => router.back()} size="lg" className="bg-white text-black hover:bg-white/90">
                            Continue Story <Check className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
