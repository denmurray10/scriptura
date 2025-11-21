
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Users, BarChart3, BrainCircuit, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import type { MiniGame, CharacterStats } from "@/types";

interface PersuasionMinigameProps {
    gameData: MiniGame;
    characterStats: CharacterStats;
    onSubmitChoice: (choiceIndex: number) => Promise<void>;
    isSubmitting: boolean;
    npcImageUrl?: string;
    npcImageHint?: string;
}

const statIconMap: Record<keyof CharacterStats, React.ElementType> = {
    charisma: Star,
    intellect: BrainCircuit,
    wits: BarChart3,
    willpower: Users,
};

export default function PersuasionMinigame({ gameData, characterStats, onSubmitChoice, isSubmitting, npcImageUrl, npcImageHint }: PersuasionMinigameProps) {
    if (gameData.type !== 'persuasion') {
        return null;
    }
    
    const { npcName, npcAttitude, goal, currentStage, stages } = gameData.data;
    const isGameOver = gameData.status === 'won' || gameData.status === 'lost';
    const currentStageData = stages[currentStage];

    const getAttitudeStyle = (attitude: typeof npcAttitude) => {
        switch (attitude) {
            case 'Hostile': return 'text-red-500';
            case 'Annoyed': return 'text-orange-500';
            case 'Neutral': return 'text-yellow-500';
            case 'Amused': return 'text-green-400';
            case 'Friendly': return 'text-green-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-50 p-4">
            <Card className="w-full max-w-md flex flex-col h-full md:h-auto md:max-h-[90vh]">
                <CardHeader className="text-center flex-shrink-0">
                    <CardTitle>Persuading {npcName}</CardTitle>
                    <CardDescription>
                        Your Goal: {goal}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center gap-4 text-center">
                     <div className="flex flex-col items-center gap-4">
                        {npcImageUrl && (
                            <div className="w-24 h-36 rounded-lg overflow-hidden border-4 border-primary shadow-lg">
                                <Image src={npcImageUrl} alt={npcName} width={128} height={192} className="w-full h-full object-cover" data-ai-hint={npcImageHint || 'merchant'} />
                            </div>
                        )}
                         <p className="font-semibold">Attitude: <span className={cn(getAttitudeStyle(npcAttitude))}>{npcAttitude}</span></p>
                         <p className="text-muted-foreground italic mt-2 max-w-xs">"{currentStageData.npcDialogue}"</p>
                     </div>
                    
                    {!isGameOver && (
                        <div className="space-y-3">
                           {currentStageData.options.map((option, index) => {
                                const Icon = statIconMap[option.stat];
                                const canSucceed = characterStats[option.stat] >= option.difficulty;
                                return (
                                    <Button 
                                        key={index}
                                        variant="outline"
                                        className="w-full h-auto text-left flex justify-between items-center p-3 whitespace-normal"
                                        onClick={() => onSubmitChoice(index)}
                                        disabled={isSubmitting}
                                    >
                                        <span className="flex-1 pr-2">{option.text}</span>
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                                            canSucceed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        )}>
                                            <Icon className="h-4 w-4" />
                                            <span>{option.stat.charAt(0).toUpperCase() + option.stat.slice(1)}</span>
                                        </div>
                                    </Button>
                                )
                           })}
                        </div>
                    )}
                     {isSubmitting && <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />}

                    {isGameOver && (
                        <div className={cn(
                            "p-4 rounded-lg text-center flex flex-col items-center gap-2 animate-in zoom-in-95",
                            gameData.status === 'won' ? 'bg-green-100/20 text-green-700' : 'bg-red-100/20 text-red-700'
                        )}>
                            {gameData.status === 'won' ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            <p className="font-bold">{gameData.status === 'won' ? 'Success!' : 'Failed!'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
