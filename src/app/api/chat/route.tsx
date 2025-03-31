'use server';

import { CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ResponseSchema } from '@/lib/schemas';



// X.AI (Grok) client setup
const model = "gpt-4o-mini";
const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // baseURL: 'https://us-west-1.api.x.ai/v1',
});

// Generate game response with options
export async function POST(req: Request) {
  try {
    const { messages, gameState } = await req.json();
    
    const systemPrompt = `You are running a text-based dungeon adventure game. 
    For each turn, provide a narrative description of what the player sees or experiences, 
    and 2-4 options for what they can do next. 
    Some options should advance the story, while others might lead to danger or rewards.
    Track the number of steps the player has taken.
    When providing an option that would end the game (victory or death), mark it with isEndGame=true.
    The game should have a variety of possible endings with different scores.`;
    
    const {object} = await generateObject({
      model: client(model),
      messages,
      system: systemPrompt,
      schema: ResponseSchema,
      temperature: 0.7,
    });

    return Response.json(object);

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