const express = require('express');
const { getRelationships } = require('../controllers/graphController');

const router = express.Router();

router.get('/relationships', getRelationships);

module.exports = router;
