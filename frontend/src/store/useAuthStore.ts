import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: 'lawyer' | 'admin' | 'user';
  token?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        set({ user: data.data, isLoading: false });
      } else {
        set({ error: data.message || 'Login failed', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Network error', isLoading: false });
    }
  },

  register: async (email, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName: name, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        set({ user: data.data, isLoading: false });
      } else {
        set({ error: data.message || 'Registration failed', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Network error', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ user: null, isLoading: false, error: null });
  },

  clearError: () => set({ error: null })
}));
