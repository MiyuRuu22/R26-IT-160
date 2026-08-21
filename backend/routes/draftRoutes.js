const express = require('express');
const { generateDraft } = require('../controllers/draftController');

const router = express.Router();

router.post('/generate', generateDraft);

module.exports = router;
