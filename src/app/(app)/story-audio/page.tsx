
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useStory } from "@/contexts/StoryContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mic, Loader2, ArrowLeft, Play, Pause, FastForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BookLoader from "@/components/BookLoader";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { generateSpeechAction, generateStorySuggestionsAction } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";

interface AudioTranscript {
    source: 'narrator' | 'user';
    text: string;
}

export default function StoryAudioPage() {
    const { 
        activeStory,
        activeCharacter,
        currentScenario, 
        isLoading: isStoryLoading, 
        scenes,
        currentSceneIndex,
        makeChoice,
        startStory,
        storyHistory,
        tokens,
        consumeToken,
    } = useStory();
    const router = useRouter();
    const { toast } = useToast();
    
    const [transcript, setTranscript] = useState<AudioTranscript[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [userSpokenText, setUserSpokenText] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null); // SpeechRecognition instance
    const lastNarratedText = useRef<string | null>(null);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setUserSpokenText("");
            recognitionRef.current.start();
        }
    }, [isListening]);
    
    const playNarration = useCallback(async (text: string) => {
        if (!text || lastNarratedText.current === text && audioRef.current?.src) return;
        lastNarratedText.current = text;
        
        setIsThinking(true);
        try {
            const { audioUrl } = await generateSpeechAction({ text });
            setTranscript(prev => {
                const newTranscript = [...prev];
                if (newTranscript.length === 0 || newTranscript[newTranscript.length - 1].text !== text) {
                   newTranscript.push({ source: 'narrator', text });
                }
                return newTranscript;
            });
            
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            }
        } catch (error) {
            const err = error as Error;
            toast({ variant: 'destructive', title: "Text-to-Speech Failed", description: err.message });
        } finally {
            setIsThinking(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (!isStoryLoading && !activeStory) {
            router.replace('/dashboard');
        } else if (activeStory?.storyStatus === 'idle') {
            startStory();
        }
    }, [isStoryLoading, activeStory, router, startStory]);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;

                recognitionRef.current.onresult = (event: any) => {
                    let interimTranscript = "";
                    let finalTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    setUserSpokenText(finalTranscript || interimTranscript);

                    if (finalTranscript) {
                        setTranscript(prev => [...prev, { source: 'user', text: finalTranscript }]);
                        makeChoice(finalTranscript);
                    }
                };
                
                recognitionRef.current.onstart = () => setIsListening(true);
                recognitionRef.current.onend = () => setIsListening(false);
                
                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (event.error !== 'no-speech') {
                      toast({ variant: 'destructive', title: "Voice Error", description: `Could not understand audio: ${event.error}` });
                    }
                };
            } else {
                toast({ variant: 'destructive', title: "Unsupported Browser", description: "Speech recognition is not supported by your browser."});
            }

            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.onplay = () => setIsSpeaking(true);
                audioRef.current.onpause = () => setIsSpeaking(false);
                audioRef.current.onended = () => {
                    setIsSpeaking(false);
                    startListening();
                };
            }
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

    }, [toast, startListening, makeChoice]);
    
    useEffect(() => {
        const narrateTurn = async () => {
            if (!currentScenario?.description || !activeCharacter || !activeStory) return;

            if (lastNarratedText.current === currentScenario.description) return;

            setIsGeneratingSuggestions(true);
            setSuggestions([]);
            
            let suggestionText = "";
            try {
                const result = await generateStorySuggestionsAction({
                    character: activeCharacter,
                    storyState: activeStory,
                });
                setSuggestions(result.suggestions);
                suggestionText = `What should ${activeCharacter.name} do next? Should they "${result.suggestions[0]}" or "${result.suggestions[1]}"? Or do you have another idea?`;
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
                suggestionText = `What does ${activeCharacter.name} do now?`;
            } finally {
                setIsGeneratingSuggestions(false);
            }
            
            const fullNarrationScript = `${currentScenario.description}\n\n${suggestionText}`;
            playNarration(fullNarrationScript);
        };
        
        if (currentScenario?.description) {
            narrateTurn();
        } else if (activeStory && storyHistory.length === 0) {
            playNarration(activeStory.plot);
        }

    }, [currentScenario, playNarration, activeCharacter, activeStory, storyHistory]);


    const bgUrl = scenes?.[currentSceneIndex]?.url || 'https://placehold.co/1024x576.png';
    
    if (!activeStory || isStoryLoading || !activeCharacter) {
        return <BookLoader />;
    }

    const handleMicClick = () => {
        if (isThinking) return;

        if (isListening) {
            recognitionRef.current?.stop();
        } else if (isSpeaking && audioRef.current) {
            audioRef.current.pause();
        } else if (!isSpeaking && audioRef.current?.src && audioRef.current.paused) {
             audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        } else {
            startListening();
        }
    };

    const handleSkipClick = () => {
        if (isSpeaking && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset audio
        }
        if (isListening) {
            recognitionRef.current?.stop();
        }
        
        startListening();
    };
    
    const handleSuggestionClick = async (suggestion: string) => {
        const isFirstTurn = storyHistory.length === 0;

        if (!isFirstTurn && (tokens ?? 0) < 1) {
            toast({
                variant: "destructive",
                title: "Out of Tokens",
                description: "You need a token to use a suggestion. They regenerate hourly.",
            });
            return;
        }

        if (!isFirstTurn) {
            const consumed = await consumeToken();
            if (!consumed) {
              toast({
                variant: "destructive",
                title: "Token Error",
                description: "Failed to use a token. Please try again.",
              });
              return;
            }
        }
        setTranscript(prev => [...prev, { source: 'user', text: suggestion }]);
        await makeChoice(suggestion);
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <Image
                src={bgUrl}
                alt={currentScenario?.description || "Story background"}
                fill
                className="object-cover"
                data-ai-hint="fantasy landscape"
            />
            <div className="absolute inset-0 bg-black/60 z-10" />

            <div className="relative z-20 flex flex-col h-full p-4 md:p-6 text-white">
                <header className="flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/20 hover:bg-black/40">
                        <ArrowLeft />
                    </Button>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-full max-w-2xl space-y-4">
                        <h1 className="text-2xl md:text-4xl font-headline font-bold drop-shadow-lg">
                           {currentScenario?.interactingNpcName || activeStory.name}
                        </h1>
                        <div className="text-base md:text-lg text-white/90 leading-relaxed min-h-[6em] drop-shadow-md">
                            <p className="whitespace-pre-wrap">{transcript.filter(t => t.source === 'narrator').slice(-1)[0]?.text}</p>
                        </div>
                    </div>
                </main>

                <footer className="flex-shrink-0 flex flex-col items-center gap-4">
                    <div className="w-full max-w-2xl space-y-2">
                        {!isListening && !isSpeaking && (
                             <div className="mb-4 animate-in fade-in-50">
                                {isGeneratingSuggestions ? (
                                    <div className="flex justify-center gap-2">
                                        <Skeleton className="h-10 w-1/2 rounded-lg bg-black/20" />
                                        <Skeleton className="h-10 w-1/2 rounded-lg bg-black/20" />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {suggestions.map((suggestion, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-auto whitespace-normal rounded-lg border-white/30 bg-black/20 backdrop-blur-sm py-1 px-3 text-left font-normal text-white hover:bg-black/40 text-xs md:text-sm justify-start transition-all",
                                                    (tokens ?? 0) < 1 && storyHistory.length > 0 && "blur-sm text-transparent select-none"
                                                )}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                disabled={isThinking || isGeneratingSuggestions}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
                                                <span>{suggestion}</span>
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-4">
                            <Button 
                                size="icon" 
                                onClick={handleMicClick}
                                className={cn(
                                    "w-24 h-24 rounded-full bg-primary/80 backdrop-blur-sm border-2 border-primary-foreground/50 shadow-lg hover:bg-primary transition-all duration-300",
                                    isListening && "scale-110 bg-destructive animate-pulse"
                                )}
                                disabled={isThinking}
                            >
                                {isThinking ? <Loader2 className="h-10 w-10 animate-spin" /> 
                                : isSpeaking ? <Pause className="h-10 w-10" />
                                : isListening ? <Mic className="h-10 w-10" />
                                : <Play className="h-10 w-10" />}
                            </Button>
                            {(isSpeaking || !isListening) && (
                                <Button 
                                    size="icon" 
                                    variant="outline"
                                    onClick={handleSkipClick}
                                    className={cn(
                                        "w-16 h-16 rounded-full bg-black/20 text-white backdrop-blur-sm border-white/30 shadow-lg hover:bg-black/40 transition-all duration-300"
                                    )}
                                    disabled={isThinking}
                                >
                                    <FastForward className="h-8 w-8" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="w-full max-w-xl">
                        <Textarea
                            placeholder="Your transcribed response will appear here..."
                            value={userSpokenText}
                            readOnly
                            className="min-h-[40px] text-center resize-none rounded-lg border-white/20 bg-black/20 backdrop-blur-sm text-sm text-white placeholder:text-white/60 focus-visible:ring-0"
                            rows={1}
                        />
                    </div>
                </footer>
            </div>
        </div>
    );
}
