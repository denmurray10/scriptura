

"use client";

import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Edit, Shield, User, BookCopy, Users, BarChart3, Bookmark, Coins, Loader2, Camera, Award, Book, Swords, Sparkles as SparklesIcon, PlusCircle } from "lucide-react";
import Link from "next/link";
import { AnimateInView } from "@/components/AnimateInView";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import AdSense from "@/components/AdSense";

// New Achievement Types
type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
interface Achievement {
  name: string;
  description: string;
  icon: React.ElementType;
  tier: AchievementTier;
}

const mockAchievements: Achievement[] = [
  { name: 'First Steps', description: 'Completed your first story chapter.', icon: Book, tier: 'Bronze' },
  { name: 'Character Creator', description: 'Designed your first character.', icon: User, tier: 'Bronze' },
  { name: 'Storyteller', description: 'Created a new story from scratch.', icon: BookCopy, tier: 'Silver' },
  { name: 'Socialite', description: 'Forged a "Beloved" relationship with a character.', icon: Users, tier: 'Silver' },
  { name: 'Master of Fate', description: 'Reached the end of a full story.', icon: Award, tier: 'Gold' },
  { name: 'AI Collaborator', description: 'Used 50 AI suggestions to guide your story.', icon: SparklesIcon, tier: 'Gold' },
  { name: 'Legendary Author', description: 'Created 5 different stories.', icon: Award, tier: 'Platinum' },
  { name: 'Epic Journey', description: 'Made over 100 choices in a single story.', icon: Swords, tier: 'Platinum' },
];

const tierStyles: Record<AchievementTier, string> = {
  Bronze: "border-amber-700/50 hover:border-amber-700/80 bg-amber-700/5",
  Silver: "border-slate-400/50 hover:border-slate-400/80 bg-slate-400/5",
  Gold: "border-yellow-500/50 hover:border-yellow-500/80 bg-yellow-500/5",
  Platinum: "border-cyan-400/50 hover:border-cyan-400/80 bg-cyan-400/5",
};

const tierIconStyles: Record<AchievementTier, string> = {
  Bronze: "text-amber-700",
  Silver: "text-slate-400",
  Gold: "text-yellow-500",
  Platinum: "text-cyan-400",
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    return (
        <Card className={cn("transition-all", tierStyles[achievement.tier])}>
            <CardContent className="p-4 flex items-center gap-4">
                <achievement.icon className={cn("h-8 w-8 flex-shrink-0", tierIconStyles[achievement.tier])} />
                <div>
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
            </CardContent>
        </Card>
    );
};


export default function ProfilePage() {
    const { 
        signOutUser, 
        membershipPlan, 
        setMembershipPlan, 
        currentUser, 
        stories, 
        tokens, 
        bookmarks,
        updateUserProfile,
        displayPlan,
        isAdminMode,
        toggleAdminMode,
        monthlyCreations,
        creationLimit,
        aboutMe,
    } = useStory();
    const { toast } = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newAboutMe, setNewAboutMe] = useState("");

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setNewDisplayName(currentUser.displayName || "");
            setNewEmail(currentUser.email || "");
            setNewAboutMe(aboutMe || "");
        }
    }, [currentUser, aboutMe, isEditModalOpen]);

    const planLevels = {
        'Free': 0,
        'Explorer': 1,
        'Sculptor': 2,
        'Admin': 3,
    };

    const currentPlanLevel = planLevels[displayPlan];

    const plans = [
        {
            name: "Free",
            price: "£0",
            description: "Experience interactive storytelling with AI-driven narration.",
            features: [
                "1 Book Creation /mo",
                "Narrator Mode Only",
                "Basic Visual Styles",
                "Standard AI Model",
            ],
            level: 0,
            action: () => setMembershipPlan('Free'),
        },
        {
            name: "Explorer",
            price: "£6.99",
            description: "For avid storytellers who want to create and share their own sagas.",
            features: [
                "5 Public Book Creations/mo",
                "Full Immersive RPG Mode",
                "All Visual Styles & HD Images",
                "Objective Rewards Unlocked",
                "Priority AI Access",
            ],
            level: 1,
            isPopular: true,
            action: () => setMembershipPlan('Explorer'),
        },
        {
            name: "Sculptor",
            price: "£11.99",
            description: "For the ultimate creator who wants unlimited potential and control.",
            features: [
                "10 Public Book Creations/mo",
                "Create Collections/Series",
                "Full Immersive RPG Mode",
                "Advanced AI Model",
                "Early Access to Features",
            ],
            level: 2,
            action: () => setMembershipPlan('Sculptor'),
        }
    ];

    const userName = currentUser?.displayName || "User";
    const userEmail = currentUser?.email || "user@example.com";
    const userAvatar = currentUser?.photoURL;
    const avatarFallback = userName.charAt(0).toUpperCase();
    
    // Calculate stats
    const totalStories = stories.length;
    const totalCharacters = stories.reduce((acc, story) => acc + (story.characters?.length || 0), 0);
    const totalChoices = stories.reduce((acc, story) => acc + (story.storyHistory?.length || 0), 0);
    const genreCounts = stories.reduce((acc, story) => {
        acc[story.genre] = (acc[story.genre] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostFrequentGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, 'None');

    const handleProfileUpdate = async () => {
        if (newDisplayName.trim().length < 2) {
            toast({
                variant: "destructive",
                title: "Invalid Name",
                description: "Display name must be at least 2 characters.",
            });
            return;
        }
        setIsUpdatingProfile(true);
        try {
            const profileData: { displayName: string; email?: string; aboutMe?: string; } = {
              displayName: newDisplayName.trim(),
              aboutMe: newAboutMe.trim(),
            };
            if (newEmail.trim() && newEmail.trim() !== currentUser?.email) {
                profileData.email = newEmail.trim();
            }

            await updateUserProfile(profileData);
            
            toast({
                title: "Profile Updated!",
                description: "Your profile details have been changed.",
            });
            setIsEditModalOpen(false);
        } catch (error) {
            const err = error as Error;
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: err.message,
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const originalDataUrl = reader.result as string;
                const compressedDataUrl = await compressImage(originalDataUrl, { quality: 0.8, maxWidth: 256, maxHeight: 256 });
                await updateUserProfile({ photoURL: compressedDataUrl });
                toast({ variant: "success", title: "Avatar Updated!", description: "Your new profile picture has been saved."});
            };
        } catch (error) {
            const err = error as Error;
            toast({ variant: "destructive", title: "Upload Failed", description: err.message });
        } finally {
            setIsUploadingPhoto(false);
        }
    };


    return (
        <AnimateInView tag="div" className="space-y-8 max-w-5xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground">Manage your account, subscription, and preferences.</p>
            </div>
            
            <Card className="overflow-hidden">
                <div className="bg-muted/30 p-6 flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative group flex-shrink-0">
                        <Avatar className="w-20 h-20 border">
                            <AvatarImage src={userAvatar || undefined} data-ai-hint="user avatar" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <button
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                        >
                            {isUploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <span className="sr-only">Upload new photo</span>
                        </button>
                        <input
                            type="file"
                            ref={photoInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold font-headline">{userName}</h2>
                            {membershipPlan === 'Admin' && <Badge variant="destructive">Admin</Badge>}
                        </div>
                        <p className="text-muted-foreground">{userEmail}</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                            <h4 className="font-semibold text-foreground">About Me</h4>
                            <p className="mt-1">{aboutMe || "You haven't written a bio yet. Click 'Edit Profile' to add one."}</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Profile</DialogTitle>
                                    <DialogDescription>
                                        Update your account details.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input 
                                            id="displayName" 
                                            value={newDisplayName}
                                            onChange={(e) => setNewDisplayName(e.target.value)}
                                            placeholder="Your display name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aboutMe">About Me</Label>
                                        <Textarea 
                                            id="aboutMe" 
                                            value={newAboutMe}
                                            onChange={(e) => setNewAboutMe(e.target.value)}
                                            placeholder="Tell us a little about yourself..."
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
                                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" onClick={signOutUser}>Sign Out</Button>
                    </div>
                </div>
                {membershipPlan === 'Admin' && (
                    <div className="p-4 bg-muted/50 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <Label htmlFor="admin-mode-switch" className="font-semibold">Admin Mode</Label>
                        </div>
                        <Switch
                            id="admin-mode-switch"
                            checked={isAdminMode}
                            onCheckedChange={toggleAdminMode}
                        />
                    </div>
                )}
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>My Stats</CardTitle>
                        <CardDescription>An overview of your creative journey.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <BookCopy className="h-5 w-5 text-primary" />
                                <span className="font-medium">Total Stories</span>
                            </div>
                            <span className="font-bold text-lg">{totalStories}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-primary" />
                                <span className="font-medium">Total Characters</span>
                            </div>
                            <span className="font-bold text-lg">{totalCharacters}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <span className="font-medium">Total Choices Made</span>
                            </div>
                            <span className="font-bold text-lg">{totalChoices}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <span className="font-medium">Favorite Genre</span>
                            </div>
                            <Badge variant="outline">{mostFrequentGenre}</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>My Resources</CardTitle>
                        <CardDescription>Your currently available tokens and creations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Coins className="h-5 w-5 text-primary" />
                                <span className="font-medium">Tokens</span>
                            </div>
                            <span className="font-bold text-lg">{tokens}</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-3">Tokens are used for AI suggestions and actions. They regenerate hourly.</p>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <PlusCircle className="h-5 w-5 text-primary" />
                                <span className="font-medium">Book Creations</span>
                            </div>
                            <span className="font-bold text-lg">{creationLimit - monthlyCreations} / {creationLimit}</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-3">Your monthly limit for creating new stories from scratch.</p>

                         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Bookmark className="h-5 w-5 text-primary" />
                                <span className="font-medium">Bookmarks</span>
                            </div>
                            <span className="font-bold text-lg">{bookmarks} / 3</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-3">Bookmarks are used to start new chapters. They regenerate hourly.</p>

                    </CardContent>
                </Card>
            </div>

            {/* {displayPlan === 'Free' && (
                <>
                <Separator />
                <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_BANNER_AD_SLOT!} />
                </>
            )} */}

            <Separator />

            <section>
                <h2 className="text-3xl font-bold text-center mb-4 font-headline">Achievement Showcase</h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                    A collection of your milestones and notable accomplishments throughout your storytelling adventures.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mockAchievements.map(ach => (
                        <AchievementCard key={ach.name} achievement={ach} />
                    ))}
                </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-3xl font-bold text-center mb-4 font-headline">Choose Your Plan</h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                Unlock more creative power with our membership tiers. Choose the plan that's right for your storytelling journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                {plans.map((plan) => {
                  const isCurrent = plan.level === currentPlanLevel;
                  const buttonText = isCurrent
                    ? "Your Current Plan"
                    : plan.level > currentPlanLevel
                    ? `Upgrade to ${plan.name}`
                    : `Downgrade to ${plan.name}`;
                    
                  return (
                    <Card
                      key={plan.name}
                      className={cn(
                          "flex flex-col relative border-2 p-1",
                          isCurrent ? "border-primary" : "border-transparent",
                          plan.isPopular ? "bg-primary/5 text-foreground" : "bg-muted/30"
                      )}
                    >
                      {plan.isPopular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}

                      <div className={cn("flex-grow p-6", plan.isPopular && "bg-card")}>
                          <CardHeader className="text-center p-0 pb-6">
                              <CardTitle className="text-2xl">{plan.name}</CardTitle>
                              <CardDescription className="pt-2">{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                              <div className="text-center mb-6">
                                  <span className="text-4xl font-bold">{plan.price}</span>
                                  <span className="text-lg font-normal text-muted-foreground">/mo</span>
                              </div>
                              <ul className="space-y-4 text-sm">
                                  {plan.features.map(feature => (
                                  <li key={feature} className="flex items-center gap-3">
                                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                      <span className="text-muted-foreground">{feature}</span>
                                  </li>
                                  ))}
                              </ul>
                          </CardContent>
                      </div>
                      <div className={cn("p-6 pt-0", plan.isPopular && "bg-card")}>
                          <Button 
                              onClick={plan.action} 
                              variant={isCurrent ? "default" : plan.isPopular ? "default" : "outline"} 
                              className="w-full"
                              disabled={isCurrent}
                              size="lg"
                          >
                              {buttonText}
                          </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
        </AnimateInView>
    );
}
