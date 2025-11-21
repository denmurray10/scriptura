
'use server';

/**
 * @fileoverview A flow for generating a hint for a player in Liar's Dice.
 * - generateLiarsDiceHint - A function that provides a strategic recommendation.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateLiarsDiceHintInputSchema,
  GenerateLiarsDiceHintOutputSchema,
  type GenerateLiarsDiceHintInput,
  type GenerateLiarsDiceHintOutput,
} from '@/lib/ai-schemas';

const liarsDiceHintPrompt = ai.definePrompt({
  name: 'liarsDiceHintPrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: GenerateLiarsDiceHintInputSchema },
  output: { schema: GenerateLiarsDiceHintOutputSchema },
  prompt: `You are a master strategist and probability expert, acting as a helpful advisor to a player in a game of Liar's Dice.

  **Game Rules Reminder:**
  - Ones are wild and count as any number.
  - A new bid must be higher in quantity, or the same quantity with a higher face value.

  **Current Game State:**
  - **Player's Dice (Secret):** {{#each playerDice}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  - **Total Dice on Table (Player + All Opponents):** {{totalDiceInPlay}}
  - **Opponent's Current Bid:** {{currentBid.quantity}} x {{currentBid.value}}'s

  **Your Task:**
  1.  **Analyze the Situation:** Based on the player's dice and the total number of dice in play, estimate the probability of the opponent's bid being true.
      - Count how many of the bid's value the player has in their hand (including any 1s as wilds).
      - On average, one-third of the remaining hidden dice will match the bid (either by being the same number or by being a wild '1').
      - Calculate the most likely total count of the bid value on the table.
  2.  **Formulate a Recommendation:** Based on your analysis, provide a concise, helpful recommendation.
      - If the bid seems plausible or likely, suggest raising the bid or making a safe alternative bid.
      - If the bid seems statistically unlikely or impossible, suggest challenging it.
      - Frame your advice clearly and simply.

  Example Recommendations:
  - "Challenging seems risky. You already have two 5s, so their bid is quite plausible. Maybe raise the bid slightly."
  - "That's a high bid. Statistically, there are probably only three 6s on the table. You might want to challenge."
  - "A safe bet would be to increase the quantity by one and bid on a value you have, like 2s."

  Provide a helpful recommendation for the player now.
  `,
});

export async function generateLiarsDiceHint(input: GenerateLiarsDiceHintInput): Promise<GenerateLiarsDiceHintOutput> {
  try {
    const { output } = await liarsDiceHintPrompt(input);
    if (!output) {
      throw new Error("The AI returned an empty or invalid output for the Liar's Dice hint.");
    }
    return output;
  } catch (e) {
    console.error('Error in generateLiarsDiceHint flow:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
    throw new Error(`AI call in generateLiarsDiceHint failed: ${errorMessage}`);
  }
}
