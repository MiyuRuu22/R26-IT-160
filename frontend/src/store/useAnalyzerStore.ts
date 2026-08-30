import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';
import { useCaseHistoryStore } from './useCaseHistoryStore';

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

// ── Opponent Arguments Tab Types ──────────────────────────────────────────────
export type ArgumentPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OpponentEvidenceAttack {
  evidence: string;
  possibleAttack: string;
  risk: ArgumentPriority;
  preparation: string;
}

export interface OpponentEvidenceGap {
  label: string;
  whyItMatters: string;
  opponentAdvantage: string;
  preparation: string;
}

export interface OpponentContradiction {
  statementA: string;
  statementB: string;
  whyInconsistent: string;
  potentialArgument: string;
  recommendedClarification: string;
}

export interface OpponentCaseReference {
  caseId: string;
  parties: string;
  relevantIssue: string;
  whyHelpsOpponent: string;
  relevantArgument: string;
  similarityScore: number;
}

export interface CounterStrategy {
  evidenceToStrengthen: string[];
  factsToVerify: string[];
  legalAuthoritiesToReview: string[];
  questionsToInvestigate: string[];
}

export interface OpponentArgument {
  id: string;
  title: string;
  opponentPosition: string;
  reasoningBehind: string;
  legalBasis: string[];
  evidenceTheyMayChallenge: string[];
  weaknessesTheyExploit: string[];
  likelihood: ArgumentPriority;
  likelihoodExplanation: string;
  priority: ArgumentPriority;
  category: 'Evidence' | 'Legal' | 'Procedural' | 'Witness' | 'Documentation';
  counterStrategy: CounterStrategy;
}

export interface OpponentTabData {
  arguments: OpponentArgument[];
  evidenceAttacks: OpponentEvidenceAttack[];
  evidenceGaps: OpponentEvidenceGap[];
  contradictions: OpponentContradiction[];
  opponentStrategy: string[];
  opponentSupportingCases: OpponentCaseReference[];
  summary: {
    totalArguments: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    evidenceRisks: number;
    potentialContradictions: number;
    evidenceGaps: number;
  };
}

// ── Structured Additional Case Details ─────────────────────────────────────────
export interface WitnessItem {
  id: string;
  name: string;
  role: string;
  description: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uri?: string;
}

export interface AdditionalCaseDetails {
  // Section 1 — Case Information
  caseTitle: string;
  caseNumber: string;
  caseType: string;
  relevantLegalIssues: string[];

  // Section 2 — Incident Details
  incidentDate: string;
  incidentTime: string;
  location: string;
  policeStation: string;
  incidentDescription: string;

  // Section 3 — Parties Involved
  accusedPerson: string;
  otherPersons: string;
  witnesses: WitnessItem[];
  investigatingOfficer: string;

  // Section 4 — Evidence & Investigation
  physicalEvidenceAvailable: boolean;
  physicalEvidenceType: string;
  physicalEvidenceQuantity: string;
  physicalEvidenceLocation: string;
  physicalEvidenceRecoveredBy: string;
  physicalEvidenceDateTime: string;

  forensicReportStatus: 'Available' | 'Not Available' | 'Pending' | 'Unknown';
  forensicReportDetails: string;

  chainOfCustodyStatus: 'Complete' | 'Incomplete' | 'Not Available' | 'Unknown';
  chainOfCustodyDetails: string;

  digitalEvidenceStatus: 'Phone extracted' | 'Phone not extracted' | 'Digital evidence available' | 'No digital evidence' | 'Unknown';
  digitalEvidenceDetails: string;

  cctvStatus: 'Available' | 'Not Available' | 'Unknown';
  cctvDetails: string;

  witnessEvidenceStatus: 'Witness statements available' | 'Statements unavailable' | 'Unknown';
  witnessEvidenceDetails: string;

  // Section 5 — Arrest & Search Details
  arrestCircumstances: string;
  searchConducted: 'Yes' | 'No' | 'Unknown';
  searchLocation: string;
  searchDateTime: string;
  searchConductedBy: string;
  searchWarrantInvolved: 'Yes' | 'No' | 'Unknown';
  searchDetails: string;

  seizureItems: string;
  seizureLocation: string;
  seizureRecoveredFrom: string;
  seizureWitnessed: 'Yes' | 'No' | 'Unknown';

  // Section 6 — Statements & Admissions
  accusedStatementAvailable: 'Yes' | 'No' | 'Unknown';
  confessionAdmission: 'Yes' | 'No' | 'Unknown';
  statementDetails: string;

  // Section 7 — Defense Information
  knownDefenseArguments: string;
  supportingFacts: string;
  disputedFacts: string;
  otherRelevantInfo: string;

  // Section 8 — Documents
  documents: DocumentAttachment[];
}

export const INITIAL_ADDITIONAL_DETAILS: AdditionalCaseDetails = {
  caseTitle: '',
  caseNumber: '',
  caseType: 'Criminal',
  relevantLegalIssues: [],
  incidentDate: '',
  incidentTime: '',
  location: '',
  policeStation: '',
  incidentDescription: '',
  accusedPerson: '',
  otherPersons: '',
  witnesses: [],
  investigatingOfficer: '',
  physicalEvidenceAvailable: false,
  physicalEvidenceType: '',
  physicalEvidenceQuantity: '',
  physicalEvidenceLocation: '',
  physicalEvidenceRecoveredBy: '',
  physicalEvidenceDateTime: '',
  forensicReportStatus: 'Unknown',
  forensicReportDetails: '',
  chainOfCustodyStatus: 'Unknown',
  chainOfCustodyDetails: '',
  digitalEvidenceStatus: 'Unknown',
  digitalEvidenceDetails: '',
  cctvStatus: 'Unknown',
  cctvDetails: '',
  witnessEvidenceStatus: 'Unknown',
  witnessEvidenceDetails: '',
  arrestCircumstances: '',
  searchConducted: 'Unknown',
  searchLocation: '',
  searchDateTime: '',
  searchConductedBy: '',
  searchWarrantInvolved: 'Unknown',
  searchDetails: '',
  seizureItems: '',
  seizureLocation: '',
  seizureRecoveredFrom: '',
  seizureWitnessed: 'Unknown',
  accusedStatementAvailable: 'Unknown',
  confessionAdmission: 'Unknown',
  statementDetails: '',
  knownDefenseArguments: '',
  supportingFacts: '',
  disputedFacts: '',
  otherRelevantInfo: '',
  documents: [],
};

// ── Analysis Version History ──────────────────────────────────────────────────
export interface DiffSummary {
  additionalDetailsCount: number;
  riskChange?: { from: string; to: string };
  missingEvidenceCountChange?: { from: number; to: number };
  resolvedMissingEvidence?: string[];
  weakWordsCountChange?: { from: number; to: number };
  contradictionsCountChange?: { from: number; to: number };
  confidenceChange?: { from: number; to: number };
  newDefenseConsiderations?: string[];
}

export interface AnalysisVersionItem {
  version: number;
  timestamp: string;
  formattedDate: string;
  result: DefenseAnalysisResult;
  additionalDetailsSnapshot?: AdditionalCaseDetails;
  diffSummary?: DiffSummary;
}

export interface OriginalInputState {
  legalIssue: string;
  caseType: string;
  facts: string;
  desiredOutcome: string;
  caseTitle?: string;
}

// ── Store Definition ──────────────────────────────────────────────────────────
interface AnalyzerState {
  // Legacy law search
  results: AnalysisResults | null;
  // Defense analysis
  defenseResults: DefenseAnalysisResult | null;
  // Input caching
  originalInput: OriginalInputState | null;
  additionalDetails: AdditionalCaseDetails;
  // Versioning
  analysisHistory: AnalysisVersionItem[];
  currentVersionIndex: number;
  // Opponent Tab
  opponentTabData: OpponentTabData | null;
  opponentTabLoading: boolean;
  opponentTabError: string | null;
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
    caseTitle?: string,
  ) => Promise<boolean>;
  reAnalyzeDefense: (details: AdditionalCaseDetails) => Promise<boolean>;
  updateAdditionalDetails: (details: Partial<AdditionalCaseDetails>) => void;
  switchVersion: (index: number) => void;
  generateOpponentArguments: () => Promise<void>;
  clearResults: () => void;
}

// ── Helper formatters ─────────────────────────────────────────────────────────
function formatDateNow(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

export function countAdditionalDetails(details: AdditionalCaseDetails): number {
  let count = 0;
  if (details.caseTitle.trim()) count++;
  if (details.caseNumber.trim()) count++;
  if (details.relevantLegalIssues.length > 0) count += details.relevantLegalIssues.length;
  if (details.incidentDate.trim()) count++;
  if (details.incidentTime.trim()) count++;
  if (details.location.trim()) count++;
  if (details.policeStation.trim()) count++;
  if (details.incidentDescription.trim()) count++;
  if (details.accusedPerson.trim()) count++;
  if (details.otherPersons.trim()) count++;
  if (details.investigatingOfficer.trim()) count++;
  count += details.witnesses.length;
  if (details.physicalEvidenceAvailable) count++;
  if (details.physicalEvidenceType.trim()) count++;
  if (details.forensicReportStatus !== 'Unknown') count++;
  if (details.forensicReportDetails.trim()) count++;
  if (details.chainOfCustodyStatus !== 'Unknown') count++;
  if (details.chainOfCustodyDetails.trim()) count++;
  if (details.digitalEvidenceStatus !== 'Unknown') count++;
  if (details.digitalEvidenceDetails.trim()) count++;
  if (details.cctvStatus !== 'Unknown') count++;
  if (details.witnessEvidenceStatus !== 'Unknown') count++;
  if (details.arrestCircumstances.trim()) count++;
  if (details.searchConducted !== 'Unknown') count++;
  if (details.searchDetails.trim()) count++;
  if (details.seizureItems.trim()) count++;
  if (details.accusedStatementAvailable !== 'Unknown') count++;
  if (details.statementDetails.trim()) count++;
  if (details.knownDefenseArguments.trim()) count++;
  if (details.supportingFacts.trim()) count++;
  if (details.disputedFacts.trim()) count++;
  if (details.otherRelevantInfo.trim()) count++;
  count += details.documents.length;
  return count;
}

export function buildCombinedFacts(originalFacts: string, details: AdditionalCaseDetails): string {
  const parts: string[] = [];
  if (originalFacts.trim()) {
    parts.push(originalFacts.trim());
  }

  // Case Information
  if (details.caseNumber) parts.push(`Case Number: ${details.caseNumber}.`);
  if (details.relevantLegalIssues.length > 0) {
    parts.push(`Relevant Legal Issues: ${details.relevantLegalIssues.join(', ')}.`);
  }

  // Incident Details
  const incidentParts: string[] = [];
  if (details.incidentDate) incidentParts.push(`Date: ${details.incidentDate}`);
  if (details.incidentTime) incidentParts.push(`Time: ${details.incidentTime}`);
  if (details.location) incidentParts.push(`Location: ${details.location}`);
  if (details.policeStation) incidentParts.push(`Police Station: ${details.policeStation}`);
  if (incidentParts.length > 0) parts.push(`Incident Information: ${incidentParts.join(', ')}.`);
  if (details.incidentDescription) parts.push(`Incident Description: ${details.incidentDescription}.`);

  // Parties
  if (details.accusedPerson) parts.push(`Accused Person: ${details.accusedPerson}.`);
  if (details.otherPersons) parts.push(`Other Persons Involved: ${details.otherPersons}.`);
  if (details.investigatingOfficer) parts.push(`Investigating Officer: ${details.investigatingOfficer}.`);
  if (details.witnesses.length > 0) {
    const wit = details.witnesses.map((w) => `${w.name} (${w.role || 'Witness'}: ${w.description || 'statement recorded'})`).join('; ');
    parts.push(`Witnesses: ${wit}.`);
  }

  // Evidence
  if (details.physicalEvidenceAvailable) {
    parts.push(`Physical Evidence Recovered: ${details.physicalEvidenceType || 'item'} (Quantity: ${details.physicalEvidenceQuantity || 'unspecified'}), recovered at ${details.physicalEvidenceLocation || 'scene'} by ${details.physicalEvidenceRecoveredBy || 'officer'}.`);
  }
  if (details.forensicReportStatus === 'Available') {
    parts.push(`Government Analyst / Forensic Report: Available. Findings: ${details.forensicReportDetails || 'Report on file.'}`);
  } else if (details.forensicReportStatus === 'Not Available') {
    parts.push(`Government Analyst / Forensic Report: Not available. No forensic report or GA report was filed.`);
  } else if (details.forensicReportStatus === 'Pending') {
    parts.push(`Forensic Report: Pending Government Analyst submission.`);
  }

  if (details.chainOfCustodyStatus === 'Complete') {
    parts.push(`Chain of Custody: Documented as complete. ${details.chainOfCustodyDetails || ''}`);
  } else if (details.chainOfCustodyStatus === 'Incomplete' || details.chainOfCustodyStatus === 'Not Available') {
    parts.push(`Chain of Custody: Incomplete / missing documentation. ${details.chainOfCustodyDetails || 'Break in chain of custody noted.'}`);
  }

  if (details.digitalEvidenceStatus === 'Phone extracted' || details.digitalEvidenceStatus === 'Digital evidence available') {
    parts.push(`Digital Forensic Evidence: Phone extraction conducted. ${details.digitalEvidenceDetails || ''}`);
  } else if (details.digitalEvidenceStatus === 'Phone not extracted' || details.digitalEvidenceStatus === 'No digital evidence') {
    parts.push(`Digital Evidence: No phone extraction or digital forensic report available. ${details.digitalEvidenceDetails || ''}`);
  }

  if (details.cctvStatus === 'Available') {
    parts.push(`CCTV / Video Footage: Surveillance recording available. ${details.cctvDetails || ''}`);
  } else if (details.cctvStatus === 'Not Available') {
    parts.push(`CCTV / Video Evidence: No CCTV or surveillance footage recovered.`);
  }

  if (details.witnessEvidenceStatus === 'Witness statements available') {
    parts.push(`Witness Evidence: Independent witness statements recorded. ${details.witnessEvidenceDetails || ''}`);
  } else if (details.witnessEvidenceStatus === 'Statements unavailable') {
    parts.push(`Witness Evidence: No independent civilian witness statements available.`);
  }

  // Arrest & Search
  if (details.arrestCircumstances) parts.push(`Arrest Circumstances: ${details.arrestCircumstances}.`);
  if (details.searchConducted === 'Yes') {
    const warrant = details.searchWarrantInvolved === 'Yes' ? 'with search warrant' : details.searchWarrantInvolved === 'No' ? 'without search warrant' : 'warrant status unknown';
    parts.push(`Search Details: Search conducted ${warrant} at ${details.searchLocation || 'location'} by ${details.searchConductedBy || 'officers'}. ${details.searchDetails || ''}`);
  }
  if (details.seizureItems || details.seizureLocation || details.seizureRecoveredFrom) {
    parts.push(`Seizure Details: Items (${details.seizureItems || 'items'}) found at ${details.seizureLocation || 'scene'} from ${details.seizureRecoveredFrom || 'suspect'}. Witnessed: ${details.seizureWitnessed}.`);
  }

  // Statements
  if (details.accusedStatementAvailable === 'Yes') {
    parts.push(`Accused Statement: Statement available. Confession/Admission: ${details.confessionAdmission}. Details: ${details.statementDetails || ''}`);
  } else if (details.accusedStatementAvailable === 'No') {
    parts.push(`Accused Statement: No statement made by accused.`);
  }

  // Defense Notes
  if (details.knownDefenseArguments) parts.push(`Defense Strategy & Arguments: ${details.knownDefenseArguments}.`);
  if (details.supportingFacts) parts.push(`Supporting Defense Facts: ${details.supportingFacts}.`);
  if (details.disputedFacts) parts.push(`Disputed Facts: ${details.disputedFacts}.`);
  if (details.otherRelevantInfo) parts.push(`Other Case Notes: ${details.otherRelevantInfo}.`);

  // Documents
  if (details.documents.length > 0) {
    const docNames = details.documents.map((d) => `${d.name} (${d.type})`).join(', ');
    parts.push(`Attached Documents: ${docNames}.`);
  }

  return parts.join('\n\n');
}

// ── Opponent Argument Generator (local derivation) ────────────────────────────
function deriveOpponentArguments(r: DefenseAnalysisResult, originalInput: OriginalInputState | null): OpponentTabData {
  const args: OpponentArgument[] = [];

  // Argument 1: from advanced_red_flags (HIGH priority)
  if (r.advanced_red_flags && r.advanced_red_flags.length > 0) {
    r.advanced_red_flags.forEach((flag, i) => {
      args.push({
        id: `rf-${i}`,
        title: flag.title,
        opponentPosition: `The opposing party may exploit the vulnerability identified as: ${flag.description}`,
        reasoningBehind: `This issue was flagged during the defense analysis as a critical vulnerability. The opposing side is likely to identify and raise this weakness to undermine the defense position.`,
        legalBasis: r.similar_laws.slice(0, 2).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}`),
        evidenceTheyMayChallenge: r.missing_evidence.slice(0, 2).map(m => m.label),
        weaknessesTheyExploit: [flag.description],
        likelihood: 'HIGH',
        likelihoodExplanation: `High likelihood because this vulnerability was directly detected in the current case analysis.`,
        priority: 'HIGH',
        category: 'Evidence',
        counterStrategy: {
          evidenceToStrengthen: [`Address the vulnerability: ${flag.title}`],
          factsToVerify: [`Verify the facts related to: ${flag.description}`],
          legalAuthoritiesToReview: r.similar_laws.slice(0, 1).map(l => l.act_name),
          questionsToInvestigate: [flag.defense_tip],
        },
      });
    });
  }

  // Argument 2: Missing evidence as opponent attack points
  if (r.missing_evidence && r.missing_evidence.length > 0) {
    args.push({
      id: 'missing-evidence-arg',
      title: 'Insufficient or Missing Evidence',
      opponentPosition: `The opposing party may argue that the evidence presented is insufficient to establish the alleged facts to the required legal standard. Key gaps identified: ${r.missing_evidence.map(m => m.label).join('; ')}.`,
      reasoningBehind: 'Missing evidence was detected in the current case. The opposing side will likely exploit these gaps to challenge the sufficiency of the evidence.',
      legalBasis: r.similar_laws.slice(0, 3).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}${l.section_title ? ` — ${l.section_title}` : ''}`),
      evidenceTheyMayChallenge: r.missing_evidence.map(m => m.label),
      weaknessesTheyExploit: r.missing_evidence.map(m => `${m.label}: ${m.defense_argument}`),
      likelihood: r.missing_evidence.length >= 3 ? 'HIGH' : 'MEDIUM',
      likelihoodExplanation: `${r.missing_evidence.length >= 3 ? 'High' : 'Medium'} likelihood because the current case contains ${r.missing_evidence.length} identified evidence gap(s).`,
      priority: r.missing_evidence.length >= 3 ? 'HIGH' : 'MEDIUM',
      category: 'Evidence',
      counterStrategy: {
        evidenceToStrengthen: r.missing_evidence.map(m => `Obtain or verify: ${m.label}`),
        factsToVerify: ['Verify the chronology of events and documentary chain'],
        legalAuthoritiesToReview: r.similar_laws.slice(0, 2).map(l => l.act_name),
        questionsToInvestigate: r.missing_evidence.map(m => m.defense_argument),
      },
    });
  }

  // Argument 3: Contradictions as credibility attack
  if (r.contradictions && r.contradictions.length > 0) {
    args.push({
      id: 'contradiction-arg',
      title: 'Credibility Challenges — Inconsistent Statements',
      opponentPosition: `The opposing party may challenge the credibility and consistency of the available statements and facts. ${r.contradictions.length} potential inconsistenc${r.contradictions.length === 1 ? 'y was' : 'ies were'} identified in the current case.`,
      reasoningBehind: 'Detected inconsistencies or contradictions in the case information provide the opposing side with grounds to attack witness credibility and case reliability.',
      legalBasis: r.similar_laws.slice(0, 2).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}`),
      evidenceTheyMayChallenge: r.contradictions.map(c => c.detected),
      weaknessesTheyExploit: r.contradictions.map(c => `${c.type}: ${c.detected}`),
      likelihood: 'MEDIUM',
      likelihoodExplanation: 'Medium likelihood — credibility attacks are common when inconsistencies are present in witness statements or case facts.',
      priority: 'MEDIUM',
      category: 'Witness',
      counterStrategy: {
        evidenceToStrengthen: ['Prepare explanations for each detected inconsistency'],
        factsToVerify: r.contradictions.map(c => `Clarify and reconcile: ${c.detected}`),
        legalAuthoritiesToReview: r.similar_laws.slice(0, 1).map(l => l.act_name),
        questionsToInvestigate: r.contradictions.map(c => c.argument),
      },
    });
  }

  // Argument 4: Weak legal wording
  if (r.weak_wording && r.weak_wording.length > 0) {
    args.push({
      id: 'weak-wording-arg',
      title: 'Speculative or Vague Legal Language',
      opponentPosition: `The opposing party may attack the precision and strength of the legal arguments. ${r.weak_wording.length} instance(s) of weak or speculative wording were detected that the opponent could exploit.`,
      reasoningBehind: 'Vague or speculative language in legal arguments gives the opposing side openings to challenge the evidentiary foundation of the case position.',
      legalBasis: r.similar_laws.slice(0, 2).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}`),
      evidenceTheyMayChallenge: r.weak_wording.map(w => `"${w.detected_word}" — ${w.original_sentence || 'context not specified'}`),
      weaknessesTheyExploit: r.weak_wording.map(w => `Weak phrasing detected: "${w.detected_word}"`),
      likelihood: 'MEDIUM',
      likelihoodExplanation: 'Medium likelihood — vague language is a common target during cross-examination and legal submissions.',
      priority: 'MEDIUM',
      category: 'Legal',
      counterStrategy: {
        evidenceToStrengthen: r.weak_wording.map(w => `Replace or support the claim: "${w.detected_word}"`),
        factsToVerify: ['Review and tighten all factual assertions in the submission'],
        legalAuthoritiesToReview: r.similar_laws.slice(0, 2).map(l => l.act_name),
        questionsToInvestigate: r.weak_wording.map(w => w.defense_argument),
      },
    });
  }

  // Argument 5: Procedural (if search mode is full corpus — suggests classification uncertainty)
  if (r.search_mode === 'full_corpus' || r.risk_level === 'HIGH' || r.risk_level === 'VERY HIGH') {
    args.push({
      id: 'procedural-arg',
      title: 'Procedural and Jurisdictional Challenges',
      opponentPosition: 'The opposing party may raise procedural objections including: challenging the admissibility of evidence obtained without proper procedure, disputing timelines, or raising jurisdictional questions.',
      reasoningBehind: `The case risk level is ${r.risk_level}, indicating multiple exposure points. High-risk cases often attract procedural challenges as an additional line of attack by the opposition.`,
      legalBasis: r.similar_laws.slice(0, 3).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}`),
      evidenceTheyMayChallenge: ['Admissibility of evidence collected during investigation', 'Procedural compliance in evidence recovery'],
      weaknessesTheyExploit: ['Procedural irregularities if present', 'Timeline of events and documentation dates'],
      likelihood: r.risk_level === 'VERY HIGH' ? 'HIGH' : 'MEDIUM',
      likelihoodExplanation: `${r.risk_level === 'VERY HIGH' ? 'High' : 'Medium'} likelihood — procedural objections are raised in cases where evidence collection processes may be questioned.`,
      priority: r.risk_level === 'VERY HIGH' ? 'HIGH' : 'LOW',
      category: 'Procedural',
      counterStrategy: {
        evidenceToStrengthen: ['Document the complete chain of custody', 'Verify procedural compliance at each stage'],
        factsToVerify: ['Review the timeline of evidence collection and reporting', 'Confirm warrant/authority compliance'],
        legalAuthoritiesToReview: r.similar_laws.slice(0, 2).map(l => l.act_name),
        questionsToInvestigate: ['Were all statutory procedural requirements satisfied?', 'Is the documentation trail complete and consistent?'],
      },
    });
  }

  // Argument 6: Contrary case law
  if (r.similar_cases && r.similar_cases.length > 0) {
    args.push({
      id: 'contrary-case-law-arg',
      title: 'Reliance on Contrary or Unfavourable Precedents',
      opponentPosition: 'The opposing party may cite similar cases where the court ruled against a comparable defense position, using those outcomes to argue for an unfavourable result in the current case.',
      reasoningBehind: `${r.similar_cases.length} similar case(s) were identified. Some of these may contain reasoning or outcomes the opposition could use to support their position.`,
      legalBasis: r.similar_laws.slice(0, 3).map(l => `${l.act_name}${l.section ? `, Section ${l.section}` : ''}`),
      evidenceTheyMayChallenge: r.similar_cases.slice(0, 3).map(c => c.parties || c.case_id || 'Similar case'),
      weaknessesTheyExploit: ['Similar fact patterns with unfavourable outcomes', 'Established legal principles working against the defense'],
      likelihood: 'LOW',
      likelihoodExplanation: 'Lower likelihood — case law reliance depends on the specific court and jurisdiction, but should be prepared for.',
      priority: 'LOW',
      category: 'Legal',
      counterStrategy: {
        evidenceToStrengthen: ['Research distinguishing factors between current case and similar cases'],
        factsToVerify: ['Identify key factual differences that make the similar cases inapplicable'],
        legalAuthoritiesToReview: r.similar_cases.slice(0, 3).map(c => c.parties || c.case_id || 'Relevant case'),
        questionsToInvestigate: ['Can each identified similar case be distinguished on facts or law?'],
      },
    });
  }

  // Sort by priority: HIGH first, then MEDIUM, then LOW
  const priorityOrder: Record<ArgumentPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  args.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Evidence attacks
  const evidenceAttacks: OpponentEvidenceAttack[] = [];
  if (r.missing_evidence.length > 0) {
    r.missing_evidence.forEach(m => {
      evidenceAttacks.push({
        evidence: m.label,
        possibleAttack: `Opposing party may challenge the absence or sufficiency of this evidence.`,
        risk: r.missing_evidence.length >= 3 ? 'HIGH' : 'MEDIUM',
        preparation: m.defense_argument,
      });
    });
  }
  if (r.weak_wording.length > 0) {
    r.weak_wording.slice(0, 3).forEach(w => {
      evidenceAttacks.push({
        evidence: w.original_sentence ? `Statement: "${w.original_sentence.slice(0, 60)}..."` : `Weak wording: "${w.detected_word}"`,
        possibleAttack: 'Opponent may challenge the credibility or precision of this statement.',
        risk: 'MEDIUM',
        preparation: w.defense_argument,
      });
    });
  }

  // Evidence gaps
  const evidenceGaps: OpponentEvidenceGap[] = r.missing_evidence.map(m => ({
    label: m.label,
    whyItMatters: `The absence of ${m.label} creates a gap in the evidentiary chain that the opposing side can exploit.`,
    opponentAdvantage: `The opposing party may argue that the lack of ${m.label} undermines the credibility of the case position.`,
    preparation: m.defense_argument,
  }));

  // Contradictions for the tab
  const opponentContradictions: OpponentContradiction[] = r.contradictions.map(c => ({
    statementA: c.type,
    statementB: c.detected,
    whyInconsistent: c.context ? `Potential inconsistency in context: ${c.context}` : 'The statements appear to be inconsistent based on the case information provided.',
    potentialArgument: `The opposing party may use this inconsistency to challenge witness credibility or the reliability of the factual account.`,
    recommendedClarification: c.argument,
  }));

  // Opponent overall strategy
  const opponentStrategy: string[] = [
    'Challenge the sufficiency and reliability of the available evidence.',
    'Question the chronology of events and identify timeline gaps.',
    ...(r.contradictions.length > 0 ? ['Attack witness and statement credibility using detected inconsistencies.'] : []),
    ...(r.missing_evidence.length > 0 ? ['Highlight missing evidence and documentation gaps.'] : []),
    'Rely on applicable legal sections to argue the legal elements are not satisfied.',
    ...(r.similar_cases.length > 0 ? ['Cite similar cases with unfavourable outcomes to establish precedent.'] : []),
    ...(r.weak_wording.length > 0 ? ['Exploit vague or speculative language in submitted arguments.'] : []),
    'Dispute the interpretation of the relevant legal provisions.',
  ];

  // Cases that may support opponent
  const opponentSupportingCases: OpponentCaseReference[] = r.similar_cases.map(c => ({
    caseId: c.case_id || 'N/A',
    parties: c.parties || 'Unknown Parties',
    relevantIssue: c.keywords || r.detected_label,
    whyHelpsOpponent: 'This case involves a similar fact pattern and may contain reasoning or an outcome the opposing party could cite.',
    relevantArgument: c.description || 'Similar case identified through semantic case matching.',
    similarityScore: c.similarity_score,
  }));

  const highCount = args.filter(a => a.priority === 'HIGH').length;
  const medCount = args.filter(a => a.priority === 'MEDIUM').length;
  const lowCount = args.filter(a => a.priority === 'LOW').length;

  return {
    arguments: args,
    evidenceAttacks,
    evidenceGaps,
    contradictions: opponentContradictions,
    opponentStrategy,
    opponentSupportingCases,
    summary: {
      totalArguments: args.length,
      highPriority: highCount,
      mediumPriority: medCount,
      lowPriority: lowCount,
      evidenceRisks: evidenceAttacks.length,
      potentialContradictions: opponentContradictions.length,
      evidenceGaps: evidenceGaps.length,
    },
  };
}

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  results: null,
  defenseResults: null,
  originalInput: null,
  additionalDetails: { ...INITIAL_ADDITIONAL_DETAILS },
  analysisHistory: [],
  currentVersionIndex: 0,
  opponentTabData: null,
  opponentTabLoading: false,
  opponentTabError: null,
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

  // ── Defense analysis (Initial v1) ───────────────────────────────────────────
  analyzeDefense: async (legalIssue, caseType, facts, desiredOutcome, caseTitle) => {
    set({
      isLoading: true,
      error: null,
      defenseResults: null,
      analysisHistory: [],
      currentVersionIndex: 0,
      originalInput: { legalIssue, caseType, facts, desiredOutcome, caseTitle },
      additionalDetails: {
        ...INITIAL_ADDITIONAL_DETAILS,
        caseTitle: caseTitle || '',
        caseType: caseType || 'Criminal',
      },
    });

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
        const initialVersion: AnalysisVersionItem = {
          version: 1,
          timestamp: new Date().toISOString(),
          formattedDate: formatDateNow(),
          result: data,
        };

        set({
          defenseResults: data,
          analysisHistory: [initialVersion],
          currentVersionIndex: 0,
          isLoading: false,
        });

        // Automatically save to Case History
        useCaseHistoryStore.getState().recordAnalyzerCase({
          caseTitle: caseTitle || '',
          caseType,
          legalIssue,
          facts,
          desiredOutcome,
          results: data,
        }).catch(() => {});

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

  // ── Re-analyze with Additional Case Details (v2, v3, ...) ──────────────────
  reAnalyzeDefense: async (details: AdditionalCaseDetails) => {
    const { originalInput, analysisHistory } = get();
    if (!originalInput) {
      set({ error: 'Original case information missing.' });
      return false;
    }

    set({ isLoading: true, error: null, additionalDetails: details });

    try {
      const combinedFacts = buildCombinedFacts(originalInput.facts, details);
      const effectiveLegalIssue = details.relevantLegalIssues.length > 0
        ? `${originalInput.legalIssue}, ${details.relevantLegalIssues.join(', ')}`
        : originalInput.legalIssue;
      const effectiveCaseType = details.caseType || originalInput.caseType;

      const res = await fetch(API_ENDPOINTS.AI_ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_issue: effectiveLegalIssue,
          case_type: effectiveCaseType,
          facts: combinedFacts,
          desired_outcome: originalInput.desiredOutcome,
          top_k: 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: DefenseAnalysisResult = await res.json();

      if (data.status === 'success') {
        const prevVersion = analysisHistory[analysisHistory.length - 1];
        const prevResult = prevVersion ? prevVersion.result : null;

        // Compute meaningful differences
        const detailsCount = countAdditionalDetails(details);
        const resolvedEvidence: string[] = [];
        if (prevResult) {
          const currentLabels = new Set(data.missing_evidence.map((m) => m.label));
          prevResult.missing_evidence.forEach((m) => {
            if (!currentLabels.has(m.label)) {
              resolvedEvidence.push(m.label);
            }
          });
        }

        // Additional advisory considerations based on newly supplied structured data
        const newConsiderations: string[] = [];
        if (details.forensicReportStatus === 'Available') {
          newConsiderations.push('Forensic evidence should be independently verified: The newly added forensic report details may affect the evidentiary assessment of the prosecution.');
        }
        if (details.chainOfCustodyStatus === 'Incomplete' || details.chainOfCustodyStatus === 'Not Available') {
          newConsiderations.push('Chain of custody vulnerability identified: Any gap in evidence continuity creates substantial grounds to challenge evidence admissibility.');
        }
        if (details.searchWarrantInvolved === 'No') {
          newConsiderations.push('Warrantless search procedural challenge: Review whether mandatory statutory exceptions apply under Sri Lankan procedural law.');
        }
        if (details.confessionAdmission === 'Yes') {
          newConsiderations.push('Confession voluntariness review: Verify whether statements were recorded in compliance with statutory confession safeguards.');
        }

        const diffSummary: DiffSummary = {
          additionalDetailsCount: detailsCount,
          riskChange: prevResult && prevResult.risk_level !== data.risk_level
            ? { from: prevResult.risk_level, to: data.risk_level }
            : undefined,
          missingEvidenceCountChange: prevResult && prevResult.missing_evidence.length !== data.missing_evidence.length
            ? { from: prevResult.missing_evidence.length, to: data.missing_evidence.length }
            : undefined,
          resolvedMissingEvidence: resolvedEvidence,
          weakWordsCountChange: prevResult && prevResult.weak_wording.length !== data.weak_wording.length
            ? { from: prevResult.weak_wording.length, to: data.weak_wording.length }
            : undefined,
          contradictionsCountChange: prevResult && prevResult.contradictions.length !== data.contradictions.length
            ? { from: prevResult.contradictions.length, to: data.contradictions.length }
            : undefined,
          confidenceChange: prevResult && Math.round(prevResult.confidence * 100) !== Math.round(data.confidence * 100)
            ? { from: Math.round(prevResult.confidence * 100), to: Math.round(data.confidence * 100) }
            : undefined,
          newDefenseConsiderations: newConsiderations,
        };

        const newVersionNum = analysisHistory.length + 1;
        const newVersionItem: AnalysisVersionItem = {
          version: newVersionNum,
          timestamp: new Date().toISOString(),
          formattedDate: formatDateNow(),
          result: data,
          additionalDetailsSnapshot: JSON.parse(JSON.stringify(details)),
          diffSummary,
        };

        const updatedHistory = [...analysisHistory, newVersionItem];

        set({
          defenseResults: data,
          analysisHistory: updatedHistory,
          currentVersionIndex: updatedHistory.length - 1,
          isLoading: false,
        });

        // Automatically update Case History
        useCaseHistoryStore.getState().recordAnalyzerCase({
          caseTitle: details.caseTitle || originalInput.caseTitle || '',
          caseType: details.caseType || originalInput.caseType,
          legalIssue: originalInput.legalIssue,
          facts: originalInput.facts,
          desiredOutcome: originalInput.desiredOutcome,
          results: data,
          additionalDetails: details
        }).catch(() => {});

        return true;
      } else {
        set({ error: 'Re-analysis returned no results.', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({
        error: `Re-analysis failed. (${err.message})`,
        isLoading: false,
      });
      return false;
    }
  },

  updateAdditionalDetails: (details) =>
    set((state) => ({
      additionalDetails: { ...state.additionalDetails, ...details },
    })),

  switchVersion: (index) => {
    const { analysisHistory } = get();
    if (index >= 0 && index < analysisHistory.length) {
      set({
        currentVersionIndex: index,
        defenseResults: analysisHistory[index].result,
        // Invalidate cached opponent data when switching versions
        opponentTabData: null,
        opponentTabError: null,
      });
    }
  },

  generateOpponentArguments: async () => {
    const { defenseResults, originalInput, opponentTabData, opponentTabLoading } = get();
    // Already generated or currently loading — skip
    if (opponentTabData || opponentTabLoading) return;
    if (!defenseResults) {
      set({ opponentTabError: 'No defense analysis available. Run a defense analysis first.' });
      return;
    }
    set({ opponentTabLoading: true, opponentTabError: null });
    // Derive locally from existing data (instant, no network call required)
    try {
      // Simulate a short async step so the loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 1200));
      const derived = deriveOpponentArguments(defenseResults, originalInput);
      set({ opponentTabData: derived, opponentTabLoading: false });
    } catch (err: any) {
      set({ opponentTabError: 'Unable to generate opponent analysis. Please try again.', opponentTabLoading: false });
    }
  },

  clearResults: () =>
    set({
      results: null,
      defenseResults: null,
      originalInput: null,
      additionalDetails: { ...INITIAL_ADDITIONAL_DETAILS },
      analysisHistory: [],
      currentVersionIndex: 0,
      opponentTabData: null,
      opponentTabLoading: false,
      opponentTabError: null,
      error: null,
    }),
}));
