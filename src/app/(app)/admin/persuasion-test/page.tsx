
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PersuasionMinigame from "@/components/PersuasionMinigame";
import type { MiniGame, CharacterStats } from "@/types";

// Mock data for the test page
const mockNpc = {
  id: "npc_guard_1",
  name: "Grumble, the City Guard",
  description: "A guard with a stern face and a rule for everything.",
  imageUrl: "https://placehold.co/128x192.png",
  hint: "stern guard",
};

const mockCharacterStats: CharacterStats = {
    charisma: 5,
    intellect: 7,
    wits: 4,
    willpower: 6,
};

const getInitialMiniGame = (): MiniGame => ({
  type: 'persuasion',
  status: 'active',
  data: {
    npcName: mockNpc.name,
    npcAttitude: 'Annoyed',
    goal: 'Convince the guard to let you into the restricted archives.',
    currentStage: 0,
    stages: [
        {
            npcDialogue: "Halt! The archives are off-limits to the public. State your business.",
            options: [
                { text: "Bribe him with 10 gold.", stat: 'charisma', difficulty: 6 },
                { text: "Claim you have an appointment with the Head Archivist.", stat: 'intellect', difficulty: 4 },
                { text: "Try to distract him and slip by.", stat: 'wits', difficulty: 8 },
            ]
        },
        {
            npcDialogue: "An appointment, you say? I don't see your name on the ledger. This is highly irregular.",
            options: [
                { text: "Insist it was a last-minute arrangement.", stat: 'charisma', difficulty: 7 },
                { text: "Point out a smudge on the ledger, suggesting your name was erased.", stat: 'wits', difficulty: 5 },
                { text: "Recite an obscure city ordinance about public access.", stat: 'intellect', difficulty: 9 },
            ]
        },
    ]
  }
});


export default function PersuasionTestPage() {
    const { toast } = useToast();
    const [isGameActive, setIsGameActive] = useState(false);
    const [miniGame, setMiniGame] = useState<MiniGame | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleStartTest = () => {
        setMiniGame(getInitialMiniGame());
        setIsGameActive(true);
    };

    const handleEndTest = () => {
        setIsGameActive(false);
        setMiniGame(null);
    };

    const handleTestSubmit = async (choiceIndex: number) => {
        if (!miniGame || miniGame.type !== 'persuasion' || isSubmitting) return;

        setIsSubmitting(true);
        
        // Simulate a delay for suspense
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const currentStageData = miniGame.data.stages[miniGame.data.currentStage];
        const chosenOption = currentStageData.options[choiceIndex];

        const isSuccess = mockCharacterStats[chosenOption.stat] >= chosenOption.difficulty;
        
        if (isSuccess) {
            const isLastStage = miniGame.data.currentStage === miniGame.data.stages.length - 1;
            if (isLastStage) {
                // Game Won
                toast({ variant: 'success', title: "Success!", description: "The guard sighs and steps aside." });
                setMiniGame({
                    ...miniGame,
                    status: 'won',
                    data: {
                        ...miniGame.data,
                        npcDialogue: "Fine, fine. Go on in. But don't cause any trouble.",
                        npcAttitude: 'Amused',
                    }
                });
                setTimeout(() => handleEndTest(), 3000);
            } else {
                // Advance to next stage
                toast({ variant: 'success', title: "It's working...", description: "You've convinced him... for now." });
                setMiniGame({
                    ...miniGame,
                    data: {
                        ...miniGame.data,
                        currentStage: miniGame.data.currentStage + 1,
                        npcAttitude: 'Neutral', // Improve attitude
                    }
                });
            }
        } else {
            // Game Lost
            toast({ variant: 'destructive', title: "Failed!", description: "The guard is not convinced and loses his patience." });
            setMiniGame({
                ...miniGame,
                status: 'lost',
                data: {
                    ...miniGame.data,
                    npcDialogue: "I've heard enough! Be on your way before I arrest you for loitering!",
                    npcAttitude: 'Hostile',
                }
            });
            setTimeout(() => handleEndTest(), 3000);
        }
        
        setIsSubmitting(false);
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold font-headline mb-2">Persuasion Mini-Game Test</h1>
            <p className="text-muted-foreground mb-6">Use this page to test the persuasion mini-game UI.</p>

            <div className="space-y-4">
                <Button onClick={isGameActive ? handleEndTest : handleStartTest}>
                    {isGameActive ? "End Mini-Game" : "Start Persuasion Mini-Game"}
                </Button>
            </div>

            {isGameActive && miniGame && miniGame.type === 'persuasion' && (
              <PersuasionMinigame 
                gameData={miniGame} 
                characterStats={mockCharacterStats}
                onSubmitChoice={handleTestSubmit}
                isSubmitting={isSubmitting}
                npcImageUrl={mockNpc.imageUrl}
                npcImageHint={mockNpc.hint}
              />
            )}
        </div>
    )
}
