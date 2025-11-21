

"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Heart, HeartCrack, Users, History, Info, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Character, StoryHistoryEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { analyzeCharacterCompatibilityAction } from "@/lib/actions";
import BookLoader from "@/components/BookLoader";

const RelationshipVisualizer = () => {
    const { activeStory } = useStory();
    const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyCharacters, setHistoryCharacters] = useState<{ char1: Character; char2: Character } | null>(null);
    const [compatibilityAnalysis, setCompatibilityAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);


    const characters = useMemo(() => activeStory?.characters || [], [activeStory]);
    
    const handleCharacterClick = useCallback((char: Character, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCharacters(prev => {
            const isAlreadySelected = prev.some(c => c.id === char.id);
            if (isAlreadySelected) {
                return prev.filter(c => c.id !== char.id);
            }
            if (prev.length < 2) {
                return [...prev, char];
            }
            // If 2 are already selected, replace the last one with the new one
            return [prev[0], char];
        });
    }, []);
    
    useEffect(() => {
        const fetchAnalysis = async () => {
            if (selectedCharacters.length === 2) {
                setIsAnalysisModalOpen(true);
                setIsAnalyzing(true);
                setCompatibilityAnalysis(null);
                try {
                    const [char1, char2] = selectedCharacters;
                    const result = await analyzeCharacterCompatibilityAction({
                        character1: { name: char1.name, traits: char1.traits, backstory: char1.backstory },
                        character2: { name: char2.name, traits: char2.traits, backstory: char2.backstory },
                    });
                    setCompatibilityAnalysis(result.analysis);
                } catch (error) {
                    console.error("Failed to analyze compatibility", error);
                    setCompatibilityAnalysis("Could not analyze compatibility at this time.");
                } finally {
                    setIsAnalyzing(false);
                }
            } else {
                setCompatibilityAnalysis(null);
                setIsAnalysisModalOpen(false);
            }
        };
        fetchAnalysis();
    }, [selectedCharacters]);


    if (characters.length < 2) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <p>Not enough characters to visualize relationships.</p>
            </div>
        );
    }

    const radius = 250; 
    const center = { x: 300, y: 300 };
    const angleStep = (2 * Math.PI) / characters.length;

    const positions = characters.map((char, index) => ({
        id: char.id,
        name: char.name,
        image: char.profileImageUrl,
        traits: char.traits,
        x: center.x + radius * Math.cos(angleStep * index - Math.PI / 2),
        y: center.y + radius * Math.sin(angleStep * index - Math.PI / 2),
    }));

    const getRelationship = (char1Id: string, char2Id: string) => {
        const char1 = characters.find(c => c.id === char1Id);
        return char1?.relationships?.find(r => r.targetCharacterId === char2Id);
    };

    const getLineStyle = (value: number) => {
        const sentiment = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
        const opacity = Math.min(0.15 + Math.abs(value) / 100 * 0.85, 1);
        const thickness = 1 + Math.abs(value) / 100 * 5;

        switch(sentiment) {
            case 'positive': return { stroke: `rgba(34, 197, 94, ${opacity})`, strokeWidth: thickness };
            case 'negative': return { stroke: `rgba(239, 68, 68, ${opacity})`, strokeWidth: thickness }; 
            default: return { stroke: `rgba(107, 114, 128, ${opacity})`, strokeWidth: 1 };
        }
    };
    
    const relationshipPairs = characters.flatMap((char1, i) =>
        characters.slice(i + 1).map(char2 => {
            const rel1to2 = getRelationship(char1.id, char2.id);
            return { char1, char2, rel1to2 };
        })
    );
    
    const selectedCharIds = selectedCharacters.map(c => c.id);

    const handleLineClick = (char1: Character, char2: Character) => {
        setHistoryCharacters({ char1, char2 });
        setHistoryModalOpen(true);
    };

    const relevantHistory = useMemo(() => {
        if (!historyCharacters) return [];
        const { char1, char2 } = historyCharacters;
        return (activeStory?.storyHistory || []).filter(entry => 
            entry.relationshipChanges?.some(change => 
                (entry.characterId === char1.id && change.characterId === char2.id) ||
                (entry.characterId === char2.id && change.characterId === char1.id)
            )
        ).reverse();
    }, [historyCharacters, activeStory?.storyHistory]);


    return (
        <div className="w-full flex-1 flex items-center justify-center p-4 relative overflow-hidden" onClick={() => setSelectedCharacters([])}>
            <svg viewBox="0 0 600 600" className="w-full h-full max-w-2xl max-h-full aspect-square overflow-visible">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <style>{`
                        @keyframes pulse-glow {
                            0%, 100% { filter: url(#glow) drop-shadow(0 0 3px var(--glow-color)); }
                            50% { filter: url(#glow) drop-shadow(0 0 8px var(--glow-color)); }
                        }
                    `}</style>
                </defs>
                
                <g>
                    {relationshipPairs.map(({ char1, char2, rel1to2 }) => {
                        const pos1 = positions.find(p => p.id === char1.id)!;
                        const pos2 = positions.find(p => p.id === char2.id)!;
                        const value = rel1to2?.value ?? 0;
                        const style = getLineStyle(value);
                        const isSelectedConnection = selectedCharIds.length > 0 && (selectedCharIds.includes(char1.id) || selectedCharIds.includes(char2.id));
                        const isCritical = Math.abs(value) >= 80;
                        const midPoint = { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 };

                        return (
                            <g key={`${char1.id}-${char2.id}`} className="group/line" onClick={(e) => { e.stopPropagation(); handleLineClick(char1, char2); }}>
                                <line
                                    x1={pos1.x} y1={pos1.y}
                                    x2={pos2.x} y2={pos2.y}
                                    style={{
                                        ...style,
                                        '--glow-color': style.stroke,
                                        opacity: selectedCharIds.length > 0 && !isSelectedConnection ? 0.1 : style.stroke.match(/rgba\\([^,]+,[^,]+,[^,]+,([^)]+)\\)/)?.[1] || 1,
                                        animation: isCritical && selectedCharIds.length === 0 ? 'pulse-glow 3s infinite ease-in-out' : 'none'
                                    } as React.CSSProperties}
                                    className="transition-all duration-300 cursor-pointer"
                                />
                                <circle
                                    cx={midPoint.x}
                                    cy={midPoint.y}
                                    r="8"
                                    className="fill-transparent group-hover/line:fill-primary/50 transition-colors"
                                />
                            </g>
                        );
                    })}
                </g>

                {positions.map(pos => {
                    const isSelected = selectedCharIds.includes(pos.id);
                    const char = characters.find(c => c.id === pos.id)!;
                    return (
                    <g 
                        key={pos.id} 
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer"
                        onClick={(e) => handleCharacterClick(char, e)}
                    >
                       <foreignObject x="-32" y="-48" width="64" height="96" className="overflow-visible">
                         <div className={cn(
                            "w-16 h-24 rounded-md overflow-hidden border-4 border-background shadow-lg group transition-all duration-300",
                            isSelected ? 'scale-110 border-primary' : 'hover:scale-105 hover:border-primary/50'
                         )}>
                            <Image src={pos.image} alt={pos.name} width={64} height={96} className="object-cover w-full h-full" />
                         </div>
                       </foreignObject>
                    </g>
                )})}
            </svg>
            <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Relationship History</DialogTitle>
                        <DialogDescription>
                            Key moments between {historyCharacters?.char1.name} and {historyCharacters?.char2.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-96 -mx-6 px-6">
                        <div className="space-y-4 pr-1">
                            {relevantHistory.length > 0 ? relevantHistory.map((entry, index) => {
                                const relChange = entry.relationshipChanges!.find(rc => 
                                    (entry.characterId === historyCharacters!.char1.id && rc.characterId === historyCharacters!.char2.id) ||
                                    (entry.characterId === historyCharacters!.char2.id && rc.characterId === historyCharacters!.char1.id)
                                )!;
                                const isPositive = relChange.change > 0;
                                return (
                                <div key={index} className="text-sm">
                                    <p className="italic text-muted-foreground">"{entry.choice}"</p>
                                    <div className={cn(
                                        "flex items-center gap-2 mt-1",
                                        isPositive ? "text-green-600" : "text-red-600"
                                    )}>
                                        {isPositive ? <Heart className="h-4 w-4"/> : <HeartCrack className="h-4 w-4"/>}
                                        <span className="font-semibold">{isPositive ? '+' : ''}{relChange.change}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(entry.timestamp!), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            )}) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Info className="mx-auto h-8 w-8 mb-2"/>
                                    <p>No significant recorded interactions yet.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

             <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compatibility Analysis</DialogTitle>
                         {selectedCharacters.length === 2 && (
                             <DialogDescription>
                                An AI-powered analysis of {selectedCharacters[0].name} and {selectedCharacters[1].name}.
                            </DialogDescription>
                         )}
                    </DialogHeader>
                     <div className="py-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="flex-1 text-sm">
                                {isAnalyzing && <p className="italic text-muted-foreground">Analyzing compatibility...</p>}
                                {compatibilityAnalysis && <p>{compatibilityAnalysis}</p>}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};


export default function RelationshipPage() {
    const { activeStory } = useStory();
    const router = useRouter();

    if (!activeStory) {
        return <BookLoader />;
    }

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
             <header className="flex-shrink-0 p-4 bg-background border-b z-10 flex flex-col items-center justify-center">
                <h1 className="text-lg font-bold text-foreground font-headline">
                    Relationships
                </h1>
                <p className="text-sm text-muted-foreground">A visual web of character connections.</p>
             </header>
            <RelationshipVisualizer />
            <footer className="flex-shrink-0 p-4 z-10 bg-background border-t">
                <Button 
                    onClick={() => router.back()}
                    className="w-full"
                    variant="default"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Story
                </Button>
            </footer>
        </div>
    );
}
