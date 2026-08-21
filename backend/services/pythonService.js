const dotenv = require('dotenv');

dotenv.config();

/**
 * Service to communicate with the FastAPI AI Engine
 * @param {string} query - The legal case description
 * @param {object} filters - Optional filters {case_type, outcome, year}
 * @returns {Promise<Object>} - Resolves to the AI engine response
 */
const queryAIEngine = async (query, filters = {}) => {
    try {
        let aiUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';
        if (!aiUrl.endsWith('/search')) {
            aiUrl = `${aiUrl.replace(/\/+$/, '')}/search`;
        }
        
        console.log(`[AI Service]: Sending request to ${aiUrl}`);

        const response = await fetch(aiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                case_type: filters.case_type,
                outcome: filters.outcome,
                year: filters.year
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Engine Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;

    } catch (err) {
        console.error(`[AI Service Error]:`, err.message);
        throw err;
    }
};

module.exports = { queryAIEngine };
