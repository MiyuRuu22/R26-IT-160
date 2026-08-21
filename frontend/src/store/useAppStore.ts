import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';

interface AppState {
  dashboardData: any | null;
  graphData: any | null;
  riskData: any | null;
  draftSuggestion: string | null;
  isLoading: Record<string, boolean>;
  
  fetchDashboard: () => Promise<void>;
  fetchGraph: () => Promise<void>;
  fetchRisk: () => Promise<void>;
  generateDraft: (context: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  dashboardData: null,
  graphData: null,
  riskData: null,
  draftSuggestion: null,
  isLoading: { dashboard: false, graph: false, risk: false, draft: false },

  fetchDashboard: async () => {
    set((state) => ({ isLoading: { ...state.isLoading, dashboard: true } }));
    try {
      const res = await fetch(API_ENDPOINTS.DASHBOARD);
      const data = await res.json();
      if (res.ok) set({ dashboardData: data.data });
    } catch (err) {
      console.error(err);
    } finally {
      set((state) => ({ isLoading: { ...state.isLoading, dashboard: false } }));
    }
  },

  fetchGraph: async () => {
    set((state) => ({ isLoading: { ...state.isLoading, graph: true } }));
    try {
      const res = await fetch(API_ENDPOINTS.GRAPH_RELATIONSHIPS);
      const data = await res.json();
      if (res.ok) set({ graphData: data.data });
    } catch (err) {
      console.error(err);
    } finally {
      set((state) => ({ isLoading: { ...state.isLoading, graph: false } }));
    }
  },

  fetchRisk: async () => {
    set((state) => ({ isLoading: { ...state.isLoading, risk: true } }));
    try {
      const res = await fetch(API_ENDPOINTS.RISK_ASSESS);
      const data = await res.json();
      if (res.ok) set({ riskData: data.data });
    } catch (err) {
      console.error(err);
    } finally {
      set((state) => ({ isLoading: { ...state.isLoading, risk: false } }));
    }
  },

  generateDraft: async (context: string) => {
    set((state) => ({ isLoading: { ...state.isLoading, draft: true } }));
    try {
      const res = await fetch(API_ENDPOINTS.DRAFTS_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      const data = await res.json();
      if (res.ok) set({ draftSuggestion: data.data.suggestion });
    } catch (err) {
      console.error(err);
    } finally {
      set((state) => ({ isLoading: { ...state.isLoading, draft: false } }));
    }
  }
}));
