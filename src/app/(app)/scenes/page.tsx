
"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStory } from '@/contexts/StoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateScenarioVisualAction, generateScenePromptAction, generateSceneNameAction } from '@/lib/actions';
import Image from 'next/image';
import { Bot, Image as ImageIcon, Loader2, Sparkles, Trash2, Upload, Pencil, Coins } from 'lucide-react';
import { cn, getBase64Size, formatBytes, compressImage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Scene } from '@/types';
import { storyStyles } from '@/lib/config';
import BookLoader from '@/components/BookLoader';

const generateSchema = z.object({
  name: z.string().min(2, 'Scene name must be at least 2 characters.'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters.'),
});

const COST_PER_SCENE = 2;
const COST_PER_REGEN = 1;

export default function ScenesPage() {
  const { scenes, addScene, removeScene, updateScene, activeStory, genre, isLoading: isStoryLoading, tokens, consumeToken } = useStory();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatingField, setGeneratingField] = useState<'name' | 'prompt' | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [newSceneName, setNewSceneName] = useState("");
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);


  const canAfford = (cost: number) => tokens >= cost;

  useEffect(() => {
    if (!isStoryLoading && !activeStory) {
      router.replace('/dashboard');
    }
  }, [activeStory, router, isStoryLoading]);

  const form = useForm<z.infer<typeof generateSchema>>({
    resolver: zodResolver(generateSchema),
    defaultValues: { name: '', prompt: '' },
  });

  async function onGenerateSubmit(values: z.infer<typeof generateSchema>) {
    if (!canAfford(COST_PER_SCENE)) {
        toast({
            variant: "destructive",
            title: "Not enough tokens!",
            description: `You need ${COST_PER_SCENE} tokens to generate a new scene.`,
        });
        return;
    }
    setIsGenerating(true);
    try {
      const { url } = await generateScenarioVisualAction({ 
        scenarioDescription: values.prompt,
      });

      const compressedUrl = await compressImage(url, { quality: 0.8, maxWidth: 1024, maxHeight: 1536 });
      
      await addScene({
        name: values.name,
        prompt: values.prompt,
        url: compressedUrl,
        style: 'photo',
      }, COST_PER_SCENE);
      
      toast({
        title: 'Scene Generated & Added!',
        description: `"${values.name}" is now in your library.`,
      });
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Scene Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canAfford(COST_PER_SCENE)) {
        toast({
            variant: "destructive",
            title: "Not enough tokens!",
            description: `You need ${COST_PER_SCENE} tokens to upload a new scene.`,
        });
        return;
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: "destructive",
            title: "File too large",
            description: "Please upload an image smaller than 4MB.",
        });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const compressedUrl = await compressImage(dataUrl, { quality: 0.8, maxWidth: 1024, maxHeight: 1536 });

        await addScene({
          name: file.name.split('.').slice(0, -1).join('.'),
          url: compressedUrl,
          style: 'uploaded',
        }, COST_PER_SCENE);

        toast({
          title: 'Image Uploaded & Compressed!',
          description: `"${file.name}" has been added to your library.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: errorMessage,
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "Read Failed",
            description: "There was an error reading the file.",
        });
        setIsUploading(false);
    }
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleAiGenerateField = async (field: 'name' | 'prompt') => {
    if (!activeStory) {
      toast({ variant: 'destructive', title: 'No active story selected' });
      return;
    }
    setGeneratingField(field);
    try {
        if (field === 'name') {
            const result = await generateSceneNameAction({ genre, existingSceneNames: scenes.map(s => s.name) });
            form.setValue('name', result.name, { shouldValidate: true });
        } else if (field === 'prompt') {
            const name = form.getValues('name');
            const result = await generateScenePromptAction({ name, genre: activeStory.genre });
            form.setValue('prompt', result.prompt, { shouldValidate: true });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: 'destructive',
            title: 'AI Generation Failed',
            description: `There was a problem generating a ${field}. ${errorMessage}`,
        });
    } finally {
        setGeneratingField(null);
    }
  };

  const handleEditClick = (scene: Scene) => {
    setEditingScene(scene);
    setNewSceneName(scene.name);
  };

  const handleRenameSubmit = () => {
    if (!editingScene || !newSceneName.trim()) {
        toast({
            variant: "destructive",
            title: "Invalid Name",
            description: "Scene name cannot be empty.",
        });
        return;
    }
    if (newSceneName.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Scene name must be at least 2 characters.',
      });
      return;
    }

    updateScene(editingScene.id, { name: newSceneName.trim() });
    toast({
        title: "Scene Renamed!",
        description: `The scene is now called "${newSceneName.trim()}".`,
    });
    setEditingScene(null);
  };

  const handleRegenerateVisual = async (scene: Scene) => {
    if (!activeStory) return;
    if (!canAfford(COST_PER_REGEN)) {
      toast({
        variant: 'destructive',
        title: 'Not enough tokens!',
        description: `You need ${COST_PER_REGEN} token to re-generate a visual.`,
      });
      return;
    }

    const scenePrompt = scene.prompt;
    if (!scenePrompt) {
      toast({ variant: 'destructive', title: 'No Prompt', description: 'This scene does not have a prompt to generate from.' });
      return;
    }
    
    setRegeneratingSceneId(scene.id);

    try {
      const consumed = await consumeToken();
      if (!consumed) throw new Error("Could not consume token.");
      
      const storyStyle = 'photo';
      const selectedStyle = storyStyles.find(s => s.value === storyStyle);
      if (!selectedStyle) throw new Error("Could not find style for generation.");
      
      const fullPrompt = `${selectedStyle.scenePromptModifier}, ${scenePrompt}`;
      const { url } = await generateScenarioVisualAction({ scenarioDescription: fullPrompt });
      const compressedUrl = await compressImage(url, { quality: 0.8, maxWidth: 1024, maxHeight: 1536 });
      
      updateScene(scene.id, { url: compressedUrl });
      toast({ variant: 'success', title: 'Visual Re-generated!', description: `The visual for "${scene.name}" has been updated.`});

    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Re-generation Failed', description: err.message });
    } finally {
      setRegeneratingSceneId(null);
    }
  };


  if (isStoryLoading || !activeStory) {
    return <BookLoader />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Scenes</h1>
            <p className="text-muted-foreground">Create photorealistic backgrounds for your story: '{activeStory.name}'.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary font-semibold">
            <Coins className="h-5 w-5" />
            <span>{tokens} Tokens</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Scene</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate"><Sparkles className="mr-2 h-4 w-4" /> Generate with AI</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" /> Upload Image</TabsTrigger>
            </TabsList>
            <TabsContent value="generate" className="pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onGenerateSubmit)} className="space-y-6">
                   <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scene Name</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input placeholder="e.g., The Whispering Caverns" {...field} className="pr-10" />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                                onClick={() => handleAiGenerateField("name")}
                                disabled={generatingField === 'name'}
                            >
                                {generatingField === 'name' ? (
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

                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generation Prompt</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Textarea placeholder="A vast, glowing cavern with bioluminescent fungi..." {...field} className="pr-10" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-1 h-8 w-8"
                            onClick={() => handleAiGenerateField('prompt')}
                            disabled={generatingField === 'prompt' || isGenerating}
                          >
                            {generatingField === 'prompt' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-primary" />
                            )}
                            <span className="sr-only">Generate Prompt</span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isGenerating || !!generatingField || isUploading || !canAfford(COST_PER_SCENE)} title={!canAfford(COST_PER_SCENE) ? `You need ${COST_PER_SCENE} tokens` : "Generate Scene"}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate Scene
                    <Badge variant="secondary" className="ml-2">{COST_PER_SCENE} <Coins className="h-3 w-3 ml-1" /></Badge>
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="upload" className="pt-4">
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted p-8 text-center">
                 <ImageIcon className="h-12 w-12 text-muted-foreground" />
                 <p className="text-muted-foreground">Click the button to upload a background image.</p>
                 <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isGenerating || !canAfford(COST_PER_SCENE)} title={!canAfford(COST_PER_SCENE) ? `You need ${COST_PER_SCENE} tokens` : "Select File"}>
                    {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                   Select File
                   <Badge variant="secondary" className="ml-2">{COST_PER_SCENE} <Coins className="h-3 w-3 ml-1" /></Badge>
                 </Button>
                 <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileUpload}
                 />
                 <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 4MB.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Scene Library</h2>
        {scenes && scenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scenes.map((scene) => (
              <Card key={scene.id} className="overflow-hidden group relative">
                <CardHeader className="p-0 relative aspect-video">
                  {regeneratingSceneId === scene.id ? (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="mt-2 text-sm">Regenerating...</p>
                    </div>
                  ) : null}
                  <Image
                    src={scene.url || "https://placehold.co/600x400.png"}
                    alt={scene.name}
                    fill
                    className="object-cover"
                    data-ai-hint="background scene"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerateVisual(scene);
                      }}
                      disabled={!scene.prompt || !!regeneratingSceneId}
                      title={!scene.prompt ? "Cannot regenerate without a prompt" : "Re-generate Visual (1 Token)"}
                    >
                      <Bot className="h-4 w-4" />
                      <span className="sr-only">Re-generate Visual</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(scene);
                      }}
                       disabled={!!regeneratingSceneId}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Rename Scene</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScene(scene.id);
                      }}
                       disabled={!!regeneratingSceneId}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Scene</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="font-semibold truncate">{scene.name}</p>
                  {scene.prompt && <p className="text-sm text-muted-foreground truncate" title={scene.prompt}>{scene.prompt}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Scenes Yet</h3>
              <p className="text-muted-foreground mt-2">
                Generate or upload a scene to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!editingScene} onOpenChange={(isOpen) => !isOpen && setEditingScene(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Scene</DialogTitle>
                <DialogDescription>
                    Enter a new name for the scene "{editingScene?.name}".
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="scene-name-input">Scene Name</Label>
                <Input 
                    id="scene-name-input"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingScene(null)}>Cancel</Button>
                <Button onClick={handleRenameSubmit}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
