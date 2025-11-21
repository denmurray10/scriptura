
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import LiarsDiceMinigame from "@/components/LiarsDiceMinigame";
import type { MiniGame } from "@/types";
import { handleLiarsDiceTurnAction, generateLiarsDiceHintAction } from "@/lib/actions";

// Mock data for the test page
const mockNpc = {
  id: "npc_gambler_1",
  name: "One-Eyed Jack",
  description: "A grizzled gambler who has seen it all.",
  imageUrl: "https://placehold.co/128x192.png",
  hint: "grizzled gambler",
};

const getInitialMiniGame = (): MiniGame => {
    // Generate random dice for both player and NPC
    const playerDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
    const npcDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
    
    return {
      type: 'liarsDice',
      status: 'active',
      data: {
        npcName: mockNpc.name,
        playerDice,
        npcDice,
        currentBid: null,
        turn: 'player',
        lastActionMessage: "The game begins. Place your bid.",
        pot: 10,
      }
    };
};

export default function LiarsDiceTestPage() {
    const { toast } = useToast();
    const [isGameActive, setIsGameActive] = useState(false);
    const [miniGame, setMiniGame] = useState<MiniGame | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [isGeneratingHint, setIsGeneratingHint] = useState(false);

    const handleStartTest = () => {
        setMiniGame(getInitialMiniGame());
        setHint(null);
        setIsGameActive(true);
    };

    const handleEndTest = () => {
        setIsGameActive(false);
        setMiniGame(null);
    };
    
    const getHint = async (game: MiniGame) => {
      if (game.type !== 'liarsDice' || !game.data.currentBid) return;
      setIsGeneratingHint(true);
      setHint(null);
      try {
        const result = await generateLiarsDiceHintAction({
          playerDice: game.data.playerDice,
          totalDiceInPlay: game.data.playerDice.length + game.data.npcDice.length,
          currentBid: game.data.currentBid,
        });
        setHint(result.recommendation);
      } catch (e) {
        console.error("Hint generation failed:", e);
        setHint("Could not get a hint at this time.");
      } finally {
        setIsGeneratingHint(false);
      }
    };

    const handlePlayerAction = async (action: { type: 'bid', quantity: number, value: number } | { type: 'challenge' }) => {
        if (!miniGame || miniGame.type !== 'liarsDice' || isSubmitting) return;

        setIsSubmitting(true);
        setHint(null);
        
        let newGameState = { ...miniGame };

        if (action.type === 'bid') {
             newGameState.data = {
                ...miniGame.data,
                currentBid: { quantity: action.quantity, value: action.value },
                lastActionMessage: `You bid ${action.quantity} x ${action.value}'s.`,
                turn: 'npc' 
            };
            setMiniGame(newGameState);
        } else { // Challenge
            const bid = miniGame.data.currentBid!;
            const allDice = [...miniGame.data.playerDice, ...miniGame.data.npcDice];
            const countOfBidValue = allDice.filter(d => d === bid.value || d === 1).length;
            
            const challengerWins = countOfBidValue < bid.quantity;
            
            const resultMessage = challengerWins 
                ? `You challenged and won! There were only ${countOfBidValue} x ${bid.value}'s.`
                : `You challenged and lost! There were ${countOfBidValue} x ${bid.value}'s.`;

            newGameState.status = challengerWins ? 'won' : 'lost';
            newGameState.data = { ...miniGame.data, lastActionMessage: resultMessage, turn: 'player' };
            setMiniGame(newGameState);

            setTimeout(() => handleEndTest(), 4000);
            setIsSubmitting(false);
            return;
        }

        // Now, get the NPC's response
        try {
            const npcResponse = await handleLiarsDiceTurnAction({
                npcName: newGameState.data.npcName,
                npcDice: newGameState.data.npcDice,
                totalDiceInPlay: newGameState.data.playerDice.length + newGameState.data.npcDice.length,
                currentBid: newGameState.data.currentBid
            });
            
            let finalGameState: MiniGame;

            if (npcResponse.action === 'challenge') {
                const bid = newGameState.data.currentBid!;
                const allDice = [...newGameState.data.playerDice, ...newGameState.data.npcDice];
                const countOfBidValue = allDice.filter(d => d === bid.value || d === 1).length;

                const challengerWins = countOfBidValue < bid.quantity;
                const resultMessage = `${npcResponse.dialogue} There were ${countOfBidValue} x ${bid.value}'s.`;

                finalGameState = {
                    ...newGameState,
                    status: challengerWins ? 'lost' : 'won',
                    data: { ...newGameState.data, lastActionMessage: resultMessage, turn: 'player' },
                };
                setTimeout(() => handleEndTest(), 4000);

            } else { // NPC bids
                finalGameState = {
                    ...newGameState,
                    data: {
                        ...newGameState.data,
                        currentBid: npcResponse.bid!,
                        lastActionMessage: npcResponse.dialogue,
                        turn: 'player'
                    }
                };
                await getHint(finalGameState);
            }
            setMiniGame(finalGameState);
        } catch (e) {
            const err = e as Error;
            toast({ variant: 'destructive', title: "AI Error", description: err.message });
            setMiniGame(prev => prev ? ({ ...prev, data: {...prev.data, turn: 'player'} }) : null);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold font-headline mb-2">Liar's Dice Mini-Game Test</h1>
            <p className="text-muted-foreground mb-6">Use this page to test the Liar's Dice UI.</p>

            <div className="space-y-4">
                <Button onClick={isGameActive ? handleEndTest : handleStartTest}>
                    {isGameActive ? "End Mini-Game" : "Start Liar's Dice Game"}
                </Button>
            </div>

            {isGameActive && miniGame && miniGame.type === 'liarsDice' && (
              <LiarsDiceMinigame
                gameData={miniGame} 
                onPlayerAction={handlePlayerAction}
                isSubmitting={isSubmitting}
                npcImageUrl={mockNpc.imageUrl}
                npcImageHint={mockNpc.hint}
                hint={hint}
                isGeneratingHint={isGeneratingHint}
              />
            )}
        </div>
    )
}
