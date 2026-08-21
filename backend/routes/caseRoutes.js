const express = require('express');
const { searchCases } = require('../controllers/caseController');
const router = express.Router();

// @route   POST /api/cases/search
// @desc    Search similar legal cases via Python FAISS AI Engine
router.post('/search', searchCases);

// Support for existing frontend without breaking it
router.post('/analyze-case', searchCases);

module.exports = router;
