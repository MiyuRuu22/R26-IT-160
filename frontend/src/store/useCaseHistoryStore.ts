import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';
import { useAuthStore } from './useAuthStore';
import { useAnalyzerStore } from './useAnalyzerStore';
import { useOpponentStore } from './useOpponentStore';

export interface CaseHistoryItem {
  id: string;
  caseId: string;
  userId: string;
  title: string;
  caseType: string;
  legalIssue?: string;
  charges?: string;
  analysisType: 'ANALYZER' | 'OPPONENT';
  status: 'Draft' | 'Analyzed' | 'Re-analyzed';
  desiredOutcome?: string;
  summary: string;
  caseData?: any;
  analysisResults?: any;
  createdAt: string;
  updatedAt: string;
}

interface CaseHistoryState {
  recentCases: CaseHistoryItem[];
  allCases: CaseHistoryItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchRecentCases: () => Promise<void>;
  fetchAllCases: () => Promise<void>;
  recordAnalyzerCase: (params: {
    caseTitle: string;
    caseType: string;
    legalIssue: string;
    facts: string;
    desiredOutcome: string;
    results: any;
    additionalDetails?: any;
    caseId?: string;
  }) => Promise<CaseHistoryItem | null>;
  recordOpponentCase: (params: {
    charges: string;
    defenseArguments: string;
    caseType: string;
    caseFacts: string;
    adversarialAnalysis: any;
    caseData: any;
    caseId?: string;
  }) => Promise<CaseHistoryItem | null>;
  deleteCase: (caseId: string) => Promise<boolean>;
  restoreCase: (item: CaseHistoryItem, navigation: any) => void;
  clearError: () => void;
}

const getAuthHeaders = () => {
  const user = useAuthStore.getState().user;
  const token = user?.token || 'mock-jwt-token-12345';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const useCaseHistoryStore = create<CaseHistoryState>((set, get) => ({
  recentCases: [],
  allCases: [],
  isLoading: false,
  isSaving: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchRecentCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_ENDPOINTS.DEFENDER_HISTORY}?limit=3`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data?.cases) {
        set({ recentCases: data.data.cases, isLoading: false });
      } else {
        set({
          error: data.message || 'Unable to load recent case history.',
          isLoading: false
        });
      }
    } catch (err: any) {
      set({
        error: err.message || 'Network error loading case history.',
        isLoading: false
      });
    }
  },

  fetchAllCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_ENDPOINTS.DEFENDER_HISTORY}?limit=100`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data?.cases) {
        set({
          allCases: data.data.cases,
          recentCases: data.data.cases.slice(0, 3),
          isLoading: false
        });
      } else {
        set({
          error: data.message || 'Unable to load case history.',
          isLoading: false
        });
      }
    } catch (err: any) {
      set({
        error: err.message || 'Network error loading case history.',
        isLoading: false
      });
    }
  },

  recordAnalyzerCase: async ({
    caseTitle,
    caseType,
    legalIssue,
    facts,
    desiredOutcome,
    results,
    additionalDetails,
    caseId
  }) => {
    set({ isSaving: true });
    try {
      const stableCaseId = caseId || `analyzer-${caseTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'case'}-${Date.now().toString().slice(-4)}`;
      const title = caseTitle.trim() || legalIssue.slice(0, 45) || 'Untitled Defense Case';

      const payload = {
        caseId: stableCaseId,
        title,
        caseType: caseType || 'Criminal',
        legalIssue: legalIssue || '',
        analysisType: 'ANALYZER',
        status: 'Analyzed',
        desiredOutcome: desiredOutcome || 'Acquittal',
        summary: `Defense analysis for ${title}. Issue: ${legalIssue.slice(0, 60)}...`,
        caseData: {
          facts,
          legalIssue,
          caseType,
          desiredOutcome,
          caseTitle: title,
          additionalDetails: additionalDetails || null
        },
        analysisResults: results
      };

      const res = await fetch(API_ENDPOINTS.DEFENDER_HISTORY, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data?.case) {
        const savedRecord = data.data.case;
        set((state) => {
          const updatedAll = [
            savedRecord,
            ...state.allCases.filter(c => c.caseId !== savedRecord.caseId)
          ];
          return {
            allCases: updatedAll,
            recentCases: updatedAll.slice(0, 3),
            isSaving: false
          };
        });
        return savedRecord;
      }
    } catch (err: any) {
      console.warn('[recordAnalyzerCase Error]:', err.message);
    } finally {
      set({ isSaving: false });
    }
    return null;
  },

  recordOpponentCase: async ({
    charges,
    defenseArguments,
    caseType,
    caseFacts,
    adversarialAnalysis,
    caseData,
    caseId
  }) => {
    set({ isSaving: true });
    try {
      const title = caseData?.caseTitle || charges.slice(0, 45) || 'Adversarial Defense Case';
      const stableCaseId = caseId || `opponent-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'case'}-${Date.now().toString().slice(-4)}`;

      const payload = {
        caseId: stableCaseId,
        title,
        caseType: caseType || 'Criminal',
        legalIssue: charges,
        charges,
        analysisType: 'OPPONENT',
        status: 'Analyzed',
        summary: `14-Section Adversarial analysis on: ${charges.slice(0, 65)}...`,
        caseData: {
          charges,
          defenseArguments,
          caseType,
          caseFacts,
          ...caseData
        },
        analysisResults: adversarialAnalysis
      };

      const res = await fetch(API_ENDPOINTS.DEFENDER_HISTORY, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data?.case) {
        const savedRecord = data.data.case;
        set((state) => {
          const updatedAll = [
            savedRecord,
            ...state.allCases.filter(c => c.caseId !== savedRecord.caseId)
          ];
          return {
            allCases: updatedAll,
            recentCases: updatedAll.slice(0, 3),
            isSaving: false
          };
        });
        return savedRecord;
      }
    } catch (err: any) {
      console.warn('[recordOpponentCase Error]:', err.message);
    } finally {
      set({ isSaving: false });
    }
    return null;
  },

  deleteCase: async (caseId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.DEFENDER_HISTORY}/${encodeURIComponent(caseId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        set((state) => {
          const remaining = state.allCases.filter(c => c.caseId !== caseId);
          return {
            allCases: remaining,
            recentCases: remaining.slice(0, 3)
          };
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[deleteCase Error]:', err.message);
      return false;
    }
  },

  restoreCase: (item: CaseHistoryItem, navigation: any) => {
    if (item.analysisType === 'ANALYZER') {
      const { caseData, analysisResults } = item;
      const originalInput = {
        legalIssue: caseData?.legalIssue || item.legalIssue || '',
        caseType: caseData?.caseType || item.caseType || 'Criminal',
        facts: caseData?.facts || '',
        desiredOutcome: caseData?.desiredOutcome || item.desiredOutcome || 'Acquittal',
        caseTitle: caseData?.caseTitle || item.title || '',
      };

      useAnalyzerStore.setState({
        originalInput,
        defenseResults: analysisResults || null,
        additionalDetails: caseData?.additionalDetails || {
          ...useAnalyzerStore.getState().additionalDetails,
          caseTitle: item.title,
          caseType: item.caseType
        },
        analysisHistory: analysisResults ? [{
          version: 1,
          timestamp: item.updatedAt || new Date().toISOString(),
          formattedDate: new Date(item.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          result: analysisResults
        }] : [],
        currentVersionIndex: 0,
        error: null,
        isLoading: false
      });

      if (analysisResults) {
        navigation.navigate('DefenseResults');
      } else {
        navigation.navigate('AnalyzerForm');
      }
    } else {
      // OPPONENT PREDICTION
      const { caseData, analysisResults } = item;
      const oppStore = useOpponentStore.getState();

      useOpponentStore.setState({
        charges: caseData?.charges || item.charges || item.title || '',
        defenseArguments: caseData?.defenseArguments || '',
        caseType: caseData?.caseType || item.caseType || 'Criminal',
        caseFacts: caseData?.caseFacts || '',
        legalSections: caseData?.legalSections || '',
        incidentDate: caseData?.incidentDate || '',
        incidentLocation: caseData?.incidentLocation || '',
        policeStation: caseData?.policeStation || '',
        accusedPerson: caseData?.accusedPerson || '',
        investigatingOfficer: caseData?.investigatingOfficer || '',
        physicalEvidenceType: caseData?.physicalEvidenceType || '',
        physicalEvidenceQuantity: caseData?.physicalEvidenceQuantity || '',
        physicalEvidenceLocation: caseData?.physicalEvidenceLocation || '',
        forensicReportStatus: caseData?.forensicReportStatus || 'Unknown',
        chainOfCustodyStatus: caseData?.chainOfCustodyStatus || 'Unknown',
        searchWarrantInvolved: caseData?.searchWarrantInvolved || 'Unknown',
        adversarialAnalysis: analysisResults || null,
        error: null,
        isLoading: false
      });

      navigation.navigate('OpponentPrediction');
    }
  }
}));
