

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Plus, Sparkles, ArrowLeft, ArrowRight, User, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Story, Character } from "@/types";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateCharacterDetailsAction, generateCharacterImagesAction, generateCharacterTraitsAction, generateCharacterFieldAction, generateCharacterAccessoriesAction } from "@/lib/actions";
import { storyStyles } from "@/lib/config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormItem, FormLabel, FormControl, FormMessage, FormField } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";


const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  sex: z.string({ required_error: "Please select a sex." }),
  age: z.string({ required_error: "Please select an age group." }),
  eyeColour: z.string({ required_error: "Please select an eye colour." }),
  hairColour: z.string({ required_error: "Please select a hair colour." }),
  traits: z.string()
    .min(1, "Please enter or select at least one trait.")
    .refine((val) => val.split(",").map(t => t.trim()).filter(Boolean).length <= 3, {
      message: "You can select a maximum of 3 traits.",
    }),
  backstory: z.string().min(20, "Backstory must be at least 20 characters.").refine(val => val.split('.').filter(Boolean).length === 4, { message: "Backstory must be exactly 4 sentences long."}),
  accessories: z.string().optional(),
});

type CharacterFormValues = z.infer<typeof characterSchema>;
const sexOptions = ["Male", "Female"];
const ageOptions = ["Young", "Teenager", "Adult", "Old"];
const hairColourOptions = ["Red", "White", "Blonde", "Brown", "Silver", "Black"];
const eyeColourOptions = ["Blue", "Green", "Brown", "Hazel", "Grey", "Amber"];


export default function SelectCoopCharacterPage() {
    const router = useRouter();
    const params = useParams();
    const storyId = params.storyId as string;
    const { getStoryById, currentUser, claimCharacterInCoop, createAndClaimCharacterInCoop } = useStory();
    const { toast } = useToast();

    const [story, setStory] = useState<Story | null>(null);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'select' | 'create'>('select');
    
    // States for character creation form
    const [step, setStep] = useState(1);
    const [generatingField, setGeneratingField] = useState<keyof CharacterFormValues | null>(null);

    // State for trait suggestions
    const [suggestedTraits, setSuggestedTraits] = useState<string[]>([]);
    const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set());
    const [isGeneratingTraits, setIsGeneratingTraits] = useState(false);
    
    // State for accessories
    const [suggestedAccessories, setSuggestedAccessories] = useState<string[]>([]);
    const [isGeneratingAccessories, setIsGeneratingAccessories] = useState(false);

    const form = useForm<CharacterFormValues>({
        resolver: zodResolver(characterSchema),
        defaultValues: { name: "", traits: "", backstory: "", sex: undefined, age: undefined, hairColour: undefined, eyeColour: undefined, accessories: "" },
    });
    
    useEffect(() => {
        const currentStory = getStoryById(storyId);
        setStory(currentStory);
        if (!currentStory) {
            toast({ variant: "destructive", title: "Story not found" });
            router.replace('/co-op');
        }
    }, [storyId, getStoryById, router, toast]);
    
    const traitsValue = form.watch('traits');
    useEffect(() => {
        if (traitsValue) {
        const traitsArray = traitsValue.split(',').map(t => t.trim()).filter(Boolean);
        setSelectedTraits(new Set(traitsArray));
        } else {
        setSelectedTraits(new Set());
        }
    }, [traitsValue]);
    
    useEffect(() => {
        if (mode === 'create') {
            if (step === 6 && suggestedTraits.length === 0) {
                fetchTraits();
            }
            if (step === 8 && suggestedAccessories.length === 0) {
                fetchAccessories();
            }
        }
    }, [step, mode]);

    const availableCharacters = useMemo(() => {
        if (!story) return [];
        const claimedCharacterIds = new Set(story.players?.map(p => p.characterId));
        return story.characters.filter(c => c.isPlayable && !claimedCharacterIds.has(c.id));
    }, [story]);
    
    const handleClaimCharacter = async () => {
        if (!selectedCharacterId) {
            toast({ variant: 'destructive', title: 'No character selected.' });
            return;
        }
        setIsLoading(true);
        const success = await claimCharacterInCoop(storyId, selectedCharacterId);
        if (success) {
            toast({ variant: 'success', title: 'Character Claimed!', description: 'Redirecting to lobby...'});
            router.push(`/co-op/${storyId}/lobby`);
        } else {
            setIsLoading(false);
        }
    };
    
    const fetchTraits = async () => {
        if (!story) return;
        setIsGeneratingTraits(true);
        try {
            const name = form.getValues('name');
            const result = await generateCharacterTraitsAction({
                genre: story.genre,
                ageRating: story.ageRating,
                name: name || undefined,
            });
            setSuggestedTraits(result.traits);
        } catch (error) {
            toast({ variant: "destructive", title: "AI Error", description: "Could not generate trait suggestions." });
        } finally {
            setIsGeneratingTraits(false);
        }
    };

    const fetchAccessories = async () => {
        if (!story) return;
        setIsGeneratingAccessories(true);
        try {
            const result = await generateCharacterAccessoriesAction({
                ...form.getValues(),
                genre: story.genre,
                ageRating: story.ageRating,
            });
            setSuggestedAccessories(result.accessories);
        } catch (error) {
            toast({ variant: "destructive", title: "AI Error", description: "Could not generate accessory suggestions." });
        } finally {
            setIsGeneratingAccessories(false);
        }
    };
    
    const handleTraitToggle = (trait: string) => {
        const newSelectedTraits = new Set(selectedTraits);
        if (newSelectedTraits.has(trait)) {
            newSelectedTraits.delete(trait);
        } else if (newSelectedTraits.size < 3) {
            newSelectedTraits.add(trait);
        } else {
            toast({
                variant: "destructive",
                title: "Trait Limit Reached",
                description: "You can select a maximum of 3 traits.",
            });
            return;
        }
        setSelectedTraits(newSelectedTraits);
        form.setValue('traits', Array.from(newSelectedTraits).join(', '), { shouldValidate: true });
    };

    const handleAiGenerateField = async (field: keyof CharacterFormValues) => {
        if (!story) return;
        setGeneratingField(field);
        try {
            const context = {
                ...form.getValues(),
                genre: story.genre,
                ageRating: story.ageRating,
                existingNames: story.characters.map(c => c.name),
            };
            const result = await generateCharacterFieldAction({ field, context });
            form.setValue(field, result.value, { shouldValidate: true });
        } catch (error) {
            toast({ variant: "destructive", title: "AI Error", description: `Could not generate ${field}.` });
        } finally {
            setGeneratingField(null);
        }
    };

    const handleCreateCharacter = async () => {
        if (!story) return;

        const isValid = await form.trigger();
        if (!isValid) {
            toast({ variant: 'destructive', title: 'Incomplete', description: 'Please fill out all character details.' });
            return;
        }

        setIsLoading(true);
        try {
            const values = form.getValues();
            const selectedStyle = storyStyles.find(s => s.value === story.style);
            
            const imageResult = await generateCharacterImagesAction({
                ...values,
                stylePrompt: selectedStyle?.characterPromptModifier || 'photorealistic',
                genre: story.genre,
            });

            const newCharacterData = {
                ...values,
                isPlayable: true,
                profileImageUrl: imageResult.profileImage.url,
                inGameImageUrl: imageResult.inGameImage.url,
                health: 100, money: 10, happiness: 75,
                level: 1, xp: 0, unspentStatPoints: 0,
                stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 },
            };
            
            const success = await createAndClaimCharacterInCoop(storyId, newCharacterData);
            if (success) {
                toast({ variant: 'success', title: 'Character Created & Claimed!', description: 'Redirecting to lobby...'});
                router.push(`/co-op/${storyId}/lobby`);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            const err = error as Error;
            toast({ variant: "destructive", title: "Creation Failed", description: err.message });
            setIsLoading(false);
        }
    };
    
    const handleNextStep = async () => {
        let fieldsToValidate: (keyof CharacterFormValues)[] = [];
        if (step === 1) fieldsToValidate = ["name"];
        if (step === 2) fieldsToValidate = ["sex"];
        if (step === 3) fieldsToValidate = ["age"];
        if (step === 4) fieldsToValidate = ["eyeColour"];
        if (step === 5) fieldsToValidate = ["hairColour"];
        if (step === 6) fieldsToValidate = ["traits"];
        if (step === 7) fieldsToValidate = ["backstory"];
        if (step === 8) fieldsToValidate = ["accessories"];
    
        const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
        
        const maxSteps = 9;
        if (isValid && step < maxSteps) {
          setStep(step + 1);
        } else if (isValid && step === maxSteps) {
            await handleCreateCharacter();
        }
    };

    if (!story) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading story...</p></div>;
    }

    const maxSteps = 9;

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center p-4">
            <Image src={story.coverUrl || 'https://placehold.co/1280x720.png'} alt="Story background" fill className="object-cover blur-md brightness-50" data-ai-hint="fantasy landscape" />
            <Card className="relative z-10 w-full max-w-4xl text-center">
                <Tabs value={mode} onValueChange={(value) => setMode(value as 'select' | 'create')} className="w-full">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-headline">Join the Adventure</CardTitle>
                        <CardDescription>Select an existing hero or create your own for "{story.name}".</CardDescription>
                        <TabsList className="grid w-full grid-cols-2 mt-4">
                            <TabsTrigger value="select">Select a Character</TabsTrigger>
                            <TabsTrigger value="create">Create a New Character</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="select">
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {availableCharacters.length > 0 ? (
                                    availableCharacters.map(char => (
                                        <div key={char.id} onClick={() => setSelectedCharacterId(char.id)} className={cn("relative cursor-pointer group p-2 rounded-lg border-2 transition-all", selectedCharacterId === char.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50")}>
                                            <Image src={char.profileImageUrl} alt={char.name} width={150} height={225} className="w-full h-auto aspect-[9/16] rounded-md shadow-md object-cover" data-ai-hint="character portrait" />
                                            <p className="mt-2 font-semibold truncate">{char.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{char.traits}</p>
                                            {selectedCharacterId === char.id && <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"><CheckCircle className="h-4 w-4"/></div>}
                                        </div>
                                    ))
                                ) : <p className="col-span-full text-muted-foreground py-8">All characters in this story have been claimed.</p>}
                            </div>
                            <div className="pt-4">
                                <Button onClick={handleClaimCharacter} disabled={!selectedCharacterId || isLoading} className="w-full" size="lg">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Claim Character & Join
                                </Button>
                            </div>
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="create">
                        <CardContent>
                           <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-4 min-h-[300px]">
                                {/* Wizard Steps */}
                                <div className={cn(step !== 1 && "hidden")}>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>What is your character's name?</FormLabel>
                                            <div className="relative flex items-center">
                                                <FormControl>
                                                <Input
                                                    placeholder="e.g., Kaelen"
                                                    {...field}
                                                    className="pr-10 text-xs md:text-sm"
                                                />
                                                </FormControl>
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-8 w-8" onClick={() => handleAiGenerateField("name")} disabled={!!generatingField}>
                                                    {generatingField === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                                </Button>
                                            </div>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                                <div className={cn(step !== 2 && "hidden")}><AiRadioGroupField fieldName="sex" label="What is their sex?" options={sexOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} /></div>
                                <div className={cn(step !== 3 && "hidden")}><AiRadioGroupField fieldName="age" label="What is their age group?" options={ageOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} /></div>
                                <div className={cn(step !== 4 && "hidden")}><AiRadioGroupField fieldName="eyeColour" label="What is their eye colour?" options={eyeColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} /></div>
                                <div className={cn(step !== 5 && "hidden")}><AiRadioGroupField fieldName="hairColour" label="What is their hair colour?" options={hairColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} /></div>
                                <div className={cn(step !== 6 && "hidden")}>
                                    <FormField control={form.control} name="traits" render={({ field }) => (<FormItem>
                                            <FormLabel>What are their key traits? (Max 3)</FormLabel>
                                            <div className="relative flex items-center">
                                                <FormControl><Input placeholder="e.g., Stoic, resourceful" {...field} className="pr-10" /></FormControl>
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-8 w-8" onClick={() => handleAiGenerateField("traits")} disabled={!!generatingField}>
                                                    {generatingField === "traits" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>)}
                                    />
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2"><p className="text-sm font-medium text-muted-foreground">Or, pick from these suggestions:</p>
                                            <Button type="button" variant="ghost" size="sm" onClick={fetchTraits} disabled={isGeneratingTraits}>
                                                {isGeneratingTraits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />} Refresh
                                            </Button>
                                        </div>
                                        {isGeneratingTraits && suggestedTraits.length === 0 ? (
                                            <div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}</div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2">{suggestedTraits.map(trait => (<Button key={trait} type="button" variant={selectedTraits.has(trait) ? "default" : "outline"} onClick={() => handleTraitToggle(trait)} className="truncate">{trait}</Button>))}</div>
                                        )}
                                    </div>
                                </div>
                                <div className={cn(step !== 7 && "hidden")}>
                                    <FormField control={form.control} name="backstory" render={({ field }) => (<FormItem>
                                        <FormLabel>What is their backstory?</FormLabel>
                                        <div className="relative">
                                            <FormControl><Textarea placeholder="e.g., A former royal guard..." {...field} className="pr-10 min-h-[120px]" /></FormControl>
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-1 h-8 w-8" onClick={() => handleAiGenerateField("backstory")} disabled={!!generatingField}>
                                                {generatingField === "backstory" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>)}
                                    />
                                </div>
                                <div className={cn(step !== 8 && "hidden")}>
                                    <FormField control={form.control} name="accessories" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Any distinct accessories? (Optional)</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2 pt-2">
                                                    {(isGeneratingAccessories && suggestedAccessories.length === 0 ? Array(9).fill(null) : suggestedAccessories).map((acc, i) => (
                                                        <FormItem key={acc || i}>
                                                            <FormControl>{acc ? (<RadioGroupItem value={acc} id={`acc-${i}`} className="peer sr-only" />) : (<Skeleton className="h-9 w-full rounded-md" />)}</FormControl>
                                                            {acc && (<Label htmlFor={`acc-${i}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 h-9 text-sm font-normal peer-data-[state=checked]:border-primary cursor-pointer truncate">{acc}</Label>)}
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>)}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button type="button" variant="ghost" size="sm" onClick={fetchAccessories} disabled={isGeneratingAccessories}>
                                            {isGeneratingAccessories ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />} Refresh suggestions
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className={cn(step !== 9 && "hidden")}>
                                    <p className="text-sm text-muted-foreground mb-4">Press the button below to use AI to generate your character's images and finalize their creation.</p>
                                    <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {step < maxSteps ? "Next" : (isLoading ? "Creating..." : "Create & Join")}
                                        {step < maxSteps ? <ArrowRight className="ml-2 h-4 w-4" /> : (isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />)}
                                    </Button>
                                </div>
                            </form>
                           </FormProvider>
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}


const AiRadioGroupField = ({ fieldName, label, options, form, onGenerate, disabled }: {
  fieldName: keyof CharacterFormValues;
  label: string;
  options: string[];
  form: any;
  onGenerate: (field: keyof CharacterFormValues) => void;
  disabled: boolean;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
      setIsGenerating(true);
      await onGenerate(fieldName);
      setIsGenerating(false);
  }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleGenerate}
              disabled={disabled || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              <span className="sr-only">Generate {label}</span>
            </Button>
          </div>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {options.map((option) => (
                <FormItem key={option}>
                  <FormControl>
                    <RadioGroupItem value={option} id={`${fieldName}-${option}`} className="peer sr-only" />
                  </FormControl>
                  <FormLabel
                    htmlFor={`${fieldName}-${option}`}
                    className={cn(
                      "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4",
                      "hover:bg-accent hover:text-accent-foreground",
                      "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                      "cursor-pointer transition-all"
                    )}
                  >
                    {option}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
