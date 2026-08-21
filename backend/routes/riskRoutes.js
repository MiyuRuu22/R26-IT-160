const express = require('express');
const { assessRisk } = require('../controllers/riskController');

const router = express.Router();

router.get('/assess', assessRisk);

module.exports = router;
