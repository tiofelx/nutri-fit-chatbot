import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  clearSession: () => set({ sessionId: null }),
}));
