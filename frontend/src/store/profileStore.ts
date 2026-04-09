import { create } from 'zustand';
import type { UserProfile } from '../types';

interface ProfileState {
  profile: Partial<UserProfile>;
  profileComplete: boolean;
  setProfile: (p: Partial<UserProfile>) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setProfileComplete: (v: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: {},
  profileComplete: false,
  setProfile: (p) => set({ profile: p }),
  updateProfile: (p) => set((state) => ({ profile: { ...state.profile, ...p } })),
  setProfileComplete: (v) => set({ profileComplete: v }),
}));
