const { formatResponse } = require('../utils/helper');

const generateDraft = async (req, res) => {
    try {
        const { context } = req.body;
        // Mock AI draft generation
        const suggestion = "Furthermore, the defendant's actions demonstrate a clear violation of standard fiduciary duties under section 4B. The financial records corroborate this breach of trust.";
        res.status(200).json(formatResponse({ suggestion }));
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error generating draft' });
    }
};

module.exports = { generateDraft };
