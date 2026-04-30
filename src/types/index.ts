export type MatchClient = {
  id: string;
  name: string;
  courtLocation?: string;
  caseCount: number;
};

export type CaseItem = {
  id: string;
  title: string;
  type: string;
  date?: string;
  riskTag?: string;
  pdfUrl?: string;
};

export type ClientRiskProfile = {
  clientName: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  caseCount: number;
  civilCount: number;
  criminalCount: number;
  commercialCount: number;
  summary: string;
  cases: CaseItem[];
};