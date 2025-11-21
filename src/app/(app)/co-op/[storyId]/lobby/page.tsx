
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ClipboardCopy, ArrowRight, UserX, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Story, Player } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import BookLoader from "@/components/BookLoader";


export default function CoopLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  const { getStoryById, startStory, currentUser, removePlayerFromCoop } = useStory();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  useEffect(() => {
    const currentStory = getStoryById(storyId);
    setStory(currentStory);
    
    // We no longer redirect automatically if the story has started.
    // Instead, a "Continue" button will be shown.
    
    const userAsPlayer = currentStory?.players?.find(p => p.userId === currentUser?.uid);
    if (currentUser && currentStory && !userAsPlayer) {
        // This user is not yet a player, they need to select a character
        router.replace(`/co-op/${storyId}/select-character`);
    }

  }, [getStoryById, storyId, router, currentUser]);


  if (!story || !currentUser) {
    return <BookLoader />;
  }

  const handleCopyToClipboard = () => {
    if (!story.inviteCode) return;
    navigator.clipboard.writeText(story.inviteCode);
    toast({
      title: "Code Copied!",
      description: "Invite code has been copied to your clipboard.",
    });
  };

  const handleStartGame = async () => {
    await startStory();
    router.push(`/story-co-op`);
  };
  
  const handleRemoveSelf = async () => {
    if (!playerToRemove) return;
    const success = await removePlayerFromCoop(story.id, playerToRemove.userId);
    if (success) {
        toast({
            title: "You have left the lobby.",
        });
        router.push('/co-op');
    }
    setPlayerToRemove(null);
  };

  const isHost = story.authorId === currentUser?.uid;
  const isIdle = story.storyStatus === 'idle';
  const canStart = isHost && (story.players?.length ?? 0) > 1;

  return (
    <>
    <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Leave the Lobby?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to remove yourself from this co-op story? You can rejoin later if there is an open spot.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveSelf}>Leave</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <div className="relative flex h-screen w-full items-center justify-center p-4">
        <Image 
            src={story.coverUrl || 'https://placehold.co/1280x720.png'}
            alt="Story background"
            fill
            className="object-cover blur-md brightness-50"
            data-ai-hint="fantasy landscape"
        />
        <Card className="relative z-10 w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">{story.name}</CardTitle>
                <CardDescription>
                    {isIdle ? "Waiting for players to join the adventure." : "This adventure is in progress."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isIdle && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Share this code with your friends:</p>
                        <div className="flex w-full max-w-xs items-center space-x-2 mx-auto">
                            <div className="flex-1 text-2xl font-mono tracking-widest p-2 border rounded-md bg-muted">
                                {story.inviteCode}
                            </div>
                            <Button type="button" size="icon" variant="outline" onClick={handleCopyToClipboard}>
                                <ClipboardCopy className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-semibold">Players in Lobby ({story.players?.length || 0})</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {(story.players || []).map(player => {
                            const character = story.characters.find(c => c.id === player.characterId);
                            const isCurrentUser = player.userId === currentUser.uid;

                            return (
                                <div 
                                    key={player.userId}
                                    className={cn(
                                        "flex flex-col items-center gap-2 group",
                                        isCurrentUser && "cursor-pointer"
                                    )}
                                    onClick={isCurrentUser ? () => setPlayerToRemove(player) : undefined}
                                >
                                    <Avatar className="h-12 w-12 relative">
                                        <AvatarImage src={player.photoURL} alt={player.displayName} />
                                        <AvatarFallback>{player.displayName?.charAt(0)}</AvatarFallback>
                                        {isCurrentUser && (
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <UserX className="h-6 w-6"/>
                                            </div>
                                        )}
                                    </Avatar>
                                    <div className="text-sm text-center">
                                        <p className="font-semibold">{player.displayName}</p>
                                        <p className="text-xs text-muted-foreground">as {character?.name}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
                {isIdle ? (
                    isHost ? (
                        <div className="pt-4">
                            <Button onClick={handleStartGame} disabled={!canStart} className="w-full">
                               {canStart ? 'Start Adventure' : 'Waiting for more players...'}
                               <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    ) : (
                         <div className="pt-4 flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            Waiting for the host to start the game...
                         </div>
                    )
                ) : (
                    <div className="pt-4">
                        <Button onClick={() => router.push('/story-co-op')} className="w-full">
                           <Play className="mr-2 h-4 w-4"/> Continue Adventure
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
    </>
  );
}
