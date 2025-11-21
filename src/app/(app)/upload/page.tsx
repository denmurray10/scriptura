
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, ClipboardCopy, Video, FileImage } from 'lucide-react';
import { uploadDataUrlToFirebase } from '@/lib/firebase';
import Image from 'next/image';
import { compressImage, formatBytes } from '@/lib/utils';

export default function DevUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 20MB.",
        });
        return;
      }
      setSelectedFile(file);
      setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!preview || !selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    setIsLoading(true);
    try {
      let dataToUpload = preview;
      let originalSize = selectedFile.size;
      let finalSize = originalSize;

      // Only compress images
      if (mediaType === 'image') {
        dataToUpload = await compressImage(preview, { quality: 0.7, maxWidth: 1024, maxHeight: 1024 });
        const blob = await (await fetch(dataToUpload)).blob();
        finalSize = blob.size;
        toast({
          title: 'Image Compressed',
          description: `Size reduced from ${formatBytes(originalSize)} to ${formatBytes(finalSize)}.`,
        });
      }

      const url = await uploadDataUrlToFirebase(dataToUpload, 'dev-uploads');
      setUploadedUrl(url);
      toast({
        title: 'Upload Successful!',
        description: 'Your media has been uploaded. You can now copy the URL.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      toast({ title: 'URL Copied!' });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Developer Media Upload</h1>
        <p className="text-muted-foreground">A temporary utility to upload and get media URLs for development.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload a File</CardTitle>
          <CardDescription>Select an image or video, upload it to Firebase Storage, and get the URL back.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="dev-media-upload">Image or Video File</Label>
            <Input id="dev-media-upload" type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileChange} ref={fileInputRef} />
             <p className="text-xs text-muted-foreground">Max file size: 20MB. Images will be compressed, videos will not.</p>
          </div>

          {preview && selectedFile && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-sm aspect-video rounded-md border bg-muted flex items-center justify-center">
                  {mediaType === 'image' ? (
                     <Image src={preview} alt="Image preview" fill className="object-contain" />
                  ) : (
                    <video src={preview} controls className="w-full h-full rounded-md" />
                  )}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                File Size: {formatBytes(selectedFile.size)}
              </div>
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload to Firebase
              </Button>
            </div>
          )}
          
          {uploadedUrl && (
            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                <h3 className="font-semibold">Upload Complete!</h3>
                <p className="text-sm text-muted-foreground">Here is your Firebase Storage URL:</p>
                <div className="flex items-center gap-2">
                    <Input readOnly value={uploadedUrl} className="bg-background"/>
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
