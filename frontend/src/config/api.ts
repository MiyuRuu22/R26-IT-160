// Node.js backend (auth, dashboard, drafts, graph, risk)
export const BASE_URL = 'http://172.20.10.11:5000/api';

// FastAPI AI engine (semantic legal search + defense analysis) — port 8000
export const AI_BASE_URL = 'http://172.20.10.11:8000';

// B-Report PDF analysis engine — port 8001
export const AI_BREPORT_URL = 'http://172.20.10.11:8001';

export const API_ENDPOINTS = {
    AUTH_LOGIN: `${BASE_URL}/auth/login`,
    AUTH_REGISTER: `${BASE_URL}/auth/register`,
    CASES_SEARCH: `${BASE_URL}/cases/search`,
    DASHBOARD: `${BASE_URL}/dashboard`,
    DRAFTS_GENERATE: `${BASE_URL}/drafts/generate`,
    GRAPH_RELATIONSHIPS: `${BASE_URL}/graph/relationships`,
    RISK_ASSESS: `${BASE_URL}/risk/assess`,
    // AI Engine — law search
    AI_SEARCH: `${AI_BASE_URL}/search`,
    // AI Engine — Defense Analyzer (text input)
    AI_ANALYZE: `${AI_BASE_URL}/analyze`,
    // B-Report PDF analysis
    AI_ANALYZE_PDF: `${AI_BREPORT_URL}/analyze-b-report`,
};
