/**
 * CaseHistory.js
 * ==============
 * Model and persistence layer for Defender Case History.
 * Supports dual-mode persistence:
 *  - MongoDB / Mongoose when connected
 *  - In-memory map fallback for disconnected/development mode
 * Ensures strict user-scoping and case stability.
 */

const mongoose = require('mongoose');

// In-memory fallback map for offline / development operation
const fallbackCaseHistory = new Map();

const caseHistorySchema = new mongoose.Schema({
    caseId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    caseType: { type: String, default: 'Criminal' },
    legalIssue: { type: String, default: '' },
    charges: { type: String, default: '' },
    analysisType: { type: String, enum: ['ANALYZER', 'OPPONENT'], required: true },
    status: { type: String, enum: ['Draft', 'Analyzed', 'Re-analyzed'], default: 'Analyzed' },
    desiredOutcome: { type: String, default: '' },
    summary: { type: String, default: '' },
    caseData: { type: mongoose.Schema.Types.Mixed },
    analysisResults: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Composite index for fast user-specific chronological lookups
caseHistorySchema.index({ userId: 1, updatedAt: -1 });

const CaseHistoryModel = mongoose.models.CaseHistory || mongoose.model('CaseHistory', caseHistorySchema);

/**
 * Persistence layer supporting both MongoDB and in-memory fallback
 */
const caseHistoryStore = {
    /**
     * Retrieve chronological history for a specific user
     */
    async getByUser(userId, limit = 50, analysisType = null) {
        if (mongoose.connection.readyState === 1) {
            try {
                const query = { userId };
                if (analysisType) {
                    query.analysisType = analysisType;
                }
                const docs = await CaseHistoryModel.find(query)
                    .sort({ updatedAt: -1 })
                    .limit(Number(limit))
                    .lean();
                return docs.map(doc => ({
                    ...doc,
                    _id: doc._id?.toString(),
                    id: doc.caseId
                }));
            } catch (err) {
                console.warn('[caseHistoryStore DB getByUser Error]:', err.message);
            }
        }

        // Fallback in-memory query
        const userCases = [];
        for (const item of fallbackCaseHistory.values()) {
            if (item.userId === userId) {
                if (!analysisType || item.analysisType === analysisType) {
                    userCases.push({ ...item, id: item.caseId });
                }
            }
        }

        userCases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return userCases.slice(0, Number(limit));
    },

    /**
     * Retrieve single case by caseId and userId
     */
    async getById(caseId, userId) {
        if (mongoose.connection.readyState === 1) {
            try {
                const doc = await CaseHistoryModel.findOne({ caseId, userId }).lean();
                if (doc) return { ...doc, _id: doc._id?.toString(), id: doc.caseId };
            } catch (err) {
                console.warn('[caseHistoryStore DB getById Error]:', err.message);
            }
        }

        const key = `${userId}_${caseId}`;
        return fallbackCaseHistory.get(key) || null;
    },

    /**
     * Save or update case history record (prevents duplicates via stable caseId)
     */
    async saveOrUpdate(record) {
        const now = new Date();
        const caseId = record.caseId || `case-${Date.now()}`;
        const userId = record.userId || 'mock-user-1';
        const key = `${userId}_${caseId}`;

        const payload = {
            ...record,
            caseId,
            userId,
            updatedAt: now,
            createdAt: record.createdAt || now
        };

        if (mongoose.connection.readyState === 1) {
            try {
                const updated = await CaseHistoryModel.findOneAndUpdate(
                    { caseId, userId },
                    { $set: payload },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                ).lean();
                return { ...updated, _id: updated._id?.toString(), id: updated.caseId };
            } catch (err) {
                console.warn('[caseHistoryStore DB saveOrUpdate Error]:', err.message);
            }
        }

        // Fallback in-memory save
        const existing = fallbackCaseHistory.get(key);
        if (existing) {
            payload.createdAt = existing.createdAt;
        }
        fallbackCaseHistory.set(key, payload);
        return { ...payload, id: caseId };
    },

    /**
     * Delete case history record (user-scoped)
     */
    async deleteById(caseId, userId) {
        if (mongoose.connection.readyState === 1) {
            try {
                const res = await CaseHistoryModel.deleteOne({ caseId, userId });
                return res.deletedCount > 0;
            } catch (err) {
                console.warn('[caseHistoryStore DB deleteById Error]:', err.message);
            }
        }

        const key = `${userId}_${caseId}`;
        return fallbackCaseHistory.delete(key);
    }
};

module.exports = {
    CaseHistoryModel,
    caseHistoryStore
};
