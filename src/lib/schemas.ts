import { z } from 'zod';

// Define possible game states
export const GameStatus = z.enum([
  'ACTIVE',       // Game in progress
  'VICTORY',      // Player won
  'DEATH',        // Player died
]);

// Simplified action schema with just the essentials
export const ActionSchema = z.object({
  id: z.string().describe('Unique identifier for this action'),
  action: z.string().describe('The action description shown to the user'),
  gameStatus: GameStatus.optional().default('ACTIVE').describe('What game state results from this action'),
});

// Simplified schema for structured AI response
export const ResponseSchema = z.object({
  state: z.string().describe('The current game state description for the user to read'),
  options: z.array(ActionSchema).min(1).max(4).describe('Available actions for the user to choose from'),
  // The imageUrl will be added after generation, not from the AI response
});

// Minimal game state for tracking progress
export const GameStateSchema = z.object({
  currentEpisode: z.number().default(1).describe('Current episode/turn number'),
  history: z.array(z.object({
    episode: z.number(),
    description: z.string(),
    action: z.string(),
  })).default([]).describe('History of past episodes and chosen actions'),
  gameStatus: GameStatus.default('ACTIVE'),
});

// Define GameResponse type used in the store
export type GameResponse = z.infer<typeof ResponseSchema>;

