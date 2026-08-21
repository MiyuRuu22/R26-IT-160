/**
 * bReportRoutes.js
 * ================
 * Express router for the B-Report Defense Analysis module.
 *
 * Routes:
 *   POST /api/b-report/analyze  — upload PDF, get full analysis
 *   GET  /api/b-report/health   — check AI engine connectivity
 */

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const axios      = require('axios');
const { analyzeBReport } = require('../controllers/bReportController');

const router = express.Router();

// ── Multer configuration ──────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'b-reports');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });  // ensure folder exists

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `b-report-${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },  // 50MB
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/b-report/analyze
 * Body: multipart/form-data with field "pdf"
 */
router.post(
    '/analyze',
    upload.single('pdf'),
    (err, req, res, next) => {
        // Multer error handler
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
        next();
    },
    analyzeBReport
);

/**
 * GET /api/b-report/health
 * Checks that the FastAPI AI engine is reachable.
 */
router.get('/health', async (_req, res) => {
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8001';
    try {
        const r = await axios.get(`${AI_ENGINE_URL}/`, { timeout: 5000 });
        res.json({ status: 'ok', ai_engine: r.data });
    } catch {
        res.status(503).json({ status: 'error', message: 'AI Engine not reachable.' });
    }
});

module.exports = router;
