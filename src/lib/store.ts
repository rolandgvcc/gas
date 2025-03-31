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
  preGeneratedResponses: Record<string, APIResponse>;
  selectedOptionId: string | null;
  pendingOptionsBeingGenerated: string[];

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
  generateResponsesForOptions: () => void;
}

// Create the store
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state with new fields
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
  preGeneratedResponses: {},
  selectedOptionId: null,
  pendingOptionsBeingGenerated: [],

  // Simple actions
  setInput: (input) => set({ input }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setCurrentResponse: (response) => set({ currentResponse: response }),
  setGameOver: (isOver) => set({ isGameOver: isOver }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Reset game state - update to include new state properties
  resetGame: () => set({ 
    messages: [], 
    gameState: {
      currentEpisode: 0,
      history: [],
      gameStatus: 'ACTIVE',
    }, 
    currentResponse: null, 
    isGameOver: false,
    isLoading: false,
    selectedOptionId: null,
    pendingOptionsBeingGenerated: [],
    preGeneratedResponses: {},
  }),

  // Complex actions
  startGame: async () => {
    try {
      const newMessages: AIMessage[] = [
        { role: 'user', content: 'Let\'s begin.' }
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
        preGeneratedResponses: {},
      }));
      
      // Start pre-generating responses for the new options
      get().generateResponsesForOptions();
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
        preGeneratedResponses: {},
      }));
      
      // Start pre-generating responses for the new options
      get().generateResponsesForOptions();
    } catch (error) {
      console.error('Error:', error);
    }
  },

  handleOptionSelect: async (option) => {
    const state = get();
    
    // Don't allow further actions if game is over
    if (state.isGameOver) return;
    
    // Create user message
    const userMessage = { content: option.action, role: 'user' as const };
    const newMessages = [...state.messages, userMessage];
    
    // Show the user's selection immediately and set loading state
    set({ 
      messages: newMessages,
      isLoading: true,
      selectedOptionId: option.id  // Track which option was selected
    });
    
    try {
      // Check if we have a pre-generated response
      const preGenerated = state.preGeneratedResponses[option.id];
      
      if (preGenerated) {
        // Use the pre-generated response
        set((state) => ({
          gameState: preGenerated.gameState,
          currentResponse: preGenerated.response,
          messages: [
            ...newMessages,
            {
              role: 'assistant',
              content: preGenerated.response.state,
              imageData: preGenerated.response.imageData,
            },
          ],
          isGameOver: option.gameStatus !== undefined && option.gameStatus !== 'ACTIVE',
          isLoading: false,
          selectedOptionId: null,
          preGeneratedResponses: {},
        }));
        
        // Start pre-generating responses for the new options
        setTimeout(() => get().generateResponsesForOptions(), 0);
        return;
      }
      
      // If we don't have a pre-generated response but it's currently being generated
      if (state.pendingOptionsBeingGenerated.includes(option.id)) {
        // Just wait for the background process to complete - we already set the UI to show loading
        // The background process will update the state when complete
        return;
      }
      
      // If no pre-generated response and not currently generating, proceed with regular API call
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
        preGeneratedResponses: {},
        isLoading: false,
        selectedOptionId: null,
      }));
      
      // Start pre-generating responses for the new options
      get().generateResponsesForOptions();
    } catch (error) {
      console.error('Error:', error);
      set({ isLoading: false, selectedOptionId: null });
    }
  },

  // Add function to pre-generate responses for all current options
  generateResponsesForOptions: () => {
    const state = get();
    if (!state.currentResponse?.options?.length) return;
    
    // Track which options are being generated
    const optionsToGenerate = state.currentResponse.options
      .filter(option => !state.preGeneratedResponses[option.id])
      .map(option => option.id);
    
    if (optionsToGenerate.length === 0) return;
    
    // Update the pending options list
    set(state => ({
      pendingOptionsBeingGenerated: [
        ...state.pendingOptionsBeingGenerated,
        ...optionsToGenerate
      ]
    }));
    
    // For each option, generate a response in the background
    state.currentResponse.options.forEach(option => {
      const userMessage = { content: option.action, role: 'user' as const };
      const newMessages = [...state.messages, userMessage];
      
      // Skip if we already have this option pre-generated
      if (state.preGeneratedResponses[option.id]) return;
      
      // Generate response in background
      fetch('/api/chat', {
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
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch response');
        return response.json();
      })
      .then(data => {
        const currentState = get();
        
        // Store the pre-generated response
        set(state => ({
          preGeneratedResponses: {
            ...state.preGeneratedResponses,
            [option.id]: data
          },
          pendingOptionsBeingGenerated: state.pendingOptionsBeingGenerated.filter(id => id !== option.id)
        }));
        
        // If this is the option the user selected, apply it immediately
        if (currentState.selectedOptionId === option.id) {
          const userMsg = { content: option.action, role: 'user' as const };
          set({
            gameState: data.gameState,
            currentResponse: data.response,
            messages: [
              ...currentState.messages,
              {
                role: 'assistant',
                content: data.response.state,
                imageData: data.response.imageData,
              },
            ],
            isLoading: false,
            selectedOptionId: null,
            preGeneratedResponses: {}
          });
          
          // Pre-generate for the next set of options
          setTimeout(() => get().generateResponsesForOptions(), 0);
        }
      })
      .catch(error => {
        console.error('Pre-generation error:', error);
        // Remove this option from pending list
        set(state => ({
          pendingOptionsBeingGenerated: state.pendingOptionsBeingGenerated.filter(id => id !== option.id)
        }));
      });
    });
  },
})); 