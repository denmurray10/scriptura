
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2, X, Circle, Triangle, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MiniGame } from "@/types";

interface LockpickingMinigameProps {
    gameData: MiniGame;
    onSubmitAttempt: (attempt: string[]) => Promise<void>;
    isSubmitting: boolean;
}

const symbolMap = {
    triangle: <Triangle className="h-8 w-8" />,
    circle: <Circle className="h-8 w-8" />,
    square: <Square className="h-8 w-8" />,
    key: <KeyRound className="h-8 w-8" />,
};
type Symbol = keyof typeof symbolMap;
const availableSymbols: Symbol[] = ['triangle', 'circle', 'square', 'key'];

export default function LockpickingMinigame({ gameData, onSubmitAttempt, isSubmitting }: LockpickingMinigameProps) {
    const [playerSequence, setPlayerSequence] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<('correct' | 'incorrect' | 'none')[]>([]);
    const [isShowingFeedback, setIsShowingFeedback] = useState(false);

    if (gameData.type !== 'lockpicking') return null;
    
    const { puzzle } = gameData.data;
    
    useEffect(() => {
        // Reset feedback when a new attempt can be made
        if (!isSubmitting) {
            setFeedback([]);
        }
    }, [isSubmitting]);


    const handleSymbolClick = (symbol: string) => {
        if (playerSequence.length < puzzle.length) {
            setPlayerSequence(prev => [...prev, symbol]);
        }
    };

    const handleClear = () => {
        setPlayerSequence([]);
    };

    const handleSubmit = async () => {
        if (isSubmitting || playerSequence.length !== puzzle.length) return;

        // 1. Show feedback
        const newFeedback = playerSequence.map((symbol, index) => 
            symbol === puzzle[index] ? 'correct' : 'incorrect'
        );
        setFeedback(newFeedback);
        setIsShowingFeedback(true);

        // 2. Submit the attempt to the parent
        await onSubmitAttempt(playerSequence);

        // 3. Clear the sequence after a delay, but only if the game is not won
        if (gameData.status !== 'won') {
             setTimeout(() => {
                setPlayerSequence([]);
                setIsShowingFeedback(false);
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Lockpicking</CardTitle>
                    <CardDescription>Crack the code by guessing the correct sequence of symbols.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    {/* Player Input */}
                    <div className="space-y-2">
                        <div className="flex gap-3 p-3 rounded-lg bg-muted border h-[72px]">
                            {Array.from({ length: puzzle.length }).map((_, index) => {
                                const symbol = playerSequence[index];
                                const feedbackState = feedback[index];
                                return (
                                    <div key={index} className={cn(
                                        "h-12 w-12 flex items-center justify-center bg-background rounded border-dashed border-2 transition-colors",
                                        isShowingFeedback && feedbackState === 'correct' && 'border-green-500 bg-green-500/20 text-green-500',
                                        isShowingFeedback && feedbackState === 'incorrect' && 'border-destructive bg-destructive/20 text-destructive'
                                    )}>
                                        {symbol && symbolMap[symbol as Symbol]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Symbol Buttons */}
                    <div className="grid grid-cols-4 gap-3 w-full">
                        {availableSymbols.map(symbol => (
                            <Button key={symbol} variant="outline" size="icon" className="h-16 w-full" onClick={() => handleSymbolClick(symbol)} disabled={playerSequence.length >= puzzle.length || isSubmitting || isShowingFeedback}>
                                {symbolMap[symbol]}
                            </Button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full">
                        <Button variant="destructive" onClick={handleClear} disabled={isSubmitting || isShowingFeedback} className="flex-1">Clear</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || playerSequence.length !== puzzle.length || isShowingFeedback} className="flex-1">
                            {isSubmitting ? <Loader2 className="animate-spin"/> : "Attempt"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
