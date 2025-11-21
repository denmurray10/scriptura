

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  generateStoryFieldAction,
  generateScenePromptAction,
  generateScenarioVisualAction,
  generateCharacterDetailsAction,
  generateCharacterImagesAction,
  recruitNewCharacterAction,
  generateTwoScenesFromPlotAction,
  generateCharacterTraitsAction,
  generateCharacterAccessoriesAction,
  generateCharacterFieldAction,
  generateStoryCoverAction
} from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Bot, Image as ImageIcon, Loader2, Sparkles, Lock, Globe, UserPlus, Users, ClipboardCopy, UploadCloud, Video } from "lucide-react";
import { cn, formatBytes, compressImage, getBase64Size } from "@/lib/utils";
import type { Character, Scene } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { storyStyles, genreOptions } from "@/lib/config";
import { AnimateInView } from "@/components/AnimateInView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const storySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  genre: z.string().min(1, "Please select at least one genre."),
  ageRating: z.string().min(1, "Please select an age rating."),
  language: z.enum(['UK English', 'US English']).default('US English'),
  plot: z.string().min(10, "Plot summary must be at least 10 characters."),
  isPublic: z.boolean().default(true),
});

type StoryFormValues = z.infer<typeof storySchema>;

const sceneSchema = z.object({
    name: z.string().min(2, "Scene name must be at least 2 characters."),
    prompt: z.string().min(10, "Prompt must be at least 10 characters."),
});

type SceneFormValues = z.infer<typeof sceneSchema>;

const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  sex: z.string({ required_error: "Please select a sex." }).min(1, "Please select a sex."),
  age: z.string({ required_error: "Please select an age group." }).min(1, "Please select an age group."),
  eyeColour: z.string({ required_error: "Please select an eye colour." }).min(1, "Please select an eye colour."),
  hairColour: z.string({ required_error: "Please select a hair colour." }).min(1, "Please select an hair colour."),
  traits: z.string()
    .min(1, "Please enter or select at least one trait.")
    .refine((val) => val.split(",").map(t => t.trim()).filter(Boolean).length <= 3, {
      message: "You can select a maximum of 3 traits.",
    }),
  backstory: z.string().min(20, "Backstory must be at least 20 characters."),
  accessories: z.string().optional(),
});

type CharacterFormValues = z.infer<typeof characterSchema>;

type GeneratingState = "prompt" | "visual" | null;
const sexOptions = ["Male", "Female"];
const ageOptions = ["Young", "Teenager", "Adult", "Old"];
const hairColourOptions = ["Red", "White", "Blonde", "Brown", "Silver", "Black"];
const eyeColourOptions = ["Blue", "Green", "Brown", "Hazel", "Grey", "Amber"];


// Sub-component for generating a scene
function SceneGenerator({ form, scene, generating, onGeneratePrompt, onGenerateVisual }: {
    form: any,
    scene: Partial<Scene>,
    generating: GeneratingState,
    onGeneratePrompt: () => void,
    onGenerateVisual: () => void,
}) {
    return (
        <div className="grid md:grid-cols-2 gap-6 items-start">
            <FormProvider {...form}>
                <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scene Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., The Royal Vault" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="prompt" render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Generation Prompt</FormLabel>
                            <div className="relative">
                                <FormControl><Textarea placeholder="A dusty library filled with ancient tomes..." {...field} className="pr-10" /></FormControl>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-1 h-8 w-8" onClick={onGeneratePrompt} disabled={generating === 'prompt'}>
                                    {generating === 'prompt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </FormProvider>
            <div className="space-y-4">
                <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    {generating === 'visual' && <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p>Generating...</p></div>}
                    {scene.url ? 
                        <Image src={scene.url} alt={scene.name || "Generated Scene"} fill className="object-cover" data-ai-hint="fantasy landscape" /> 
                        : <ImageIcon className="h-12 w-12 text-muted-foreground" />}
                </div>
                <Button onClick={onGenerateVisual} className="w-full" disabled={!!generating}>
                    {generating === 'visual' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate Visual
                </Button>
            </div>
        </div>
    );
}

// Sub-component for Character Creator step
const CharacterCreatorWizard = ({ form, onGenerateImages, isGeneratingImages, character, onFinish }: {
    form: any;
    onGenerateImages: () => Promise<void>;
    isGeneratingImages: boolean;
    character: Character | null;
    onFinish: () => void;
}) => {
    const [step, setStep] = useState(1);
    const [generatingField, setGeneratingField] = useState<keyof CharacterFormValues | null>(null);
    const [suggestedTraits, setSuggestedTraits] = useState<string[]>([]);
    const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set());
    const [isGeneratingTraits, setIsGeneratingTraits] = useState(false);
    const [suggestedAccessories, setSuggestedAccessories] = useState<string[]>([]);
    const [isGeneratingAccessories, setIsGeneratingAccessories] = useState(false);
    const { activeStory } = useStory();
    const { toast } = useToast();

    const traitsValue = form.watch('traits');
    useEffect(() => {
        if (traitsValue) {
            const traitsArray = traitsValue.split(',').map(t => t.trim()).filter(Boolean);
            setSelectedTraits(new Set(traitsArray));
        } else {
            setSelectedTraits(new Set());
        }
    }, [traitsValue]);

    const fetchTraits = async () => {
        if (!activeStory) return;
        setIsGeneratingTraits(true);
        try {
            const name = form.getValues('name');
            const result = await generateCharacterTraitsAction({
                genre: activeStory.genre,
                ageRating: activeStory.ageRating,
                name: name || undefined,
            });
            setSuggestedTraits(result.traits);
        } catch (error) {
            toast({ variant: "destructive", title: "AI Generation Failed", description: "Could not generate trait suggestions." });
        } finally {
            setIsGeneratingTraits(false);
        }
    };
    
    const fetchAccessories = async () => {
        if (!activeStory) return;
        setIsGeneratingAccessories(true);
        try {
            const result = await generateCharacterAccessoriesAction({
                ...form.getValues(),
                genre: activeStory.genre,
                ageRating: activeStory.ageRating,
            });
            setSuggestedAccessories(result.accessories);
        } catch (error) {
            toast({ variant: "destructive", title: "AI Generation Failed", description: "Could not generate accessory suggestions." });
        } finally {
            setIsGeneratingAccessories(false);
        }
    };
    
    useEffect(() => {
        if (step === 6 && suggestedTraits.length === 0) fetchTraits();
        if (step === 8 && suggestedAccessories.length === 0) fetchAccessories();
    }, [step]);
    
    const handleTraitToggle = (trait: string) => {
        const newSelectedTraits = new Set(selectedTraits);
        if (newSelectedTraits.has(trait)) {
            newSelectedTraits.delete(trait);
        } else {
            if (newSelectedTraits.size >= 3) {
                toast({ variant: "destructive", title: "Trait Limit Reached", description: "You can select a maximum of 3 traits." });
                return;
            }
            newSelectedTraits.add(trait);
        }
        setSelectedTraits(newSelectedTraits);
        form.setValue('traits', Array.from(newSelectedTraits).join(', '), { shouldValidate: true });
    };

    const handleAiGenerateField = async (field: keyof CharacterFormValues) => {
        if (!activeStory) return;
        setGeneratingField(field);
        try {
            const context = {
                ...form.getValues(),
                genre: activeStory.genre,
                ageRating: activeStory.ageRating,
            };
            const result = await generateCharacterFieldAction({ field, context });
            form.setValue(field, result.value, { shouldValidate: true });
        } catch (error) {
            toast({ variant: "destructive", title: "AI Generation Failed", description: `There was a problem generating a ${field}.` });
        } finally {
            setGeneratingField(null);
        }
    };

    const handleNextStep = async () => {
        const maxSteps = 9;
        let fieldsToValidate: (keyof CharacterFormValues)[] = [];
        if (step === 1) fieldsToValidate = ["name"];
        if (step === 2) fieldsToValidate = ["sex"];
        if (step === 3) fieldsToValidate = ["age"];
        if (step === 4) fieldsToValidate = ["eyeColour"];
        if (step === 5) fieldsToValidate = ["hairColour"];
        if (step === 6) fieldsToValidate = ["traits"];
        if (step === 7) fieldsToValidate = ["backstory"];
        if (step === 8) fieldsToValidate = ["accessories"];
        
        const isValid = await form.trigger(fieldsToValidate);
        
        if (isValid && step < maxSteps) {
            setStep(prev => prev + 1);
        } else if (isValid && step === maxSteps) {
            await onGenerateImages();
            onFinish();
        }
    };
    
    if (character) {
        return (
            <div className="text-center flex flex-col items-center gap-4">
                <h3 className="text-xl font-bold font-headline">Character Ready!</h3>
                <Image src={character.profileImageUrl} alt={character.name} width={128} height={192} className="rounded-lg object-cover shadow-lg" data-ai-hint="character portrait"/>
                <p className="text-2xl font-bold">{character.name}</p>
                <p className="text-muted-foreground">{character.traits}</p>
            </div>
        )
    }

    const maxSteps = 9;

    return (
        <FormProvider {...form}>
            <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">Step {step} of {maxSteps}</p>
                {step === 1 && (
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>What is the character's name?</FormLabel><div className="relative flex items-center">
                            <FormControl><Input placeholder="e.g., Kaelen" {...field} className="pr-10" /></FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-8 w-8" onClick={() => handleAiGenerateField("name")} disabled={!!generatingField}>
                                {generatingField === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                        </div><FormMessage /></FormItem>
                    )} />
                )}
                {step === 2 && <AiRadioGroupField fieldName="sex" label="What is their sex?" options={sexOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />}
                {step === 3 && <AiRadioGroupField fieldName="age" label="What is their age group?" options={ageOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />}
                {step === 4 && <AiRadioGroupField fieldName="eyeColour" label="What is their eye colour?" options={eyeColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />}
                {step === 5 && <AiRadioGroupField fieldName="hairColour" label="What is their hair colour?" options={hairColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />}
                {step === 6 && (<>
                    <FormField control={form.control} name="traits" render={({ field }) => (
                        <FormItem><FormLabel>What are their key traits? (Max 3)</FormLabel><div className="relative flex items-center">
                            <FormControl><Input placeholder="e.g., Stoic, resourceful" {...field} className="pr-10" /></FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-8 w-8" onClick={() => handleAiGenerateField("traits")} disabled={!!generatingField}>
                                {generatingField === "traits" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                        </div><FormMessage /></FormItem>
                    )} />
                    <div className="mt-4"><div className="flex justify-between items-center mb-2"><p className="text-sm font-medium text-muted-foreground">Or, pick from these suggestions:</p><Button type="button" variant="ghost" size="sm" onClick={fetchTraits} disabled={isGeneratingTraits}>{isGeneratingTraits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}Refresh</Button></div>
                    {isGeneratingTraits && suggestedTraits.length === 0 ? <div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}</div> : <div className="grid grid-cols-3 gap-2">{suggestedTraits.map(trait => <Button key={trait} type="button" variant={selectedTraits.has(trait) ? "default" : "outline"} onClick={() => handleTraitToggle(trait)} className="truncate">{trait}</Button>)}</div>}
                    </div>
                </>)}
                {step === 7 && (
                    <FormField control={form.control} name="backstory" render={({ field }) => (
                        <FormItem><FormLabel>What is their backstory?</FormLabel><div className="relative">
                            <FormControl><Textarea placeholder="e.g., A former royal guard..." {...field} className="pr-10 min-h-[120px]" /></FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-1 h-8 w-8" onClick={() => handleAiGenerateField("backstory")} disabled={!!generatingField}>
                                {generatingField === "backstory" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                        </div><FormMessage /></FormItem>
                    )} />
                )}
                {step === 8 && (<>
                    <FormField control={form.control} name="accessories" render={({ field }) => (
                        <FormItem><FormLabel>Any distinct accessories? (Optional)</FormLabel><FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2 pt-2">
                                {(isGeneratingAccessories && suggestedAccessories.length === 0 ? Array(9).fill(null) : suggestedAccessories).map((acc, i) => <FormItem key={acc || i}><FormControl>{acc ? <RadioGroupItem value={acc} id={`${field.name}-${i}`} className="peer sr-only" /> : <Skeleton className="h-9 w-full rounded-md" />}</FormControl>{acc && <Label htmlFor={`${field.name}-${i}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 h-9 text-sm font-normal peer-data-[state=checked]:border-primary cursor-pointer truncate">{acc}</Label>}</FormItem>)}
                            </RadioGroup>
                        </FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="flex justify-end mt-2"><Button type="button" variant="ghost" size="sm" onClick={fetchAccessories} disabled={isGeneratingAccessories}>{isGeneratingAccessories ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}Refresh suggestions</Button></div>
                </>)}
                {step === 9 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                        <p className="text-sm text-center text-muted-foreground">Final step! Click the button below to generate your character's images and complete their creation.</p>
                    </div>
                )}
                
                <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <Button type="button" onClick={handleNextStep} disabled={isGeneratingImages}>{step < maxSteps ? "Next" : "Generate Character"}{step < maxSteps ? <ArrowRight className="ml-2 h-4 w-4" /> : isGeneratingImages ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4" />}</Button>
                </div>
            </div>
        </FormProvider>
    );
};

export default function CreateStoryPage() {
  const { createStory, stories, displayPlan, currentUser, setActiveStoryId, membershipPlan } = useStory();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  const [generatingField, setGeneratingField] = useState<'name' | 'plot' | 'cover' | null>(null);

  const [scene1, setScene1] = useState<Partial<Scene>>({});
  const [scene2, setScene2] = useState<Partial<Scene>>({});
  
  const [generatingScene1, setGeneratingScene1] = useState<GeneratingState>(null);
  const [generatingScene2, setGeneratingScene2] = useState<GeneratingState>(null);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  const [mainCharacter, setMainCharacter] = useState<Character | null>(null);
  const [isGeneratingCharImages, setIsGeneratingCharImages] = useState(false);
  
  const [characterMode, setCharacterMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingCharId, setSelectedExistingCharId] = useState<string | null>(null);
  
  const isCoopMode = searchParams.get('co-op') === 'true';
  const isAdmin = membershipPlan === 'Admin';
  
  const [character2, setCharacter2] = useState<Character | null>(null);
  const [isGeneratingChar2Images, setIsGeneratingChar2Images] = useState(false);
  
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverVideoUrl, setCoverVideoUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCoopMode && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only admins can create co-op stories.",
      });
      router.replace('/create');
    }
  }, [isCoopMode, isAdmin, router, toast]);

  const storyForm = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: { name: "", genre: "Fantasy", ageRating: "14+", language: "US English", plot: "", isPublic: true },
    mode: "onChange",
  });
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([storyForm.getValues('genre')]);
  
  const scene1Form = useForm<SceneFormValues>({ resolver: zodResolver(sceneSchema), defaultValues: { name: "", prompt: "" } });
  const scene2Form = useForm<SceneFormValues>({ resolver: zodResolver(sceneSchema), defaultValues: { name: "", prompt: "" } });
  
  const character1Form = useForm<CharacterFormValues>({ resolver: zodResolver(characterSchema), defaultValues: { name: "", sex: "", age: "", eyeColour: "", hairColour: "", traits: "", backstory: "", accessories: "" }, mode: "onChange" });
  const character2Form = useForm<CharacterFormValues>({ resolver: zodResolver(characterSchema), defaultValues: { name: "", sex: "", age: "", eyeColour: "", hairColour: "", traits: "", backstory: "", accessories: "" }, mode: "onChange" });
  
  const userCharacters = useMemo(() => {
    if (!currentUser) return [];
    const userCreatedStories = stories.filter(s => s.authorId === currentUser.uid);
    const allCharacters = userCreatedStories.flatMap(s => s.characters.filter(c => c.isPlayable));
    const uniqueCharacters = Array.from(new Map(allCharacters.map(c => [c.id, c])).values());
    return uniqueCharacters;
  }, [stories, currentUser]);

  useEffect(() => {
      if (characterMode === 'existing' && selectedExistingCharId) {
          const char = userCharacters.find(c => c.id === selectedExistingCharId);
          if (char) {
              setMainCharacter(char);
          }
      } else if (characterMode === 'new') {
          setMainCharacter(null);
      }
  }, [characterMode, selectedExistingCharId, userCharacters]);


  const handleGenreToggle = (genre: string) => {
    const newSelectedGenres = [...selectedGenres];
    const index = newSelectedGenres.indexOf(genre);

    if (index > -1) {
        newSelectedGenres.splice(index, 1);
    } else {
        if (newSelectedGenres.length >= 2) {
            toast({
                variant: "destructive",
                title: "Genre Limit Reached",
                description: "You can select a maximum of 2 genres.",
            });
            return;
        }
        newSelectedGenres.push(genre);
    }
    
    setSelectedGenres(newSelectedGenres);
    storyForm.setValue('genre', newSelectedGenres.join(' / '), { shouldValidate: true });
  };


  const handleAiGenerateField = async (field: 'name' | 'plot') => {
    setGeneratingField(field);
    try {
      const formValues = storyForm.getValues();
      const existingNames = stories.map(s => s.name);
      const result = await generateStoryFieldAction({
        field,
        context: {
          ...formValues,
          existingNames,
        },
      });
      storyForm.setValue(field, result.value, { shouldValidate: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: `There was a problem generating a ${field}.`,
      });
    } finally {
      setGeneratingField(null);
    }
  };

  const handleGenerateScenePrompt = async (sceneIndex: 1 | 2) => {
    const form = sceneIndex === 1 ? scene1Form : scene2Form;
    const setGenerating = sceneIndex === 1 ? setGeneratingScene1 : setGeneratingScene2;
    const storyGenre = storyForm.getValues('genre');
    
    const name = form.getValues('name');
    if (!name) {
        toast({ variant: 'destructive', title: 'Scene Name Required', description: 'Please enter a name for the scene first.' });
        return; 
    }
    
    setGenerating("prompt");
    try {
        const result = await generateScenePromptAction({ name, genre: storyGenre });
        form.setValue('prompt', result.prompt, { shouldValidate: true });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Prompt Generation Failed' });
    } finally {
        setGenerating(null);
    }
  };
  
  const handleGenerateSceneVisual = async (sceneIndex: 1 | 2) => {
    const form = sceneIndex === 1 ? scene1Form : scene2Form;
    const setScene = sceneIndex === 1 ? setScene1 : setScene2;
    const setGenerating = sceneIndex === 1 ? setGeneratingScene1 : setGeneratingScene2;
    const storyStyle = 'photo';
    const selectedStyle = storyStyles.find(s => s.value === storyStyle);
    
    const valid = await form.trigger();
    if (!valid || !selectedStyle) return;
    
    setGenerating("visual");
    try {
        const { name, prompt } = form.getValues();
        const fullPrompt = `${selectedStyle.scenePromptModifier}, ${prompt}`;
        const { url } = await generateScenarioVisualAction({ scenarioDescription: fullPrompt });

        setScene({ id: crypto.randomUUID(), name, prompt, url, style: storyStyle });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Visual Generation Failed', description: errorMessage });
    } finally {
        setGenerating(null);
    }
  };
  
  const handleGenerateCharacterImages = async (characterNumber: 1 | 2) => {
    const form = characterNumber === 1 ? character1Form : character2Form;
    const setIsGenerating = characterNumber === 1 ? setIsGeneratingCharImages : setIsGeneratingChar2Images;
    const setCharacter = characterNumber === 1 ? setMainCharacter : setCharacter2;

    const isValid = await form.trigger();
    if (!isValid) return;

    setIsGenerating(true);
    try {
        const values = form.getValues();
        const storyDetails = storyForm.getValues();
        const selectedStyle = storyStyles.find(s => s.value === 'photo');
        if (!selectedStyle) throw new Error("Invalid style");

        const imageResult = await generateCharacterImagesAction({
            ...values,
            stylePrompt: selectedStyle.characterPromptModifier,
            genre: storyDetails.genre,
            accessories: values.accessories,
        });
        
        const defaultStats = {
          health: 100,
          money: 10,
          happiness: 75,
          items: [],
        };

        const newCharacter: Character = {
            id: crypto.randomUUID(),
            ...values,
            isPlayable: true,
            profileImageUrl: imageResult.profileImage.url,
            inGameImageUrl: imageResult.inGameImage.url,
            profileImageSize: imageResult.profileImage.newSize,
            inGameImageSize: imageResult.inGameImage.newSize,
            health: defaultStats.health,
            money: defaultStats.money,
            happiness: defaultStats.happiness,
            items: defaultStats.items,
            skills: [],
            relationships: [],
            level: 1,
            xp: 0,
            stats: { intellect: 5, charisma: 5, wits: 5, willpower: 5 },
            unspentStatPoints: 0,
            defaultStats: { ...defaultStats },
            currentScenario: null,
        };
        setCharacter(newCharacter);
        toast({ title: "Character Generated!", description: `${newCharacter.name} is ready.` });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: "destructive", title: "Image Generation Failed", description: errorMessage });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingField("cover");
    try {
        const { name, genre, plot } = storyForm.getValues();
        const selectedStyle = storyStyles.find(s => s.value === 'photo')!;
        const result = await generateStoryCoverAction({ title: name, genre, plot, stylePrompt: selectedStyle.characterPromptModifier });
        setCoverImageUrl(result.coverUrl);
        setCoverVideoUrl(null); // Clear video when generating image
    } catch (error) {
        const err = error as Error;
        toast({ variant: "destructive", title: "Cover Generation Failed", description: err.message });
    } finally {
        setGeneratingField(null);
    }
  };
  
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB limit for uploads
        toast({ variant: "destructive", title: "File too large", description: "Please upload a file smaller than 20MB." });
        return;
    }

    setIsUploadingCover(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
            if (file.type.startsWith('image/')) {
                const compressedUrl = await compressImage(dataUrl, { quality: 0.7, maxWidth: 400, maxHeight: 600 });
                setCoverImageUrl(compressedUrl);
                setCoverVideoUrl(null);
            } else if (file.type.startsWith('video/')) {
                setCoverVideoUrl(dataUrl);
                setCoverImageUrl(null);
            } else {
                throw new Error("Unsupported file type.");
            }
            toast({ variant: 'success', title: "Cover Media Ready!" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Processing Failed", description: (error as Error).message });
        } finally {
            setIsUploadingCover(false);
        }
    };
    reader.readAsDataURL(file);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const maxSteps = isCoopMode ? 9 : 8;

  const handleNextStep = async () => {
    let isValid = false;
        
    let fieldsToValidate: (keyof StoryFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['genre'];
    else if (step === 2) fieldsToValidate = ['name'];
    else if (step === 3) fieldsToValidate = ['ageRating'];
    else if (step === 4) fieldsToValidate = ['language'];
    else if (step === 5) fieldsToValidate = ['isPublic'];
    else if (step === 6) fieldsToValidate = ['plot'];
    
    if (fieldsToValidate.length > 0) {
      isValid = await storyForm.trigger(fieldsToValidate);
    } else {
      // Handle steps without direct form validation
      switch(step) {
        case 7:
          isValid = !!mainCharacter;
          if (!isValid) toast({ variant: "destructive", title: "Character Required", description: "Please create or select a main character before proceeding."});
          break;
        case 8:
          if (isCoopMode) {
            isValid = !!character2;
            if (!isValid) toast({ variant: "destructive", title: "Second Character Required", description: "Please create the second main character for your co-op story."});
          } else {
            isValid = !!coverImageUrl || !!coverVideoUrl;
            if (!isValid) toast({ variant: 'destructive', title: 'Cover Required', description: 'Please generate or upload a cover.' });
          }
          break;
        case 9:
          if (isCoopMode) {
            isValid = !!coverImageUrl || !!coverVideoUrl;
            if (!isValid) toast({ variant: 'destructive', title: 'Cover Required', description: 'Please generate or upload a cover.' });
          } else {
            isValid = !!scene1.url && !!scene2.url;
            if (!isValid) toast({ variant: "destructive", title: "Scenes Required", description: "Please generate a visual for both scenes."});
          }
          break;
        case 10:
          if (isCoopMode) {
            isValid = !!scene1.url && !!scene2.url;
            if (!isValid) toast({ variant: "destructive", title: "Scenes Required", description: "Please generate a visual for both scenes."});
          }
          break;
        default:
          isValid = true; // For review step
      }
    }

    if (isValid && step < maxSteps + 2) { // +1 for scenes/review, +1 for final review
        setStep(step + 1);
    }
  };

  useEffect(() => {
    const sceneStep = isCoopMode ? 10 : 9;
    if (step === sceneStep && !scene1Form.getValues('name') && !isGeneratingScenes) {
        const generateScenes = async () => {
            setIsGeneratingScenes(true);
            try {
                const storyData = storyForm.getValues();
                const result = await generateTwoScenesFromPlotAction({ plot: storyData.plot, genre: storyData.genre });
                scene1Form.reset({ name: result.scene1.name, prompt: result.scene1.prompt });
                scene2Form.reset({ name: result.scene2.name, prompt: result.scene2.prompt });
            } catch (e) {
                const err = e as Error;
                toast({ variant: 'destructive', title: 'Scene Suggestion Failed', description: err.message });
                setStep(step - 1);
            } finally {
                setIsGeneratingScenes(false);
            }
        };
        generateScenes();
    }
  }, [step, scene1Form, scene2Form, storyForm, isGeneratingScenes, toast, isCoopMode]);

  const handleCreateStory = async () => {
    const allCharacters = isCoopMode ? [mainCharacter, character2] : [mainCharacter];
    if (allCharacters.some(c => !c) || !scene1.url || !scene2.url || (!coverImageUrl && !coverVideoUrl)) {
        toast({ variant: "destructive", title: "Incomplete Story", description: "Please ensure you have created all required characters, scenes, and a cover." });
        return;
    }
    
    setIsCreating(true);
    try {
        const storyData = storyForm.getValues();
        
        await createStory(
            { 
              ...storyData, 
              style: 'photo', 
              isManuallyCreated: true, 
              isCoop: isCoopMode,
              imageUrl: coverImageUrl,
              videoUrl: coverVideoUrl,
              coverType: coverVideoUrl ? 'video' : 'image',
            }, 
            [scene1 as Scene, scene2 as Scene], 
            allCharacters as Character[]
        );
        
        // Use a consistent way to find the newly created story
        const newStory = stories.find(s => s.name === storyData.name && s.plot === storyData.plot);

        if (isCoopMode && newStory) {
          router.push(`/co-op/${newStory.id}/lobby`);
        } else {
          router.push('/dashboard');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: "destructive", title: "Story Creation Failed", description: errorMessage });
    } finally {
        setIsCreating(false);
    }
  };
  
  const stepDetails = [
      { title: "What genre is your story?", description: "Select up to two genres that will define your narrative's world. Your choice will influence everything from the tone of the story and the types of characters you'll encounter to the events that unfold. Mixing genres can lead to unique and unexpected adventures." },
      { title: "What is your story's name?", description: "Every great saga needs a title. Choose a name that is memorable and hints at the core themes of your adventure. If you're feeling stuck, use the AI sparkle button to generate a unique and compelling title based on your other selections." },
      { title: "Who is the audience?", description: "Decide if your story is intended for a mature audience. This choice is available on premium plans and adjusts the AI's boundaries for content generation. By default, stories are created in a Young Adult (14+) style." },
      { title: "What language will it be in?", description: "Choose the primary English dialect for your story. This will influence spelling, phrasing, and cultural nuances in the AI-generated text." },
      { title: "Choose Your Privacy", description: "Select whether your story will be visible to others on the platform or kept personal to your account. You can change this setting later." },
      { title: "What's the opening plot?", description: "This is the hook for your story. Write a compelling sentence or two to kickstart the narrative, introducing a central conflict, a mysterious element, or a personal stake for a potential protagonist. A strong opening plot will guide the AI in generating a richer story." },
      { title: isCoopMode ? "Create Protagonist 1" : "Create your main character", description: "Now, let's create the hero of your story. You can manually fill in all their details for complete control, or use the AI to generate a fully-formed character with a unique name, backstory, and appearance, ready for adventure." },
      { title: isCoopMode ? "Create Protagonist 2" : "Design your cover", description: isCoopMode ? "Design the second main character for this co-op adventure. This hero will have their own unique journey alongside the first protagonist." : "Create a first impression. Generate a cover with AI based on your story details, upload your own media (image or video), or simply provide a URL." },
      { title: isCoopMode ? "Design your cover" : "Create Your Primary Scenes", description: isCoopMode ? "Create a first impression. Generate a cover with AI based on your story details, upload your own media (image or video), or simply provide a URL." : "Based on your plot, we've suggested two key scenes to start your adventure. Review the names and prompts, and then generate a stunning visual for each to bring your world to life." },
      { title: isCoopMode ? "Create Your Primary Scenes" : "Ready to begin your adventure?", description: isCoopMode ? "Based on your plot, we've suggested two key scenes to start your adventure. Review the names and prompts, and then generate a stunning visual for each to bring your world to life." : "Your world is almost ready. Review your story details, character, and scenes below. Once you're happy with everything, press the button to finalize your creation and prepare to dive into your new interactive adventure!" },
      { title: "Ready to begin your adventure?", description: "Your world is almost ready. Review your story details, characters, and scenes below. Once you're happy with everything, press the button to finalize your creation and prepare for your co-op adventure!" }
  ];

  const finalReviewStep = maxSteps + 1;

  const renderStepContent = () => {
    if (step <= 6) {
      return (
        <FormProvider {...storyForm}>
          {step === 1 && (
             <TooltipProvider delayDuration={200}>
                <FormField control={storyForm.control} name="genre" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Genre (select up to 2)</FormLabel>
                        <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {genreOptions.map((genre) => (
                                    <Tooltip key={genre.name}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={selectedGenres.includes(genre.name) ? "default" : "outline"}
                                                onClick={() => handleGenreToggle(genre.name)}
                                                className="h-20 text-center text-base"
                                            >
                                                {genre.name}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">{genre.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
             </TooltipProvider>
          )}
          {step === 2 && <FormField control={storyForm.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Story Name</FormLabel><div className="relative flex items-center">
              <FormControl><Input placeholder="e.g., The Ashen Kingdom" {...field} /></FormControl>
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-8 w-8" onClick={() => handleAiGenerateField("name")} disabled={!!generatingField}>
                {generatingField === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </Button></div><FormMessage />
            </FormItem>
          )} /> }
          {step === 3 && (
            displayPlan === 'Free' ? (
                <div className="text-left p-6 rounded-lg bg-muted/50 border space-y-3">
                    <h3 className="font-semibold text-lg">Mature Content Locked</h3>
                    <p className="text-muted-foreground max-w-md">
                        Stories on the Free plan are created with a '14+' audience rating.
                        This ensures content is suitable for a Young Adult audience.
                    </p>
                    <Button asChild variant="link" className="text-primary px-0">
                        <Link href="/profile">Upgrade your plan to unlock 18+ content.</Link>
                    </Button>
                </div>
            ) : (
                <FormField
                    control={storyForm.control}
                    name="ageRating"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="block">Would you like to make this an over 18's story?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => field.onChange(value)}
                                    value={field.value}
                                    className="grid grid-cols-2 gap-4 pt-2"
                                >
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="14+" id="age-no" className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor="age-no"
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                                "cursor-pointer transition-all text-lg font-semibold"
                                            )}
                                        >
                                            No
                                            <span className="text-sm font-normal text-muted-foreground mt-1">(Default 14+)</span>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="18+" id="age-yes" className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor="age-yes"
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                                "cursor-pointer transition-all text-lg font-semibold"
                                            )}
                                        >
                                            Yes
                                            <span className="text-sm font-normal text-muted-foreground mt-1">(Mature 18+)</span>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
          )}
          {step === 4 && (
             <FormField
                control={storyForm.control}
                name="language"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="block">Choose your language</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(value) => field.onChange(value as 'UK English' | 'US English')}
                                value={field.value}
                                className="grid grid-cols-2 gap-4 pt-2"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="US English" id="lang-us" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel
                                        htmlFor="lang-us"
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                            "cursor-pointer transition-all text-lg font-semibold"
                                        )}
                                    >
                                        US English
                                    </FormLabel>
                                </FormItem>
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="UK English" id="lang-uk" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel
                                        htmlFor="lang-uk"
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                            "cursor-pointer transition-all text-lg font-semibold"
                                        )}
                                    >
                                        UK English
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          )}
          {step === 5 && <FormField
              control={storyForm.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="block">Set story visibility</FormLabel>
                    <FormControl>
                        <RadioGroup
                            onValueChange={(value) => field.onChange(value === 'true')}
                            value={String(field.value)}
                            className="grid grid-cols-2 gap-4 pt-2"
                        >
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="true" id="privacy-public" className="peer sr-only" />
                                </FormControl>
                                <FormLabel
                                    htmlFor="privacy-public"
                                    className={cn(
                                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                        "cursor-pointer transition-all text-lg"
                                    )}
                                >
                                    <Globe className="h-6 w-6 mb-2" />
                                    Public
                                    <span className="text-sm font-normal text-muted-foreground mt-1">Visible to all</span>
                                </FormLabel>
                            </FormItem>
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="false" id="privacy-personal" className="peer sr-only" />
                                </FormControl>
                                <FormLabel
                                    htmlFor="privacy-personal"
                                    className={cn(
                                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 h-24",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                        "cursor-pointer transition-all text-lg"
                                    )}
                                >
                                    <Lock className="h-6 w-6 mb-2" />
                                    Personal
                                    <span className="text-sm font-normal text-muted-foreground mt-1">Only for you</span>
                                </FormLabel>
                            </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
          }
          {step === 6 && <FormField control={storyForm.control} name="plot" render={({ field }) => (
            <FormItem><FormLabel>Opening Plot</FormLabel><div className="relative">
              <FormControl><Textarea placeholder="A brief summary..." {...field} className="pr-10 min-h-[120px]" /></FormControl>
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-1 h-8 w-8" onClick={() => handleAiGenerateField("plot")} disabled={!!generatingField}>
                {generatingField === "plot" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </Button></div><FormMessage />
            </FormItem>
          )} />}
        </FormProvider>
      );
    }
    
    // Character and Cover steps
    switch(step) {
        case 7:
            return (
                <div>
                    <RadioGroup value={characterMode} onValueChange={(v) => setCharacterMode(v as 'new' | 'existing')} className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <RadioGroupItem value="new" id="char-new" className="peer sr-only" />
                            <Label htmlFor="char-new" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 h-16 text-lg font-semibold peer-data-[state=checked]:border-primary cursor-pointer transition-all">
                                <UserPlus /> Create New
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="existing" id="char-existing" className="peer sr-only" disabled={userCharacters.length === 0} />
                            <Label htmlFor="char-existing" className={cn("flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 h-16 text-lg font-semibold peer-data-[state=checked]:border-primary transition-all", userCharacters.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50")}>
                                <Users /> Use Existing
                            </Label>
                        </div>
                    </RadioGroup>
                    
                    {characterMode === 'new' ? (
                        <CharacterCreatorWizard form={character1Form} onGenerateImages={() => handleGenerateCharacterImages(1)} isGeneratingImages={isGeneratingCharImages} character={mainCharacter} onFinish={() => {}} />
                    ) : (
                        <div className="space-y-4">
                            <Select onValueChange={setSelectedExistingCharId} value={selectedExistingCharId || ""}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a character..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {userCharacters.map(char => (
                                        <SelectItem key={char.id} value={char.id}>
                                            {char.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {mainCharacter && (
                                <div className="text-center flex flex-col items-center gap-4 pt-4">
                                    <h3 className="text-xl font-bold font-headline">Character Selected!</h3>
                                    <Image src={mainCharacter.profileImageUrl} alt={mainCharacter.name} width={128} height={192} className="rounded-lg object-cover shadow-lg" data-ai-hint="character portrait"/>
                                    <p className="text-2xl font-bold">{mainCharacter.name}</p>
                                    <p className="text-muted-foreground">{mainCharacter.traits}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        case 8:
            if(isCoopMode) {
                if(mainCharacter && !character2) { // Show creator for char 2 if char 1 is done
                     return <CharacterCreatorWizard form={character2Form} onGenerateImages={() => handleGenerateCharacterImages(2)} isGeneratingImages={isGeneratingChar2Images} character={character2} onFinish={() => {}} />;
                } else if (mainCharacter && character2) { // Show char 2 confirmation
                    return (
                        <div className="text-center flex flex-col items-center gap-4">
                            <h3 className="text-xl font-bold font-headline">Protagonist 2 Created!</h3>
                            <Image src={character2.profileImageUrl} alt={character2.name} width={128} height={192} className="rounded-lg object-cover shadow-lg" data-ai-hint="character portrait" />
                            <p className="text-2xl font-bold">{character2.name}</p>
                            <p className="text-muted-foreground">{character2.traits}</p>
                        </div>
                    )
                }
            }
            // Fallthrough to cover for non-coop
        case 9:
             if (isCoopMode || step === 8) { // Cover step
                return (
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-4">
                        <Button onClick={handleGenerateCover} disabled={!!generatingField} className="w-full">
                            {generatingField === "cover" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Cover with AI
                        </Button>
                        <div className="relative flex items-center justify-center my-4">
                            <Separator className="w-full" />
                            <span className="absolute bg-card px-2 text-sm text-muted-foreground">OR</span>
                        </div>
                        <Input
                            id="cover-image-url-input"
                            type="text"
                            placeholder="Paste an external image URL"
                            onChange={(e) => { setCoverImageUrl(e.target.value); setCoverVideoUrl(null); }}
                            value={coverImageUrl || ''}
                        />
                        <Input
                            id="cover-video-url-input"
                            type="text"
                            placeholder="Paste an external video URL"
                            onChange={(e) => { setCoverVideoUrl(e.target.value); setCoverImageUrl(null); }}
                            value={coverVideoUrl || ''}
                        />
                        <Button onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover} className="w-full" variant="outline">
                            {isUploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Upload Image/Video
                        </Button>
                        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*,video/mp4,video/webm" />
                        </div>
                        <div className="aspect-[9/16] w-full max-w-sm mx-auto bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                            {generatingField === "cover" && <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p>Generating...</p></div>}
                            {coverVideoUrl ? (
                                <video src={coverVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            ) : coverImageUrl ? (
                                <Image src={coverImageUrl} alt="Story Cover" fill className="object-cover" />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <ImageIcon className="h-12 w-12 mx-auto" />
                                    <p className="mt-2 text-sm">Your cover will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
             }
             // Fallthrough to scenes for non-coop
        case 10:
            if ((!isCoopMode && step === 9) || (isCoopMode && step === 10)) {
                return isGeneratingScenes ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Suggesting scenes based on your plot...</p>
                </div>
                ) : (
                    <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold font-headline mb-4">First Primary Scene</h3>
                        <SceneGenerator key="scene1" form={scene1Form} scene={scene1} generating={generatingScene1} onGeneratePrompt={() => handleGenerateScenePrompt(1)} onGenerateVisual={() => handleGenerateSceneVisual(1)} />
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-xl font-bold font-headline mb-4">Second Primary Scene</h3>
                        <SceneGenerator key="scene2" form={scene2Form} scene={scene2} generating={generatingScene2} onGeneratePrompt={() => handleGenerateScenePrompt(2)} onGenerateVisual={() => handleGenerateSceneVisual(2)} />
                    </div>
                    </div>
                );
            }
        case 11:
            if ((!isCoopMode && step === 10) || (isCoopMode && step === 11)) {
                const finalCharacters = [mainCharacter, isCoopMode ? character2 : null].filter(Boolean) as Character[];
                return (
                    <div className="text-left space-y-6">
                        <h3 className="text-2xl font-bold font-headline">{storyForm.getValues('name')}</h3>
                        <div className="flex justify-start items-end gap-4">
                            {finalCharacters.map(char => char && <Image key={char.id} src={char.profileImageUrl} alt={char.name} width={100} height={150} className="rounded-lg object-cover" data-ai-hint="character portrait"/>)}
                            {scene1.url && <Image src={scene1.url} alt={scene1.name || "Scene 1"} width={160} height={90} className="rounded-lg object-cover" data-ai-hint="fantasy landscape" />}
                            {scene2.url && <Image src={scene2.url} alt={scene2.name || "Scene 2"} width={160} height={90} className="rounded-lg object-cover" data-ai-hint="fantasy landscape" />}
                        </div>
                        <p className="text-muted-foreground">{storyForm.getValues('plot')}</p>
                    </div>
                );
            }
        default: return null;
    }
  }

  return (
    <AnimateInView tag="div" className="space-y-8 max-w-4xl mx-auto">
      <div className="text-left">
        <h1 className="text-3xl font-bold font-headline mb-4">{step > finalReviewStep ? (isCoopMode ? "Co-op Story Created!" : "Story Created!") : stepDetails[step-1].title}</h1>
        {step <= finalReviewStep && <p className="text-muted-foreground max-w-2xl">{stepDetails[step-1].description}</p>}
      </div>

      <Card className="min-h-[350px] flex flex-col justify-center">
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {step <= finalReviewStep && (
        <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.back()} disabled={step === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < finalReviewStep ? (
            <Button onClick={handleNextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            ) : (
            <Button onClick={handleCreateStory} disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Finish & Create Story
            </Button>
            )}
        </div>
      )}
    </AnimateInView>
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
              value={field.value}
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
