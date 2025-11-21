
'use server';

/**
 * @fileoverview A flow for handling a turn in the haggling mini-game.
 * - handleHagglingTurn - A function that processes a player's offer.
 */

import { ai } from '@/ai/genkit';
import {
  HandleHagglingTurnInputSchema,
  HandleHagglingTurnOutputSchema,
  type HandleHagglingTurnInput,
  type HandleHagglingTurnOutput,
} from '@/lib/ai-schemas';
import { z } from 'zod';


// The AI's responsibility is now ONLY to generate dialogue and patience damage.
// The final decision on whether the deal is made is handled in the calling code.
const HagglingAiOutputSchema = z.object({
  dialogue: z.string().describe("The NPC's reaction to the player's offer. This should be a clever counter-offer or a reaction. It must NOT be a final acceptance, as that is handled by the calling code."),
  patienceDamage: z.number().describe("The amount of patience the NPC loses due to the offer."),
});


export async function handleHagglingTurn(
  input: HandleHagglingTurnInput
): Promise<HandleHagglingTurnOutput> {
  // This function now acts as a wrapper.
  // It calls the AI, then applies the strict game logic.
  
  const { playerOffer, targetPrice } = input;
  
  // *** CORE LOGIC MOVED HERE - NO LONGER RELYING ON AI ***
  if (playerOffer >= targetPrice) {
    return {
      dialogue: "Yes, that's a fair price. A pleasure doing business with you!",
      patienceDamage: 0,
      isDeal: true,
    };
  }

  // If the offer is not accepted, THEN we ask the AI for dialogue.
  try {
      const { output } = await hagglingPrompt(input);
      if (!output) {
          throw new Error("The AI returned an empty or invalid output.");
      }
      
      const newPatience = input.patience - output.patienceDamage;

      // Check for patience loss
      if (newPatience <= 0) {
          return {
              dialogue: "Enough! I'm done with this conversation. The deal is off.",
              patienceDamage: output.patienceDamage,
              isDeal: false,
          }
      }

      // If the game continues, return the AI's response.
      return {
          ...output,
          isDeal: false,
      };

  } catch (e) {
      console.error('Error in handleHagglingTurn flow:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
      throw new Error(`AI call in handleHagglingTurn failed: ${errorMessage}`);
  }
}


const hagglingPrompt = ai.definePrompt({
  name: 'hagglingDialoguePrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: HandleHagglingTurnInputSchema },
  output: { schema: HagglingAiOutputSchema },
  prompt: `You are an AI for a haggling mini-game. You will play the role of the NPC, {{npcName}}, who is trying to sell the "{{item.name}}".
  The negotiation is ongoing because the player's offer was too low.

  **Game State:**
  - Player's Current Offer: {{playerOffer}} Gold
  - NPC's Current Patience: {{patience}}%
  - NPC's Secret Target Price: {{targetPrice}} Gold. **CRUCIAL: You MUST NOT reveal this number or mention a "target price," "bottom line," or any specific minimum value in your dialogue.**

  **YOUR TASK:**
  1.  **Calculate Patience Damage:**
      - If the offer is a lowball (less than 50% of the target), patience damage is high (20-30%).
      - If the offer is absurdly high (more than 200% of the target), patience damage is also high (20-30%).
      - Otherwise, patience damage is moderate (5-15%).

  2.  **Generate Dialogue:** Write a short, in-character response to the player's offer. Your dialogue should be a reaction or a clever counter-offer.
      - **CRUCIAL COUNTER-OFFER RULE:** Your counter-offer must ALWAYS be higher than the player's current offer, but it must be less than your previous counter-offer if you've made one. For example, if you previously offered 80, your next counter-offer cannot be 80 or higher. You must never go back up in price.
      - Your dialogue MUST reflect your current patience level (e.g., more annoyed if patience is low).
      - Do NOT write a final acceptance dialogue. That is handled elsewhere.
      
  Provide the output in the required structured format.
  `,
});
