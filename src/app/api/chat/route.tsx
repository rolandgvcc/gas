'use server';

import { CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ResponseSchema, GameStateSchema } from '@/lib/schemas';
import { GAME_IMAGE_PROMPT, GAME_SYSTEM_PROMPT } from '@/lib/prompts';

// OpenAI client setup
const model = "grok-3-beta";
const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://us-west-1.api.x.ai/v1",
});

// Add image generation function
async function generateImage(prompt: string) {
  const imagePrompt = GAME_IMAGE_PROMPT + " " + prompt
  try {
    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: imagePrompt,
        response_format: "b64_json",
        n: 1
      })
    });
    
    if (!response.ok) {
      console.error('Image API response error:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.data[0].b64_json;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Generate game response with options
export async function POST(req: Request) {
  try {
    const { messages, gameState } = await req.json();
    
    const {object} = await generateObject({
      model: client(model),
      messages,
      system: GAME_SYSTEM_PROMPT,
      schema: ResponseSchema,
      temperature: 0.7,
    });

    // Generate an image based on the current game state
    const imageData = await generateImage(object.imagePrompt);
    
    // Include the image URL in the object response
    const responseWithImage = {
      ...object,
      imageData: imageData
    };

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
      response: responseWithImage,
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