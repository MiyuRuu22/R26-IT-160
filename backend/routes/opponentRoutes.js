const express = require('express');
const { runFullAnalysis, extractInsights } = require('../controllers/opponentController');

const router = express.Router();

router.post('/analyze', runFullAnalysis);
router.post('/insights', extractInsights);

module.exports = router;
