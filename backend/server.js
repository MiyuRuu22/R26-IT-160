const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const caseRoutes = require('./routes/caseRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const draftRoutes = require('./routes/draftRoutes');
const graphRoutes = require('./routes/graphRoutes');
const riskRoutes = require('./routes/riskRoutes');
const bReportRoutes = require('./routes/bReportRoutes');
const opponentRoutes = require('./routes/opponentRoutes');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cases', caseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/b-report', bReportRoutes);
app.use('/api/opponent', opponentRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Smart Lawyer Backend is running!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Smart Lawyer Backend running on port ${PORT}`);
    console.log(`🧠 AI Engine linked for Semantic Search`);
    console.log(`========================================\n`);
});
