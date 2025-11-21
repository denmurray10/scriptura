
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import HagglingMinigame from "@/components/HagglingMinigame";
import type { MiniGame } from "@/types";
import { handleHagglingTurnAction } from "@/lib/actions";

// Mock data for the test page
const mockNpc = {
  id: "npc_merchant_1",
  name: "Bargain Bill",
  description: "A shifty-eyed merchant with a talent for high prices.",
  locationName: "The Open Market",
  imageUrl: "https://placehold.co/128x128.png",
  hint: "shifty merchant",
};

const getInitialMiniGame = (): MiniGame => ({
  type: 'haggling',
  status: 'active',
  data: {
    npcName: mockNpc.name,
    item: { name: "Mysterious Amulet", description: "It hums with a faint energy." },
    targetPrice: 70, // The secret price the NPC will accept
    patience: 100,
    npcDialogue: "Ah, a discerning customer! This ancient amulet is one of a kind. For you, a special price... 100 gold!",
  }
});


export default function NpcInteractionTestPage() {
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

    const handleTestSubmit = async (offer: number) => {
        if (!miniGame || miniGame.type !== 'haggling' || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await handleHagglingTurnAction({
                npcName: miniGame.data.npcName,
                item: miniGame.data.item,
                targetPrice: miniGame.data.targetPrice,
                patience: miniGame.data.patience,
                playerOffer: offer,
            });

            const newPatience = miniGame.data.patience - result.patienceDamage;
            const newStatus = result.isDeal ? 'won' : newPatience <= 0 ? 'lost' : 'active';
            
            const finalDialogue = newStatus === 'lost' 
                ? "I've had enough of this. The deal is off!" 
                : result.dialogue;

            const updatedGame: MiniGame = {
                ...miniGame,
                status: newStatus,
                data: {
                    ...miniGame.data,
                    patience: newPatience,
                    npcDialogue: finalDialogue,
                },
            };
            
            setMiniGame(updatedGame);
            
            if (newStatus === 'won' || newStatus === 'lost') {
                setTimeout(() => handleEndTest(), 3000); // End test after 3s
            }

        } catch(e) {
            const err = e as Error;
            console.error("Haggling test failed:", err);
            toast({
                variant: 'destructive',
                title: 'Haggling AI Error',
                description: `An error occurred: ${err.message}`,
                duration: 10000,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold font-headline mb-2">NPC Interaction Test</h1>
            <p className="text-muted-foreground mb-6">Use this page to test the haggling mini-game UI with the live AI.</p>

            <div className="space-y-4">
                <Button onClick={isGameActive ? handleEndTest : handleStartTest}>
                    {isGameActive ? "End Mini-Game" : "Start Haggling Mini-Game"}
                </Button>
            </div>

            {isGameActive && miniGame && (
              <HagglingMinigame 
                gameData={miniGame} 
                onSubmitOffer={handleTestSubmit}
                isSubmitting={isSubmitting}
                npcImageUrl={mockNpc.imageUrl}
                npcImageHint={mockNpc.hint}
              />
            )}
        </div>
    )
}
