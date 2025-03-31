import { z } from 'zod';
import { GameStatus, ResponseSchema, GameStateSchema } from './schemas';

// Message types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  imageData?: string;
}

// Game state types
export type GameStatusType = z.infer<typeof GameStatus>;
export type GameStateType = z.infer<typeof GameStateSchema>;
export type GameResponseType = z.infer<typeof ResponseSchema>;

// Action types
export interface GameAction {
  id: string;
  action: string;
  gameStatus?: GameStatusType;
}

// API Response types
export interface APIResponse {
  response: GameResponseType & {
    imageData?: string;
  };
  gameState: GameStateType;
}
