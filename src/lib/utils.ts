
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { femaleFirstNames, maleFirstNames, surnames } from "./names";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBase64Size(dataUrl: string): number {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return 0;
  }
  const base64 = dataUrl.split(',')[1];
  if (!base64) {
    return 0;
  }
  // The formula for Base64 size is (n * 3/4) - padding
  const padding = (base64.match(/(=*)$/) || [])[1]?.length || 0;
  return (base64.length * 3) / 4 - padding;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function compressImage(
  dataUrl: string,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        return resolve(dataUrl); // Pass through on server
    }

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return reject(new Error('Invalid data URL provided for compression.'));
    }

    // Check if the file is an SVG or Video. If so, don't compress it.
    if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.startsWith('data:video/')) {
      return resolve(dataUrl);
    }
    
    const { quality = 0.7, maxWidth = 1024, maxHeight = 1024 } = options;

    const image = new Image();
    image.src = dataUrl;

    image.onload = () => {
      let { width, height } = image;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context.'));
      }

      ctx.drawImage(image, 0, 0, width, height);
      
      // Convert to WebP for better compression
      const compressedDataUrl = canvas.toDataURL('image/webp', quality);

      resolve(compressedDataUrl);
    };

    image.onerror = (error) => {
      console.error("Image loading error for compression:", error);
      reject(new Error("Could not load image for compression."));
    };
  });
}

/**
 * Generates a unique character name from predefined lists.
 * @param sex The desired sex for the first name. If undefined, a random sex is chosen.
 * @param existingNames An array of names that are already in use.
 * @returns A unique full name string.
 */
export function generateUniqueCharacterName(
  sex: 'Male' | 'Female' | undefined,
  existingNames: string[]
): string {
  const chosenSex = sex || (Math.random() < 0.5 ? 'Male' : 'Female');
  const firstNames = chosenSex === 'Male' ? maleFirstNames : femaleFirstNames;
  
  let attempts = 0;
  while (attempts < 50) { // Safety break to prevent infinite loops
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const fullName = `${firstName} ${surname}`;

    if (!existingNames.includes(fullName)) {
      return fullName;
    }
    attempts++;
  }

  // Fallback for the rare case of collision after many attempts
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}_${Date.now()}`;
}

/**
 * Sanitizes a potentially duplicated URL.
 * It looks for the 'https' pattern and keeps only the last occurrence if multiple are found.
 * @param url The URL string to sanitize.
 * @returns A sanitized URL string.
 */
export function sanitizeUrl(url: string | undefined | null): string {
    if (!url) return '';
    const parts = url.split('https://');
    if (parts.length <= 2) {
        return url; // It's a normal URL or doesn't have the duplicate pattern
    }
    // Reconstruct the URL with only the last valid part
    return `https://${parts[parts.length - 1]}`;
}
