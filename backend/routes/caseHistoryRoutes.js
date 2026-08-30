/**
 * caseHistoryRoutes.js
 * ====================
 * Express router for Defender Case History endpoints.
 */

const express = require('express');
const {
    getHistory,
    getCaseById,
    saveHistory,
    deleteHistory
} = require('../controllers/caseHistoryController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getHistory);
router.post('/', requireAuth, saveHistory);
router.get('/:caseId', requireAuth, getCaseById);
router.delete('/:caseId', requireAuth, deleteHistory);

module.exports = router;
