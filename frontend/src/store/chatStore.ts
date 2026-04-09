import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (m: ChatMessage) => void;
  appendDelta: (delta: string) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (m) => set((state) => ({ messages: [...state.messages, m] })),
  appendDelta: (delta) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + delta };
      }
      return { messages };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
}));
