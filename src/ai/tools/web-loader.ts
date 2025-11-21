
'use server';
/**
 * @fileOverview A Genkit tool for fetching and parsing content from a web page.
 *
 * - webLoader - A tool that takes a URL and returns the text content of the page.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { JSDOM } from 'jsdom';

export const webLoader = ai.defineTool(
  {
    name: 'webLoader',
    description: 'Fetches the text content of a given web page URL. Useful for summarizing articles or getting information from a specific link.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL of the web page to load.'),
    }),
    outputSchema: z.string().describe('The extracted text content of the web page.'),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
      }
      const html = await response.text();
      
      // Use JSDOM to parse the HTML and extract text content
      const dom = new JSDOM(html);
      
      // Remove script and style elements to clean up the content
      dom.window.document.querySelectorAll('script, style').forEach(el => el.remove());
      
      const textContent = dom.window.document.body.textContent || "";
      
      // Clean up whitespace and line breaks
      return textContent.replace(/\s\s+/g, ' ').trim();

    } catch (error) {
      console.error('Error in webLoader tool:', error);
      // Return a user-friendly error message that the LLM can understand
      return `Error: Could not load the content from the provided URL. The page might be inaccessible or the URL could be invalid.`;
    }
  }
);
