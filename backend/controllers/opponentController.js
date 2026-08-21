const axios = require('axios');
const OpponentSession = require('../models/OpponentSession');
const { formatResponse } = require('../utils/helper');

// Configure AI Engine URL
const AI_ENGINE_URL = process.env.SEARCH_AI_URL || 'http://127.0.0.1:8000';

const runFullAnalysis = async (req, res) => {
    try {
        const {
            defenseArguments,
            charges,
            hearingNotes = "",
            witnessSummaries = "",
            evidenceSummaries = "",
            legalSections = ""
        } = req.body;

        if (!defenseArguments || !charges) {
            return res.status(400).json({ status: 'error', message: 'Missing defenseArguments or charges.' });
        }

        // 1. Analyze Argument
        const analyzeRes = await axios.post(`${AI_ENGINE_URL}/opponent/analyze-argument`, {
            defense_arguments: defenseArguments,
            charges: charges,
            hearing_notes: hearingNotes,
            witness_summaries: witnessSummaries,
            evidence_summaries: evidenceSummaries,
            legal_sections: legalSections
        });
        const analysisData = analyzeRes.data;

        // 2. Predict Opponent
        const predictRes = await axios.post(`${AI_ENGINE_URL}/opponent/predict-opponent`, {
            analyzed_data: analysisData
        });
        const predictionData = predictRes.data;

        // 3. Risk Analysis
        const riskRes = await axios.post(`${AI_ENGINE_URL}/opponent/risk-analysis`, {
            weaknesses_count: analysisData.weaknesses.length,
            contradictions_count: analysisData.contradictions.length,
            missing_evidence_count: analysisData.missing_evidence.length
        });
        const riskData = riskRes.data;

        // 4. Save to Database (if connected)
        let sessionId = 'session-' + Date.now();
        const sessionPayload = {
            defenseArguments,
            charges,
            hearingNotes,
            witnessSummaries,
            evidenceSummaries,
            legalSections,
            analysisResults: {
                weaknesses: analysisData.weaknesses,
                contradictions: analysisData.contradictions,
                missingEvidence: analysisData.missing_evidence,
                detectedClaims: analysisData.detected_claims
            },
            predictions: {
                likelyOpponentArguments: predictionData.likely_opponent_arguments,
                prosecutionObjections: predictionData.prosecution_objections,
                evidenceAttacks: predictionData.evidence_attacks,
                proceduralObjections: predictionData.procedural_objections,
                preparationRecommendations: predictionData.preparation_recommendations
            },
            riskScore: {
                riskLevel: riskData.risk_level,
                confidenceScore: riskData.confidence_score,
                vulnerabilityAnalysis: riskData.vulnerability_analysis
            }
        };

        if (require('mongoose').connection.readyState === 1) {
            try {
                const newSession = new OpponentSession(sessionPayload);
                await newSession.save();
                sessionId = newSession._id;
            } catch (dbErr) {
                console.warn('[Opponent DB Save Warning]:', dbErr.message);
            }
        }

        res.status(200).json(formatResponse({
            sessionId: sessionId,
            analysis: sessionPayload.analysisResults,
            predictions: sessionPayload.predictions,
            risk: sessionPayload.riskScore
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
