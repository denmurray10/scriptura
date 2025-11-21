

"use client";

import { useStory } from "@/contexts/StoryContext";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, GalleryHorizontal, BookPlus, Bot, UploadCloud, Shield, Lock, ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const LockedCard = ({ title, description, requiredPlan, isLocked, reason }: { title: string, description: string, requiredPlan: string, isLocked: boolean, reason?: string }) => {
  const router = useRouter();
  
  const handleCardClick = () => {
    if (isLocked) {
      router.push('/profile');
    }
  };

  return (
    <div onClick={handleCardClick} className={cn("block", isLocked && "cursor-pointer")}>
        <Card className="hover:border-primary transition-colors h-full p-6 bg-muted/30">
            <div className="flex items-start gap-4">
                <Lock className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                    <CardTitle className="text-xl flex items-center justify-between">
                      {title}
                      <span className="text-sm font-medium text-primary flex items-center gap-1">
                        {reason ? reason : `Upgrade`} <ArrowRight className="h-4 w-4"/>
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2">
                        {description} Requires <span className="font-semibold text-primary">{requiredPlan}</span> plan.
                    </CardDescription>
                </div>
            </div>
        </Card>
    </div>
  );
};


export default function CreatePage() {
  const { activeStory, membershipPlan, monthlyCreations, creationLimit } = useStory();

  const creationDisabled = !activeStory;
  
  const canSeeAiGenerator = ['Explorer', 'Sculptor', 'Admin'].includes(membershipPlan);
  const canSeeManualCreator = ['Sculptor', 'Admin'].includes(membershipPlan);
  const canSeeAdminTools = membershipPlan === 'Admin';
  const canSpeakWithCast = ['Explorer', 'Sculptor', 'Admin'].includes(membershipPlan);
  
  const hasReachedCreationLimit = monthlyCreations >= creationLimit;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Create</h1>
        <p className="text-muted-foreground">What would you like to build today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* --- Story Creation Options --- */}
        
        {/* Manual Story Creator */}
        {hasReachedCreationLimit ? (
          <LockedCard
              title="Create a New Story"
              description="You have reached your monthly story creation limit. Upgrade your plan to create more."
              requiredPlan="Higher Tier"
              isLocked={true}
              reason="Limit Reached"
            />
        ) : canSeeManualCreator ? (
            <Link href="/create-story" className="block">
              <Card className="hover:border-primary transition-colors h-full p-6">
                  <div className="flex items-start gap-4">
                      <BookPlus className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                          <CardTitle className="text-xl">Create a New Story</CardTitle>
                          <CardDescription className="mt-2">
                              Start a new adventure. Define its world, genre, and two primary scenes in a step-by-step guide.
                          </CardDescription>
                      </div>
                  </div>
              </Card>
            </Link>
        ) : (
            <LockedCard
              title="Create a New Story"
              description="Start a new adventure. Define its world, genre, and two primary scenes in a step-by-step guide."
              requiredPlan="Sculptor"
              isLocked={true}
            />
        )}
        
        {/* AI Story Generator */}
        {hasReachedCreationLimit ? (
            <LockedCard
              title="AI Story Generator"
              description="You have reached your monthly story creation limit. Upgrade your plan to create more."
              requiredPlan="Higher Tier"
              isLocked={true}
              reason="Limit Reached"
            />
        ) : canSeeAiGenerator ? (
          <Link href="/create-ai-story" className="block">
            <Card className="hover:border-primary transition-colors h-full p-6">
                <div className="flex items-start gap-4">
                    <Bot className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <CardTitle className="text-xl">AI Story Generator</CardTitle>
                        <CardDescription className="mt-2">
                            Choose a genre and let the AI create an entire story for you with one click.
                        </CardDescription>
                    </div>
                </div>
            </Card>
          </Link>
        ) : (
           <LockedCard
              title="AI Story Generator"
              description="Choose a genre and let the AI create an entire story for you with one click."
              requiredPlan="Explorer"
              isLocked={true}
            />
        )}
        
        {/* Speak with the Cast */}
        {canSpeakWithCast ? (
            <Link href="/speak" className="block">
              <Card className="hover:border-primary transition-colors h-full p-6">
                  <div className="flex items-start gap-4">
                      <MessageSquare className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                          <CardTitle className="text-xl">Speak with the Cast</CardTitle>
                          <CardDescription className="mt-2">
                              Have a 1-on-1 conversation with any character from your stories.
                          </CardDescription>
                      </div>
                  </div>
              </Card>
            </Link>
        ) : (
            <LockedCard
              title="Speak with the Cast"
              description="Have a 1-on-1 conversation with any character from your stories."
              requiredPlan="Explorer"
              isLocked={true}
            />
        )}

        {/* Admin and Dev Tools (only visible to Admin) */}
        {canSeeAdminTools && (
          <>
            <Link href={creationDisabled ? "#" : "/characters"} aria-disabled={creationDisabled} className={cn("block", creationDisabled && "pointer-events-none opacity-60")}>
              <Card className={cn("transition-colors h-full p-6", creationDisabled ? "bg-muted/30" : "hover:border-primary")}>
                 <div className="flex items-start gap-4">
                      <Users className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                          <CardTitle className="text-xl">Add Characters</CardTitle>
                          <CardDescription className="mt-2">
                              Design the cast for your active story. {creationDisabled && <span className="font-medium text-destructive">(Requires an active story)</span>}
                          </CardDescription>
                      </div>
                  </div>
              </Card>
            </Link>
            
            <Link href={creationDisabled ? "#" : "/scenes"} aria-disabled={creationDisabled} className={cn("block", creationDisabled && "pointer-events-none opacity-60")}>
             <Card className={cn("transition-colors h-full p-6", creationDisabled ? "bg-muted/30" : "hover:border-primary")}>
                 <div className="flex items-start gap-4">
                      <GalleryHorizontal className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                          <CardTitle className="text-xl">Manage Scenes</CardTitle>
                          <CardDescription className="mt-2">
                             View and manage the scenes for your story. {creationDisabled && <span className="font-medium text-destructive">(Requires an active story)</span>}
                          </CardDescription>
                      </div>
                  </div>
              </Card>
            </Link>
            <Link href="/admin" className="block">
                <Card className="hover:border-primary transition-colors h-full p-6">
                    <div className="flex items-start gap-4">
                        <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                        <div>
                            <CardTitle className="text-xl">Admin Panel</CardTitle>
                            <CardDescription className="mt-2">
                                Access administrator tools and application stats.
                            </CardDescription>
                        </div>
                    </div>
                </Card>
            </Link>
            <Link href="/upload" className="block">
              <Card className="hover:border-primary transition-colors h-full p-6">
                  <div className="flex items-start gap-4">
                      <UploadCloud className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                          <CardTitle className="text-xl">Dev Image Upload</CardTitle>
                          <CardDescription className="mt-2">
                              Temporary utility to upload an image and get a public URL for development purposes.
                          </CardDescription>
                      </div>
                  </div>
              </Card>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
