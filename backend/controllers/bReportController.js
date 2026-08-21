/**
 * bReportController.js
 * ====================
 * Handles B-Report PDF upload and proxies it to the FastAPI AI engine.
 * Returns the full structured legal analysis to the frontend.
 */

const FormData = require('form-data');
const fs       = require('fs');
const axios    = require('axios');
const path     = require('path');

// AI Engine base URL — defaults to localhost:8001 (b_report_analysis.py)
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8001';

/**
 * POST /api/b-report/analyze
 * Accepts a PDF via multipart/form-data (field name: "pdf"),
 * forwards it to the Python AI engine, and returns analysis JSON.
 */
const analyzeBReport = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No PDF file uploaded. Use field name "pdf".' });
    }

    const tmpPath = req.file.path;

    try {
        console.log(`[B-Report] Received: ${req.file.originalname} (${req.file.size} bytes)`);

        // Build multipart form to forward to FastAPI
        const form = new FormData();
        form.append('file', fs.createReadStream(tmpPath), {
            filename:    req.file.originalname,
            contentType: 'application/pdf',
        });

        const response = await axios.post(
            `${AI_ENGINE_URL}/analyze-b-report`,
            form,
            {
                headers: { ...form.getHeaders() },
                timeout: 120000,  // 2 min — OCR can be slow
                maxContentLength: Infinity,
                maxBodyLength:    Infinity,
            }
        );

        console.log(`[B-Report] Analysis complete: risk=${response.data.risk_level}`);
        return res.status(200).json({ status: 'success', data: response.data });

    } catch (err) {
        if (err.response) {
            // FastAPI returned an error
            console.error('[B-Report] AI Engine error:', err.response.data);
            return res.status(err.response.status).json({
                status:  'error',
                message: err.response.data?.detail || 'AI Engine processing failed.',
            });
        } else if (err.code === 'ECONNREFUSED') {
            console.error('[B-Report] AI Engine not reachable at', AI_ENGINE_URL);
            return res.status(503).json({
                status:  'error',
                message: `AI Engine is not running. Start it with: py -m uvicorn b_report_analysis:app --port 8001`,
            });
        }
        console.error('[B-Report] Unexpected error:', err.message);
        return res.status(500).json({ status: 'error', message: 'Internal server error during B-Report analysis.' });

    } finally {
        // Always clean up the temporary upload file
        fs.unlink(tmpPath, (unlinkErr) => {
            if (unlinkErr) console.warn('[B-Report] Could not delete temp file:', unlinkErr.message);
        });
    }
};

module.exports = { analyzeBReport };
