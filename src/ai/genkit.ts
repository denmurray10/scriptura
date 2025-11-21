
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// The Google AI plugin will automatically look for the GOOGLE_API_KEY 
// in your environment variables (e.g., in the .env file).
// By ensuring the .env is loaded by the package.json script, this standard
// configuration will now work correctly.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
