
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import LockpickingMinigame from "@/components/LockpickingMinigame";
import type { MiniGame } from "@/types";

const getInitialMiniGame = (): MiniGame => ({
  type: 'lockpicking',
  status: 'active',
  data: {
    puzzle: ['triangle', 'key', 'square', 'circle'],
    playerSequence: [],
    difficulty: 'medium',
  }
});

export default function LockpickingTestPage() {
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

    const handleTestSubmit = async (attempt: string[]) => {
        if (!miniGame || miniGame.type !== 'lockpicking' || isSubmitting) return;

        setIsSubmitting(true);
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const isCorrect = JSON.stringify(attempt) === JSON.stringify(miniGame.data.puzzle);
        
        if (isCorrect) {
            toast({ variant: 'success', title: "Success!", description: "The lock springs open!" });
            setMiniGame({ ...miniGame, status: 'won' });
            setTimeout(() => handleEndTest(), 3000);
        } else {
            toast({ variant: 'destructive', title: "Incorrect Sequence", description: `The tumblers click, but nothing happens. Try again.` });
            setMiniGame({ ...miniGame });
        }
        
        setIsSubmitting(false);
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold font-headline mb-2">Lockpicking Mini-Game Test</h1>
            <p className="text-muted-foreground mb-6">Use this page to test the lockpicking mini-game UI.</p>

            <div className="space-y-4">
                <Button onClick={isGameActive ? handleEndTest : handleStartTest}>
                    {isGameActive ? "End Mini-Game" : "Start Lockpicking Mini-Game"}
                </Button>
            </div>

            {isGameActive && miniGame && miniGame.type === 'lockpicking' && (
              <LockpickingMinigame 
                gameData={miniGame} 
                onSubmitAttempt={handleTestSubmit}
                isSubmitting={isSubmitting}
              />
            )}
        </div>
    )
}
