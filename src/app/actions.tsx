'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Weather } from '@/components/weather';
import { generateText } from 'ai';
import { createStreamableUI } from 'ai/rsc';
import { ReactNode } from 'react';
import { z } from 'zod';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
}

const grokText = "grok-3-beta"
const grokImage = "grok-2-image"
const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://us-west-1.api.x.ai/v1',
});


// Streaming Chat 
export async function continueTextConversation(messages: CoreMessage[]) {
  const result = await streamText({
    model: client(grokText),
    messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}

// Gen UIs 
export async function continueConversation(history: Message[]) {
  const stream = createStreamableUI();

  const { text, toolResults } = await generateText({
    model: client(grokText),
    system: 'You are a friendly weather assistant!',
    messages: history,
    tools: {
      showWeather: {
        description: 'Show the weather for a given location.',
        parameters: z.object({
          city: z.string().describe('The city to show the weather for.'),
          unit: z
            .enum(['F'])
            .describe('The unit to display the temperature in'),
        }),
        execute: async ({ city, unit }) => {
          stream.done(<Weather city={city} unit={unit} />);
          return `Here's the weather for ${city}!`; 
        },
      },
    },
  });

  return {
    messages: [
      ...history,
      {
        role: 'assistant' as const,
        content:
          text || toolResults.map(toolResult => toolResult.result).join(),
        display: stream.value,
      },
    ],
  };
}

// Utils
export async function checkAIAvailability() {
  const envVarExists = !!process.env.OPENAI_API_KEY;
  return envVarExists;
}