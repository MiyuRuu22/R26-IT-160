const express = require('express');
const { searchCases } = require('../controllers/caseController');
const { handleCaseChat, getConversationHistory } = require('../controllers/caseChatController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Existing Search Routes (Unchanged)
router.post('/search', searchCases);
router.post('/analyze-case', searchCases);

// Case Assistant Chatbot Routes (New)
router.post('/chat', requireAuth, handleCaseChat);
router.post('/:caseId/chat', requireAuth, handleCaseChat);
router.get('/:caseId/conversation', requireAuth, getConversationHistory);

module.exports = router;

