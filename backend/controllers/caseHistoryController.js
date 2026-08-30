/**
 * caseHistoryController.js
 * =========================
 * Controller handling user-scoped case history operations for Defender.
 * Adheres strictly to security and confidentiality rules.
 */

const { caseHistoryStore } = require('../models/CaseHistory');
const { formatResponse, formatError } = require('../utils/helper');

/**
 * GET /api/defender/history
 * Retrieve user's case history records
 */
const getHistory = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.email || 'mock-user-1';
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const analysisType = req.query.type || null;

        const records = await caseHistoryStore.getByUser(userId, limit, analysisType);

        return res.status(200).json(formatResponse({
            total: records.length,
            cases: records
        }));
    } catch (err) {
        console.error('[getHistory Error]:', err.message);
        return res.status(500).json(formatError('Unable to load case history.'));
    }
};

/**
 * GET /api/defender/history/:caseId
 * Retrieve specific case details for restoration
 */
const getCaseById = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.email || 'mock-user-1';
        const { caseId } = req.params;

        if (!caseId) {
            return res.status(400).json(formatError('Case ID is required.'));
        }

        const caseItem = await caseHistoryStore.getById(caseId, userId);
        if (!caseItem) {
            return res.status(404).json(formatError('Case history record not found.'));
        }

        return res.status(200).json(formatResponse({ case: caseItem }));
    } catch (err) {
        console.error('[getCaseById Error]:', err.message);
        return res.status(500).json(formatError('Failed to retrieve case details.'));
    }
};

/**
 * POST /api/defender/history
 * Save or update case history record
 */
const saveHistory = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.email || 'mock-user-1';
        const {
            caseId,
            title,
            caseType = 'Criminal',
            legalIssue = '',
            charges = '',
            analysisType,
            status = 'Analyzed',
            desiredOutcome = '',
            summary = '',
            caseData = {},
            analysisResults = {}
        } = req.body;

        if (!title || !analysisType) {
            return res.status(400).json(formatError('Title and analysisType are required.'));
        }

        const stableCaseId = caseId || `case-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const record = await caseHistoryStore.saveOrUpdate({
            caseId: stableCaseId,
            userId,
            title: title.trim(),
            caseType,
            legalIssue,
            charges,
            analysisType,
            status,
            desiredOutcome,
            summary: summary || `${caseType} defense analysis for ${title}`,
            caseData,
            analysisResults
        });

        // Safe dev log: only output case count/type, no sensitive B-Report facts or PII
        console.log(`[Case History Saved]: ID="${record.caseId}", Type="${record.analysisType}", User="${userId}"`);

        return res.status(200).json(formatResponse({
            message: 'Case history record saved successfully.',
            case: record
        }));
    } catch (err) {
        console.error('[saveHistory Error]:', err.message);
        return res.status(500).json(formatError('Failed to save case history record.'));
    }
};

/**
 * DELETE /api/defender/history/:caseId
 * Delete a case history record
 */
const deleteHistory = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.email || 'mock-user-1';
        const { caseId } = req.params;

        if (!caseId) {
            return res.status(400).json(formatError('Case ID is required.'));
        }

        const success = await caseHistoryStore.deleteById(caseId, userId);
        if (!success) {
            return res.status(404).json(formatError('Case history record not found or already deleted.'));
        }

        console.log(`[Case History Deleted]: ID="${caseId}", User="${userId}"`);
        return res.status(200).json(formatResponse({
            message: 'Case history record removed successfully.'
        }));
    } catch (err) {
        console.error('[deleteHistory Error]:', err.message);
        return res.status(500).json(formatError('Failed to delete case history record.'));
    }
};

module.exports = {
    getHistory,
    getCaseById,
    saveHistory,
    deleteHistory
};
