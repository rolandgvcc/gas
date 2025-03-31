'use server';

import { CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ResponseSchema, GameStateSchema } from '@/lib/schemas';

// OpenAI client setup
const model = "gpt-4o-mini";
const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate game response with options
export async function POST(req: Request) {
  try {
    const { messages, gameState } = await req.json();
    
    const systemPrompt = `You are running a text-based dungeon adventure game.
    For each turn, provide a narrative description of what the player sees or experiences,
    and 3 options for what they can do next. Some options should advance the story, while others might lead to danger or rewards. 
    One of the options will result in the user's death, which will end the game.
    
    The game should have a variety of possible endings with different scores.
    Be creative with the story and include challenges, puzzles, and interesting choices.`;
    
    const {object} = await generateObject({
      model: client(model),
      messages,
      system: systemPrompt,
      schema: ResponseSchema,
      temperature: 0.7,
    });

    // Create a default gameState if none provided
    let updatedGameState = null;
    
    if (gameState) {
      // Safely update gameState, ensuring history exists
      updatedGameState = {
        ...gameState,
        currentEpisode: gameState.currentEpisode ? gameState.currentEpisode + 1 : 1,
        history: gameState.history ? [
          ...gameState.history,
          {
            episode: gameState.currentEpisode || 0,
            description: object.state,
            action: "pending", // Will be updated once user selects an action
          }
        ] : [{
          episode: 0,
          description: object.state,
          action: "start",
        }],
        gameStatus: object.options.some(opt => opt.gameStatus !== 'ACTIVE') ? 
          object.options.find(opt => opt.gameStatus !== 'ACTIVE')?.gameStatus : 
          'ACTIVE'
      };
    } else {
      // Initialize a new gameState if none was provided
      updatedGameState = GameStateSchema.parse({
        currentEpisode: 1,
        history: [{
          episode: 0,
          description: object.state,
          action: "start",
        }],
        gameStatus: 'ACTIVE'
      });
    }

    return Response.json({
      response: object,
      gameState: updatedGameState
    });

  } catch (error: any) {
    console.error('API error:', error);
    throw error;
  }
}

// Utils
export async function checkAIAvailability() {
  const envVarExists = !!process.env.OPENAI_API_KEY;
  return envVarExists;
}