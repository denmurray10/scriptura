
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStory } from "@/contexts/StoryContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  generateCharacterDetailsAction,
  createManualCharacterAction,
  generateCharacterFieldAction,
  generateCharacterImagesAction,
  generateCharacterTraitsAction,
  removeImageBackgroundAction,
  generateCharacterAccessoriesAction,
} from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Bot, Loader2, PlusCircle, Sparkles, User, Pencil, Heart, Smile, CircleDollarSign, Briefcase, Trash2, Upload, Image as ImageIcon, ArrowLeft, ArrowRight, Coins, BrainCircuit, Star, BarChart, Wand2 } from "lucide-react";
import { cn, formatBytes, getBase64Size, compressImage } from "@/lib/utils";
import type { Character } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { storyStyles } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BookLoader from "@/components/BookLoader";


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

type UploadedImageKeys = 'profileImageUrl' | 'inGameImageUrl';

const sexOptions = ["Male", "Female"];
const ageOptions = ["Young", "Teenager", "Adult", "Old"];
const hairColourOptions = ["Red", "White", "Blonde", "Brown", "Silver", "Black"];
const eyeColourOptions = ["Blue", "Green", "Brown", "Hazel", "Grey", "Amber"];

const COST_PER_CHARACTER = 5;

export default function CharactersPage() {
  const {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    activeCharacterId,
    setActiveCharacterId,
    activeStory,
    genre,
    ageRating,
    style,
    tokens,
    isLoading: isStoryLoading,
  } = useStory();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null
  );
  const [isViewing, setIsViewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiCreating, setIsAiCreating] = useState<false | 'Male' | 'Female'>(false);
  const [generatingField, setGeneratingField] =
    useState<keyof CharacterFormValues | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  
  // New state for multi-step form
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [completedCharacter, setCompletedCharacter] = useState<Character | null>(null);


  // New state for manual upload
  const [activeTab, setActiveTab] = useState("ai");
  const [isUploading, setIsUploading] = useState<UploadedImageKeys | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Record<UploadedImageKeys, string | null>>({
    profileImageUrl: null,
    inGameImageUrl: null,
  });
  const [isRemovingBg, setIsRemovingBg] = useState<UploadedImageKeys | null>(null);

  // State for trait suggestions
  const [suggestedTraits, setSuggestedTraits] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set());
  const [isGeneratingTraits, setIsGeneratingTraits] = useState(false);
  
  // State for accessories
  const [suggestedAccessories, setSuggestedAccessories] = useState<string[]>([]);
  const [isGeneratingAccessories, setIsGeneratingAccessories] = useState(false);
  
  // State for inventory dialog
  const [viewingInventoryFor, setViewingInventoryFor] = useState<Character | null>(null);

  const { toast } = useToast();

  const canAfford = tokens >= COST_PER_CHARACTER;

  useEffect(() => {
    const charId = searchParams.get('characterId');
    const action = searchParams.get('action');

    if (action === 'view' && charId && characters.length > 0) {
      const characterToView = characters.find(c => c.id === charId);
      if (characterToView) {
        handleOpenDialog(characterToView);
        // Clean up URL params after use
        router.replace('/characters', { scroll: false });
      }
    }
  }, [searchParams, characters, router]);

  useEffect(() => {
    if (!isStoryLoading && !activeStory) {
      router.replace('/dashboard');
    }
  }, [activeStory, router, isStoryLoading]);

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: { name: "", traits: "", backstory: "", sex: undefined, age: undefined, hairColour: undefined, eyeColour: undefined, accessories: "" },
  });

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
        toast({
            variant: "destructive",
            title: "AI Generation Failed",
            description: "Could not generate trait suggestions.",
        });
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
        toast({
            variant: "destructive",
            title: "AI Generation Failed",
            description: "Could not generate accessory suggestions.",
        });
    } finally {
        setIsGeneratingAccessories(false);
    }
  };
  
  useEffect(() => {
    if (open && !editingCharacter) {
        if (step === 6 && suggestedTraits.length === 0) {
            fetchTraits();
        }
        if (step === 8 && suggestedAccessories.length === 0) {
            fetchAccessories();
        }
    }
  }, [step, editingCharacter, open]);

  const handleTraitToggle = (trait: string) => {
    const newSelectedTraits = new Set(selectedTraits);
    if (newSelectedTraits.has(trait)) {
        newSelectedTraits.delete(trait);
    } else {
        if (newSelectedTraits.size >= 3) {
            toast({
                variant: "destructive",
                title: "Trait Limit Reached",
                description: "You can select a maximum of 3 traits.",
            });
            return;
        }
        newSelectedTraits.add(trait);
    }
    setSelectedTraits(newSelectedTraits);
    const traitsArray = Array.from(newSelectedTraits);
    form.setValue('traits', traitsArray.join(', '), { shouldValidate: true });
  };


  const handleOpenDialog = (character: Character | null) => {
    setEditingCharacter(character);
    setIsComplete(false);
    setCompletedCharacter(null);
    if (character) {
      setIsViewing(true); // Start in view mode for edits
      setStep(1); // Reset to first step for editing flow
      form.reset({
        name: character.name,
        sex: character.sex,
        age: character.age,
        eyeColour: character.eyeColour,
        hairColour: character.hairColour,
        traits: character.traits,
        backstory: character.backstory,
        accessories: character.accessories || "",
      });
      setUploadedImages({
        profileImageUrl: character.profileImageUrl,
        inGameImageUrl: character.inGameImageUrl,
      });
      const initialTraits = character.traits ? character.traits.split(',').map(t => t.trim()).filter(Boolean) : [];
      setSelectedTraits(new Set(initialTraits));
      setSuggestedTraits([]); // Clear suggestions until needed
    } else {
      setIsViewing(false); // Start in create mode
      setStep(1);
      form.reset({ name: "", traits: "", backstory: "", sex: undefined, age: undefined, hairColour: undefined, eyeColour: undefined, accessories: "" });
      setUploadedImages({ profileImageUrl: null, inGameImageUrl: null });
      setSuggestedTraits([]);
      setSelectedTraits(new Set());
      setSuggestedAccessories([]);
      setActiveTab("ai");
    }
    setOpen(true);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, imageType: UploadedImageKeys) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: "destructive",
            title: "File too large",
            description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      
      setIsUploading(imageType);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
            const originalDataUrl = reader.result as string;
            const compressedDataUrl = await compressImage(originalDataUrl, { quality: 0.7, maxWidth: 512, maxHeight: 768 });
            setUploadedImages(prev => ({ ...prev, [imageType]: compressedDataUrl }));
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Image processing failed",
                description: "Could not compress the selected image.",
            });
        } finally {
            setIsUploading(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async (imageType: UploadedImageKeys) => {
    const imageDataUrl = uploadedImages[imageType];
    if (!imageDataUrl) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    
    setIsRemovingBg(imageType);
    try {
      const result = await removeImageBackgroundAction({ imageDataUrl });
      setUploadedImages(prev => ({ ...prev, [imageType]: result.imageUrl }));
      toast({ variant: 'success', title: 'Background Removed!', description: 'The image has been updated.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Background Removal Failed', description: err.message });
    } finally {
      setIsRemovingBg(false);
    }
  };


  async function onSubmit(values: CharacterFormValues) {
    if (!activeStory) {
      toast({ variant: "destructive", title: "No Active Story" });
      return;
    }
    
    if (!editingCharacter && !canAfford) {
        toast({
            variant: "destructive",
            title: "Not enough tokens!",
            description: `You need ${COST_PER_CHARACTER} tokens to create a new character.`,
        });
        return;
    }

    const processAndSave = async (imageGenerator: () => Promise<any>) => {
        setIsGenerating(true);
        try {
            const imageData = await imageGenerator();

            const [
                compressedProfile, compressedInGame
            ] = await Promise.all([
                compressImage(imageData.profileImageUrl, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
                compressImage(imageData.inGameImageUrl, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
            ]);

            const finalCharacterData = {
                ...values,
                profileImageUrl: compressedProfile,
                inGameImageUrl: compressedInGame,
            };

            if (editingCharacter) {
                const updatedCharacter: Character = { ...editingCharacter, ...finalCharacterData };
                updateCharacter(updatedCharacter);
                toast({ title: "Character Updated!", description: `${values.name}'s details and images have been saved.` });
                setCompletedCharacter(updatedCharacter);
            } else {
                const newCharacter = await createManualCharacterAction({...finalCharacterData, isPlayable: true});
                await addCharacter(newCharacter, COST_PER_CHARACTER);
                toast({ title: "Character Created!" });
                setCompletedCharacter(newCharacter);
            }
            form.reset();
            setIsComplete(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Character Creation Failed", description: errorMessage });
        } finally {
            setIsGenerating(false);
        }
    };

    if (activeTab === 'upload') {
        const { profileImageUrl, inGameImageUrl } = uploadedImages;
        if (!profileImageUrl || !inGameImageUrl) {
            toast({ variant: 'destructive', title: 'Missing Images', description: 'Please upload both a profile and in-game image.' });
            return;
        }
        await processAndSave(async () => ({ profileImageUrl, inGameImageUrl }));
    } else { // activeTab === 'ai'
        const selectedStyle = storyStyles.find(s => s.value === style);
        if (!selectedStyle) {
            toast({ variant: "destructive", title: "Invalid Story Style" });
            return;
        }
        await processAndSave(async () => {
            const imageResult = await generateCharacterImagesAction({
                ...values,
                stylePrompt: selectedStyle.characterPromptModifier,
                genre: activeStory.genre,
            });
            return {
                profileImageUrl: imageResult.profileImage.url,
                inGameImageUrl: imageResult.inGameImage.url,
            };
        });
    }
}

const handleAiQuickCreate = async (sex: 'Male' | 'Female') => {
    if (!activeStory) {
      toast({
        variant: "destructive",
        title: "No Active Story",
        description: "Please select a story before creating a character.",
      });
      return;
    }
    
    if (!canAfford) {
      toast({
        variant: "destructive",
        title: "Cannot Create Character",
        description: `You need ${COST_PER_CHARACTER} tokens.`,
      });
      return;
    }

    const selectedStyle = storyStyles.find(s => s.value === style);
    if (!selectedStyle) {
        toast({ variant: "destructive", title: "Invalid Story Style" });
        return;
    }

    setIsAiCreating(sex);
    try {
      const existingNames = characters.map(c => c.name);
      // 1. Generate character details
      const details = await generateCharacterDetailsAction({
        genre: activeStory.genre,
        ageRating: activeStory.ageRating,
        sex,
        existingNames,
      });

      // 2. Generate character images based on details
      const imageResult = await generateCharacterImagesAction({
          ...details,
          stylePrompt: selectedStyle.characterPromptModifier,
          genre: activeStory.genre,
      });

      // 3. Compress images
      const [
          compressedProfile, compressedInGame
      ] = await Promise.all([
          compressImage(imageResult.profileImage.url, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
          compressImage(imageResult.inGameImage.url, { quality: 0.7, maxWidth: 512, maxHeight: 768 }),
      ]);

      // 4. Create character object
      const newCharacter = await createManualCharacterAction({
          ...details,
          profileImageUrl: compressedProfile,
          inGameImageUrl: compressedInGame,
          isPlayable: true,
      });

      // 5. Add character to story (this will handle the upload and token/unlock deduction)
      await addCharacter(newCharacter, COST_PER_CHARACTER);
      
      toast({
        title: "Character Created!",
        description: `${newCharacter.name} has been created.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "AI Quick Create Failed",
        description: errorMessage,
      });
    } finally {
      setIsAiCreating(false);
    }
  };

  const handleAiGenerateField = async (field: keyof CharacterFormValues) => {
    if (!activeStory) {
      toast({
        variant: "destructive",
        title: "No Active Story",
        description: "Please select a story before generating fields.",
      });
      return;
    }
    setGeneratingField(field);
    try {
      const formValues = form.getValues();
      const existingNames = characters.map(c => c.name);
      const context = {
        ...formValues,
        genre: activeStory.genre,
        ageRating: activeStory.ageRating,
        existingNames,
      };
      const result = await generateCharacterFieldAction({ field, context });
      form.setValue(field, result.value, { shouldValidate: true });
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

  const handleDeleteConfirm = () => {
    if (characterToDelete) {
      deleteCharacter(characterToDelete.id);
      toast({
        title: "Character Deleted",
        description: `${characterToDelete.name} has been removed from the story.`,
      });
      setDeleteAlertOpen(false);
      setCharacterToDelete(null);
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
    }
  };
  
  if (isStoryLoading || !activeStory) {
    return <BookLoader />;
  }

  const maxSteps = 9;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Characters</h1>
          <p className="text-muted-foreground">Manage your story's cast for '{activeStory.name}'.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => handleOpenDialog(null)} variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Character
            </Button>
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAiQuickCreate('Male')} disabled={isAiCreating !== false || !canAfford}>
                    {isAiCreating === 'Male' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Male
                </Button>
                <Button onClick={() => handleAiQuickCreate('Female')} disabled={isAiCreating !== false || !canAfford}>
                    {isAiCreating === 'Female' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Female
                </Button>
            </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setIsViewing(false); setIsComplete(false); setCompletedCharacter(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          {isComplete && completedCharacter ? (
             <>
                <DialogHeader>
                    <DialogTitle>{editingCharacter ? "Character Updated!" : "Character Created!"}</DialogTitle>
                    <DialogDescription>
                        {completedCharacter.name} is ready for adventure.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <Image 
                        src={completedCharacter.profileImageUrl}
                        alt={`Portrait of ${completedCharacter.name}`}
                        width={128}
                        height={192}
                        className="rounded-lg object-cover aspect-[9/16]"
                        data-ai-hint="character portrait"
                    />
                    <p className="text-2xl font-bold font-headline">{completedCharacter.name}</p>
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
            </>
          ) : isViewing && editingCharacter ? (
            <>
              <DialogHeader>
                <DialogTitle>{editingCharacter.name}</DialogTitle>
                <DialogDescription>
                  A summary of your character's details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 text-sm">
                  <div className="font-semibold text-muted-foreground">Sex</div><div>{editingCharacter.sex}</div>
                  <div className="font-semibold text-muted-foreground">Age</div><div>{editingCharacter.age}</div>
                  <div className="font-semibold text-muted-foreground">Eye Colour</div><div>{editingCharacter.eyeColour}</div>
                  <div className="font-semibold text-muted-foreground">Hair Colour</div><div>{editingCharacter.hairColour}</div>
                  <div className="col-span-2 mt-2 font-semibold text-muted-foreground">Traits</div>
                  <div className="col-span-2">{editingCharacter.traits}</div>
                  <div className="col-span-2 mt-2 font-semibold text-muted-foreground">Accessories</div>
                  <div className="col-span-2">{editingCharacter.accessories || "None"}</div>
                  <div className="col-span-2 mt-2 font-semibold text-muted-foreground">Backstory</div>
                  <p className="col-span-2 text-muted-foreground leading-relaxed">{editingCharacter.backstory}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                <Button onClick={() => setIsViewing(false)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modify
                </Button>
              </div>
            </>
          ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {editingCharacter ? "Edit" : "Create New"} Character
              </DialogTitle>
              <DialogDescription>
                Step {step} of {maxSteps}: {editingCharacter ? "Update the details for your character." : "Fill in the details below."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-h-[300px]">
                
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 h-8 w-8"
                              onClick={() => handleAiGenerateField("name")}
                              disabled={!!generatingField}
                            >
                              {generatingField === "name" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-primary" />
                              )}
                              <span className="sr-only">Generate Name</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className={cn(step !== 2 && "hidden")}>
                  <AiRadioGroupField fieldName="sex" label="What is their sex?" options={sexOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />
                </div>

                <div className={cn(step !== 3 && "hidden")}>
                  <AiRadioGroupField fieldName="age" label="What is their age group?" options={ageOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />
                </div>
                
                <div className={cn(step !== 4 && "hidden")}>
                  <AiRadioGroupField fieldName="eyeColour" label="What is their eye colour?" options={eyeColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />
                </div>

                <div className={cn(step !== 5 && "hidden")}>
                  <AiRadioGroupField fieldName="hairColour" label="What is their hair colour?" options={hairColourOptions} form={form} onGenerate={handleAiGenerateField} disabled={!!generatingField} />
                </div>

                <div className={cn(step !== 6 && "hidden")}>
                    <FormField
                      control={form.control}
                      name="traits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are their key traits? (Max 3)</FormLabel>
                          <div className="relative flex items-center">
                            <FormControl>
                              <Input
                                placeholder="e.g., Stoic, resourceful, sharp-eyed"
                                {...field}
                                className="pr-10 text-xs md:text-sm"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 h-8 w-8"
                              onClick={() => handleAiGenerateField("traits")}
                              disabled={!!generatingField}
                            >
                              {generatingField === "traits" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-primary" />
                              )}
                              <span className="sr-only">Generate Traits</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-muted-foreground">Or, pick from these suggestions:</p>
                          <Button type="button" variant="ghost" size="sm" onClick={fetchTraits} disabled={isGeneratingTraits}>
                              {isGeneratingTraits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}
                              Refresh
                          </Button>
                      </div>
                      {isGeneratingTraits && suggestedTraits.length === 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
                          </div>
                      ) : (
                          <div className="grid grid-cols-3 gap-2">
                              {suggestedTraits.map(trait => (
                                  <Button
                                      key={trait}
                                      type="button"
                                      variant={selectedTraits.has(trait) ? "default" : "outline"}
                                      onClick={() => handleTraitToggle(trait)}
                                      className="truncate"
                                  >
                                      {trait}
                                  </Button>
                              ))}
                          </div>
                      )}
                    </div>
                </div>

                <div className={cn(step !== 7 && "hidden")}>
                    <FormField
                      control={form.control}
                      name="backstory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is their backstory?</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Textarea
                                placeholder="e.g., A former royal guard, exiled after..."
                                {...field}
                                className="pr-10 min-h-[120px] text-xs md:text-sm"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-1 h-8 w-8"
                              onClick={() => handleAiGenerateField("backstory")}
                              disabled={!!generatingField}
                            >
                              {generatingField === "backstory" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-primary" />
                              )}
                              <span className="sr-only">Generate Backstory</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className={cn(step !== 8 && "hidden")}>
                    <FormField
                      control={form.control}
                      name="accessories"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Any distinct accessories? (Optional)</FormLabel>
                          <FormControl>
                              <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-3 gap-2 pt-2"
                              >
                                  {(isGeneratingAccessories && suggestedAccessories.length === 0 ? Array(9).fill(null) : suggestedAccessories).map((acc, i) => (
                                      <FormItem key={acc || i}>
                                          <FormControl>
                                            {acc ? (
                                              <RadioGroupItem value={acc} id={`acc-${i}`} className="peer sr-only" />
                                            ) : (
                                              <Skeleton className="h-9 w-full rounded-md" />
                                            )}
                                          </FormControl>
                                          {acc && (
                                              <Label
                                                htmlFor={`acc-${i}`}
                                                className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 h-9 text-sm font-normal peer-data-[state=checked]:border-primary cursor-pointer truncate"
                                              >
                                                {acc}
                                              </Label>
                                          )}
                                      </FormItem>
                                  ))}
                              </RadioGroup>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                       <div className="flex justify-end mt-2">
                           <Button type="button" variant="ghost" size="sm" onClick={fetchAccessories} disabled={isGeneratingAccessories}>
                              {isGeneratingAccessories ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}
                              Refresh suggestions
                          </Button>
                       </div>
                </div>

                <div className={cn(step !== 9 && "hidden")}>
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full pt-2">
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai"><Sparkles className="mr-2 h-4 w-4" /> {editingCharacter ? "Re-generate with AI" : "Generate with AI"}</TabsTrigger>
                        <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" /> {editingCharacter ? "Upload New" : "Upload Manually"}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ai" className="pt-4">
                        <p className="text-sm text-center text-muted-foreground">
                            {editingCharacter 
                                ? "The AI will re-generate both images based on the updated character details"
                                : "The AI will generate two images (a profile headshot and a full-body in-game image)"
                            } in the story's style: <span className="capitalize font-semibold">{style}</span>.
                        </p>
                        </TabsContent>
                        <TabsContent value="upload" className="pt-4">
                        <div className="flex flex-wrap gap-4 justify-center">
                            <ImageUploadSlot imageType="profileImageUrl" label="Profile Image" currentSrc={uploadedImages.profileImageUrl} onChange={handleFileChange} disabled={!!isUploading || !!isRemovingBg} isUploading={isUploading === "profileImageUrl"} onRemoveBackground={() => handleRemoveBackground("profileImageUrl")} isRemovingBg={isRemovingBg === "profileImageUrl"} />
                            <ImageUploadSlot imageType="inGameImageUrl" label="In-Game Image" currentSrc={uploadedImages.inGameImageUrl} onChange={handleFileChange} disabled={!!isUploading || !!isRemovingBg} isUploading={isUploading === "inGameImageUrl"} onRemoveBackground={() => handleRemoveBackground("inGameImageUrl")} isRemovingBg={isRemovingBg === "inGameImageUrl"} />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            {editingCharacter 
                                ? "Upload new images to replace existing ones. Images should be under 4MB." 
                                : "Upload one of each image type. Images will be optimized."}
                        </p>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="flex justify-between items-center pt-4">
                  {/* Left button */}
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : editingCharacter ? (
                    <Button type="button" variant="outline" onClick={() => setIsViewing(true)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to View
                    </Button>
                  ) : (
                    <div></div> // Spacer
                  )}
                  
                  {/* Right button */}
                  {step < maxSteps ? (
                    <Button type="button" onClick={handleNextStep}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isGenerating || !!generatingField || !!isUploading}>
                        {isGenerating ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingCharacter ? 'Re-generating...' : 'Generating & Compressing...'}
                            </>
                        ) : activeTab === 'ai' ? (
                            <>
                            <Sparkles className="mr-2 h-4 w-4" /> {editingCharacter ? "Save & Re-generate" : "Create & Generate"}
                            </>
                        ) : (
                            <>
                            <PlusCircle className="mr-2 h-4 w-4" /> {editingCharacter ? "Save Changes" : "Create with Uploads"}
                            </>
                        )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the character '{characterToDelete?.name}' and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCharacterToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingInventoryFor} onOpenChange={(isOpen) => !isOpen && setViewingInventoryFor(null)}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{viewingInventoryFor?.name}'s Inventory</DialogTitle>
            <DialogDescription>
                Items currently held by the character.
            </DialogDescription>
            </DialogHeader>
            {viewingInventoryFor && viewingInventoryFor.items.length > 0 ? (
            <ScrollArea className="max-h-60 mt-4">
                <div className="space-y-4 pr-4">
                {viewingInventoryFor.items.map((item, index) => (
                    <div key={index} className="pb-2 border-b last:border-b-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                ))}
                </div>
            </ScrollArea>
            ) : (
            <p className="mt-4 text-sm text-muted-foreground">The bag is empty.</p>
            )}
        </DialogContent>
      </Dialog>

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <Card
              key={char.id}
              className={cn(
                "overflow-hidden cursor-pointer transition-all duration-300 relative group",
                activeCharacterId === char.id
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md hover:border-primary/50"
              )}
              onClick={() => char.isPlayable && setActiveCharacterId(char.id)}
            >
              <CardHeader className="p-0 relative h-60">
                <Image
                  src={char.profileImageUrl || "https://placehold.co/400x600.png"}
                  alt={`Portrait of ${char.name}`}
                  fill
                  className="object-cover"
                  data-ai-hint="character portrait"
                />
                 {char.profileImageSize && (
                  <Badge variant="secondary" className="absolute bottom-2 left-2 backdrop-blur-sm bg-black/40 hidden md:inline-flex">
                    {formatBytes(char.profileImageSize)}
                  </Badge>
                )}
                {!char.isPlayable && (
                    <Badge variant="default" className="absolute top-2 left-2 hidden md:inline-flex">
                        AI
                    </Badge>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(char);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Character</span>
                  </Button>
                   <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCharacterToDelete(char);
                      setDeleteAlertOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                     <span className="sr-only">Delete Character</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <CardTitle className="text-lg">{char.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {char.traits}
                </p>

                <div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>Level {char.level}</span>
                        <span>{char.xp} / {char.level * 100} XP</span>
                    </div>
                    <Progress value={(char.xp / (char.level * 100)) * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t">
                    <div className="flex items-center gap-1.5" title="Intellect"><BrainCircuit className="w-4 h-4 text-primary" /> Intellect: {char.stats.intellect}</div>
                    <div className="flex items-center gap-1.5" title="Charisma"><Star className="w-4 h-4 text-primary" /> Charisma: {char.stats.charisma}</div>
                    <div className="flex items-center gap-1.5" title="Wits"><BarChart className="w-4 h-4 text-primary" /> Wits: {char.stats.wits}</div>
                    <div className="flex items-center gap-1.5" title="Willpower"><BarChart className="w-4 h-4 text-primary" /> Willpower: {char.stats.willpower}</div>
                </div>


                <div className="pt-3 border-t border-border/50 flex justify-around text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" title="Health">
                    <Heart className="h-4 w-4 text-destructive" />
                    <span>{char.health}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Happiness">
                    <Smile className="h-4 w-4 text-primary" />
                    <span>{char.happiness}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Money">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>{char.money}</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 cursor-pointer"
                    title="View Inventory"
                    onClick={(e) => {
                        e.stopPropagation();
                        setViewingInventoryFor(char);
                    }}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>{char.items.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Characters Yet</h3>
            <p className="text-muted-foreground mt-2">
              Click 'New Character' or 'AI Quick Create' to start building your
              cast.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


const ImageUploadSlot = ({ imageType, label, currentSrc, onChange, disabled, isUploading, onRemoveBackground, isRemovingBg }: {
  imageType: UploadedImageKeys;
  label: string;
  currentSrc: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, imageType: UploadedImageKeys) => void;
  disabled: boolean;
  isUploading: boolean;
  onRemoveBackground: () => void;
  isRemovingBg: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "w-24 aspect-[9/16] rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer transition-colors relative",
          !disabled && "hover:border-primary hover:text-primary",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {isUploading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        ) : isRemovingBg ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md text-white">
                <Wand2 className="h-6 w-6 animate-spin" />
            </div>
        ): null}
        {currentSrc ? (
          <Image src={currentSrc} alt={`${label} preview`} width={96} height={144} className="object-cover w-full h-full rounded-md" />
        ) : (
          <div className="text-center p-2">
            <ImageIcon className="mx-auto h-6 w-6" />
            <span className="text-xs">{label}</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => onChange(e, imageType)}
        disabled={disabled}
      />
      {currentSrc && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemoveBackground}
            disabled={disabled}
          >
            {isRemovingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-primary" />}
            <span className="ml-2">Remove BG</span>
          </Button>
      )}
    </div>
  );
};


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
