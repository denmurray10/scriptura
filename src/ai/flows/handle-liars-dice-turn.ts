
'use server';

/**
 * @fileoverview A flow for handling an NPC's turn in a game of Liar's Dice.
 * - handleLiarsDiceTurn - A function that decides the NPC's next move.
 */

import { ai } from '@/ai/genkit';
import {
  HandleLiarsDiceTurnInputSchema,
  HandleLiarsDiceTurnOutputSchema,
  type HandleLiarsDiceTurnInput,
  type HandleLiarsDiceTurnOutput,
} from '@/lib/ai-schemas';

const liarDicePrompt = ai.definePrompt({
  name: 'liarsDicePrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: HandleLiarsDiceTurnInputSchema },
  output: { schema: HandleLiarsDiceTurnOutputSchema },
  prompt: `You are an AI opponent in a game of Liar's Dice, roleplaying as {{npcName}}. Your task is to make a strategic move based on your dice and the current bid.

  **Game Rules:**
  - Ones are wild and count as any number when counting dice for a bid.
  - A new bid must be higher in quantity, or the same quantity with a higher face value.
  - You can either raise the bid or challenge the previous bid.

  **Your Situation:**
  - **Your Dice (Secret):** {{#each npcDice}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  - **Total Dice on Table:** {{totalDiceInPlay}}
  - **Player's Current Bid:** {{#if currentBid}}{{currentBid.quantity}} x {{currentBid.value}}'s{{else}}None (you are making the first bid){{/if}}

  **Your Task:**
  1.  **Analyze the Bid:** Based on your dice and the total number of dice, estimate the probability of the player's bid being true.
      - Count your dice that match the bid's value, plus any 1s (wilds).
      - Estimate how many more matching dice the player might have.
  2.  **Decide Your Action:**
      - If you think the bid is very likely false, your action should be 'challenge'.
      - If you think the bid could be true, or you want to bluff, your action should be 'bid'.
  3.  **If Bidding:**
      - Your new bid MUST be higher than the current bid (higher quantity, or same quantity with higher value).
      - Make a plausible but strategic bid. Don't make it impossible, but push the player.
  4.  **Generate Dialogue:** Write a short, in-character line of dialogue that fits your action (e.g., a confident taunt, a skeptical remark, a simple statement of your bid).

  Provide your response in the required structured format.
  `,
});

export async function handleLiarsDiceTurn(input: HandleLiarsDiceTurnInput): Promise<HandleLiarsDiceTurnOutput> {
  try {
    const { output } = await liarDicePrompt(input);
    if (!output) {
      throw new Error("The AI returned an empty or invalid output for the Liar's Dice turn.");
    }
    return output;
  } catch (e) {
    console.error('Error in handleLiarsDiceTurn flow:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
    throw new Error(`AI call in handleLiarsDiceTurn failed: ${errorMessage}`);
  }
}
