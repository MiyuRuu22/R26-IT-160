import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';

// ── Law search types (v4 — /search endpoint) ───────────────────────────────────
export interface LawResult {
  act_name: string;
  act_no: string;
  section: string;
  section_title: string;
  category: string;
  subcategory: string;
  legal_system: string;
  law_text: string;
  similarity_score: number;
}

export interface AnalysisResults {
  status: string;
  query: string;
  total_results: number;
  detected_case_type: string;
  detected_label: string;
  confidence: number;
  filtered_category: string;
  laws_in_filter: number;
  search_mode: 'filtered' | 'full_corpus';
  matched_keywords: string[];
  results: LawResult[];
}

// ── Defense Analyzer types (/analyze endpoint) ─────────────────────────────────
export interface WeakWordItem {
  detected_word: string;
  original_sentence: string;
  defense_argument: string;
}

export interface MissingEvidenceItem {
  label: string;
  defense_argument: string;
}

export interface ContradictionItem {
  type: string;
  detected: string;
  context: string;
  argument: string;
}

export interface RedFlagItem {
  title: string;
  description: string;
  defense_tip: string;
}

export interface DefenseCaseResult {
  case_id: string;
  parties: string;
  description: string;
  keywords: string;
  date_str: string;
  url_pdf: string;
  similarity_score: number;
}

export interface DefenseAnalysisResult {
  status: string;
  detected_issue: string;
  detected_label: string;
  confidence: number;
  search_mode: string;
  laws_in_filter: number;
  filtered_category: string;
  matched_keywords: string[];
  // NLP analysis
  weak_wording: WeakWordItem[];
  missing_evidence: MissingEvidenceItem[];
  contradictions: ContradictionItem[];
  defense_considerations: string[];
  advanced_red_flags: RedFlagItem[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
  risk_label: string;
  // Similarity
  similar_laws: LawResult[];
  similar_cases: DefenseCaseResult[];
}

// ── Store ──────────────────────────────────────────────────────────────────────
interface AnalyzerState {
  // Legacy law search (keeps existing flow working)
  results: AnalysisResults | null;
  // Defense analysis
  defenseResults: DefenseAnalysisResult | null;
  // Shared
  isLoading: boolean;
  error: string | null;
  // Actions
  analyzeCase: (question: string, case_type?: string) => Promise<boolean>;
  analyzeDefense: (
    legalIssue: string,
    caseType: string,
    facts: string,
    desiredOutcome: string,
  ) => Promise<boolean>;
  clearResults: () => void;
}

export const useAnalyzerStore = create<AnalyzerState>((set) => ({
  results: null,
  defenseResults: null,
  isLoading: false,
  error: null,

  // ── Law search (existing) ────────────────────────────────────────────────────
  analyzeCase: async (question, _case_type) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(API_ENDPOINTS.AI_SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, top_k: 5 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: AnalysisResults = await res.json();

      if (data.status === 'success') {
        set({ results: data, isLoading: false });
        return true;
      } else {
        set({ error: 'Analysis returned no results.', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({
        error: `Failed to process AI search. Make sure the AI Engine FastAPI server is running. (${err.message})`,
        isLoading: false,
      });
      return false;
    }
  },

  // ── Defense analysis (new) ───────────────────────────────────────────────────
  analyzeDefense: async (legalIssue, caseType, facts, desiredOutcome) => {
    set({ isLoading: true, error: null, defenseResults: null });
    try {
      const res = await fetch(API_ENDPOINTS.AI_ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_issue: legalIssue,
          case_type: caseType,
          facts,
          desired_outcome: desiredOutcome,
          top_k: 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: DefenseAnalysisResult = await res.json();

      if (data.status === 'success') {
        set({ defenseResults: data, isLoading: false });
        return true;
      } else {
        set({ error: 'Defense analysis returned no results.', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({
        error: `Defense analysis failed. Make sure the AI Engine (port 8000) is running. (${err.message})`,
        isLoading: false,
      });
      return false;
    }
  },

  clearResults: () => set({ results: null, defenseResults: null, error: null }),
}));
