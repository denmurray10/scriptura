
"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2, SendHorizontal, Mic, Sparkles, CornerDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Character, Story } from "@/types";
import { cn } from "@/lib/utils";
import { generateCharacterResponseAction, generateConversationStartersAction } from "@/lib/actions";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import BookLoader from "@/components/BookLoader";


interface InterviewEntry {
    type: 'question' | 'answer' | 'intro';
    content: string;
}

const choiceSchema = z.object({
  choice: z.string().min(5, "Your question should be at least 5 characters long.").max(200, "Your question is too long."),
});


export default function InterviewPage({ params }: { params: { characterId: string } }) {
    const { stories } = useStory();
    const router = useRouter();
    const characterId = params.characterId;

    const [character, setCharacter] = useState<Character | null>(null);
    const [story, setStory] = useState<Story | null>(null);
    const [interviewLog, setInterviewLog] = useState<InterviewEntry[]>([]);
    const [questionsAsked, setQuestionsAsked] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [answer, setAnswer] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

    const backgroundUrl = "https://firebasestorage.googleapis.com/v0/b/choicescraft-2af32.firebasestorage.app/o/dev-uploads%2Fb37f2280-8599-4bda-aec7-903a4803687a.webp?alt=media&token=b42dfa7e-15d0-4e83-8f50-5bab2ae0e324";


    const form = useForm<z.infer<typeof choiceSchema>>({
        resolver: zodResolver(choiceSchema),
        defaultValues: { choice: "" },
    });

    useEffect(() => {
        if (stories.length > 0 && characterId) {
            for (const s of stories) {
                const char = s.characters.find(c => c.id === characterId);
                if (char) {
                    setCharacter(char);
                    setStory(s);
                    setInterviewLog([{
                        type: 'intro',
                        content: `You are now in an interview with ${char.name}. You can ask up to 3 questions.`
                    }]);
                    break;
                }
            }
        }
    }, [stories, characterId]);

    useEffect(() => {
        if (character && story) {
            const fetchSuggestions = async () => {
                setIsGeneratingSuggestions(true);
                setSuggestions([]);
                setAnswer(null);
                setSelectedQuestion(null);
                
                try {
                    const result = await generateConversationStartersAction({
                        character: { name: character.name, traits: character.traits, backstory: character.backstory },
                        story: { title: story.name, plot: story.plot }
                    });
                    setSuggestions(result.starters);
                } catch (error) {
                    console.error("Failed to fetch suggestions:", error);
                } finally {
                    setIsGeneratingSuggestions(false);
                }
            };
            fetchSuggestions();
        }
    }, [character, story]);


    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [interviewLog]);

    const handleAskQuestion = async (values: z.infer<typeof choiceSchema>) => {
        if (isLoading || !character || !story || questionsAsked >= 3) return;

        const userQuestion: InterviewEntry = { type: 'question', content: values.choice };
        setInterviewLog(prev => [...prev, userQuestion]);
        form.reset();
        setIsLoading(true);
        setAnswer(null);
        setSelectedQuestion(values.choice);

        try {
            const result = await generateCharacterResponseAction({
                character: {
                    name: character.name,
                    traits: character.traits,
                    backstory: character.backstory,
                    sex: character.sex,
                    age: character.age,
                },
                story: {
                    title: story.name,
                    plot: story.plot,
                },
                chatHistory: [],
                userMessage: values.choice,
            });

            const modelAnswer: InterviewEntry = { type: 'answer', content: result.response };
            setInterviewLog(prev => [...prev, modelAnswer]);
            setQuestionsAsked(prev => prev + 1);
            setAnswer(result.response);

        } catch (error) {
            const errorContent = "I... I'm not sure how to answer that right now. (An error occurred)";
            const errorMessage: InterviewEntry = { type: 'answer', content: errorContent };
            setInterviewLog(prev => [...prev, errorMessage]);
            setAnswer(errorContent);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        form.setValue("choice", suggestion, { shouldValidate: true });
        handleAskQuestion({ choice: suggestion });
    };

    if (!character || !story) {
        return <BookLoader />;
    }
    
    const interviewFinished = questionsAsked >= 3;

    return (
        <div 
          className="relative flex flex-col h-[calc(100dvh-4rem)] bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
          data-ai-hint="interview room"
        >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm -z-10" />

            <header className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <Avatar>
                    <AvatarImage src={character.profileImageUrl} alt={character.name} />
                    <AvatarFallback>{character.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-xl font-bold font-headline">{character.name}</h1>
                    <p className="text-sm text-muted-foreground">In an interview</p>
                </div>
            </header>
            
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
                    {interviewLog.map((entry, index) => {
                        if (entry.type === 'intro') {
                            return <p key={index} className="text-center text-sm text-white/80 italic p-2 bg-black/20 rounded-md">{entry.content}</p>
                        }
                        if (entry.type === 'question') {
                             return (
                                <div key={index} className="flex items-start gap-3 justify-end">
                                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-none max-w-sm shadow-md">
                                        <p className="text-sm">{entry.content}</p>
                                    </div>
                                     <Avatar className="w-8 h-8">
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                </div>
                            )
                        }
                        return (
                             <Card key={index} className="bg-background/80 backdrop-blur-sm p-4 pt-8 shadow-lg relative">
                                <div className="absolute top-0 left-4 -translate-y-1/2 flex items-center gap-2 bg-background pr-4">
                                    <Avatar>
                                        <AvatarImage src={character.profileImageUrl} alt={character.name} />
                                        <AvatarFallback>{character.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-bold font-headline">{character.name}</p>
                                </div>
                                <CardContent className="p-0">
                                    <p className="text-sm leading-relaxed">{entry.content}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                     {isLoading && (
                        <Card className="bg-background/80 backdrop-blur-sm p-4 pt-8 shadow-lg relative">
                            <div className="absolute top-0 left-4 -translate-y-1/2 flex items-center gap-2 bg-background pr-4">
                                <Avatar>
                                    <AvatarImage src={character.profileImageUrl} alt={character.name} />
                                    <AvatarFallback>{character.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <p className="font-bold font-headline">{character.name}</p>
                            </div>
                            <CardContent className="p-0 flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm text-muted-foreground italic">Thinking...</span>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ScrollArea>

            <footer className="p-4 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                    {interviewFinished ? (
                         <div className="text-center space-y-2 p-4 rounded-lg bg-background/80 backdrop-blur-sm">
                            <p className="text-sm font-semibold">The interview has concluded. ({questionsAsked}/3 questions asked)</p>
                            <Button onClick={() => router.back()}>Back to Character Selection</Button>
                         </div>
                    ) : (
                        <div className="animate-in fade-in-50 duration-500">
                             <div className="mb-4">
                                {isGeneratingSuggestions ? (
                                    <div className="flex gap-2">
                                    <Skeleton className="h-10 w-1/3 rounded-lg bg-black/20" />
                                    <Skeleton className="h-10 w-1/3 rounded-lg bg-black/20" />
                                    <Skeleton className="h-10 w-1/3 rounded-lg bg-black/20" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {suggestions.map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="h-auto whitespace-normal py-1 px-3 text-left font-normal justify-start transition-all text-xs md:text-sm bg-black/20 text-white border-white/20 hover:bg-black/40 hover:text-white backdrop-blur-lg"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            disabled={isLoading || isGeneratingSuggestions}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
                                            <span>{suggestion}</span>
                                        </Button>
                                    ))}
                                    </div>
                                )}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-2 shadow-2xl backdrop-blur-lg">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleAskQuestion)} className="w-full">
                                    <FormField
                                        control={form.control}
                                        name="choice"
                                        render={({ field }) => (
                                        <FormItem>
                                            <div className="relative">
                                            <FormControl>
                                                <Textarea
                                                    placeholder={`Ask a question... (${questionsAsked}/3)`}
                                                    className="min-h-[40px] resize-none border-0 bg-transparent text-xs text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm max-h-[50dvh] no-scrollbar pr-12"
                                                    rows={1}
                                                    {...field}
                                                    onInput={(e) => {
                                                        field.onChange(e);
                                                        const textarea = e.currentTarget;
                                                        textarea.style.height = 'auto';
                                                        textarea.style.height = `${textarea.scrollHeight}px`;
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        form.handleSubmit(handleAskQuestion)();
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                    />
                                            </FormControl>
                                            <Button
                                                type="submit"
                                                disabled={isLoading || !form.formState.isValid}
                                                size="icon"
                                                variant="ghost"
                                                className="absolute bottom-1.5 right-2 h-8 w-8 text-primary hover:bg-transparent hover:text-primary/80"
                                            >
                                                {isLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                <SendHorizontal className="h-5 w-5" />
                                                )}
                                            </Button>
                                            </div>
                                            <FormMessage className="text-primary/80 pl-2" />
                                        </FormItem>
                                        )}
                                    />
                                    </form>
                                </Form>
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-xs text-white/70">
                                <CornerDownLeft className="h-3 w-3" /> Press Enter to submit, Shift+Enter for new line.
                            </p>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}
