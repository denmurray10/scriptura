
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { MiniGame } from "@/types";

interface RiddleMinigameProps {
    gameData: MiniGame;
    onSubmitAttempt: (attempt: string) => Promise<void>;
    isSubmitting: boolean;
    npcImageUrl?: string;
    npcImageHint?: string;
}

export default function RiddleMinigame({ gameData, onSubmitAttempt, isSubmitting, npcImageUrl, npcImageHint }: RiddleMinigameProps) {
    const [answer, setAnswer] = useState("");
    
    if (gameData.type !== 'riddle') {
        return null;
    }
    
    const { npcName, question } = gameData.data;
    const isGameOver = gameData.status === 'won' || gameData.status === 'lost';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !answer.trim()) return;
        await onSubmitAttempt(answer);
        setAnswer("");
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-50 p-4">
            <Card className="w-full max-w-md flex flex-col h-full md:h-auto md:max-h-[90vh]">
                <CardHeader className="text-center flex-shrink-0">
                    <CardTitle>A Riddle from {npcName || 'an Ancient Power'}</CardTitle>
                    <CardDescription>
                        Speak the answer to pass.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center gap-6 text-center">
                     <div className="flex flex-col items-center gap-4">
                        {npcImageUrl && (
                            <div className="w-32 h-48 rounded-lg overflow-hidden border-4 border-amber-600/50 shadow-lg">
                                <Image src={npcImageUrl} alt={npcName || "Riddle Giver"} width={128} height={192} className="w-full h-full object-cover" data-ai-hint={npcImageHint || 'statue'} />
                            </div>
                        )}
                         <p className="text-lg font-medium text-muted-foreground italic mt-2 max-w-xs">"{question}"</p>
                     </div>
                    
                    {!isGameOver && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                                placeholder="Your answer..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={isSubmitting}
                                className="text-center"
                            />
                            <Button type="submit" disabled={isSubmitting || !answer.trim()} size="lg" className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Answer'}
                            </Button>
                        </form>
                    )}

                    {isGameOver && (
                        <div className={cn(
                            "p-4 rounded-lg text-center flex flex-col items-center gap-2 animate-in zoom-in-95",
                            gameData.status === 'won' ? 'bg-green-100/20 text-green-700' : 'bg-red-100/20 text-red-700'
                        )}>
                            {gameData.status === 'won' ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            <p className="font-bold">{gameData.status === 'won' ? 'Correct!' : 'Incorrect.'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
