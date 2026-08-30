const axios = require('axios');
const OpponentSession = require('../models/OpponentSession');
const { formatResponse } = require('../utils/helper');

// Configure AI Engine URL
const AI_ENGINE_URL = process.env.SEARCH_AI_URL || process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

/**
 * Normalizes input from frontend which may use camelCase or snake_case or nested additionalDetails
 */
function normalizeCasePayload(body) {
    const details = body.additionalDetails || {};

    return {
        charges: body.charges || details.charges || "",
        defense_arguments: body.defenseArguments || body.defense_arguments || details.knownDefenseArguments || "",
        case_type: body.caseType || body.case_type || details.caseType || "Criminal",
        legal_sections: body.legalSections || body.legal_sections || (details.relevantLegalIssues ? details.relevantLegalIssues.join(', ') : ""),
        case_facts: body.caseFacts || body.case_facts || body.facts || details.incidentDescription || "",

        incident_date: body.incidentDate || body.incident_date || details.incidentDate || "",
        incident_time: body.incidentTime || body.incident_time || details.incidentTime || "",
        incident_location: body.incidentLocation || body.location || body.incident_location || details.location || "",
        police_station: body.policeStation || body.police_station || details.policeStation || "",
        incident_description: body.incidentDescription || body.incident_description || details.incidentDescription || "",

        accused_person: body.accusedPerson || body.accused_person || details.accusedPerson || "",
        investigating_officer: body.investigatingOfficer || body.investigating_officer || details.investigatingOfficer || "",
        other_persons: body.otherPersons || body.other_persons || details.otherPersons || "",
        witnesses: body.witnesses || details.witnesses || [],

        physical_evidence_available: body.physicalEvidenceAvailable !== undefined ? body.physicalEvidenceAvailable : (details.physicalEvidenceAvailable || false),
        physical_evidence_type: body.physicalEvidenceType || body.physical_evidence_type || details.physicalEvidenceType || "",
        physical_evidence_quantity: body.physicalEvidenceQuantity || body.physical_evidence_quantity || details.physicalEvidenceQuantity || "",
        physical_evidence_location: body.physicalEvidenceLocation || body.physical_evidence_location || details.physicalEvidenceLocation || "",
        physical_evidence_recovered_by: body.physicalEvidenceRecoveredBy || body.physical_evidence_recovered_by || details.physicalEvidenceRecoveredBy || "",
        physical_evidence_date_time: body.physicalEvidenceDateTime || body.physical_evidence_date_time || details.physicalEvidenceDateTime || "",

        forensic_report_status: body.forensicReportStatus || body.forensic_report_status || details.forensicReportStatus || "Unknown",
        forensic_report_details: body.forensicReportDetails || body.forensic_report_details || details.forensicReportDetails || "",

        chain_of_custody_status: body.chainOfCustodyStatus || body.chain_of_custody_status || details.chainOfCustodyStatus || "Unknown",
        chain_of_custody_details: body.chainOfCustodyDetails || body.chain_of_custody_details || details.chainOfCustodyDetails || "",

        digital_evidence_status: body.digitalEvidenceStatus || body.digital_evidence_status || details.digitalEvidenceStatus || "Unknown",
        digital_evidence_details: body.digitalEvidenceDetails || body.digital_evidence_details || details.digitalEvidenceDetails || "",
        cctv_status: body.cctvStatus || body.cctv_status || details.cctvStatus || "Unknown",
        cctv_details: body.cctvDetails || body.cctv_details || details.cctvDetails || "",
        witness_evidence_status: body.witnessEvidenceStatus || body.witness_evidence_status || details.witnessEvidenceStatus || "Unknown",
        witness_evidence_details: body.witnessEvidenceDetails || body.witness_evidence_details || details.witnessEvidenceDetails || "",

        arrest_circumstances: body.arrestCircumstances || body.arrest_circumstances || details.arrestCircumstances || "",
        search_conducted: body.searchConducted || body.search_conducted || details.searchConducted || "Unknown",
        search_location: body.searchLocation || body.search_location || details.searchLocation || "",
        search_date_time: body.searchDateTime || body.search_date_time || details.searchDateTime || "",
        search_conducted_by: body.searchConductedBy || body.search_conducted_by || details.searchConductedBy || "",
        search_warrant_involved: body.searchWarrantInvolved || body.search_warrant_involved || details.searchWarrantInvolved || "Unknown",
        search_details: body.searchDetails || body.search_details || details.searchDetails || "",
        seizure_items: body.seizureItems || body.seizure_items || details.seizureItems || "",
        seizure_location: body.seizureLocation || body.seizure_location || details.seizureLocation || "",
        seizure_recovered_from: body.seizureRecoveredFrom || body.seizure_recovered_from || details.seizureRecoveredFrom || "",
        seizure_witnessed: body.seizureWitnessed || body.seizure_witnessed || details.seizureWitnessed || "Unknown",

        accused_statement_available: body.accusedStatementAvailable || body.accused_statement_available || details.accusedStatementAvailable || "Unknown",
        confession_admission: body.confessionAdmission || body.confession_admission || details.confessionAdmission || "Unknown",
        statement_details: body.statementDetails || body.statement_details || details.statementDetails || "",

        known_defense_arguments: body.knownDefenseArguments || body.known_defense_arguments || details.knownDefenseArguments || "",
        supporting_facts: body.supportingFacts || body.supporting_facts || details.supportingFacts || "",
        disputed_facts: body.disputedFacts || body.disputed_facts || details.disputedFacts || "",
        hearing_notes: body.hearingNotes || body.hearing_notes || "",
        previous_hearing_context: body.previousHearingContext || body.previous_hearing_context || "",
        evidence_summaries: body.evidenceSummaries || body.evidence_summaries || "",
        witness_summaries: body.witnessSummaries || body.witness_summaries || "",
        other_relevant_info: body.otherRelevantInfo || body.other_relevant_info || details.otherRelevantInfo || "",
        documents: body.documents || details.documents || []
    };
}

/**
 * Main analysis handler: runs the full 14-section adversarial analysis
 */
const runFullAnalysis = async (req, res) => {
    try {
        const normalized = normalizeCasePayload(req.body);

        if (!normalized.defense_arguments || !normalized.charges) {
            return res.status(400).json({
                status: 'error',
                message: 'Charges and Defense Arguments are required fields.'
            });
        }

        // Development logging: log received field names only (redact sensitive values)
        if (process.env.NODE_ENV !== 'production') {
            const activeKeys = Object.keys(normalized).filter(k => {
                const val = normalized[k];
                return val !== "" && val !== "Unknown" && val !== false && !(Array.isArray(val) && val.length === 0);
            });
            console.log(`[OpponentController DEV LOG] Forwarding complete case object to AI Engine. Active fields (${activeKeys.length}): ${activeKeys.join(', ')}`);
        }

        // 1. Call AI Engine for 14-section Adversarial Analysis
        let adversarialData = null;
        try {
            const aiResponse = await axios.post(`${AI_ENGINE_URL}/opponent/full-analysis`, normalized, { timeout: 35000 });
            adversarialData = aiResponse.data;
        } catch (engineErr) {
            console.error('[OpponentController] Full analysis endpoint error:', engineErr.message);
            // Fallback attempt: if full-analysis failed, try analyze-argument
            const fallbackRes = await axios.post(`${AI_ENGINE_URL}/opponent/analyze-argument`, {
                defense_arguments: normalized.defense_arguments,
                charges: normalized.charges,
                hearing_notes: normalized.hearing_notes,
                witness_summaries: normalized.witness_summaries,
                evidence_summaries: normalized.evidence_summaries,
                legal_sections: normalized.legal_sections
            });
            const analysisData = fallbackRes.data;
            const predictRes = await axios.post(`${AI_ENGINE_URL}/opponent/predict-opponent`, { analyzed_data: analysisData });
            const riskRes = await axios.post(`${AI_ENGINE_URL}/opponent/risk-analysis`, {
                weaknesses_count: analysisData.weaknesses.length,
                contradictions_count: analysisData.contradictions.length,
                missing_evidence_count: analysisData.missing_evidence.length
            });

            return res.status(200).json(formatResponse({
                sessionId: 'session-' + Date.now(),
                analysis: analysisData,
                predictions: predictRes.data,
                risk: riskRes.data
            }));
        }

        // 2. Build backward-compatible structure alongside the rich 14-section result
        const legacyAnalysis = {
            weaknesses: (adversarialData.detected_defense_vulnerabilities || []).map(v => ({
                pattern: v.title,
                reason: `[${v.severity}] ${v.description} (Lawyer review: ${v.recommended_lawyer_review})`
            })),
            contradictions: (adversarialData.contradictions_inconsistencies || []).map(c => ({
                issue: `${c.issue}: ${c.explanation}`
            })),
            missingEvidence: (adversarialData.missing_evidence || []).map(m => `${m.item} (${m.category})`),
            detectedClaims: [
                "Challenge to Constructive Possession",
                "Procedural Regularity Challenge",
                "Forensic & Chain of Custody Scrutiny"
            ]
        };

        const legacyPredictions = {
            likelyOpponentArguments: (adversarialData.likely_prosecution_arguments || []).map(a => `${a.title}: ${a.argument}`),
            prosecutionObjections: [
                "Objection to defense cross-examination regarding uncalled civilian witnesses.",
                "Objection to premature discharge applications prior to Government Analyst report tendering."
            ],
            evidenceAttacks: (adversarialData.prosecution_evidence_analysis || []).map(e => `${e.evidence_item}: ${e.prosecution_value}`),
            proceduralObjections: (adversarialData.search_arrest_procedural_analysis?.procedural_issues || []),
            preparationRecommendations: (adversarialData.defense_priorities || []).map(p => `Priority #${p.rank}: ${p.priority_issue} - ${p.action_recommended}`)
        };

        const legacyRisk = {
            riskLevel: adversarialData.overall_risk_assessment?.risk_level || "MODERATE",
            confidenceScore: (adversarialData.overall_risk_assessment?.confidence_score || 75) / 100,
            vulnerabilityAnalysis: adversarialData.overall_risk_assessment?.short_explanation || "Adversarial evaluation completed based on evidence record."
        };

        // 3. Save to database if connected
        let sessionId = 'session-' + Date.now();
        const sessionPayload = {
            charges: normalized.charges,
            defenseArguments: normalized.defense_arguments,
            caseType: normalized.case_type,
            hearingNotes: normalized.hearing_notes,
            witnessSummaries: normalized.witness_summaries,
            evidenceSummaries: normalized.evidence_summaries,
            legalSections: normalized.legal_sections,
            caseData: normalized,
            adversarialAnalysis: adversarialData,
            analysisResults: legacyAnalysis,
            predictions: legacyPredictions,
            riskScore: legacyRisk
        };

        if (require('mongoose').connection.readyState === 1) {
            try {
                const newSession = new OpponentSession(sessionPayload);
                await newSession.save();
                sessionId = newSession._id.toString();
            } catch (dbErr) {
                console.warn('[Opponent DB Save Warning]:', dbErr.message);
            }
        }

        // Return complete structured response
        res.status(200).json(formatResponse({
            sessionId: sessionId,
            adversarialAnalysis: adversarialData,
            analysis: legacyAnalysis,
            predictions: legacyPredictions,
            risk: legacyRisk
        }));

    } catch (error) {
        console.error('[runFullAnalysis Error]:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to run full opponent analysis', error: error.message });
    }
};

const extractInsights = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ status: 'error', message: 'Missing text for insights.' });
        }
        const insightRes = await axios.post(`${AI_ENGINE_URL}/opponent/extract-insights`, { text });
        res.status(200).json(formatResponse(insightRes.data));
    } catch (error) {
        console.error('[extractInsights Error]:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to extract insights' });
    }
};

module.exports = {
    runFullAnalysis,
    extractInsights
};
