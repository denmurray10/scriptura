
import axios from 'axios';

// CORRECTED: Use the specific endpoint for Stable Diffusion XL models
const GETIMG_API_URL = 'https://api.getimg.ai/v1/stable-diffusion-xl/text-to-image';

interface GetImgResponse {
  image: string; // base64 encoded image
  seed: number;
}

export async function generateImageWithGetImg(
  prompt: string,
  apiKey: string,
  width: number,
  height: number
): Promise<string> {
  if (!apiKey) {
    throw new Error('GETIMG_API_KEY is not configured.');
  }

  try {
    const response = await axios.post<GetImgResponse>(
      GETIMG_API_URL,
      {
        // CORRECTED: Explicitly set the model to realvis-xl-v4
        model: 'realvis-xl-v4', 
        prompt: prompt,
        negative_prompt: 'Disfigured, cartoon, blurry, ugly, deformed, text, watermark',
        width: width,
        height: height,
        steps: 25,
        guidance: 7.5,
        output_format: 'jpeg',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data || !response.data.image) {
      throw new Error('Invalid response from getimg.ai API: missing image data.');
    }

    return `data:image/jpeg;base64,${response.data.image}`;
  } catch (error: any) {
    console.error('Error calling getimg.ai API:', error.response?.data || error.message);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      let errorMessage = data?.error?.message || data?.msg || JSON.stringify(data);

      if (status === 401) {
        errorMessage = 'Invalid API key. Please check your GETIMG_API_KEY.';
      } else if (status === 402) {
        errorMessage = 'Insufficient credits. Please check your getimg.ai account balance.';
      } else if (status === 422) {
        // This is the "Invalid model" error case.
        errorMessage = `Invalid parameters sent to getimg.ai: ${errorMessage}`;
      } else if (status >= 500) {
        errorMessage = `getimg.ai server error: ${errorMessage}`;
      }
      throw new Error(`Failed to process the request with getimg.ai: ${errorMessage}`);
    }

    throw new Error(`Failed to process the request with getimg.ai: ${error.message || 'An unknown network error occurred'}`);
  }
}
