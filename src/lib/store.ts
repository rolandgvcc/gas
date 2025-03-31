import { create } from 'zustand';
import { 
  AIMessage, 
  GameStateType, 
  GameResponseType, 
  GameAction,
} from './types';

interface GameStore {
  // State
  messages: AIMessage[];
  input: string;
  gameState: GameStateType;
  currentResponse: GameResponseType | null;
  isGameOver: boolean;
  isLoading: boolean;

  // Actions
  setInput: (input: string) => void;
  setMessages: (messages: AIMessage[]) => void;
  addMessage: (message: AIMessage) => void;
  setCurrentResponse: (response: GameResponseType | null) => void;
  setGameOver: (isOver: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetGame: () => void;
  startGame: () => Promise<void>;
  handleUserInput: (input: string) => Promise<void>;
  handleOptionSelect: (option: GameAction) => Promise<void>;
}

// Create the store
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state with simplified gameState
  messages: [],
  input: '',
  gameState: {
    currentEpisode: 0,
    history: [],
    gameStatus: 'ACTIVE',
  },
  currentResponse: null,
  isGameOver: false,
  isLoading: false,

  // Simple actions
  setInput: (input) => set({ input }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setCurrentResponse: (response) => set({ currentResponse: response }),
  setGameOver: (isOver) => set({ isGameOver: isOver }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Reset game state
  resetGame: () => set({ 
    messages: [], 
    gameState: {
      currentEpisode: 0,
      history: [],
      gameStatus: 'ACTIVE',
    }, 
    currentResponse: null, 
    isGameOver: false,
    isLoading: false
  }),

  // Complex actions
  startGame: async () => {
    try {
      const newMessages: AIMessage[] = [
        { role: 'user', content: 'I want to start a dungeon adventure.' }
      ];
      
      set({ messages: newMessages });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState: get().gameState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const data = await response.json();
      
      // Update state with full response data including image
      set((state) => ({
        gameState: data.gameState,
        currentResponse: data.response,
        messages: [
          ...newMessages,
          {
            role: 'assistant',
            content: data.response.state,
            imageData: data.response.imageData,
          },
        ],
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  },

  handleUserInput: async (userInput) => {
    if (!userInput.trim()) return;
    
    const state = get();
    const userMessage = { content: userInput, role: 'user' as const };
    const newMessages = [...state.messages, userMessage];
    
    set({ messages: newMessages, input: '' });
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState: state.gameState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const data = await response.json();
      
      // Update state
      set((state) => ({
        gameState: data.gameState,
        currentResponse: data.response,
        messages: [
          ...newMessages,
          {
            role: 'assistant',
            content: data.response.state,
            imageData: data.response.imageData,
          },
        ],
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  },

  handleOptionSelect: async (option) => {
    const state = get();
    
    // Don't allow further actions if game is over
    if (state.isGameOver) return;
    
    // Set loading to true while waiting for response
    set({ isLoading: true });
    
    const userMessage = { content: option.action, role: 'user' as const };
    const newMessages = [...state.messages, userMessage];
    
    set({ messages: newMessages });
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          gameState: {
            ...state.gameState,
            history: state.gameState.history ? [...state.gameState.history] : []
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const data = await response.json();
      
      // Update state
      set((state) => ({
        gameState: data.gameState,
        currentResponse: data.response,
        messages: [
          ...newMessages,
          {
            role: 'assistant',
            content: data.response.state,
            imageData: data.response.imageData,
          },
        ],
        // Set game over if option leads to end
        isGameOver: option.gameStatus !== undefined && option.gameStatus !== 'ACTIVE',
        isLoading: false, // Set loading back to false
      }));
    } catch (error) {
      console.error('Error:', error);
      set({ isLoading: false }); // Make sure loading is set to false even on error
    }
  },
})); 