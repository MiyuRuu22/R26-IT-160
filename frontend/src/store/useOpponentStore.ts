import { create } from 'zustand';

interface AnalysisResult {
    weaknesses: { pattern: string; reason: string }[];
    contradictions: { issue: string }[];
    missingEvidence: string[];
    detectedClaims: string[];
}

interface PredictionResult {
    likelyOpponentArguments: string[];
    prosecutionObjections: string[];
    evidenceAttacks: string[];
    proceduralObjections: string[];
    preparationRecommendations: string[];
}

interface RiskScore {
    riskLevel: string;
    confidenceScore: number;
    vulnerabilityAnalysis: string;
}

interface OpponentState {
    defenseArguments: string;
    charges: string;
    hearingNotes: string;
    witnessSummaries: string;
    evidenceSummaries: string;
    legalSections: string;
    
    analysis: AnalysisResult | null;
    predictions: PredictionResult | null;
    risk: RiskScore | null;
    sessionId: string | null;
    
    isLoading: boolean;
    error: string | null;

    setField: (field: string, value: string) => void;
    runAnalysis: () => Promise<void>;
    reset: () => void;
}

import { BASE_URL } from '../config/api';

export const useOpponentStore = create<OpponentState>((set, get) => ({
    defenseArguments: '',
    charges: '',
    hearingNotes: '',
    witnessSummaries: '',
    evidenceSummaries: '',
    legalSections: '',

    analysis: null,
    predictions: null,
    risk: null,
    sessionId: null,

    isLoading: false,
    error: null,

    setField: (field, value) => set({ [field]: value }),

    runAnalysis: async () => {
        const { defenseArguments, charges, hearingNotes, witnessSummaries, evidenceSummaries, legalSections } = get();
        
        if (!defenseArguments || !charges) {
            set({ error: 'Defense Arguments and Charges are required.' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const response = await fetch(`${BASE_URL}/opponent/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defenseArguments,
                    charges,
                    hearingNotes,
                    witnessSummaries,
                    evidenceSummaries,
                    legalSections
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                set({
                    analysis: data.data.analysis,
                    predictions: data.data.predictions,
                    risk: data.data.risk,
                    sessionId: data.data.sessionId,
                    isLoading: false
                });
            } else {
                set({ error: data.message || 'Analysis failed', isLoading: false });
            }
        } catch (err) {
            set({ error: 'Network error or Server offline', isLoading: false });
        }
    },

    reset: () => set({
        defenseArguments: '',
        charges: '',
        hearingNotes: '',
        witnessSummaries: '',
        evidenceSummaries: '',
        legalSections: '',
        analysis: null,
        predictions: null,
        risk: null,
        sessionId: null,
        error: null
    })
}));
