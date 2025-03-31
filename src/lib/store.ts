import { create } from 'zustand';
import { type CoreMessage } from 'ai';
import { type GameResponse, GameStateSchema, GameStatus } from '@/lib/schemas';

// Define the store state type
interface GameStore {
  // State
  messages: CoreMessage[];
  input: string;
  gameState: {
    currentEpisode: number;
    history: {
      episode: number;
      description: string;
      action: string;
    }[];
    gameStatus: typeof GameStatus._type;
  };
  currentResponse: GameResponse | null;
  isGameOver: boolean;
  isLoading: boolean;

  // Actions
  setInput: (input: string) => void;
  setMessages: (messages: CoreMessage[]) => void;
  addMessage: (message: CoreMessage) => void;
  setCurrentResponse: (response: GameResponse | null) => void;
  setGameOver: (isOver: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetGame: () => void;
  startGame: () => Promise<void>;
  handleUserInput: (input: string) => Promise<void>;
  handleOptionSelect: (option: { id: string; action: string; gameStatus?: string }) => Promise<void>;
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
      const newMessages: CoreMessage[] = [
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
      
      // Update state with full response data including gameState
      set((state) => ({
        gameState: data.gameState,
        currentResponse: data.response,
        messages: [
          ...newMessages,
          {
            role: 'assistant',
            content: data.response.state,
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