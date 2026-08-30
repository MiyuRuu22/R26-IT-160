const mongoose = require('mongoose');

const opponentSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    defenseArguments: { type: String, required: true },
    charges: { type: String, required: true },
    caseType: { type: String, default: 'Criminal' },
    hearingNotes: { type: String },
    witnessSummaries: { type: String },
    evidenceSummaries: { type: String },
    legalSections: { type: String },
    
    // Complete incoming case context
    caseData: { type: mongoose.Schema.Types.Mixed },

    // Comprehensive 14-section adversarial analysis
    adversarialAnalysis: { type: mongoose.Schema.Types.Mixed },

    // Legacy fields preserved for backward compatibility
    analysisResults: {
        weaknesses: [{
            pattern: String,
            reason: String
        }],
        contradictions: [{
            issue: String
        }],
        missingEvidence: [String],
        detectedClaims: [String]
    },
    predictions: {
        likelyOpponentArguments: [String],
        prosecutionObjections: [String],
        evidenceAttacks: [String],
        proceduralObjections: [String],
        preparationRecommendations: [String]
    },
    riskScore: {
        riskLevel: String,
        confidenceScore: Number,
        vulnerabilityAnalysis: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OpponentSession', opponentSessionSchema);
