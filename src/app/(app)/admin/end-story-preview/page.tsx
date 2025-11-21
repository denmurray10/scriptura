
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Plus, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EndStoryPreviewPage() {
    const [rating, setRating] = useState(0);
    const [pollAnswer, setPollAnswer] = useState<'yes' | 'no' | null>(null);
    const router = useRouter();

    const bgUrl = 'https://placehold.co/1280x720.png'; // Placeholder background
    const storyName = "The Ashen Crown";
    const storyHistoryLength = 123;
    const feedbackGiven = rating > 0 && pollAnswer !== null;

    return (
        <div className="relative h-screen w-full overflow-hidden -m-4 md:-m-8">
            <Image
                src={bgUrl}
                alt={"Story scenario"}
                fill
                className="object-cover"
                data-ai-hint="fantasy landscape"
            />
            <div className="absolute inset-0 bg-black/60 z-10" />
            <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
                <Card className="w-full max-w-lg text-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-headline">The End</CardTitle>
                        <CardDescription>
                            Your adventure, "{storyName}", has concluded after {storyHistoryLength} choices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 pt-4">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Rate this story</p>
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "h-8 w-8 cursor-pointer transition-colors",
                                                rating >= star ? "text-primary fill-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                                            )}
                                            onClick={() => setRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Would you like a sequel to this story?</p>
                                <div className="flex flex-col items-center gap-2 mt-2">
                                    <Button variant={pollAnswer === 'yes' ? 'default' : 'outline'} onClick={() => setPollAnswer('yes')} className="w-full max-w-xs">Yes</Button>
                                    <Button variant={pollAnswer === 'no' ? 'default' : 'outline'} onClick={() => setPollAnswer('no')} className="w-full max-w-xs">No</Button>
                                </div>
                            </div>
                        </div>

                        {feedbackGiven && (
                             <div className="text-center p-4 bg-primary/10 rounded-lg animate-in fade-in-20">
                                <p className="font-semibold text-primary">Thank you for your feedback!</p>
                            </div>
                        )}

                        <Separator className="my-2" />
                        
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">What's next? Chat with the characters you met or begin a brand new journey.</p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => router.push('/speak')}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Speak with the Cast
                                </Button>
                                <Button onClick={() => router.push('/create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Adventure
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
