

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Loader2, Bot, Book, Wand2, UserPlus } from "lucide-react";
import { generateCharacterImagesAction, generateScenarioVisualAction, generateStoryCoverAction, removeImageBackgroundAction, recruitNewCharacterAction } from "@/lib/actions";
import { storyStyles } from "@/lib/config";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/lib/utils";

// Hardcoded character data for testing
const testCharacter = {
  name: "Kaelen",
  sex: "Male",
  age: "Adult",
  genre: "Fantasy",
  hairColour: "Black",
  eyeColour: "Blue",
  traits: "Brave, Cynical, Loyal",
  stylePrompt: storyStyles.find(s => s.value === 'photo')?.characterPromptModifier || 'photorealistic',
  backstory: "A former knight exiled for a crime he did not commit.",
};

const recruitCharacterDetails = {
    genre: "Fantasy",
    ageRating: "14+",
    existingNames: ["Kaelen"],
};
const recruitCharacterStyle = storyStyles.find(s => s.value === 'photo')?.characterPromptModifier || 'photorealistic';


// Hardcoded scene data for testing
const testScene = {
  description: "A breathtaking masterpiece fantasy landscape of a forgotten kingdom with towering waterfalls and ancient ruins, epic scale, vibrant colors, magical, ethereal, intricate detail, dramatic lighting, award-winning digital art",
  style: 'fantasy',
};

// Hardcoded story data for testing
const testStory = {
  title: "The Ashen Kingdom",
  genre: "High Fantasy",
  plot: "In a realm slowly consumed by a magical blight, a disgraced knight must seek an ancient power to restore the land, but discovers the rot may be coming from the heart of the kingdom itself.",
  stylePrompt: storyStyles.find(s => s.value === 'fantasy')?.characterPromptModifier || 'fantasy art',
};


export default function ImageTestPage() {
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [inGameImage, setInGameImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [recruitProfileImage, setRecruitProfileImage] = useState<string | null>(null);
  const [recruitInGameImage, setRecruitInGameImage] = useState<string | null>(null);

  
  const [profileImageSize, setProfileImageSize] = useState<{original: number, new: number} | null>(null);
  const [inGameImageSize, setInGameImageSize] = useState<{original: number, new: number} | null>(null);
  const [backgroundImageSize, setBackgroundImageSize] = useState<{original: number, new: number} | null>(null);
  const [coverImageSize, setCoverImageSize] = useState<{original: number, new: number} | null>(null);


  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [isLoadingCover, setIsLoadingCover] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isLoadingRecruit, setIsLoadingRecruit] = useState(false);
  
  const [profilePrompt, setProfilePrompt] = useState("");
  const [inGamePrompt, setInGamePrompt] = useState("");
  const [backgroundPrompt, setBackgroundPrompt] = useState(testScene.description);
  const [coverPrompt, setCoverPrompt] = useState("");
  
  const [profileTime, setProfileTime] = useState<number | null>(null);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [coverTime, setCoverTime] = useState<number | null>(null);
  const [removeBgTime, setRemoveBgTime] = useState<number | null>(null);
  const [recruitTime, setRecruitTime] = useState<number | null>(null);


  const generateCharacterPrompts = () => {
    const baseDescription = `A ${testCharacter.age}, ${testCharacter.sex} ${testCharacter.genre} character named ${testCharacter.name} with ${testCharacter.hairColour} hair and ${testCharacter.eyeColour} eyes, and traits: ${testCharacter.traits}. Style: ${testCharacter.stylePrompt}.`;
    
    const pProfile = `Photorealistic character portrait, 8k, ultra-detailed, cinematic shot of ${baseDescription}. Cropped from the shoulders up. The background must be a plain, neutral, non-distracting color. 85mm lens, f/1.8 aperture.`;
    const pInGame = `A high-quality, detailed full-body portrait of ${baseDescription}. The character should be standing, facing forward. The background should be a solid, plain white, suitable for easy removal or use as a cutout sprite.`;

    setProfilePrompt(pProfile);
    setInGamePrompt(pInGame);
  };
  
  const generateCoverPrompt = () => {
    const prompt = `You are a professional graphic designer specializing in modern, award-winning book covers. Your task is to create a cover for a ${testStory.genre} novel titled "${testStory.title}".

      **DESIGN PRINCIPLES (Based on 2024 Trends):**
      *   **Bold Typography:** The title, "${testStory.title}", MUST be the main focus. Use a large, artistic, and eye-catching font that is integrated seamlessly into the design.
      *   **Vibrant & Symbolic Colors:** Use a strong, modern color palette. The colors should be symbolic of the plot.
      *   **Minimalism & Symbolism:** Instead of a literal scene, create a powerful, symbolic image. Focus on a single object, an abstract shape, or a nature-inspired element that represents the core theme of the plot.
      *   **Avoid Clichés:** Do NOT create generic fantasy/sci-fi art with characters posing. The result should feel like a piece of modern graphic design, not a video game cover.

      **Story Plot:** ${testStory.plot}
      **Visual Style:** ${testStory.stylePrompt}

      Create the cover now.`;
    setCoverPrompt(prompt);
  };

  const handleGenerateCharacters = async () => {
    generateCharacterPrompts();
    setIsLoadingProfile(true);
    setProfileTime(null);
    setRemoveBgTime(null);
    
    const startTime = performance.now();
    try {
      const result = await generateCharacterImagesAction(testCharacter);
      const endTime = performance.now();
      
      setProfileImage(result.profileImage.url);
      setInGameImage(result.inGameImage.url);
      setProfileImageSize({ original: result.profileImage.originalSize, new: result.profileImage.newSize });
      setInGameImageSize({ original: result.inGameImage.originalSize, new: result.inGameImage.newSize });
      setProfileTime(endTime - startTime);
      
      toast({
        title: "Success!",
        description: "Character images generated.",
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast({
        variant: "destructive",
        title: "Character Generation Failed",
        description: err.message,
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!inGameImage) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please generate an In-Game Image first.' });
      return;
    }
    
    setIsRemovingBg(true);
    setRemoveBgTime(null);
    const startTime = performance.now();
    try {
      const result = await removeImageBackgroundAction({ imageDataUrl: inGameImage });
      const endTime = performance.now();
      
      setInGameImage(result.imageUrl);
      setRemoveBgTime(endTime - startTime);
      toast({ variant: 'success', title: 'Background Removed!', description: 'The In-Game Image has been updated.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Background Removal Failed', description: err.message });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleGenerateBackground = async () => {
    setIsLoadingBackground(true);
    setBackgroundTime(null);
    const startTime = performance.now();
    try {
      const result = await generateScenarioVisualAction({ scenarioDescription: backgroundPrompt });
      const endTime = performance.now();

      setBackgroundImage(result.url);
      setBackgroundImageSize({ original: result.originalSize, new: result.newSize });
      setBackgroundTime(endTime - startTime);
      toast({
        title: "Success!",
        description: "Background image generated.",
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast({
        variant: "destructive",
        title: "Background Generation Failed",
        description: err.message,
      });
    } finally {
      setIsLoadingBackground(false);
    }
  };

  const handleGenerateCover = async () => {
    generateCoverPrompt();
    setIsLoadingCover(true);
    setCoverTime(null);
    const startTime = performance.now();
    try {
      const result = await generateStoryCoverAction(testStory);
      const endTime = performance.now();

      setCoverImage(result.coverUrl);
      setCoverImageSize({ original: result.originalSize, new: result.newSize });
      setCoverTime(endTime - startTime);
      toast({
        title: "Success!",
        description: "Story cover generated.",
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast({
        variant: "destructive",
        title: "Cover Generation Failed",
        description: err.message,
      });
    } finally {
      setIsLoadingCover(false);
    }
  };

  const handleRecruitCharacter = async () => {
    setIsLoadingRecruit(true);
    setRecruitTime(null);
    setRecruitProfileImage(null);
    setRecruitInGameImage(null);
    const startTime = performance.now();
    try {
      const result = await recruitNewCharacterAction(
        recruitCharacterDetails,
        recruitCharacterStyle,
        false
      );
      const endTime = performance.now();

      setRecruitProfileImage(result.profileImageUrl);
      setRecruitInGameImage(result.inGameImageUrl);
      setRecruitTime(endTime - startTime);

      toast({
        title: "Recruited!",
        description: `Generated AI companion: ${result.name}`,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Recruit Character Failed",
        description: err.message,
      });
    } finally {
      setIsLoadingRecruit(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Image Generation Test Suite</h1>
        <p className="text-muted-foreground">
          Use this page to verify the output of different image generation APIs and compression.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Character Image Test */}
          <TestCard
            title="Character Images"
            description="Generates both images for a character at once."
            isLoading={isLoadingProfile}
            onGenerate={handleGenerateCharacters}
            onPopulatePrompt={generateCharacterPrompts}
            time={profileTime}
            icon={Bot}
          >
            <div className="flex gap-4">
              <ImageDisplay imageUrl={profileImage} imageSize={profileImageSize} title="Profile Image" />
              <ImageDisplay imageUrl={inGameImage} imageSize={inGameImageSize} title="In-Game Image" />
            </div>
            {inGameImage && (
               <div className="pt-4 border-t">
                <Button onClick={handleRemoveBackground} disabled={isRemovingBg} className="w-full">
                  {isRemovingBg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Remove In-Game BG
                </Button>
                {removeBgTime && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    BG removed in {(removeBgTime / 1000).toFixed(2)} seconds.
                  </p>
                )}
              </div>
            )}
          </TestCard>

          {/* Recruit AI Character Test */}
          <TestCard
            title="Recruit AI Character"
            description="Generates a new random character and their images."
            isLoading={isLoadingRecruit}
            onGenerate={handleRecruitCharacter}
            time={recruitTime}
            icon={UserPlus}
          >
            <div className="flex gap-4">
                <ImageDisplay imageUrl={recruitProfileImage} title="Profile Image" />
                <ImageDisplay imageUrl={recruitInGameImage} title="In-Game Image" />
            </div>
          </TestCard>
          
          {/* Background Image Test */}
          <TestCard
            title="Background Scene"
            description="Generates a scenic background image."
            isLoading={isLoadingBackground}
            onGenerate={handleGenerateBackground}
            onPopulatePrompt={() => {}}
            prompt={backgroundPrompt}
            setPrompt={setBackgroundPrompt}
            time={backgroundTime}
            icon={Bot}
          >
            <ImageDisplay imageUrl={backgroundImage} imageSize={backgroundImageSize} />
          </TestCard>

          {/* Cover Image Test */}
          <TestCard
            title="Book Cover"
            description="Generates a story book cover."
            isLoading={isLoadingCover}
            onGenerate={handleGenerateCover}
            onPopulatePrompt={generateCoverPrompt}
            prompt={coverPrompt}
            setPrompt={setCoverPrompt}
            time={coverTime}
            icon={Book}
          >
             <ImageDisplay imageUrl={coverImage} imageSize={coverImageSize} />
          </TestCard>
      </div>
    </div>
  );
}

const ImageDisplay = ({ imageUrl, imageSize, title }: { imageUrl: string | null; imageSize?: { original: number, new: number } | null, title?: string }) => {
    if (!imageUrl) return null;

    return (
        <div className="space-y-2 flex-1">
            {title && <p className="text-sm font-semibold text-center">{title}</p>}
            <Image
                src={imageUrl}
                alt={title || "Generated Image"}
                width={512}
                height={768}
                className="rounded-md object-contain border bg-muted w-full"
            />
            <div className="text-xs text-muted-foreground text-center space-y-1">
                {imageSize && imageSize.original > 0 && (
                  <p>
                    Size: {formatBytes(imageSize.original)} → {formatBytes(imageSize.new)} (
                    {(((imageSize.original - imageSize.new) / imageSize.original) * 100).toFixed(1)}% smaller)
                  </p>
                )}
            </div>
        </div>
    );
};

interface TestCardProps {
    title: string;
    description: string;
    isLoading: boolean;
    onGenerate: () => void;
    onPopulatePrompt?: () => void;
    prompt?: string;
    setPrompt?: (value: string) => void;
    time: number | null;
    icon: React.ElementType;
    children?: React.ReactNode;
}

const TestCard = ({ title, description, isLoading, onGenerate, onPopulatePrompt, prompt, setPrompt, time, icon: Icon, children }: TestCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                {onPopulatePrompt && (
                  <Button onClick={onPopulatePrompt} variant="outline" className="flex-1">
                      Populate Prompt
                  </Button>
                )}
                <Button onClick={onGenerate} disabled={isLoading} className="flex-1">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon className="mr-2 h-4 w-4" />}
                    Generate
                </Button>
            </div>
            
            {isLoading && (
                <div className="aspect-[3/4] w-full flex items-center justify-center bg-muted rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            {time && (
              <p className="text-xs text-muted-foreground text-center">
                Generated in {(time / 1000).toFixed(2)} seconds.
              </p>
            )}

            {children}
            
            {prompt !== undefined && setPrompt && (
              <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt:</label>
                  <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-32 text-xs"
                  />
              </div>
            )}
        </CardContent>
    </Card>
);
