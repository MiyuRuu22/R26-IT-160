const express = require('express');
const { runFullAnalysis, extractInsights } = require('../controllers/opponentController');

const { handleCaseChat, getConversationHistory } = require('../controllers/caseChatController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', runFullAnalysis);
router.post('/full-analysis', runFullAnalysis);
router.post('/insights', extractInsights);

// Adversarial Chatbot endpoints for Opponent Prediction
router.post('/chat', requireAuth, handleCaseChat);
router.post('/:caseId/chat', requireAuth, handleCaseChat);
router.get('/:caseId/conversation', requireAuth, getConversationHistory);

module.exports = router;
