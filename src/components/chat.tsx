'use client';

import { Card } from "@/components/ui/card"
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconArrowUp } from '@/components/ui/icons';
import Link from "next/link";
import AboutCard from "@/components/cards/aboutcard";
import { useGameStore } from '@/lib/store';

export const maxDuration = 30;

export default function Chat() {
  // Use the game store instead of local state
  const {
    messages,
    input,
    gameState,
    currentResponse,
    isGameOver,
    isLoading,
    setInput,
    startGame,
    handleUserInput,
    handleOptionSelect,
    resetGame,
    preGeneratedResponses,
    selectedOptionId
  } = useGameStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleUserInput(input);
  };
  
  // Calculate pre-generation progress
  const preGenerationProgress = currentResponse?.options ? 
    currentResponse.options.filter(opt => preGeneratedResponses[opt.id]).length / 
    currentResponse.options.length : 0;
  
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
          {/* Display chat messages with images */}
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`p-4 rounded-lg ${
                message.role === 'user' ? 'bg-primary/10 ml-12' : 'bg-muted mr-12'
              }`}>
                {/* Message content */}
                <div className="prose dark:prose-invert">
                  {message.content}
                </div>
                
                {/* Show image if available (for assistant messages only) */}
                {message.role === 'assistant' && ( message.imageData) && (
                  <div className="mt-3">
                    <img 
                      src={`data:image/jpeg;base64,${message.imageData}`}
                      alt="Scene illustration" 
                      className="rounded-md w-full shadow-md hover:shadow-lg transition-shadow duration-200"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Game options */}
          {currentResponse && currentResponse.options && currentResponse.options.length > 0 && !isGameOver && !isLoading && (
            <div className="mt-6 flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">Choose your next action:</h3>
              {currentResponse.options.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isLoading || selectedOptionId === option.id}
                  className={`text-left justify-start h-auto py-3 px-4 ${
                    selectedOptionId === option.id ? 'bg-primary/20' : ''
                  }`}
                  variant="outline"
                >
                  {option.action}
                  {selectedOptionId === option.id && (
                    <span className="ml-2 animate-pulse">...</span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Input field - only show when game isn't over */}
      {/* {!isGameOver && (
        <div className="fixed inset-x-0 bottom-10 w-full">
          <div className="w-full max-w-xl mx-auto">
            <Card className="p-2">
              <form onSubmit={handleSubmit}>
                <div className="flex">
                  <Input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="w-[95%] mr-2 border-0 ring-offset-0 focus-visible:ring-0 focus-visible:outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:border-none border-transparent focus:border-transparent focus-visible:ring-none"
                    placeholder='What would you like to do?'
                  />
                  <Button disabled={!input.trim()}>
                    <IconArrowUp />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )} */}
    </div>
  );
}
