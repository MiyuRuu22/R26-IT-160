import { create } from 'zustand';
import { BASE_URL } from '../config/api';

// ── 14-Section Adversarial Analysis Types ───────────────────────────────────────

export interface OverallRiskAssessment {
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
    confidence_score: number;
    short_explanation: string;
    prosecution_strength_factors: string[];
    prosecution_weakness_factors: string[];
}

export interface ProsecutionArgument {
    title: string;
    argument: string;
    supporting_evidence: string;
    prosecution_objective: string;
    expected_defense_response: string;
    strength: 'Strong' | 'Moderate' | 'Weak';
    confidence: number;
}

export interface ProsecutionTheory {
    narrative: string;
    alleged_conduct: string;
    alleged_intent_knowledge: string;
    alleged_possession_control: string;
    evidentiary_chain: string[];
    key_witnesses: string[];
    key_documents_exhibits: string[];
}

export interface DefenseAttackItem {
    defense_claim: string;
    prosecution_counterargument: string;
    prosecution_leverage_point: string;
    defense_counter_strategy: string;
}

export interface DefenseVulnerability {
    title: string;
    description: string;
    supporting_case_fact: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    why_exploitable: string;
    recommended_lawyer_review: string;
}

export interface EvidenceAnalysisItem {
    evidence_item: string;
    what_it_proves: string;
    what_it_does_not_prove: string;
    prosecution_value: string;
    defense_challenge: string;
    reliability_level: 'High' | 'Moderate' | 'Low' | 'Questionable';
}

export interface WitnessAnalysisItem {
    witness_name_role: string;
    witness_category: 'Direct Witness' | 'Corroborating Witness' | 'Expert Witness' | 'Police Witness' | 'Civilian Witness';
    expected_testimony: string;
    prosecution_value: string;
    credibility_reliability: string;
    likely_cross_examination_issues: string[];
    contradictions_or_gaps: string;
}

export interface ProceduralAnalysis {
    search_circumstances: string;
    warrant_status: string;
    stated_grounds: string;
    arrest_circumstances: string;
    seizure_procedure: string;
    procedural_issues: string[];
    documentation_custody_gaps: string[];
}

export interface ForensicChainAnalysis {
    forensic_report_status: string;
    scientific_confirmation: string;
    exhibit_identification: string;
    sealing_and_seal_number: string;
    transfers_and_custody_records: string;
    laboratory_receipt: string;
    missing_documentation: string[];
}

export interface MissingEvidenceItem {
    item: string;
    category: string;
    impact_on_prosecution: string;
    defense_advantage: string;
}

export interface ContradictionItem {
    issue: string;
    source_a: string;
    source_b: string;
    explanation: string;
    defense_utility: string;
}

export interface NextProsecutionMove {
    primary_next_move: string;
    secondary_next_moves: string[];
    anticipated_filings: string[];
    strategic_objective: string;
}

export interface DefensePriorityItem {
    rank: number;
    priority_issue: string;
    tied_evidence: string;
    action_recommended: string;
    urgency: 'Immediate' | 'High' | 'Moderate';
}

export interface AdversarialSummary {
    strongest_prosecution_point: string;
    strongest_defense_point: string;
    biggest_evidentiary_uncertainty: string;
    biggest_procedural_uncertainty: string;
    most_important_missing_evidence: string;
    most_important_lawyer_review_issue: string;
    legal_safety_notice: string;
}

export interface AdversarialAnalysisResult {
    overall_risk_assessment: OverallRiskAssessment;
    likely_prosecution_arguments: ProsecutionArgument[];
    prosecution_theory_of_case: ProsecutionTheory;
    attacks_on_defense: DefenseAttackItem[];
    detected_defense_vulnerabilities: DefenseVulnerability[];
    prosecution_evidence_analysis: EvidenceAnalysisItem[];
    witness_analysis: WitnessAnalysisItem[];
    search_arrest_procedural_analysis: ProceduralAnalysis;
    forensic_chain_of_custody_analysis: ForensicChainAnalysis;
    missing_evidence: MissingEvidenceItem[];
    contradictions_inconsistencies: ContradictionItem[];
    most_likely_next_prosecution_move: NextProsecutionMove;
    defense_priorities: DefensePriorityItem[];
    overall_adversarial_summary: AdversarialSummary;
}

// ── Legacy Compatibility Interfaces ──────────────────────────────────────────

interface LegacyWeakness { pattern: string; reason: string }
interface LegacyContradiction { issue: string }

export interface LegacyAnalysisResult {
    weaknesses: LegacyWeakness[];
    contradictions: LegacyContradiction[];
    missingEvidence: string[];
    detectedClaims: string[];
}

export interface LegacyPredictionResult {
    likelyOpponentArguments: string[];
    prosecutionObjections: string[];
    evidenceAttacks: string[];
    proceduralObjections: string[];
    preparationRecommendations: string[];
}

export interface LegacyRiskScore {
    riskLevel: string;
    confidenceScore: number;
    vulnerabilityAnalysis: string;
}

// ── Store State & Actions ───────────────────────────────────────────────────

interface OpponentState {
    // Primary Input Fields
    charges: string;
    defenseArguments: string;
    caseType: string;
    caseFacts: string;
    legalSections: string;

    // Incident & Parties
    incidentDate: string;
    incidentLocation: string;
    policeStation: string;
    accusedPerson: string;
    investigatingOfficer: string;

    // Evidence & Forensics
    physicalEvidenceType: string;
    physicalEvidenceQuantity: string;
    physicalEvidenceLocation: string;
    physicalEvidenceRecoveredBy: string;
    forensicReportStatus: string;
    forensicReportDetails: string;
    chainOfCustodyStatus: string;
    chainOfCustodyDetails: string;

    // Search & Arrest Details
    searchWarrantInvolved: string;
    searchDetails: string;
    arrestCircumstances: string;

    // Statements & Witnesses
    accusedStatementAvailable: string;
    confessionAdmission: string;
    statementDetails: string;
    witnessEvidenceStatus: string;
    witnessSummaries: string;
    hearingNotes: string;
    evidenceSummaries: string;

    // Results State
    adversarialAnalysis: AdversarialAnalysisResult | null;
    analysis: LegacyAnalysisResult | null;
    predictions: LegacyPredictionResult | null;
    risk: LegacyRiskScore | null;
    sessionId: string | null;

    isLoading: boolean;
    error: string | null;

    // Actions
    setField: (field: string, value: any) => void;
    runAnalysis: () => Promise<void>;
    importFromAnalyzerStore: (additionalDetails: any, originalInput: any) => void;
    loadDrugCasePreset: () => void;
    reset: () => void;
}

export const useOpponentStore = create<OpponentState>((set, get) => ({
    charges: '',
    defenseArguments: '',
    caseType: 'Criminal',
    caseFacts: '',
    legalSections: '',

    incidentDate: '',
    incidentLocation: '',
    policeStation: '',
    accusedPerson: '',
    investigatingOfficer: '',

    physicalEvidenceType: '',
    physicalEvidenceQuantity: '',
    physicalEvidenceLocation: '',
    physicalEvidenceRecoveredBy: '',
    forensicReportStatus: 'Unknown',
    forensicReportDetails: '',
    chainOfCustodyStatus: 'Unknown',
    chainOfCustodyDetails: '',

    searchWarrantInvolved: 'Unknown',
    searchDetails: '',
    arrestCircumstances: '',

    accusedStatementAvailable: 'Unknown',
    confessionAdmission: 'Unknown',
    statementDetails: '',
    witnessEvidenceStatus: 'Unknown',
    witnessSummaries: '',
    hearingNotes: '',
    evidenceSummaries: '',

    adversarialAnalysis: null,
    analysis: null,
    predictions: null,
    risk: null,
    sessionId: null,

    isLoading: false,
    error: null,

    setField: (field, value) => set({ [field]: value }),

    runAnalysis: async () => {
        const state = get();
        
        if (!state.charges.trim() || !state.defenseArguments.trim()) {
            set({ error: 'Charges and Defense Arguments are required fields.' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const payload = {
                charges: state.charges,
                defenseArguments: state.defenseArguments,
                caseType: state.caseType,
                caseFacts: state.caseFacts,
                legalSections: state.legalSections,

                incidentDate: state.incidentDate,
                incidentLocation: state.incidentLocation,
                policeStation: state.policeStation,
                accusedPerson: state.accusedPerson,
                investigatingOfficer: state.investigatingOfficer,

                physicalEvidenceAvailable: Boolean(state.physicalEvidenceType),
                physicalEvidenceType: state.physicalEvidenceType,
                physicalEvidenceQuantity: state.physicalEvidenceQuantity,
                physicalEvidenceLocation: state.physicalEvidenceLocation,
                physicalEvidenceRecoveredBy: state.physicalEvidenceRecoveredBy,

                forensicReportStatus: state.forensicReportStatus,
                forensicReportDetails: state.forensicReportDetails,
                chainOfCustodyStatus: state.chainOfCustodyStatus,
                chainOfCustodyDetails: state.chainOfCustodyDetails,

                searchWarrantInvolved: state.searchWarrantInvolved,
                searchDetails: state.searchDetails,
                arrestCircumstances: state.arrestCircumstances,

                accusedStatementAvailable: state.accusedStatementAvailable,
                confessionAdmission: state.confessionAdmission,
                statementDetails: state.statementDetails,

                witnessEvidenceStatus: state.witnessEvidenceStatus,
                witnessSummaries: state.witnessSummaries,
                hearingNotes: state.hearingNotes,
                evidenceSummaries: state.evidenceSummaries
            };

            const response = await fetch(`${BASE_URL}/opponent/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const resJson = await response.json();

            if (resJson.status === 'success' && resJson.data) {
                set({
                    adversarialAnalysis: resJson.data.adversarialAnalysis || null,
                    analysis: resJson.data.analysis || null,
                    predictions: resJson.data.predictions || null,
                    risk: resJson.data.risk || null,
                    sessionId: resJson.data.sessionId || null,
                    isLoading: false,
                    error: null
                });
            } else {
                set({ error: resJson.message || 'Analysis failed to return structured results.', isLoading: false });
            }
        } catch (err: any) {
            set({ error: `Network error connecting to Backend (${err.message}). Verify backend server is running.`, isLoading: false });
        }
    },

    importFromAnalyzerStore: (additionalDetails: any, originalInput: any) => {
        if (!additionalDetails && !originalInput) return;

        set((state) => ({
            charges: originalInput?.legalIssue || state.charges,
            caseType: originalInput?.caseType || additionalDetails?.caseType || state.caseType,
            caseFacts: originalInput?.facts || state.caseFacts,
            defenseArguments: additionalDetails?.knownDefenseArguments || originalInput?.desiredOutcome || state.defenseArguments,
            legalSections: (additionalDetails?.relevantLegalIssues || []).join(', '),

            incidentDate: additionalDetails?.incidentDate || state.incidentDate,
            incidentLocation: additionalDetails?.location || state.incidentLocation,
            policeStation: additionalDetails?.policeStation || state.policeStation,
            accusedPerson: additionalDetails?.accusedPerson || state.accusedPerson,
            investigatingOfficer: additionalDetails?.investigatingOfficer || state.investigatingOfficer,

            physicalEvidenceType: additionalDetails?.physicalEvidenceType || state.physicalEvidenceType,
            physicalEvidenceQuantity: additionalDetails?.physicalEvidenceQuantity || state.physicalEvidenceQuantity,
            physicalEvidenceLocation: additionalDetails?.physicalEvidenceLocation || state.physicalEvidenceLocation,
            physicalEvidenceRecoveredBy: additionalDetails?.physicalEvidenceRecoveredBy || state.physicalEvidenceRecoveredBy,

            forensicReportStatus: additionalDetails?.forensicReportStatus || state.forensicReportStatus,
            forensicReportDetails: additionalDetails?.forensicReportDetails || state.forensicReportDetails,
            chainOfCustodyStatus: additionalDetails?.chainOfCustodyStatus || state.chainOfCustodyStatus,
            chainOfCustodyDetails: additionalDetails?.chainOfCustodyDetails || state.chainOfCustodyDetails,

            searchWarrantInvolved: additionalDetails?.searchWarrantInvolved || state.searchWarrantInvolved,
            searchDetails: additionalDetails?.searchDetails || state.searchDetails,
            arrestCircumstances: additionalDetails?.arrestCircumstances || state.arrestCircumstances,

            accusedStatementAvailable: additionalDetails?.accusedStatementAvailable || state.accusedStatementAvailable,
            confessionAdmission: additionalDetails?.confessionAdmission || state.confessionAdmission,
            statementDetails: additionalDetails?.statementDetails || state.statementDetails,

            witnessEvidenceStatus: additionalDetails?.witnessEvidenceStatus || state.witnessEvidenceStatus,
            witnessSummaries: (additionalDetails?.witnesses || []).map((w: any) => `${w.name} (${w.role}): ${w.description}`).join('; '),
        }));
    },

    loadDrugCasePreset: () => {
        set({
            charges: 'Possession and Trafficking of Methamphetamine under Section 54A / Poisons, Opium and Dangerous Drugs Ordinance',
            defenseArguments: 'The accused denies knowledge and possession of the substance. The accused was merely an occasional passenger in a vehicle owned and controlled by a third party. The recovery was made underneath the passenger seat without exclusive control, no fingerprints or DNA link the accused to the packaging, the search was conducted without a warrant, and the chain of custody lacks exhibit seal numbers with the Government Analyst report still pending.',
            caseType: 'Criminal',
            caseFacts: 'During a roadside vehicle checkpoint stop, police officers intercepted a passenger motor vehicle and conducted a warrantless interior search, allegedly discovering a packet concealed under the passenger seat where the accused was seated.',
            legalSections: 'Section 54A Poisons, Opium and Dangerous Drugs Ordinance; Section 106 Evidence Ordinance',

            incidentDate: '2026-08-20',
            incidentLocation: 'Piliyandala Roadside Checkpoint',
            policeStation: 'Piliyandala Police Station',
            accusedPerson: 'Ruwan Kumara (Accused Passenger)',
            investigatingOfficer: 'Sub-Inspector Bandara',

            physicalEvidenceType: 'Alleged Methamphetamine ("Ice")',
            physicalEvidenceQuantity: 'Approximately 4.65g gross substance',
            physicalEvidenceLocation: 'Underneath the front passenger seat',
            physicalEvidenceRecoveredBy: 'Sub-Inspector Bandara (Arresting Officer)',

            forensicReportStatus: 'Pending',
            forensicReportDetails: 'Government Analyst report pending; chemical composition and pure quantitative weight not yet scientifically confirmed',

            chainOfCustodyStatus: 'Incomplete',
            chainOfCustodyDetails: 'Missing exhibit seal number on the recovery note; undocumented storage period in station property room prior to court dispatch',

            searchWarrantInvolved: 'No',
            searchDetails: 'Warrantless vehicle search conducted roadside without contemporaneous recording of grounds for dispensing with warrant',
            arrestCircumstances: 'Arrested immediately inside the vehicle following alleged discovery underneath passenger seat',

            accusedStatementAvailable: 'Yes',
            confessionAdmission: 'No',
            statementDetails: 'Accused denied all knowledge of contraband; stated he had merely requested a ride from the driver 10 minutes prior to the checkpoint',

            witnessEvidenceStatus: 'Statements unavailable',
            witnessSummaries: 'No independent civilian witnesses present at search or seizure; testimony limited strictly to police unit members',
            hearingNotes: 'Pre-trial stage; bail application pending; defense challenging prosecution remand application on grounds of lack of GA report and broken custody chain.'
        });
    },

    reset: () => set({
        charges: '',
        defenseArguments: '',
        caseType: 'Criminal',
        caseFacts: '',
        legalSections: '',

        incidentDate: '',
        incidentLocation: '',
        policeStation: '',
        accusedPerson: '',
        investigatingOfficer: '',

        physicalEvidenceType: '',
        physicalEvidenceQuantity: '',
        physicalEvidenceLocation: '',
        physicalEvidenceRecoveredBy: '',
        forensicReportStatus: 'Unknown',
        forensicReportDetails: '',
        chainOfCustodyStatus: 'Unknown',
        chainOfCustodyDetails: '',

        searchWarrantInvolved: 'Unknown',
        searchDetails: '',
        arrestCircumstances: '',

        accusedStatementAvailable: 'Unknown',
        confessionAdmission: 'Unknown',
        statementDetails: '',
        witnessEvidenceStatus: 'Unknown',
        witnessSummaries: '',
        hearingNotes: '',
        evidenceSummaries: '',

        adversarialAnalysis: null,
        analysis: null,
        predictions: null,
        risk: null,
        sessionId: null,
        error: null,
        isLoading: false
    })
}));
