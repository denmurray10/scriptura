
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, TrendingDown, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import type { MiniGame } from "@/types";

interface HagglingMinigameProps {
    gameData: MiniGame;
    onSubmitOffer: (offer: number) => Promise<void>;
    isSubmitting: boolean;
    npcImageUrl?: string;
    npcImageHint?: string;
}

export default function HagglingMinigame({ gameData, onSubmitOffer, isSubmitting, npcImageUrl, npcImageHint }: HagglingMinigameProps) {
    const [offer, setOffer] = useState(50); // Start slider in the middle
    
    if (gameData.type !== 'haggling') {
        return null;
    }
    
    const { npcName, item, npcDialogue, patience } = gameData.data;
    const isGameOver = gameData.status === 'won' || gameData.status === 'lost';

    const handleSubmit = async () => {
        if (isSubmitting) return;
        await onSubmitOffer(offer);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-50 p-4">
            <Card className="w-full max-w-md flex flex-col h-full md:h-auto md:max-h-[90vh]">
                <CardHeader className="text-center flex-shrink-0">
                    <CardTitle>Haggling with {npcName}</CardTitle>
                    <CardDescription>
                        Try to buy the "{item.name}" for a good price.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center gap-6 text-center">
                     <div className="flex flex-col items-center gap-4">
                        {npcImageUrl && (
                            <div className="w-32 h-48 rounded-lg overflow-hidden border-4 border-primary shadow-lg">
                                <Image src={npcImageUrl} alt={npcName} width={128} height={192} className="w-full h-full object-cover" data-ai-hint={npcImageHint || 'merchant'} />
                            </div>
                        )}
                         <p className="text-muted-foreground italic mt-2 max-w-xs">"{npcDialogue}"</p>
                     </div>
                    
                    {!isGameOver && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center text-sm font-medium mb-1">
                                    <span>NPC's Patience</span>
                                    <span>{Math.round(patience)}%</span>
                                </div>
                                <Progress value={patience} className="h-2" />
                            </div>

                            <div>
                                <p className="text-lg font-medium mb-2">Your Offer: <span className="font-bold text-primary text-xl">{offer} Gold</span></p>
                                <Slider
                                    defaultValue={[offer]}
                                    max={150} // Increased max offer range
                                    step={1}
                                    onValueChange={(value) => setOffer(value[0])}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>Lowball</span>
                                    <span>Fair Price</span>
                                    <span>Generous</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isGameOver && (
                        <div className={cn(
                            "p-4 rounded-lg text-center flex flex-col items-center gap-2 animate-in zoom-in-95",
                            gameData.status === 'won' ? 'bg-green-100/20 text-green-700' : 'bg-red-100/20 text-red-700'
                        )}>
                            {gameData.status === 'won' ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            <p className="font-bold">{gameData.status === 'won' ? 'Success!' : 'Failed!'}</p>
                             <p className="text-muted-foreground italic mt-2 max-w-xs">"{npcDialogue}"</p>
                        </div>
                    )}
                </CardContent>
                <CardContent className="flex justify-center pt-4 flex-shrink-0">
                    {!isGameOver && (
                        <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Make Offer'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
