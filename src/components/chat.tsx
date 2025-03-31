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
    resetGame
  } = useGameStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleUserInput(input);
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
          
          {/* Display game options if available, game is not over, and not loading */}
          {currentResponse && !isGameOver && !isLoading && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Choose an action:</div>
              <div className="space-y-2">
                {currentResponse.options.map((option, idx) => (
                  <Button 
                    key={option.id || idx}
                    variant={option.gameStatus && option.gameStatus !== 'ACTIVE' ? "destructive" : "outline"} 
                    className="w-full text-left justify-start"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.action}
                    {option.gameStatus && option.gameStatus !== 'ACTIVE' && " (End Game)"}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Display loading indicator when waiting for response */}
          {/* {isLoading && (
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground">Processing your action...</div>
            </div>
          )} */}
          
          {/* Display game over message if applicable */}
          {isGameOver && (
            <div className="mt-6 p-4 border border-orange-200 bg-orange-50 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">Game Over</h3>
              <p>Your adventure has ended after {gameState.currentEpisode} episodes.</p>
              <Button 
                onClick={resetGame}
                className="mt-4 h-300"
              >
                Start New Adventure
              </Button>
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
