
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import RiddleMinigame from "@/components/RiddleMinigame";
import type { MiniGame } from "@/types";

// Mock data for the test page
const mockRiddle: MiniGame = {
  type: 'riddle',
  status: 'active',
  data: {
    npcName: "The Sphinx",
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    answers: ['a map', 'map'],
  }
};


export default function RiddleTestPage() {
    const { toast } = useToast();
    const [isGameActive, setIsGameActive] = useState(false);
    const [miniGame, setMiniGame] = useState<MiniGame | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleStartTest = () => {
        setMiniGame(mockRiddle);
        setIsGameActive(true);
    };

    const handleEndTest = () => {
        setIsGameActive(false);
        setMiniGame(null);
    };

    const handleTestSubmit = async (attempt: string) => {
        if (!miniGame || miniGame.type !== 'riddle' || isSubmitting) return;

        setIsSubmitting(true);
        
        // Simulate a delay for suspense
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isCorrect = miniGame.data.answers.includes(attempt.trim().toLowerCase());
        
        if (isCorrect) {
            toast({ variant: 'success', title: "Correct!", description: "The ancient mechanism groans, and the path forward is revealed." });
            setMiniGame({ ...miniGame, status: 'won' });
            setTimeout(() => handleEndTest(), 3000);
        } else {
            toast({ variant: 'destructive', title: "Incorrect", description: `"${attempt}" is not the answer the Sphinx seeks.` });
            // For this test, we won't end the game on a wrong answer.
            // In a real scenario, you might have limited attempts.
        }
        
        setIsSubmitting(false);
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold font-headline mb-2">Riddle Mini-Game Test</h1>
            <p className="text-muted-foreground mb-6">Use this page to test the riddle mini-game UI.</p>

            <div className="space-y-4">
                <Button onClick={isGameActive ? handleEndTest : handleStartTest}>
                    {isGameActive ? "End Mini-Game" : "Start Riddle Mini-Game"}
                </Button>
            </div>

            {isGameActive && miniGame && miniGame.type === 'riddle' && (
              <RiddleMinigame 
                gameData={miniGame} 
                onSubmitAttempt={handleTestSubmit}
                isSubmitting={isSubmitting}
                npcImageUrl="https://placehold.co/128x192.png"
                npcImageHint="sphinx statue"
              />
            )}
        </div>
    )
}
