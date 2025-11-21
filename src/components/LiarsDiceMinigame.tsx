
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Minus, Plus, Dices, User, Bot, HelpCircle, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { MiniGame } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface LiarsDiceMinigameProps {
    gameData: MiniGame;
    onPlayerAction: (action: { type: 'bid', quantity: number, value: number } | { type: 'challenge' }) => Promise<void>;
    isSubmitting: boolean;
    npcImageUrl?: string;
    npcImageHint?: string;
    hint: string | null;
    isGeneratingHint: boolean;
}

const DiceIcon = ({ value }: { value: number }) => {
    // As lucide-react doesn't have dice-1, dice-2 etc., we'll simulate them.
    return (
        <div className="h-8 w-8 rounded-md border-2 border-current flex items-center justify-center font-bold text-xl bg-background">
            {value}
        </div>
    );
};

const LiarsDiceTutorial = ({ children }: { children: React.ReactNode }) => (
    <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>How to Play Liar's Dice</DialogTitle>
                <DialogDescription>A game of deception and probability.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
                <p><strong>The Goal:</strong> Be the last player with dice remaining.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>Each player rolls 5 dice, keeping them hidden.</li>
                    <li>Players take turns bidding on the total number of a specific die face across *all* players' hands (e.g., "There are three 4s").</li>
                    <li><strong className="text-primary">Ones (1s) are wild</strong> and count as any number when counting totals.</li>
                    <li>Each new bid must be higher than the last (either more dice, or the same quantity of a higher value).</li>
                    <li>Instead of bidding, you can <strong className="text-destructive">challenge</strong> the previous bid if you think it's a lie.</li>
                    <li>If you challenge and are right (the bid was a lie), the bidder loses a die. If you're wrong, you lose a die.</li>
                </ul>
                <p>Good luck, and may the best bluffer win!</p>
            </div>
            <DialogTrigger asChild>
                <Button>Got It!</Button>
            </DialogTrigger>
        </DialogContent>
    </Dialog>
);


export default function LiarsDiceMinigame({ gameData, onPlayerAction, isSubmitting, npcImageUrl, npcImageHint, hint, isGeneratingHint }: LiarsDiceMinigameProps) {
    const [bidQuantity, setBidQuantity] = useState(1);
    const [bidValue, setBidValue] = useState(1);

    if (gameData.type !== 'liarsDice') return null;

    const { npcName, playerDice, npcDice, currentBid, turn, lastActionMessage, pot } = gameData.data;
    const isGameOver = gameData.status === 'won' || gameData.status === 'lost';
    const isPlayerTurn = turn === 'player' && !isGameOver;
    const totalDice = playerDice.length + npcDice.length;

    useEffect(() => {
        if (currentBid) {
            setBidQuantity(currentBid.quantity);
            setBidValue(currentBid.value);
        } else {
            setBidQuantity(1);
            setBidValue(1);
        }
    }, [currentBid]);

    const handleBid = () => {
        if (!isPlayerTurn || isSubmitting) return;
        onPlayerAction({ type: 'bid', quantity: bidQuantity, value: bidValue });
    };

    const handleChallenge = () => {
        if (!isPlayerTurn || isSubmitting || !currentBid) return;
        onPlayerAction({ type: 'challenge' });
    };

    const canBid = !currentBid || bidQuantity > currentBid.quantity || (bidQuantity === currentBid.quantity && bidValue > currentBid.value);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-50 p-4">
            <Card className="w-full max-w-lg flex flex-col h-full md:h-auto md:max-h-[95vh] relative">
                <div className="absolute top-4 right-4">
                    <LiarsDiceTutorial>
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><HelpCircle className="h-5 w-5"/></Button>
                    </LiarsDiceTutorial>
                </div>
                <CardHeader className="text-center flex-shrink-0">
                    <CardTitle>Liar's Dice against {npcName}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <CardDescription className="cursor-help">Pot: {pot} Gold | Total Dice: {totalDice}</CardDescription>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>The total number of dice on the table, including yours and the opponent's.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-around gap-4 text-center">
                    
                    {/* NPC Area */}
                    <div className={cn("space-y-2 flex flex-col items-center p-3 rounded-lg transition-all border", turn === 'npc' ? 'bg-primary/10 border-primary/20' : 'border-transparent')}>
                        <p className="text-sm font-semibold text-muted-foreground">Opponent's Hand</p>
                        <Avatar className={cn("h-16 w-16 border-4", turn === 'npc' ? 'border-primary' : 'border-muted')}>
                            {npcImageUrl ? <AvatarImage src={npcImageUrl} alt={npcName} /> : <AvatarFallback><Bot /></AvatarFallback>}
                        </Avatar>
                        <p className="font-semibold">{npcName}</p>
                        <TooltipProvider>
                        <div className="flex gap-2 bg-muted p-2 rounded-lg">
                            {Array.from({ length: npcDice.length }).map((_, i) => (
                                <Tooltip key={i}>
                                    <TooltipTrigger>
                                        <div className="h-10 w-10 flex items-center justify-center bg-background rounded border-dashed border-2">
                                            <HelpCircle className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>The opponent's dice are hidden.</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                        </TooltipProvider>
                    </div>
                    
                    {/* Game Info */}
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground italic h-10 flex items-center justify-center">"{lastActionMessage}"</div>
                        {currentBid && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="font-semibold flex items-center justify-center gap-2 cursor-help">Current Bid: {currentBid.quantity} x <DiceIcon value={currentBid.value} /></div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>The last bid made. You must bid higher or challenge.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                         {isGameOver && (
                            <div className={cn("p-2 rounded-lg text-center flex flex-col items-center gap-2 animate-in zoom-in-95", gameData.status === 'won' ? 'bg-green-100/20 text-green-700' : 'bg-red-100/20 text-red-700')}>
                                {gameData.status === 'won' ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                <p className="font-bold">{gameData.status === 'won' ? 'You Won!' : 'You Lost!'}</p>
                            </div>
                        )}
                         {(hint || isGeneratingHint) && isPlayerTurn && (
                             <div className="flex items-start gap-2 p-2 bg-blue-100/20 text-blue-800 rounded-lg text-left">
                                <Lightbulb className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5"/>
                                <div className="text-sm">
                                    <p className="font-bold">Advisor's Tip</p>
                                    {isGeneratingHint ? (
                                        <p className="italic">Thinking...</p>
                                    ) : (
                                        <p className="italic">{hint}</p>
                                    )}
                                </div>
                             </div>
                         )}
                    </div>
                    
                    {/* Player Area */}
                    <div className={cn("space-y-2 flex flex-col items-center p-3 rounded-lg transition-all border", isPlayerTurn ? 'bg-primary/10 border-primary/20' : 'border-transparent')}>
                        <TooltipProvider>
                        <div className="flex gap-2 bg-muted p-2 rounded-lg">
                            {playerDice.map((die, i) => (
                                <Tooltip key={i}>
                                    <TooltipTrigger>
                                        <div className="h-10 w-10 flex items-center justify-center bg-background rounded border">
                                            <DiceIcon value={die} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>This is one of your dice.</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                        </TooltipProvider>
                        <p className="font-semibold text-sm text-muted-foreground mt-2">Your Hand</p>
                    </div>

                </CardContent>
                
                 {/* Player Controls */}
                {!isGameOver && (
                <CardContent className="flex flex-col gap-4 flex-shrink-0">
                    {isPlayerTurn ? (
                        <>
                        <div className="flex items-center justify-center gap-4">
                            {/* Quantity */}
                            <TooltipProvider>
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setBidQuantity(q => Math.max(1, q - 1))}><Minus/></Button></TooltipTrigger>
                                    <TooltipContent><p>Decrease bid quantity</p></TooltipContent>
                                </Tooltip>
                                <span className="font-bold text-xl w-8 text-center">{bidQuantity}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setBidQuantity(q => q + 1)}><Plus/></Button></TooltipTrigger>
                                    <TooltipContent><p>Increase bid quantity</p></TooltipContent>
                                </Tooltip>
                            </div>
                            </TooltipProvider>
                            <span>x</span>
                            {/* Value */}
                             <TooltipProvider>
                             <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setBidValue(v => Math.max(1, v - 1))}><Minus/></Button></TooltipTrigger>
                                    <TooltipContent><p>Decrease die value</p></TooltipContent>
                                </Tooltip>
                                <DiceIcon value={bidValue} />
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setBidValue(v => Math.min(6, v + 1))}><Plus/></Button></TooltipTrigger>
                                    <TooltipContent><p>Increase die value</p></TooltipContent>
                                </Tooltip>
                            </div>
                            </TooltipProvider>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={handleBid} disabled={isSubmitting || !canBid} size="lg">
                                {isSubmitting && <Loader2 className="animate-spin mr-2"/>} Bid
                            </Button>
                            <Button onClick={handleChallenge} disabled={isSubmitting || !currentBid} size="lg" variant="destructive">
                                {isSubmitting && <Loader2 className="animate-spin mr-2"/>} Challenge
                            </Button>
                        </div>
                        </>
                    ) : (
                         <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
                            <Loader2 className="animate-spin h-5 w-5" />
                            <p>Waiting for {npcName}...</p>
                        </div>
                    )}
                </CardContent>
                )}
            </Card>
        </div>
    );
}
