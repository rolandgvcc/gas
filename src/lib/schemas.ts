import { z } from 'zod';


const ActionSchema = z.object({
  action: z.string().describe('The action the user can take in this game episode.'),
  isEndGame: z.boolean().describe('Whether this action will terminate the game.'),
});

// Zod schema for structured AI outputs
export const ResponseSchema = z.object({
  thinking: z.string().describe('Reflect on the game step, plan the episode and possible outcomes.'),
  episodeDescription: z.string().describe('The current game episode description for the user to read.'),
  options: z.array(ActionSchema).describe('Up to 3 options for the user to choose from.'),
});


