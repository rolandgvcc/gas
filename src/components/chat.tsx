'use client';

import { Card } from "@/components/ui/card"
import { type CoreMessage } from 'ai';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconArrowUp } from '@/components/ui/icons';
import Link from "next/link";
import AboutCard from "@/components/cards/aboutcard";
import { z } from 'zod';
import { ResponseSchema } from '@/lib/schemas';

export const maxDuration = 30;

// Define a type for our game state
type GameState = {
  steps: number;
  // Add other game state properties as needed
};

// Define a type for our structured response
type GameResponse = z.infer<typeof ResponseSchema>;

export default function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({ steps: 0 });
  const [currentResponse, setCurrentResponse] = useState<GameResponse | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  
  const startGame = async () => {
    try {
      // Create initial system message to start the game
      const newMessages: CoreMessage[] = [
        { role: 'user', content: 'I want to start a dungeon adventure.' }
      ];
      
      setMessages(newMessages);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const gameResponse: GameResponse = await response.json();
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        steps: prev.steps + 1,
      }));
      
      // Set the current response
      setCurrentResponse(gameResponse);
      
      // Add AI response to messages
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: gameResponse.episodeDescription,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = { content: input, role: 'user' };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const gameResponse: GameResponse = await response.json();
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        steps: prev.steps + 1,
      }));
      
      // Set the current response
      setCurrentResponse(gameResponse);
      
      // Add AI response to messages
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: gameResponse.episodeDescription,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOptionSelect = async (option: { action: string; isEndGame: boolean }) => {
    // Don't allow further actions if game is over
    if (isGameOver) return;
    
    const userMessage = { content: option.action, role: 'user' };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const gameResponse: GameResponse = await response.json();
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        steps: prev.steps + 1,
      }));
      
      // Set the current response
      setCurrentResponse(gameResponse);
      
      // Add AI response to messages
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: gameResponse.episodeDescription,
        },
      ]);
      
      // Handle end game scenario if needed
      if (option.isEndGame) {
        setIsGameOver(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (    
    <div className="group w-full overflow-auto">
      {messages.length <= 0 ? ( 
        <div className="max-w-xl mx-auto mt-10">
          <AboutCard />
          <div className="mt-6 text-center">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="px-8"
            >
              Begin Adventure
            </Button>
          </div>
        </div>  
      ) : (
        <div className="max-w-xl mx-auto mt-10 mb-24">
          {/* Display chat messages */}
          {messages.map((message, index) => (
            <div key={index} className="whitespace-pre-wrap flex mb-5">
              <div className={`${message.role === 'user' ? 'bg-muted ml-auto' : 'bg-transparent'} p-2 rounded-lg`}>
                {message.content as string}
              </div>
            </div>
          ))}
          
          {/* Display game options if available and game is not over */}
          {currentResponse && !isGameOver && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Choose an action:</div>
              <div className="space-y-2">
                {currentResponse.options.map((option, idx) => (
                  <Button 
                    key={idx}
                    variant={option.isEndGame ? "destructive" : "outline"} 
                    className="w-full text-left justify-start"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.action}
                    {option.isEndGame && " (End Game)"}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Display game over message if applicable */}
          {isGameOver && (
            <div className="mt-6 p-4 border border-orange-200 bg-orange-50 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">Game Over</h3>
              <p>Your adventure has ended after {gameState.steps} steps.</p>
              <Button 
                onClick={() => {
                  setMessages([]);
                  setGameState({ steps: 0 });
                  setCurrentResponse(null);
                  setIsGameOver(false);
                }}
                className="mt-4 h-300"
              >
                Start New Adventure
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Input field - only show when game isn't over */}
      {!isGameOver && (
        <div className="fixed inset-x-0 bottom-10 w-full">
          <div className="w-full max-w-xl mx-auto">
            <Card className="p-2">
              <form onSubmit={handleSubmit}>
                <div className="flex">
                  <Input
                    type="text"
                    value={input}
                    onChange={event => {
                      setInput(event.target.value);
                    }}
                    className="w-[95%] mr-2 border-0 ring-offset-0 focus-visible:ring-0 focus-visible:outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:border-none border-transparent focus:border-transparent focus-visible:ring-none"
                    placeholder='What would you like to do?'
                  />
                  <Button disabled={!input.trim()}>
                    <IconArrowUp />
                  </Button>
                </div>
                {messages.length > 1 && (
                  <div className="text-center">
                    <Link href="/genui" className="text-xs text-blue-400">Try GenUI and streaming components &rarr;</Link>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
