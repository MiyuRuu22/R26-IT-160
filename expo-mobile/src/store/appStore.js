import { create } from 'zustand';
import { getAlerts } from '../services/relationshipService';

export const useAppStore = create((set) => ({
  // State
  isLoading: false,
  error: null,
  alerts: [],
  conflicts: [],
  selectedNode: null,

  // Actions
  initializeApp: async () => {
    set({ isLoading: true });
    try {
      // Load initial data
      const alertsData = await getAlerts();

      set({
        alerts: alertsData,
        conflicts: [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  updateAlerts: (alerts) => set({ alerts }),

  updateConflicts: (conflicts) => set({ conflicts }),
}));
